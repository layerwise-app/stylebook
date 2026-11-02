import { createFileRoute, Link } from '@tanstack/react-router';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/sheet')({
  head: ({ matches }) => pageHead(matches, '/sheet', 'One-page sheet'),
  component: Sheet
});

function Sheet() {
  const guide = useGuide();
  const { swatches } = guide.color;
  const variants = guide.logo.variants.slice(0, 4);
  return (
    <div className='sb-sheet-desk tone-tint'>
      <div className='sb-sheet-tools t-small'>
        <Link to='/' className='sb-text-link'>
          Back to the guidelines
        </Link>
        <button type='button' className='sb-button' onClick={() => window.print()}>
          Print, A4 or Letter
        </button>
      </div>
      <main className='sb-sheet'>
        <header className='sb-sheet__head tone-brand'>
          <h1>
            <img
              src={guide.primaryLogo.brand}
              alt={`${guide.name} brand summary`}
              width={guide.primaryLogo.width}
              height={guide.primaryLogo.height}
            />
          </h1>
          <div className='sb-sheet__version t-label'>
            Version {guide.version}
            <br />
            {guide.updated}
          </div>
        </header>
        <p className='sb-sheet__tagline'>{guide.tagline}</p>
        <section className='sb-sheet__colors' aria-label='Colors'>
          {swatches.map((swatch) => (
            <div
              key={swatch.id}
              className='sb-sheet__color'
              style={{ background: swatch.hex, color: swatch.on }}
            >
              <strong>{swatch.name}</strong>
              {swatch.values
                .filter((v) => ['HEX', 'RGB', 'CMYK', 'Pantone'].includes(v.label))
                .map((v) => (
                  <span key={v.label} style={{ fontFamily: 'var(--sb-font-mono)' }}>
                    {v.value}
                  </span>
                ))}
            </div>
          ))}
        </section>
        <section className='sb-sheet__section'>
          <h2 className='sb-sheet__label'>Type</h2>
          <div className='sb-sheet__fonts'>
            {guide.type.fonts.map((font) => (
              <div key={font.role}>
                <span
                  className='sb-sheet__aa'
                  style={{ fontFamily: font.stack, fontWeight: font.specimenWeight }}
                >
                  Aa
                </span>
                <strong>{font.family}</strong>
                <div>{font.usage}</div>
              </div>
            ))}
          </div>
        </section>
        <section className='sb-sheet__section'>
          <h2 className='sb-sheet__label'>Logo</h2>
          <div className='sb-sheet__logos'>
            {variants.map((variant) => (
              <img
                key={variant.id}
                src={variant.surfaces[0]!.svg}
                alt={`${guide.name} ${variant.name.toLowerCase()}`}
              />
            ))}
          </div>
          <h2 className='sb-sheet__label' style={{ marginTop: '5mm' }}>
            Voice
          </h2>
          <div className='sb-sheet__voice'>
            {guide.voice.principles.slice(0, 4).map((rule) => (
              <p key={rule.title}>
                <strong>{rule.title}.</strong> {rule.body}
              </p>
            ))}
          </div>
        </section>
        <footer className='sb-sheet__foot'>
          <span>{guide.contactEmail}</span>
          <span>{guide.name} brand guidelines</span>
        </footer>
      </main>
    </div>
  );
}
