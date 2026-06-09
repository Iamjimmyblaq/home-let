import { Layout } from '@/components/Layout';
import { PropertyCard } from '@/components/PropertyCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useListings } from '@/hooks/useListings';
import { NIGERIAN_STATES } from '@/data/nigerianStates';

const Listings = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [type, setType] = useState(params.get('type') || 'all');
  const [city, setCity] = useState('all');
  const [sort, setSort] = useState('relevance');
  const { items, loading } = useListings();

  const filtered = useMemo(() => {
    let r = items;
    if (type !== 'all') r = r.filter((p) => p.type === type);
    if (city !== 'all') r = r.filter((p) => p.state === city);
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter((p) => (p.title + p.location + p.city + p.state + p.type).toLowerCase().includes(s));
    }
    if (sort === 'low') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'high') r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [items, q, type, city, sort]);

  return (
    <Layout>
      <div className="bg-secondary/40 border-b">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-1">Find your next home</h1>
          <p className="text-muted-foreground mb-6">{loading ? 'Loading…' : `${filtered.length} verified listings`}</p>
          <div className="bg-card rounded-2xl p-3 flex flex-col lg:flex-row gap-2 shadow-soft border">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search location, title..." className="border-0 focus-visible:ring-0 px-0" />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="shortlet">Short-let</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All states</SelectItem>
                {NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full lg:w-44"><SlidersHorizontal className="h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most relevant</SelectItem>
                <SelectItem value="low">Price: low to high</SelectItem>
                <SelectItem value="high">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setParams({ q, type })} className="lg:w-auto">Apply</Button>
          </div>
        </div>
      </div>

      <div className="container py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No properties match your filters.</p>
            <Button onClick={() => { setQ(''); setType('all'); setCity('all'); }}>Clear filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Listings;
