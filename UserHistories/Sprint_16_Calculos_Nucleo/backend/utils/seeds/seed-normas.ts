// ts-node -r tsconfig-paths/register backend/utils/seeds/seed-normas.ts
import { DataSource } from 'typeorm';
import { NormaConfig } from '../../src/modules/normas/entities/norma-config.entity';
import * as fs from 'fs';
import * as path from 'path';

// NOTE: Adjust the data source import to your project's location
// Example assumes a typical NestJS TypeORM setup exporting 'AppDataSource'
import { AppDataSource } from '../../src/database/data-source'; // <-- EDIT THIS PATH IF NEEDED

const SEED_DIR = path.resolve(__dirname, '../../seeds/normas');

const KEYS = [
  'protections',
  'conductor_tables',
  'vd_limits',
  'rules_env_use',
  'feeder_params',
];

async function main() {
  const ds: DataSource = await AppDataSource.initialize();
  const repo = ds.getRepository(NormaConfig);

  for (const key of KEYS) {
    const file = path.join(SEED_DIR, `${key}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`[WARN] Seed file not found: ${file}`);
      continue;
    }
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    let row = await repo.findOne({ where: { key } });
    if (row) {
      row.data = data;
      await repo.save(row);
      console.log(`[OK] Updated ${key}`);
    } else {
      row = repo.create({ key, data });
      await repo.save(row);
      console.log(`[OK] Inserted ${key}`);
    }
  }

  console.log('[DONE] Normative seeds loaded.');
  await ds.destroy();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
});
