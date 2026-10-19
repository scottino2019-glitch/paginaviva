import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global switchTab definition to handle any onclick="switchTab(...)" from interactive HTML
if (typeof window !== 'undefined') {
  (window as any).switchTab = function(tabName: any) {
    window.dispatchEvent(new CustomEvent('paginaviva:switchTab', { detail: tabName }));
  };
}

createRoot(document.getElementById('root')!).render(<App />);
