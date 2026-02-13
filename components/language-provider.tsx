"use client"

import { createContext, useContext, useMemo, useState } from "react"

export type AppLocale = "hu" | "en"

type Dict = Record<string, string | Dict>

const translations: Record<AppLocale, Dict> = {
  hu: {
    nav: {
      dashboard: "Dashboard",
      advertisements: "Hirdetések",
      partners: "Partnerek",
      settings: "Beállítások",
      users: "Felhasználók",
      notifications: "Értesítések",
      logs: "Napló",
      logout: "Kijelentkezés",
      goodbye: "Viszlát!",
      userFallback: "Felhasználó",
    },
    page: {
      advertisementsTitle: "Hirdetések",
      advertisementsDesc: "Kezelje a toborzási hirdetéseket",
      partnersTitle: "Partnerek",
      partnersDesc: "Kezelje a toborzási partnereket és irodákat",
      settingsTitle: "Beállítások",
      settingsDesc: "Alkalmazás beállítások kezelése",
      dashboardTitle: "Dashboard",
      dashboardDesc: "Üdvözöljük a toborzási hirdetéskezelő rendszerben",
    },
    settings: {
      appearanceTitle: "Megjelenés",
      appearanceDesc: "A felület testreszabása.",
      themeLabel: "Téma",
      themeDesc: "Válassz a világos és sötét mód között",
      languageLabel: "Nyelv",
      languageDesc: "Az alkalmazás felületének nyelve",
      langHu: "Magyar",
      langEn: "Angol",
      themeSaved: "Téma frissítve",
      languageSaved: "Nyelv frissítve",
    },
    ads: {
      newAd: "Új hirdetés",
      exportCsv: "CSV export",
      optionalColumns: "Opcionális oszlopok",
      searchPlaceholder: "Keresés munkakör, hirdetés, partner...",
      office: "Iroda",
      partner: "Partner",
      businessArea: "Üzletág",
      position: "Munkakör",
      content: "Hirdetés",
      type: "Típus",
      start: "Kezdés",
      end: "Vége",
      status: "Státusz",
      allOffice: "Összes iroda",
      allPartner: "Összes partner",
      allBusinessArea: "Összes üzletág",
      allType: "Összes típus",
      allStatus: "Összes státusz",
      clearFilters: "Szűrők törlése",
      noResult: "Nincs találat",
      selectedCount: "kiválasztva",
      close: "Lezárás",
      delete: "Törlés",
      cancel: "Mégse",
      actions: "Műveletek",
      edit: "Szerkesztés",
      selectRow: "Sor kijelölése",
      selectAll: "Összes kijelölése",
      filters: "Szűrők",
      period: "Időszak választása",
      exportSuccess: "Excel fájl sikeresen exportálva!",
    },
    partners: {
      searchPlaceholder: "Keresés partner vagy iroda...",
      newPartner: "Új partner",
      totalPartners: "Összes partner",
      officesCount: "Irodák száma",
      activeAds: "Aktív hirdetés",
      listTitle: "Partnerek listája",
      partnerName: "Partner neve",
      adsCount: "Hirdetések",
      active: "Aktív",
    },
    dashboard: {
      activeCampaigns: "Aktív kampányok",
      startingToday: "Ma indul",
      expiringSoon: "Hamarosan lejár",
      partners: "Partnerek",
      latestAds: "Legújabb hirdetések",
      todayEvents: "Mai események",
      noTodayEvents: "Nincsenek mai események",
      startsToday: "Ma indul",
      endsToday: "Ma lejár",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      advertisements: "Advertisements",
      partners: "Partners",
      settings: "Settings",
      users: "Users",
      notifications: "Notifications",
      logs: "Activity Log",
      logout: "Log Out",
      goodbye: "Goodbye!",
      userFallback: "User",
    },
    page: {
      advertisementsTitle: "Advertisements",
      advertisementsDesc: "Manage recruitment advertisements",
      partnersTitle: "Partners",
      partnersDesc: "Manage recruitment partners and offices",
      settingsTitle: "Settings",
      settingsDesc: "Manage application settings",
      dashboardTitle: "Dashboard",
      dashboardDesc: "Welcome to the recruitment ad management system",
    },
    settings: {
      appearanceTitle: "Appearance",
      appearanceDesc: "Customize the interface.",
      themeLabel: "Theme",
      themeDesc: "Choose between light and dark mode",
      languageLabel: "Language",
      languageDesc: "Application interface language",
      langHu: "Hungarian",
      langEn: "English",
      themeSaved: "Theme updated",
      languageSaved: "Language updated",
    },
    ads: {
      newAd: "New advertisement",
      exportCsv: "CSV export",
      optionalColumns: "Optional columns",
      searchPlaceholder: "Search by position, ad, partner...",
      office: "Office",
      partner: "Partner",
      businessArea: "Business area",
      position: "Position",
      content: "Ad content",
      type: "Type",
      start: "Start",
      end: "End",
      status: "Status",
      allOffice: "All offices",
      allPartner: "All partners",
      allBusinessArea: "All business areas",
      allType: "All types",
      allStatus: "All statuses",
      clearFilters: "Clear filters",
      noResult: "No results",
      selectedCount: "selected",
      close: "Close",
      delete: "Delete",
      cancel: "Cancel",
      actions: "Actions",
      edit: "Edit",
      selectRow: "Select row",
      selectAll: "Select all",
      filters: "Filters",
      period: "Select period",
      exportSuccess: "Excel file exported successfully!",
    },
    partners: {
      searchPlaceholder: "Search partner or office...",
      newPartner: "New partner",
      totalPartners: "Total partners",
      officesCount: "Number of offices",
      activeAds: "Active ads",
      listTitle: "Partners list",
      partnerName: "Partner name",
      adsCount: "Ads",
      active: "Active",
    },
    dashboard: {
      activeCampaigns: "Active campaigns",
      startingToday: "Starting today",
      expiringSoon: "Expiring soon",
      partners: "Partners",
      latestAds: "Latest ads",
      todayEvents: "Today's events",
      noTodayEvents: "No events today",
      startsToday: "Starts today",
      endsToday: "Ends today",
    },
  },
}

type LanguageContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: (key: string, fallback?: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getByPath(obj: Dict, path: string): string | null {
  const result = path.split(".").reduce<any>((acc, key) => (acc && typeof acc === "object" ? acc[key] : null), obj)
  return typeof result === "string" ? result : null
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>("hu")

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: string, fallback?: string) => {
      const value = getByPath(translations[locale], key)
      if (value !== null) return value
      const huFallback = getByPath(translations.hu, key)
      return huFallback ?? fallback ?? key
    }
    return { locale, setLocale, t }
  }, [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
