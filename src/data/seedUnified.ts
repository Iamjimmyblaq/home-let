import { properties as seedProperties, agents as seedAgents, Property as SeedProperty } from '@/data/seed';
import type { UnifiedProperty } from '@/hooks/useListings';

export const seedToUnified = (p: SeedProperty): UnifiedProperty => {
  const a = seedAgents.find((x) => x.id === p.agentId);
  return {
    id: p.id, source: 'seed', title: p.title, type: p.type, price: p.price,
    location: p.location, city: p.city, state: p.state,
    beds: p.beds, baths: p.baths, sqm: p.sqm,
    image: p.image, gallery: p.gallery, agentId: p.agentId,
    agentName: a?.name, agentAvatar: a?.avatar, agentAgency: a?.agency, agentPhone: a?.phone, agentVerified: a?.verified,
    verified: p.verified, features: p.features, description: p.description, hasVirtualTour: p.hasVirtualTour,
  };
};

export const seedUnified: UnifiedProperty[] = seedProperties.map(seedToUnified);
