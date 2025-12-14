import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, SITES_COLLECTION_ID } from '@/utils/appwrite';

export interface SiteConfig {
    appId: number;
    serverUrl?: string;
    siteName: string;
    siteTitle: string;
    logoPath?: string;
    faviconPath?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    apolloListItemBg?: string;
    apolloListItemHoverBg?: string;
    tabActiveColor?: string;
    tabListBgColor?: string;
    buttonSecondaryColor?: string;
    buttonSecondaryBorderColor?: string;
    socialLinks?: Record<string, any>;
    botUserId?: string;
    brandConfig?: Record<string, any>;
    environment?: string;
}

export interface Site {
    $id: string;
    userId: string;
    domain: string;
    config: string; // JSON string of SiteConfig
    status: 'draft' | 'pending' | 'deployed' | 'failed' | 'suspended';
    createdAt: string;
    updatedAt: string;
}

export interface CreateSiteData {
    userId: string;
    domain: string;
    appId: number;
    siteName: string;
    siteTitle: string;
    primaryColor?: string;
    secondaryColor?: string;
}

/**
 * Create a new site
 */
export const createSite = async (data: CreateSiteData): Promise<Site> => {
    const siteConfig: SiteConfig = {
        appId: data.appId,
        serverUrl: 'wss://ws.derivws.com/websockets/v3',
        siteName: data.siteName,
        siteTitle: data.siteTitle,
        logoPath: '/default-logo.png',
        faviconPath: null,
        primaryColor: data.primaryColor || '#6366f1',
        secondaryColor: data.secondaryColor || '#8b5cf6',
        apolloListItemBg: (data.primaryColor || '#6366f1') + '20',
        apolloListItemHoverBg: (data.primaryColor || '#6366f1') + '30',
        tabActiveColor: data.primaryColor || '#6366f1',
        tabListBgColor: '#f8fafc',
        buttonSecondaryColor: data.secondaryColor || '#8b5cf6',
        buttonSecondaryBorderColor: data.secondaryColor || '#8b5cf6',
        socialLinks: {},
        botUserId: data.userId,
        brandConfig: {},
        environment: 'production',
    };

    const now = new Date().toISOString();

    const site = await databases.createDocument(
        DATABASE_ID,
        SITES_COLLECTION_ID,
        ID.unique(),
        {
            userId: data.userId,
            domain: data.domain,
            config: JSON.stringify(siteConfig),
            status: 'draft',
            createdAt: now,
            updatedAt: now,
        }
    );

    return site as unknown as Site;
};

/**
 * Get all sites for a user
 */
export const getUserSites = async (userId: string): Promise<Site[]> => {
    const response = await databases.listDocuments(
        DATABASE_ID,
        SITES_COLLECTION_ID,
        [Query.equal('userId', userId)]
    );

    return response.documents as unknown as Site[];
};

/**
 * Get a site by ID
 */
export const getSite = async (siteId: string): Promise<Site> => {
    const site = await databases.getDocument(
        DATABASE_ID,
        SITES_COLLECTION_ID,
        siteId
    );

    return site as unknown as Site;
};

/**
 * Check if domain is available
 */
export const checkDomainAvailability = async (domain: string): Promise<boolean> => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            SITES_COLLECTION_ID,
            [Query.equal('domain', domain)]
        );

        return response.documents.length === 0;
    } catch (error) {
        console.error('Error checking domain availability:', error);
        return false;
    }
};

/**
 * Update site
 */
export const updateSite = async (
    siteId: string,
    updates: Partial<Pick<Site, 'status' | 'config' | 'domain'>>
): Promise<Site> => {
    const updateData: any = {
        updatedAt: new Date().toISOString(),
    };

    if (updates.status) updateData.status = updates.status;
    if (updates.config) updateData.config = typeof updates.config === 'string' ? updates.config : JSON.stringify(updates.config);
    if (updates.domain) updateData.domain = updates.domain;

    const site = await databases.updateDocument(
        DATABASE_ID,
        SITES_COLLECTION_ID,
        siteId,
        updateData
    );

    return site as unknown as Site;
};

/**
 * Delete a site
 */
export const deleteSite = async (siteId: string): Promise<void> => {
    await databases.deleteDocument(
        DATABASE_ID,
        SITES_COLLECTION_ID,
        siteId
    );
};






