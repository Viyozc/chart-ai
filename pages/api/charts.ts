import { NextApiRequest, NextApiResponse } from 'next'
import * as echarts from 'echarts'
import { createCanvas } from 'canvas'
import { s3, BUCKET_NAME } from './client'
import crypto from 'crypto'

const BASE_CLOUDFRONT_URL = 'https://d135ugxgwtnu1c.cloudfront.net'

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { config, width = 800, height = 600, filename } = req.body

    if (!config) {
      return res.status(400).json({ error: 'ECharts config is required' })
    }

    // 基于配置生成固定的文件名
    const configHash = crypto.createHash('md5')
      .update(JSON.stringify({ config, width, height }))
      .digest('hex')
      .slice(0, 12)

    const finalFilename = filename
      ? `charts/${filename}-${configHash}.png`
      : `charts/chart-${configHash}.png`

    // 检查 S3 中是否已存在该文件
    try {
      await s3.headObject({
        Bucket: BUCKET_NAME,
        Key: finalFilename
      }).promise()

      // 文件已存在，直接返回 URL
      const existingUrl = `${BASE_CLOUDFRONT_URL}/${finalFilename}`

      console.log(`Chart already exists in S3: ${finalFilename}`)

      return res.status(200).json({
        success: true,
        message: 'Chart retrieved from cache',
        data: {
          filename: finalFilename,
          url: existingUrl,
          s3Key: finalFilename,
          cached: true,
          size: {
            width,
            height
          }
        }
      })
    } catch (error: unknown) {
      // 文件不存在，继续生成新图片
      const err = error as { code?: string }
      if (err.code !== 'NotFound') {
        throw error // 如果不是"文件不存在"错误，则抛出
      }
    }

    // 创建 canvas
    const canvas = createCanvas(width, height)

    // 创建图表实例，直接传入 canvas
    const chart = echarts.init(canvas as unknown as HTMLCanvasElement, null, {
      width,
      height,
      renderer: 'canvas'
    })

    // 设置配置
    chart.setOption(config)

    // 生成图片
    const imageBuffer = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })

    // 将 base64 转换为 Buffer
    const base64Data = imageBuffer.replace(/^data:image\/png;base64,/, '')
    const imageBufferData = Buffer.from(base64Data, 'base64')

    // 上传到 S3
    const bucketParams = {
      Bucket: BUCKET_NAME,
      Key: finalFilename,
      Body: imageBufferData,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable'
    }

    const result = await s3.upload(bucketParams).promise()
    console.log(`Chart uploaded successfully to S3: ${result.Location}`)

    // 返回结果
    res.status(200).json({
      success: true,
      message: 'Chart generated and uploaded successfully',
      data: {
        filename: finalFilename,
        url: `${BASE_CLOUDFRONT_URL}/${finalFilename}`,
        s3Key: finalFilename,
        cached: false,
        size: {
          width,
          height
        }
      }
    })

    // 销毁图表实例
    chart.dispose()
  } catch (error) {
    console.error('Error generating chart:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate chart',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
