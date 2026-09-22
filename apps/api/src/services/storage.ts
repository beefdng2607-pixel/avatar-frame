import fs from 'fs/promises';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { env } from '../utils/env.js';

export interface StorageService {
  saveFrame(campaignId: string, originalName: string, buffer: Buffer): Promise<string>;
  deleteFrame(frameUrl: string): Promise<void>;
}

// ─── Local File System Storage ────────────────────────────────────────────────

class LocalStorageService implements StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.UPLOAD_DIR);
    fs.mkdir(this.uploadDir, { recursive: true }).catch((err) => {
      console.error('Failed to create uploads directory:', err);
    });
  }

  async saveFrame(campaignId: string, originalName: string, buffer: Buffer): Promise<string> {
    const ext = path.extname(originalName) || '.png';
    const filename = `frame_${campaignId}_${Date.now()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.writeFile(filePath, buffer);
    return `/uploads/${filename}`;
  }

  async deleteFrame(frameUrl: string): Promise<void> {
    if (!frameUrl || !frameUrl.startsWith('/uploads/')) return;
    const filename = path.basename(frameUrl);
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== 'ENOENT') {
        console.error('Error deleting local frame file:', err);
      }
    }
  }
}

// ─── S3-Compatible Object Storage ─────────────────────────────────────────────

class S3StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;
  private baseUrl: string;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET || 'avatar-frames';
    this.baseUrl = env.AWS_S3_BASE_URL || `https://${this.bucket}.s3.amazonaws.com`;

    const config: { region: string; credentials?: { accessKeyId: string; secretAccessKey: string } } = {
      region: env.AWS_REGION || 'us-east-1',
    };

    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      };
    }

    this.client = new S3Client(config);
  }

  async saveFrame(campaignId: string, originalName: string, buffer: Buffer): Promise<string> {
    const ext = path.extname(originalName) || '.png';
    const key = `frames/frame_${campaignId}_${Date.now()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return `${this.baseUrl.replace(/\/$/, '')}/${key}`;
  }

  async deleteFrame(frameUrl: string): Promise<void> {
    if (!frameUrl) return;

    try {
      const urlObj = new URL(frameUrl);
      const key = urlObj.pathname.replace(/^\//, '');

      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (err) {
      console.error('Error deleting frame from S3:', err);
    }
  }
}

// ─── Export Active Provider Based on Env Config ───────────────────────────────

export const storageService: StorageService =
  env.STORAGE_PROVIDER === 's3' ? new S3StorageService() : new LocalStorageService();
