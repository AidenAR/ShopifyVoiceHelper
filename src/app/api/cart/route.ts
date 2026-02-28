import { NextRequest, NextResponse } from 'next/server';
import { createCart, addToCart } from '@/lib/shopify';

export async function POST(req: NextRequest) {
  try {
    const { variantId, cartId } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });
    }

    let cart;
    if (cartId) {
      cart = await addToCart(cartId, variantId);
    } else {
      cart = await createCart(variantId);
    }

    return NextResponse.json({
      cartId: cart.id,
      checkoutUrl: cart.checkoutUrl,
      totalQuantity: cart.totalQuantity,
      totalAmount: cart.cost.totalAmount.amount,
      currency: cart.cost.totalAmount.currencyCode,
    });
  } catch (err) {
    console.error('Cart API error:', err);
    return NextResponse.json({ error: 'Cart operation failed' }, { status: 500 });
  }
}
