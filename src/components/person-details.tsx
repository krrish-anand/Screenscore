
import type { Person } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

interface PersonDetailsProps {
  person: Person;
}

export function PersonDetails({ person }: PersonDetailsProps) {
  
  return (
      <Card className="overflow-hidden shadow-lg">
        <div className="grid md:grid-cols-3">
          <div className="md:col-span-1 relative">
            <Image
              src={person.profileUrl}
              alt={`Photo of ${person.name}`}
              width={500}
              height={750}
              className="w-full h-full object-cover"
              priority
              data-ai-hint="person photo"
            />
          </div>
          <div className="md:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-3xl md:text-4xl lg:text-5xl">{person.name}</CardTitle>
              {person.birthday && (
                <CardDescription className="text-base md:text-lg text-muted-foreground pt-1">
                    Born {format(new Date(person.birthday), 'MMMM d, yyyy')}
                    {person.placeOfBirth && ` in ${person.placeOfBirth}`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div className="prose dark:prose-invert max-h-96 overflow-y-auto">
                <h3 className="font-headline text-xl mb-2">Biography</h3>
                <p className="text-foreground/90 whitespace-pre-wrap">
                    {person.biography || "No biography available."}
                </p>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
  );
}
