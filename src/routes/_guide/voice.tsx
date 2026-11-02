import { createFileRoute } from '@tanstack/react-router';
import { Blocks, PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/voice')({
  head: ({ matches }) => pageHead(matches, '/voice', 'Voice'),
  component: VoicePage
});

function VoicePage() {
  const { voice } = useGuide();
  return (
    <>
      <PageHero path='/voice' title='Voice' tone='ink' />

      <Section id='principles' title='Principles'>
        <Blocks items={voice.principles} />
      </Section>

      <Section id='write-this' title='Write this, avoid this'>
        <div className='sb-pairs'>
          {voice.pairs.map((pair) => (
            <article key={pair.context} className='sb-pair'>
              <h3 className='t-label'>{pair.context}</h3>
              <div className='sb-pair__columns'>
                <div className='sb-pair__write tone-brand'>
                  <p className='t-label' style={{ marginBottom: 'var(--sb-space-3)' }}>
                    Write this
                  </p>
                  <p className='t-h2'>{pair.write}</p>
                </div>
                <div className='sb-pair__avoid'>
                  <p className='t-label t-muted' style={{ marginBottom: 'var(--sb-space-3)' }}>
                    Avoid this
                  </p>
                  <p className='sb-pair__avoid-text t-muted'>{pair.avoid}</p>
                </div>
              </div>
              <p className='t-small t-measure'>{pair.why}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
