import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Connexion à la base de données
    const { db } = await connectToDatabase();

    // Vider les collections
    await db.collection('sites').deleteMany({});
    await db.collection('billing').deleteMany({});

    return NextResponse.json({ 
      message: 'Collections vidées avec succès',
      collections: ['sites', 'billing']
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage des collections:', error);
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage des collections' },
      { status: 500 }
    );
  }
}
