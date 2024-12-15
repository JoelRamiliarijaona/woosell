import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    if (!db) {
      throw new Error('La connexion à la base de données a échoué');
    }

    const notifications = await db.collection('notifications')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();
    if (!db) {
      throw new Error('La connexion à la base de données a échoué');
    }

    const notification = {
      ...body,
      userId: session.user.id,
      createdAt: new Date(),
      read: false
    };

    const result = await db.collection('notifications').insertOne(notification);
    return NextResponse.json({
      message: 'Notification créée avec succès',
      notification: {
        ...notification,
        _id: result.insertedId
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    if (!db) {
      throw new Error('La connexion à la base de données a échoué');
    }

    const body = await request.json();
    const result = await db.collection('notifications').updateOne(
      { 
        _id: body.notificationId,
        userId: session.user.id 
      },
      { $set: { read: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Notification mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la notification' },
      { status: 500 }
    );
  }
}
