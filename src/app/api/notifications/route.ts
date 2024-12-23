import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMongoDb } from '@/lib/mongodb';
import { ApiResponse, Notification } from '@/types';
import { ObjectId } from 'mongodb';

export async function GET() {
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

    const db = await getMongoDb();
    const notifications = await db.collection<Notification>('notifications')
      .find({ userId: session.user.id })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: notifications,
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<Notification[]>);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la récupération des notifications',
          details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
        },
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const db = await getMongoDb();
    
    const notificationId = new ObjectId();
    const notification: Notification = {
      id: notificationId.toHexString(),
      userId: session.user.id,
      message: data.message,
      type: data.type || 'info',
      read: false,
      timestamp: new Date(),
      metadata: data.metadata
    };

    await db.collection<Notification>('notifications').insertOne({
      _id: notificationId,
      ...notification
    });

    return NextResponse.json({
      success: true,
      data: notification,
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<Notification>);
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la création de la notification',
          details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
        },
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    const db = await getMongoDb();
    
    if (!data.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'ID de notification manquant'
          }
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const result = await db.collection<Notification>('notifications').updateOne(
      { 
        _id: new ObjectId(data.id),
        userId: session.user.id 
      },
      { $set: { read: data.read } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notification non trouvée'
          }
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        read: data.read
      },
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<{ id: string; read: boolean }>);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la mise à jour de la notification',
          details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
        },
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
