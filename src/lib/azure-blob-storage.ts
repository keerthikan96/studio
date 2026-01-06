
import { BlobServiceClient } from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;
let containerName: string | null = null;

const getBlobServiceClient = () => {
    if (!blobServiceClient) {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('Azure Storage connection string is not set in environment variables (AZURE_STORAGE_CONNECTION_STRING).');
        }
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
        
        const containerClient = client.getContainerClient(container);
        await containerClient.createIfNotExists({ access: 'blob' });

        const blockBlobClient = containerClient.getBlockBlobClient(destination);
        
        await blockBlobClient.upload(buffer, buffer.length);

        return blockBlobClient.url;

    } catch (error) {
        console.error('Error uploading to Azure Blob Storage:', error);
        throw new Error('Failed to upload file to Azure.');
    }
};
