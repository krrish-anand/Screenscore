
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    // Let the driver use the default database from the connection string
    const db = client.db(); 
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ $or: [{ email: email }, { username: username }] });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email or username already exists' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user according to the provided schema
    const newUser = {
      username,
      email,
      passwordHash,
      joinDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json({ message: 'User created successfully', userId: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
