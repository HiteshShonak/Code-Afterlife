import { ImageResponse } from 'next/og';
import { projectService } from '@/services/project.service';

export const alt = 'Code Afterlife Project';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let title = 'Project | Code Afterlife';
  let description = 'Rediscover, inherit, and revive abandoned software projects.';
  
  try {
    const project = await projectService.getBySlug(slug);
    if (project) {
      title = project.title;
      description = project.description || `Track the lifecycle of ${project.title}.`;
    }
  } catch (error) {
    console.error('Error fetching project for OG image:', error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          color: 'white',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '60px',
            background: 'linear-gradient(to bottom right, #111111, #000000)',
            border: '2px solid #333',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          <p style={{ margin: 0, fontSize: 32, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Code Afterlife
          </p>
          <h1
            style={{
              fontSize: 84,
              fontFamily: 'sans-serif',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.1,
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 36,
              color: '#aaaaaa',
              lineHeight: 1.4,
              maxWidth: '80%',
              margin: 0,
            }}
          >
            {description}
          </p>
          <div style={{ display: 'flex', flexGrow: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff' }} />
              <p style={{ fontSize: 24, color: '#fff', margin: 0 }}>codeafterlife.vercel.app</p>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
