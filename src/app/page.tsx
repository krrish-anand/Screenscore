
"use client";

import { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import type { MediaItem, Review, MediaType, Genre, WatchProvider, Person, WatchlistItem } from '@/lib/types';
import { MovieInfo } from '@/components/movie-info';
import { PersonDetails } from '@/components/person-details';
import { ReviewForm } from '@/components/review-form';
import { ReviewList } from '@/components/review-list';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonCard } from '@/components/person-card';
import { Chatbot } from '@/components/chatbot';
import { MovieQuiz } from '@/components/movie-quiz';
import { cn } from "@/lib/utils"
import { Search, ArrowLeft, SlidersHorizontal, RotateCcw, X, Check, ChevronsUpDown, Clapperboard, User as UserIcon, Film, Bookmark } from "lucide-react"
import { getPopularMedia, searchMedia, getMediaDetails, getGenreList, discoverMedia, getWatchProviders, getPersonCredits, searchPeople, getPopularPeople, getPersonDetails } from '@/lib/movie-api';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, logout } from '@/lib/session';
import { UserNav } from '@/components/user-nav';


type SearchType = 'media' | 'person';

// Helper to remove duplicate media items by their unique ID
const getUniqueMediaItems = (items: MediaItem[]) => {
  const seen = new Set<string>();
  return items.filter(item => {
    const id = item.id;
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
};


export default function Home() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [personItems, setPersonItems] = useState<Person[]>([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [peoplePage, setPeoplePage] = useState(1);
  const [hasMorePeople, setHasMorePeople] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [releaseYear, setReleaseYear] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('media');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [watchProviders, setWatchProviders] = useState<WatchProvider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const { toast } = useToast();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<(MediaItem | Person)[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [providerPopoverOpen, setProviderPopoverOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [clientLoaded, setClientLoaded] = useState(false);
  const [user, setUser] = useState<{ userId: string, username: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        const data: WatchlistItem[] = await res.json();
        setWatchlist(data.map(item => `${item.mediaType}-${item.tmdbId}`));
      }
    } catch (e) {
      console.error("Could not fetch watchlist", e);
    }
  }, []);

  const fetchInitialMedia = useCallback(async (page = 1) => {
    setIsLoading(true);
    setIsFetchingMore(page > 1);

    startTransition(() => {
      setSelectedMedia(null);
      setSelectedPerson(null);
    });

    try {
      const popularMedia = await getPopularMedia('all', page);
      const shuffledMedia = popularMedia.sort(() => 0.5 - Math.random());
      setMediaItems(prev => getUniqueMediaItems(page === 1 ? shuffledMedia : [...prev, ...shuffledMedia]));
      if (popularMedia.length < 20) {
        setHasMoreMedia(false);
      }
      setMediaPage(page);

    } catch (error) {
       console.error(`Failed to fetch initial media data`, error);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Could not load initial media data.`,
        });
    } finally {
      startTransition(() => {
        setIsLoading(false);
        setIsFetchingMore(false);
      });
    }
  }, [toast]);

  const fetchInitialPeople = useCallback(async (page = 1) => {
    setIsLoading(true);
    setIsFetchingMore(page > 1);

    startTransition(() => {
      setSelectedMedia(null);
      setSelectedPerson(null);
    });
    try {
      const popularPeople = await getPopularPeople(page);
      setPersonItems(prev => page === 1 ? popularPeople : [...prev, ...popularPeople]);
       if (popularPeople.length < 20) {
        setHasMorePeople(false);
      }
      setPeoplePage(page);
    } catch (error) {
       console.error(`Failed to fetch popular people`, error);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Could not load popular people.`,
        });
    } finally {
      startTransition(() => {
        setIsLoading(false);
        setIsFetchingMore(false);
      });
    }
  }, [toast]);

  // Initial data fetch on client-side
  useEffect(() => {
    async function loadInitialData() {
        setClientLoaded(true);
        const session = await getSession();
        if (session && session.user) {
            setUser(session.user);
            fetchWatchlist();
        }

        const mediaId = searchParams.get('mediaId');
        const mediaType = searchParams.get('mediaType') as MediaType;

        if (mediaId && mediaType) {
            const itemDetails = await getMediaDetails(Number(mediaId), mediaType);
            if(itemDetails) setSelectedMedia(itemDetails);
            else fetchInitialMedia(1);
        } else {
            const randomPage = Math.floor(Math.random() * 10) + 1;
            fetchInitialMedia(randomPage);
        }
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchTypeChange = (value: SearchType) => {
    if (value === searchType) return;
    setSearchType(value);
    setSearchQuery('');
    setSuggestions([]);
    const randomPage = Math.floor(Math.random() * 10) + 1;
    if (value === 'media') {
        setPersonItems([]);
        setHasMorePeople(true);
        setPeoplePage(1);
        fetchInitialMedia(randomPage);
    } else {
        setMediaItems([]);
        setHasMoreMedia(true);
        setMediaPage(1);
        fetchInitialPeople(randomPage);
    }
  }

  const handleDiscoverySearch = useCallback(async () => {
    startTransition(() => {
      setIsSearching(true);
      setSelectedMedia(null);
      setSelectedPerson(null);
      setMediaItems([]);
      setMediaPage(1);
      setHasMoreMedia(false); // No pagination for discovery
    });
    
    const yearValue = releaseYear && releaseYear !== 'any-year' ? parseInt(releaseYear) : undefined;
    const langValue = language && language !== 'any-language' ? language : undefined;
    const genreValue = genre && genre !== 'any-genre' ? genre : undefined;
    const providersValue = selectedProviders.length > 0 ? selectedProviders.join('|') : undefined;

    try {
      let results: MediaItem[];
      if (yearValue || langValue || genreValue || providersValue) {
        const movieResults = await discoverMedia('movie', 1, yearValue, langValue, genreValue, providersValue);
        const tvResults = await discoverMedia('tv', 1, yearValue, langValue, genreValue, providersValue);
        results = getUniqueMediaItems([...movieResults, ...tvResults]).sort(() => 0.5 - Math.random());

          if (results.length === 0) {
          toast({
              title: "No Results",
              description: "No items found matching your filters.",
          });
        }
      } else {
        const randomPage = Math.floor(Math.random() * 10) + 1;
        await fetchInitialMedia(randomPage);
        setIsSearching(false); // Manually set searching to false
        return;
      }
      setMediaItems(results);
    } catch (error) {
        console.error("Failed to search", error);
        toast({
            variant: "destructive",
            title: "Search Error",
            description: "An error occurred while searching.",
        });
    } finally {
        startTransition(() => {
          setIsSearching(false);
        });
    }
  }, [releaseYear, language, genre, selectedProviders, toast, fetchInitialMedia]);
  
  const handleFullSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      if (searchType === 'media') {
        fetchInitialMedia(randomPage);
      } else {
        fetchInitialPeople(randomPage);
      }
      return;
    }
    
    startTransition(() => {
      setIsSearching(true);
      setShowSuggestions(false);
      setSelectedMedia(null);
      setSelectedPerson(null);
      setMediaItems([]); // Clear previous media items
      setPersonItems([]); // Clear previous person items
      setMediaPage(1);
      setPeoplePage(1);
      setHasMoreMedia(false);
      setHasMorePeople(false);
    });

    try {
      if (searchType === 'media') {
        const results = await searchMedia(searchQuery);
        setMediaItems(getUniqueMediaItems(results));
        if (results.length === 0) {
          toast({
            title: "No Results",
            description: "No media found matching your search query.",
          });
        }
      } else { // Person search
        const people = await searchPeople(searchQuery);
        setPersonItems(people);
        if (people.length === 0) {
          toast({
            title: "No Results",
            description: "No people found matching your search query.",
          });
        }
      }
    } catch (error) {
      console.error("Failed to search", error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "An error occurred while searching.",
      });
    } finally {
       startTransition(() => {
        setIsSearching(false);
      });
    }
  }, [searchQuery, searchType, toast, fetchInitialMedia, fetchInitialPeople]);
  
  useEffect(() => {
    async function fetchCommonData() {
        try {
            const [movieGenres, tvGenres, movieProviders, tvProviders] = await Promise.all([
                getGenreList('movie'),
                getGenreList('tv'),
                getWatchProviders('movie'),
                getWatchProviders('tv')
            ]);
             setGenres([...movieGenres, ...tvGenres].filter((g, i, self) => i === self.findIndex(t => t.id === g.id)));
             setWatchProviders([...movieProviders, ...tvProviders].filter((p, i, self) => i === self.findIndex(t => t.provider_id === p.provider_id)).sort((a,b) => a.provider_name.localeCompare(b.provider_name)));
        } catch(e) {
             toast({
                variant: "destructive",
                title: "Error",
                description: `Could not load filter data.`,
            });
        }
    }
    fetchCommonData();
  }, [toast]);
  
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    startTransition(() => {
      setIsSearching(true);
    });
    
    try {
      let results: (MediaItem | Person)[];
      if (searchType === 'media') {
        results = await searchMedia(query);
      } else {
        results = await searchPeople(query);
      }

      setSuggestions(results);
      setShowSuggestions(true);

    } catch (error) {
        console.error("Failed to search", error);
        toast({
            variant: "destructive",
            title: "Search Error",
            description: "An error occurred while searching.",
        });
    } finally {
      startTransition(() => {
        setIsSearching(false);
      });
    }
  }, [searchType, toast]);


  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, handleSearch]);
  
  const handleSelectItem = async (item: MediaItem | Person) => {
    setShowSuggestions(false);
    setSearchQuery('');
    
    if ('mediaType' in item) { // It's a MediaItem
        startTransition(() => {
          setIsLoading(true);
          setSelectedMedia(null);
          setSelectedPerson(null);
        });
        try {
            const itemDetails = await getMediaDetails(item.tmdbId, item.mediaType);
            setSelectedMedia(itemDetails);
        } catch (error) {
            console.error("Failed to fetch details", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load item details.",
            });
        } finally {
            startTransition(() => {
              setIsLoading(false);
            });
        }
    } else { // It's a Person
        await handleSelectPerson(item.id);
    }
  };

  const handleSelectPerson = async (personId: number) => {
     startTransition(() => {
      setIsLoading(true);
      setSelectedMedia(null);
      setSelectedPerson(null);
      setMediaItems([]);
      setPersonItems([]);
    });
    try {
        const [personDetails, personCredits] = await Promise.all([
            getPersonDetails(personId),
            getPersonCredits(personId)
        ]);

        if (personDetails) {
            setSelectedPerson(personDetails);
            setMediaItems(getUniqueMediaItems(personCredits));
        } else {
            toast({
                title: "Person Not Found",
                description: "Could not find details for this person."
            });
        }
    } catch(error) {
        console.error("Failed to fetch person details", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Could not load details for this person.`,
        });
    } finally {
        startTransition(() => {
          setIsLoading(false);
        });
    }
  }

  const handleResetFilters = () => {
    setGenre('');
    setReleaseYear('');
    setLanguage('');
    setSelectedProviders([]);
    handleDiscoverySearch();
  };
  
  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId) 
        : [...prev, providerId]
    );
  };

  const averageRating = useMemo(() => {
    if (!selectedMedia || selectedMedia.reviews.length === 0) return 0;
    const total = selectedMedia.reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / selectedMedia.reviews.length;
  }, [selectedMedia]);

  const handleAddReview = async (newReview: Omit<Review, 'id' | 'date' | 'helpfulCount' | 'author' | 'userId'>) => {
    if (!selectedMedia || !user) return;

     try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newReview),
        });
        if (response.ok) {
            const savedReview = await response.json();
            setSelectedMedia(prev => {
                if (!prev) return null;
                const updatedReviews = [savedReview, ...prev.reviews];
                return { ...prev, reviews: updatedReviews };
            });
             toast({
                title: "Review Submitted!",
                description: "Thanks for sharing your thoughts.",
            });
        } else {
            throw new Error('Failed to save review');
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Submission Failed",
            description: "Could not save your review. Please try again.",
        });
    }
  };

  const handleToggleWatchlist = async (mediaItem: MediaItem) => {
    if (!user) {
      router.push('/login');
      return;
    }
    const mediaId = mediaItem.id;
    const isInWatchlist = watchlist.includes(mediaId);
    
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            tmdbId: mediaItem.tmdbId,
            mediaType: mediaItem.mediaType,
            title: mediaItem.title,
            posterUrl: mediaItem.posterUrl,
            releaseYear: mediaItem.releaseYear,
            action: isInWatchlist ? 'remove' : 'add',
        }),
      });

      if (response.ok) {
        const newWatchlist = isInWatchlist
          ? watchlist.filter(id => id !== mediaId)
          : [...watchlist, mediaId];
        setWatchlist(newWatchlist);
        toast({ title: isInWatchlist ? 'Removed from Watchlist' : 'Added to Watchlist' });
      } else {
        throw new Error('Failed to update watchlist');
      }

    } catch(error) {
        toast({
            variant: 'destructive',
            title: "Watchlist Error",
            description: "Could not update your watchlist. Please try again.",
        });
    }
  };

  const handleLoadMoreMedia = async () => {
    const newPage = mediaPage + 1;
    await fetchInitialMedia(newPage);
  }

  const handleLoadMorePeople = async () => {
    const newPage = peoplePage + 1;
    await fetchInitialPeople(newPage);
  }

  const handleWatchlistClick = () => {
    if (user) {
      router.push('/watchlist');
    } else {
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setWatchlist([]);
    router.refresh();
  };
  
  const renderMediaGrid = (items: MediaItem[], title?: string) => (
    <>
        {title && (
            <h2 className="text-3xl font-headline mb-4 flex items-center gap-2">
                <Clapperboard />
                {title}
            </h2>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(item => (
            <Card key={item.id} className="overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105" onClick={() => handleSelectItem(item)}>
            <Image
                src={item.posterUrl}
                alt={`Poster for ${item.title}`}
                width={400}
                height={600}
                className="w-full h-auto object-cover"
                data-ai-hint="movie poster"
            />
            </Card>
        ))}
        </div>
        {!selectedPerson && hasMoreMedia && (
            <div className="text-center mt-8">
                <Button onClick={handleLoadMoreMedia} disabled={isFetchingMore}>
                    {isFetchingMore ? 'Loading...' : 'Load More'}
                </Button>
            </div>
        )}
         {!selectedPerson && !hasMoreMedia && mediaItems.length > 0 && (
          <Footer />
        )}
    </>
  );

  const renderPeopleGrid = () => (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {personItems.map(person => (
          <PersonCard key={person.id} person={person} onSelect={() => handleSelectPerson(person.id)} />
        ))}
      </div>
       {hasMorePeople && (
          <div className="text-center mt-8">
            <Button onClick={handleLoadMorePeople} disabled={isFetchingMore}>
                {isFetchingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
       )}
       {!hasMorePeople && personItems.length > 0 && (
         <Footer />
       )}
    </>
  );
  
  const releaseYears = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  const handleBackToList = () => {
      startTransition(() => {
        setSelectedMedia(null);
        setSelectedPerson(null);
        setSearchQuery('');
        router.replace('/', undefined);
      });
      const randomPage = Math.floor(Math.random() * 10) + 1;
      if (searchType === 'media') {
        fetchInitialMedia(randomPage);
      } else {
        fetchInitialPeople(randomPage);
      }
  }

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <Card className="absolute top-full mt-2 w-full z-10 max-h-80 overflow-y-auto">
        <ul>
          {suggestions.map(item => {
            const isMedia = 'mediaType' in item;
            const key = isMedia ? item.id : `person-${item.id}`;
            const imageSrc = isMedia ? item.posterUrl : ('profileUrl' in item ? item.profileUrl : 'https://placehold.co/40x60.png');
            const title = isMedia ? item.title : item.name;
            const subtitle = isMedia ? String(item.releaseYear) : ('knownFor' in item ? item.knownFor : '');

            return (
              <li 
                key={key}
                className="p-2 hover:bg-muted cursor-pointer flex items-center gap-4"
                onMouseDown={() => handleSelectItem(item)}
              >
                 <Image 
                    src={imageSrc} 
                    alt="" 
                    width={40} 
                    height={60} 
                    className="rounded object-cover"
                    data-ai-hint={isMedia ? "movie poster" : "person photo"}
                  />
                 <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                 </div>
              </li>
            )
          })}
        </ul>
      </Card>
    );
  };
  
  const showMediaGrid = !isLoading && !isPending && mediaItems.length > 0 && searchType === 'media' && !selectedPerson;
  const showPeopleGrid = !isLoading && !isPending && personItems.length > 0 && searchType === 'person' && !selectedPerson;
  const showEmptyState = !isLoading && !isPending && !selectedMedia && !selectedPerson && !showMediaGrid && !showPeopleGrid;

  if (!clientLoaded) {
    return <LoadingSkeleton isGridView={true} />;
  }

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <header className="py-6 px-4 md:px-8 flex justify-between items-center">
        <div className="flex-1">
          {selectedMedia || selectedPerson ? (
              <Button variant="ghost" onClick={handleBackToList}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
              </Button>
          ) : <div/>}
        </div>
        <div className="flex-1 text-center">
          <Link href="/" className="text-4xl font-headline font-bold">ScreenScore</Link>
        </div>
        <div className="flex-1 flex justify-end items-center gap-4">
          {user ? (
            <>
              <Button variant="outline" onClick={handleWatchlistClick}>
                <Bookmark className="mr-2 h-4 w-4" />
                Watchlist
              </Button>
              <UserNav user={user} onLogout={handleLogout} />
            </>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/login">
                Login
              </Link>
            </Button>
          )}
          <ThemeToggleButton />
        </div>
      </header>
      <main className="container mx-auto px-4 pb-12 flex-grow">
      {!selectedMedia && !selectedPerson && (
        <>
          <div className="text-center my-8">
            <h1 className="text-4xl font-headline">Welcome to ScreenScore</h1>
            <p className="text-lg text-muted-foreground mt-2">Discover and review your next favorite movie or TV show.</p>
          </div>
          <Card className="p-4 mb-8">
              <Tabs value={searchType} onValueChange={(value) => handleSearchTypeChange(value as SearchType)} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="media"><Clapperboard className="mr-2 h-4 w-4" />Media</TabsTrigger>
                  <TabsTrigger value="person"><UserIcon className="mr-2 h-4 w-4"/>People</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Input
                    type="search"
                    placeholder={`Search for ${searchType}...`}
                    className="w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(searchQuery.length > 0 && suggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay hiding to allow click
                  />
                  {renderSuggestions()}
                </div>
                {searchType === 'media' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="shrink-0">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filters
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-screen max-w-xs sm:max-w-sm md:max-w-md">
                      <div className="grid gap-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Filters</h4>
                            <p className="text-sm text-muted-foreground">
                              Filter by genre, year, and language.
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={handleResetFilters} className="shrink-0">
                              <RotateCcw className="h-4 w-4" />
                              <span className="sr-only">Reset Filters</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select onValueChange={setGenre} value={genre}>
                            <SelectTrigger>
                              <SelectValue placeholder="Genre" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any-genre">Any Genre</SelectItem>
                              {genres.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select onValueChange={setReleaseYear} value={releaseYear}>
                            <SelectTrigger>
                              <SelectValue placeholder="Release Year" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any-year">Any Year</SelectItem>
                              {releaseYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select onValueChange={setLanguage} value={language}>
                            <SelectTrigger>
                              <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any-language">Any Language</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="ja">Japanese</SelectItem>
                            </SelectContent>
                          </Select>
                          
                            <Popover open={providerPopoverOpen} onOpenChange={setProviderPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={providerPopoverOpen}
                                    className="justify-between"
                                    >
                                    {selectedProviders.length > 0
                                        ? `${selectedProviders.length} selected`
                                        : "Available on"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <Command>
                                        <CommandInput placeholder="Search platforms..." />
                                        <CommandList>
                                            <CommandEmpty>No platforms found.</CommandEmpty>
                                            <CommandGroup>
                                                {watchProviders.map((provider) => (
                                                <CommandItem
                                                    key={provider.provider_id}
                                                    value={String(provider.provider_id)}
                                                    onSelect={(currentValue) => {
                                                      handleProviderToggle(String(provider.provider_id));
                                                    }}
                                                >
                                                    <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedProviders.includes(String(provider.provider_id)) ? "opacity-100" : "opacity-0"
                                                    )}
                                                    />
                                                    <Image src={provider.logo_path} alt={provider.provider_name} width={24} height={24} className="mr-2 rounded-sm" />
                                                    {provider.provider_name}
                                                </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button onClick={handleDiscoverySearch} disabled={isPending || isLoading}>
                            Apply Filters
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                <Button onClick={handleFullSearch} disabled={isPending || isLoading} className="w-full md:w-auto shrink-0">
                  <Search className="mr-2 h-4 w-4" /> {isPending || isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </Card>
        </>
      )}
        {(isLoading || isPending || isSearching) && <LoadingSkeleton isGridView={!selectedMedia && !selectedPerson} />}

        {!isLoading && !isPending && !isSearching && (
            <>
            {selectedMedia ? (
                <>
                    <MovieInfo 
                      movie={selectedMedia} 
                      averageRating={averageRating} 
                      reviewCount={selectedMedia.reviews.length}
                      watchlist={watchlist}
                      onToggleWatchlist={handleToggleWatchlist}
                      onSelectCastMember={(id) => handleSelectPerson(id)}
                    />
                    <Separator className="my-8 md:my-12" />
                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        <div className="md:col-span-1">
                            <ReviewForm 
                                movie={selectedMedia}
                                onSubmitReview={handleAddReview} 
                                user={user}
                                onLogin={() => router.push('/login')}
                             />
                        </div>
                        <div className="md:col-span-2">
                            <ReviewList reviews={selectedMedia.reviews} />
                        </div>
                    </div>
                </>
            ) : selectedPerson ? (
                <>
                    <PersonDetails person={selectedPerson} />
                    <Separator className="my-8 md:my-12" />
                    {renderMediaGrid(mediaItems, "Known For")}
                </>
            ) : showMediaGrid ? (
                 renderMediaGrid(mediaItems)
            ) : showPeopleGrid ? (
                renderPeopleGrid()
            ) : showEmptyState ? (
                 <div className="text-center py-16 bg-card rounded-lg shadow-sm">
                    <h3 className="text-xl font-headline">No items found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
                </div>
            ) : null}
            </>
        )}
      </main>
      <Chatbot />
      {!selectedMedia && !selectedPerson && <MovieQuiz onSelectMovie={handleSelectItem} />}
    </div>
  );
}

const LoadingSkeleton = ({ isGridView = false }: { isGridView?: boolean }) => {
  if (isGridView) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
        {[...Array(10)].map((_, i) => (
           <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse">
       <Card className="overflow-hidden">
        <div className="grid md:grid-cols-3">
           <Skeleton className="h-[400px] md:h-auto aspect-[2/3] w-full" />
           <div className="md:col-span-2 p-6 space-y-4">
             <Skeleton className="h-10 w-3/4" />
             <Skeleton className="h-6 w-1/4" />
             <div className="flex items-center gap-4 pt-2">
               <Skeleton className="h-6 w-28" />
               <Skeleton className="h-6 w-20" />
             </div>
             <div className="space-y-2 pt-4">
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-5/6" />
             </div>
             <div className="flex gap-2 pt-4">
               <Skeleton className="h-8 w-20 rounded-full" />
               <Skeleton className="h-8 w-24 rounded-full" />
             </div>
              <div className="flex gap-2 pt-4">
                 <Skeleton className="h-10 w-10 rounded-md" />
                 <Skeleton className="h-10 w-10 rounded-md" />
                 <Skeleton className="h-10 w-10 rounded-md" />
               </div>
           </div>
        </div>
      </Card>
       <Separator className="my-8 md:my-12" />
       <div className="grid md:grid-cols-3 gap-8 md:gap-12">
         <div className="md:col-span-1">
           <Skeleton className="h-96 w-full rounded-lg" />
         </div>
         <div className="md:col-span-2 space-y-4">
           <Skeleton className="h-40 w-full rounded-lg" />
           <Skeleton className="h-40 w-full rounded-lg" />
         </div>
       </div>
    </div>
  )
};

const Footer = () => (
    <footer className="text-center py-16 text-muted-foreground border-t mt-12">
         <Film className="mx-auto h-12 w-12 mb-4" />
        <p className="font-headline text-lg">"Cinema is a matter of what's in the frame and what's out"</p>
        <p className="text-sm mt-1">- Martin Scorsese</p>
        <p className="text-xs mt-8">You've reached the end of the list. Happy exploring!</p>
    </footer>
);

    