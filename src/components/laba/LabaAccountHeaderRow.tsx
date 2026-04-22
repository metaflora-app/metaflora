import React from 'react';
import { formatFollowersLabel } from '../../utils/labaApi';
import { InstagramLogoMark } from './InstagramLogoMark';

interface LabaAccountHeaderRowProps {
  username: string;
  followersCount: number | null | undefined;
  avatarSrc?: string | null;
  avatarAlt?: string;
  avatarContainerStyle: React.CSSProperties;
  logoStyle: React.CSSProperties;
  usernameStyle: React.CSSProperties;
  followersStyle: React.CSSProperties;
  avatarImageStyle?: React.CSSProperties;
  avatarImgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
  avatarBackground?: string;
  onAvatarError?: () => void;
  onAvatarLoad?: () => void;
  avatarOverlay?: React.ReactNode;
}

export const LabaAccountHeaderRow: React.FC<LabaAccountHeaderRowProps> = ({
  username,
  followersCount,
  avatarSrc,
  avatarAlt = '',
  avatarContainerStyle,
  logoStyle,
  usernameStyle,
  followersStyle,
  avatarImageStyle,
  avatarImgProps,
  avatarBackground = 'rgba(255,255,255,0.12)',
  onAvatarError,
  onAvatarLoad,
  avatarOverlay,
}) => {
  const hasAvatar = Boolean(avatarSrc);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          overflow: 'hidden',
          background: avatarBackground,
          ...avatarContainerStyle,
        }}
      >
        {hasAvatar ? (
          <img
            src={avatarSrc || undefined}
            alt={avatarAlt}
            loading="lazy"
            decoding="async"
            onError={onAvatarError}
            onLoad={onAvatarLoad}
            {...avatarImgProps}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              ...avatarImageStyle,
            }}
          />
        ) : null}
      </div>

      {avatarOverlay}

      <InstagramLogoMark style={logoStyle} />

      <div style={usernameStyle}>
        @{username}
      </div>

      <div style={followersStyle}>
        {formatFollowersLabel(followersCount)}
      </div>
    </>
  );
};
