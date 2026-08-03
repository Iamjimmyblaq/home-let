export type PropertyType = 'rent' | 'sale' | 'shortlet';
export type Property = {
  id: string;
  title: string;
  type: PropertyType;
  price: number; // per year for rent, total for sale, per night for shortlet
  location: string;
  city: string;
  state: string;
  beds: number;
  baths: number;
  sqm: number;
  image: string;
  gallery: string[];
  agentId: string;
  verified: boolean;
  features: string[];
  description: string;
  hasVirtualTour: boolean;
};

export type Agent = {
  id: string;
  name: string;
  avatar: string;
  agency: string;
  rating: number;
  reviews: number;
  verified: boolean;
  listings: number;
  phone: string;
  bio: string;
};

export type Hotel = {
  id: string;
  name: string;
  location: string;
  city: string;
  pricePerNight: number;
  rating: number;
  image: string;
  gallery?: string[];
  amenities: string[];
};

const img = (seed: string, w = 1200, h = 800) =>
  `https://images.unsplash.com/photo-${seed}?w=${w}&h=${h}&fit=crop&auto=format`;

export const agents: Agent[] = [
  { id: 'a1', name: 'Adaeze Okafor', agency: 'Crown Realty', avatar: img('1494790108377-be9c29b29330', 200, 200), rating: 4.9, reviews: 142, verified: true, listings: 24, phone: '+234 803 555 0142', bio: 'Lagos luxury specialist with 8+ years bridging diaspora buyers to verified properties.' },
  { id: 'a2', name: 'Tunde Bakare', agency: 'Mainland Homes', avatar: img('1500648767791-00dcc994a43e', 200, 200), rating: 4.7, reviews: 98, verified: true, listings: 18, phone: '+234 802 555 0118', bio: 'Mainland and short-let expert. Fast response, transparent pricing.' },
  { id: 'a3', name: 'Chioma Eze', agency: 'Lekki Premier', avatar: img('1573496359142-b8d87734a5a2', 200, 200), rating: 4.8, reviews: 76, verified: true, listings: 12, phone: '+234 814 555 0176', bio: 'Lekki & Ajah focused. Helping families find safe, vetted homes.' },
  { id: 'a4', name: 'Emeka Johnson', agency: 'Independent', avatar: img('1472099645785-5658abf4ff4e', 200, 200), rating: 4.5, reviews: 31, verified: false, listings: 6, phone: '+234 705 555 0131', bio: 'Independent agent — Abuja territory.' },
];

