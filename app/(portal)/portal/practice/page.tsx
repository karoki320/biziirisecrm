import type { Metadata } from "next";
import { StatusTimeline } from "@/components/portal/status-timeline";
import { PracticePortal } from "@/components/guide/practice-portal";

export const metadata: Metadata = {
  title: "Practice",
  robots: { index: false, follow: false },
};

export default function PracticePage() {
  return <PracticePortal timeline={<StatusTimeline status="in_progress" />} />;
}
