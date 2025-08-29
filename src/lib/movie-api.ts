

'use server';
import type { MediaItem, Review, MediaType, Genre, WatchProvider, CastMember, Person } from './types';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not defined in your environment variables');
}

interface TmdbMedia {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string; // For movies
  first_air_date?: string; // For TV shows
  genre_ids: number[];
  genres?: TmdbGenre[];
  media_type?: MediaType; // from person credits
  popularity: number;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbVideo {
    iso_639_1: string;
    iso_3166_1: string;
    name: string;
    key: string;
    site: string;
    size: number;
    type: string;
    official: boolean;
    published_at: string;
    id: string;
}

interface TmdbWatchProvider {
    provider_id: number;
    provider_name: string;
    logo_path: string;
    display_priority: number;
}

interface TmdbCastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string;
}

interface TmdbPerson {
    id: number;
    name: string;
    profile_path: string;
    known_for_department: string;
    known_for: TmdbMedia[];
    biography?: string;
    birthday?: string | null;
    place_of_birth?: string | null;
}


let movieGenreMap: Map<number, string> | null = null;
let tvGenreMap: Map<number, string> | null = null;

async function getGenreMap(mediaType: MediaType | 'all'): Promise<Map<number, string>> {
  if (mediaType === 'all') {
      const [movieMap, tvMap] = await Promise.all([getGenreMap('movie'), getGenreMap('tv')]);
      return new Map([...movieMap, ...tvMap]);
  }

  const isMovie = mediaType === 'movie';
  if (isMovie && movieGenreMap) {
    return movieGenreMap;
  }
  if (!isMovie && tvGenreMap) {
    return tvGenreMap;
  }

  try {
    const url = `${TMDB_API_BASE_URL}/genre/${mediaType}/list?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${mediaType} genres: ${response.statusText}`);
    }
    const data = await response.json();
    const newGenreMap = new Map(data.genres.map((genre: TmdbGenre) => [genre.id, genre.name]));
    
    if (isMovie) {
      movieGenreMap = newGenreMap;
    } else {
      tvGenreMap = newGenreMap;
    }
    return newGenreMap;
  } catch (error) {
    console.error(`Error fetching ${mediaType} genres:`, error);
    return new Map();
  }
}

export async function getGenreList(mediaType: MediaType): Promise<Genre[]> {
    try {
        const url = `${TMDB_API_BASE_URL}/genre/${mediaType}/list?api_key=${TMDB_API_KEY}&language=en-US`;
        const response = await fetch(url, { next: { revalidate: 3600 * 24 } });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${mediaType} genres: ${response.statusText}`);
        }
        const data = await response.json();
        return data.genres;
    } catch (error) {
        console.error(`Error fetching ${mediaType} genres:`, error);
        return [];
    }
}

export async function getWatchProviders(mediaType: MediaType): Promise<WatchProvider[]> {
    try {
        const url = `${TMDB_API_BASE_URL}/watch/providers/${mediaType}?api_key=${TMDB_API_KEY}&language=en-US&watch_region=IN`;
        const response = await fetch(url, { next: { revalidate: 3600 * 24 } });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${mediaType} providers: ${response.statusText}`);
        }
        const data = await response.json();
        // Sort by display priority, then by name
        return data.results
            .map((p: TmdbWatchProvider) => ({...p, logo_path: `${TMDB_IMAGE_BASE_URL}/w92${p.logo_path}`}))
            .sort((a: TmdbWatchProvider, b: TmdbWatchProvider) => {
                if (a.display_priority < b.display_priority) return -1;
                if (a.display_priority > b.display_priority) return 1;
                return a.provider_name.localeCompare(b.provider_name);
            });
    } catch (error) {
        console.error(`Error fetching ${mediaType} providers:`, error);
        return [];
    }
}


