import './styles/tailwind.css';
import { createRoot } from 'react-dom/client';
import { VercelV0Chat } from './components/ui/v0-ai-chat';

export { VercelV0Chat };

// Auto-mount on any page that has #n3t-ai-root
const mount = () => {
  const el = document.getElementById('n3t-ai-root');
  if (el) createRoot(el).render(<VercelV0Chat />);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
