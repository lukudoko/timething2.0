let client = null;

const state = {
  playing: false,
  active: false,
  title: null,
  artist: null,
  artwork: null,
};

const listeners = new Set();

let emitTimer = null;

const emitBatched = () => {
  if (emitTimer) clearTimeout(emitTimer);

  emitTimer = setTimeout(() => {
    listeners.forEach((fn) => fn({ ...state }));
  }, 80); // tweak: 50–150ms is ideal for MQTT bursts
};

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const emit = () => {
  listeners.forEach((fn) => fn({ ...state }));
};

export const mqttMusicService = {
  connect: async () => {
    if (client) return;

    const mqtt = await import('mqtt');

    client = mqtt.default.connect('ws://192.168.3.99:9001');

    client.on('connect', () => {
      client.subscribe('shairport/#');
    });

    client.on('message', (topic, message) => {
      const msg = message.toString();

      switch (topic) {
        case 'shairport/playing':
          state.playing = msg === '1';
          break;

        case 'shairport/active':
          state.active = msg !== '0';
          break;

        case 'shairport/title':
          state.title = msg;
          break;

        case 'shairport/artist':
          state.artist = msg;
          break;

        case 'shairport/cover': {
          const base64 = msg;
          const base6s4 = arrayBufferToBase64(message);
          state.artwork =
            base64 === 'LS0='
              ? null
              : `data:image/jpeg;base64,${base6s4}`;
          break;
        }
      }

      emitBatched();
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
    });
  },

  subscribe: (fn) => {
    listeners.add(fn);

    fn({ ...state });

    return () => {
      listeners.delete(fn);
    };
  },

  getState: () => ({ ...state }),

  disconnect: () => {
    if (client) {
      client.end();
      client = null;
    }
    listeners.clear();
  },
};