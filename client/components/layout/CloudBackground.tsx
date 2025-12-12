
"use client";
import { useEffect, useState } from "react";

export default function CloudBackground() {
  const [clouds, setClouds] = useState<any[]>([]);

  useEffect(() => {
    // Generate random cloud data on the client side
    const cloudCount = 10;
    const generatedClouds = Array.from({ length: cloudCount }).map((_, i) => ({
      id: i,
      // Random starting vertical position (0% to 70% of screen height)
      top: Math.random() * 70,
      // Random starting horizontal position for initial render
      left: Math.random() * 100,
      // Random scale (0.5 to 1.5)
      scale: 0.5 + Math.random(),
      // Random opacity for depth/subtlety
      opacity: 0.2 + Math.random() * 0.4,
      // Random animation duration (30s to 90s)
      duration: 30 + Math.random() * 60,
      // Random animation delay to offset cycles
      delay: Math.random() * -50
    }));
    setClouds(generatedClouds);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute w-32 h-auto"
          style={{
            top: `${cloud.top}%`,
            left: `${cloud.left}%`,
            opacity: 0.2 + Math.random() * 0.3, // Faint background clouds
            // Drifting animation
            animation: `floatRight ${cloud.duration}s linear infinite`,
            animationDelay: `${cloud.delay}s`,
          }}
        >
          <img
            src="/cloude.svg"
            alt=""
            className="w-full h-full"
            style={{
              transform: `scale(${cloud.scale})`, // Keep scale separate
            }}
          />
        </div>
      ))}
    </div>
  );
}
