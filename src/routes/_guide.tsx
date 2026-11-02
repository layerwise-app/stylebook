import { createFileRoute } from '@tanstack/react-router';
import { GuideShell } from '~/components/guide/GuideShell';

export const Route = createFileRoute('/_guide')({
  component: GuideShell
});
