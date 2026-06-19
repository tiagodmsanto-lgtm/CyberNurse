import { getDatabase, generateId } from './database';

export interface SupportContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relation: string;
  notifyMissed: number;
  type: 'personal' | 'professional';
  profession?: string | null;
}

export function getAllContacts(): SupportContact[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>('SELECT * FROM caregivers ORDER BY name ASC');
  return rows.map(row => ({
    ...row,
    type: row.type || 'personal',
    profession: row.profession || null,
  }));
}

export function addContact(input: Omit<SupportContact, 'id'>): SupportContact {
  const db = getDatabase();
  const id = generateId();
  db.runSync(
    `INSERT INTO caregivers (id, name, phone, email, relation, notifyMissed, type, profession)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.phone || '',
      input.email || '',
      input.relation || '',
      input.notifyMissed ? 1 : 0,
      input.type || 'personal',
      input.profession || null,
    ]
  );
  return { id, ...input };
}

export function deleteContact(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM caregivers WHERE id = ?', [id]);
}
