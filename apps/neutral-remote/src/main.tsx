import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Journey from './Journey';
import { createWebCapabilities } from '@portal/platform-runtime';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element is required.');
createRoot(rootElement).render(<StrictMode><Journey platform={createWebCapabilities()} /></StrictMode>);
