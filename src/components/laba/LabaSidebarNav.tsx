import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCachedTrackedAccounts, getTelegramUserId, refreshTrackedAccounts } from '../../utils/labaApi';
import sidebarFull from '../../assets/laba-redesign/sidebar-full-desktop.png';

type SidebarItem = 'search' | 'main' | 'tracked' | 'favorites' | 'metacoins';

interface LabaSidebarNavProps {
  activeItem?: SidebarItem;
  left: number;
  top: number;
}

const SIDEBAR_WIDTH = 628;
const SIDEBAR_HEIGHT = 139;

export const LabaSidebarNav: React.FC<LabaSidebarNavProps> = ({ activeItem: _activeItem, left, top }) => {
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
    { key: 'main', left: 14, width: 96, route: '/laba-main' },
    { key: 'search', left: 136, width: 96, route: '/laba-search-account' },
    { key: 'tracked', left: 258, width: 96, route: trackedRoute },
    { key: 'favorites', left: 380, width: 96, route: '/laba-favorites' },
    { key: 'metacoins', left: 502, width: 96, route: '/metacoins' },
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
        src={sidebarFull}
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
            height: '103px',
            border: 'none',
            background: 'transparent',
            borderRadius: '24px',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  );
};
