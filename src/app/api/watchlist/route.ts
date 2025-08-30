
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/session';
import { ObjectId } from 'mongodb';

// GET user's watchlist
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session?.isLoggedIn || !session.user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db();
        const watchlistCollection = db.collection('watchlist');

        const watchlist = await watchlistCollection.findOne({ userId: new ObjectId(session.user.userId) });

        if (!watchlist) {
            return NextResponse.json([], { status: 200 });
        }

        return NextResponse.json(watchlist.movies, { status: 200 });

    } catch (error) {
        console.error('Failed to fetch watchlist:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST to add/remove from watchlist
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.isLoggedIn || !session.user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tmdbId, mediaType, title, posterUrl, releaseYear, action } = body;

        if (!tmdbId || !mediaType || !action) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }
        
        if(action === 'add' && (!title || !posterUrl || releaseYear === undefined)) {
            return NextResponse.json({ message: 'Missing media info for adding to watchlist' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const watchlistCollection = db.collection('watchlist');
        const userId = new ObjectId(session.user.userId);
        
        const filter = { userId: userId };
        const movieIdentifier = { tmdbId: tmdbId, mediaType: mediaType };

        if (action === 'add') {
             const movieToAdd = {
                ...movieIdentifier,
                title,
                posterUrl,
                releaseYear,
                addedDate: new Date().toISOString()
            };
            const update = { 
                $setOnInsert: { userId: userId },
                $addToSet: { movies: movieToAdd } 
            };
            await watchlistCollection.updateOne(filter, update, { upsert: true });

        } else if (action === 'remove') {
            const update = { 
                $pull: { 
                    movies: { 
                        tmdbId: tmdbId, 
                        mediaType: mediaType 
                    } 
                } 
            } as any;
            await watchlistCollection.updateOne(filter, update);
        } else {
             return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Watchlist updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('Failed to update watchlist:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
