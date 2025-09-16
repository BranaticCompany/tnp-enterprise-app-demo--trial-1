/**
 * S3 Client utility for MinIO integration
 * Provides S3-compatible client configuration for file storage operations
 */

const AWS = require('aws-sdk');

/**
 * Get configured S3 client instance
 * @returns {AWS.S3} Configured S3 client
 */
function getS3Client() {
  const s3Client = new AWS.S3({
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    s3ForcePathStyle: true, // Required for MinIO
    signatureVersion: 'v4',
    sslEnabled: process.env.MINIO_USE_SSL === 'true'
  });

  return s3Client;
}

module.exports = {
  getS3Client
};
