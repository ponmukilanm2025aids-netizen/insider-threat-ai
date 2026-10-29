import React from 'react';

interface LotusLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  subtitle?: string;
}

export const LotusLogo: React.FC<LotusLogoProps> = ({
  className = '',
  size = 40,
  showText = true,
  subtitle = 'Panchakarma Clinical Care',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-2xl bg-[#244C3A] shadow-md border border-[#B99756]/40 p-2"
        style={{ width: size, height: size }}
      >
        {/* Sacred Lotus / Herbal Emblem */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer gentle halo */}
          <circle cx="50" cy="50" r="44" stroke="#B99756" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          
          {/* Center Lotus Core */}
          <path
            d="M50 20 C42 35 38 52 50 78 C62 52 58 35 50 20 Z"
            fill="#B99756"
            opacity="0.95"
          />
          {/* Left Petal */}
          <path
            d="M50 78 C35 68 22 55 24 38 C35 44 45 60 50 78 Z"
            fill="#66856A"
            opacity="0.85"
          />
          {/* Right Petal */}
          <path
            d="M50 78 C65 68 78 55 76 38 C65 44 55 60 50 78 Z"
            fill="#66856A"
            opacity="0.85"
          />
          {/* Secondary Left Bud */}
          <path
            d="M50 78 C30 76 16 66 18 52 C28 58 40 68 50 78 Z"
            fill="#D4AF37"
            opacity="0.7"
          />
          {/* Secondary Right Bud */}
          <path
            d="M50 78 C70 76 84 66 82 52 C72 58 60 68 50 78 Z"
            fill="#D4AF37"
            opacity="0.7"
          />
          {/* Base Auspicious Arc */}
          <path
            d="M32 82 Q50 88 68 82"
            stroke="#DFC894"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xl font-bold tracking-tight text-[#244C3A]"
              style={{ fontFamily: 'Georgia, Cambria, serif' }}
            >
              AyurSutra
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#B99756]/20 text-[#8F6F33] border border-[#B99756]/30">
              AYUSH
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] font-medium tracking-wide text-[#73695E]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
