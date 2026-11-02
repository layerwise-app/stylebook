import { createFileRoute } from '@tanstack/react-router';
import { CopyRow } from '~/components/guide/Copy';
import { PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/color')({
  head: ({ matches }) => pageHead(matches, '/color', 'Color'),
  component: ColorPage
});

function ColorPage() {
  const guide = useGuide();
  const { swatches, contrast } = guide.color;
  return (
    <>
      <PageHero path='/color' title='Color' tone='accent' />

      <Section
        id='palette'
        title='Palette'
        layout='bleed'
        copy='Select any value to copy it. HEX, RGB, HSL, and OKLCH are calculated from one source value. CMYK and Pantone appear only where they were specified, because they can’t be reliably calculated.'
      >
        <div className='sb-swatches'>
          {swatches.map((swatch) => (
            <article
              key={swatch.id}
              id={`color-${swatch.id}`}
              tabIndex={-1}
              className='sb-swatch'
              style={{ background: swatch.hex, color: swatch.on }}
            >
              <div>
                <h3 className='t-h2'>{swatch.name}</h3>
                <p className='t-small' style={{ marginTop: 'var(--sb-space-2)', maxWidth: '30ch' }}>
                  {swatch.usage}
                </p>
              </div>
              <div className='sb-swatch__values'>
                {swatch.values.map((value) => (
                  <CopyRow key={value.label} label={value.label} value={value.value} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id='proportion' title='Proportion' copy='Roughly how much of a layout each color should cover.'>
        <div className='sb-proportion'>
          {swatches.map((swatch) => (
            <div
              key={swatch.id}
              style={{
                background: swatch.hex,
                color: swatch.on,
                flexGrow: swatch.proportion,
                flexBasis: 0
              }}
              title={`${swatch.name}, ${swatch.proportion}%`}
            >
              <span className='t-label'>{swatch.proportion >= 10 ? `${swatch.proportion}%` : ''}</span>
            </div>
          ))}
        </div>
        <ul className='t-small' style={{ listStyle: 'none', padding: 0, marginTop: 'var(--sb-space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--sb-space-1) var(--sb-space-4)' }}>
          {swatches.map((swatch) => (
            <li key={swatch.id}>
              {swatch.name} <span className='t-mono'>{swatch.proportion}%</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id='contrast'
        title='Contrast'
        copy='Every pair of colors, with text color down the side and background along the top. Pass means the WCAG ratio for body text: AA at 4.5:1, AAA at 7:1. Large only means 3:1, for type 24 px and up.'
      >
        <div
          className='sb-scroll-x'
          tabIndex={0}
          role='region'
          aria-label='Contrast grid, scrolls sideways'
        >
          <table className='sb-contrast t-small'>
            <thead>
              <tr>
                <th scope='col'>
                  <span className='t-label'>Text / Ground</span>
                </th>
                {swatches.map((swatch) => (
                  <th key={swatch.id} scope='col'>
                    {swatch.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {swatches.map((foreground, row) => (
                <tr key={foreground.id}>
                  <th scope='row'>{foreground.name}</th>
                  {swatches.map((background, column) => {
                    const cell = contrast[row]![column]!;
                    if (row === column) {
                      return (
                        <td key={background.id} style={{ background: background.hex, color: background.on }}>
                          <div className='sb-contrast__none'>
                            <span aria-label='Same color'>Same</span>
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={background.id}
                        data-ratio={cell.ratio}
                        data-label={cell.label}
                        style={{ background: background.hex, color: cell.note }}
                      >
                        <div className='sb-contrast__cell'>
                          <span
                            className='sb-contrast__sample'
                            style={{ color: foreground.hex }}
                            aria-hidden='true'
                          >
                            Aa
                          </span>
                          <span>
                            <span className='t-mono' style={{ display: 'block' }}>
                              {cell.ratio}:1
                            </span>
                            <span style={{ fontWeight: 600 }}>{cell.label}</span>
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className='t-small t-muted' style={{ marginTop: 'var(--sb-space-2)' }}>
          Ratios are computed from the palette and rounded down.
        </p>
      </Section>
    </>
  );
}
