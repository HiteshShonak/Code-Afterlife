import { ImageResponse } from 'next/og';

export const alt = 'Code Afterlife | Software Never Dies';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
          backgroundImage: 'radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a1a 2%, transparent 0%)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <p style={{ margin: 0, fontSize: 32, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Welcome to the
            </p>
            <h1
              style={{
                fontSize: 96,
                fontFamily: 'sans-serif',
                fontWeight: 900,
                color: 'white',
                lineHeight: 1,
                margin: 0,
              }}
            >
              Code Afterlife
            </h1>
            <p
              style={{
                fontSize: 40,
                color: '#aaaaaa',
                lineHeight: 1.4,
                maxWidth: '90%',
                margin: 0,
                marginTop: '16px',
              }}
            >
              Software Never Dies.
            </p>
          </div>
          <div style={{ display: 'flex', flexGrow: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
             <p style={{ fontSize: 24, color: '#666', margin: 0, lineHeight: 1 }}>Rediscover. Inherit. Revive.</p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img 
                  src="https://codeafterlife.vercel.app/favicon-32x32.png" 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', marginTop: '4px' }} 
                  alt="Code Afterlife Icon" 
                />
                <p style={{ fontSize: 24, color: '#fff', margin: 0, lineHeight: 1 }}>codeafterlife.vercel.app</p>
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
