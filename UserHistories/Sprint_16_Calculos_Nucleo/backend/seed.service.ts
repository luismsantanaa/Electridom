import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    const seedDir = path.join(__dirname, '..', 'seeds', 'normas');
    const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf-8'));
      // Example: protections.json -> table 'protections'
      const tableName = file.replace('.json','');
      await this.dataSource.query(`INSERT INTO seeds (name, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data=?`, 
        [tableName, JSON.stringify(content), JSON.stringify(content)]);
    }
    console.log('Seeds cargados correctamente');
  }
}
