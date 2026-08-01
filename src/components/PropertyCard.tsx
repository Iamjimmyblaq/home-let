import { Link } from 'react-router-dom';
import { Heart, BedDouble, Bath, Maximize, MapPin, ShieldCheck, Eye } from 'lucide-react';
import { shortNaira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/hooks/useFavorites';
import { UnifiedProperty } from '@/hooks/useListings';

export const PropertyCard = ({ p }: { p: UnifiedProperty }) => {
  const { favorites, toggle } = useFavorites();
  const fav = favorites.includes(p.id);

  const priceLabel =
    p.type === 'rent' || p.type === 'hostel' ? `${shortNaira(p.price)}/yr` : p.type === 'shortlet' ? `${shortNaira(p.price)}/night` : shortNaira(p.price);

  return (
    <Link to={`/property/${p.id}`} className="group rounded-2xl overflow-hidden bg-card border shadow-soft hover:shadow-elegant transition-all">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground capitalize">{p.type === 'shortlet' ? 'Short-let' : p.type}</Badge>
          {p.verified && (<Badge className="bg-success text-success-foreground"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>)}
        </div>
        {p.hasVirtualTour && (<Badge className="absolute bottom-3 left-3 bg-accent text-accent-foreground"><Eye className="h-3 w-3 mr-1" />360° Tour</Badge>)}
        <button
          onClick={(e) => { e.preventDefault(); toggle(p.id); }}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart className={`h-4 w-4 ${fav ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
        <div className="flex items-center text-xs text-muted-foreground gap-1"><MapPin className="h-3 w-3" /> {p.location}{p.state ? `, ${p.state}` : ''}</div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.beds}</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.baths}</span>
          {p.sqm > 0 && <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{p.sqm}m²</span>}
        </div>
        <div className="pt-2 border-t flex items-baseline justify-between">
          <span className="text-lg font-bold font-display text-primary" style={{ fontFamily: 'Sora' }}>{priceLabel}</span>
          <span className="text-xs text-muted-foreground">View →</span>
        </div>
      </div>
    </Link>
  );
};
