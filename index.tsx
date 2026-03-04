
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';



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

        </div>
      </div>
    </React.StrictMode>
  );
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

