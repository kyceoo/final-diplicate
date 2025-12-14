/**
 * Utility functions for handling balance swapping and visual flags
 */

export interface SwapState {
    isSwapped: boolean;
    isMirrorMode: boolean; // New: Mirror mode where real shows demo balance
    demoAccount: {
        loginId: string;
        originalBalance: string;
        swappedBalance: string;
        flag: string;
    };
    realAccount: {
        loginId: string;
        originalBalance: string;
        swappedBalance: string;
        flag: string;
    };
    swapTimestamp: number;
}

/**
 * Get the current balance swap state from localStorage
 */
export const getBalanceSwapState = (): SwapState | null => {
    try {
        const swapState = localStorage.getItem('balanceSwapState');
        return swapState ? JSON.parse(swapState) : null;
    } catch (error) {
        console.error('Error reading balance swap state:', error);
        return null;
    }
};

/**
 * Check if balances are currently swapped
 */
export const isBalanceSwapped = (): boolean => {
    const swapState = getBalanceSwapState();
    return swapState?.isSwapped || false;
};

/**
 * Get the display balance for an account (considering swap state)
 */
export const getDisplayBalance = (loginId: string, originalBalance: string): string => {
    const swapState = getBalanceSwapState();
    
    if (!swapState?.isSwapped) {
        return originalBalance;
    }
    
    // Check if this account is involved in the swap
    if (loginId === swapState.demoAccount.loginId) {
        return swapState.demoAccount.swappedBalance;
    } else if (loginId === swapState.realAccount.loginId) {
        return swapState.realAccount.swappedBalance;
    }
    
    return originalBalance;
};

/**
 * Get the display flag for an account (considering swap state)
 */
export const getDisplayFlag = (loginId: string, originalFlag: string): string => {
    const swapState = getBalanceSwapState();
    
    if (!swapState?.isSwapped) {
        return originalFlag;
    }
    
    // Check if this account is involved in the swap
    if (loginId === swapState.demoAccount.loginId) {
        return swapState.demoAccount.flag; // Keep original flag (demo) - flags don't shift
    } else if (loginId === swapState.realAccount.loginId) {
        return swapState.realAccount.flag; // Keep original flag (real) - flags don't shift
    }
    
    return originalFlag;
};

/**
 * Get account display info with swapped/mirrored values
 * @param loginId - The account login ID
 * @param accountData - The account data object (should include balance)
 * @param allAccountsBalance - Optional: All accounts balance object to get live demo balance for mirroring
 */
export const getAccountDisplayInfo = (loginId: string, accountData: any, allAccountsBalance?: any) => {
    const swapState = getBalanceSwapState();
    
    // Only apply mirror/swap if admin has enabled it
    const adminMirrorModeEnabled = typeof window !== 'undefined' && localStorage.getItem('adminMirrorModeEnabled') === 'true';
    
    if (!swapState?.isSwapped || !adminMirrorModeEnabled) {
        return {
            balance: accountData.balance,
            flag: accountData.is_virtual ? 'demo' : 'real',
            isSwapped: false,
            isMirrorMode: false
        };
    }
    
    // Mirror mode: Real account shows demo balance, demo shows its own balance
    if (swapState.isMirrorMode) {
        if (loginId === swapState.demoAccount.loginId) {
            // Demo account shows its own balance
            return {
                balance: accountData.balance, // Demo shows its own balance
                flag: 'demo',
                isSwapped: true,
                isMirrorMode: true,
                originalBalance: swapState.demoAccount.originalBalance,
                isVirtual: true
            };
        } else if (loginId === swapState.realAccount.loginId) {
            // Real account mirrors demo balance
            // Get LIVE demo balance from allAccountsBalance if available, otherwise use stored
            let demoBalance = swapState.demoAccount.originalBalance || accountData.balance;
            if (allAccountsBalance?.accounts?.[swapState.demoAccount.loginId]?.balance !== undefined) {
                // Use live demo balance from all_accounts_balance
                demoBalance = allAccountsBalance.accounts[swapState.demoAccount.loginId].balance.toString();
            } else if (swapState.demoAccount.swappedBalance) {
                // Use stored demo balance from swap state
                demoBalance = swapState.demoAccount.swappedBalance;
            }
            return {
                balance: demoBalance, // Real mirrors demo balance
                flag: 'real', // Keep real flag
                isSwapped: true,
                isMirrorMode: true,
                originalBalance: swapState.realAccount.originalBalance,
                isVirtual: false
            };
        }
    }
    
    // Legacy swap mode (for backward compatibility)
    if (loginId === swapState.demoAccount.loginId) {
        return {
            balance: swapState.demoAccount.swappedBalance,
            flag: 'demo',
            isSwapped: true,
            isMirrorMode: false,
            originalBalance: swapState.demoAccount.originalBalance,
            isVirtual: true
        };
    } else if (loginId === swapState.realAccount.loginId) {
        return {
            balance: swapState.realAccount.swappedBalance,
            flag: 'real',
            isSwapped: true,
            isMirrorMode: false,
            originalBalance: swapState.realAccount.originalBalance,
            isVirtual: false
        };
    }
    
    return {
        balance: accountData.balance,
        flag: accountData.is_virtual ? 'demo' : 'real',
        isSwapped: false,
        isMirrorMode: false
    };
};

/**
 * Reset balance swap state
 */
export const resetBalanceSwap = () => {
    try {
        localStorage.removeItem('balanceSwapState');
        
        // Reset client accounts to original state
        const clientAccounts = JSON.parse(localStorage.getItem('clientAccounts') || '{}');
        const resetAccounts = { ...clientAccounts };
        
        // Remove swap metadata
        Object.keys(resetAccounts).forEach(loginId => {
            if (resetAccounts[loginId]._is_swapped) {
                delete resetAccounts[loginId]._swapped_balance;
                delete resetAccounts[loginId]._original_flag;
                delete resetAccounts[loginId]._display_flag;
                delete resetAccounts[loginId]._is_swapped;
            }
        });
        
        localStorage.setItem('clientAccounts', JSON.stringify(resetAccounts));
        console.log('Balance swap state reset');
    } catch (error) {
        console.error('Error resetting balance swap:', error);
    }
};

/**
 * Transform transaction ID for admin mirror mode
 * Demo transaction IDs start with 5, real ones start with 1
 * In admin mode, convert demo IDs (5xxxx) to real format (1xxxx)
 * @param transactionId - The transaction ID to transform
 * @param isDemo - Whether this is from a demo account
 * @returns Transformed transaction ID
 */
export const transformTransactionIdForAdmin = (transactionId: number | string | undefined, isDemo: boolean): number | undefined => {
    if (!transactionId) return undefined;
    
    const adminMirrorModeEnabled = typeof window !== 'undefined' && localStorage.getItem('adminMirrorModeEnabled') === 'true';
    if (!adminMirrorModeEnabled || !isDemo) {
        return typeof transactionId === 'string' ? parseInt(transactionId) : transactionId;
    }
    
    const swapState = getBalanceSwapState();
    if (!swapState?.isSwapped || !swapState?.isMirrorMode) {
        return typeof transactionId === 'string' ? parseInt(transactionId) : transactionId;
    }
    
    // Convert transaction ID to string to check first digit
    const idStr = transactionId.toString();
    
    // If transaction ID starts with 5 (demo), convert to start with 1 (real)
    if (idStr.startsWith('5')) {
        const transformedId = '1' + idStr.substring(1);
        return parseInt(transformedId);
    }
    
    // If it already starts with 1 or other digit, return as is
    return typeof transactionId === 'string' ? parseInt(transactionId) : transactionId;
};
