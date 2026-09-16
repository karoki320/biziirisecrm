import Image from "next/image";

/**
 * The 16:5 band that sits under a page's header text.
 *
 * Renders nothing when `src` is null, so a page without art yet is a clean
 * text header rather than an empty box. Decorative throughout: aria-hidden,
 * empty alt, and the page reads identically with images off.
 */
export function HeaderBand({
  src,
  priority = false,
}: {
  src: string | null;
  priority?: boolean;
}) {
  if (!src) return null;

  return (
    <div
      aria-hidden="true"
      className="relative mt-12 aspect-[16/5] w-full overflow-hidden rounded-card border border-line bg-cream-deep md:aspect-[21/5]"
    >
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 1200px) 100vw, 1152px"
        className="object-cover"
      />
    </div>
  );
}

/**
 * The square hero image, right of the homepage headline.
 * Null renders nothing and the hero collapses to a single column — an empty
 * placeholder box reads as unfinished, which is worse than no image.
 */
export function HeroArt({ src }: { src: string | null }) {
  if (!src) return null;

  return (
    <div aria-hidden="true" className="hidden lg:block">
      <Image
        src={src}
        alt=""
        width={1200}
        height={1200}
        priority
        sizes="(max-width: 1024px) 0px, 50vw"
        className="h-auto w-full rounded-[28px]"
      />
    </div>
  );
}
