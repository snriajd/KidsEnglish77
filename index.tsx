
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro Crítico na Renderização:", error);
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">Erro de Renderização: ${error.message}</div>`;
  }
} else {
  console.error("Não foi possível encontrar o elemento root no DOM.");
}
