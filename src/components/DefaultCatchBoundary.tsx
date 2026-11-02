import { useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  console.error(error);
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Something went wrong</h1>
      <p>This page couldn’t load. If the site just locked, reloading will ask for the password.</p>
      <p>
        <button
          type='button'
          style={{ textDecoration: 'underline', cursor: 'pointer' }}
          onClick={() => {
            void router.invalidate();
            window.location.reload();
          }}
        >
          Reload
        </button>
      </p>
    </main>
  );
}
