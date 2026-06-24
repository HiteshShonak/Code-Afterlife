import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  // Guard clause to ensure the API key is set
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Resend API key not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const { type, email, message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // You can customize the "from" address once you verify a domain in Resend.
    // For testing without a verified domain, use "onboarding@resend.dev"
    // AND make sure the "to" address is the email you signed up to Resend with.
    const { data, error } = await resend.emails.send({
      from: 'Code Afterlife <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL || 'delivered@resend.dev', // Add CONTACT_EMAIL to your .env.local
      subject: `New Contact Form Submission: ${type}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              line-height: 1.6; 
              color: #a1a1aa; 
              background-color: #000000; 
              padding: 20px; 
              margin: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #09090b; 
              border: 1px solid #27272a; 
              padding: 32px; 
              border-radius: 8px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 32px; 
              border-bottom: 1px dashed #3f3f46; 
              padding-bottom: 24px; 
            }
            .title { 
              color: #10b981; 
              font-size: 20px; 
              font-weight: 700; 
              margin: 0 0 12px 0; 
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .badge { 
              display: inline-block; 
              padding: 4px 12px; 
              font-size: 12px; 
              font-weight: bold; 
              text-transform: uppercase; 
              letter-spacing: 1px; 
              border: 1px solid; 
            }
            .badge.BUG { background-color: #450a0a; color: #f87171; border-color: #7f1d1d; }
            .badge.FEATURE { background-color: #451a03; color: #fbbf24; border-color: #78350f; }
            .badge.APPRECIATION { background-color: #022c22; color: #34d399; border-color: #064e3b; }
            .badge.OTHER { background-color: #1e1b4b; color: #818cf8; border-color: #312e81; }
            
            .section { margin-bottom: 24px; }
            .label { 
              font-size: 12px; 
              color: #71717a; 
              text-transform: uppercase; 
              letter-spacing: 1px; 
              margin-bottom: 8px; 
              font-weight: bold; 
            }
            .content { 
              font-size: 14px; 
              color: #e4e4e7; 
              background: #000000; 
              padding: 16px; 
              border: 1px solid #27272a; 
              border-left: 3px solid #10b981;
              white-space: pre-wrap; 
            }
            .content-email { color: #10b981; text-decoration: none; }
            .footer { 
              text-align: center; 
              font-size: 11px; 
              color: #52525b; 
              margin-top: 40px; 
              border-top: 1px dashed #27272a; 
              padding-top: 24px; 
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">&gt;_ TRANSMISSION_RECEIVED</h1>
              <span class="badge ${type}">${type}</span>
            </div>
            
            <div class="section">
              <div class="label">/// SENDER_IDENTITY</div>
              <div class="content" style="border-left-color: #52525b;">
                ${email ? `<a href="mailto:${email}" class="content-email">${email}</a>` : '<span style="color: #71717a; font-style: italic;">[UNKNOWN_GHOST]</span>'}
              </div>
            </div>
            
            <div class="section">
              <div class="label">/// DECRYPTED_MESSAGE</div>
              <div class="content">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="footer">
              SYSTEM: CODE_AFTERLIFE // STATUS: SECURE
            </div>
          </div>
        </body>
        </html>
      `,
      replyTo: email || undefined,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
