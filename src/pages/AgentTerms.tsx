import { Layout } from '@/components/Layout';
import { Seo } from '@/components/Seo';
import { ShieldCheck } from 'lucide-react';

export const AGENT_TERMS = [
  'You may only list properties you have a direct right to represent — no listings for properties you do not personally handle.',
  'For "For sale" listings, you must state and, when available, attach every certificate covering the property (C of O, Governor\'s Consent, Deed of Assignment, Survey, Excision, etc.).',
  'Unlist a property once it is taken or unavailable so no user can inspect or book something they cannot get.',
  'Never post a property that does not exist just to collect inspection fees. Your account will be suspended without warning.',
  'Never copy another agent\'s property and repost it. Your account will be suspended without warning.',
  'Never ask users to pay you inspection fees or extra inspection fees outside Home-let. You will be penalized.',
  'Never post a property that has chains of other agents involved — direct-representation only.',
  'Never post one property and show a user a different one at inspection. This is deceptive and your account will be suspended.',
];

const AgentTerms = () => (
  <Layout>
    <Seo
      title="Agent & Landlord Terms — Home-let"
      description="Obligations for agents and landlords listing property on Home-let, including KYC, payouts and dispute handling."
      path="/agent-terms"
    />
    <div className="container py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><ShieldCheck className="h-6 w-6" /></div>
        <div>
          <h1 className="text-3xl font-bold">Agent & landlord terms</h1>
          <p className="text-sm text-muted-foreground">You must accept these before listing a property.</p>
        </div>
      </div>
      <ol className="space-y-3 list-decimal pl-6">
        {AGENT_TERMS.map((t, i) => (
          <li key={i} className="text-sm leading-relaxed">{t}</li>
        ))}
      </ol>
      <div className="mt-8 border-t pt-6 text-xs text-muted-foreground">
        Violations may result in immediate suspension, forfeiture of pending payouts, and a dispute lien.
      </div>
    </div>
  </Layout>
);

export default AgentTerms;
