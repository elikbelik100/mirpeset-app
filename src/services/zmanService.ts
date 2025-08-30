import type { Zman } from '../types';

const ZMAN_STORAGE_KEY = 'mirpeset-zmanim';

export class ZmanService {
  static getAll(): Zman[] {
    const raw = localStorage.getItem(ZMAN_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((z: any) => ({
      ...z,
      date: new Date(z.date),
      createdAt: new Date(z.createdAt)
    }));
  }

  static saveAll(zmanim: Zman[]) {
    localStorage.setItem(ZMAN_STORAGE_KEY, JSON.stringify(zmanim));
  }

  static create(data: Omit<Zman, 'id' | 'createdAt'>): Zman {
    const all = this.getAll();
    const newZman: Zman = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    all.push(newZman);
    this.saveAll(all);
    return newZman;
  }

  static bulkInsert(data: Omit<Zman, 'id' | 'createdAt'>[]): { inserted: number; skipped: number } {
    const existing = this.getAll();
    const key = (z: Omit<Zman, 'id' | 'createdAt'>) => `${z.date.toISOString().substring(0,10)}|${z.type}|${z.time}`;
    const existingKeys = new Set(existing.map(z => key({ date: z.date, time: z.time, label: z.label, type: z.type })));
    let inserted = 0; let skipped = 0;
    for (const item of data) {
      const k = key(item);
      if (existingKeys.has(k)) { skipped++; continue; }
      existing.push({ ...item, id: crypto.randomUUID(), createdAt: new Date() });
      existingKeys.add(k);
      inserted++;
    }
    this.saveAll(existing);
    return { inserted, skipped };
  }
}

export default ZmanService;
