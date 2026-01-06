
import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;
let containerName: string | null = null;
let accountName: string | null = null;
let accountKey: string | null = null;

const getBlobServiceClient = () => {
    if (!blobServiceClient) {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('Azure Storage connection string is not set in environment variables (AZURE_STORAGE_CONNECTION_STRING).');
        }
        
        // Parse connection string to extract account name and key
        const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
        const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
        
        if (accountNameMatch) accountName = accountNameMatch[1];
        if (accountKeyMatch) accountKey = accountKeyMatch[1];
        
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    }
    return blobServiceClient;
};

const getContainerName = () => {
    if (!containerName) {
        const name = process.env.AZURE_STORAGE_CONTAINER_NAME;
        if (!name) {
            throw new Error('Azure Storage container name is not set in environment variables (AZURE_STORAGE_CONTAINER_NAME).');
        }
        containerName = name;
    }
    return containerName;
};

/**
 * Uploads a file to Azure Blob Storage.
 * @param {Buffer} buffer The file buffer to upload.
 * @param {string} destination The destination path/blob name in the container (e.g., 'profile-pictures/user-123.png').
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export const uploadFileToAzure = async (buffer: Buffer, destination: string): Promise<string> => {
    try {
        const client = getBlobServiceClient();
        const container = getContainerName();
        
        console.log(`Uploading to Azure: container="${container}", destination="${destination}", size=${buffer.length} bytes`);
        
        const containerClient = client.getContainerClient(container);
        // Create container with private access (public access is disabled on this storage account)
        await containerClient.createIfNotExists();

        const blockBlobClient = containerClient.getBlockBlobClient(destination);
        
        // Set proper content type based on file extension
        const contentType = destination.endsWith('.pdf') 
            ? 'application/pdf' 
            : destination.endsWith('.doc')
            ? 'application/msword'
            : destination.endsWith('.docx')
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/octet-stream';
        
        await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: { blobContentType: contentType }
        });

        console.log(`Successfully uploaded to Azure: ${blockBlobClient.url}`);
        
        // Generate a SAS URL with read access (valid for 1 year)
        const sasUrl = generateSasUrl(destination);
        return sasUrl;

    } catch (error) {
        console.error('Error uploading to Azure Blob Storage:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to upload file to Azure: ${error.message}`);
        }
        throw new Error('Failed to upload file to Azure.');
    }
};

/**
 * Generates a SAS URL for a blob with read permissions.
 * @param {string} blobName The name/path of the blob in the container.
 * @param {number} expiryHours How many hours the SAS token should be valid for (default: 8760 = 1 year).
 * @returns {string} The blob URL with SAS token.
 */
export const generateSasUrl = (blobName: string, expiryHours: number = 8760): string => {
    if (!accountName || !accountKey) {
        getBlobServiceClient(); // Ensure credentials are loaded
    }
    
    if (!accountName || !accountKey) {
        throw new Error('Azure Storage account credentials not available.');
    }
    
    const container = getContainerName();
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    const sasOptions = {
        containerName: container,
        blobName: blobName,
        permissions: BlobSASPermissions.parse('r'), // Read-only
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
    };
    
    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    
    return `https://${accountName}.blob.core.windows.net/${container}/${blobName}?${sasToken}`;
};
