import { NextRequest, NextResponse } from 'next/server';
import { getShopperMemory, saveShoppingEvent } from '@/lib/backboard';

export async function GET() {
  try {
    const memory = await getShopperMemory();
    return NextResponse.json({ memory });
  } catch {
    return NextResponse.json({ memory: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { event } = await req.json();
    if (!event) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 });
    }
    await saveShoppingEvent(event);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
