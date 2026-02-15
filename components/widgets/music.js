import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

const MusicWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const clientRef = useRef(null);
  const hideTimerRef = useRef(null);
  const lastArtworkRef = useRef(null);
  const currentSongDataRef = useRef({ title: null, artist: null, artwork: null });
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      onWidgetUpdate('regular', widgetKey, false, null);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
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

        hideTimerRef.current = setTimeout(() => {
          onWidgetUpdate('regular', widgetKey, false, null);
          isVisibleRef.current = false;
          lastArtworkRef.current = null;
          currentSongDataRef.current = { title: null, artist: null, artwork: null };
        }, 3000);
      };

      const showWidget = (artwork) => {
        if (!isActive) return;
        cancelHide(); 

        const content = (
          <div className="flex relative h-full flex-row w-full justify-center items-center">
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
        onWidgetUpdate('regular', widgetKey, true, content);
        isVisibleRef.current = true;
        lastArtworkRef.current = artwork;
      };

      client.on('connect', () => {
        client.subscribe('shairport/#');
      });

      client.on('message', (topic, message) => {
        if (!isActive) return;

        if (topic === 'shairport/playing') {
          const isPlaying = message.toString() === '1';
          if (!isPlaying) {
            hideWidget();
          } else {
            cancelHide();
            if (currentSongDataRef.current.artwork && !isVisibleRef.current) {
              showWidget(currentSongDataRef.current.artwork);
            }
          }
          return;
        }

        if (topic === 'shairport/active') {
          if (message.toString() === '0') {
            hideWidget();
          } else {
            cancelHide();
          }
          return;
        }

        if (topic === 'shairport/cover') {
          const base64 = arrayBufferToBase64(message);
          const newArtwork = base64 === 'LS0=' ? null : `data:image/jpeg;base64,${base64}`;
          if (newArtwork && newArtwork !== currentSongDataRef.current.artwork) {
            currentSongDataRef.current.artwork = newArtwork;
            showWidget(newArtwork);
          }
          return;
        }

        if (topic === 'shairport/title') {
          currentSongDataRef.current.title = message.toString();
          return;
        }

        if (topic === 'shairport/artist') {
          currentSongDataRef.current.artist = message.toString();
          return;
        }
      });

      client.on('error', (error) => {
        console.error('MQTT error:', error);
        hideWidget();
      });
    };

    initMqtt();

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clientRef.current) clientRef.current.end();
    };
  }, [isActive]);

  return null;
};

export default MusicWidget;