import { StoryWorld } from '../types';

// These are placeholder URLs for the "Premium Story Cover" feature.
// In a real production app, you would upload the generated images to your Supabase Storage
// and replace these URLs with your actual public URLs.
export const THEME_IMAGES: Record<StoryWorld, string[]> = {
  magical_forest: [
    'https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?q=80&w=1000&auto=format&fit=crop', // Forest path
    'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1000&auto=format&fit=crop', // Forest trees
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1000&auto=format&fit=crop', // Mystical forest
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1000&auto=format&fit=crop', // Nature detail
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop', // Sunlight in woods
  ],
  space_adventure: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop', // Earth from space
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1000&auto=format&fit=crop', // Astronaut
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop', // Nebula
    'https://images.unsplash.com/photo-1541185933-710f509261da?q=80&w=1000&auto=format&fit=crop', // Rocket/Space
    'https://images.unsplash.com/photo-1516339901601-2e1b87046c69?q=80&w=1000&auto=format&fit=crop', // Digital space art
  ],
  underwater_kingdom: [
    'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=1000&auto=format&fit=crop', // Underwater coral
    'https://images.unsplash.com/photo-1582967788606-a171f1080ca8?q=80&w=1000&auto=format&fit=crop', // Fish and coral
    'https://images.unsplash.com/photo-1566315637341-38e44b36d081?q=80&w=1000&auto=format&fit=crop', // Blue ocean water
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000&auto=format&fit=crop', // Scuba view
    'https://images.unsplash.com/photo-1682686581854-5e71f58e7e3f?q=80&w=1000&auto=format&fit=crop', // Deep sea
  ],
};

export const getRandomThemeImage = (theme: StoryWorld): string => {
  const images = THEME_IMAGES[theme];
  if (!images || images.length === 0) return ''; // Fallback or placeholder
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

