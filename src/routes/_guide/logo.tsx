import { createFileRoute } from '@tanstack/react-router';
import type { LogoVariantView } from '~/brand/view';
import { PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/logo')({
  head: ({ matches }) => pageHead(matches, '/logo', 'Logo'),
  component: LogoPage
});

function ClearSpace({ variant }: { variant: LogoVariantView }) {
  // Drawn in the logo's own units, around the real file, so the guides stay
  // true for any logo that gets swapped in.
  const { width: w, height: h } = variant;
  const x = variant.clearSpace * h;
  const logo = variant.surfaces[0]!;
  const patternId = `hatch-${variant.id}`;
  const stroke = Math.max(w, h) / 500;
  const label = x * 0.42;
  return (
    <figure className='sb-diagram'>
      <div className='sb-diagram__stage tone-tint'>
        <svg
          role='img'
          aria-label={`${variant.name} with clear space of ${variant.clearSpace} times its height on every side`}
          viewBox={`${-x - stroke} ${-x - stroke} ${w + 2 * x + 2 * stroke} ${h + 2 * x + 2 * stroke}`}
          preserveAspectRatio='xMidYMid meet'
        >
          <defs>
            <pattern
              id={patternId}
              width={x / 3}
              height={x / 3}
              patternUnits='userSpaceOnUse'
              patternTransform='rotate(45)'
            >
              <line x1='0' y1='0' x2='0' y2={x / 3} stroke='currentColor' strokeWidth={stroke} opacity='0.45' />
            </pattern>
          </defs>
          <path
            fill={`url(#${patternId})`}
            fillRule='evenodd'
            d={`M${-x} ${-x}H${w + x}V${h + x}H${-x}ZM0 0V${h}H${w}V0Z`}
          />
          <rect x={-x} y={-x} width={w + 2 * x} height={h + 2 * x} fill='none' stroke='currentColor' strokeWidth={stroke} strokeDasharray={`${stroke * 5} ${stroke * 4}`} />
          <rect x={0} y={0} width={w} height={h} fill='none' stroke='currentColor' strokeWidth={stroke} />
          <image href={logo.svg} x={0} y={0} width={w} height={h} />
          {[
            [-x / 2, h / 2],
            [w + x / 2, h / 2],
            [w / 2, -x / 2],
            [w / 2, h + x / 2]
          ].map(([cx, cy]) => (
            <text
              key={`${cx}-${cy}`}
              x={cx}
              y={cy}
              fontSize={label}
              textAnchor='middle'
              dominantBaseline='central'
              fill='currentColor'
              style={{ fontFamily: 'var(--sb-font-mono)' }}
            >
              x
            </text>
          ))}
        </svg>
      </div>
      <figcaption className='t-small'>
        {variant.name}: x = {variant.clearSpace} × height
      </figcaption>
    </figure>
  );
}

function LogoPage() {
  const guide = useGuide();
  const { variants, misuse } = guide.logo;
  const example = variants[0]!;
  const light = example.surfaces[0]!;
  const alt = `${guide.name} ${example.name}`;
  return (
    <>
      <PageHero path='/logo' title='Logo' tone='ink' />

      <Section id='variants' title='Variants' layout='bleed'>
        {variants.map((variant) => (
          <article key={variant.id} className='sb-variant'>
            <div className='sb-variant__head'>
              <h3 className='t-h3'>{variant.name}</h3>
              <p className='t-small t-muted'>{variant.use}</p>
            </div>
            <div className='sb-panels'>
              {variant.surfaces.map((surface) => (
                <div
                  key={surface.id}
                  className='sb-panel'
                  style={{ background: surface.background, color: surface.text }}
                >
                  <div className='sb-panel__stage'>
                    <img
                      src={surface.svg}
                      alt={`${guide.name} ${variant.name.toLowerCase()}, ${surface.name.toLowerCase()}`}
                      width={variant.width}
                      height={variant.height}
                      loading='lazy'
                    />
                  </div>
                  <div className='sb-panel__foot t-small'>
                    <span>{surface.name}</span>
                    <span className='sb-panel__links'>
                      <a
                        className='sb-text-link'
                        href={surface.svgDownload}
                        download
                        aria-label={`Download ${variant.name} ${surface.name} SVG`}
                      >
                        SVG
                      </a>
                      {surface.pngs.map((png) => (
                        <a
                          key={png.size}
                          className='sb-text-link'
                          href={png.href}
                          download
                          aria-label={`Download ${variant.name} ${surface.name} PNG at ${png.size} pixels`}
                        >
                          PNG {png.size}
                        </a>
                      ))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </Section>

      <Section
        id='clear-space'
        title='Clear space'
        copy='Keep the hatched area free of type, images, and edges. It scales with the logo.'
      >
        <div className='sb-diagrams'>
          {variants.map((variant) => (
            <ClearSpace key={variant.id} variant={variant} />
          ))}
        </div>
      </Section>

      <Section
        id='minimum-size'
        title='Minimum size'
        copy='Each logo is shown here at its smallest allowed width. Below this, details close up.'
      >
        <div className='sb-minsize'>
          {variants.map((variant) => (
            <div key={variant.id} className='sb-minsize__item'>
              <div className='sb-minsize__logo'>
                <img
                  src={variant.surfaces[0]!.svg}
                  alt={`${guide.name} ${variant.name.toLowerCase()} at minimum size`}
                  style={{ width: variant.minWidthPx, height: 'auto', maxWidth: '100%' }}
                  width={variant.width}
                  height={variant.height}
                  loading='lazy'
                />
              </div>
              <div
                className='sb-minsize__ruler'
                style={{ width: variant.minWidthPx, maxWidth: '100%' }}
                aria-hidden='true'
              />
              <div className='t-small'>
                <div>{variant.name}</div>
                <div className='t-mono'>
                  {variant.minWidthPx} px / {variant.minWidthMm} mm
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id='misuse'
        title='Misuse'
        copy='All four examples below are the real logo, altered live. Please don’t do any of this.'
      >
        <div className='sb-misuse'>
          <figure className='sb-misuse__item'>
            <div className='sb-misuse__stage'>
              <img className='sb-misuse__stretched' src={light.svg} alt={`${alt}, stretched out of proportion`} loading='lazy' />
            </div>
            <figcaption className='t-small'>Don’t stretch or squash it.</figcaption>
          </figure>
          <figure className='sb-misuse__item'>
            <div className='sb-misuse__stage'>
              <span
                role='img'
                aria-label={`${alt}, recolored with a color outside the palette`}
                className='sb-misuse__recolor'
                style={{
                  background: misuse.wrongColor,
                  maskImage: `url("${light.svg}")`,
                  WebkitMaskImage: `url("${light.svg}")`,
                  aspectRatio: `${example.width} / ${example.height}`
                }}
              />
            </div>
            <figcaption className='t-small'>Don’t recolor it.</figcaption>
          </figure>
          <figure className='sb-misuse__item'>
            <div className='sb-misuse__stage'>
              <img className='sb-misuse__rotated' src={light.svg} alt={`${alt}, rotated`} loading='lazy' />
            </div>
            <figcaption className='t-small'>Don’t rotate it.</figcaption>
          </figure>
          <figure className='sb-misuse__item'>
            <div className='sb-misuse__stage' style={{ background: misuse.lowContrastBackground }}>
              <img src={light.svg} alt={`${alt}, on a low-contrast background`} loading='lazy' />
            </div>
            <figcaption className='t-small'>Don’t place it on a low-contrast background.</figcaption>
          </figure>
        </div>
      </Section>
    </>
  );
}
