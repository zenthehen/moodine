export type VibeDimensions = {
  intimacy: number;
  energy: number;
  formality: number;
  noise: number;
  outdoorsy: number;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  description: string;
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  vibe: VibeDimensions;
  imageUrl: string;
};

export const moodProfiles: Record<string, VibeDimensions> = {
  "Romantic":       {intimacy:9, energy:2, formality:8, noise:2, outdoorsy:3},
  "Fun & Lively":   {intimacy:2, energy:9, formality:2, noise:9, outdoorsy:5},
  "Chill & Casual": {intimacy:5, energy:3, formality:2, noise:3, outdoorsy:6},
  "Business":       {intimacy:5, energy:2, formality:9, noise:2, outdoorsy:1},
  "Family":         {intimacy:3, energy:7, formality:2, noise:7, outdoorsy:5},
  "Solo Dining":    {intimacy:6, energy:2, formality:3, noise:2, outdoorsy:4},
  "Celebration":    {intimacy:6, energy:7, formality:7, noise:5, outdoorsy:5},
  "Adventure":      {intimacy:2, energy:8, formality:1, noise:7, outdoorsy:8},
};

export const mockRestaurants: Restaurant[] = [
  // Romantic
  {
    id: '1',
    name: 'Chez Lumière',
    cuisine: 'French Continental',
    location: 'Lazimpat',
    description: 'An intimate dining experience with soft candlelight and an exceptional wine list.',
    priceLevel: '$$$$',
    vibe: { intimacy: 9, energy: 2, formality: 9, noise: 2, outdoorsy: 1 },
    imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Olive Garden Terrace',
    cuisine: 'Mediterranean',
    location: 'Durbar Marg',
    description: 'Rooftop garden draped in fairy lights, perfect for a romantic evening out.',
    priceLevel: '$$$',
    vibe: { intimacy: 8, energy: 3, formality: 7, noise: 3, outdoorsy: 9 },
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop'
  },
  
  // Fun & Lively
  {
    id: '3',
    name: 'The Masala Table',
    cuisine: 'Indian',
    location: 'Thamel',
    description: 'Bustling rooftop setting with live music, fantastic cocktails, and vibrant energy.',
    priceLevel: '$$',
    vibe: { intimacy: 2, energy: 9, formality: 3, noise: 8, outdoorsy: 8 },
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'Himalayan Brewhouse',
    cuisine: 'Pub & Grill',
    location: 'Thamel',
    description: 'Craft beer and DJ weekends. Loud, fun, and packed with locals and travelers.',
    priceLevel: '$$',
    vibe: { intimacy: 1, energy: 10, formality: 1, noise: 9, outdoorsy: 4 },
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop'
  },

  // Chill & Casual
  {
    id: '5',
    name: 'The Reading Room Café',
    cuisine: 'Light Bites',
    location: 'Lazimpat',
    description: 'Quiet, cozy corner with books and specialty coffee. Great for focused work or a quiet chat.',
    priceLevel: '$',
    vibe: { intimacy: 7, energy: 2, formality: 2, noise: 2, outdoorsy: 2 },
    imageUrl: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?q=80&w=800&auto=format&fit=crop'
  },
  
  // Business
  {
    id: '6',
    name: 'Chimney Restaurant',
    cuisine: 'Continental',
    location: 'Yak & Yeti Hotel',
    description: 'A classic setting for power lunches and formal business meetings with impeccable service.',
    priceLevel: '$$$$',
    vibe: { intimacy: 4, energy: 2, formality: 9, noise: 2, outdoorsy: 1 },
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-33898ed1e830?q=80&w=800&auto=format&fit=crop'
  },
  
  // Family
  {
    id: '7',
    name: 'Thakali Kitchen',
    cuisine: 'Traditional Nepali',
    location: 'Patan',
    description: 'Spacious and welcoming, offering unlimited dal bhat in a family-friendly atmosphere.',
    priceLevel: '$$',
    vibe: { intimacy: 3, energy: 6, formality: 2, noise: 6, outdoorsy: 2 },
    imageUrl: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop'
  },

  // Adventure
  {
    id: '8',
    name: 'Gaia Restaurant',
    cuisine: 'International Fusion',
    location: 'Pokhara Lakeside',
    description: 'Stunning lakeside views and adventurous fusion dishes for the bold eater.',
    priceLevel: '$$',
    vibe: { intimacy: 3, energy: 7, formality: 2, noise: 6, outdoorsy: 10 },
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800&auto=format&fit=crop'
  }
];

export function calculateMatchScore(restaurantDims: VibeDimensions, moodProfile: VibeDimensions): number {
  let diff = 0;
  const keys = Object.keys(moodProfile) as Array<keyof VibeDimensions>;
  keys.forEach(k => {
    diff += Math.abs(restaurantDims[k] - moodProfile[k]);
  });
  return Math.round((1 - diff / (keys.length * 9)) * 100);
}
