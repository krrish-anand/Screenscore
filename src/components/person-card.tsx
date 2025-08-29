
"use client";

import type { Person } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  onSelect: (id: number) => void;
}

export function PersonCard({ person, onSelect }: PersonCardProps) {
  return (
    <Card className="overflow-hidden transform transition-transform duration-200 hover:scale-105">
      <button onClick={() => onSelect(person.id)} className="w-full text-left">
        <Image
          src={person.profileUrl}
          alt={`Photo of ${person.name}`}
          width={185}
          height={278}
          className="w-full h-auto object-cover"
          data-ai-hint="person photo"
        />
        <CardContent className="p-2">
          <p className="font-bold text-sm truncate">{person.name}</p>
          <p className="text-xs text-muted-foreground truncate">{person.knownFor}</p>
        </CardContent>
      </button>
    </Card>
  );
}
