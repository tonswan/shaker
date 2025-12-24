
import React from 'react';

interface JarProps {
  fillLevel: number;
}

const Jar: React.FC<JarProps> = ({ fillLevel }) => {
  // fillLevel is 0 to 100
  const actualFill = Math.min(100, Math.max(0, fillLevel));
  
  return (
    <div className="relative w-48 h-64 mx-auto mt-8">
      {/* Jar Outline */}
      <div className="absolute inset-0 border-4 border-white/30 rounded-b-3xl rounded-t-lg overflow-hidden bg-white/5 backdrop-blur-sm">
        {/* Liquid Container */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-white transition-all duration-300 ease-out"
          style={{ height: `${actualFill}%` }}
        >
          {/* Wave Effect */}
          <div className="absolute -top-4 left-0 w-[200%] h-8 bg-white opacity-80 liquid-wave rounded-[40%]" />
        </div>
      </div>
      
      {/* Glare Effect */}
      <div className="absolute top-4 left-4 w-2 h-24 bg-white/10 rounded-full" />
      
      {/* Score Text inside Jar if high enough */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-4xl font-black ${actualFill > 50 ? 'text-slate-900' : 'text-white'} transition-colors`}>
          {Math.floor(actualFill)}%
        </span>
      </div>
    </div>
  );
};

export default Jar;
