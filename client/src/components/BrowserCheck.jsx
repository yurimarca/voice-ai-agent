import { useEffect, useState } from 'react';
import { checkBrowserCompatibility } from '../utils/errorHandler';

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
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
        <div className="text-5xl text-center mb-4">⚠️</div>
        <h2 className="m-0 mb-4 text-text-primary text-center text-xl font-semibold">Browser Compatibility Issue</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">Your browser may not support all features required for this application:</p>
        <ul className="bg-danger/10 border border-danger rounded-lg p-4 mb-4 list-inside list-disc">
          {compatibility.errors.map((error, index) => (
            <li key={index} className="text-danger mb-2 last:mb-0">{error}</li>
          ))}
        </ul>
        <p className="font-semibold mt-6 text-text-primary">
          For the best experience, please use the latest version of:
        </p>
        <ul className="list-inside list-disc my-2 mb-6 text-text-secondary">
          <li className="mb-1">Google Chrome</li>
          <li className="mb-1">Mozilla Firefox</li>
          <li className="mb-1">Microsoft Edge</li>
        </ul>
        <div className="flex gap-4 mt-6 md:flex-col">
          <button 
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-[15px] transition-all duration-200 bg-primary text-white hover:bg-primary-hover"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
          <button 
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-[15px] transition-all duration-200 bg-background text-text-secondary border border-border hover:bg-surface"
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

