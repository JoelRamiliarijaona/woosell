import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { WooCommerceClient } from '@/lib/woocommerce';
import { SiteModel } from '@/lib/models/website';

export async function GET(request: NextRequest) {
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

    const taskId = request.nextUrl.searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Task ID is required'
          }
        },
        { status: 400 }
      );
    }

    const wooClient = new WooCommerceClient(
      process.env.WOOCOMMERCE_KEY || '',
      process.env.WOOCOMMERCE_SECRET || '',
      process.env.WOOCOMMERCE_URL || ''
    );

    const status = await wooClient.checkSiteStatus(taskId);

    // Si la création est terminée, mettre à jour les informations du site
    if (status.completed && status.consumerKey && status.consumerSecret) {
      const site = await SiteModel.findOne({ taskId });
      if (site) {
        site.status = 'active';
        site.apiKey = status.consumerKey;
        site.apiSecret = status.consumerSecret;
        await site.save();
      }
    }

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error checking site status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Error checking status'
        }
      },
      { status: 500 }
    );
  }
}
