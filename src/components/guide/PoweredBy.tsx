import { useGuide } from './use-guide';

/** The Powered by Layerwise badge, in the version that reads on the paper color. */
export function PoweredBy({ className }: { className?: string }) {
  const guide = useGuide();
  return (
    <a
      href='https://layerwise.app'
      target='_blank'
      rel='noopener'
      className={className ? `sb-powered ${className}` : 'sb-powered'}
    >
      <img
        src={
          guide.darkPaper
            ? 'https://layerwise.app/powered-by-dark.png'
            : 'https://layerwise.app/powered-by.png'
        }
        alt='Powered by Layerwise'
        width={174}
        height={28}
        loading='lazy'
      />
    </a>
  );
}
