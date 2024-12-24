import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// DELETE /api/sites/[siteId] - Supprimer un site
export async function DELETE(
  request: Request,
  { params }: { params: { siteId: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getMongoDb();
    const siteId = params.siteId;

    // Vérifier que le site existe et appartient à l'utilisateur
    const site = await db.collection('sites').findOne({
      _id: new ObjectId(siteId),
      userId: session.user.id
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Supprimer le site
    await db.collection('sites').deleteOne({
      _id: new ObjectId(siteId)
    });

    // Supprimer les commandes associées
    await db.collection('orders').deleteMany({
      siteId: site.domain
    });

    return NextResponse.json({
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
