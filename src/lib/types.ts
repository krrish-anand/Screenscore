

export interface Review {
  id: string; // Corresponds to _id in MongoDB
  userId: string;
  author: string;
  date: string; // reviewDate in schema
  rating: number;
  text: string; // reviewText in schema
  helpfulCount: number;
  tmdbId: number; // To associate review with a movie
  mediaType: MediaType;
}

export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface WatchProvider {
    provider_id: number;
    provider_name: string;
    logo_path: string;
    display_priority: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string;
}

export interface MediaItem {
  id: string; // Combination of mediaType and tmdbId
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  description: string;
  posterUrl: string;
  releaseYear: number;
  genres: string[];
  reviews: Review[];
  cast: CastMember[];
  backdropUrl?: string;
  trailerUrl?: string;
  watchProviders?: WatchProvider[];
}

export interface Person {
  id: number;
  name: string;
  profileUrl: string;
  knownFor: string;
  biography?: string;
  birthday?: string | null;
  placeOfBirth?: string | null;
}

export interface WatchlistItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterUrl: string;
  releaseYear: number;
  addedDate: string;
}
