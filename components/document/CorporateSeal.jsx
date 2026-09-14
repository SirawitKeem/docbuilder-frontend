"use client";

import React from "react";

export default function CorporateSeal({ className = "w-20 h-20", opacity = 0.88 }) {
  return (
    <div
      className={`inline-block select-none pointer-events-none ${className}`}
      style={{ opacity }}
      title="ตราประทับสำคัญ บริษัท เครสท์ เซนโด จำกัด"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Rings */}
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke="#DC2626"
          strokeWidth="4"
          strokeDasharray="1 0"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.5"
        />
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.5"
        />

        {/* Text Paths */}
        <defs>
          {/* Top Arc Path for Thai Company Name */}
          <path
            id="seal-text-path-top"
            d="M 28,100 A 72,72 0 1,1 172,100"
            fill="none"
          />
          {/* Bottom Arc Path for English Company Name */}
          <path
            id="seal-text-path-bottom"
            d="M 172,100 A 72,72 0 0,1 28,100"
            fill="none"
          />
        </defs>

        {/* Curved Text - Thai (Top) */}
        <text
          fill="#DC2626"
          fontSize="11.5"
          fontWeight="bold"
          letterSpacing="1.2"
        >
          <textPath
            href="#seal-text-path-top"
            startOffset="50%"
            textAnchor="middle"
          >
            บริษัท เครสท์ เซนโด จำกัด
          </textPath>
        </text>

        {/* Curved Text - English (Bottom) */}
        <text
          fill="#DC2626"
          fontSize="9.5"
          fontWeight="bold"
          letterSpacing="1.8"
        >
          <textPath
            href="#seal-text-path-bottom"
            startOffset="50%"
            textAnchor="middle"
          >
            CREST ZENDO CO., LTD.
          </textPath>
        </text>

        {/* Side Stars */}
        <text x="21" y="104" fill="#DC2626" fontSize="11" fontWeight="bold" textAnchor="middle">★</text>
        <text x="179" y="104" fill="#DC2626" fontSize="11" fontWeight="bold" textAnchor="middle">★</text>

        {/* Center Emblem / Crest */}
        <g transform="translate(100, 100)">
          {/* Decorative Diamond Frame */}
          <rect
            x="-22"
            y="-22"
            width="44"
            height="44"
            fill="none"
            stroke="#DC2626"
            strokeWidth="1.2"
            transform="rotate(45)"
          />
          
          {/* Center Text */}
          <text
            y="-4"
            fill="#DC2626"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            ตราประทับ
          </text>
          <text
            y="9"
            fill="#DC2626"
            fontSize="8.5"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            OFFICIAL
          </text>
          <text
            y="20"
            fill="#DC2626"
            fontSize="7"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            ★ SEAL ★
          </text>
        </g>
      </svg>
    </div>
  );
}
