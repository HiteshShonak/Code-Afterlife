import type { Metadata } from 'next';
import { AboutClient } from './AboutClient';

export const metadata: Metadata = {
  title: 'About — Code Afterlife',
  description: 'Software Never Dies. Discover the story and philosophy behind Code Afterlife.',
};

export default function AboutPage() {
  return <AboutClient />;
}
