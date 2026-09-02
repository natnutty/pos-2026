import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX,
  Flame,
  Languages
} from 'lucide-react';
import { StoreProfile } from '../types';
import { sounds } from '../utils/sound';
import { formatRupiah } from '../utils/formatters';
import { useLanguage } from '../i18n/LanguageContext';

export interface HeaderProps {
  activeTab: 'pos' | 'inventory' | 'transactions' | 'reports';
  setActiveTab: (tab: 'pos' | 'inventory' | 'transactions' | 'reports') => void;
  openSettings: () => void;
  storeProfile: StoreProfile;
  todayRevenue: number;
  todayTxCount: number;
}

export const Header = ({
  activeTab,
  setActiveTab,
  openSettings,
  storeProfile,
  todayRevenue,
  todayTxCount,
}: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateClock = () => {
      const now = new Date();
      const locale = language === 'en' ? 'en-US' : 'id-ID';
      setCurrentTime(
        new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
      );
      setCurrentDate(
        new Intl.DateTimeFormat(locale, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(now)
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [language]);

  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playBeep();
  };

  const toggleLanguage = () => {
    sounds.playBeep();
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const navItems = [
    { id: 'pos' as const, label: t.navPos, icon: ShoppingBag, badge: null },
    { id: 'inventory' as const, label: t.navInventory, icon: Package, badge: null },
    { id: 'transactions' as const, label: t.navTransactions, icon: Receipt, badge: todayTxCount > 0 ? `${todayTxCount}` : null },
    { id: 'reports' as const, label: t.navReports, icon: BarChart3, badge: null },
  ];

  return (
    <header className="bg-[#0F172A] text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-inner text-white font-bold border border-amber-400/40">
              <Flame className="w-5 h-5 text-amber-100 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-none">
                  {storeProfile.name || t.appName}
                </h1>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t.posVersion}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block mt-0.5">
                {storeProfile.tagline || t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    sounds.playBeep();
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-950/40 font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Today Revenue Pill */}
            <div className="hidden sm:flex flex-col items-end px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-right">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{t.todayRevenue}</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                {formatRupiah(todayRevenue)}
              </span>
            </div>

            {/* Offline Status Badge */}
            <div 
              title={isOnline ? t.onlineTooltip : t.offlineTooltip}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold border ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="hidden xl:inline">{t.onlineStatus}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span className="hidden xl:inline">{t.offlineStatus}</span>
                </>
              )}
            </div>

            {/* Live Clock (Desktop) */}
            <div className="hidden md:flex flex-col items-end text-right px-1">
              <span className="text-xs font-bold text-slate-200 font-mono tracking-tight">{currentTime}</span>
              <span className="text-[9px] text-slate-400">{currentDate}</span>
            </div>

            {/* Language Switcher Pill Button */}
            <button
              id="header-language-toggle"
              onClick={toggleLanguage}
              title={`Switch language: ${language === 'id' ? 'English' : 'Bahasa Indonesia'}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-extrabold uppercase tracking-wide">
                {language === 'id' ? 'ID' : 'EN'}
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                {language === 'id' ? '🇮🇩' : '🇬🇧'}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={soundActive ? t.soundOn : t.soundOff}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundActive 
                  ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Settings Button */}
            <button
              id="header-settings-btn"
              onClick={() => {
                sounds.playBeep();
                openSettings();
              }}
              title={t.settingsTooltip}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden overflow-x-auto py-1.5 gap-1.5 border-t border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playBeep();
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1 rounded-full font-black ${isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-amber-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
