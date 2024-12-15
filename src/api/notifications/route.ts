import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    
    // Récupérer les notifications non lues pour l'utilisateur
    const notifications = await db.collection('notifications')
      .find({
        userId: session.user.id,
        read: false
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { message, type = 'info' } = await request.json();
    const db = await connectToDatabase();

    const notification = {
      userId: session.user.id,
      message,
      type,
      timestamp: new Date(),
      read: false
    };

    await db.collection('notifications').insertOne(notification);

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
