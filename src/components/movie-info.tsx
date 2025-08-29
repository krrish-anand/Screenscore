
import type { MediaItem, WatchProvider, CastMember } from '@/lib/types';
import Image from 'next/image';
import { StarRating } from './star-rating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, CheckCircle, PlaySquare, Users } from 'lucide-react';
import Link from 'next/link';

interface MovieInfoProps {
  movie: MediaItem;
  averageRating: number;
  reviewCount: number;
  watchlist: string[];
  onToggleWatchlist: (movie: MediaItem) => void;
  onSelectCastMember: (castMemberId: number) => void;
}

export function MovieInfo({ movie, averageRating, reviewCount, watchlist, onToggleWatchlist, onSelectCastMember }: MovieInfoProps) {
  const isInWatchlist = watchlist.includes(movie.id);
  
  return (
    <>
      <Card className="overflow-hidden shadow-lg">
        <div className="grid md:grid-cols-3">
          <div className="md:col-span-1 relative">
            <Image
              src={movie.posterUrl}
              alt={`Poster for ${movie.title}`}
              width={400}
              height={600}
              className="w-full h-full object-cover"
              priority
              data-ai-hint="movie poster"
            />
          </div>
          <div className="md:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-3xl md:text-4xl lg:text-5xl">{movie.title}</CardTitle>
              <CardDescription className="text-base md:text-lg text-muted-foreground pt-1">{movie.releaseYear}</CardDescription>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                <StarRating rating={averageRating} readOnly />
                <span className="text-muted-foreground text-sm">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <p className="text-foreground/90">{movie.description}</p>
              <div className="flex flex-wrap gap-2">
                {movie.genres.map(genre => (
                  <Badge key={genre} variant="secondary" className="font-medium">{genre}</Badge>
                ))}
              </div>
               {movie.watchProviders && movie.watchProviders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Available to stream on:</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.watchProviders.map(provider => (
                      <div key={provider.provider_id} className="p-1 bg-muted rounded-md" title={provider.provider_name}>
                        <Image 
                          src={provider.logo_path} 
                          alt={provider.provider_name}
                          width={32}
                          height={32}
                          className="rounded-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button variant={isInWatchlist ? "secondary" : "default"} onClick={() => onToggleWatchlist(movie)}>
                {isInWatchlist ? <CheckCircle className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>
               {movie.trailerUrl && (
                <Button variant="outline" asChild>
                  <Link href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">
                    <PlaySquare className="mr-2 h-4 w-4" />
                    Watch Trailer
                  </Link>
                </Button>
              )}
            </CardFooter>
          </div>
        </div>
      </Card>
      
      {movie.cast && movie.cast.length > 0 && (
        <div className="mt-8">
            <h2 className="text-3xl font-headline mb-4 flex items-center gap-2">
              <Users />
              Top Billed Cast
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movie.cast.map(member => (
                    <Card key={member.id} className="text-center overflow-hidden transform transition-transform duration-200 hover:scale-105">
                       <button onClick={() => onSelectCastMember(member.id)} className="w-full text-left">
                        <Image
                            src={member.profileUrl}
                            alt={member.name}
                            width={185}
                            height={278}
                            className="w-full h-auto object-cover"
                            data-ai-hint="person photo"
                        />
                        <CardContent className="p-2">
                            <p className="font-bold text-sm truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.character}</p>
                        </CardContent>
                      </button>
                    </Card>
                ))}
            </div>
        </div>
      )}
    </>
  );
}
