
import { Storage } from '@google-cloud/storage';
import { getFirebaseAdminStorage, hasFirebaseAdminConfiguration, isFirebaseStorageEnabled } from './firebase-admin';

let storageClient: Storage | null = null;

const getStorageClient = (): Storage => {
    if (!storageClient) {
        storageClient = new Storage();
    }
    return storageClient;
};

const getBucketName = (): string => {
    const name = process.env.GCS_BUCKET_NAME;
    if (!name) {
        throw new Error('GCS_BUCKET_NAME environment variable is not set.');
    }
    return name;
};

const getContentType = (destination: string) => {
    if (destination.endsWith('.pdf')) return 'application/pdf';
    if (destination.endsWith('.doc')) return 'application/msword';
    if (destination.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (destination.endsWith('.png')) return 'image/png';
    if (destination.endsWith('.jpg') || destination.endsWith('.jpeg')) return 'image/jpeg';
    if (destination.endsWith('.webp')) return 'image/webp';
    if (destination.endsWith('.csv')) return 'text/csv';
    return 'application/octet-stream';
};

const uploadFileToFirebase = async (buffer: Buffer, destination: string): Promise<string> => {
    if (!isFirebaseStorageEnabled() || !hasFirebaseAdminConfiguration()) {
        throw new Error('Firebase Storage is not enabled or configured.');
    }

    const bucket = getFirebaseAdminStorage().bucket();
    const file = bucket.file(destination);

    await file.save(buffer, {
        resumable: false,
        metadata: {
            contentType: getContentType(destination),
            cacheControl: 'public, max-age=31536000',
        },
    });

    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 8760 * 60 * 60 * 1000,
    });

    return signedUrl;
};

const generateFirebaseSignedUrl = async (blobName: string, expiryHours: number = 8760): Promise<string> => {
    if (!isFirebaseStorageEnabled() || !hasFirebaseAdminConfiguration()) {
        throw new Error('Firebase Storage is not enabled or configured.');
    }

    const bucket = getFirebaseAdminStorage().bucket();
    const file = bucket.file(blobName);
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiryHours * 60 * 60 * 1000,
    });

    return signedUrl;
};

/**
 * Uploads a file to Google Cloud Storage.
 * @param {Buffer} buffer The file buffer to upload.
 * @param {string} destination The destination path in the bucket (e.g., 'profile-pictures/user-123.png').
 * @returns {Promise<string>} A signed URL for the uploaded file.
 */
export const uploadFileToAzure = async (buffer: Buffer, destination: string): Promise<string> => {
    try {
        if (isFirebaseStorageEnabled()) {
            return await uploadFileToFirebase(buffer, destination);
        }

        const storage = getStorageClient();
        const bucketName = getBucketName();
        const file = storage.bucket(bucketName).file(destination);

        console.log(`Uploading to GCS: bucket="${bucketName}", destination="${destination}", size=${buffer.length} bytes`);

        await file.save(buffer, {
            resumable: false,
            metadata: {
                contentType: getContentType(destination),
                cacheControl: 'public, max-age=31536000',
            },
        });

        console.log(`Successfully uploaded to GCS: gs://${bucketName}/${destination}`);

        return await generateSignedUrlAsync(destination);

    } catch (error) {
        console.error('Error uploading to Google Cloud Storage:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to upload file to GCS: ${error.message}`);
        }
        throw new Error('Failed to upload file to GCS.');
    }
};

export const generateSignedUrlAsync = async (blobName: string, expiryHours: number = 8760): Promise<string> => {
    if (isFirebaseStorageEnabled()) {
        return generateFirebaseSignedUrl(blobName, expiryHours);
    }

    const storage = getStorageClient();
    const file = storage.bucket(getBucketName()).file(blobName);
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiryHours * 60 * 60 * 1000,
        version: 'v4',
    });

    return signedUrl;
};
