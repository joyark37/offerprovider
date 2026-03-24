import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// Feishu webhook URL - configure in Vercel project settings
const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL

// Cloudflare R2 config - configure in Vercel project settings
const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

// Initialize R2 client if configured
const getR2Client = () => {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    return null
  }
  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      notes,
      jobId,
      jobTitle,
      jobCompany,
      jobLink,
      resumeBase64,
      resumeName,
      resumeType
    } = body

    // Validate required fields
    if (!name || !email || !jobId || !resumeBase64) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let resumeUrl = ''

    // Upload to R2 if configured
    if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME) {
      try {
        const r2Client = getR2Client()
        if (r2Client) {
          const timestamp = Date.now()
          const fileExt = resumeName.split('.').pop() || 'pdf'
          const key = `resumes/${timestamp}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`
          
          const buffer = Buffer.from(resumeBase64, 'base64')
          
          const upload = new Upload({
            client: r2Client,
            params: {
              Bucket: R2_BUCKET_NAME,
              Key: key,
              Body: buffer,
              ContentType: resumeType || 'application/pdf',
            },
          })
          
          await upload.done()
          resumeUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `${R2_ENDPOINT}/${key}`
          console.log('Resume uploaded to R2:', resumeUrl)
        }
      } catch (r2Error) {
        console.error('R2 upload failed:', r2Error)
        // Continue without resume URL
      }
    }

    // Send to Feishu webhook if configured
    if (!FEISHU_WEBHOOK_URL) {
      console.error('FEISHU_WEBHOOK_URL not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const feishuMessage = {
      msg_type: 'interactive',
      card: {
        config: { wide_screen_mode: true },
        header: {
          title: { tag: 'plain_text', content: '📬 新简历投递' },
          template: 'blue'
        },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: `**投递人:** ${name}\n**邮箱:** ${email}${phone ? `\n**电话:** ${phone}` : ''}`
            }
          },
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: `**岗位:** ${jobTitle}\n**公司:** ${jobCompany}`
            }
          },
          {
            tag: 'action',
            actions: [
              {
                tag: 'button',
                text: { tag: 'plain_text', content: '查看岗位' },
                url: jobLink,
                type: 'primary'
              }
            ]
          },
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: notes ? `**备注:** ${notes}` : '*无备注*'
            }
          },
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: resumeUrl ? `**简历:** [下载简历](${resumeUrl})` : `**简历:** ${resumeName} (Base64编码，请联系管理员)`
            }
          }
        ]
      }
    }

    const webhookResponse = await fetch(FEISHU_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feishuMessage)
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('Feishu webhook failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to send to Feishu', details: errorText },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, resumeUrl })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
