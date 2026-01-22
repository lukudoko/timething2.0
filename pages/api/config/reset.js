// pages/api/config/reset.js
import fs from 'fs/promises';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const defaultConfig = {
        location: { latitude: 57.65, longitude: 11.916 },
        widgets: {
          weather: { enabled: true },
          music: { enabled: true },
          uv: { enabled: true },
          precipitation: { enabled: true },
          commuter: { enabled: false }
        }
      };
      
      await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error resetting config:', error);
      return res.status(500).json({ error: 'Failed to reset configuration' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}