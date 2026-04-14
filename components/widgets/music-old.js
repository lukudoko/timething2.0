import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

const MusicWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const clientRef = useRef(null);
  const hideTimerRef = useRef(null);
  const currentSongRef = useRef({ title: null, artist: null, artwork: null });
  const isVisibleRef = useRef(false);
  const activeRef = useRef(isActive);

  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      cleanup();
      onWidgetUpdate('regular', widgetKey, false);
      return;
    }

    let cancelled = false;

    const initMqtt = async () => {
      const mqtt = await import('mqtt');
      if (cancelled) return;

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

      const cancelHide = () => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      };

      const hideWidget = () => {
        cancelHide();

        hideTimerRef.current = setTimeout(() => {
          if (!activeRef.current) return;

          onWidgetUpdate('regular', widgetKey, false);
          isVisibleRef.current = false;
          currentSongRef.current = { title: null, artist: null, artwork: null };
        }, 3000);
      };

      const showWidget = (artwork) => {
        if (!activeRef.current) return;

        cancelHide();

        const signature = `music-${artwork}`;
        
        console.log(artwork)

        const content = (
          <div className="flex relative h-full w-full justify-center items-center">
            <Image
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

        onWidgetUpdate(
          'regular',
          widgetKey,
          true,
          content,
          signature
        );

        isVisibleRef.current = true;
      };

      client.on('connect', () => {
        client.subscribe('shairport/#');
      });

      client.on('message', (topic, message) => {
        if (!activeRef.current) return;

        const msg = message.toString();

        if (topic === 'shairport/playing') {
          const isPlaying = msg === '1';

          if (!isPlaying) {
            hideWidget();
          } else {
            cancelHide();
            if (currentSongRef.current.artwork && !isVisibleRef.current) {
              showWidget(currentSongRef.current.artwork);
            }
          }
          return;
        }

        if (topic === 'shairport/active') {
          if (msg === '0') {
            hideWidget();
          } else {
            cancelHide();
          }
          return;
        }

        if (topic === 'shairport/cover') {
          const base64 = arrayBufferToBase64(message);
          const artwork =
            base64 === 'LS0=' ? null : `data:image/jpeg;base64,${base64}`;

          if (artwork && artwork !== currentSongRef.current.artwork) {
            currentSongRef.current.artwork = artwork;
            showWidget(artwork);
          }
          return;
        }


        if (topic === 'shairport/title') {
          currentSongRef.current.title = msg;
          return;
        }

        if (topic === 'shairport/artist') {
          currentSongRef.current.artist = msg;
          return;
        }
      });

      client.on('error', (err) => {
        console.error('MQTT error:', err);
        hideWidget();
      });
    };

    const cleanup = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }

      isVisibleRef.current = false;
      currentSongRef.current = { title: null, artist: null, artwork: null };
    };

    initMqtt();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [isActive, onWidgetUpdate, widgetKey]);

  return null;
};

export default MusicWidget;