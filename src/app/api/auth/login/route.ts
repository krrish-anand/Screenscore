
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use the default database from the connection string
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Create session
    await createSession(user._id.toString(), user.username);

    return NextResponse.json({ 
        message: 'Login successful', 
        user: { userId: user._id.toString(), username: user.username } 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
