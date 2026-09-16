# Header art — one system, eight images

**Supersedes the four unrelated directions in this file's earlier version.** Those
were written before the logo existed. The logo settles it.

## The thinking

Your mark is a staircase rising into an arrow: **ascent through discrete steps.**
That is not decoration, it is the brand's argument — a business climbs in stages,
and each stage is something you build. Kenyan highland terracing is that same
shape in the landscape: stepped bands cut into a hillside, each one a platform the
next is built on. Geometric, unmistakably East African, and an exact rhyme with
your logo.

So: **one motif, eight variations.** Every page gets terraced steps. What changes
per page is what the steps are *doing*. Eight unrelated pictures would read as a
stock library; eight variations on one idea read as a brand.

Three rules the system enforces:

1. **Structure carries meaning.** The websites page gets three broad stable steps
   because that is the foundation product. The marketing page gets arcs radiating
   off a platform because that is reach. Nobody will consciously notice. Everyone
   will feel the site was designed rather than decorated.
2. **Interior pages stay quieter than home.** Home makes the full statement.
   Interior pages get a low band with more negative space. If every page shouts,
   none of them does.
3. **Nothing competes with the WhatsApp button.** On the homepage the art sits
   right, the left two-thirds stays clean, and the CTA is the only thing with
   weight.

**Homepage is human, interior pages are abstract.** That is a hierarchy, not an
inconsistency: the homepage wins strangers, the interior pages serve people who
are already interested and want to read. If you would rather the human note
recurred, the cheapest way is a small stick figure dropped into one or two of the
interior bands — the Work band is the natural one. Say the word.

## The palette, and why the light blues belong here

| Hex | Name | Contrast on cream | Role in the art |
|---|---|---|---|
| `#0B5C87` | deep petrol blue | 6.9:1 | all linework |
| `#109BFC` | bright azure (your logo) | 2.8:1 | primary fills |
| `#5FBDEC` | pale sky | 2.0:1 | secondary fills, receding elements |
| `#FCF9F0` | warm cream | — | ground |

The two light blues fail contrast for text. Inside an illustration that is the
point: they recede exactly as a secondary should, and the deep petrol linework
holds the structure. All three sit within 5° of the same hue, so they read as one
colour at three depths rather than three colours arguing.

---

## Style preamble — paste this at the start of EVERY prompt, unchanged

This is what makes eight images look like a set. Do not reword it between runs.

```
Flat geometric vector illustration, editorial style. Crisp hard edges, no
gradients, no shading, no texture. Two-tone construction: thin precise linework
in deep petrol blue (#0B5C87) with solid fills in bright azure (#109BFC) and
pale sky blue (#5FBDEC), on a warm cream background (#FCF9F0). Calm, precise,
confident. Generous negative space.
```

## Negative prompt — also unchanged every time

```
people, human figures, faces, hands, silhouettes of people, text, letters,
numbers, typography, watermark, logo, signature, photorealistic, 3d render,
isometric, glossy, drop shadow, gradient, stock photo, cluttered, busy,
neon, dark background, purple, orange, green, red, lens flare, vignette
```

---

# 1 · Home — "Checking the numbers"  ·  ALREADY BUILT

**This one is done and live in the code.** It is hand-drawn as inline SVG in
`components/hero-illustration.tsx`, not generated — see the note below for why.

A stick figure in a collar, blue tie and carrying a briefcase stands at the left,
one arm raised toward a large tilted phone. The phone's screen shows an ascending
bar chart with a dashed trend line climbing out of it.

The tie and briefcase are doing real work: at this level of abstraction a bare
stick figure reads as a doodle, and a doodle undercuts "we build serious
systems". Two accessories turn it into a person running a business without
adding a single extra stroke weight.

**Why it breaks from the abstract system, deliberately:** nobody sees themselves
in a hillside contour map. A phone with numbers going up is instantly legible to
a shop owner in Gikomba — *that is me, checking my business*. The homepage is
where you win a stranger; relatability beats sophistication there.

**How it still belongs to the system:** the chart on the screen *is* the logo
staircase, seen from the inside. The abstract mark on the interior pages and the
thing the person is looking at on the homepage are the same shape. The human
scene contains the geometry rather than replacing it.

