import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface SnapshotInfo {
  fileName: string;
  createdAt: Date;
  sizeBytes: number;
  label?: string;
}

@Injectable()
export class SnapshotsService {
  private readonly logger = new Logger(SnapshotsService.name);
  private readonly snapshotsDir: string;

  constructor(private readonly config: ConfigService) {
    this.snapshotsDir = path.join(process.cwd(), 'snapshots');
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  async createSnapshot(label?: string): Promise<SnapshotInfo | null> {
    const dbUrl = this.config.get<string>('DATABASE_URL');
    if (!dbUrl) {
      this.logger.error('DATABASE_URL not set, cannot create snapshot');
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = label ? label.replace(/[^a-zA-Z0-9_-]/g, '_') : 'auto';
    const fileName = `snapshot-${safeName}-${timestamp}.sql`;
    const filePath = path.join(this.snapshotsDir, fileName);

    try {
      // Use pg_dump via environment variable
      const url = new URL(dbUrl);
      const env = {
        ...process.env,
        PGPASSWORD: url.password,
      };

      const host = url.hostname;
      const port = url.port || '5432';
      const user = url.username;
      const dbName = url.pathname.replace('/', '');

      const cmd = `pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} -F p -f "${filePath}"`;

      execSync(cmd, { env, timeout: 120000 });

      const stat = fs.statSync(filePath);
      this.logger.log(`Snapshot created: ${fileName} (${stat.size} bytes)`);

      return {
        fileName,
        createdAt: new Date(),
        sizeBytes: stat.size,
        label: label || 'auto',
      };
    } catch (error: any) {
      this.logger.error('Snapshot creation failed', error?.message);
      // Try to cleanup partial file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return null;
    }
  }

  listSnapshots(): SnapshotInfo[] {
    try {
      const files = fs.readdirSync(this.snapshotsDir);
      return files
        .filter((f) => f.endsWith('.sql'))
        .map((fileName) => {
          const filePath = path.join(this.snapshotsDir, fileName);
          const stat = fs.statSync(filePath);
          // Parse label from filename: snapshot-{label}-{timestamp}.sql
          const parts = fileName.replace('.sql', '').split('-');
          const label = parts.length > 2 ? parts.slice(1, -6).join('-') : 'auto';
          return {
            fileName,
            createdAt: stat.mtime,
            sizeBytes: stat.size,
            label,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }

  getSnapshotPath(fileName: string): string | null {
    // Sanitize filename
    const safe = path.basename(fileName);
    const filePath = path.join(this.snapshotsDir, safe);
    if (fs.existsSync(filePath) && safe.endsWith('.sql')) return filePath;
    return null;
  }

  deleteSnapshot(fileName: string): boolean {
    const filePath = this.getSnapshotPath(fileName);
    if (!filePath) return false;
    try {
      fs.unlinkSync(filePath);
      this.logger.log(`Snapshot deleted: ${fileName}`);
      return true;
    } catch {
      return false;
    }
  }

  async restoreSnapshot(fileName: string): Promise<boolean> {
    const filePath = this.getSnapshotPath(fileName);
    if (!filePath) return false;

    const dbUrl = this.config.get<string>('DATABASE_URL');
    if (!dbUrl) return false;

    try {
      const url = new URL(dbUrl);
      const env = {
        ...process.env,
        PGPASSWORD: url.password,
      };

      const host = url.hostname;
      const port = url.port || '5432';
      const user = url.username;
      const dbName = url.pathname.replace('/', '');

      const cmd = `psql -h ${host} -p ${port} -U ${user} -d ${dbName} -f "${filePath}"`;
      execSync(cmd, { env, timeout: 300000 });

      this.logger.log(`Snapshot restored: ${fileName}`);
      return true;
    } catch (error: any) {
      this.logger.error('Snapshot restore failed', error?.message);
      return false;
    }
  }

  // Auto-cleanup: keep only last N snapshots
  cleanupOldSnapshots(keepCount = 10) {
    const snapshots = this.listSnapshots();
    if (snapshots.length <= keepCount) return;

    const toDelete = snapshots.slice(keepCount);
    for (const snap of toDelete) {
      this.deleteSnapshot(snap.fileName);
      this.logger.log(`Auto-deleted old snapshot: ${snap.fileName}`);
    }
  }
}
