import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, X, Loader2 } from 'lucide-react';
import TripCard from './TripCard';

export default function ShareTripModal({ trip, onClose }) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // The trip data shape expected by TripCard
  const tripData = {
    destination: trip.destination_city || trip.name || 'Unknown',
    depart_date: trip.start_date ? new Date(trip.start_date).toLocaleDateString() : '',
    return_date: trip.end_date ? new Date(trip.end_date).toLocaleDateString() : '',
    duration_nights: trip.start_date && trip.end_date 
      ? Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)) 
      : 0,
    travelers: trip.collaborators ? trip.collaborators.map(c => c.user.name) : [],
    airline: trip.flight_airline || '',
    hotel_name: trip.hotel_name || ''
  };

  const generateImage = async () => {
    if (!cardRef.current) return null;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        width: 1080,
        height: 1080,
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          setIsGenerating(false);
          resolve(blob);
        }, 'image/png');
      });
    } catch (err) {
      console.error('Failed to generate image', err);
      setIsGenerating(false);
      return null;
    }
  };

  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travelloop-${tripData.destination.toLowerCase().replace(/\s+/g, '-')}-trip.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `My trip to ${tripData.destination}`,
          text: `Check out my upcoming trip to ${tripData.destination} planned on Travelloop!`,
          files: [new File([blob], 'trip.png', { type: 'image/png' })]
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      // Fallback
      handleDownload();
    }
  };

  // Generate preview on mount (optional, here we just show a placeholder or wait for action)
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Hidden card for rendering */}
        <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
          <TripCard ref={cardRef} tripData={tripData} />
        </div>

        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-serif text-xl font-bold text-gray-900">Share your Trip</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center">
          <p className="text-gray-500 mb-6 text-center">
            Generate a beautiful trip card to share with friends on Instagram or WhatsApp.
          </p>

          <div className="w-full aspect-square max-w-[300px] bg-gray-100 rounded-xl mb-8 flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
             <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Share2 size={24} />
                </div>
                <p className="font-medium text-gray-700">Trip Card Ready</p>
                <p className="text-xs text-gray-400 mt-1">1080 × 1080 px (Square)</p>
             </div>
             
             {isGenerating && (
               <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                 <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                 <p className="text-sm font-medium text-gray-700">Generating image...</p>
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              Save Image
            </button>
            
            <button 
              onClick={handleShare}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
            >
              <Share2 size={18} />
              Share to Apps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
