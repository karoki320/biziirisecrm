/**
 * The terms of engagement, in one place.
 *
 * The web page and the generated PDF both render from this array, so a client
 * can never tick one version and receive another. `TERMS_VERSION` is stamped
 * into every agreement — when you change the terms, bump it, and old
 * agreements still say which wording they were signed against.
 *
 * NOT LEGAL ADVICE. This is a plain-language starting point written to match
 * how Biziirise actually works. Have an advocate read it before you rely on it
 * for anything that matters.
 */

export const TERMS_VERSION = "2026-09-21";

export type TermsClause = { heading: string; body: string[] };

export const terms: TermsClause[] = [
  {
    heading: "1. Who this is between",
    body: [
      "This agreement is between Biziirise Digital Agency (\u201cus\u201d), Norfolk Towers, Kijabe Street, Nairobi, and the business named in it (\u201cyou\u201d).",
      "It covers the service and package named here. If we agree on extra work later, we'll put that in writing separately.",
    ],
  },
  {
    heading: "2. What we'll do",
    body: [
      "Deliver the service and package in this agreement, as described on our website on the day you agreed.",
      "Tell you upfront what we need from you \u2014 content, photos, logins, approvals \u2014 and by when. If something's late, the project pauses and the deadline moves by the same number of days.",
      "Quote any extra work before we start it. Never after.",
    ],
  },
  {
    heading: "3. What we need from you",
    body: [
      "Correct information, and the content we ask for. Anything you send us \u2014 photos, logos, text \u2014 you must have the right to use.",
      "One person who can approve work for your business. When they approve something, it's approved.",
      "Feedback within five working days. If we hear nothing for fourteen days, we may treat that stage as approved so the project doesn't get stuck.",
    ],
  },
  {
    heading: "4. Payment",
    body: [
      "Prices are in Kenyan Shillings, as shown on our website for your package \u2014 unless we've quoted you differently in writing.",
      "One-off projects: 50% to start, 50% when it's done and before we hand over the final files. Monthly services are paid at the start of each month.",
      "Ad budgets aren't part of our fee. You pay Meta, Google or any other platform directly \u2014 we never hold your ad money.",
      "Invoices are due within seven days. If one is overdue, we may pause work \u2014 but we'll tell you first.",
    ],
  },
  {
    heading: "5. Changes",
    body: [
      "Every package comes with two rounds of changes at each stage. A change means tweaking what we agreed. Changing direction after you've approved something counts as new work.",
      "If something isn't right, tell us early. We'd much rather fix it than argue about it.",
    ],
  },
  {
    heading: "6. Who owns what",
    body: [
      "Once you've paid in full, the final work is yours \u2014 your website, your designs, the content we made for you.",
      "Our own tools and code we reuse across projects stay ours, but you can use them as part of your project for as long as you like.",
      "Things from other companies \u2014 fonts, stock photos, plugins \u2014 come with their own licences. We'll tell you which ones you're using.",
    ],
  },
  {
    heading: "7. Showing off your project",
    body: [
      "We'd like to show your project in our portfolio and on social media. You can say no \u2014 now or any time later \u2014 and we'll take it down.",
      "We'll never share your data, your customers' data, or anything you tell us is private.",
    ],
  },
  {
    heading: "8. Privacy and your data",
    body: [
      "Your business information stays between us and the people working on your project.",
      "If we handle your customers' personal data, we only use it to deliver your project, in line with Kenya's Data Protection Act, 2019.",
      "We only keep your logins and passwords as long as we need them, and hand everything back at the end.",
    ],
  },
  {
    heading: "9. After we hand over",
    body: [
      "For 30 days after delivery, we fix anything in our work that doesn't work as agreed \u2014 free. New features or changes of mind aren't included.",
      "Hosting, domains and other services are billed by those providers. We'll tell you the costs before you sign up.",
      "Ongoing support is a separate arrangement.",
    ],
  },
  {
    heading: "10. Ending the agreement",
    body: [
      "Either of us can end this agreement in writing. You pay for the work done so far, and we hand over everything you've paid for.",
      "Monthly services need 30 days' written notice from either side.",
    ],
  },
  {
    heading: "11. Limits",
    body: [
      "We can't promise specific results \u2014 sales, rankings, followers or leads. We promise to do the agreed work, and do it well.",
      "The most we can be liable for is what you've paid us for the work in question.",
      "Neither of us is responsible for delays caused by things truly out of our control.",
    ],
  },
  {
    heading: "12. The law, and how you signed",
    body: [
      "This agreement follows the laws of Kenya. If we disagree on something, we'll try to sort it out by talking first.",
      "You agreed by ticking a box on our website. We record the date, time and which version of these terms you saw. Under the Kenya Information and Communications Act, that counts the same as signing on paper.",
    ],
  },
];

export function termsPlainText(): string {
  return terms
    .map((c) => `${c.heading}\n${c.body.join("\n")}`)
    .join("\n\n");
}
