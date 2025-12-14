import { Client, Databases, Account } from 'appwrite';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '6937a1ac00182dcb68fb');

// Initialize Appwrite services
const databases = new Databases(client);
const account = new Account(client);

// Database and Collection IDs
// Note: Database ID should be just the ID part (e.g., "6937a9c0002084d4728c"), not "database-6937a9c0002084d4728c"
// The "database-" prefix is only used in URLs, not in API calls
export const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '6937a9c0002084d4728c';
export const SITES_COLLECTION_ID = process.env.VITE_APPWRITE_SITES_COLLECTION_ID || 'sites_collection';
export const DEPLOYMENTS_COLLECTION_ID = process.env.VITE_APPWRITE_DEPLOYMENTS_COLLECTION_ID || 'deployments_collection';
export const USERS_METADATA_COLLECTION_ID = process.env.VITE_APPWRITE_USERS_METADATA_COLLECTION_ID || 'users_metadata_collection';
export const DOMAIN_OWNERSHIP_COLLECTION_ID = process.env.VITE_APPWRITE_DOMAIN_OWNERSHIP_COLLECTION_ID || 'domain_ownership_collection';
export const ANNOUNCEMENTS_COLLECTION_ID = process.env.VITE_APPWRITE_ANNOUNCEMENTS_COLLECTION_ID || 'announcements_collection';
export const XML_BOTS_COLLECTION_ID = process.env.VITE_APPWRITE_XML_BOTS_COLLECTION_ID || 'xml_bots_collection';

export { client, databases, account };
export default client;