function tmdbMediaToAppMedia(tmdbMedia: TmdbMedia, genres: Map<number, string>, mediaType: MediaType): MediaItem {
    const itemMediaType = tmdbMedia.media_type || mediaType;
    const releaseDate = itemMediaType === 'movie' ? tmdbMedia.release_date : tmdbMedia.first_air_date;
    const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : 0;
    
    let mediaGenres: string[] = [];
    if (tmdbMedia.genres) {
        mediaGenres = tmdbMedia.genres.map(g => g.name);
    } else if (tmdbMedia.genre_ids) {
        mediaGenres = tmdbMedia.genre_ids.map(id => genres.get(id) || '').filter(Boolean)
    }

    return {
        id: `${itemMediaType}-${tmdbMedia.id}`,
        tmdbId: tmdbMedia.id,
        mediaType: itemMediaType,
        title: tmdbMedia.title || tmdbMedia.name || 'Unknown Title',
        description: tmdbMedia.overview,
        posterUrl: tmdbMedia.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${tmdbMedia.poster_path}` : 'https://placehold.co/400x600.png',
        backdropUrl: tmdbMedia.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${tmdbMedia.backdrop_path}` : undefined,
        releaseYear: releaseYear,
        genres: mediaGenres,
        reviews: [],
        cast: [],
    };
}

function tmdbPersonToAppPerson(person: TmdbPerson): Person {
    return {
        id: person.id,
        name: person.name,
        profileUrl: person.profile_path ? `${TMDB_IMAGE_BASE_URL}/w185${person.profile_path}` : 'https://placehold.co/185x278.png',
        knownFor: person.known_for?.map(m => m.title || m.name).join(', ') || person.known_for_department,
        biography: person.biography,
        birthday: person.birthday,
        placeOfBirth: person.place_of_birth
    };
}

export async function searchMedia(query: string, page: number = 1): Promise<MediaItem[]> {
  try {
    const genres = await getGenreMap('all');
    let url = `${TMDB_API_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('TMDb API Error:', errorData);
      throw new Error(`Failed to search media: ${response.statusText}`);
    }
    const data = await response.json();
    const filteredResults = data.results.filter((item: TmdbMedia) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path);
    return filteredResults.map((item: TmdbMedia) => tmdbMediaToAppMedia(item, genres, item.media_type || 'movie'));
  } catch (error) {
    console.error(`Error in searchMedia:`, error);
    return [];
  }
}

export async function searchPeople(query: string): Promise<Person[]> {
    try {
        const url = `${TMDB_API_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('TMDb API Error:', errorData);
            throw new Error(`Failed to search people: ${response.statusText}`);
        }
        const data = await response.json();
        return data.results.slice(0, 20).map((person: TmdbPerson) => tmdbPersonToAppPerson(person));
    } catch (error) {
        console.error('Error in searchPeople:', error);
        return [];
    }
}


export async function discoverMedia(mediaType: MediaType, page: number = 1, year?: number, language?: string, genreId?: string, providerIds?: string): Promise<MediaItem[]> {
    try {
        const genres = await getGenreMap(mediaType);
        let url = `${TMDB_API_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&page=${page}`;
        
        if (year) {
            const yearParam = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
            url += `&${yearParam}=${year}`;
        }
        if (language) {
            url += `&with_original_language=${language}`;
        }
        if (genreId) {
            url += `&with_genres=${genreId}`;
        }
        if(providerIds) {
            url += `&with_watch_providers=${providerIds}&watch_region=IN`
        }
        url += '&sort_by=popularity.desc';

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('TMDb API Error:', errorData);
            throw new Error(`Failed to discover ${mediaType}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.results.map((item: TmdbMedia) => tmdbMediaToAppMedia(item, genres, mediaType));
    } catch (error) {
        console.error(`Error in discoverMedia (${mediaType}):`, error);
        return [];
    }
}

export async function getPopularMedia(mediaType: 'movie' | 'tv' | 'all', page: number = 1): Promise<MediaItem[]> {
    if (mediaType === 'all') {
        const [movies, tvShows] = await Promise.all([
            getPopularMedia('movie', page),
            getPopularMedia('tv', page)
        ]);
        // Interleave and shuffle movies and TV shows for variety, then take 20
        const combined = [...movies, ...tvShows].sort(() => 0.5 - Math.random());
        return combined.slice(0, 20);
    }
    try {
        const genres = await getGenreMap(mediaType);
        const response = await fetch(`${TMDB_API_BASE_URL}/${mediaType}/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}&watch_region=IN`);
        if (!response.ok) {
            throw new Error(`Failed to fetch popular ${mediaType}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.results.map((item: TmdbMedia) => tmdbMediaToAppMedia(item, genres, mediaType));
    } catch (error) {
        console.error(`Error fetching popular ${mediaType}:`, error);
        return [];
    }
}

