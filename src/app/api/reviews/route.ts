
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/session';
import { ObjectId } from 'mongodb';

// GET reviews for a movie
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tmdbId = searchParams.get('tmdbId');
    const mediaType = searchParams.get('mediaType');

    if (!tmdbId || !mediaType) {
        return NextResponse.json({ message: 'Missing tmdbId or mediaType' }, { status: 400 });
    }

    try {
        const client = await clientPromise;
        const db = client.db();
        const reviewsCollection = db.collection('reviews');
        
        const reviews = await reviewsCollection.find({ 
            tmdbId: parseInt(tmdbId),
            mediaType: mediaType 
        }).sort({ reviewDate: -1 }).toArray();
        
        const reviewsWithUser = await Promise.all(reviews.map(async (review) => {
            const user = await db.collection('users').findOne({ _id: new ObjectId(review.userId) });
            return {
                id: review._id.toString(),
                userId: review.userId.toString(),
                author: user ? user.username : 'Anonymous',
                date: review.reviewDate,
                rating: review.rating,
                text: review.reviewText,
                helpfulCount: review.helpfulCount || 0,
                tmdbId: review.tmdbId,
                mediaType: review.mediaType,
            }
        }));

        return NextResponse.json(reviewsWithUser, { status: 200 });

    } catch (error) {
        console.error('Failed to fetch reviews:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}


// POST a new review
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.isLoggedIn || !session.user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tmdbId, mediaType, rating, text } = body;

        if (!tmdbId || !mediaType || rating === undefined || !text) {
            return NextResponse.json({ message: 'Missing required review fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const reviewsCollection = db.collection('reviews');

        const newReview = {
            userId: new ObjectId(session.user.userId),
            tmdbId,
            mediaType,
            rating,
            reviewText: text,
            reviewDate: new Date().toISOString(),
            helpfulCount: 0,
        };

        const result = await reviewsCollection.insertOne(newReview);
        
        const savedReview = {
            id: result.insertedId.toString(),
            userId: newReview.userId.toString(),
            author: session.user.username,
            date: newReview.reviewDate,
            rating: newReview.rating,
            text: newReview.reviewText,
            helpfulCount: newReview.helpfulCount,
            tmdbId: newReview.tmdbId,
            mediaType: newReview.mediaType
        };

        return NextResponse.json(savedReview, { status: 201 });

    } catch (error) {
        console.error('Failed to create review:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
