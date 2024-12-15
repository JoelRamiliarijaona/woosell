import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { Collection, ObjectId } from 'mongodb';

export interface Site {
  _id: ObjectId;
  name: string;
  domain: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    orderCount: number;
    revenue: number;
    lastSync?: Date;
  };
  billing: {
    status: string;
    plan: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = await getMongoDb();
    const sitesCollection: Collection<Site> = db.collection('sites');

    const query = isAdmin(session) ? {} : { userId: session.user.email };
    const sites = await sitesCollection.find(query).toArray();

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = await request.json();
    const { name, domain } = data;

    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const sitesCollection: Collection<Site> = db.collection('sites');

    // Check if domain already exists
    const existingSite = await sitesCollection.findOne({ domain });
    if (existingSite) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      );
    }

    const newSite: Omit<Site, '_id'> = {
      name,
      domain,
      status: 'pending',
      userId: session.user.email!,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        orderCount: 0,
        revenue: 0
      },
      billing: {
        status: 'active',
        plan: 'free'
      }
    };

    const result = await sitesCollection.insertOne(newSite as Site);
    const insertedSite = await sitesCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(insertedSite);
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
