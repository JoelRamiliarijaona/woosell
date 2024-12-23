import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApiResponse } from '@/types';

interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, unknown>;
}

interface CreateNotificationRequest {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, unknown>;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
    
    // Récupérer les notifications non lues pour l'utilisateur
    const notifications = await db.collection<Notification>('notifications')
      .find({
        userId: session.user.id,
        read: false
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    const response: ApiResponse<NotificationsResponse> = {
      success: true,
      data: {
        notifications,
        unreadCount: notifications.length
      },
      metadata: {
        timestamp: new Date()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur interne du serveur',
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
    if (!session?.user?.id) {
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

    const { message, type = 'info', metadata } = await request.json() as CreateNotificationRequest;
    
    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Le message est requis'
          }
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    const notification: Omit<Notification, 'id'> = {
      userId: session.user.id,
      message,
      type,
      timestamp: new Date(),
      read: false,
      metadata
    };

    const result = await db.collection<Omit<Notification, 'id'>>('notifications').insertOne(notification);

    const response: ApiResponse<Notification> = {
      success: true,
      data: {
        ...notification,
        id: result.insertedId.toHexString()
      },
      metadata: {
        timestamp: new Date()
      }
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur interne du serveur',
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
