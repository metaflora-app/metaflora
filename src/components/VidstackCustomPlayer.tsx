import React from 'react';
import {
  MediaPlayer,
  MediaOutlet,
  MediaPoster,
  MediaTimeSlider,
  MediaTime,
  MediaGesture,
  useMediaRemote,
  useMediaStore,
} from '@vidstack/react';
import {
  FullscreenExitIcon,
  FullscreenIcon,
  MuteIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
} from '@vidstack/react/icons';

export interface VidstackCustomPlayerHandle {
  enterFullscreen: () => void;
}

interface VidstackCustomPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const VidstackCustomPlayer = React.forwardRef<VidstackCustomPlayerHandle, VidstackCustomPlayerProps>(
  function VidstackCustomPlayer({ src, poster, title = '', className, style }, ref) {
    const playerRef = React.useRef<any>(null);
    const remote = useMediaRemote(playerRef);
    const media = useMediaStore(playerRef);

    React.useImperativeHandle(ref, () => ({
      enterFullscreen: () => {
        remote.enterFullscreen('media');
      },
    }), [remote]);

    return (
      <MediaPlayer
        ref={playerRef}
        title={title}
        src={src}
        poster={poster}
        playsInline
        streamType="on-demand"
        viewType="video"
        preload="auto"
        className={className}
        style={style}
      >
        <MediaOutlet />
        {poster ? <MediaPoster className="academy-vidstack-poster" /> : null}

        <MediaGesture className="academy-vidstack-gesture" event="pointerup" action="toggle:paused" />

        <div className="academy-vidstack-controls">
          <div className="academy-vidstack-controls-row">
            <button
              type="button"
              className="academy-vidstack-icon-button academy-vidstack-primary-button"
              onClick={() => remote.togglePaused()}
            >
              {media.paused ? <PlayIcon /> : <PauseIcon />}
            </button>

            <button
              type="button"
              className="academy-vidstack-icon-button"
              onClick={() => remote.toggleMuted()}
            >
              {media.muted ? <MuteIcon /> : <MusicIcon />}
            </button>

            <button
              type="button"
              className="academy-vidstack-icon-button"
              onClick={() => remote.toggleFullscreen('media')}
            >
              {media.fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </button>
          </div>

          <div className="academy-vidstack-time-row">
            <span className="academy-vidstack-time-label">
              {formatTime(media.currentTime)} / {formatTime(media.duration)}
            </span>
          </div>

          <MediaTimeSlider className="academy-vidstack-slider" />
        </div>

        <div className="academy-vidstack-inline-times">
          <MediaTime className="academy-vidstack-inline-time" type="current" />
          <span className="academy-vidstack-inline-separator">/</span>
          <MediaTime className="academy-vidstack-inline-time academy-vidstack-inline-time-muted" type="duration" />
        </div>
      </MediaPlayer>
    );
  },
);
