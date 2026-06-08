import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const notificationService = {
  /**
   * Notify followers when a project changes state to DEAD or SHIPPED,
   * signaling that the Time Capsule has been unsealed.
   */
  async notifyProjectUnsealed(projectId: string, newState: 'DEAD' | 'SHIPPED') {
    // Get project and author details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true },
    });

    if (!project) return;

    // Get followers
    const followers = await prisma.projectFollow.findMany({
      where: { projectId },
      include: { user: true },
    });

    if (followers.length === 0) return;

    const subject = newState === 'SHIPPED' 
      ? `The Time Capsule for ${project.title} has been unsealed!` 
      : `${project.title} has entered the Graveyard. Its Time Capsule is now open.`;

    const htmlContent = `
      <div style="font-family: monospace; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 8px; border: 1px solid #333;">
        <h1 style="color: #f59e0b; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Capsule Unsealed</h1>
        <p style="font-size: 14px; color: #ccc; line-height: 1.6;">
          You are receiving this because you follow <strong>${project.title}</strong> by @${project.user.username || project.user.name}.
        </p>
        <p style="font-size: 14px; color: #ccc; line-height: 1.6;">
          ${newState === 'SHIPPED' 
            ? 'The project has successfully shipped! The author\'s final testament and sealed time capsules are now available for public viewing.' 
            : 'The project has officially died and entered the graveyard. The author\'s final testament and sealed time capsules have been unlocked.'}
        </p>
        <div style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${project.slug}/unseal" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: #000; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">
            View Unsealed Capsule
          </a>
        </div>
        <p style="margin-top: 40px; font-size: 10px; color: #666; text-transform: uppercase;">
          Code Afterlife — Software Never Dies.
        </p>
      </div>
    `;

    // Create in-app notifications and send emails
    for (const follower of followers) {
      if (!follower.user.email) continue;

      try {
        // In-app notification
        await prisma.notification.create({
          data: {
            userId: follower.user.id,
            title: 'Time Capsule Unsealed',
            content: subject,
            link: `/project/${project.slug}/unseal`,
          },
        });

        // Email notification
        if (resend) {
          await resend.emails.send({
            from: 'Code Afterlife <notifications@codeafterlife.com>', // Requires verified domain in Resend
            to: follower.user.email,
            subject,
            html: htmlContent,
          });
        } else {
          console.warn('RESEND_API_KEY not set. Skipping email notification for', follower.user.email);
        }
      } catch (err) {
        console.error(`Failed to send notification to ${follower.user.email}:`, err);
      }
    }
  },
};