export async function getPopularPeople(page: number = 1): Promise<Person[]> {
    try {
        const url = `${TMDB_API_BASE_URL}/person/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch popular people: ${response.statusText}`);
        }
        const data = await response.json();
        return data.results.map((person: TmdbPerson) => tmdbPersonToAppPerson(person));
    } catch (error) {
        console.error('Error fetching popular people:', error);
        return [];
    }
}

async function getReviewsForMedia(tmdbId: number, mediaType: MediaType): Promise<Review[]> {
    try {
        const client = await clientPromise;
        const db = client.db();
        const reviewsCollection = db.collection('reviews');
        
        const reviews = await reviewsCollection.find({ 
            tmdbId: tmdbId,
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

        return reviewsWithUser;

    } catch (error) {
        console.error('Failed to fetch reviews from DB:', error);
        return [];
    }
}


export async function getMediaDetails(mediaId: number, mediaType: MediaType): Promise<MediaItem | null> {
    try {
        const genres = await getGenreMap(mediaType);
        const [detailsResponse, reviews] = await Promise.all([
             fetch(`${TMDB_API_BASE_URL}/${mediaType}/${mediaId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,watch/providers`),
             getReviewsForMedia(mediaId, mediaType)
        ]);

        if (!detailsResponse.ok) {
            throw new Error(`Failed to fetch ${mediaType} details: ${detailsResponse.statusText}`);
        }
        const data = await detailsResponse.json();
        
        const tmdbMedia: TmdbMedia = data;

        const mediaItem = tmdbMediaToAppMedia(tmdbMedia, genres, mediaType);
        mediaItem.reviews = reviews;

        // Trailer
        if (data.videos && data.videos.results) {
            const trailer = data.videos.results.find(
                (video: TmdbVideo) => video.site === 'YouTube' && video.type === 'Trailer'
            );
            if (trailer) {
                mediaItem.trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
            }
        }
        
        // Watch Providers
        if (data['watch/providers'] && data['watch/providers'].results.IN && data['watch/providers'].results.IN.flatrate) {
             mediaItem.watchProviders = data['watch/providers'].results.IN.flatrate.map((p: TmdbWatchProvider) => ({
                ...p,
                logo_path: `${TMDB_IMAGE_BASE_URL}/w92${p.logo_path}`
            }));
        }
        
        // Cast
        if (data.credits && data.credits.cast) {
            mediaItem.cast = data.credits.cast.slice(0, 10).map((member: TmdbCastMember): CastMember => ({
                id: member.id,
                name: member.name,
                character: member.character,
                profileUrl: member.profile_path ? `${TMDB_IMAGE_BASE_URL}/w185${member.profile_path}` : 'https://placehold.co/185x278.png'
            }));
        }


        return mediaItem;

    } catch (error) {
        console.error(`Error fetching ${mediaType} details:`, error);
        return null;
    }
}

export async function getPersonDetails(personId: number): Promise<Person | null> {
    try {
        const response = await fetch(`${TMDB_API_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch person details: ${response.statusText}`);
        }
        const data: TmdbPerson = await response.json();
        
        const person = tmdbPersonToAppPerson(data);
        // Use a larger profile image for the details view
        person.profileUrl = data.profile_path ? `${TMDB_IMAGE_BASE_URL}/w500${data.profile_path}` : 'https://placehold.co/500x750.png';

        return person;
    } catch (error) {
        console.error(`Error fetching person details:`, error);
        return null;
    }
}

export async function getPersonCredits(personId: number): Promise<MediaItem[]> {
    try {
        const allGenres = await getGenreMap('all');

        const response = await fetch(`${TMDB_API_BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch person credits: ${response.statusText}`);
        }
        const data = await response.json();

        const credits: TmdbMedia[] = data.cast.filter(
            (item: TmdbMedia) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
        );

        return credits
            .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
            .slice(0, 20)
            .map((item: TmdbMedia) => tmdbMediaToAppMedia(item, allGenres, item.media_type!));
    } catch (error) {
        console.error(`Error fetching person credits:`, error);
        return [];
    }
}
