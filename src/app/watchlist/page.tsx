
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { WatchlistItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, Bookmark, Film } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getSession } from '@/lib/session';

export default function WatchlistPage() {
    const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<{ username: string } | null>(null);

    const fetchWatchlist = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/watchlist');
            if (!res.ok) throw new Error('Failed to fetch watchlist');
            const data = await res.json();
            setWatchlistItems(data);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: 'Could not fetch your watchlist.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        const checkSessionAndFetch = async () => {
            const session = await getSession();
            if (!session?.isLoggedIn) {
                router.push('/login');
                return;
            }
            setUser(session.user);
            fetchWatchlist();
        };

        checkSessionAndFetch();

    }, [router, fetchWatchlist]);

    const handleRemoveFromWatchlist = async (item: WatchlistItem) => {
        try {
            const res = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tmdbId: item.tmdbId, 
                    mediaType: item.mediaType,
                    action: 'remove' 
                })
            });

            if (res.ok) {
                 setWatchlistItems(prev => prev.filter(i => i.tmdbId !== item.tmdbId));
                 toast({ title: "Removed from Watchlist" });
            } else {
                throw new Error('Failed to remove item');
            }
        } catch(error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove item from watchlist.'
            })
        }
    };
    
    if (!user) {
        return (
             <div className="bg-background min-h-screen flex items-center justify-center">
                <p>Loading and checking authentication...</p>
             </div>
        )
    }

    if (isLoading) {
        return (
            <div className="bg-background min-h-screen">
                <header className="py-6 px-4 md:px-8 flex justify-between items-center border-b">
                    <Button variant="ghost" onClick={() => router.push('/')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to browse
                    </Button>
                    <Link href="/" className="text-4xl font-headline text-center font-bold">ScreenScore</Link>
                    <div className="w-24" />
                </header>
                <main className="container mx-auto px-4 py-8">
                    <h1 className="text-4xl font-headline mb-8 text-center">My Watchlist</h1>
                    <div className="text-center">
                        <p className="text-lg animate-pulse">Loading your saved items...</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="bg-background min-h-screen">
             <header className="py-6 px-4 md:px-8 flex justify-between items-center border-b">
                 <Button variant="ghost" onClick={() => router.push('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to browse
                </Button>
                <Link href="/" className="text-4xl font-headline text-center font-bold">ScreenScore</Link>
                <div className="w-24" />
            </header>
            <main className="container mx-auto px-4 pb-12">
                <div className="flex justify-center items-center my-8 gap-2">
                    <Bookmark className="h-8 w-8"/>
                    <h1 className="text-4xl font-headline text-center">My Watchlist</h1>
                </div>

                {watchlistItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {watchlistItems.map(item => (
                            <Card key={`${item.mediaType}-${item.tmdbId}`} className="overflow-hidden group relative">
                                <Link href={`/?mediaId=${item.tmdbId}&mediaType=${item.mediaType}`} className="block cursor-pointer">
                                    <Image
                                        src={item.posterUrl}
                                        alt={`Poster for ${item.title}`}
                                        width={400}
                                        height={600}
                                        className="w-full h-auto object-cover transition-opacity group-hover:opacity-75"
                                    />
                                </Link>
                                 <div className="absolute top-0 right-0 p-1">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveFromWatchlist(item)}
                                        aria-label="Remove from watchlist"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardContent className="p-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-12">
                                    <p className="font-bold truncate text-white">{item.title}</p>
                                    <p className="text-sm text-white/80">{item.releaseYear}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-card rounded-lg shadow-sm">
                        <Film className="mx-auto h-12 w-12 mb-4 text-muted-foreground"/>
                        <h3 className="text-xl font-headline">Your Watchlist is Empty</h3>
                        <p className="text-muted-foreground mt-2 mb-4">Add some movies and TV shows to get started.</p>
                        <Button asChild>
                            <Link href="/">Browse Items</Link>
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
