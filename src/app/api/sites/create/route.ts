import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { WooCommerceClient } from '@/lib/woocommerce';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Non autorisé'
          }
        } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const data = await request.json();
    
    const wooClient = new WooCommerceClient(
      process.env.WOOCOMMERCE_KEY || '',
      process.env.WOOCOMMERCE_SECRET || '',
      process.env.WOOCOMMERCE_URL || ''
    );

    // Cette fonction retourne rapidement avec un taskId
    const result = await wooClient.createWooCommerceSite({
      domain: data.domain,
      name: data.name,
      password: data.password,
      userId: session.user.id
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error initiating site creation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATION_ERROR',
          message: error instanceof Error ? error.message : 'Error initiating creation'
        }
      },
      { status: 500 }
    );
  }
}
