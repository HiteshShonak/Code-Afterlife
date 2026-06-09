import { GuestSidebarClient } from './GuestSidebarClient';

/**
 * Server component shell for the guest sidebar.
 * Does NOT check auth — it is only rendered when hasSession === false in layout.tsx.
 * Renders the client-side sidebar with sign-in prompt and public nav links.
 */
export function GuestSidebar() {
  return <GuestSidebarClient />;
}
