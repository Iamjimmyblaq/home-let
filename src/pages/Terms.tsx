import { Layout } from '@/components/Layout';
import { FileText } from 'lucide-react';

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: '1. Acceptance of terms',
    p: [
      'By accessing or using Home-let (the "Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, you must stop using the Platform.',
      'We may update these terms from time to time. Continued use after an update means you accept the revised terms.',
    ],
  },
  {
    h: '2. Who may use Home-let',
    p: [
      'You must be at least 18 years old and legally able to enter contracts in Nigeria.',
      'You must register with accurate details, including a valid email address, phone number and username. You are responsible for all activity under your account and for keeping your password secure.',
    ],
  },
  {
    h: '3. Account types and roles',
    p: [
      'Regular users can search, tour, book inspections, rent, buy and short-let properties.',
      'Agents and landlords may list properties only after completing KYC verification and accepting the Agent & Landlord Terms.',
      'Admin and moderator roles are assigned internally by Home-let and cannot be self-selected.',
    ],
  },
  {
    h: '4. Listings',
    p: [
      'Agents and landlords are solely responsible for the accuracy of their listings, including price, additional fees, availability, photos and certificates.',
      'Home-let reviews listings before they go live but does not guarantee the condition, legality or title of any property. Users must carry out their own due diligence before making a payment.',
      'Listings found to be fake, duplicated, misleading or controlled by a chain of intermediaries will be removed and the account suspended.',
    ],
  },
  {
    h: '5. Fees, payments and escrow',
    p: [
      'Inspection fees, booking payments, caution fees and additional charges are displayed before you confirm any transaction.',
      'Payments made on the Platform are held in escrow and released only once the relevant milestone is confirmed (inspection completed, check-out confirmed, or a dispute resolved).',
      'Never send money to an agent outside the Platform. Off-platform payments are not protected and cannot be refunded by Home-let.',
      'Caution fees for short-lets are refundable after check-out once the agent confirms the property is intact.',
    ],
  },
  {
    h: '6. Cancellations and refunds',
    p: [
      'Inspection deposits are refundable where the agent fails to show up, the property does not exist, or the property shown differs from the listing.',
      'Booking cancellations follow the availability and cancellation window shown on the listing at the time of booking.',
      'Refunds are processed back to your Home-let wallet, from where you may withdraw to your bank account.',
    ],
  },
  {
    h: '7. Disputes',
    p: [
      'Disputes are first reviewed by a Home-let moderator, who proposes a resolution. Every resolution must be approved by an administrator before funds are released.',
      'Agents are limited to five disputes per calendar month. Exceeding this places a 30-day lien on listing and withdrawal rights, which may be appealed to an administrator.',
    ],
  },
  {
    h: '8. Prohibited conduct',
    p: [
      'You may not post false information, impersonate another person, harass other users, scrape or reuse listing photographs, or attempt to move transactions off the Platform.',
      'All listing photographs and virtual tours remain the property of the uploading agent and Home-let. Downloading or reposting another agent\'s media is prohibited.',
    ],
  },
  {
    h: '9. Suspension and termination',
    p: [
      'We may suspend or permanently delete any account that violates these terms, with or without notice, and may withhold pending payouts where a dispute or investigation is open.',
      'You may delete your own account at any time from your dashboard. Deletion permanently removes your personal data from our systems, subject to records we must retain by law.',
    ],
  },
  {
    h: '10. Limitation of liability',
    p: [
      'Home-let is a marketplace and is not a party to any tenancy, sale or booking agreement between users. To the fullest extent permitted by law, our liability is limited to the amount of the transaction in question.',
    ],
  },
  {
    h: '11. Governing law',
    p: ['These terms are governed by the laws of the Federal Republic of Nigeria, and disputes are subject to the exclusive jurisdiction of the Nigerian courts.'],
  },
  {
    h: '12. Contact',
    p: ['Questions about these terms? Reach us through the Contact page or email home-let@zohomail.com.'],
  },
];

const Terms = () => (
  <Layout>
    <div className="container py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-6 w-6" /></div>
        <h1 className="text-3xl font-bold">Terms and Conditions</h1>
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

export default Terms;
