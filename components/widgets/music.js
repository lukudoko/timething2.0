import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { mqttMusicService } from '@/services/mqtt';

const MusicWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const unsubscribeRef = useRef(null);
  const hideTimerRef = useRef(null);
  const isVisibleRef = useRef(false);
  const lastArtworkRef = useRef(null);

  const cancelHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const hideWidget = () => {
    cancelHide();
    hideTimerRef.current = setTimeout(() => {

      if (isVisibleRef.current) {
        onWidgetUpdate('regular', widgetKey, false);
        isVisibleRef.current = false;
      }
    }, 3000);

  };

  const showWidget = (artwork) => {
    cancelHide();

    if (isVisibleRef.current && lastArtworkRef.current === artwork) {
      return;
    }

    lastArtworkRef.current = artwork;

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

    const signature = `music-${artwork}`;

    onWidgetUpdate('regular', widgetKey, true, content, signature);
    isVisibleRef.current = true;
  };

  useEffect(() => {

    if (!isActive) {
      cancelHide();
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (isVisibleRef.current) {
        onWidgetUpdate('regular', widgetKey, false);
        isVisibleRef.current = false;
      }
      return;
    }

    mqttMusicService.connect();

    unsubscribeRef.current = mqttMusicService.subscribe((state) => {

      if (!isActive) return;

      const shouldShow = state.playing && state.active && state.artwork;

      if (shouldShow) {
        showWidget(state.artwork);
      } else {

        hideWidget();
      }
    });

    return () => {
      cancelHide();
      if (unsubscribeRef.current) unsubscribeRef.current();

      if (isVisibleRef.current) {
        onWidgetUpdate('regular', widgetKey, false);
        isVisibleRef.current = false;
      }
    };
  }, [isActive, onWidgetUpdate, widgetKey]);

  return null;
};

export default MusicWidget;