## Why this one is drawn, not generated

Three reasons, and the first is the one that would have cost you a weekend:

1. **Generators are bad at stick figures.** They drift into Corporate Memphis —
   flat faceless people with oversized limbs, the most clichéd look on the
   internet — or into half-realistic figures. Hands on a phone fail worst of all.
2. **Zero network requests, about 2 KB in the HTML.** On a Nairobi 4G connection
   that is the difference between a hero that is simply there and one that pops
   in half a second late. Performance is part of your pitch.
3. **It cannot drift from the brand**, because it inherits the exact hex values.

If you still want to generate an alternative, the prompt is below and setting
`home` in `lib/art.ts` overrides the drawn version. But try the drawn one on a
phone first.

```
Flat single-weight line illustration, editorial diagram style. A very simple
stick figure in business dress — a plain circle for a head with no face, straight
single-stroke limbs, a simple collar and a solid blue necktie, carrying a small
briefcase in the lowered hand — standing at the left with one arm raised toward a
large smartphone floating at the right. The phone is drawn in the same uniform line weight,
tilted slightly, and its screen shows an ascending bar chart with a rising
dashed trend line and small solid dots at the turning points. Everything in
uniform deep petrol blue (#0B5C87) strokes on a warm cream background
(#FCF9F0); only the chart bars are filled, in bright azure (#109BFC) and pale
sky blue (#5FBDEC). A short horizontal ground line under the figure. No
shading, no gradients, no texture, no perspective. Warm, plain, human, unfussy.
--ar 1:1 --style raw
```

**Extra negatives for this one only**, on top of the shared list:

```
corporate memphis, flat vector people with oversized limbs, rounded mascot
character, cartoon character, detailed hands, fingers, facial features, eyes,
smile, 3d character, isometric, app store screenshot, realistic phone mockup
```

---

# 2 · Services index — "Four Terraces"

```
[STYLE PREAMBLE]
Subject: four stepped plateaus of increasing height ascending from left to right,
each plateau built from stacked horizontal contour lines in deep petrol blue.
Each plateau has a different number of lines and a different fill — two solid
bright azure, one pale sky blue, one left unfilled cream. Thin vertical connector
lines link one plateau to the next. Wide horizontal composition with open cream
space above the plateaus.
--ar 16:5 --style raw
```

**Why:** four plateaus, four services. The connectors say they build on each other.

---

# 3 · Services / Websites — "Foundation"

```
[STYLE PREAMBLE]
Subject: three broad, low, wide steps rising gently left to right, drawn as
widely spaced horizontal contour lines in deep petrol blue with the lowest step
filled solid bright azure. Deliberately simple and stable — nothing rises above
the third step. Large amounts of empty cream space above. Wide horizontal
composition.
--ar 16:5 --style raw
```

**Why:** this is the entry product. Broad, low, solid, and visibly the thing
everything else stands on.

---

# 4 · Services / Ecommerce — "Circulation"

```
[STYLE PREAMBLE]
Subject: a set of stepped terraces with one continuous looping line travelling
along the top of each terrace and dropping between them, forming a circuit.
Small solid squares in bright azure spaced evenly along the looping line, like
parcels moving through a route. Terraces drawn in thin deep petrol blue contour
lines, one terrace filled pale sky blue. Wide horizontal composition, open cream
space at upper left.
--ar 16:5 --style raw
```

**Why:** a shop is not a shape, it is a flow — order in, payment, delivery out.

---

# 5 · Services / Digital marketing — "Reach"

```
[STYLE PREAMBLE]
Subject: a low stepped platform on the left, built from horizontal contour lines
in deep petrol blue, with large concentric arcs radiating up and to the right
from a single point on the platform. Each successive arc is thinner and paler
than the last, bright azure fading to pale sky blue, and the outermost two arcs
break into dashed segments before dissolving into the cream. Wide horizontal
composition, the right side mostly open.
--ar 16:5 --style raw
```

**Why:** the platform is the content you produce; the arcs are what it does after
it leaves. The dissolving edge is honest — reach fades, which is why it is a
monthly retainer and not a one-off.

---

# 6 · Services / Custom builds — "Mechanism"

