import { sql } from '@vercel/postgres';

export async function createTables() {
  const client = await sql.connect();
  try {
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        full_name VARCHAR(255),
        dni VARCHAR(50),
        employee_id VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        must_change_password BOOLEAN DEFAULT false
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS count_cycles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        archived BOOLEAN DEFAULT false
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS weeks (
        id SERIAL PRIMARY KEY,
        cycle_id INTEGER REFERENCES count_cycles(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) NOT NULL,
        finalization_observation TEXT,
        last_modified_by VARCHAR(255),
        last_modified_date TIMESTAMP
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        week_id INTEGER REFERENCES weeks(id) ON DELETE CASCADE,
        material_id VARCHAR(255) NOT NULL,
        description TEXT,
        manufacturer_code VARCHAR(255),
        category VARCHAR(255),
        location VARCHAR(255),
        system_stock INTEGER,
        quantity INTEGER,
        counted_date TIMESTAMP,
        counted_by VARCHAR(255)
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        field_changed VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS user_audit_log (
        id SERIAL PRIMARY KEY,
        admin_user_id INTEGER REFERENCES users(id),
        affected_user_id INTEGER REFERENCES users(id),
        action VARCHAR(255),
        details TEXT,
        action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Tablas creadas o ya existentes.');
  } catch (error) {
    console.error('Error al crear las tablas:', error);
    throw error;
  } finally {
    client.release();
  }
}
