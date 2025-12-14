import { useMemo } from 'react';
import { CurrencyIcon } from '@/components/currency/currency-icon';
import { addComma, getDecimalPlaces } from '@/components/shared';
import { useApiBase } from '@/hooks/useApiBase';
import { getAccountDisplayInfo, getBalanceSwapState } from '@/utils/balance-swap-utils';
import { Balance } from '@deriv/api-types';
import { localize } from '@deriv-com/translations';

/** A custom hook that returns the account object for the current active account. */
const useActiveAccount = ({ allBalanceData }: { allBalanceData: Balance | null }) => {
    const { accountList, activeLoginid } = useApiBase();

    const activeAccount = useMemo(
        () => accountList?.find(account => account.loginid === activeLoginid),
        [activeLoginid, accountList]
    );

    const currentBalanceData = allBalanceData?.accounts?.[activeAccount?.loginid ?? ''];

    const modifiedAccount = useMemo(() => {
        if (!activeAccount) return undefined;
        
        // Get balance from allBalanceData (most accurate source)
        const originalBalanceNum = currentBalanceData?.balance ?? 0;
        const originalBalance = originalBalanceNum.toString();
        
        // Create account data object with balance for getAccountDisplayInfo
        const accountDataWithBalance = {
            ...activeAccount,
            balance: originalBalance,
            is_virtual: activeAccount.is_virtual
        };
        
        // Get swapped/mirrored balance if swap is active
        // Pass allBalanceData to get live demo balance for mirroring
        const accountDisplay = getAccountDisplayInfo(activeAccount.loginid, accountDataWithBalance, allBalanceData);
        
        // Get the display balance - if swapped, use swapped balance, otherwise use original
        let displayBalance: number;
        if (accountDisplay.isSwapped && accountDisplay.balance) {
            // Balance is swapped - convert from string to number
            displayBalance = typeof accountDisplay.balance === 'string' 
                ? parseFloat(accountDisplay.balance) || 0
                : (accountDisplay.balance || 0);
        } else {
            // No swap - use original balance from allBalanceData
            displayBalance = originalBalanceNum;
        }
        
        // Check if mirror mode is active - if so, always show real account flag even when viewing demo
        // Only apply if admin has enabled it
        const adminMirrorModeEnabled = typeof window !== 'undefined' && localStorage.getItem('adminMirrorModeEnabled') === 'true';
        const swapState = getBalanceSwapState();
        const isMirrorModeActive = adminMirrorModeEnabled && swapState?.isSwapped && swapState?.isMirrorMode;
        const isViewingDemo = Boolean(activeAccount?.is_virtual);
        
        // In mirror mode, if viewing demo account, show real account flag (US flag) but keep demo balance
        const displayIsVirtual = isMirrorModeActive && isViewingDemo 
            ? false // Show real flag (US flag) even when viewing demo
            : Boolean(activeAccount?.is_virtual);
        
        // Get the real account currency for the flag if in mirror mode
        let displayCurrency = activeAccount?.currency?.toLowerCase();
        if (isMirrorModeActive && isViewingDemo && swapState?.realAccount?.loginId) {
            // Find the real account to get its currency for the flag
            const realAccount = accountList?.find(acc => acc.loginid === swapState.realAccount.loginId);
            if (realAccount) {
                displayCurrency = realAccount.currency?.toLowerCase();
            }
        }
        
        return {
            ...activeAccount,
            balance:
                addComma(displayBalance?.toFixed(getDecimalPlaces(currentBalanceData?.currency || 'USD'))) ??
                '0',
            currencyLabel: displayIsVirtual ? localize('Demo') : activeAccount?.currency,
            icon: (
                <CurrencyIcon
                    currency={displayCurrency}
                    isVirtual={displayIsVirtual}
                />
            ),
            isVirtual: displayIsVirtual,
            isActive: activeAccount?.loginid === activeLoginid,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAccount, activeLoginid, allBalanceData, accountList]);

    return {
        /** User's current active account. */
        data: modifiedAccount,
    };
};

export default useActiveAccount;
