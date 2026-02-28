import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const shop = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const redirectUri = `${req.nextUrl.origin}/api/auth/callback`;
  const scopes = 'write_products,read_products,read_orders,write_price_rules,read_price_rules,read_analytics';
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
