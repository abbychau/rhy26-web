import * as Minio from 'minio'

export const minioClient = new Minio.Client({
  endPoint: 's3.abby.md',
  port: 443,
  useSSL: true,
  accessKey: '4mJ6MOtStWzBAI0omQwQ',
  secretKey: 'tfq6A66S7OMBJqWsdvkzkzIh1nMszIPck9SYsAql'
})

export async function getFileUrl(filePath: string): Promise<string> {
    const domain = 'https://s3-9001.abby.md'
    const bucket = 'rhy26'
    const url = await minioClient.presignedGetObject(bucket, filePath)
    return `${domain}${url}`
}