export const properties: Property[] = [
  {
    id: 'p1', title: '4-Bed Smart Duplex with Pool', type: 'sale', price: 285_000_000,
    location: 'Banana Island', city: 'Ikoyi', state: 'Lagos', beds: 4, baths: 5, sqm: 420,
    image: img('1613490493576-7fde63acd811'),
    gallery: [img('1613490493576-7fde63acd811'), img('1600596542815-ffad4c1539a9'), img('1600585154340-be6161a56a0c'), img('1600607687939-ce8a6c25118c')],
    agentId: 'a1', verified: true, hasVirtualTour: true,
    features: ['Swimming Pool', 'Smart Home', 'Gym', '24/7 Security', 'CCTV', 'Solar Backup'],
    description: 'A stunning architect-designed duplex on Banana Island featuring imported finishes, full home automation, and panoramic lagoon views.',
  },
  {
    id: 'p2', title: '3-Bed Serviced Apartment', type: 'rent', price: 8_500_000,
    location: 'Oniru', city: 'Victoria Island', state: 'Lagos', beds: 3, baths: 3, sqm: 180,
    image: img('1600596542815-ffad4c1539a9'),
    gallery: [img('1600596542815-ffad4c1539a9'), img('1600210492486-724fe5c67fb0'), img('1600585154340-be6161a56a0c')],
    agentId: 'a3', verified: true, hasVirtualTour: true,
    features: ['Furnished', '24/7 Power', 'Gym', 'Concierge', 'Pool'],
    description: 'Fully furnished serviced apartment minutes from the beach. Service charge inclusive.',
  },
  {
    id: 'p3', title: 'Cozy 2-Bed Loft', type: 'shortlet', price: 95_000,
    location: 'Lekki Phase 1', city: 'Lekki', state: 'Lagos', beds: 2, baths: 2, sqm: 110,
    image: img('1502672260266-1c1ef2d93688'),
    gallery: [img('1502672260266-1c1ef2d93688'), img('1505691938895-1758d7feb511'), img('1522708323590-d24dbb6b0267')],
    agentId: 'a2', verified: true, hasVirtualTour: false,
    features: ['Wi-Fi', 'Netflix', 'Kitchen', 'Workspace', 'Parking'],
    description: 'Stylish loft in the heart of Lekki Phase 1. Perfect for couples or business travelers.',
  },
  {
    id: 'p4', title: '5-Bed Mansion + BQ', type: 'sale', price: 450_000_000,
    location: 'Maitama', city: 'Maitama', state: 'Abuja', beds: 5, baths: 6, sqm: 580,
    image: img('1600047509807-ba8f99d2cdde'),
    gallery: [img('1600047509807-ba8f99d2cdde'), img('1600566753190-17f0baa2a6c3')],
    agentId: 'a4', verified: false, hasVirtualTour: true,
    features: ['BQ', 'Cinema Room', 'Garden', 'Borehole', 'Security'],
    description: 'Diplomatic-zone mansion with mature gardens.',
  },
  {
    id: 'p5', title: '1-Bed Mini Flat', type: 'rent', price: 1_200_000,
    location: 'Yaba', city: 'Yaba', state: 'Lagos', beds: 1, baths: 1, sqm: 45,
    image: img('1502672023488-70e25813eb80'),
    gallery: [img('1502672023488-70e25813eb80')],
    agentId: 'a2', verified: true, hasVirtualTour: false,
    features: ['Tiled', 'Prepaid Meter', 'Water'],
    description: 'Affordable mini flat close to UNILAG. Great for students and young pros.',
  },
  {
    id: 'p6', title: 'Beachfront 3-Bed Villa', type: 'shortlet', price: 220_000,
    location: 'Eleko Beach', city: 'Ibeju-Lekki', state: 'Lagos', beds: 3, baths: 3, sqm: 200,
    image: img('1499793983690-e29da59ef1c2'),
    gallery: [img('1499793983690-e29da59ef1c2'), img('1505691938895-1758d7feb511')],
    agentId: 'a1', verified: true, hasVirtualTour: true,
    features: ['Beach Access', 'Pool', 'BBQ', 'Wi-Fi', 'Chef on request'],
    description: 'Wake up to ocean views. Perfect weekend getaway.',
  },
  {
    id: 'p7', title: 'Modern 2-Bed Terrace', type: 'rent', price: 4_500_000,
    location: 'Ikate', city: 'Lekki', state: 'Lagos', beds: 2, baths: 3, sqm: 130,
    image: img('1600210492486-724fe5c67fb0'),
    gallery: [img('1600210492486-724fe5c67fb0'), img('1600566753190-17f0baa2a6c3')],
    agentId: 'a3', verified: true, hasVirtualTour: true,
    features: ['Estate', 'POP Ceiling', 'Fitted Kitchen', 'Parking'],
    description: 'Contemporary terrace in a gated estate. Ready to move in.',
  },
  {
    id: 'p8', title: '6-Bed Detached Duplex', type: 'sale', price: 180_000_000,
    location: 'Magodo GRA', city: 'Magodo', state: 'Lagos', beds: 6, baths: 6, sqm: 500,
    image: img('1600566753190-17f0baa2a6c3'),
    gallery: [img('1600566753190-17f0baa2a6c3'), img('1600585154340-be6161a56a0c')],
    agentId: 'a2', verified: true, hasVirtualTour: false,
    features: ['BQ', 'Family Lounge', 'Solar', 'Borehole'],
    description: 'Spacious family home in highly sought-after Magodo GRA Phase 2.',
  },
];

export const hotels: Hotel[] = [
  { id: 'h1', name: 'The Lagoon Suites', location: 'Victoria Island', city: 'Lagos', pricePerNight: 75_000, rating: 4.6, image: img('1566073771259-6a8506099945'), gallery: ['1566073771259-6a8506099945','1582719478250-c89cae4dc85b','1590490360182-c33d57733427','1631049307264-da0ec9d70304'].map(img), amenities: ['Pool', 'Spa', 'Gym', 'Restaurant'] },
  { id: 'h2', name: 'Aso Rock Boutique', location: 'Maitama', city: 'Abuja', pricePerNight: 62_000, rating: 4.4, image: img('1542314831-068cd1dbfeeb'), gallery: ['1542314831-068cd1dbfeeb','1611892440504-42a792e24d32','1596394516093-501ba68a0ba6','1618773928121-c32242e63f39'].map(img), amenities: ['Wi-Fi', 'Breakfast', 'Bar'] },
  { id: 'h3', name: 'Ocean Pearl Resort', location: 'Ibeju-Lekki', city: 'Lagos', pricePerNight: 145_000, rating: 4.8, image: img('1571003123894-1f0594d2b5d9'), gallery: ['1571003123894-1f0594d2b5d9','1584132967334-10e028bd69f7','1520250497591-112f2f40a3f4','1540541338287-41700207dee6'].map(img), amenities: ['Beach', 'Pool', 'Spa', 'Bar'] },
  { id: 'h4', name: 'Garden City Inn', location: 'GRA', city: 'Port Harcourt', pricePerNight: 38_000, rating: 4.1, image: img('1551882547-ff40c63fe5fa'), gallery: ['1551882547-ff40c63fe5fa','1578683010236-d716f9a3f461','1560448204-e02f11c3d0e2','1560185007-cde436f6a4d0'].map(img), amenities: ['Wi-Fi', 'Parking', 'Restaurant'] },
];

export const seedTransactions = [
  { id: 't1', type: 'fund', amount: 500_000, date: '2026-04-12', status: 'completed', desc: 'Wallet top-up via card' },
  { id: 't2', type: 'escrow', amount: 250_000, date: '2026-04-18', status: 'held', desc: 'Inspection deposit — Banana Island Duplex' },
  { id: 't3', type: 'release', amount: 95_000, date: '2026-04-22', status: 'completed', desc: 'Short-let payout — Lekki Loft' },
];
