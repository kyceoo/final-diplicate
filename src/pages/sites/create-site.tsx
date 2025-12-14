import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '@/utils/appwrite';
import { createSite, checkDomainAvailability, CreateSiteData } from '@/services/appwrite/sites';
import './create-site.scss';

const CreateSite: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        domain: '',
        appId: '',
        siteName: '',
        siteTitle: '',
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Get current user
            const user = await account.get();
            if (!user) {
                throw new Error('You must be logged in to create a site');
            }

            // Validate form
            if (!formData.domain || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(formData.domain)) {
                throw new Error('Please enter a valid domain name');
            }

            if (!formData.appId || parseInt(formData.appId) < 1000) {
                throw new Error('App ID must be at least 1000');
            }

            if (!formData.siteName || formData.siteName.length < 2) {
                throw new Error('Site name must be at least 2 characters');
            }

            if (!formData.siteTitle || formData.siteTitle.length < 5) {
                throw new Error('Site title must be at least 5 characters');
            }

            // Check domain availability
            const isAvailable = await checkDomainAvailability(formData.domain);
            if (!isAvailable) {
                throw new Error('This domain is already in use');
            }

            // Create site
            const siteData: CreateSiteData = {
                userId: user.$id,
                domain: formData.domain,
                appId: parseInt(formData.appId),
                siteName: formData.siteName,
                siteTitle: formData.siteTitle,
                primaryColor: formData.primaryColor,
                secondaryColor: formData.secondaryColor,
            };

            const site = await createSite(siteData);

            // Redirect to sites list or site details
            navigate('/sites', { state: { message: 'Site created successfully!' } });
        } catch (err: any) {
            setError(err.message || 'Failed to create site. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="create-site">
            <div className="create-site__container">
                <h1 className="create-site__title">Create New Site</h1>
                <p className="create-site__subtitle">
                    Configure your trading platform site settings
                </p>

                {error && (
                    <div className="create-site__error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="create-site__form">
                    <div className="create-site__field">
                        <label htmlFor="domain" className="create-site__label">
                            Domain Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="domain"
                            name="domain"
                            value={formData.domain}
                            onChange={handleChange}
                            placeholder="example.com"
                            required
                            className="create-site__input"
                        />
                        <small className="create-site__hint">
                            Enter the domain where your site will be hosted
                        </small>
                    </div>

                    <div className="create-site__field">
                        <label htmlFor="appId" className="create-site__label">
                            App ID <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="appId"
                            name="appId"
                            value={formData.appId}
                            onChange={handleChange}
                            placeholder="1089"
                            min="1000"
                            required
                            className="create-site__input"
                        />
                        <small className="create-site__hint">
                            Your Deriv application ID (must be at least 1000)
                        </small>
                    </div>

                    <div className="create-site__field">
                        <label htmlFor="siteName" className="create-site__label">
                            Site Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="siteName"
                            name="siteName"
                            value={formData.siteName}
                            onChange={handleChange}
                            placeholder="My Trading Platform"
                            minLength={2}
                            maxLength={50}
                            required
                            className="create-site__input"
                        />
                        <small className="create-site__hint">
                            A short name for your site (2-50 characters)
                        </small>
                    </div>

                    <div className="create-site__field">
                        <label htmlFor="siteTitle" className="create-site__label">
                            Site Title <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="siteTitle"
                            name="siteTitle"
                            value={formData.siteTitle}
                            onChange={handleChange}
                            placeholder="My Trading Platform - Advanced Trading"
                            minLength={5}
                            maxLength={100}
                            required
                            className="create-site__input"
                        />
                        <small className="create-site__hint">
                            The full title that appears in browser tabs (5-100 characters)
                        </small>
                    </div>

                    <div className="create-site__field-group">
                        <div className="create-site__field">
                            <label htmlFor="primaryColor" className="create-site__label">
                                Primary Color
                            </label>
                            <div className="create-site__color-input">
                                <input
                                    type="color"
                                    id="primaryColor"
                                    name="primaryColor"
                                    value={formData.primaryColor}
                                    onChange={handleChange}
                                    className="create-site__color-picker"
                                />
                                <input
                                    type="text"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                                    className="create-site__color-text"
                                    placeholder="#6366f1"
                                />
                            </div>
                        </div>

                        <div className="create-site__field">
                            <label htmlFor="secondaryColor" className="create-site__label">
                                Secondary Color
                            </label>
                            <div className="create-site__color-input">
                                <input
                                    type="color"
                                    id="secondaryColor"
                                    name="secondaryColor"
                                    value={formData.secondaryColor}
                                    onChange={handleChange}
                                    className="create-site__color-picker"
                                />
                                <input
                                    type="text"
                                    value={formData.secondaryColor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                    className="create-site__color-text"
                                    placeholder="#8b5cf6"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="create-site__actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="create-site__button create-site__button--cancel"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="create-site__button create-site__button--submit"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Site'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSite;






