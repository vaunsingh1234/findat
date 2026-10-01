import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initStringTune } from './lib/stringTune';

// Initialize StringTune on client load
if (typeof window !== 'undefined') {
  // Allow DOM to settle before binding
  window.addEventListener('DOMContentLoaded', () => {
    initStringTune();
  });
  // Immediate trigger if already ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initStringTune();
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
