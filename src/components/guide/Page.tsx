import type { ReactNode } from 'react';
import { pageNumber } from '~/lib/pages';
import { CopyLink } from './Copy';
import { useGuide } from './use-guide';

export type Tone = 'paper' | 'tint' | 'ink' | 'brand' | 'accent';

export function PageHero({
  path,
  title,
  tone
}: {
  path: string;
  title: string;
  tone: Tone;
}) {
  const guide = useGuide();
  return (
    <header className={`sb-hero tone-${tone}`}>
      <div className='sb-hero__top t-label'>
        <span>{pageNumber(path)}</span>
        <span>{guide.name}</span>
      </div>
      <div>
        <h1 className='sb-hero__title t-display'>{title}</h1>
        <p className='sb-hero__lead'>{guide.pages[path]?.lead}</p>
      </div>
    </header>
  );
}

export function Section({
  id,
  title,
  copy,
  layout = 'stack',
  children,
  className = ''
}: {
  id: string;
  title: string;
  copy?: ReactNode;
  /** `side` puts the heading in a left column; `bleed` runs content edge to edge. */
  layout?: 'stack' | 'side' | 'bleed';
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      className={`sb-section ${layout === 'bleed' ? 'sb-section--bleed' : ''} ${className}`}
    >
      <div
        className={`sb-section__inner ${layout === 'side' ? 'sb-section__inner--side' : ''}`}
      >
        <div className='sb-section__head'>
          <h2 id={`${id}-title`} className='t-h2'>
            {title}
          </h2>
          <div className='sb-section__copy'>
            <CopyLink id={id} title={title} />
          </div>
          {copy ? <div className='sb-section__lead t-measure t-muted'>{copy}</div> : null}
        </div>
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </section>
  );
}

export function Blocks({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className='sb-blocks' data-count={items.length}>
      {items.map((item) => (
        <div key={item.title} className='sb-block'>
          <h3 className='t-h3'>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
}
