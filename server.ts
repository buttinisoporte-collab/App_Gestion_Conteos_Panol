import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function createServer() {
  const app = express();

  // Middleware para parsear JSON
  app.use(express.json());

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/setup-database', async (req, res) => {
    try {
      const { createTables } = await import('./lib/db-schema.js');
      await createTables();
      res.status(200).json({ message: 'Base de datos configurada exitosamente.' });
    } catch (error) {
      console.error('Error al configurar la base de datos:', error);
      res.status(500).json({ message: 'Error interno del servidor al configurar la base de datos.' });
    }
  });

  // Configuración de Vite para desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Servir archivos estáticos en producción
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

createServer();
