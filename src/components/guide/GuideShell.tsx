import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PAGES, pageNumber, SHEET_PATH } from '~/lib/pages';
import { SearchDialog, useSearchShortcut } from './SearchDialog';
import { useGuide } from './use-guide';

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join();
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    elements.forEach((e) => observer.observe(e));
    return () => observer.disconnect();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active && ids.includes(active) ? active : null;
}

const noSubscribe = () => () => {};

function useShortcutLabel() {
  return useSyncExternalStore(
    noSubscribe,
    () => (/mac|iphone|ipad/i.test(navigator.platform) ? '⌘K' : 'Ctrl K'),
    () => 'Ctrl K'
  );
}

function Rail({ onSearch }: { onSearch: () => void }) {
  const guide = useGuide();
  const { pathname } = useLocation();
  const current = PAGES.find((p) => p.path === pathname);
  const active = useActiveSection(current?.sections.map((s) => s.id) ?? []);
  const shortcut = useShortcutLabel();
  return (
    <aside className='sb-rail'>
      <Link to='/' className='sb-rail__logo' aria-label={`${guide.name} guidelines, overview`}>
        <img
          src={guide.primaryLogo.light}
          alt=''
          width={guide.primaryLogo.width}
          height={guide.primaryLogo.height}
        />
      </Link>
      <nav className='sb-nav' aria-label='Sections'>
        <ul className='sb-nav__list'>
          {PAGES.map((page) => {
            const isCurrent = page.path === pathname;
            return (
              <li key={page.path}>
                <Link
                  to={page.path as never}
                  className='sb-nav__page'
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <span className='t-label'>{pageNumber(page.path)}</span>
                  <span>{page.title}</span>
                </Link>
                {isCurrent ? (
                  <ul className='sb-nav__sections t-small'>
                    {page.sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className='sb-nav__section'
                          aria-current={active === section.id ? 'location' : undefined}
                        >
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className='sb-rail__foot t-small'>
        <button type='button' className='sb-search-button' onClick={onSearch}>
          <span>Search</span>
          <span className='t-mono'>{shortcut}</span>
        </button>
        <Link to={SHEET_PATH} className='sb-text-link'>
          One-page sheet
        </Link>
        <a className='sb-text-link' href={`mailto:${guide.contactEmail}`}>
          {guide.contactEmail}
        </a>
      </div>
    </aside>
  );
}

function PhoneBar({ onSearch }: { onSearch: () => void }) {
  const guide = useGuide();
  const { pathname } = useLocation();
  const menu = useRef<HTMLDialogElement>(null);
  const close = () => menu.current?.close();
  return (
    <>
      <header className='sb-bar'>
        <Link to='/' aria-label={`${guide.name} guidelines, overview`}>
          <img
            src={guide.primaryLogo.light}
            alt=''
            width={guide.primaryLogo.width}
            height={guide.primaryLogo.height}
          />
        </Link>
        <div className='sb-bar__actions'>
          <button type='button' className='sb-quiet-button' onClick={onSearch}>
            Search
          </button>
          <button
            type='button'
            className='sb-quiet-button'
            aria-haspopup='dialog'
            onClick={() => menu.current?.showModal()}
          >
            Menu
          </button>
        </div>
      </header>
      <dialog ref={menu} className='sb-menu tone-ink' aria-label='Sections'>
        <div className='sb-menu__top'>
          <span className='t-label'>{guide.name}</span>
          <button type='button' className='sb-quiet-button' onClick={close} autoFocus>
            Close
          </button>
        </div>
        <nav aria-label='Sections'>
          <ul className='sb-menu__list'>
            {PAGES.map((page) => {
              const isCurrent = page.path === pathname;
              return (
                <li key={page.path}>
                  <Link
                    to={page.path as never}
                    className='sb-menu__page'
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={close}
                  >
                    <span className='t-label'>{pageNumber(page.path)}</span>
                    <span className='t-h2'>{page.title}</span>
                  </Link>
                  {isCurrent ? (
                    <ul className='sb-menu__sections'>
                      {page.sections.map((section) => (
                        <li key={section.id}>
                          <a
                            href={`#${section.id}`}
                            className='sb-menu__section sb-text-link'
                            onClick={close}
                          >
                            {section.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
            <li>
              <Link to={SHEET_PATH} className='sb-menu__page' onClick={close}>
                <span className='t-label'>+</span>
                <span className='t-h2'>One-page sheet</span>
              </Link>
            </li>
          </ul>
        </nav>
      </dialog>
    </>
  );
}

export function GuideShell() {
  const guide = useGuide();
  const { hash, pathname } = useLocation();
  const search = useRef<HTMLDialogElement>(null);
  const openSearch = useCallback(() => {
    if (!search.current?.open) search.current?.showModal();
  }, []);
  useSearchShortcut(openSearch);

  // Moves keyboard focus along with a deep link.
  useEffect(() => {
    if (hash) document.getElementById(hash)?.focus({ preventScroll: true });
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [hash, pathname]);

  return (
    <>
      <a href='#content' className='sb-skip tone-ink'>
        Skip to content
      </a>
      {guide.syncErrors ? (
        <div className='sb-alert tone-ink t-small' role='alert'>
          <strong>Brand files did not fully sync to Storage.</strong> This notice only shows in the
          local preview.
          <ul>
            {guide.syncErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className='sb-shell'>
        <Rail onSearch={openSearch} />
        <div style={{ minWidth: 0 }}>
          <PhoneBar onSearch={openSearch} />
          <main id='content' tabIndex={-1} className='sb-main'>
            <Outlet />
          </main>
          <footer className='sb-footer t-small'>
            <span>
              {guide.name} brand guidelines, version {guide.version}
            </span>
            <span>Updated {guide.updated}</span>
          </footer>
        </div>
      </div>
      <SearchDialog dialogRef={search} />
    </>
  );
}
