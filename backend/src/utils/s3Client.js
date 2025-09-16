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
    region: process.env.AWS_REGION || 'us-east-1',
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    sslEnabled: (String(process.env.MINIO_USE_SSL || 'false').toLowerCase() === 'true')
  });

  return s3Client;
}

module.exports = {
  getS3Client
};
