/*!
 * KSUDUO
 * (c) 2021 Moritz Rehbach
 * GPL v3
 */

import * as React from 'react';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import {createRoot} from 'react-dom/client';
import {App} from './components/App/App';

createRoot(document.getElementById('app')!).render(<App/>);