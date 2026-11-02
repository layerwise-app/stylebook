import { createFileRoute } from '@tanstack/react-router';
import { PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/changelog')({
  head: ({ matches }) => pageHead(matches, '/changelog', 'Changelog'),
  component: ChangelogPage
});

function ChangelogPage() {
  const { changelog } = useGuide();
  return (
    <>
      <PageHero path='/changelog' title='Changelog' tone='paper' />
      <Section id='versions' title='Versions'>
        {changelog.map((entry) => (
          <article key={entry.version} id={`v${entry.version}`} className='sb-version'>
            <div>
              <h3 className='t-h1'>{entry.version}</h3>
              <time className='t-small t-muted' dateTime={entry.date}>
                {entry.dateLabel}
              </time>
            </div>
            <ul>
              {entry.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </article>
        ))}
      </Section>
    </>
  );
}
