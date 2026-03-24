import { NextRequest, NextResponse } from 'next/server'

// Feishu webhook URL - configure in Vercel project settings
const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL

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
              content: `**简历:** ${resumeName}`
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
