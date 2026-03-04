import { createTables } from '../lib/db-schema';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await createTables();
    res.status(200).json({ message: 'Base de datos configurada exitosamente.' });
  } catch (error: any) {
    console.error('Error al configurar la base de datos:', error);
    res.status(500).json({ message: 'Error al configurar la base de datos', error: error.message });
  }
}
