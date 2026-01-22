import fs from 'fs/promises';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

const DEFAULT_CONFIG = {
  location: { latitude: 57.65, longitude: 11.916 },
  widgets: {
    weather: { enabled: true, timeSlots: [] },
    music: { enabled: true, timeSlots: [] },
    uv: { enabled: true, timeSlots: ['morning', 'afternoon'] },
    precipitation: { enabled: true, timeSlots: ['morning', 'afternoon', 'evening'] },
    commuter: { enabled: false, timeSlots: ['morning', 'evening'] },
  },
};

async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function writeConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const config = await readConfig();
    return res.status(200).json(config);
  }

  if (req.method === 'POST') {
    try {
      await writeConfig(req.body);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Failed to write config:', err);
      return res.status(500).json({ error: 'Failed to save config' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await fs.unlink(CONFIG_FILE);
      return res.status(200).json({ success: true });
    } catch {
      return res.status(404).json({ error: 'Config not found' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end();
}
