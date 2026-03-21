import React from 'react';

// Renders a masonry-style / grid-structured gallery for grouped images and videos
const MediaGallery = ({ media }) => {
    const count = media.length;
    
    // Dynamic Grid Configuration
    let gridClass = 'grid gap-1 mt-2 overflow-hidden rounded-xl';
    
    if (count === 1) {
        gridClass += ' grid-cols-1';
    } else if (count === 2) {
        gridClass += ' grid-cols-2';
    } else if (count === 3) {
        gridClass += ' grid-cols-2'; // Third image spans full width bottom or first spans full width top
    } else if (count === 4) {
        gridClass += ' grid-cols-2';
    } else {
        gridClass += ' grid-cols-3'; // 5 or more
    }

    return (
        <div className={gridClass}>
            {media.map((item, idx) => {
                let itemClass = "relative overflow-hidden cursor-pointer group";
                
                // Aspect Ratio Logic
                if (count === 1) {
                    itemClass += " aspect-auto max-h-[350px] w-auto max-w-full";
                } else if (count === 3 && idx === 0) {
                    itemClass += " col-span-2 aspect-[2/1]"; // Top image spans full width
                } else {
                    itemClass += " aspect-square";
                }
                
                // Limit rendering to 9 items max for ultra large grids
                if (idx > 8) return null;

                const isMoreOverlay = count > 9 && idx === 8;

                return (
                    <a 
                        key={idx} 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={itemClass}
                    >
                        {item.resource_type === 'image' ? (
                            <img 
                                src={item.url} 
                                alt="attachment" 
                                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${count === 1 ? 'object-contain object-left' : ''}`}
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-900 relative">
                                <video src={item.url} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {isMoreOverlay && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl tracking-tight">
                                +{count - 9}
                            </div>
                        )}
                    </a>
                );
            })}
        </div>
    );
};

export default MediaGallery;
