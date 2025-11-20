import { useEffect, useState } from 'react';
import { checkBrowserCompatibility } from '../utils/errorHandler';
import './BrowserCheck.css';

function BrowserCheck({ children }) {
  const [compatibility, setCompatibility] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const result = checkBrowserCompatibility();
    setCompatibility(result);
  }, []);

  if (!compatibility || compatibility.isCompatible || dismissed) {
    return children;
  }

  return (
    <div className="browser-check-overlay">
      <div className="browser-check-modal">
        <div className="browser-check-icon">⚠️</div>
        <h2>Browser Compatibility Issue</h2>
        <p>Your browser may not support all features required for this application:</p>
        <ul className="browser-check-errors">
          {compatibility.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
        <p className="browser-check-recommendation">
          For the best experience, please use the latest version of:
        </p>
        <ul className="browser-check-list">
          <li>Google Chrome</li>
          <li>Mozilla Firefox</li>
          <li>Microsoft Edge</li>
        </ul>
        <div className="browser-check-actions">
          <button 
            className="browser-check-btn primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
          <button 
            className="browser-check-btn secondary"
            onClick={() => setDismissed(true)}
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default BrowserCheck;

