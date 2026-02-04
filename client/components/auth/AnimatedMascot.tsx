"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, memo } from "react";

interface AnimatedMascotProps {
  isPasswordVisible: boolean;
  hasError: boolean;
  mousePosition: { x: number; y: number };
  isTyping: boolean;
  focusedField: 'email' | 'password' | null;
  isSuccess: boolean;
}

// 🎯 PERFORMANCE: Memoized component to prevent unnecessary re-renders
const AnimatedMascot = memo(function AnimatedMascot({
  isPasswordVisible,
  hasError,
  mousePosition,
  isTyping,
  focusedField,
  isSuccess,
}: AnimatedMascotProps) {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  // 🎯 Smart eye tracking: Focus on fields when clicked, track mouse otherwise
  useEffect(() => {
    if (!isPasswordVisible) {
      // Priority 1: Look at focused field
      if (focusedField) {
        // Look directly at the focused input field
        if (focusedField === 'email') {
          setEyePosition({ x: 3, y: -2 }); // Look UP-right at email field (email is above)
        } else if (focusedField === 'password') {
          setEyePosition({ x: 3, y: 4 }); // Look DOWN-right at password field (password is below)
        }
      } else {
        // Priority 2: Track global mouse movement
        const maxMove = 4; // Maximum pupil movement in pixels
        const distance = Math.sqrt(mousePosition.x ** 2 + mousePosition.y ** 2);
        
        if (distance > 0) {
          // Normalize the vector and apply max movement
          const scale = Math.min(distance / 100, 1); // Scale factor based on distance
          const x = (mousePosition.x / distance) * maxMove * scale;
          const y = (mousePosition.y / distance) * maxMove * scale;
          
          setEyePosition({ x, y });
        } else {
          setEyePosition({ x: 0, y: 0 });
        }
      }
    } else {
      setEyePosition({ x: 0, y: 0 });
    }
  }, [mousePosition, isPasswordVisible, focusedField]);

  // Breathing animation for idle state
  const breathingAnimation = {
    scale: [1, 1.03, 1],
    transition: {
      duration: 3,
      repeat: Infinity as number,
      ease: "easeInOut" as const,
    },
  };

  // 🎯 REFINEMENT: Head shake with Z-axis rotation for error
  const shakeAnimation = {
    x: [0, -12, 12, -12, 12, 0],
    rotate: [0, -6, 6, -6, 6, 0],
    transition: {
      duration: 0.6,
      ease: "easeInOut" as const,
    },
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 300 320"
        className="drop-shadow-2xl"
        animate={!hasError ? breathingAnimation : {}}
      >
        {/* Character Container */}
        <motion.g
          animate={hasError ? shakeAnimation : {}}
        >
          {/* Star on top */}
          <motion.circle
            cx="150"
            cy="30"
            r="8"
            className="fill-yellow-400"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Main Head Circle - Purple gradient */}
          <defs>
            <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#9333ea', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 0.3 }} />
            </linearGradient>
            
            <linearGradient id="outerRing" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          {/* Outer ring with purple-pink gradient */}
          <motion.circle
            cx="150"
            cy="130"
            r="100"
            stroke="url(#outerRing)"
            strokeWidth="4"
            fill="url(#headGradient)"
            animate={hasError ? {
              stroke: ["url(#outerRing)", "#ef4444", "url(#outerRing)"],
            } : {}}
            transition={hasError ? {
              duration: 0.6,
              repeat: 2,
            } : {}}
          />

          {/* Face Elements */}
          <g>
            {/* Eyes and Hands Animation */}
            <AnimatePresence mode="wait">
              {!isPasswordVisible ? (
                // Eyes visible - normal state
                <motion.g
                  key="eyes-open"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  
                >
                  {/* Left Eye */}
                  <ellipse
                    cx="125"
                    cy="115"
                    rx="15"
                    ry="20"
                    className="fill-white"
                  />
                  {/* Left Pupil - centered, tracks cursor when typing */}
                  <motion.circle
                    cx={125}
                    cy={115}
                    r="8"
                    className="fill-purple-950"
                    animate={{
                      cx: 125 + eyePosition.x,
                      cy: 115 + eyePosition.y,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                  {/* Left Eye Shine */}
                  <circle
                    cx={128}
                    cy={112}
                    r="3"
                    className="fill-white"
                  />

                  {/* Right Eye */}
                  <ellipse
                    cx="175"
                    cy="115"
                    rx="15"
                    ry="20"
                    className="fill-white"
                  />
                  {/* Right Pupil - centered, tracks cursor when typing */}
                  <motion.circle
                    cx={175}
                    cy={115}
                    r="8"
                    className="fill-purple-950"
                    animate={{
                      cx: 175 + eyePosition.x,
                      cy: 115 + eyePosition.y,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                  {/* Right Eye Shine */}
                  <circle
                    cx={178}
                    cy={112}
                    r="3"
                    className="fill-white"
                  />
                </motion.g>
              ) : (
                // 🙈 PEEK-A-BOO: Hands covering eyes
                <motion.g
                  key="hands-covering"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Closed eyes behind hands */}
                  <motion.path
                    d="M 110 115 Q 125 110 140 115"
                    className="stroke-purple-900 fill-none"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M 160 115 Q 175 110 190 115"
                    className="stroke-purple-900 fill-none"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* Left Hand - Realistic palm and fingers */}
                  <motion.g
                    initial={{ x: -60, rotate: -30, scale: 0.5 }}
                    animate={{ x: 0, rotate: 0, scale: 1 }}
                    exit={{ x: -60, rotate: -30, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  >
                    {/* Palm - rounded realistic shape */}
                    <ellipse
                      cx="125"
                      cy="118"
                      rx="20"
                      ry="16"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2.5"
                    />
                    
                    {/* Thumb - curved, positioned naturally */}
                    <path
                      d="M 108 112 Q 104 108 106 103 Q 108 98 112 100 Q 115 102 113 107 Q 111 111 108 112 Z"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                    
                    {/* Index finger - curved */}
                    <ellipse
                      cx="118"
                      cy="102"
                      rx="4"
                      ry="13"
                      transform="rotate(-10 118 102)"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                    
                    {/* Middle finger - longest, curved */}
                    <ellipse
                      cx="126"
                      cy="100"
                      rx="4"
                      ry="15"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                    
                    {/* Ring finger - curved */}
                    <ellipse
                      cx="133"
                      cy="102"
                      rx="4"
                      ry="13"
                      transform="rotate(10 133 102)"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                    
                    {/* Pinky - shortest, curved */}
                    <ellipse
                      cx="140"
                      cy="107"
                      rx="3.5"
                      ry="11"
                      transform="rotate(15 140 107)"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                  </motion.g>

                  {/* Right Hand - Mirror of left hand */}
                  <motion.g
                    initial={{ x: 60, rotate: 30, scale: 0.5 }}
                    animate={{ x: 0, rotate: 0, scale: 1 }}
                    exit={{ x: 60, rotate: 30, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  >
                    {/* Palm - rounded realistic shape */}
                    <ellipse
                      cx="175"
                      cy="118"
                      rx="20"
                      ry="16"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2.5"
                    />
                    
                    {/* Thumb - curved, positioned naturally */}
                    <path
                      d="M 192 112 Q 196 108 194 103 Q 192 98 188 100 Q 185 102 187 107 Q 189 111 192 112 Z"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                    
                    {/* Pinky - shortest, curved */}
                    <ellipse
                      cx="160"
                      cy="107"
                      rx="3.5"
                      ry="11"
                      transform="rotate(-15 160 107)"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                    
                    {/* Ring finger - curved */}
                    <ellipse
                      cx="167"
                      cy="102"
                      rx="4"
                      ry="13"
                      transform="rotate(-10 167 102)"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                    
                    {/* Middle finger - longest, curved */}
                    <ellipse
                      cx="174"
                      cy="100"
                      rx="4"
                      ry="15"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                    
                    {/* Index finger - curved */}
                    <ellipse
                      cx="182"
                      cy="102"
                      rx="4"
                      ry="13"
                      transform="rotate(10 182 102)"
                      className="fill-purple-400 stroke-purple-600"
                      strokeWidth="2"
                    />
                  </motion.g>
                </motion.g>
              )}
            </AnimatePresence>

            {/* Mouth - Changes based on error state */}
            <AnimatePresence mode="wait">
              {!hasError ? (
                // Happy smile
                <motion.path
                  key="happy-mouth"
                  d="M 110 150 Q 150 170 190 150"
                  className="stroke-purple-400 fill-none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ pathLength: 0 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                // Sad mouth
                <motion.path
                  key="sad-mouth"
                  d="M 110 165 Q 150 145 190 165"
                  className="stroke-red-400 fill-none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ pathLength: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
          </g>

          {/* Body/Base oval */}
          <ellipse
            cx="150"
            cy="260"
            rx="90"
            ry="50"
            className="fill-purple-500/15 stroke-purple-400/40"
            strokeWidth="3"
          />
          
          {/* Inner body glow */}
          <ellipse
            cx="150"
            cy="255"
            rx="75"
            ry="40"
            className="fill-purple-600/10"
          />

          {/* Double Facepalm - BOTH hands slap from left and right! */}
          <AnimatePresence>
            {hasError && (
              <motion.g key="double-facepalm">
                {/* LEFT HAND - slaps from left side (cheeks) */}
                <motion.g
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15,
                    repeat: 2,
                    repeatType: "reverse",
                    repeatDelay: 0.1
                  }}
                >
                  {/* Left hand palm - moved to x=90 */}
                  <ellipse
                    cx="90"
                    cy="135"
                    rx="18"
                    ry="22"
                    transform="rotate(-20 90 135)"
                    className="fill-purple-400 stroke-purple-600"
                    strokeWidth="3"
                  />
                  {/* Fingers - moved outward */}
                  <rect x="75" y="118" width="4" height="16" rx="2" transform="rotate(-20 77 126)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                  <rect x="81" y="115" width="4" height="20" rx="2" transform="rotate(-20 83 125)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                  <rect x="87" y="113" width="4" height="22" rx="2" transform="rotate(-20 89 124)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                  <rect x="93" y="115" width="4" height="20" rx="2" transform="rotate(-20 95 125)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                  <rect x="99" y="118" width="4" height="16" rx="2" transform="rotate(-20 101 126)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                </motion.g>

                {/* RIGHT HAND - slaps from right side (cheeks) */}
                <motion.g
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15,
                    repeat: 2,
                    repeatType: "reverse",
                    repeatDelay: 0.1
                  }}
                >
                  {/* Right hand palm - moved to x=210 */}
                  <ellipse
                    cx="210"
                    cy="135"
                    rx="18"
                    ry="22"
                    transform="rotate(20 210 135)"
                    className="fill-purple-400 stroke-purple-600"
                    strokeWidth="3"
                  />
                  {/* Fingers - moved outward */}
                  <rect x="197" y="118" width="4" height="16" rx="2" transform="rotate(20 199 126)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                  <rect x="203" y="115" width="4" height="20" rx="2" transform="rotate(20 205 125)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                  <rect x="209" y="113" width="4" height="22" rx="2" transform="rotate(20 211 124)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                  <rect x="215" y="115" width="4" height="20" rx="2" transform="rotate(20 217 125)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                  <rect x="221" y="118" width="4" height="16" rx="2" transform="rotate(20 223 126)" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                </motion.g>

                {/* DOUBLE Impact effect - stars on BOTH sides! */}
                <motion.g
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: 2,
                  }}
                >
                  {/* Left side impact stars - moved out */}
                  <line x1="75" y1="125" x2="60" y2="115" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                  <line x1="75" y1="135" x2="60" y2="135" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                  <line x1="75" y1="145" x2="60" y2="155" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Right side impact stars - moved out */}
                  <line x1="225" y1="125" x2="240" y2="115" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                  <line x1="225" y1="135" x2="240" y2="135" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                  <line x1="225" y1="145" x2="240" y2="155" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                </motion.g>
              </motion.g>
            )}
          </AnimatePresence>
        </motion.g>

        {/* Floating particles around mascot */}
        {[...Array(4)].map((_, i) => (
          <motion.circle
            key={i}
            cx={80 + i * 50}
            cy={70 + (i % 2) * 10}
            r="3"
            className="fill-purple-400/50"
            animate={{
              y: [-15, 15, -15],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* 🎉 SUCCESS CELEBRATION - Victory animation! */}
        <AnimatePresence>
          {isSuccess && (
            <motion.g
              key="celebration"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
            >
              {/* Confetti explosion from center */}
              {[...Array(20)].map((_, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const distance = 120;
                const endX = 150 + Math.cos(angle) * distance;
                const endY = 150 + Math.sin(angle) * distance;
                
                return (
                  <motion.circle
                    key={`confetti-${i}`}
                    cx={150}
                    cy={150}
                    r={Math.random() * 4 + 2}
                    fill={['#fbbf24', '#facc15', '#a855f7', '#ec4899', '#22c55e'][i % 5]}
                    initial={{ cx: 150, cy: 150, opacity: 1 }}
                    animate={{
                      cx: endX,
                      cy: endY,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeOut",
                      delay: i * 0.02,
                    }}
                  />
                );
              })}

              {/* Victory stars spinning around */}
              {[0, 1, 2, 3].map((i) => (
                <motion.path
                  key={`star-${i}`}
                  d="M 0 -15 L 4 -4 L 15 -4 L 6 3 L 10 15 L 0 8 L -10 15 L -6 3 L -15 -4 L -4 -4 Z"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    x: 150 + Math.cos((i / 4) * Math.PI * 2 + Date.now() / 500) * 80,
                    y: 130 + Math.sin((i / 4) * Math.PI * 2 + Date.now() / 500) * 80,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1.5, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 1.5,
                    times: [0, 0.2, 0.8, 1],
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* Victory text */}
              <motion.text
                x="150"
                y="70"
                fontSize="24"
                fontWeight="bold"
                fill="#fbbf24"
                stroke="#f59e0b"
                strokeWidth="2"
                textAnchor="middle"
                className="pixel-font"
                initial={{ y: 50, opacity: 0, scale: 0.5 }}
                animate={{
                  y: 70,
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1.3, 1.3, 1.5],
                }}
                transition={{
                  duration: 1.5,
                  times: [0, 0.2, 0.8, 1],
                }}
              >
                SUCCESS!
              </motion.text>

              {/* Sparkle particles */}
              {[...Array(15)].map((_, i) => (
                <motion.circle
                  key={`sparkle-${i}`}
                  cx={80 + (i % 5) * 45}
                  cy={100 + Math.floor(i / 5) * 40}
                  r="2"
                  fill="white"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 2, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.05,
                    repeat: 2,
                  }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>
      </motion.svg>
    </div>
  );
});

export default AnimatedMascot;
