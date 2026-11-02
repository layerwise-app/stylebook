import { createFileRoute } from '@tanstack/react-router';
import { Blocks, PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/imagery')({
  head: ({ matches }) => pageHead(matches, '/imagery', 'Imagery'),
  component: ImageryPage
});

function ImageryPage() {
  const { imagery } = useGuide();
  return (
    <>
      <PageHero path='/imagery' title='Imagery' tone='brand' />

      <Section id='art-direction' title='Art direction'>
        <Blocks items={imagery.principles} />
      </Section>

      <Section id='examples' title='Examples' layout='bleed'>
        <div className='sb-gallery'>
          {imagery.examples.map((example) => (
            <figure key={example.id} className='sb-figure'>
              <img
                src={example.src}
                alt={example.alt}
                width={example.width}
                height={example.height}
                loading='lazy'
              />
              <figcaption className='t-small'>
                <strong>{example.title}.</strong> {example.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  );
}