```
[STYLE PREAMBLE]
Subject: stepped rectangular blocks arranged in a rising formation but pulled
slightly apart from one another, revealing interlocking notches on their facing
edges. Thin deep petrol blue connector lines run between the separated blocks
like a schematic diagram, with small solid circular nodes where the lines meet
the blocks. Two blocks filled solid bright azure, one pale sky blue, the rest
outlined only. Wide horizontal composition with open cream space.
--ar 16:5 --style raw
```

**Why:** bespoke work is parts fitted to each other. Pulling them apart shows the
fit, which is the whole sell.

---

# 7 · Work — "The Ridge"

```
[STYLE PREAMBLE]
Subject: six stepped columns of differing heights standing side by side to form
an uneven ridge line, each column built from stacked horizontal contour bands in
deep petrol blue. Three columns filled solid bright azure, two pale sky blue, one
left unfilled. The tallest column sits slightly right of centre. Wide horizontal
composition, open cream sky above the ridge.
--ar 16:5 --style raw
```

**Why:** six columns, six case studies. Different heights because the jobs were
different sizes, which is true and worth saying quietly.

---

# 8 · Blog — "Strata"

```
[STYLE PREAMBLE]
Subject: horizontal lines of varying length stacked in groups like paragraphs of
text reduced to pure rule lines, in thin deep petrol blue. The stacks step
gradually upward from left to right so the whole field reads as sedimentary
strata rising. A few line groups are filled as solid bright azure bars, and
several lines break into dashed segments. Wide horizontal composition with
generous cream space.
--ar 16:5 --style raw
```

**Why:** writing as sediment that accumulates into ground you stand on. Also the
only one that hints at type without containing any.

---

# 9 · Login — no art

Deliberate. It is a utility screen for people who already know you; art there is
noise between a client and their invoice. The logo lockup is enough.

---

## Output specs

| Page | File | Generate at | Export |
|---|---|---|---|
| Home | `public/art/hero.webp` | 1200 × 1200 | WebP, ≤ 80 KB |
| Services index | `public/art/band-services.webp` | 1920 × 600 | WebP, ≤ 60 KB |
| Websites | `public/art/band-websites.webp` | 1920 × 600 | WebP, ≤ 60 KB |
| Ecommerce | `public/art/band-ecommerce.webp` | 1920 × 600 | WebP, ≤ 60 KB |
| Digital marketing | `public/art/band-marketing.webp` | 1920 × 600 | WebP, ≤ 60 KB |
| Custom builds | `public/art/band-custom.webp` | 1920 × 600 | WebP, ≤ 60 KB |
| Work | `public/art/band-work.webp` | 1920 × 600 | WebP, ≤ 60 KB |
| Blog | `public/art/band-blog.webp` | 1920 × 600 | WebP, ≤ 60 KB |

Flat vector art compresses extremely well — if a file lands over 100 KB, the
generator has snuck in a gradient or noise texture. Regenerate rather than ship
it; page weight is part of what you are selling.

**Safe area.** Generate the bands at 16:5, but the page crops them to roughly
21:5 on desktop to stop a header band eating a third of the screen. Keep
everything that matters inside the **middle 80% vertically** — the top and bottom
10% can be trimmed. All eight prompts ask for generous cream space above and
below, which is exactly the margin that gets cropped.

## Getting a consistent set out of a generator

This is where sets usually fall apart. Four things that hold it together:

1. **Generate all eight in one sitting**, same model, same settings. Models drift
   between sessions.
2. **Never reword the style preamble.** Change only the subject paragraph.
3. **Do the homepage first.** When you get one you like, feed it back as a style
   reference (Midjourney `--sref`, or an image prompt) for the other seven.
4. **Reject anything with a gradient.** It will look fine alone and wrong beside
   the other seven, and it inflates the file.

## Ship order

You do not need all eight to launch. Three gets you a coherent site:

1. **Home** — the only one that really matters for first impressions.
2. **One band** reused across all four service pages.
3. **Work** — the page that closes people.

Blog and per-service bands can follow. Better three consistent images than eight
that drift.

## A note on accessibility

All of this is decorative. It ships `aria-hidden="true"` with empty `alt`, and the
pages read identically with images off. That is deliberate: a screen reader
announcing "abstract terraced contour illustration" is noise, not access.
