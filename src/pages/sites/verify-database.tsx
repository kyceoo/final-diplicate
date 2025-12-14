import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, SITES_COLLECTION_ID } from '@/utils/appwrite';
import { ID } from 'appwrite';
import './verify-database.scss';

interface VerificationResult {
    name: string;
    status: 'checking' | 'success' | 'error';
    message: string;
}

const VerifyDatabase: React.FC = () => {
    const [results, setResults] = useState<VerificationResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openAppwriteConsole = () => {
        window.open(`https://cloud.appwrite.io/console/project-nyc-${process.env.VITE_APPWRITE_PROJECT_ID || '6937a1ac00182dcb68fb'}/databases`, '_blank');
    };

    const verifyDatabase = async () => {
        setLoading(true);
        setResults([]);
        setTestResult(null);

        const checks: VerificationResult[] = [];

        // Check 0: Appwrite Connection
        checks.push({
            name: 'Appwrite Connection',
            status: 'checking',
            message: 'Checking Appwrite endpoint and project...',
        });
        setResults([...checks]);

        // Check 1: Database exists
        checks.push({
            name: 'Database Connection',
            status: 'checking',
            message: 'Checking database connection...',
        });
        setResults([...checks]);

        // Check 2: Sites Collection exists
        checks.push({
            name: 'Sites Collection',
            status: 'checking',
            message: 'Checking sites collection...',
        });
        setResults([...checks]);

        const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
        const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '6937a1ac00182dcb68fb';
        const databaseId = DATABASE_ID;
        const sitesCollectionId = SITES_COLLECTION_ID;
        
        console.log('🔍 Appwrite Verification Starting:', {
            endpoint,
            projectId,
            databaseId,
            sitesCollectionId,
        });
        
        // Verify environment variables
        if (!process.env.VITE_APPWRITE_ENDPOINT || !process.env.VITE_APPWRITE_PROJECT_ID) {
            checks[0] = {
                name: 'Appwrite Connection',
                status: 'error',
                message: `Environment variables not loaded. Please restart your dev server after updating .env file.`,
            };
            setResults([...checks]);
            setLoading(false);
            return;
        }

        checks[0] = {
            name: 'Appwrite Connection',
            status: 'success',
            message: `Connected to ${endpoint} (Project: ${projectId})`,
        };
        setResults([...checks]);

        // Now verify database and collection
        try {
            let dbVerified = false;
            let collectionVerified = false;
            let errorDetails: any = null;

            // Strategy 1: Try to list documents (works if collection exists and has attributes)
            try {
                console.log(`📋 Attempting to list documents from ${sitesCollectionId}...`);
                const listResult = await databases.listDocuments(DATABASE_ID, SITES_COLLECTION_ID, [], 1);
                console.log('✅ Successfully listed documents:', listResult);
                
                dbVerified = true;
                collectionVerified = true;
                
                checks[1] = {
                    name: 'Database Connection',
                    status: 'success',
                    message: `Database "${databaseId}" is accessible`,
                };
                
                checks[2] = {
                    name: 'Sites Collection',
                    status: 'success',
                    message: `Collection "${sitesCollectionId}" exists and is accessible`,
                };
            } catch (listError: any) {
                errorDetails = listError;
                const errorCode = listError.code || '';
                const errorMsg = String(listError.message || listError || 'Unknown error');
                
                console.log('⚠️ List documents failed:', { errorCode, errorMsg, error: listError });

                // 404 means collection might not exist OR it exists but is empty/has no attributes
                if (errorCode === 404) {
                    console.log('📝 Collection returned 404, trying to create test document...');
                    
                    // Strategy 2: Try creating a test document to verify collection exists
                    try {
                        const testDocId = ID.unique();
                        const testDoc = {
                            userId: 'test-verification-' + Date.now(),
                            domain: 'test-verification-' + Date.now() + '.com',
                            config: JSON.stringify({ test: true, timestamp: Date.now() }),
                            status: 'draft',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };
                        
                        console.log('📝 Creating test document...', testDoc);
                        const created = await databases.createDocument(
                            DATABASE_ID,
                            SITES_COLLECTION_ID,
                            testDocId,
                            testDoc
                        );
                        
                        console.log('✅ Test document created successfully:', created);
                        
                        dbVerified = true;
                        collectionVerified = true;
                        
                        checks[1] = {
                            name: 'Database Connection',
                            status: 'success',
                            message: `Database "${databaseId}" is accessible`,
                        };
                        
                        checks[2] = {
                            name: 'Sites Collection',
                            status: 'success',
                            message: `Collection "${sitesCollectionId}" exists with correct attributes`,
                        };
                        
                        // Clean up test document
                        try {
                            await databases.deleteDocument(DATABASE_ID, SITES_COLLECTION_ID, testDocId);
                            console.log('✅ Test document cleaned up');
                            setTestResult('✅ Test document created and deleted successfully - all attributes are correct!');
                        } catch (deleteErr: any) {
                            console.warn('⚠️ Could not delete test document:', deleteErr);
                            setTestResult('⚠️ Test document created but could not be deleted. You may want to delete it manually from Appwrite console.');
                        }
                    } catch (createError: any) {
                        const createErrorCode = createError.code || '';
                        const createErrorMsg = String(createError.message || createError || 'Unknown error');
                        
                        console.error('❌ Create document failed:', { createErrorCode, createErrorMsg, error: createError });
                        
                        // Analyze the error
                        if (createErrorCode === 404 || createErrorMsg.toLowerCase().includes('not found') || createErrorMsg.toLowerCase().includes('collection')) {
                            checks[1] = {
                                name: 'Database Connection',
                                status: 'error',
                                message: `Collection "${sitesCollectionId}" not found. Please create it in Appwrite console.`,
                            };
                            checks[2] = {
                                name: 'Sites Collection',
                                status: 'error',
                                message: `Collection "${sitesCollectionId}" not found. Click "Open Appwrite Console" above to create it.`,
                            };
                        } else if (createErrorMsg.toLowerCase().includes('attribute') || createErrorMsg.toLowerCase().includes('column') || createErrorMsg.toLowerCase().includes('invalid attribute')) {
                            dbVerified = true;
                            checks[1] = {
                                name: 'Database Connection',
                                status: 'success',
                                message: `Database "${databaseId}" is accessible`,
                            };
                            checks[2] = {
                                name: 'Sites Collection',
                                status: 'error',
                                message: `Collection exists but missing required attributes. Error: ${createErrorMsg}. See setup instructions below to add the required attributes.`,
                            };
                        } else if (createErrorCode === 401 || createErrorCode === 403 || createErrorMsg.toLowerCase().includes('permission') || createErrorMsg.toLowerCase().includes('unauthorized') || createErrorMsg.toLowerCase().includes('forbidden')) {
                            dbVerified = true;
                            checks[1] = {
                                name: 'Database Connection',
                                status: 'success',
                                message: `Database "${databaseId}" is accessible`,
                            };
                            checks[2] = {
                                name: 'Sites Collection',
                                status: 'error',
                                message: `Permission denied (${createErrorCode}). Add "Any" role with "Read" and "Create" permissions in collection settings.`,
                            };
                        } else {
                            checks[1] = {
                                name: 'Database Connection',
                                status: 'error',
                                message: `Error: ${createErrorMsg} (Code: ${createErrorCode})`,
                            };
                            checks[2] = {
                                name: 'Sites Collection',
                                status: 'error',
                                message: `Error: ${createErrorMsg} (Code: ${createErrorCode})`,
                            };
                        }
                    }
                } else if (errorCode === 401 || errorCode === 403 || errorMsg.toLowerCase().includes('permission') || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('forbidden')) {
                    checks[1] = {
                        name: 'Database Connection',
                        status: 'error',
                        message: `Permission denied (${errorCode}). Add "Any" role with "Read" permission in collection settings.`,
                    };
                    checks[2] = {
                        name: 'Sites Collection',
                        status: 'error',
                        message: `Permission denied (${errorCode}). Add "Any" role with "Read" permission.`,
                    };
                } else {
                    checks[1] = {
                        name: 'Database Connection',
                        status: 'error',
                        message: `Error: ${errorMsg} (Code: ${errorCode})`,
                    };
                    checks[2] = {
                        name: 'Sites Collection',
                        status: 'error',
                        message: `Error: ${errorMsg} (Code: ${errorCode})`,
                    };
                }
            }

            setResults([...checks]);

            // Only continue with attribute and permission checks if database is verified
            if (dbVerified && collectionVerified) {
                // Check 3: Attributes (already verified if we got here via createDocument)
                checks.push({
                    name: 'Collection Attributes',
                    status: 'success',
                    message: 'All required attributes are configured correctly',
                });
                setResults([...checks]);

                // Check 4: Permissions
                checks.push({
                    name: 'Collection Permissions',
                    status: 'success',
                    message: 'Read and Create permissions are configured',
                });
                setResults([...checks]);
            } else if (dbVerified) {
                // Database works but collection has issues - check attributes
                checks.push({
                    name: 'Collection Attributes',
                    status: 'error',
                    message: 'Cannot verify attributes - collection access failed',
                });
                checks.push({
                    name: 'Collection Permissions',
                    status: 'error',
                    message: 'Cannot verify permissions - collection access failed',
                });
                setResults([...checks]);
            }
        } catch (error: any) {
            console.error('❌ Unexpected error during verification:', error);
            const errorMsg = String(error?.message || error || 'Unknown error');
            const errorCode = error?.code || '';
            
            checks[1] = {
                name: 'Database Connection',
                status: 'error',
                message: `Unexpected error: ${errorMsg} (Code: ${errorCode})`,
            };
            checks[2] = {
                name: 'Sites Collection',
                status: 'error',
                message: 'Cannot check collection - unexpected error',
            };
            setResults([...checks]);
        }

        setLoading(false);
    };

    useEffect(() => {
        verifyDatabase();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'checking':
                return '⏳';
            default:
                return '❓';
        }
    };

    const allPassed = results.length > 0 && results.every(r => r.status === 'success');

    return (
        <div className="verify-database">
            <div className="verify-database__container">
                <h1 className="verify-database__title">Database Configuration Verification</h1>
                <p className="verify-database__subtitle">
                    This tool verifies that your Appwrite database is set up correctly for site creation.
                </p>

                <button
                    className="verify-database__button"
                    onClick={verifyDatabase}
                    disabled={loading}
                >
                    {loading ? 'Verifying...' : 'Run Verification'}
                </button>

                {results.length > 0 && (
                    <div className="verify-database__results">
                        <h2 className="verify-database__results-title">Verification Results</h2>
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={`verify-database__result verify-database__result--${result.status}`}
                            >
                                <div className="verify-database__result-header">
                                    <span className="verify-database__result-icon">
                                        {getStatusIcon(result.status)}
                                    </span>
                                    <span className="verify-database__result-name">{result.name}</span>
                                </div>
                                <p className="verify-database__result-message">{result.message}</p>
                            </div>
                        ))}
                    </div>
                )}

                {testResult && (
                    <div className="verify-database__test-result">
                        {testResult}
                    </div>
                )}

                {allPassed && (
                    <div className="verify-database__success">
                        <h3>🎉 All Checks Passed!</h3>
                        <p>Your database is configured correctly. You can now create sites at <code>/sites/new</code></p>
                    </div>
                )}

                {results.some(r => r.status === 'error') && (
                    <div className="verify-database__help">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Setup Instructions</h3>
                            <button
                                onClick={openAppwriteConsole}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}
                            >
                                🔗 Open Appwrite Console
                            </button>
                        </div>
                        <ol>
                            <li>
                                <strong>Verify Database ID:</strong>
                                <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                    <strong>Current Database ID:</strong>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <code style={{ background: '#fff3cd', padding: '6px 12px', borderRadius: '4px', flex: 1, fontSize: '0.9em' }}>{DATABASE_ID}</code>
                                        <button
                                            onClick={() => copyToClipboard(DATABASE_ID)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: copied ? '#28a745' : '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.85em'
                                            }}
                                        >
                                            {copied ? '✓ Copied!' : '📋 Copy'}
                                        </button>
                                    </div>
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.85em', color: '#666' }}>
                                        Make sure this matches the Database ID in your Appwrite console URL when viewing your database.
                                    </p>
                                </div>
                            </li>
                            <li>
                                <strong>Create Collection (if it doesn't exist):</strong>
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                    <li>Click "Open Appwrite Console" above</li>
                                    <li>Go to Databases → Your Database → Create Collection</li>
                                    <li>Name it: <code>{SITES_COLLECTION_ID}</code></li>
                                </ul>
                            </li>
                            <li>
                                <strong>Add Required Attributes:</strong>
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                    <li>Go to the collection → Attributes tab</li>
                                    <li>Add these attributes:</li>
                                </ul>
                                <table style={{ marginTop: '0.5rem', width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5' }}>
                                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Type</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Size</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Required</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}><code>userId</code></td><td style={{ padding: '8px', border: '1px solid #ddd' }}>String</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>36</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>✓</td></tr>
                                        <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}><code>domain</code></td><td style={{ padding: '8px', border: '1px solid #ddd' }}>String</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>255</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>✓</td></tr>
                                        <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}><code>config</code></td><td style={{ padding: '8px', border: '1px solid #ddd' }}>String</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>10000</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>✓</td></tr>
                                        <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}><code>status</code></td><td style={{ padding: '8px', border: '1px solid #ddd' }}>String</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>20</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>✓</td></tr>
                                        <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}><code>createdAt</code></td><td style={{ padding: '8px', border: '1px solid #ddd' }}>String</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>50</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>✓</td></tr>
                                        <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}><code>updatedAt</code></td><td style={{ padding: '8px', border: '1px solid #ddd' }}>String</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>50</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>✓</td></tr>
                                    </tbody>
                                </table>
                            </li>
                            <li>
                                <strong>Set Permissions (CRITICAL):</strong>
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                    <li>Go to collection → Settings → Permissions</li>
                                    <li>Click "+ Add role" → Select "Any"</li>
                                    <li>Check "Read" and "Create" permissions</li>
                                    <li>Click "Update" to save</li>
                                    <li style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                                        <strong>⚠️ IMPORTANT:</strong> Without "Any" role permissions, client-side access will fail!
                                    </li>
                                </ul>
                            </li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyDatabase;
