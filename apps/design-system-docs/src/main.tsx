import { createRoot } from 'react-dom/client';
import { Button } from '@portal/design-system-web';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element is required.');
createRoot(rootElement).render(<main><h1>Documentação do Design System</h1><Button>Componente de fundação</Button></main>);
