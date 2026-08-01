import { Layout } from '@/components/Layout';
import { Seo } from '@/components/Seo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS = [
  { q: 'Is Home-let free to use?', a: 'Browsing, searching and virtual tours on public listings are free. You only pay when you book an inspection, make a booking, or apply to boost a listing as an agent.' },
  { q: 'How does escrow work?', a: 'When you pay for an inspection or booking, the money is held by Home-let — not sent to the agent. It is released only after the milestone is confirmed (inspection attended, check-out completed) or after a dispute is resolved by our team.' },
  { q: 'What happens if the agent does not show up?', a: 'Open a dispute from your dashboard. A moderator reviews the case and proposes a resolution, which an admin approves before any funds move. If the agent was at fault, your inspection fee is refunded to your wallet.' },
  { q: 'What is a caution fee?', a: 'For short-lets, a refundable caution fee is added to your booking. After you check out and the agent confirms the property is intact, it is automatically returned to your wallet.' },
  { q: 'How do I become a verified agent or landlord?', a: 'Register with the Agent / Landlord role, accept the agent terms, then complete KYC from your dashboard by uploading a valid government ID and indicating whether you are an agent or a landlord. Once an admin approves it, a verification badge appears next to your name and you can list properties.' },
  { q: 'Can I list a property I do not directly represent?', a: 'No. Home-let is direct-representation only. Listing a property you do not personally handle, reposting another agent\'s property, or showing a different property at inspection will get your account suspended without warning.' },
  { q: 'What is listing boosting?', a: 'Boosting pushes your listing to the top of search results. It costs ₦2,500 for 2 days, prorated for longer periods. You can only submit a boost request when your wallet balance covers the fee; the amount is deducted once an admin approves it.' },
  { q: 'How do I withdraw money from my wallet?', a: 'Go to Wallet, enter the amount and your bank details, and submit a withdrawal. Payouts are processed through our licensed payment partner. Withdrawals are blocked while a dispute lien is active on your account.' },
  { q: 'Why did my deposit not appear immediately?', a: 'Deposits are credited as soon as the payment is confirmed by the payment processor. If a payment succeeded but your balance is unchanged after a few minutes, reopen the Wallet page — verification runs again automatically — then contact support.' },
  { q: 'Can I delete my account?', a: 'Yes. Open your dashboard and use the Danger Zone to delete your account. This permanently removes your personal data from our systems.' },
];

const SAFETY = [
  'Never pay an agent directly — every legitimate payment happens inside Home-let and is escrow-protected.',
  'Take the virtual tour before booking a physical inspection to avoid wasted trips.',
  'For "for sale" properties, ask for and review the certificates attached to the listing (C of O, Governor\'s Consent, Deed of Assignment, Survey).',
  'Meet at the property address shown in the listing. If the agent redirects you elsewhere, stop and report it.',
  'Check the verification badge and rating on the agent profile before booking.',
  'Report suspicious listings or messages immediately from the property or chat page.',
];

const Faq = () => (
  <Layout>
    <Seo
      title="Frequently Asked Questions — Home-let"
      description="Answers about inspections, escrow, caution deposits, disputes, agent verification and listing boosts on Home-let."
      path="/faq"
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }}
    />
    <div className="container py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><HelpCircle className="h-6 w-6" /></div>
        <div>
          <h1 className="text-3xl font-bold">Frequently asked questions</h1>
          <p className="text-sm text-muted-foreground">Everything about payments, inspections, KYC and disputes.</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="mb-12">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="rounded-2xl border bg-secondary/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-bold">Safety tips</h2>
        </div>
        <ul className="space-y-2 list-disc pl-5 text-sm text-muted-foreground leading-relaxed">
          {SAFETY.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          Still need help? <Link to="/contact" className="text-primary hover:underline">Contact our support team</Link>.
        </p>
      </div>
    </div>
  </Layout>
);

export default Faq;
