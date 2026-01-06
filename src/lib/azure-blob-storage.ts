
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Uploads a file to Azure Blob Storage.
 * @param {Buffer} buffer The file buffer to upload.
 * @param {string} destination The destination path/blob name in the container (e.g., 'profile-pictures/user-123.png').
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export const uploadFileToAzure = async (buffer: Buffer, destination: string): Promise<string> => {
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

        if (!connectionString) {
            throw new Error('Azure Storage connection string is not set in environment variables (AZURE_STORAGE_CONNECTION_STRING).');
        }
        if (!containerName) {
            throw new Error('Azure Storage container name is not set in environment variables (AZURE_STORAGE_CONTAINER_NAME).');
        }
        
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({ access: 'blob' });

        const blockBlobClient = containerClient.getBlockBlobClient(destination);
        
        await blockBlobClient.upload(buffer, buffer.length);

        return blockBlobClient.url;

    } catch (error: any) {
        console.error('**************************************************************');
        console.error('AZURE UPLOAD ERROR:', error);
        console.error('**************************************************************');
        throw new Error('Failed to upload file to Azure.');
    }
};
