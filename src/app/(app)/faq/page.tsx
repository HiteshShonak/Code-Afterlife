import type { Metadata } from 'next';
import { FaqClient } from './FaqClient';

export const metadata: Metadata = {
  title: 'FAQ — Code Afterlife',
  description: 'Frequently asked questions about Code Afterlife — the platform where software never truly dies.',
};

export default function FaqPage() {
  return <FaqClient />;
}
