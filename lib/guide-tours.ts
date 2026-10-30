import type { BiziMood } from "@/components/guide/bizi";

/**
 * Everything Bizi says, in one file. No AI — a fixed script, so it says
 * exactly the right thing every time. Edit the words here.
 *
 * A step points at an element marked `data-guide="<target>"`. With no target
 * it shows in the middle of the screen. `optional` steps are skipped when the
 * element isn't on the page (e.g. no agreement to sign). `waitFor` steps let
 * the client actually do the thing; the tour moves on when they have.
 * `{name}` becomes the client's first name.
 */

export type GuideStep = {
  target?: string;
  path?: string;
  title: string;
  text: string;
  mood?: BiziMood;
  optional?: boolean;
  waitFor?: string;
  /** Optional button on the last step. */
  cta?: { label: string; href: string };
};

export type TourId =
  | "welcome"
  | "practice"
  | "tip-agreement"
  | "tip-invoice"
  | "tip-document";

export const TOURS: Record<TourId, GuideStep[]> = {
  welcome: [
    {
      path: "/portal",
      title: "Hi {name}, I'm Bizi 👋",
      text: "I'll be your guide to the Biziirise portal. Let me show you around — it takes about a minute.",
      mood: "wave",
    },
    {
      path: "/portal",
      target: "nav-overview",
      title: "Overview — your home",
      text: "This is where you land every time. It shows where each of your projects stands right now.",
      mood: "point",
    },
    {
      path: "/portal",
      target: "sign-banner",
      title: "Something to sign",
      text: "When we need your signature, it shows up here. Tap it, read the agreement and sign with your finger. No printing, no scanning.",
      mood: "point",
      optional: true,
    },
    {
      path: "/portal",
      target: "projects",
      title: "Your projects",
      text: "Every project moves through four stages: Requested → In progress → Review → Delivered. Tap one to see more.",
      mood: "think",
    },
    {
      path: "/portal",
      target: "nav-documents",
      title: "Documents",
      text: "Signed agreements, designs and files we send you live here. You can also upload things for us — your logo, photos, price lists.",
      mood: "point",
    },
    {
      path: "/portal",
      target: "nav-invoices",
      title: "Invoices",
      text: "See what's been billed, what you've paid and anything still due.",
      mood: "point",
    },
    {
      path: "/portal",
      target: "guide-launcher",
      title: "Need a reminder?",
      text: "Tap “Show me around” any time to see this again. Or tap “Practice” to try everything with sample data — nothing there is real.",
      mood: "think",
    },
    {
      path: "/portal",
      target: "help",
      title: "You're all set! 🎉",
      text: "Stuck on anything? Message us on WhatsApp — a real person will answer.",
      mood: "happy",
    },
  ],

  practice: [
    {
      path: "/portal/practice",
      title: "Welcome to Practice",
      text: "This is a pretend portal with sample data. Tap anything you like — nothing is sent or saved. Let's try it together.",
      mood: "wave",
    },
    {
      path: "/portal/practice",
      target: "practice-project",
      title: "A sample project",
      text: "This one is “In progress”. As we work, it moves along the stages and you'll see it change here.",
      mood: "point",
    },
    {
      path: "/portal/practice",
      target: "practice-tab-invoices",
      title: "Tap “Invoices”",
      text: "Go on, tap it. I'll wait.",
      mood: "point",
      waitFor: "practice:tab:invoices",
    },
    {
      path: "/portal/practice",
      target: "practice-invoice",
      title: "Reading an invoice",
      text: "The number, what it's for, the amount and when it's due. Paid ones turn blue.",
      mood: "think",
    },
    {
      path: "/portal/practice",
      target: "practice-tab-sign",
      title: "Now tap “Sign”",
      text: "Let's practise signing an agreement.",
      mood: "point",
      waitFor: "practice:tab:sign",
    },
    {
      path: "/portal/practice",
      target: "practice-sign",
      title: "Sign with your finger",
      text: "Draw your signature in the box, tick “I agree”, then press “Sign”. Mess it up? Tap “Clear” and try again.",
      mood: "point",
      waitFor: "practice:signed",
    },
    {
      path: "/portal/practice",
      title: "Perfect! 🎉",
      text: "That's exactly how you'll sign real agreements. You're ready for the real thing.",
      mood: "happy",
      cta: { label: "Back to my portal", href: "/portal" },
    },
  ],

  "tip-agreement": [
    {
      path: "/portal",
      target: "sign-banner",
      title: "You have something to sign",
      text: "Tap here to read your agreement and sign it with your finger. It takes about a minute.",
      mood: "point",
    },
  ],
  "tip-invoice": [
    {
      path: "/portal",
      target: "nav-invoices",
      title: "Your first invoice is here",
      text: "Tap Invoices to see the amount and due date. Questions about it? Message us on WhatsApp.",
      mood: "point",
    },
  ],
  "tip-document": [
    {
      path: "/portal",
      target: "nav-documents",
      title: "New in Documents",
      text: "We've added a file for you. Find it under Documents — tap Download to keep a copy.",
      mood: "point",
    },
  ],
};
