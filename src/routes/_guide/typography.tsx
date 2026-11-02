import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import type { FontView } from '~/brand/view';
import { PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/typography')({
  head: ({ matches }) => pageHead(matches, '/typography', 'Typography'),
  component: TypographyPage
});

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &!?.,:;';

function Face({ font }: { font: FontView }) {
  return (
    <article className='sb-face'>
      <div>
        <div
          className='sb-face__sample'
          style={{ fontFamily: font.stack, fontWeight: font.specimenWeight }}
          aria-hidden='true'
        >
          Aa
        </div>
        <h3 className='t-h3' style={{ marginTop: 'var(--sb-space-4)' }}>
          {font.family}
        </h3>
        <p className='t-label t-muted'>{font.roleLabel}</p>
      </div>
      <div style={{ display: 'grid', gap: 'var(--sb-space-5)', alignContent: 'start' }}>
        <p className='sb-face__glyphs' style={{ fontFamily: font.stack, fontWeight: font.specimenWeight }}>
          {GLYPHS}
        </p>
        <p>{font.usage}</p>
        <ul className='sb-face__weights'>
          {font.weights.map((weight) => (
            <li key={weight.weight} className='sb-face__weight'>
              <span style={{ fontFamily: font.stack, fontWeight: weight.weight }}>
                {font.family} {weight.weight}
              </span>
              {weight.href ? (
                <a
                  className='sb-text-link t-small'
                  href={weight.href}
                  download
                  aria-label={`Download ${font.family} ${weight.weight}`}
                >
                  Download, {weight.size}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
        <p className='t-small t-muted'>
          License: {font.licenseName}.{' '}
          {font.licenseHref ? (
            <a className='sb-text-link' href={font.licenseHref} download>
              License text
            </a>
          ) : null}
          {!font.allowsDownload ? 'Its license doesn’t allow sharing the font files here.' : null}
        </p>
      </div>
    </article>
  );
}

function Tester() {
  const { type } = useGuide();
  const [text, setText] = useState(type.testLine);
  const [fontRole, setFontRole] = useState<FontView['role']>('display');
  const [size, setSize] = useState(72);
  const font = type.fonts.find((f) => f.role === fontRole) ?? type.fonts[0]!;
  return (
    <div className='sb-tester'>
      <div className='sb-tester__controls'>
        <fieldset className='sb-tester__fonts t-small'>
          <legend className='sr-only'>Typeface</legend>
          {type.fonts.map((option) => (
            <label key={option.role}>
              <input
                type='radio'
                name='tester-font'
                checked={option.role === fontRole}
                onChange={() => setFontRole(option.role)}
              />
              <span>{option.family}</span>
            </label>
          ))}
        </fieldset>
        <label className='sb-tester__size t-small'>
          <span>Size</span>
          <input
            type='range'
            min={14}
            max={160}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
          <span className='t-mono' style={{ minWidth: '4ch', textAlign: 'right' }}>
            {size} px
          </span>
        </label>
      </div>
      <label>
        <span className='sr-only'>Test text. Type anything.</span>
        <textarea
          className='sb-tester__input'
          rows={2}
          spellCheck={false}
          value={text}
          onChange={(event) => setText(event.target.value)}
          style={{
            fontFamily: font.stack,
            fontWeight: font.specimenWeight,
            fontSize: `min(${size}px, 18cqi)`
          }}
        />
      </label>
    </div>
  );
}

function TypographyPage() {
  const { type } = useGuide();
  return (
    <>
      <PageHero path='/typography' title='Typography' tone='tint' />

      <Section id='typefaces' title='Typefaces'>
        {type.fonts.map((font) => (
          <Face key={font.role} font={font} />
        ))}
      </Section>

      <Section id='test-line' title='Test line' copy='Type anything to see it in the real fonts.'>
        <Tester />
      </Section>

      <Section id='type-scale' title='Type scale'>
        {type.scale.map((step) => (
          <div key={step.id} className='sb-scale__row'>
            <div
              className='sb-scale__sample'
              style={{
                fontFamily: step.stack,
                fontWeight: step.weight,
                fontSize: `min(${step.sizePx}px, 14cqi)`,
                lineHeight: step.lineHeight,
                letterSpacing: `${step.tracking}em`,
                textTransform: step.uppercase ? 'uppercase' : 'none'
              }}
            >
              {type.testLine}
            </div>
            <div className='sb-scale__meta t-small t-muted'>
              <span style={{ fontWeight: 600 }}>{step.name}</span>
              <span className='t-mono'>
                {step.sizePx} px / {step.lineHeight} / {step.tracking} em
              </span>
              <span>
                {step.fontFamily} {step.weight}
              </span>
            </div>
          </div>
        ))}
      </Section>

      <Section id='usage' title='Usage by role'>
        <div className='sb-scroll-x' tabIndex={0} role='region' aria-label='Usage by role'>
          <table className='sb-table sb-table--stack'>
            <thead>
              <tr className='t-label'>
                <th scope='col'>Role</th>
                <th scope='col'>Font</th>
                <th scope='col'>Size</th>
                <th scope='col'>Use it for</th>
              </tr>
            </thead>
            <tbody>
              {type.scale.map((step) => (
                <tr key={step.id}>
                  <th scope='row' style={{ fontWeight: 600 }}>
                    {step.name}
                  </th>
                  <td>
                    {step.fontFamily} {step.weight}
                  </td>
                  <td className='t-mono sb-table__num'>{step.sizePx} px</td>
                  <td>{step.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
