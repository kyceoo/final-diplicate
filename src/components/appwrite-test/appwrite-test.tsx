import React, { useState, useEffect } from 'react';
import { Account } from 'appwrite';
import client from '@/utils/appwrite';
import './appwrite-test.scss';

const AppwriteTest: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');

    const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
    const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '6937a1ac00182dcb68fb';

    // Automatically ping on component mount to help Appwrite detect the connection
    useEffect(() => {
        const autoPing = async () => {
            try {
                const account = new Account(client);
                // This will fail with 401 (not authenticated), but it confirms the connection
                await account.get();
            } catch (error: any) {
                // 401 is expected - it means server is reachable
                if (error.code === 401) {
                    console.log('Appwrite connection verified - server is reachable');
                }
            }
        };
        autoPing();
    }, []);

    const handlePing = async () => {
        setStatus('loading');
        setMessage('Sending ping...');

        try {
            const account = new Account(client);
            
            // Try to get account (will fail with 401 if not authenticated, but confirms connection)
            try {
                await account.get();
                setStatus('success');
                setMessage('✅ Connection successful! You are authenticated with Appwrite.');
            } catch (authError: any) {
                // 401 means server is reachable but authentication is required (this is expected)
                if (authError.code === 401) {
                    setStatus('success');
                    setMessage('✅ Connection successful! Appwrite server is reachable and responding. (Authentication required for full access)');
                } else {
                    throw authError;
                }
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(`❌ Connection failed: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="appwrite-test">
            <div className="appwrite-test__card">
                <h2 className="appwrite-test__title">Appwrite Connection Test</h2>
                <p className="appwrite-test__info">
                    Project ID: {projectId}
                </p>
                <p className="appwrite-test__info">
                    Endpoint: {endpoint}
                </p>
                <button 
                    className="appwrite-test__button"
                    onClick={handlePing}
                    disabled={status === 'loading'}
                >
                    {status === 'loading' ? 'Sending ping...' : 'Send a ping'}
                </button>
                {message && (
                    <div className={`appwrite-test__message appwrite-test__message--${status}`}>
                        {message}
                    </div>
                )}
                {status === 'success' && (
                    <div className="appwrite-test__note">
                        <p><strong>✅ Connection is working!</strong> If Appwrite console still shows "Waiting for connection...":</p>
                        <ol>
                            <li><strong>Click "Skip, go to dashboard"</strong> - The connection is working, the console detection can be delayed</li>
                            <li><strong>Check your app's origin:</strong> Go to Appwrite Console → Settings → Domains → Add your domain (e.g., <code>localhost:3000</code> or your production domain)</li>
                            <li><strong>Refresh the Appwrite console page</strong> after adding the domain</li>
                            <li>The API calls are being made (check browser Network tab) - Appwrite console should detect them</li>
                        </ol>
                        <p style={{ marginTop: '1rem', padding: '0.75rem', background: '#e7f3ff', borderRadius: '4px' }}>
                            <strong>💡 Tip:</strong> The "Waiting for connection..." message is just a UI indicator. Your app is already connected and making API calls successfully!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppwriteTest;

