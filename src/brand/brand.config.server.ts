// The one file that defines this site. Change it (and the logos it points to),
// run `pnpm build-brand`, and the whole site becomes the new brand. See README.
//
// `.server.ts` keeps it out of browser bundles: the build fails if client code
// imports it. Pages only get this content through access-checked server functions.

import type { BrandConfig } from './types';

const config: BrandConfig = {
  name: 'Tidewell',
  tagline: 'Bitter by nature. Bright by the second sip.',
  description:
    'Brand guidelines for Tidewell, a sparkling tonic bottled on the turn of the tide: logo, color, type, voice, and every file you need.',
  contactEmail: 'brand@tidewell.example',

  overview: {
    statement:
      'Tidewell makes tonic for people who read the label. Cinchona bark, bitter orange peel, a pinch of sea salt, four grams of sugar a can. Nothing in it needs explaining, and nothing on the can tries to.',
    pillars: [
      {
        title: 'Honest bitterness',
        body: 'Quinine is the point. We never apologize for the bite or hide it behind syrup, and we print the sugar on the front of the can.'
      },
      {
        title: 'Tidal timing',
        body: 'Every batch is carbonated cold and canned within the hour, like a tide table: on schedule, measured, written down.'
      },
      {
        title: 'One clean shape',
        body: 'A crown cap, a waterline, one bubble. If a layout needs more than that to be recognized, the layout is wrong.'
      }
    ]
  },

  logos: {
    intro:
      'The cap is a crown cork seen from above: twenty-one crimps, one tide, one bubble rising. The same bubble dots the i in the wordmark. Always use the supplied files. Never retype the name.',
    faviconVariant: 'mark',
    variants: [
      {
        id: 'primary',
        name: 'Primary lockup',
        file: 'logos/primary.svg',
        use: 'The default. Use it wherever the width allows.',
        clearSpace: 0.5,
        minWidthPx: 120,
        minWidthMm: 28
      },
      {
        id: 'stacked',
        name: 'Stacked lockup',
        file: 'logos/stacked.svg',
        use: 'Square and tall formats: can fronts, coasters, social avatars.',
        clearSpace: 0.25,
        minWidthPx: 72,
        minWidthMm: 18
      },
      {
        id: 'mark',
        name: 'Cap',
        file: 'logos/mark.svg',
        use: 'Small spaces and sign-offs, once the name has already been seen.',
        clearSpace: 0.25,
        minWidthPx: 24,
        minWidthMm: 6
      },
      {
        id: 'wordmark',
        name: 'Wordmark',
        file: 'logos/wordmark.svg',
        use: 'Long, narrow spaces such as can seams, tape, and footers.',
        clearSpace: 0.75,
        minWidthPx: 72,
        minWidthMm: 16
      }
    ],
    colorways: {
      light: { name: 'On light', replace: {} },
      dark: {
        name: 'On dark',
        replace: { '#08262A': '#F7F3E8', '#0A4A48': '#F7F3E8' }
      },
      brand: {
        name: 'On brand',
        replace: { '#FF5C35': '#08262A', '#0A4A48': '#F7F3E8' }
      }
    }
  },

  colorIntro:
    'Salt and Fathom do most of the work. Peel is loud, so it gets whole fields rather than small accents. Peel on Salt fails for text, so type on Salt stays Fathom, always.',
  colors: [
    {
      id: 'fathom',
      name: 'Fathom',
      hex: '#08262A',
      role: 'ink',
      usage: 'All text on light grounds. Deep fields and can bases.',
      proportion: 22,
      cmyk: '85 / 55 / 60 / 75',
      pantone: 'PANTONE 5477 C'
    },
    {
      id: 'salt',
      name: 'Salt',
      hex: '#F7F3E8',
      role: 'paper',
      usage: 'The default ground. Reads as uncoated label stock.',
      proportion: 48,
      cmyk: '3 / 3 / 10 / 0'
    },
    {
      id: 'peel',
      name: 'Peel',
      hex: '#FF5C35',
      role: 'brand',
      usage: 'The cap and full-bleed fields. Set Fathom on it, never Salt.',
      proportion: 16,
      cmyk: '0 / 80 / 85 / 0',
      pantone: 'PANTONE 171 C'
    },
    {
      id: 'tidewater',
      name: 'Tidewater',
      hex: '#0A4A48',
      role: 'accent',
      usage: 'The tide inside the cap. Second field color on packs.',
      proportion: 7,
      cmyk: '90 / 45 / 65 / 40'
    },
    {
      id: 'seaglass',
      name: 'Seaglass',
      hex: '#B4DCCB',
      role: 'support',
      usage: 'Quiet fields, charts, and the Dry label.',
      proportion: 5
    },
    {
      id: 'quinine',
      name: 'Quinine',
      hex: '#E8F27A',
      role: 'support',
      usage: 'Sparing highlight. Tonic glows under UV light; this is that glow.',
      proportion: 2
    }
  ],

  typeIntro:
    'Young Serif has the weight of an old apothecary label and carries every headline. Instrument Sans stays out of its way. DM Mono sets anything measured: volumes, dates, sugar, tide times.',
  testLine: 'Four grams of sugar, and no apology.',
  fonts: {
    display: {
      family: 'Young Serif',
      fallback: 'serif',
      files: [{ weight: 400, file: 'fonts/young-serif-400.woff2' }],
      specimenWeight: 400,
      usage: 'Headlines and large statements. Sentence case. One weight only.',
      license: {
        name: 'SIL Open Font License 1.1',
        allowsDownload: true,
        file: 'fonts/OFL-young-serif.txt'
      }
    },
    text: {
      family: 'Instrument Sans',
      fallback: 'sans-serif',
      files: [
        { weight: 400, file: 'fonts/instrument-sans-400.woff2' },
        { weight: 500, file: 'fonts/instrument-sans-500.woff2' },
        { weight: 600, file: 'fonts/instrument-sans-600.woff2' },
        { weight: 700, file: 'fonts/instrument-sans-700.woff2' }
      ],
      specimenWeight: 500,
      usage: 'Paragraphs, captions, and interface text.',
      license: {
        name: 'SIL Open Font License 1.1',
        allowsDownload: true,
        file: 'fonts/OFL-instrument-sans.txt'
      }
    },
    mono: {
      family: 'DM Mono',
      fallback: 'monospace',
      files: [
        { weight: 400, file: 'fonts/dm-mono-400.woff2' },
        { weight: 500, file: 'fonts/dm-mono-500.woff2' }
      ],
      specimenWeight: 400,
      usage: 'Numbers, specs, and tide times. Never full sentences.',
      license: {
        name: 'SIL Open Font License 1.1',
        allowsDownload: true,
        file: 'fonts/OFL-dm-mono.txt'
      }
    }
  },
  typeScale: [
    {
      id: 'display',
      name: 'Display',
      font: 'display',
      weight: 400,
      sizePx: 128,
      lineHeight: 0.98,
      tracking: -0.02,
      usage: 'Can fronts, posters, and opening spreads. One per layout.'
    },
    {
      id: 'h1',
      name: 'Headline',
      font: 'display',
      weight: 400,
      sizePx: 72,
      lineHeight: 1.04,
      tracking: -0.015,
      usage: 'Page and slide titles.'
    },
    {
      id: 'h2',
      name: 'Subhead',
      font: 'display',
      weight: 400,
      sizePx: 38,
      lineHeight: 1.14,
      tracking: -0.01,
      usage: 'Sections and pull quotes.'
    },
    {
      id: 'h3',
      name: 'Lead',
      font: 'text',
      weight: 600,
      sizePx: 21,
      lineHeight: 1.32,
      tracking: -0.005,
      usage: 'Intro lines and card titles.'
    },
    {
      id: 'body',
      name: 'Body',
      font: 'text',
      weight: 400,
      sizePx: 17,
      lineHeight: 1.55,
      tracking: 0,
      usage: 'Paragraphs. Keep lines under 70 characters.'
    },
    {
      id: 'small',
      name: 'Small',
      font: 'text',
      weight: 400,
      sizePx: 14,
      lineHeight: 1.45,
      tracking: 0,
      usage: 'Captions and legal lines.'
    },
    {
      id: 'label',
      name: 'Measure',
      font: 'mono',
      weight: 500,
      sizePx: 12,
      lineHeight: 1.35,
      tracking: 0.04,
      uppercase: true,
      usage: 'Volumes, dates, and labels. Uppercase only here.'
    }
  ],
  spacing: [
    { id: 'hair', px: 4, usage: 'Between a label and its value.' },
    { id: 'sip', px: 8, usage: 'Inside tight groups.' },
    { id: 'splash', px: 12, usage: 'Between list rows.' },
    { id: 'pour', px: 16, usage: 'Default gap between related items.' },
    { id: 'glass', px: 24, usage: 'Padding inside a field.' },
    { id: 'can', px: 32, usage: 'Between groups.' },
    { id: 'crate', px: 48, usage: 'Between blocks.' },
    { id: 'shelf', px: 64, usage: 'Page margins on large layouts.' },
    { id: 'tide', px: 96, usage: 'Between major sections.' },
    { id: 'sound', px: 128, usage: 'Opening space on a spread.' }
  ],

  voice: {
    summary:
      'Tidewell talks like a tide table with a sense of humor: exact first, dry second. We say the number, we say what it means, and then we stop.',
    principles: [
      {
        title: 'Say the number',
        body: 'Four grams, 250 ml, canned within the hour. A real figure earns more trust than any adjective we could reach for.'
      },
      {
        title: 'Dry, never sour',
        body: 'The joke should land like the bitterness does: late, and on your side. We laugh at tonic and at ourselves, never at the person drinking it.'
      },
      {
        title: 'Plain words',
        body: 'Bitter, cold, salt, bark. If a word would look odd on a harbor notice, it probably does not belong on the can.'
      },
      {
        title: 'Stop early',
        body: 'Most drafts improve when you cut the last sentence. Leave room, the way a good pour does.'
      }
    ],
    pairs: [
      {
        context: 'Can front',
        write: 'Tonic. 4 g sugar. Properly bitter.',
        avoid: 'A refreshingly crafted premium mixer experience.',
        why: 'Facts fit on a can. Adjectives only take up the space.'
      },
      {
        context: 'Instagram caption',
        write: 'Canned at 06:14, high water. It is still cold about it.',
        avoid: 'Who else is SO ready for the weekend?! Tag your squad!',
        why: 'A specific time is funnier than an exclamation mark.'
      },
      {
        context: 'Out of stock',
        write: 'We ran out. The next batch is canned on Thursday.',
        avoid: 'Oops! Looks like this one was too popular to keep on the shelves!',
        why: 'Say what happened and when it gets fixed. Skip the humble brag.'
      },
      {
        context: 'Bar menu',
        write: 'Gin, Tidewell, peel. Stir it once and leave it alone.',
        avoid: 'An artisanal botanical fusion, elevated by our handcrafted tonic.',
        why: 'A bartender reads it in one glance. Nobody needs the word "elevated".'
      },
      {
        context: 'Ingredients question',
        write: 'Yes, there is real quinine in it. That is the bitter part.',
        avoid: 'Our proprietary blend harnesses the power of nature’s finest botanicals.',
        why: 'Name the ingredient and what it does. There is no secret here.'
      }
    ]
  },

  imagery: {
    summary:
      'We don’t use stock or staged photography. Tidewell images are cut, flat, and hard-edged, like paper shapes laid on label stock. If you could not cut it from colored card with a knife, leave it out.',
    principles: [
      {
        title: 'One waterline',
        body: 'Every scene sits on a single horizon. It may be high or low, but there is only ever one.'
      },
      {
        title: 'Flat color, hard edges',
        body: 'Four palette colors at most. No gradients, shadows, or texture. Depth comes from overlap.'
      },
      {
        title: 'Bubbles rise and thin out',
        body: 'They are small and crowded at the base, then larger and scarcer toward the top. Never scatter them evenly.'
      },
      {
        title: 'Crop it close',
        body: 'Let citrus and glass run off the edge. A whole object centered on a plain ground looks like clip art.'
      }
    ],
    examples: [
      {
        id: 'slack-water',
        scene: 'tide',
        title: 'Slack water',
        caption: 'The waterline at its calmest. Our default opening image for campaigns.',
        alt: 'Layered wave bands in deep teal and pale green under a large orange sun disc on a cream ground.',
        colors: ['salt', 'peel', 'tidewater', 'seaglass']
      },
      {
        id: 'first-pour',
        scene: 'fizz',
        title: 'First pour',
        caption: 'Bubbles crowd at the base and thin out as they rise. One in Peel gives the eye a place to land.',
        alt: 'Hundreds of cream circles rising up a dark field, small and dense at the bottom, large and sparse at the top, with one orange bubble.',
        colors: ['fathom', 'salt', 'peel', 'seaglass']
      },
      {
        id: 'bitter-peel',
        scene: 'citrus',
        title: 'Bitter peel',
        caption: 'A Seville orange, cut straight across and cropped hard. Shown large or not at all.',
        alt: 'A huge cross-section of an orange cropped by the frame, with flat dark segments on an orange ground.',
        colors: ['peel', 'salt', 'fathom', 'quinine']
      },
      {
        id: 'the-long-glass',
        scene: 'glass',
        title: 'The long glass',
        caption: 'Still life, side-on, on one table line. Ice is square because you could cut it that way.',
        alt: 'A flat tall tumbler on a table line, filled with pale green tonic, square ice cubes, rising bubbles, and a wheel of orange on the rim.',
        colors: ['seaglass', 'fathom', 'salt', 'peel']
      },
      {
        id: 'tide-table',
        scene: 'chart',
        title: 'Tide table',
        caption: 'Our data looks like a harbor notice. Plot real figures and label them in DM Mono.',
        alt: 'A tide chart with three thick curves over a thin grid, labeled with times of day on a dark green ground.',
        colors: ['tidewater', 'quinine', 'salt', 'peel'],
        labels: ['00:00', '06:14', '12:00', '18:32', '24:00', 'High water', 'Canned']
      },
      {
        id: 'crate-liner',
        scene: 'pattern',
        title: 'Crate liner',
        caption: 'The cap in rows, one turned to the brand color. Used for tissue, tape, and crate liners.',
        alt: 'A regular grid of the crown cap logo in dark ink on cream, with a single cap in orange.',
        colors: ['salt', 'fathom', 'peel', 'salt']
      }
    ]
  },

  applications: {
    socialPost: {
      kicker: 'New batch, 06:14',
      headline: 'Four grams of sugar. No apology.',
      footer: '@tidewell',
      alt: 'A social post on an orange field with a large serif headline reading "Four grams of sugar. No apology." and an oversized crown cap cropped at the corner.',
      caption: 'Instagram post, 1080 × 1350. Whole Peel field, one line of copy, cap cropped by the frame.'
    },
    businessCard: {
      name: 'Maren Okafor',
      title: 'Head of Blending',
      phone: '+1 555 0142',
      address: '14 Slipway Road, Harrow Sound',
      spec: '85 × 55 MM / 350 GSM UNCOATED / TWO SPOT COLORS',
      alt: 'A printer’s proof of a business card, front and back, with crop marks: the logo on cream and contact details on an orange back.',
      caption: 'Business card, shown as a printer’s proof. Front is logo only. Details go on the Peel back.'
    },
    packaging: {
      shape: 'can',
      items: [
        { label: 'Tonic', sublabel: 'Properly bitter. 4 g sugar.', color: 'peel' },
        { label: 'Dry', sublabel: 'More bark. 1 g sugar.', color: 'seaglass' },
        { label: 'Salt', sublabel: 'Sea salt and peel. 3 g sugar.', color: 'fathom' }
      ],
      spec: '250 ML SLEEK CAN / CANNED WITHIN THE HOUR',
      alt: 'Three flat-color drink cans side by side, in orange, pale green, and dark teal, labeled Tonic, Dry, and Salt with the stacked logo.',
      caption: 'The range. Each can is a single field of color, with the sugar printed on the front.'
    },
    slide: {
      kicker: 'Trade deck / The numbers',
      title: 'A third of an orange’s sugar.',
      body: 'A medium orange holds about 12 g of sugar. A can of Tidewell holds 4 g. Bartenders stopped asking for slimline.',
      stat: '4 g',
      statLabel: 'Sugar per 250 ml can',
      footer: 'Tidewell trade deck, 2026',
      alt: 'A presentation slide titled "A third of an orange’s sugar." with a large "4 g" statistic on an orange panel.',
      caption: 'Trade deck slide, 16:9. One idea and one number per slide.'
    },
    poster: {
      scene: 'tide',
      colors: ['seaglass', 'peel', 'fathom', 'tidewater'],
      headline: 'Bitter by nature.',
      subline: 'Bright by the second sip.',
      alt: 'A poster with a cut-paper tide and orange sun above a large serif headline reading "Bitter by nature."',
      caption: 'Harbor-front poster, A1. The image takes the top two thirds, the words sit below the waterline.'
    }
  },

  changelog: [
    {
      version: '1.2',
      date: '2026-10-19',
      changes: [
        'Added the Salt can to the range and its Fathom field to packaging.',
        'Raised the minimum size of the cap from 20 px to 24 px after small-size print tests.',
        'Added Bar menu and Ingredients question to the voice pairs.'
      ]
    },
    {
      version: '1.1',
      date: '2026-06-02',
      changes: [
        'Set Fathom as the only text color on Peel. Salt on Peel failed contrast checks.',
        'Added DM Mono for measures, replacing tabular figures in Instrument Sans.',
        'Added the crate liner pattern to imagery.'
      ]
    },
    {
      version: '1.0',
      date: '2026-02-16',
      changes: [
        'First release: logo family, palette, type pairing, voice principles, and the launch can.'
      ]
    }
  ]
};

export default config;
