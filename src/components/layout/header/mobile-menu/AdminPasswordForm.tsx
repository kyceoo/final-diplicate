import React, { useState } from 'react';
import { useTranslations } from '@deriv-com/translations';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { useApiBase } from '@/hooks/useApiBase';

type TAdminPasswordForm = {
    onSuccess: () => void;
    onCancel: () => void;
};

const AdminPasswordForm = observer(({ onSuccess, onCancel }: TAdminPasswordForm) => {
    const { localize } = useTranslations();
    const store = useStore();
    const client = store?.client;
    const { accountList } = useApiBase();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Don't render if store is not available
    if (!store || !client) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        if (password === 'admin123') {
            // Password is correct, proceed with balance swap
            swapBalances();
            onSuccess();
            setPassword('');
        } else {
            setError('Incorrect password. Please try again.');
        }
        
        setIsLoading(false);
    };

    const swapBalances = () => {
        try {
            // Get current accounts from localStorage
            const clientAccounts = JSON.parse(localStorage.getItem('clientAccounts') || '{}');
            const accountsList = JSON.parse(localStorage.getItem('accountsList') || '{}');
            
            // Find demo and real accounts
            const demoAccount = Object.entries(clientAccounts).find(([loginid]) => loginid.startsWith('VR'));
            const realAccounts = Object.entries(clientAccounts).filter(([loginid]) => !loginid.startsWith('VR'));
            
            // Log all real accounts for debugging
            console.log('All real accounts:', realAccounts.map(([loginid]) => {
                const apiAccount = accountList?.find(acc => acc.loginid === loginid);
                const account = clientAccounts[loginid];
                const balanceData = client?.all_accounts_balance?.accounts?.[loginid];
                return {
                    loginid,
                    currency: apiAccount?.currency || account?.currency || balanceData?.currency,
                    currency_type: apiAccount?.currency_type || account?.currency_type,
                    account_category: apiAccount?.account_category || account?.account_category
                };
            }));
            
            // Find US Dollar account specifically (currency === 'USD' and NOT crypto like 'USDC')
            // Also exclude wallet accounts (account_category === 'wallet')
            // Priority: Find account with currency 'USD' that is NOT 'USDC'
            const usdAccount = realAccounts.find(([loginid, accountData]) => {
                // Get currency from multiple sources
                const apiAccount = accountList?.find(acc => acc.loginid === loginid);
                const account = clientAccounts[loginid];
                const balanceData = client?.all_accounts_balance?.accounts?.[loginid];
                
                // Get currency (prioritize API account, then clientAccounts, then balanceData)
                const currency = apiAccount?.currency || account?.currency || balanceData?.currency;
                const currencyType = apiAccount?.currency_type || account?.currency_type;
                const accountCategory = apiAccount?.account_category || account?.account_category;
                
                // CRITICAL: Must be exactly 'USD' (fiat), NOT 'USDC'
                // Exclude if currency is 'USDC' or any crypto
                if (currency === 'USDC' || currency === 'USDT' || currency === 'eUSDT' || currency === 'tUSDT') {
                    return false; // Explicitly exclude crypto
                }
                
                // Must be exactly 'USD' (fiat)
                // Exclude wallet accounts and crypto
                if (currency === 'USD' && 
                    currencyType !== 'crypto' && 
                    accountCategory !== 'wallet') {
                    console.log('✅ Found USD account:', loginid, 'Currency:', currency, 'Type:', currencyType, 'Category:', accountCategory);
                    return true;
                }
                
                return false;
            });
            
            // If no USD account found, try to find by excluding USDC and wallets explicitly
            let targetRealAccount = usdAccount;
            if (!targetRealAccount) {
                // Find first account that is NOT USDC and NOT a wallet
                targetRealAccount = realAccounts.find(([loginid, accountData]) => {
                    const apiAccount = accountList?.find(acc => acc.loginid === loginid);
                    const account = clientAccounts[loginid];
                    const balanceData = client?.all_accounts_balance?.accounts?.[loginid];
                    const currency = apiAccount?.currency || account?.currency || balanceData?.currency;
                    const accountCategory = apiAccount?.account_category || account?.account_category;
                    // Exclude USDC, other crypto, and wallet accounts
                    return currency !== 'USDC' && 
                           currency !== 'USDT' && 
                           currency !== 'eUSDT' && 
                           currency !== 'tUSDT' &&
                           currency !== 'BTC' && 
                           currency !== 'ETH' &&
                           accountCategory !== 'wallet';
                }) || realAccounts[0];
            }
            
            const targetApiAccount = accountList?.find(acc => acc.loginid === targetRealAccount?.[0]);
            console.log('🎯 Target real account for swap:', targetRealAccount?.[0], 
                       'Currency:', targetApiAccount?.currency,
                       'Currency Type:', targetApiAccount?.currency_type,
                       'Account Category:', targetApiAccount?.account_category);
            
            // Final validation - make sure we're not swapping with USDC
            if (targetApiAccount?.currency === 'USDC') {
                console.error('❌ ERROR: Selected account is USDC, not USD! Trying to find USD account...');
                // Try to find any account with USD that's not USDC
                const fallbackUsd = realAccounts.find(([loginid]) => {
                    const acc = accountList?.find(a => a.loginid === loginid);
                    return acc?.currency === 'USD' && acc?.currency !== 'USDC';
                });
                if (fallbackUsd) {
                    targetRealAccount = fallbackUsd;
                    console.log('✅ Found fallback USD account:', fallbackUsd[0]);
                }
            }
            
            if (demoAccount && targetRealAccount) {
                const [demoLoginId, demoAccountData] = demoAccount;
                const [realLoginId, realAccountData] = targetRealAccount;
                
                // Get current balances from all_accounts_balance (most accurate source)
                const demoBalanceData = client?.all_accounts_balance?.accounts?.[demoLoginId];
                const realBalanceData = client?.all_accounts_balance?.accounts?.[realLoginId];
                
                // Store original balances - convert to string for consistency
                const originalDemoBalance = demoBalanceData?.balance?.toString() || demoAccountData.balance?.toString() || '0';
                const originalRealBalance = realBalanceData?.balance?.toString() || realAccountData.balance?.toString() || '0';
                
                // Create swapped accounts - DEMO gets REAL balance, REAL gets DEMO balance
                const swappedClientAccounts = {
                    ...clientAccounts,
                    [demoLoginId]: {
                        ...demoAccountData,
                        balance: originalRealBalance, // Demo account gets real balance
                    },
                    [realLoginId]: {
                        ...realAccountData,
                        balance: originalDemoBalance, // Real account gets demo balance
                    }
                };
                
                // Update localStorage with swapped accounts
                localStorage.setItem('clientAccounts', JSON.stringify(swappedClientAccounts));
                
                // Store mirror state for UI updates
                // In mirror mode: Real account shows demo balance, demo shows its own balance
                localStorage.setItem('balanceSwapState', JSON.stringify({
                    isSwapped: true,
                    isMirrorMode: true, // Enable mirror mode
                    demoAccount: {
                        loginId: demoLoginId,
                        originalBalance: originalDemoBalance,
                        swappedBalance: originalDemoBalance, // Demo shows its own balance
                        flag: 'demo'
                    },
                    realAccount: {
                        loginId: realLoginId,
                        originalBalance: originalRealBalance,
                        swappedBalance: originalDemoBalance, // Real mirrors demo balance
                        flag: 'real'
                    },
                    swapTimestamp: Date.now()
                }));
                
                // Store admin login flag so mirror mode activates automatically on next login
                localStorage.setItem('adminMirrorModeEnabled', 'true');
                
                // Update client store if needed
                if (client && client.loginid === demoLoginId) {
                    client.setBalance(originalRealBalance);
                } else if (client && client.loginid === realLoginId) {
                    client.setBalance(originalDemoBalance);
                }
                
                // Update all_accounts_balance in client store - SWAP the balances
                if (client && client.all_accounts_balance?.accounts) {
                    // Convert balances to numbers for all_accounts_balance
                    const realBalanceNum = parseFloat(originalRealBalance) || 0;
                    const demoBalanceNum = parseFloat(originalDemoBalance) || 0;
                    
                    const updatedAllAccountsBalance = {
                        ...client.all_accounts_balance,
                        accounts: {
                            ...client.all_accounts_balance.accounts,
                            [demoLoginId]: {
                                ...client.all_accounts_balance.accounts[demoLoginId],
                                balance: realBalanceNum // Demo gets real balance (as number)
                            },
                            [realLoginId]: {
                                ...client.all_accounts_balance.accounts[realLoginId],
                                balance: demoBalanceNum // Real gets demo balance (as number)
                            }
                        }
                    };
                    client.setAllAccountsBalance(updatedAllAccountsBalance);
                }
                
                console.log('Balances swapped with visual flags!');
                console.log(`Demo account (${demoLoginId}): Shows ${originalRealBalance} with demo flag`);
                console.log(`Real account (${realLoginId}): Shows ${originalDemoBalance} with real flag`);
                
                // Trigger a page refresh to update all UI components
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('Error swapping balances:', error);
        }
    };

    return (
        <div className="mobile-menu__admin-form">
            <div className="mobile-menu__admin-form__header">
                <h3>{localize('Admin Access')}</h3>
                <button 
                    className="mobile-menu__admin-form__close"
                    onClick={onCancel}
                    type="button"
                >
                    ×
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="mobile-menu__admin-form__content">
                <div className="mobile-menu__admin-form__field">
                    <label htmlFor="admin-password" className="mobile-menu__admin-form__label">
                        {localize('Enter Admin Password')}
                    </label>
                    <input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={localize('Password')}
                        className="mobile-menu__admin-form__input"
                        autoFocus
                    />
                    {error && (
                        <div className="mobile-menu__admin-form__error">
                            {error}
                        </div>
                    )}
                </div>
                
                <div className="mobile-menu__admin-form__buttons">
                    <button
                        type="button"
                        className="mobile-menu__admin-form__button mobile-menu__admin-form__button--secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {localize('Cancel')}
                    </button>
                    <button
                        type="submit"
                        className="mobile-menu__admin-form__button mobile-menu__admin-form__button--primary"
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading ? localize('Verifying...') : localize('Submit')}
                    </button>
                </div>
            </form>
        </div>
    );
});

export default AdminPasswordForm;
