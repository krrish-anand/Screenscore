
'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

interface SessionPayload {
  userId: string;
  username: string;
  expiresAt: Date;
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Token expires in 1 hour
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This could be because the token is expired or invalid
    console.log('JWT Decryption Error:', error);
    return null;
  }
}

export async function createSession(userId: string, username: string) {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const session = await encrypt({ userId, username, expires });

  // Save the session in a cookie
  cookies().set('session', session, {
    expires,
    httpOnly: true,
    path: '/',
  });
}

export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  const payload = await decrypt(sessionCookie);
  if (!payload) return null;

  return {
    isLoggedIn: true,
    user: {
      userId: payload.userId,
      username: payload.username,
    },
  };
}

export async function logout() {
  // Destroy the session
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}
