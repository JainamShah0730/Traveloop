import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Share } from 'lucide-react';

export default function ShareTripCard({ destination, country, departDate, returnDate, durationNights, totalBudget, context = 'package', coverPhotoUrl }) {
  const cardRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    setLoading(true);

    try {
      let photoSrc = coverPhotoUrl;
      // Fetch from API to get base64 and avoid CORS
      if (!photoSrc || !photoSrc.startsWith('data:')) {
         const res = await fetch(`${import.meta.env.VITE_API_URL}/api/destinations/photo?city=${destination}`);
         if (res.ok) {
           const data = await res.json();
           photoSrc = data.url;
         }
      }

      // Preload image
      const img = new Image();
      img.crossOrigin = "Anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => resolve(); // continue even if error
        img.src = photoSrc || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1080&h=1080&fit=crop';
      });

      if (cardRef.current) {
        const bgDiv = cardRef.current.querySelector('.share-bg');
        if (bgDiv) {
          bgDiv.style.backgroundImage = `url(${img.src})`;
        }
      }

      // Small delay to ensure styles apply
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(cardRef.current, {
        width: 1080,
        height: 1080,
        scale: 1,
        useCORS: true,
        allowTaint: true
      });
      
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'trip.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `My Travelloop Trip to ${destination}`,
          files: [new File([blob], 'trip.png', { type: 'image/png' })]
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `travelloop-${destination.toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error sharing trip:', err);
      alert('Failed to generate share image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleShare}
        disabled={loading}
        className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors shadow-sm"
        title="Share trip"
      >
        {loading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /> : <Share size={18} />}
      </button>

      {/* Hidden card for generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -1 }}>
        <div ref={cardRef} style={{ width: '1080px', height: '1080px', position: 'relative', backgroundColor: '#0f172a' }}>
          {/* Background image */}
          <div 
            className="share-bg"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#1B4FD8'
            }}
          />
          {/* Dark gradient overlay bottom 60% */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, transparent 60%)'
            }}
          />
          
          {/* Content overlay */}
          <div style={{ position: 'absolute', inset: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }}>
            {/* Top-left logo */}
            <div style={{ color: 'white', fontFamily: 'serif', fontSize: '36px', fontWeight: 'bold' }}>
              Travelloop
            </div>

            {/* Bottom info */}
            <div style={{ position: 'relative' }}>
              <div style={{ color: 'white', fontSize: '84px', fontWeight: 'bold', marginBottom: '16px', lineHeight: 1.1 }}>
                {destination}
              </div>
              <div style={{ color: 'white', fontSize: '36px', marginBottom: '40px', opacity: 0.9 }}>
                {country}
              </div>
              
              <div style={{ display: 'flex', gap: '48px', marginBottom: '16px' }}>
                <div style={{ color: 'white', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📅</span> {departDate || 'Flexible dates'}
                </div>
                <div style={{ color: 'white', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏳</span> {durationNights} days
                </div>
                {totalBudget > 0 && (
                  <div style={{ color: 'white', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💰</span> ₹{totalBudget.toLocaleString('en-IN')}
                  </div>
                )}
              </div>

              {/* Bottom-right watermark */}
              <div style={{ position: 'absolute', bottom: 0, right: 0, color: 'white', fontSize: '20px', opacity: 0.7 }}>
                Planned on travelloop.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
