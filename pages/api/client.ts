// Create service client module using ES6 syntax.
import AWS from 'aws-sdk'
// const S3Client = require('@aws-sdk/client-s3')
// Set the AWS Region.

const accessKey = process.env.S3_AK
const secretKey = process.env.S3_SK
const REGION = 'us-east-2' // e.g. "us-east-1"

export const BUCKET_NAME = process.env.BUCKET_NAME || 'parasail-static'
// Create an Amazon S3 service client object.
const s3 = new AWS.S3({
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
  region: REGION,
  signatureVersion: 'v4'
})
AWS.config.update({
  region: REGION,
  signatureVersion: 'v4'
})
export { s3 }
