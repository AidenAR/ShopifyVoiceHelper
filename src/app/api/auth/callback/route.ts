import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const shop = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!code || !shop || !clientId || !clientSecret) {
    return new Response('Missing params', { status: 400 });
  }

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return new Response(`Token exchange failed: ${err}`, { status: 500 });
    }

    const data = await tokenRes.json();
    const accessToken = data.access_token;

    // Write token to .env.local
    const envPath = join(process.cwd(), '.env.local');
    let envContent = readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(
      /^SHOPIFY_ADMIN_TOKEN=.*$/m,
      `SHOPIFY_ADMIN_TOKEN=${accessToken}`
    );
    writeFileSync(envPath, envContent);

    // Also set it in process.env for immediate use
    process.env.SHOPIFY_ADMIN_TOKEN = accessToken;

    const html = `
      <!DOCTYPE html>
      <html><head><title>ShopifyVoice - Auth Complete</title>
      <style>body{background:#030712;color:#f8fafc;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
      .card{text-align:center;padding:3rem;border-radius:1.5rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);max-width:500px}
      h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#94a3b8;font-size:0.9rem;line-height:1.6}
      .token{background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:0.5rem;padding:0.75rem;margin:1rem 0;font-family:monospace;font-size:0.75rem;word-break:break-all;color:#a78bfa}
      .success{color:#34d399;font-size:1.2rem;margin-bottom:1rem}
      a{color:#a78bfa;text-decoration:none;padding:0.75rem 1.5rem;border-radius:999px;background:rgba(139,92,246,0.2);display:inline-block;margin-top:1rem}</style></head>
      <body><div class="card">
        <div class="success">&#10003; Authorized!</div>
        <h1>Admin API Connected</h1>
        <p>Token saved to .env.local. You can now create products by voice!</p>
        <div class="token">${accessToken.slice(0, 12)}...${accessToken.slice(-8)}</div>
        <p>Restart your dev server to activate, then try: <strong>"Add a vintage jacket for $59.99"</strong></p>
        <a href="/">Back to ShopifyVoice</a>
      </div></body></html>
    `;

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
