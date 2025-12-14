import React, { useState, useEffect } from 'react';
import './app-loader.scss';

interface AppLoaderProps {
    onLoadingComplete: () => void;
    duration?: number; // Duration in milliseconds, default 12000ms (12 seconds)
}

const AppLoader: React.FC<AppLoaderProps> = ({ onLoadingComplete, duration = 1200 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    { title: 'Initializing' },
    { title: 'Connecting to trading server...' },
    { title: 'Loading charts' },
    { title: 'Loading Blocky' },
    { title: 'Preparing dashboard' },
  ];

  // Initialize loading timer
  // Total loader duration fixed at 6 seconds
  const effectiveDuration = 6000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onLoadingComplete, 300); // Wait for fade out animation
    }, effectiveDuration);

    return () => clearTimeout(timer);
  }, [onLoadingComplete, effectiveDuration]);

  // Progress bar and message advancement
  useEffect(() => {
    if (!isVisible) return;

    setProgress(0);
    // Evenly split the 6s across all messages
    const totalPerMessageMs = Math.max(200, Math.floor(effectiveDuration / messages.length));
    const stepMs = totalPerMessageMs / 100;
    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      if (current > 100) {
        clearInterval(interval);
        // move to next message if any, and restart
        setMessageIndex(prev => {
          const next = prev + 1;
          if (next < messages.length) {
            // trigger next cycle
            setProgress(0);
            return next;
          }
          return prev;
        });
        return;
      }
      setProgress(current);
    }, Math.max(4, stepMs));

    return () => clearInterval(interval);
  }, [isVisible, messageIndex, duration]);

  if (!isVisible) return null;

  return (
    <div
      className="georgetown-loader"
      style={{
        backgroundImage: "url('/assets/images/deriv insider.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="chart-container"></div>
      
      <div className="content-overlay">
        <div className="maroon-banner">
          <h1 className="banner-title">megadbot.com</h1>
          <p className="banner-message">{messages[messageIndex]?.title || 'Connecting to trading server...'}</p>
          <div className="progress-wrapper">
            <div className="progress-track">
              <div className="loading-bar-glow" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-counter">{progress}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLoader;