import { createFileRoute, Link } from '@tanstack/react-router';
import { Blocks, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { SHEET_PATH } from '~/lib/pages';
import { siteUrl } from '~/lib/site';
import type { GuideView } from '~/brand/view';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/_guide/')({
  head: ({ matches }) => {
    const guide = matches[0]?.loaderData as GuideView | undefined;
    return seo({
      guide,
      title: guide ? `${guide.name} brand guidelines` : 'Brand guidelines',
      description: guide?.description,
      path: '/',
      jsonLd: guide
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: `${guide.name} brand guidelines`,
            description: guide.description,
            url: siteUrl('/')
          }
        : undefined
    });
  },
  component: Overview
});

function Overview() {
  const guide = useGuide();
  const { overview } = guide;
  return (
    <>
      <header className='sb-cover tone-brand'>
        <div className='sb-cover__inner'>
          <div className='sb-cover__meta t-label'>
            <span>{guide.name} brand guidelines</span>
            <span>
              Version {guide.version} / {guide.updated}
            </span>
          </div>
          <h1 className='sb-cover__title t-display'>{guide.tagline}</h1>
        </div>
        <img className='sb-cover__mark' src={guide.coverMark} alt='' width={512} height={512} />
      </header>
      <div className='sb-strip' aria-hidden='true'>
        {guide.color.swatches.map((swatch) => (
          <span
            key={swatch.id}
            style={{ background: swatch.hex, flexGrow: swatch.proportion, flexBasis: 0 }}
          />
        ))}
      </div>

      <Section id='stands-for' title='What it stands for'>
        <p className='t-h2' style={{ maxWidth: '26em', marginBottom: 'var(--sb-space-8)' }}>
          {overview.statement}
        </p>
        <Blocks items={overview.pillars} />
      </Section>

      <Section id='quick-downloads' title='Quick downloads'>
        <div className='sb-quick'>
          {overview.quickDownloads.map((item) => (
            <a key={item.href} href={item.href} download className='sb-quick__item'>
              <span className='t-h3'>{item.title}</span>
              <span className='t-small t-muted'>{item.detail}</span>
            </a>
          ))}
          <Link to={SHEET_PATH} className='sb-quick__item'>
            <span className='t-h3'>One-page sheet</span>
            <span className='t-small t-muted'>Print on A4 or Letter</span>
          </Link>
        </div>
      </Section>

      <Section id='last-updated' title='Last updated' layout='side'>
        <p className='t-h3'>
          {guide.updated}, version {guide.version}
        </p>
        <ul
          style={{ listStyle: 'none', padding: 0, marginTop: 'var(--sb-space-3)' }}
          className='t-measure'
        >
          {guide.changelog[0]?.changes.map((change) => (
            <li key={change} style={{ marginTop: 'var(--sb-space-2)' }}>
              {change}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 'var(--sb-space-4)' }}>
          <Link to='/changelog' className='sb-text-link'>
            Full changelog
          </Link>
        </p>
      </Section>
    </>
  );
}
