import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/Admin.js';
import { env } from '../utils/env.js';

export async function seedInitialAdmin(): Promise<void> {
  const email = (env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = env.ADMIN_PASSWORD || 'admin123456';

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await AdminModel.findOne({ email });

  if (!existing) {
    await AdminModel.create({
      email,
      passwordHash,
    });
    console.info(`🔑 Initial admin created (${email})`);
  } else {
    // Ensure password matches configured env in dev
    existing.passwordHash = passwordHash;
    await existing.save();
    console.info(`🔑 Admin account password updated (${email})`);
  }
}
