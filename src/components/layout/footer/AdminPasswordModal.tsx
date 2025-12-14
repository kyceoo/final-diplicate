import React, { useState } from 'react';
import { useTranslations } from '@deriv-com/translations';
import { Modal, Button, Input } from '@deriv-com/ui';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import './admin-password-modal.scss';

type TAdminPasswordModal = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

const AdminPasswordModal = observer(({ isOpen, onClose, onSuccess }: TAdminPasswordModal) => {
    const { localize } = useTranslations();
    const store = useStore();
    const client = store?.client;
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
            onClose();
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
            
            if (demoAccount && realAccounts.length > 0) {
                const [demoLoginId, demoAccountData] = demoAccount;
                const [realLoginId, realAccountData] = realAccounts[0]; // Use first real account
                
                // Store original balances
                const originalDemoBalance = demoAccountData.balance;
                const originalRealBalance = realAccountData.balance;
                
                // Swap the balances
                const updatedClientAccounts = {
                    ...clientAccounts,
                    [demoLoginId]: {
                        ...demoAccountData,
                        balance: originalRealBalance
                    },
                    [realLoginId]: {
                        ...realAccountData,
                        balance: originalDemoBalance
                    }
                };
                
                // Update localStorage
                localStorage.setItem('clientAccounts', JSON.stringify(updatedClientAccounts));
                
                // Update client store if needed
                if (client && client.loginid === demoLoginId) {
                    client.setBalance(originalRealBalance);
                } else if (client && client.loginid === realLoginId) {
                    client.setBalance(originalDemoBalance);
                }
                
                console.log('Balances swapped successfully!');
                console.log(`Demo balance: ${originalDemoBalance} -> ${originalRealBalance}`);
                console.log(`Real balance: ${originalRealBalance} -> ${originalDemoBalance}`);
            }
        } catch (error) {
            console.error('Error swapping balances:', error);
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={localize('Admin Access')}
            className="admin-password-modal"
        >
            <Modal.Body>
                <form onSubmit={handleSubmit} className="admin-password-form">
                    <div className="admin-password-form__field">
                        <label htmlFor="admin-password" className="admin-password-form__label">
                            {localize('Enter Admin Password')}
                        </label>
                        <Input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={localize('Password')}
                            className="admin-password-form__input"
                            autoFocus
                        />
                        {error && (
                            <div className="admin-password-form__error">
                                {error}
                            </div>
                        )}
                    </div>
                </form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isLoading}
                >
                    {localize('Cancel')}
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isLoading || !password.trim()}
                >
                    {isLoading ? localize('Verifying...') : localize('Submit')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

export default AdminPasswordModal;
