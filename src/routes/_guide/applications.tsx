import { createFileRoute } from '@tanstack/react-router';
import { PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/applications')({
  head: ({ matches }) => pageHead(matches, '/applications', 'Applications'),
  component: ApplicationsPage
});

function ApplicationsPage() {
  const { applications } = useGuide();
  return (
    <>
      <PageHero path='/applications' title='Applications' tone='accent' />
      {applications.map((piece) => {
        const portrait = piece.height > piece.width;
        return (
          <Section key={piece.id} id={piece.id} title={piece.title}>
            {portrait ? (
              <div className='sb-portrait'>
                <img
                  src={piece.src}
                  alt={piece.alt}
                  width={piece.width}
                  height={piece.height}
                  loading='lazy'
                />
                <p className='t-measure'>{piece.caption}</p>
              </div>
            ) : (
              <figure className='sb-figure'>
                <img
                  src={piece.src}
                  alt={piece.alt}
                  width={piece.width}
                  height={piece.height}
                  loading='lazy'
                />
                <figcaption className='t-small'>{piece.caption}</figcaption>
              </figure>
            )}
          </Section>
        );
      })}
    </>
  );
}
