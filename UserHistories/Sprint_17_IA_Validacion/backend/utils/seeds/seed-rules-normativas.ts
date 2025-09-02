// ts-node -r tsconfig-paths/register backend/utils/seeds/seed-rules-normativas.ts
import { DataSource } from 'typeorm';
import { NormaConfig } from '../../src/modules/normas/entities/norma-config.entity';
import * as fs from 'fs';
import * as path from 'path';

import { AppDataSource } from '../../src/database/data-source'; // <-- EDIT THIS PATH IF NEEDED

const FILE = path.resolve(__dirname, '../../seeds/normas/rules_normativas.json');
const KEY = 'rules_normativas';

async function main() {
  const ds: DataSource = await AppDataSource.initialize();
  const repo = ds.getRepository(NormaConfig);

  if (!fs.existsSync(FILE)) {
    throw new Error(`[ERROR] Seed file not found: ${FILE}`);
  }
  const raw = fs.readFileSync(FILE, 'utf-8');
  const data = JSON.parse(raw);

  let row = await repo.findOne({ where: { key: KEY } });
  if (row) {
    row.data = data;
    await repo.save(row);
    console.log(`[OK] Updated ${KEY}`);
  } else {
    row = repo.create({ key: KEY, data });
    await repo.save(row);
    console.log(`[OK] Inserted ${KEY}`);
  }

  console.log('[DONE] Rules seeds loaded.');
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
