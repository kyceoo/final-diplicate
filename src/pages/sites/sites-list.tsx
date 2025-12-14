import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '@/utils/appwrite';
import { getUserSites, Site } from '@/services/appwrite/sites';
import './sites-list.scss';

const SitesList: React.FC = () => {
    const navigate = useNavigate();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSites();
    }, []);

    const loadSites = async () => {
        try {
            setLoading(true);
            const user = await account.get();
            if (!user) {
                throw new Error('You must be logged in');
            }

            const userSites = await getUserSites(user.$id);
            setSites(userSites);
        } catch (err: any) {
            setError(err.message || 'Failed to load sites');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'deployed':
                return '#4caf50';
            case 'pending':
                return '#ff9800';
            case 'draft':
                return '#9e9e9e';
            case 'failed':
                return '#f44336';
            default:
                return '#9e9e9e';
        }
    };

    if (loading) {
        return (
            <div className="sites-list">
                <div className="sites-list__container">
                    <p>Loading sites...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sites-list">
            <div className="sites-list__container">
                <div className="sites-list__header">
                    <h1 className="sites-list__title">My Sites</h1>
                    <button
                        className="sites-list__create-button"
                        onClick={() => navigate('/sites/new')}
                    >
                        + Create New Site
                    </button>
                </div>

                {error && (
                    <div className="sites-list__error">
                        {error}
                    </div>
                )}

                {sites.length === 0 ? (
                    <div className="sites-list__empty">
                        <p>You don't have any sites yet.</p>
                        <button
                            className="sites-list__create-button"
                            onClick={() => navigate('/sites/new')}
                        >
                            Create Your First Site
                        </button>
                    </div>
                ) : (
                    <div className="sites-list__grid">
                        {sites.map((site) => {
                            const config = JSON.parse(site.config || '{}');
                            return (
                                <div key={site.$id} className="sites-list__card">
                                    <div className="sites-list__card-header">
                                        <h3 className="sites-list__card-title">{config.siteName || site.domain}</h3>
                                        <span
                                            className="sites-list__status"
                                            style={{ backgroundColor: getStatusColor(site.status) + '20', color: getStatusColor(site.status) }}
                                        >
                                            {site.status}
                                        </span>
                                    </div>
                                    <div className="sites-list__card-body">
                                        <p className="sites-list__domain">{site.domain}</p>
                                        <p className="sites-list__title-text">{config.siteTitle}</p>
                                        <p className="sites-list__app-id">App ID: {config.appId}</p>
                                    </div>
                                    <div className="sites-list__card-actions">
                                        <button
                                            className="sites-list__action-button"
                                            onClick={() => {/* TODO: Navigate to site details */}}
                                        >
                                            View
                                        </button>
                                        <button
                                            className="sites-list__action-button sites-list__action-button--primary"
                                            onClick={() => {/* TODO: Handle deploy */}}
                                            disabled={site.status === 'deployed'}
                                        >
                                            {site.status === 'deployed' ? 'Deployed' : 'Deploy'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SitesList;






