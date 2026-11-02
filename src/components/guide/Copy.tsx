import { useCallback, useEffect, useRef, useState } from 'react';

async function writeClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Older browsers and plain-http previews.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback(async (text: string) => {
    await writeClipboard(text);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }, []);
  return { copied, copy };
}

/** A whole row that copies: its label, its value, and a Copy or Copied state. */
export function CopyRow({ label, value }: { label: string; value: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type='button'
      className='sb-copy-row t-small'
      data-copy-value={value}
      aria-label={`Copy ${label} ${value}`}
      onClick={() => void copy(value)}
    >
      <span>{label}</span>
      <span className='t-mono'>{value}</span>
      <span className='sb-copy-row__action' aria-live='polite'>
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

export function CopyButton({
  value,
  label = 'Copy',
  className = 'sb-button'
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <button
      type='button'
      className={className}
      onClick={() => void copy(value)}
      aria-live='polite'
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

/** Copies this section's address, so anyone can link straight to it. */
export function CopyLink({ id, title }: { id: string; title: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type='button'
      className='sb-quiet-button t-small'
      aria-label={`Copy link to ${title}`}
      onClick={() =>
        void copy(`${window.location.origin}${window.location.pathname}#${id}`)
      }
    >
      <span aria-live='polite'>{copied ? 'Copied' : 'Copy link'}</span>
    </button>
  );
}
