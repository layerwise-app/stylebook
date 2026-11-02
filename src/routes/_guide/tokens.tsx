import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { CopyButton } from '~/components/guide/Copy';
import { PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/tokens')({
  head: ({ matches }) => pageHead(matches, '/tokens', 'Tokens'),
  component: TokensPage
});

function TokenTabs() {
  const { tokens } = useGuide();
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const format = tokens.formats[selected]!;

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = tokens.formats.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: selected === last ? 0 : selected + 1,
      ArrowLeft: selected === 0 ? last : selected - 1,
      Home: 0,
      End: last
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  };

  return (
    <div>
      <div className='sb-tabs' role='tablist' aria-label='Token format'>
        {tokens.formats.map((option, index) => (
          <button
            key={option.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type='button'
            role='tab'
            id={`token-tab-${option.id}`}
            aria-selected={index === selected}
            aria-controls='token-panel'
            tabIndex={index === selected ? 0 : -1}
            className='sb-tab'
            onClick={() => setSelected(index)}
            onKeyDown={onKeyDown}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div
        id='token-panel'
        role='tabpanel'
        aria-labelledby={`token-tab-${format.id}`}
        className='tone-ink'
      >
        <div className='sb-tokens__actions t-small'>
          <span className='t-mono'>
            {format.fileName}, {format.size}
          </span>
          <span style={{ display: 'flex', gap: 'var(--sb-space-3)', flexWrap: 'wrap' }}>
            <CopyButton value={format.code} label={`Copy ${format.label}`} />
            <a className='sb-button' href={format.href} download>
              Download
            </a>
          </span>
        </div>
        <pre
          className='sb-code'
          tabIndex={0}
          data-token-format={format.id}
          aria-label={`${format.label} source`}
        >
          {format.code}
        </pre>
      </div>
    </div>
  );
}

function TokensPage() {
  const { tokens } = useGuide();
  return (
    <>
      <PageHero path='/tokens' title='Tokens' tone='tint' />

      <Section id='formats' title='Formats'>
        <TokenTabs />
      </Section>

      <Section id='spacing' title='Spacing' copy='The steps layouts are built from. This site uses them too.'>
        <div className='sb-scroll-x' tabIndex={0} role='region' aria-label='Spacing scale'>
          <table className='sb-table sb-table--stack'>
            <thead>
              <tr className='t-label'>
                <th scope='col'>Token</th>
                <th scope='col'>Size</th>
                <th scope='col' style={{ width: '45%' }}>
                  Scale
                </th>
                <th scope='col'>Use it for</th>
              </tr>
            </thead>
            <tbody>
              {tokens.spacing.map((step) => (
                <tr key={step.id}>
                  <th scope='row' className='t-mono sb-table__token' style={{ fontWeight: 400 }}>
                    --space-{step.id}
                  </th>
                  <td className='t-mono sb-table__num'>{step.px} px</td>
                  <td>
                    <span className='sb-space-bar' style={{ width: step.px, maxWidth: '100%' }} />
                  </td>
                  <td className='t-small'>{step.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
