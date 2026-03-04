
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConvexProvider, ConvexReactClient } from "convex/react";

const getValidUrl = (url: any): string => {
  const fallback = "https://placeholder.convex.cloud";
  if (url === null || url === undefined) return fallback;
  if (typeof url !== 'string') return fallback;
  
  let trimmed = url.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return fallback;
  
  // Automatically add https:// if it looks like a hostname and protocol is missing
  if (!trimmed.includes('://') && (trimmed.includes('.convex.cloud') || trimmed.includes('.convex.site'))) {
    trimmed = `https://${trimmed}`;
  }
  
  // 1. Check if it's a deployment identifier FIRST
  // e.g., "prod:clear-pigeon-553|..."
  if (trimmed.startsWith('prod:') && trimmed.includes('|')) {
    const parts = trimmed.split(':');
    if (parts.length > 1) {
      const subParts = parts[1].split('|');
      if (subParts.length > 0) {
        const subdomain = subParts[0];
        const constructedUrl = `https://${subdomain}.convex.cloud`;
        console.log("Convex initialization - Detected deployment ID, converting to URL:", constructedUrl);
        return constructedUrl;
      }
    }
  }

  // 2. Try to parse as a URL
  try {
    const u = new URL(trimmed);
    // Convex requires http or https
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      console.error("Invalid Convex URL protocol:", u.protocol);
      return fallback;
    }
    return u.href;
  } catch (e) {
    console.error("Invalid Convex URL provided:", trimmed);
    return fallback;
  }
};

const convexUrl = (typeof import.meta !== 'undefined' && import.meta.env) 
  ? import.meta.env.VITE_CONVEX_URL 
  : (typeof process !== 'undefined' && process.env) 
    ? process.env.VITE_CONVEX_URL 
    : undefined;
const finalUrl = getValidUrl(convexUrl);

console.log("Convex initialization - Raw URL:", convexUrl);
console.log("Convex initialization - Final URL:", finalUrl);

if (finalUrl === "https://placeholder.convex.cloud") {
  console.warn("VITE_CONVEX_URL is not defined or is invalid. Convex features will not work until you configure the environment variable.");
}

// Global error handlers to catch unhandled rejections (like Vite HMR or Convex connection issues)
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason);
  const message = event.reason?.message || '';
  
  // Benign Vite HMR errors or Convex connection hiccups often show up here in restricted environments
  if (reasonStr.includes('WebSocket') || message.includes('WebSocket') || 
      reasonStr.includes('closed without opened') || message.includes('closed without opened')) {
    console.log('Suppressing benign WebSocket rejection overlay');
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  console.warn('Unhandled promise rejection caught:', event.reason);
});

// Suppress error overlay for WebSocket issues
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (message.includes('WebSocket') || message.includes('closed without opened')) {
    console.log('Suppressing benign WebSocket error overlay');
    event.preventDefault();
    event.stopPropagation();
    return;
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Helper to render error screens
const renderError = (title: string, message: string, detail?: string, rawValue?: string) => {
  root.render(
    <React.StrictMode>
      <div style={{ 
        padding: '30px', 
        fontFamily: 'system-ui, -apple-system, sans-serif', 
        color: '#721c24', 
        backgroundColor: '#fff5f5', 
        border: '1px solid #feb2b2', 
        borderRadius: '12px',
        maxWidth: '600px',
        margin: '40px auto',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ marginTop: 0, color: '#c53030' }}>{title}</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.5' }}>{message}</p>
        {rawValue && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Valor detectado:</p>
            <code style={{ display: 'block', padding: '10px', backgroundColor: '#edf2f7', borderRadius: '6px', overflowX: 'auto' }}>
              {rawValue}
            </code>
          </div>
        )}
        {detail && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Detalles técnicos:</p>
            <pre style={{ 
              fontSize: '12px', 
              padding: '15px', 
              backgroundColor: '#2d3748', 
              color: '#edf2f7', 
              borderRadius: '6px', 
              overflowX: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {detail}
            </pre>
          </div>
        )}
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#4a5568' }}>
          <p>Sugerencia: Verifique que la variable <code>VITE_CONVEX_URL</code> esté configurada correctamente en Google AI Studio.</p>
        </div>
      </div>
    </React.StrictMode>
  );
};

if (finalUrl === "https://placeholder.convex.cloud") {
  renderError(
    "Configuración de Convex Pendiente",
    "La variable de entorno VITE_CONVEX_URL no está definida o es inválida.",
    "Sin esta variable, las funciones de base de datos no estarán disponibles.",
    convexUrl || 'undefined'
  );
} else {
  let convex: ConvexReactClient;
  try {
    console.log("Attempting to initialize Convex with:", finalUrl);
    convex = new ConvexReactClient(finalUrl);
    
    root.render(
      <React.StrictMode>
        <ConvexProvider client={convex}>
          <App />
        </ConvexProvider>
      </React.StrictMode>
    );
  } catch (e) {
    console.error("FATAL: Failed to initialize ConvexReactClient:", e);
    renderError(
      "Error de Inicialización de Convex",
      "No se pudo inicializar el cliente de Convex con la URL proporcionada.",
      String(e),
      finalUrl
    );
  }
}
