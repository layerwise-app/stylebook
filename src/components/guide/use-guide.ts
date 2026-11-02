import { useLoaderData } from '@tanstack/react-router';
import type { GuideView } from '~/brand/view';

/** Brand data from the root route's access-checked loader. */
export function useGuide(): GuideView {
  return useLoaderData({ from: '__root__' });
}
