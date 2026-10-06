import Link from "next/link";
import { DemoLinkBuilder } from "@/components/admin/demo-link-builder";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function AdminDemosPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Demo links</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
        One demo, named after whoever you&rsquo;re sitting with. Type their business
        name, pick what they sell, and walk in with a link that already looks like
        theirs.
      </p>

      <div className="mt-7 max-w-2xl">
        <DemoLinkBuilder origin={site.url} />
      </div>

      <div className="mt-8 max-w-2xl rounded-card border border-line bg-surface p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
          How to run it in the shop
        </h2>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-semibold text-ink">1.</span> Open <span className="font-semibold text-ink">Till</span> and
            let them ring up two things themselves. People believe their own hands.
          </li>
          <li>
            <span className="font-semibold text-ink">2.</span> Switch to <span className="font-semibold text-ink">Online shop</span> and
            buy one thing with M-Pesa. Make them wait the two seconds for the prompt.
          </li>
          <li>
            <span className="font-semibold text-ink">3.</span> Open <span className="font-semibold text-ink">Back office</span>. Both
            sales are there, and the stock has dropped. That is the sale &mdash; stop
            talking there.
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted">
          Nothing they tap is saved. Hit Reset, or reload, and it is clean for the next
          one. Public gallery:{" "}
          <Link href="/demos" className="font-semibold text-accent underline underline-offset-2">
            /demos
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
