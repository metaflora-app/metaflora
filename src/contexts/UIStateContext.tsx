import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UIState {
  // Pricing
  selectedPricingPlan: '1month-1990' | '1month-2690' | '3month-5490' | '3month-8070' | null;
  setSelectedPricingPlan: (plan: UIState['selectedPricingPlan']) => void;

  // Metacoins
  selectedMetacoinsPack: '5000' | '25000' | null;
  setSelectedMetacoinsPack: (pack: UIState['selectedMetacoinsPack']) => void;

  // Prompt filters
  promptFilter: 'recent' | 'favorites' | 'popular' | 'new' | 'top' | null;
  setPromptFilter: (filter: UIState['promptFilter']) => void;
  promptSearchQuery: string;
  setPromptSearchQuery: (query: string) => void;

  // Poligon filters
  poligonFilter: 'all' | 'system' | 'art' | 'prompting' | 'automation';
  setPoligonFilter: (filter: UIState['poligonFilter']) => void;
  poligonSearchQuery: string;
  setPoligonSearchQuery: (query: string) => void;

  // Video player states
  videoStates: Record<string, { playing: boolean; fullscreen: boolean }>;
  setVideoState: (videoId: string, state: { playing?: boolean; fullscreen?: boolean }) => void;

  // Expanded states (for long text content)
  expandedStates: Record<string, boolean>;
  toggleExpanded: (id: string) => void;

  // Laba
  labaTrackedAccounts: string[];
  addToTracked: (accountId: string) => void;
  removeFromTracked: (accountId: string) => void;
  labaFavorites: string[];
  addToFavorites: (postId: string) => void;
  removeFromFavorites: (postId: string) => void;
  
  // Laba reels cache (для сохранения списка при переходах)
  labaReelsCache: any[];
  setLabaReelsCache: (reels: any[]) => void;
  labaMainSearchQuery: string;
  setLabaMainSearchQuery: (query: string) => void;
  labaAccountLinkQuery: string;
  setLabaAccountLinkQuery: (query: string) => void;
  labaAccountNicknameQuery: string;
  setLabaAccountNicknameQuery: (query: string) => void;
}

const UIStateContext = createContext<UIState | undefined>(undefined);
const LABA_MAIN_SEARCH_QUERY_KEY = 'metaflora_laba_main_search_query_v1';

export function UIStateProvider({ children }: { children: ReactNode }) {
  // Pricing
  const [selectedPricingPlan, setSelectedPricingPlan] = useState<UIState['selectedPricingPlan']>(null);

  // Metacoins
  const [selectedMetacoinsPack, setSelectedMetacoinsPack] = useState<UIState['selectedMetacoinsPack']>(null);

  // Prompt
  const [promptFilter, setPromptFilter] = useState<UIState['promptFilter']>(null);
  const [promptSearchQuery, setPromptSearchQuery] = useState('');

  // Poligon
  const [poligonFilter, setPoligonFilter] = useState<UIState['poligonFilter']>('all');
  const [poligonSearchQuery, setPoligonSearchQuery] = useState('');

  // Videos
  const [videoStates, setVideoStates] = useState<Record<string, { playing: boolean; fullscreen: boolean }>>({});

  const setVideoState = (videoId: string, state: { playing?: boolean; fullscreen?: boolean }) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: {
        playing: state.playing ?? prev[videoId]?.playing ?? false,
        fullscreen: state.fullscreen ?? prev[videoId]?.fullscreen ?? false,
      }
    }));
  };

  // Expanded states
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Laba
  const [labaTrackedAccounts, setLabaTrackedAccounts] = useState<string[]>([]);
  const [labaFavorites, setLabaFavorites] = useState<string[]>([]);
  const [labaReelsCache, setLabaReelsCache] = useState<any[]>([]);
  const [labaMainSearchQuery, setLabaMainSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(LABA_MAIN_SEARCH_QUERY_KEY) || '';
  });
  const [labaAccountLinkQuery, setLabaAccountLinkQuery] = useState('');
  const [labaAccountNicknameQuery, setLabaAccountNicknameQuery] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LABA_MAIN_SEARCH_QUERY_KEY, labaMainSearchQuery);
  }, [labaMainSearchQuery]);

  const addToTracked = (accountId: string) => {
    setLabaTrackedAccounts(prev => [...new Set([...prev, accountId])]);
  };

  const removeFromTracked = (accountId: string) => {
    setLabaTrackedAccounts(prev => prev.filter(id => id !== accountId));
  };

  const addToFavorites = (postId: string) => {
    setLabaFavorites(prev => [...new Set([...prev, postId])]);
  };

  const removeFromFavorites = (postId: string) => {
    setLabaFavorites(prev => prev.filter(id => id !== postId));
  };

  const value: UIState = {
    selectedPricingPlan,
    setSelectedPricingPlan,
    selectedMetacoinsPack,
    setSelectedMetacoinsPack,
    promptFilter,
    setPromptFilter,
    promptSearchQuery,
    setPromptSearchQuery,
    poligonFilter,
    setPoligonFilter,
    poligonSearchQuery,
    setPoligonSearchQuery,
    videoStates,
    setVideoState,
    expandedStates,
    toggleExpanded,
    labaTrackedAccounts,
    addToTracked,
    removeFromTracked,
    labaFavorites,
    addToFavorites,
    removeFromFavorites,
    labaReelsCache,
    setLabaReelsCache,
    labaMainSearchQuery,
    setLabaMainSearchQuery,
    labaAccountLinkQuery,
    setLabaAccountLinkQuery,
    labaAccountNicknameQuery,
    setLabaAccountNicknameQuery,
  };

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
}
