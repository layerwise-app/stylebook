import { useNavigate } from '@tanstack/react-router';
import { Command } from 'cmdk';
import { useEffect, useRef, useState } from 'react';
import type { SearchItem } from '~/brand/view';
import { useGuide } from './use-guide';

function Item({ item, onPick }: { item: SearchItem; onPick: (item: SearchItem) => void }) {
  return (
    <Command.Item
      className='sb-search__item'
      value={`${item.title} ${item.detail} ${item.hash ?? item.to}`}
      keywords={item.keywords}
      onSelect={() => onPick(item)}
    >
      {item.swatch ? (
        <span className='sb-search__chip' style={{ background: item.swatch }} />
      ) : null}
      <span>{item.title}</span>
      <span className='sb-search__detail t-small'>{item.detail}</span>
    </Command.Item>
  );
}

/**
 * Every typed word must appear somewhere, and titles outrank everything else.
 * cmdk's default fuzzy match is too loose for short lists with long keywords: its
 * letters-in-order rule matched "clear space" against color descriptions.
 */
export function searchScore(value: string, query: string, keywords: string[] = []) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  const title = value.toLowerCase();
  const everything = `${title} ${keywords.join(' ').toLowerCase()}`;
  if (!words.every((word) => everything.includes(word))) return 0;
  const phrase = words.join(' ');
  if (title.startsWith(phrase)) return 1;
  if (title.includes(phrase)) return 0.8;
  return words.every((word) => title.includes(word)) ? 0.6 : 0.3;
}

export function useSearchShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
}

export function SearchDialog({
  dialogRef
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}) {
  const guide = useGuide();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => dialogRef.current?.close();
  const pick = (item: SearchItem) => {
    close();
    void navigate({ to: item.to as never, hash: item.hash });
  };

  return (
    // Keyboard users close it with Escape, which <dialog> handles natively. The
    // click handler only adds closing by clicking the backdrop.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className='sb-search tone-paper'
      aria-label='Search sections and colors'
      onClose={() => setQuery('')}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === dialogRef.current) close();
      }}
    >
      <Command
        className='sb-search__command'
        label='Search sections and colors'
        filter={searchScore}
      >
        <Command.Input
          ref={inputRef}
          className='sb-search__input'
          placeholder='Search sections and colors'
          value={query}
          onValueChange={setQuery}
          autoFocus
        />
        <Command.List className='sb-search__list'>
          <Command.Empty className='sb-search__empty'>Nothing matches that.</Command.Empty>
          <Command.Group heading='Colors' className='sb-search__group'>
            {guide.search
              .filter((i) => i.kind === 'color')
              .map((item) => (
                <Item key={item.title} item={item} onPick={pick} />
              ))}
          </Command.Group>
          <Command.Group heading='Sections' className='sb-search__group'>
            {guide.search
              .filter((i) => i.kind === 'section')
              .map((item) => (
                <Item key={`${item.to}#${item.hash ?? ''}`} item={item} onPick={pick} />
              ))}
          </Command.Group>
        </Command.List>
      </Command>
    </dialog>
  );
}
