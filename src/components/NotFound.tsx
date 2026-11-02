import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <main className='sb-hero tone-brand' style={{ minHeight: '100dvh' }}>
      <p className='t-label'>404</p>
      <div>
        <h1 className='t-display'>Page not found</h1>
        <p className='sb-hero__lead'>
          <Link to='/' className='sb-text-link'>
            Back to the overview
          </Link>
        </p>
      </div>
    </main>
  );
}
