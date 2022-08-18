import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './pages/Home';
import './global.less';

createRoot(
  document.getElementById('root')
).render(<Home />)
