import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Seo, SITE_URL } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Eye, FileCheck2, AlertTriangle, Wallet } from 'lucide-react';

const steps = [
  {
    icon: FileCheck2,
    title: '1. Confirm the property really exists',
    body:
      'Ask for the full street address and cross-check it on a map before you pay anything. On Home-let every listing carries GPS coordinates and a satellite view, so you can see the actual building and neighbourhood before you leave the house.',
  },
  {
    icon: Eye,
    title: '2. Tour it in 360° before you travel',
    body:
      'Fake listings rarely survive a walkthrough. Use the virtual tour on the listing page to check room sizes, finishing and the state of the compound, then book a physical inspection only for the homes that pass.',
  },
  {
    icon: ShieldCheck,
    title: '3. Deal only with verified agents and landlords',
    body:
      'Verified agents on Home-let have submitted government ID and passed KYC review, and their badge shows whether they are an agent or the landlord. Check their rating and past reviews before booking.',
  },
  {
    icon: Wallet,
    title: '4. Never send money directly — use escrow',
    body:
      'Inspection fees, caution deposits and booking payments are held by Home-let escrow and only released after the agent has delivered. If the keys never appear, you raise a dispute and the funds come back to your wallet.',
  },
  {
    icon: FileCheck2,
    title: '5. Read the documents for a purchase',
    body:
      'For a property for sale, ask for the Certificate of Occupancy, Governor\u2019s Consent, deed of assignment or survey plan. Sellers on Home-let can attach a copy of the covering certificate to the listing — treat a refusal to show any document as a red flag.',
  },
];

const redFlags = [
  'A price far below every similar property in the same area.',
  'Pressure to "pay a small commitment fee today" before any inspection.',
  'An agent who will only chat on WhatsApp and refuses in-app messaging or escrow.',
  'Photos with another portal\u2019s watermark, or the same photos appearing on several listings.',
  'No physical address, or an address that does not match the photos on satellite view.',
  'Requests to pay into a personal bank account instead of the platform.',
];

const SafeRenting = () => {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'How to rent safely in Nigeria: a step-by-step guide',
      description:
        'Verify a property, spot rental scams and use escrow so you never lose money to a fake agent in Nigeria.',
      mainEntityOfPage: `${SITE_URL}/guides/safe-renting-nigeria`,
      author: { '@type': 'Organization', name: 'Home-let' },
      publisher: { '@type': 'Organization', name: 'Home-let' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Safe renting in Nigeria',
          item: `${SITE_URL}/guides/safe-renting-nigeria`,
        },
      ],
    },
  ];

  return (
    <Layout>
      <Seo
        title="How to Rent Safely in Nigeria — Home-let Guide"
        description="Verify a property, avoid Nigerian rental scams and pay through escrow. A practical safe house-hunting checklist from Home-let."
        path="/guides/safe-renting-nigeria"
        type="article"
        jsonLd={jsonLd}
      />

      <section className="gradient-hero text-primary-foreground">
        <div className="container py-16 md:py-24">
          <p className="text-sm font-medium text-accent mb-3">Guide</p>
          <h1 className="text-3xl md:text-5xl font-bold max-w-3xl leading-tight">
            How to rent safely in Nigeria
          </h1>
          <p className="mt-5 text-lg text-primary-foreground/90 max-w-2xl">
            Rental scams cost Nigerians millions every year — agent fees for houses that don't exist, caution
            deposits that vanish, "landlords" who disappear after the transfer. Here's how to check a property
            properly and pay in a way you can reverse.
          </p>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <article key={s.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <s.icon className="h-6 w-6 text-accent mb-4" aria-hidden="true" />
              <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-14">
        <div className="rounded-2xl border bg-card p-6 md:p-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-accent" aria-hidden="true" />
            Red flags in Nigerian real estate
          </h2>
          <ul className="space-y-3">
            {redFlags.map((f) => (
              <li key={f} className="flex gap-3 text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container pb-20">
        <div className="rounded-2xl gradient-hero text-primary-foreground p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Start with a verified listing</h2>
          <p className="text-primary-foreground/90 max-w-xl mx-auto mb-6">
            Every Home-let listing is screened for reused photos, mapped to a real address and paid for through
            escrow.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/listings">Browse properties</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/agents">Find a verified agent</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SafeRenting;
