import { StoryWorld } from '../types';

// These are placeholder URLs for the "Premium Story Cover" feature.
// In a real production app, you would upload the generated images to your Supabase Storage
// and replace these URLs with your actual public URLs.
export const THEME_IMAGES: Record<StoryWorld, string[]> = {
  magical_forest: [
    'https://rsuvadstvhxvxjxoydnb.supabase.co/storage/v1/object/public/stories/forest/a-whimsical-magical-forest-path-winding-through-an%20(3).png', // Forest path
    'https://rsuvadstvhxvxjxoydnb.supabase.co/storage/v1/object/public/stories/forest/a-whimsical-magical-forest-path-winding-through-an.png', // Forest trees
  ],
  space_adventure: [
    'https://rsuvadstvhxvxjxoydnb.supabase.co/storage/v1/object/public/stories/space/-view-from-inside-a-futuristic-but-friendly-spaces%20(1).png', // Earth from space
    'https://rsuvadstvhxvxjxoydnb.supabase.co/storage/v1/object/public/stories/space/-view-from-inside-a-futuristic-but-friendly-spaces.png', // Astronaut
    'https://rsuvadstvhxvxjxoydnb.supabase.co/storage/v1/object/public/stories/space/alien-planet-with-friendly-alients-and-a-colorful-%20(1).png', // Nebula
    'https://rsuvadstvhxvxjxoydnb.supabase.co/storage/v1/object/public/stories/space/alien-planet-with-friendly-alients-and-a-colorful-.png', // Rocket/Space
  ],
  underwater_kingdom: [
    'https://rsuvadstvhxvxjxoydnb.supabase.co/storage/v1/object/public/stories/ocean/a-vibrant-underwater-coral-reef-teeming-with-life-%20(1).png', // Underwater coral
    'https://rsuvadstvhxvxjxoydnb.supabase.co/storage/v1/object/public/stories/ocean/a-vibrant-underwater-coral-reef-teeming-with-life-.png', // Fish and coral
  ],
};

export const getRandomThemeImage = (theme: StoryWorld): string => {
  const images = THEME_IMAGES[theme];
  if (!images || images.length === 0) return ''; // Fallback or placeholder
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};



