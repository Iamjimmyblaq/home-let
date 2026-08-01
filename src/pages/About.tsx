import { Layout } from '@/components/Layout';
import { Seo } from '@/components/Seo';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Eye, Wallet, Users, Building2, Handshake, Target, HeartHandshake } from 'lucide-react';

const About = () => (
  <Layout>
    <Seo
      title="About Home-let — Safer Property Deals in Nigeria"
      description="How Home-let uses KYC-verified agents, escrow payments and photo screening to make Nigerian property deals safe."
      path="/about"
    />
    <section className="gradient-hero text-primary-foreground">
      <div className="container py-16 md:py-24 max-w-4xl">
        <p className="text-accent font-medium mb-3 text-sm uppercase tracking-wide">About Home-let</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
          Nigeria's trusted way to rent, buy and short-let property.
        </h1>
        <p className="text-lg text-white/80">
          Home-let connects verified agents and landlords with genuine tenants, buyers and guests — with 360° virtual
          tours, escrow-protected payments and a real dispute process behind every transaction.
        </p>
      </div>
    </section>

    <section className="container py-16 grid md:grid-cols-2 gap-10">
      <div>
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4"><Target className="h-6 w-6" /></div>
        <h2 className="text-2xl font-bold mb-3">Our mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          House hunting in Nigeria is too often defined by wasted agent runs, fake listings and money paid to people you
          have never met. We are building the opposite: every listing tied to an agent who has passed KYC, every naira
          held in escrow until you confirm, and every dispute reviewed by a real moderation team.
        </p>
      </div>
      <div>
        <div className="h-11 w-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-4"><HeartHandshake className="h-6 w-6" /></div>
        <h2 className="text-2xl font-bold mb-3">What we stand for</h2>
        <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc pl-5">
          <li>Transparency — all fees shown upfront, no surprise charges at the door.</li>
          <li>Verification — agents and landlords submit ID and are approved before listing.</li>
          <li>Protection — inspection and booking funds sit in escrow, not in someone's pocket.</li>
          <li>Accountability — agents who break our rules lose access to the platform.</li>
        </ul>
      </div>
    </section>

    <section className="bg-secondary/40 py-16">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-10">What you get on Home-let</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Eye, t: '360° virtual tours', d: 'Walk through every room before you leave your house.' },
            { icon: ShieldCheck, t: 'KYC-verified agents', d: 'Every agent and landlord is identity-checked and badge-verified.' },
            { icon: Wallet, t: 'Escrow payments', d: 'Funds only release when you confirm the property is as described.' },
            { icon: Handshake, t: 'Dispute resolution', d: 'Moderators review, admins approve — no one walks away with your money.' },
          ].map((f) => (
            <div key={f.t} className="bg-card border rounded-2xl p-6 shadow-soft">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3"><f.icon className="h-5 w-5" /></div>
              <h3 className="font-semibold mb-1">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="container py-16">
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { n: '5,400+', l: 'Verified listings', i: Building2 },
          { n: '320+', l: 'KYC-verified agents', i: Users },
          { n: '₦2.1B', l: 'Protected via escrow', i: ShieldCheck },
          { n: '4.8★', l: 'Average user rating', i: HeartHandshake },
        ].map((s) => (
          <div key={s.l} className="p-6 border rounded-2xl bg-card shadow-soft">
            <div className="text-3xl font-bold text-primary" style={{ fontFamily: 'Sora' }}>{s.n}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </section>

    <section className="container pb-20">
      <div className="rounded-3xl gradient-hero text-primary-foreground p-10 md:p-14 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to find your next home?</h2>
        <p className="text-white/80 mb-6">Browse verified listings or join as an agent and start earning.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/listings"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Browse properties</Button></Link>
          <Link to="/register"><Button size="lg" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20">List your property</Button></Link>
        </div>
      </div>
    </section>
  </Layout>
);

export default About;
