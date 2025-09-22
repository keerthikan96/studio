
import { Storage } from '@google-cloud/storage';
import { format } from 'util';

let storage: Storage;

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
  // Create a mock storage client to prevent crashes if initialization fails
  storage = new Proxy({} as Storage, {
    get(target, prop) {
      if (prop === 'bucket') {
        return () => {
          throw new Error('Google Cloud Storage is not configured.');
        };
      }
      return Reflect.get(target, prop);
    }
  });
}

const bucketName = process.env.GCS_BUCKET_NAME || '';
if (!bucketName) {
  console.error('Google Cloud Storage bucket name is not set in environment variables.');
}

const bucket = storage.bucket(bucketName);

/**
 * Uploads a file to Google Cloud Storage.
 * @param {Buffer} buffer The file buffer to upload.
 * @param {string} destination The destination path in the bucket (e.g., 'profile-pictures/user-123.png').
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export const uploadFileToGCS = (buffer: Buffer, destination: string): Promise<string> => {
  return new Promise((resolve, reject) => {
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
