import { useStore } from '@/hooks/useStore';
import { getAccountDisplayInfo, isBalanceSwapped } from '@/utils/balance-swap-utils';

/**
 * Hook to get account display information considering balance swap state
 */
export const useAccountDisplay = (loginId?: string) => {
    const { client } = useStore();
    
    const currentLoginId = loginId || client?.loginid;
    const accountData = currentLoginId ? client?.accounts?.[currentLoginId] : null;
    
    if (!accountData || !currentLoginId) {
        return {
            balance: '0',
            flag: 'demo',
            isSwapped: false,
            currency: 'USD',
            isVirtual: false
        };
    }
    
    // Pass all_accounts_balance to get live demo balance for mirroring
    const displayInfo = getAccountDisplayInfo(currentLoginId, accountData, client?.all_accounts_balance);
    
    return {
        balance: displayInfo.balance,
        flag: displayInfo.flag,
        isSwapped: displayInfo.isSwapped,
        currency: accountData.currency || 'USD',
        isVirtual: Boolean(accountData.is_virtual),
        originalBalance: displayInfo.originalBalance
    };
};

/**
 * Hook to check if balances are currently swapped
 */
export const useBalanceSwapState = () => {
    return {
        isSwapped: isBalanceSwapped()
    };
};

