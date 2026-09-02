import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  FileJson,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { StoreProfile } from '../types';
import { StorageService } from '../utils/storage';
import { sounds } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';

export interface SettingsModalProps {
  storeProfile: StoreProfile;
  onUpdateStoreProfile: (profile: StoreProfile) => void;
  onResetAllData: () => void;
  onClose: () => void;
}

export const SettingsModal = ({
  storeProfile,
  onUpdateStoreProfile,
  onResetAllData,
  onClose,
}: SettingsModalProps) => {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<StoreProfile>({ ...storeProfile });
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playBeep();
    onUpdateStoreProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportBackup = () => {
    sounds.playBeep();
    const jsonStr = StorageService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Angkringan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playBeep();
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importBackupJSON(content);
      if (success) {
        setImportStatus(t.backupSuccessMsg);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setImportStatus(t.backupInvalidMsg);
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    sounds.playBeep();
    const confirmed = window.confirm(t.confirmResetAll);
    if (confirmed) {
      onResetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0F172A] text-white">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-white text-sm sm:text-base">{t.settingsTitle}</h3>
          </div>
          <button
            onClick={() => {
              sounds.playBeep();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-800 custom-scrollbar">
          
          {/* Section 1: Store Information */}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.storeIdentitySection}</span>
              </h4>
              {isSaved && (
                <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-bold">
                  <Check className="w-3 h-3" /> {t.savedNotice}
                </span>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.storeNameField}</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="cth: Angkringan Kopi Jos Mas Joko"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.taglineField}</label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                placeholder="cth: Hangatnya Kebersamaan & Cita Rasa Asli Jogja"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.addressField}</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Jl. Malioboro No. 45"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.phoneField}</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="0812-3456-7890"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.cashierNameField}</label>
                <input
                  type="text"
                  value={profile.cashierName}
                  onChange={(e) => setProfile({ ...profile, cashierName: e.target.value })}
                  placeholder="Mas Joko"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.receiptFooterField}</label>
                <input
                  type="text"
                  value={profile.footerMessage}
                  onChange={(e) => setProfile({ ...profile, footerMessage: e.target.value })}
                  placeholder="Matur Nuwun Sampun Mampir!"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.saveProfileBtn}</span>
              </button>
            </div>
          </form>

          {/* Section 2: Backup & Restore Data */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.backupSectionTitle}</span>
            </h4>
            <p className="text-slate-500 text-[11px]">
              {t.backupSectionDesc}
            </p>

            <div className="flex flex-wrap gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.exportBackupBtn}</span>
              </button>

              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.importBackupBtn}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                {importStatus}
              </div>
            )}
          </div>

          {/* Section 3: Reset Factory Defaults */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <h4 className="font-bold text-red-600 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{t.dangerZoneTitle}</span>
            </h4>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-200">
              <div className="space-y-0.5">
                <div className="font-bold text-red-900 text-xs">{t.resetDefaultsTitle}</div>
                <p className="text-[11px] text-red-700">{t.resetDefaultsDesc}</p>
              </div>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {t.resetDataBtn}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
