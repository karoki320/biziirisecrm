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

export const TERMS_VERSION = "2026-09-17";

export type TermsClause = { heading: string; body: string[] };

export const terms: TermsClause[] = [
  {
    heading: "1. Who this is between",
    body: [
      "These terms are between Biziirise Digital Agency (“we”, “us”), of Norfolk Towers, Kijabe Street, Nairobi, and the business named in this agreement (“you”).",
      "They apply to the service and package named in this agreement. If we later agree different work, we will record it separately.",
    ],
  },
  {
    heading: "2. What we will do",
    body: [
      "We will deliver the service and package described in this agreement, to the scope published on our website on the date you accepted these terms.",
      "We will tell you at the start what we need from you — content, photographs, logins, approvals — and by when. Work pauses if those do not arrive, and the timeline moves by the same number of days.",
      "Anything outside the agreed package is new work. We will quote it before starting, never after.",
    ],
  },
  {
    heading: "3. What you will do",
    body: [
      "Give us accurate information and the content we ask for, and confirm you have the right to use any material you send us — photographs, logos, text, product images.",
      "Name one person who can approve work. Approval by that person is approval.",
      "Respond to review requests within five working days. After fourteen days without a response we may treat a stage as approved so the project does not stall indefinitely.",
    ],
  },
  {
    heading: "4. Money",
    body: [
      "Prices are in Kenyan Shillings and are those published on our website for the package named in this agreement, unless we have quoted you separately in writing.",
      "We ask for 50% before work starts and the balance on delivery, before handover of final files or transfer of hosting. A retainer service is billed monthly in advance.",
      "Advertising budgets are not our fee. You pay Meta, Google or any other platform directly. We never hold your ad spend.",
      "Invoices are due within seven days. Work may pause on an overdue invoice, and we will tell you before it does.",
    ],
  },
  {
    heading: "5. Revisions",
    body: [
      "Each package includes two rounds of revisions at each stage. A revision is a change to work already agreed; a change of direction after approval is new work.",
      "We would rather talk than argue about definitions. If something is not right, say so early and plainly.",
    ],
  },
  {
    heading: "6. Who owns what",
    body: [
      "When you have paid in full, you own the final deliverables — the website, the designs, the content we produced for you.",
      "We keep ownership of our own tools, frameworks and anything we built before this project or use across clients. You get a licence to use those as part of your deliverable, for as long as you like.",
      "Third-party components — fonts, stock images, plugins — stay under their own licences, and we will tell you which those are.",
    ],
  },
  {
    heading: "7. Showing the work",
    body: [
      "We would like to show what we built for you in our portfolio and on social media. You can say no, now or later, and we will take it down.",
      "We will never publish your data, your customers' data, or anything you have told us is confidential.",
    ],
  },
  {
    heading: "8. Confidentiality and data",
    body: [
      "We treat your business information as confidential and will not share it except with people working on your project.",
      "Where we handle personal data belonging to your customers, we do so only to deliver this service, in line with the Data Protection Act, 2019.",
      "We hold logins and credentials only as long as we need them, and hand them over at the end.",
    ],
  },
  {
    heading: "9. After handover",
    body: [
      "We fix faults in our own work free for 30 days after delivery. A fault is something not working as agreed — not a new feature or a change of mind.",
      "Hosting, domains and third-party services are billed by those providers. We will tell you what they cost before you commit.",
      "Ongoing support and maintenance are a separate arrangement.",
    ],
  },
  {
    heading: "10. Ending it",
    body: [
      "Either of us may end this in writing. You pay for work completed to that point; we hand over what has been paid for.",
      "A monthly retainer needs 30 days' notice, in writing, from either side.",
    ],
  },
  {
    heading: "11. Limits",
    body: [
      "We do not guarantee particular business results — rankings, sales, followers or leads. We guarantee the work we agreed to do, done properly.",
      "Our total liability is limited to the fees you have paid us for the affected work.",
      "Neither of us is liable for delays caused by things genuinely outside our control.",
    ],
  },
  {
    heading: "12. Law, and how you accepted this",
    body: [
      "These terms are governed by the laws of Kenya. We will try to resolve any dispute by talking before anything else.",
      "You accepted these terms by ticking the box on our website. We record the date, time and the version of these terms you saw. Under the Kenya Information and Communications Act, that acceptance has the same effect as a signature on paper.",
    ],
  },
];

export function termsPlainText(): string {
  return terms
    .map((c) => `${c.heading}\n${c.body.join("\n")}`)
    .join("\n\n");
}
