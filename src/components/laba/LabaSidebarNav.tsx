import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCachedTrackedAccounts, getTelegramUserId, refreshTrackedAccounts } from '../../utils/labaApi';
import sidebarBg from '../../assets/laba-redesign/sidebar-bg.png';
import sidebarIcons from '../../assets/laba-redesign/сайдбар иконки новые.png';
import searchIcon from '../../assets/иконка поиск.png';

type SidebarItem = 'search' | 'main' | 'tracked' | 'favorites' | 'metacoins';

interface LabaSidebarNavProps {
  activeItem?: SidebarItem;
  left: number;
  top: number;
}

const SIDEBAR_WIDTH = 683;
const SIDEBAR_HEIGHT = 139;

export const LabaSidebarNav: React.FC<LabaSidebarNavProps> = ({ activeItem, left, top }) => {
  const navigate = useNavigate();
  const telegramUserId = React.useMemo(() => getTelegramUserId(), []);
  const [hasTrackedAccounts, setHasTrackedAccounts] = React.useState(() => {
    return telegramUserId ? getCachedTrackedAccounts(telegramUserId).length > 0 : false;
  });

  React.useEffect(() => {
    if (!telegramUserId) return;

    void refreshTrackedAccounts(telegramUserId)
      .then((accounts) => setHasTrackedAccounts(accounts.length > 0))
      .catch(() => {
        // keep cached state as fallback
      });
  }, [telegramUserId]);

  const trackedRoute = hasTrackedAccounts ? '/laba-tracked' : '/laba-no-tracked';

  const items: Array<{ key: SidebarItem; left: number; width: number; route: string }> = [
    { key: 'search', left: 28, width: 90, route: '/laba-search-account' },
    { key: 'main', left: 142, width: 90, route: '/laba-main' },
    { key: 'tracked', left: 260, width: 90, route: trackedRoute },
    { key: 'favorites', left: 378, width: 90, route: '/laba-favorites' },
    { key: 'metacoins', left: 496, width: 90, route: '/metacoins' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${SIDEBAR_WIDTH}px`,
        height: `${SIDEBAR_HEIGHT}px`,
      }}
    >
      <img
        src={sidebarBg}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '141px',
          top: '22px',
          width: '446px',
          height: '92px',
          pointerEvents: 'none',
        }}
      >
        <img
          src={sidebarIcons}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: '69px',
          top: '50px',
          width: '38px',
          height: '38px',
          pointerEvents: 'none',
          opacity: 1,
        }}
      >
        <img
          src={searchIcon}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => navigate(item.route)}
          className="motion-press-grow"
          style={{
            position: 'absolute',
            left: `${item.left}px`,
            top: '20px',
            width: `${item.width}px`,
            height: '96px',
            border: 'none',
            background: 'transparent',
            borderRadius: '18px',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  );
};
