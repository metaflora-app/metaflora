import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCachedTrackedAccounts, getTelegramUserId, refreshTrackedAccounts } from '../../utils/labaApi';
import sidebarBg from '../../assets/laba-redesign/сайдбар подложка.png';
import sidebarIcons from '../../assets/laba-redesign/сайдбар иконки новые.png';
import searchIcon from '../../assets/иконка поиск.png';

type SidebarItem = 'search' | 'main' | 'tracked' | 'favorites' | 'metacoins';

interface LabaSidebarNavProps {
  activeItem?: SidebarItem;
  left: number;
  top: number;
}

const SIDEBAR_WIDTH = 650;
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
    { key: 'search', left: 24, width: 96, route: '/laba-search-account' },
    { key: 'main', left: 132, width: 96, route: '/laba-main' },
    { key: 'tracked', left: 242, width: 96, route: trackedRoute },
    { key: 'favorites', left: 352, width: 96, route: '/laba-favorites' },
    { key: 'metacoins', left: 462, width: 96, route: '/metacoins' },
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
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '133px',
          top: '21px',
          width: '432px',
          height: '96px',
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
          left: '58px',
          top: '44px',
          width: '40px',
          height: '40px',
          pointerEvents: 'none',
          opacity: activeItem === 'search' ? 1 : 0.85,
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
            top: '18px',
            width: `${item.width}px`,
            height: '102px',
            border: 'none',
            background: activeItem === item.key ? 'rgba(255,255,255,0.08)' : 'transparent',
            borderRadius: '24px',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  );
};
