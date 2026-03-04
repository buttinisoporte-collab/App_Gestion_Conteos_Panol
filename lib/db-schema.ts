import postgres from 'postgres';

export async function createTables() {
  const sqlUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (!sqlUrl) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required to create tables.');
  }

  const sql = postgres(sqlUrl);

  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT,
        dni TEXT,
        employee_id TEXT,
        status TEXT DEFAULT 'active',
        must_change_password BOOLEAN DEFAULT false
      );
    `;

    // Count Cycles table
    await sql`
      CREATE TABLE IF NOT EXISTS count_cycles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        archived BOOLEAN DEFAULT false
      );
    `;

    // Weeks table
    await sql`
      CREATE TABLE IF NOT EXISTS weeks (
        id TEXT PRIMARY KEY,
        cycle_id TEXT REFERENCES count_cycles(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        status TEXT NOT NULL,
        finalization_observation TEXT,
        finalized_by TEXT,
        finalization_date TIMESTAMP WITH TIME ZONE,
        last_modified_by TEXT,
        last_modified_date TIMESTAMP WITH TIME ZONE
      );
    `;

    // Items table
    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        week_id TEXT REFERENCES weeks(id) ON DELETE CASCADE,
        material_id TEXT NOT NULL,
        description TEXT,
        manufacturer_code TEXT,
        category TEXT,
        location TEXT,
        system_stock INTEGER,
        quantity INTEGER,
        counted_date DATE,
        counted_by TEXT
      );
    `;

    // Audit Log for Items
    await sql`
      CREATE TABLE IF NOT EXISTS item_audit_log (
        id SERIAL PRIMARY KEY,
        item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
        user_name TEXT,
        field_changed TEXT,
        old_value TEXT,
        new_value TEXT,
        change_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Audit Log for Users
    await sql`
      CREATE TABLE IF NOT EXISTS user_audit_log (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        action TEXT,
        performed_by TEXT,
        details TEXT,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // App Settings table
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value JSONB
      );
    `;

    // Seed initial admin user if no users exist
    const users = await sql`SELECT id FROM users LIMIT 1`;
    if (users.length === 0) {
      console.log('Seeding initial admin user...');
      await sql`
        INSERT INTO users (id, username, password, role, full_name, status, must_change_password)
        VALUES (
          'admin-01', 
          'Admin', 
          'Admin', 
          'admin', 
          'Administrador del Sistema', 
          'active', 
          false
        )
      `;
    }

    console.log('Tablas creadas o ya existentes en Supabase/Postgres.');
  } catch (error) {
    console.error('Error al crear las tablas:', error);
    throw error;
  } finally {
    await sql.end();
  }
}
