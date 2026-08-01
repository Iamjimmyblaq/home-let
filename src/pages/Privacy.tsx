import { Layout } from '@/components/Layout';
import { Seo } from '@/components/Seo';
import { Lock } from 'lucide-react';

const SECTIONS: { h: string; p: string[] }[] = [
  { h: 'Who we are', p: ['Home-let is a Nigerian property marketplace. This notice explains what personal data we collect, why we collect it, and the choices you have.'] },
  { h: 'Data we collect', p: [
    'Account data: name, username, email address, phone number and password (stored encrypted).',
    'Verification data: for agents and landlords, government-issued ID and agency details submitted for KYC.',
    'Transaction data: wallet balances, deposits, inspection and booking payments, and payout details processed through our payment partner.',
    'Usage data: pages viewed, searches, saved properties, device and browser information.',
  ] },
  { h: 'How we use your data', p: [
    'To create and secure your account and assign the correct role.',
    'To verify agents and landlords and display verification badges.',
    'To process payments, hold funds in escrow, and settle refunds and payouts.',
    'To show relevant listings, send notifications about your bookings, inspections and messages, and to resolve disputes.',
    'To detect fraud, misuse and policy violations.',
  ] },
  { h: 'Sharing', p: [
    'We share only what is necessary: your name and contact details with an agent once you book with them, and payment details with our licensed payment processor.',
    'We never sell your personal data. Phone numbers and KYC documents are never publicly visible.',
  ] },
  { h: 'Cookies', p: ['We use essential cookies to keep you signed in, and analytics cookies to understand how the platform is used. You can clear or block cookies in your browser, but some features may stop working.'] },
  { h: 'Data retention and deletion', p: [
    'We keep your data for as long as your account is active. You can delete your account at any time from your dashboard, which removes your personal data from our systems.',
    'Some transaction records may be retained where we are required to keep them by Nigerian law.',
  ] },
  { h: 'Your rights', p: ['Under the Nigeria Data Protection Act you may request access to, correction of, or deletion of your personal data. Contact us and we will respond within 30 days.'] },
  { h: 'Security', p: ['Data is stored on encrypted infrastructure with row-level access controls. Listing photographs and identity documents are held in private storage and served only through short-lived signed links.'] },
  { h: 'Contact', p: ['For privacy questions or data requests, email home-let@zohomail.com or use the Contact page.'] },
];

const Privacy = () => (
  <Layout>
    <Seo
      title="Privacy Policy — Home-let"
      description="How Home-let collects, stores and protects your personal information and KYC documents."
      path="/privacy"
    />
    <div className="container py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Lock className="h-6 w-6" /></div>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>
      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold mb-2">{s.h}</h2>
            {s.p.map((t, i) => <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{t}</p>)}
          </section>
        ))}
      </div>
    </div>
  </Layout>
);

export default Privacy;
