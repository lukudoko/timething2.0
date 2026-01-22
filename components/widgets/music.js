import React, { useEffect, useRef } from 'react';

const MusicWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const clientRef = useRef(null);
  const inactivityTimeoutRef = useRef(null);
  const lastArtworkRef = useRef(null);
  const currentSongDataRef = useRef({ title: null, artist: null, artwork: null });
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      onWidgetUpdate('regular', widgetKey, false, null);

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }

      lastArtworkRef.current = null;
      currentSongDataRef.current = { title: null, artist: null, artwork: null };
      isVisibleRef.current = false;

      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }
      return;
    }

    const initMqtt = async () => {
      const mqtt = await import('mqtt');

      console.log('Connecting to MQTT broker...');
      const client = mqtt.default.connect('ws://192.168.3.99:9001');
      clientRef.current = client;

      const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      };

      const hideWidget = () => {
        console.log('Hiding music widget');
        onWidgetUpdate('regular', widgetKey, false, null);
        isVisibleRef.current = false;
        lastArtworkRef.current = null;
      };

      const showWidget = (artwork) => {
        if (!isActive) return;

        const content = (
          <div className="flex relative h-full flex-row w-full justify-center items-center">
            <img
              className="rounded"
              height={52}
              width={52}
              src={artwork}
              alt="Album artwork"
            />
            <div
              className="absolute saturate-200 blur-lg -z-10 h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${artwork})` }}
            />
          </div>
        );

        console.log('Showing music widget');
        onWidgetUpdate('regular', widgetKey, true, content);
        isVisibleRef.current = true;
        lastArtworkRef.current = artwork;
      };

      const resetInactivityTimer = () => {
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }

        inactivityTimeoutRef.current = setTimeout(() => {
          hideWidget();
        }, 15000);
      };

      client.on('connect', () => {
        console.log('Connected to MQTT broker');
        client.subscribe('shairport/#');
      });

      client.on('message', (topic, message) => {
        if (!isActive) return;

        let hasNewData = false;

        if (topic === 'shairport/title') {
          const newTitle = message.toString();
          if (newTitle !== currentSongDataRef.current.title) {
            currentSongDataRef.current.title = newTitle;
            hasNewData = true;
            console.log('New title:', newTitle);
          }
        } else if (topic === 'shairport/artist') {
          const newArtist = message.toString();
          if (newArtist !== currentSongDataRef.current.artist) {
            currentSongDataRef.current.artist = newArtist;
            hasNewData = true;
            console.log('New artist:', newArtist);
          }
        } else if (topic === 'shairport/cover') {
          const base64 = arrayBufferToBase64(message);
          const newArtwork = base64 === 'LS0=' ? null : `data:image/jpeg;base64,${base64}`;

          if (newArtwork && newArtwork !== currentSongDataRef.current.artwork) {
            currentSongDataRef.current.artwork = newArtwork;
            hasNewData = true;
            console.log('New artwork received');
          }
        }

        if (hasNewData) {
          resetInactivityTimer();

          if (currentSongDataRef.current.artwork) {
            if (!isVisibleRef.current || currentSongDataRef.current.artwork !== lastArtworkRef.current) {
              showWidget(currentSongDataRef.current.artwork);
            }
          }
        }

      });

      client.on('error', (error) => {
        console.error('MQTT error:', error);
        hideWidget();
      });
    };

    initMqtt();

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, [isActive]);

  return null;
};

export default MusicWidget;