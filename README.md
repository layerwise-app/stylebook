# Stylebook

A brand guidelines site that a designer delivers to a client. One config file
runs everything: change the config and the logo files, and the whole site,
including its own design, becomes that brand's guidelines.

It has no accounts, admin area, or CMS. It's public by default and can be
protected with one shared password. To change anything, ask the Layerwise agent,
or follow the steps below.

## Replace the brand

1. **Logos.** Delete the old files in `brand-files/logos/` and add your SVGs.
   Each needs a `viewBox`, outlined text, and fills written as hex colors like
   `#1A2B3C`.
2. **Fonts.** Delete the old files in `brand-files/fonts/` and add yours, one
   static `.woff2` per weight, plus any license text.
3. **Config.** Rewrite `src/brand/brand.config.server.ts`. TypeScript checks it
   against `src/brand/types.ts`. Things to set with care:
   - `colors`: exactly one each with role `ink`, `paper`, and `brand`. Add `cmyk`
     and `pantone` only if you have real values.
   - `logos.colorways`: the hex replacements that turn your source logo into its
     dark and brand background versions.
   - `fonts.*.license.allowsDownload`: `true` only if the license lets you hand
     out the font files. When `false`, the font still displays on the site, but
     it's left out of Downloads and the zip.
   - `applications.packaging.shape`: `can` or `box`.
   - `imagery.examples[].scene`: `tide`, `fizz`, `citrus`, `glass`, `chart`,
     `pattern`, or `blocks`.
4. **Build.** Run `pnpm build-brand`. It regenerates `brand-files/generated/`:
   logo colorways, PNGs at 512, 1024, and 2048 px, tokens, rendered applications
   and imagery, and `brand-assets.zip`. Commit all of it.
5. **Sync.** The running preview notices the new build and syncs by itself. Look
   for `[brand sync]` in `.layerwise/dev-server.log`.
6. **Check.** Update the font list below, then run
   `pnpm check-types && pnpm lint && pnpm test && pnpm build && pnpm check-leaks`.

Text on any color is checked against WCAG 4.5:1. If a brand color can't meet it on
a background, the site uses the nearest ink or paper color for that text.

## Protect the site

In **Settings > Environment variables**, add `SITE_PASSWORD` as a **Secret**, then
select **Redeploy**. Send the client the link and the password separately.

- Every page, server function, and file then needs the password. Visitors see a
  plain page with a password field and nothing about the brand. Search engines
  are told to stay out.
- Five tries per 15 minutes per client. An unlock lasts 30 days.
- Changing the password ends every unlock. Removing it makes the site public.

To try it in the local preview, where environment variables don't reach: run
`pnpm db:migrate` once, then create a git-ignored `.dev.vars` file containing
`SITE_PASSWORD=something`. Delete the file to go back to public.

## How the files work

All brand files live in `brand-files/`, outside `public/`, and in private Layerwise
Storage. They're served at `/files/<key>` after the access check, where the key is
the file's path inside `brand-files/`. Public and protected sites use the same code
path.

When the local preview starts, and after each `pnpm build-brand`, new and changed
files upload by content hash and files no longer listed are deleted. That's how a
fork gets its files, since forking doesn't copy Storage. The sync goes through a
dev-only route that isn't in the production build. A file over your plan's per-file
limit shows a clear error in the preview and the log.

The preview and the published site share one Storage, so publish soon after syncing
a new brand. Files replaced by the preview stay in the Storage trash for 7 days.

Brand content only ever reaches the browser through the access-checked `getGuide`
server function. `pnpm check-leaks` proves it by searching the client bundle and
`public/` for brand content.

## Fonts

Everything is self-hosted from `brand-files/fonts/`. All are under the
[SIL Open Font License 1.1](https://openfontlicense.org), and the license texts ship
beside them:

- [Young Serif](https://github.com/noirblancrouge/YoungSerif)
- [Instrument Sans](https://github.com/Instrument/instrument-sans)
- [DM Mono](https://github.com/googlefonts/dm-mono)

## Commands

```bash
pnpm build-brand              # regenerate brand-files/generated/
pnpm test                     # color, contrast, token, gate, and sync tests
pnpm lint
pnpm check-types
pnpm build                    # production build
pnpm check-leaks              # after a build: search client assets for brand content
pnpm db:generate --name <x>   # after changing src/db/schema.ts
pnpm db:migrate               # apply migrations to the local database
```

## Where things are

- `src/brand/brand.config.server.ts`: the config
- `scripts/build-brand/`: the file build and the art templates
- `src/lib/color.ts`, `theme.ts`, `tokens.ts`: color math, site theme, tokens
- `src/server.ts`, `src/server/`: the password gate and `/files`
- `src/brand/guide.server.ts`: what pages receive
- `src/routes/_guide/`: the pages; `src/routes/sheet.tsx`: the one-page sheet
- `src/styles/guide.css`: the layout, which only reads `--sb-*` variables

Built on [Layerwise](https://layerwise.app) with TanStack Start, Cloudflare Workers,
D1, and Tailwind CSS.
