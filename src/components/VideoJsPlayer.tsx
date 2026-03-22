import React from 'react';
import { createPlayer } from '@videojs/react';
import { MinimalVideoSkin, Video, videoFeatures } from '@videojs/react/video';
import '@videojs/react/video/minimal-skin.css';

const Player = createPlayer({ features: videoFeatures });

interface VideoJsPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const VideoJsPlayer: React.FC<VideoJsPlayerProps> = ({
  src,
  poster,
  className,
  style,
}) => {
  return (
    <div className={className} style={style}>
      <Player.Provider>
        <MinimalVideoSkin poster={poster}>
          <Video
            src={src}
            playsInline
            preload="auto"
          />
        </MinimalVideoSkin>
      </Player.Provider>
    </div>
  );
};
