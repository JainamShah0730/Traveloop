import React, { useEffect, useState, forwardRef } from 'react';

// forwardRef so the parent can pass a ref for html2canvas
const TripCard = forwardRef(({ tripData }, ref) => {
  const [bgUrl, setBgUrl] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!tripData?.destination) return;

    // Fetch background from our API
    const fetchPhoto = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/destinations/photo?city=${encodeURIComponent(tripData.destination)}`);
        if (res.ok) {
          const data = await res.json();
          setBgUrl(data.url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load Unsplash photo', err);
        setError(true);
      }
    };

    fetchPhoto();
  }, [tripData]);

  if (!tripData) return null;

  return (
    <div 
      ref={ref}
      style={{
        width: '1080px',
        height: '1080px',
        position: 'absolute',
        left: '-9999px', // Keep it off-screen
        top: 0,
        backgroundColor: '#0F6E56', // Fallback color
        backgroundImage: bgUrl && !error ? `url(${bgUrl})` : 'linear-gradient(to bottom right, #0F6E56, #1B4FD8)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#ffffff',
        fontFamily: "'Figtree', sans-serif",
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)'
      }}></div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        padding: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* Top */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#1B4FD8', fontWeight: 'bold', fontSize: '24px' }}>T</span>
            </div>
            <span style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '1px' }}>Travelloop</span>
          </div>
        </div>

        {/* Center / Bottom-ish */}
        <div style={{ paddingBottom: '40px' }}>
          <h2 style={{ 
            fontFamily: "'DM Serif Display', serif", 
            fontSize: tripData.destination?.length > 12 ? '80px' : '120px', 
            lineHeight: 0.95, 
            margin: '0 0 20px 0',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            wordBreak: 'break-word'
          }}>
            {tripData.destination}
          </h2>
          
          <div style={{ display: 'flex', gap: '40px', fontSize: '32px', marginBottom: '40px', opacity: 0.9 }}>
            <div>
              <div style={{ fontSize: '20px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: '8px' }}>Dates</div>
              <div>{tripData.depart_date} - {tripData.return_date}</div>
            </div>
            {tripData.duration_nights && (
              <div>
                <div style={{ fontSize: '20px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: '8px' }}>Duration</div>
                <div>{tripData.duration_nights} Nights</div>
              </div>
            )}
          </div>

          {(tripData.airline || tripData.hotel_name) && (
            <div style={{ 
              display: 'flex', 
              gap: '24px', 
              fontSize: '24px', 
              paddingTop: '32px', 
              borderTop: '2px solid rgba(255,255,255,0.2)' 
            }}>
              {tripData.airline && <span>✈️ {tripData.airline}</span>}
              {tripData.hotel_name && <span>🏨 {tripData.hotel_name}</span>}
            </div>
          )}

          {tripData.travelers && tripData.travelers.length > 0 && (
            <div style={{ fontSize: '24px', marginTop: '24px', opacity: 0.8 }}>
              Traveling with {tripData.travelers.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Branding Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        right: '80px',
        textAlign: 'right',
        zIndex: 10
      }}>
        <div style={{ fontSize: '20px', opacity: 0.8 }}>Planned on</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>Travelloop</div>
      </div>
    </div>
  );
});

export default TripCard;
