
import { Storage } from '@google-cloud/storage';
import { format } from 'util';

let storage: Storage | null = null;

const getStorage = () => {
    if (!storage) {
        try {
            if (!process.env.GCS_SERVICE_ACCOUNT_KEY_JSON) {
                throw new Error('Google Cloud Storage service account key JSON is not set in environment variables.');
            }
            const credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY_JSON);
            storage = new Storage({
                projectId: credentials.project_id,
                credentials,
            });
            console.log('Google Cloud Storage client initialized successfully.');
        } catch (error) {
            console.error('Failed to initialize Google Cloud Storage client:', error);
            // In case of failure, we'll let it throw so we can see the error in the logs.
            // A proxy would hide the real issue.
            throw new Error('Could not initialize Google Cloud Storage client.');
        }
    }
    return storage;
};

/**
 * Uploads a file to Google Cloud Storage.
 * @param {Buffer} buffer The file buffer to upload.
 * @param {string} destination The destination path in the bucket (e.g., 'profile-pictures/user-123.png').
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export const uploadFileToGCS = (buffer: Buffer, destination: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        let bucket;
        try {
            const storageClient = getStorage();
            const bucketName = process.env.GCS_BUCKET_NAME;

            if (!bucketName) {
                throw new Error('Google Cloud Storage bucket name is not set in environment variables.');
            }
            bucket = storageClient.bucket(bucketName);
        } catch(error) {
            return reject(error);
        }

        const blob = bucket.file(destination);
        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', async () => {
            try {
                // Make the file public
                await blob.makePublic();
                const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
                resolve(publicUrl);
            } catch (err) {
                reject(new Error('Failed to make file public. Ensure the service account has "Storage Object Admin" role.'));
            }
        });

        blobStream.end(buffer);
    });
};
