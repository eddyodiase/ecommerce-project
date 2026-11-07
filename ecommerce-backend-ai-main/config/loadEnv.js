import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const backendDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(backendDirectory, '.env');

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
