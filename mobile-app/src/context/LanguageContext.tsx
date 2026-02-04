import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'pt' | 'de' | 'fr' | 'ur' | 'pa' | 'hi';

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

// Simplified translations for mobile app
const translations: Record<Language, Record<string, string>> = {
  en: {
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.print': 'Print',
    'common.status': 'Status',
    'common.confirm': 'Confirm',
    'common.confirmDelete': 'Confirm Delete',
    'common.deleteConfirmation': 'Are you sure you want to delete this ticket?',
    'common.restore': 'Restore',
    'common.deletePermanently': 'Delete Permanently',
    'header.language': 'Language',
    'header.english': 'English',
    'header.portuguese': 'Portuguese',
    'header.german': 'German',
    'header.french': 'French',
    'header.urdu': 'Urdu',
    'header.punjabi': 'Punjabi',
    'header.hindi': 'Hindi',
    'ticket.edit': 'Edit Ticket',
    'ticket.delete': 'Delete Ticket',
    'ticket.changeStatus': 'Change Status',
    'ticket.printReceipt': 'Print Receipt',
    'ticket.status.pending': 'Pending',
    'ticket.status.in_progress': 'In Progress',
    'ticket.status.completed': 'Completed',
    'ticket.status.delivered': 'Delivered',
    'ticket.status.cancelled': 'Cancelled',
    'ticket.status.not_ok': 'Not OK',
    'dashboard.welcomeBack': 'Welcome back',
    'page.tickets.title': 'Tickets',
    'page.tickets.subtitle': 'Manage your repair tickets',
    'page.trash.title': 'Trash',
    'page.trash.subtitle': 'Deleted tickets and products',
    'page.subscription.title': 'Subscription',
    'page.subscription.subtitle': 'Choose your plan',
    'page.analytics.title': 'Analytics',
    'page.settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.selectLanguage': 'Select Language',
  },
  pt: {
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.print': 'Imprimir',
    'common.status': 'Estado',
    'common.confirm': 'Confirmar',
    'common.confirmDelete': 'Confirmar Eliminação',
    'common.deleteConfirmation': 'Tem certeza de que deseja eliminar este bilhete?',
    'common.restore': 'Restaurar',
    'common.deletePermanently': 'Eliminar Permanentemente',
    'header.language': 'Idioma',
    'header.english': 'Inglês',
    'header.portuguese': 'Português',
    'header.german': 'Alemão',
    'header.french': 'Francês',
    'header.urdu': 'Urdu',
    'header.punjabi': 'Punjabi',
    'header.hindi': 'Hindi',
    'ticket.edit': 'Editar Bilhete',
    'ticket.delete': 'Eliminar Bilhete',
    'ticket.changeStatus': 'Alterar Estado',
    'ticket.printReceipt': 'Imprimir Recibo',
    'ticket.status.pending': 'Pendente',
    'ticket.status.in_progress': 'Em Progresso',
    'ticket.status.completed': 'Concluído',
    'ticket.status.delivered': 'Entregue',
    'ticket.status.cancelled': 'Cancelado',
    'ticket.status.not_ok': 'Não OK',
    'dashboard.welcomeBack': 'Bem-vindo de volta',
    'page.tickets.title': 'Bilhetes',
    'page.tickets.subtitle': 'Gerir os seus bilhetes de reparação',
    'page.trash.title': 'Lixo',
    'page.trash.subtitle': 'Bilhetes e produtos eliminados',
    'page.subscription.title': 'Subscrição',
    'page.subscription.subtitle': 'Escolha o seu plano',
    'page.analytics.title': 'Análises',
    'page.settings.title': 'Definições',
    'settings.language': 'Idioma',
    'settings.selectLanguage': 'Selecionar Idioma',
  },
  de: {
    'common.loading': 'Lädt...',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.print': 'Drucken',
    'common.status': 'Status',
    'common.confirm': 'Bestätigen',
    'common.confirmDelete': 'Löschen bestätigen',
    'common.deleteConfirmation': 'Sind Sie sicher, dass Sie dieses Ticket löschen möchten?',
    'common.restore': 'Wiederherstellen',
    'common.deletePermanently': 'Permanent löschen',
    'header.language': 'Sprache',
    'header.english': 'Englisch',
    'header.portuguese': 'Portugiesisch',
    'header.german': 'Deutsch',
    'header.french': 'Französisch',
    'header.urdu': 'Urdu',
    'header.punjabi': 'Punjabi',
    'header.hindi': 'Hindi',
    'ticket.edit': 'Ticket bearbeiten',
    'ticket.delete': 'Ticket löschen',
    'ticket.changeStatus': 'Status ändern',
    'ticket.printReceipt': 'Beleg drucken',
    'ticket.status.pending': 'Ausstehend',
    'ticket.status.in_progress': 'In Bearbeitung',
    'ticket.status.completed': 'Abgeschlossen',
    'ticket.status.delivered': 'Geliefert',
    'ticket.status.cancelled': 'Storniert',
    'ticket.status.not_ok': 'Nicht OK',
    'dashboard.welcomeBack': 'Willkommen zurück',
    'page.tickets.title': 'Tickets',
    'page.tickets.subtitle': 'Verwalten Sie Ihre Reparaturtickets',
    'page.trash.title': 'Papierkorb',
    'page.trash.subtitle': 'Gelöschte Tickets und Produkte',
    'page.subscription.title': 'Abonnement',
    'page.subscription.subtitle': 'Wählen Sie Ihren Plan',
    'page.analytics.title': 'Analysen',
    'page.settings.title': 'Einstellungen',
    'settings.language': 'Sprache',
    'settings.selectLanguage': 'Sprache auswählen',
  },
  fr: {
    'common.loading': 'Chargement...',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.print': 'Imprimer',
    'common.status': 'Statut',
    'common.confirm': 'Confirmer',
    'common.confirmDelete': 'Confirmer la suppression',
    'common.deleteConfirmation': 'Êtes-vous sûr de vouloir supprimer ce ticket?',
    'common.restore': 'Restaurer',
    'common.deletePermanently': 'Supprimer définitivement',
    'header.language': 'Langue',
    'header.english': 'Anglais',
    'header.portuguese': 'Portugais',
    'header.german': 'Allemand',
    'header.french': 'Français',
    'header.urdu': 'Ourdou',
    'header.punjabi': 'Pendjabi',
    'header.hindi': 'Hindi',
    'ticket.edit': 'Modifier le ticket',
    'ticket.delete': 'Supprimer le ticket',
    'ticket.changeStatus': 'Changer le statut',
    'ticket.printReceipt': 'Imprimer le reçu',
    'ticket.status.pending': 'En attente',
    'ticket.status.in_progress': 'En cours',
    'ticket.status.completed': 'Terminé',
    'ticket.status.delivered': 'Livré',
    'ticket.status.cancelled': 'Annulé',
    'ticket.status.not_ok': 'Pas OK',
    'dashboard.welcomeBack': 'Bon retour',
    'page.tickets.title': 'Tickets',
    'page.tickets.subtitle': 'Gérez vos tickets de réparation',
    'page.trash.title': 'Corbeille',
    'page.trash.subtitle': 'Tickets et produits supprimés',
    'page.subscription.title': 'Abonnement',
    'page.subscription.subtitle': 'Choisissez votre forfait',
    'page.analytics.title': 'Analyses',
    'page.settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.selectLanguage': 'Sélectionner la langue',
  },
  ur: {
    'common.loading': 'لوڈ ہو رہا ہے...',
    'common.save': 'محفوظ کریں',
    'common.cancel': 'منسوخ کریں',
    'common.delete': 'حذف کریں',
    'common.edit': 'ترمیم کریں',
    'common.print': 'پرنٹ کریں',
    'common.status': 'حالت',
    'common.confirm': 'تصدیق کریں',
    'common.confirmDelete': 'حذف کی تصدیق کریں',
    'common.deleteConfirmation': 'کیا آپ واقعی اس ٹکٹ کو حذف کرنا چاہتے ہیں؟',
    'common.restore': 'بحال کریں',
    'common.deletePermanently': 'مستقل طور پر حذف کریں',
    'header.language': 'زبان',
    'header.english': 'انگریزی',
    'header.portuguese': 'پرتگالی',
    'header.german': 'جرمن',
    'header.french': 'فرانسیسی',
    'header.urdu': 'اردو',
    'header.punjabi': 'پنجابی',
    'header.hindi': 'ہندی',
    'ticket.edit': 'ٹکٹ میں ترمیم کریں',
    'ticket.delete': 'ٹکٹ حذف کریں',
    'ticket.changeStatus': 'حالت تبدیل کریں',
    'ticket.printReceipt': 'رسید پرنٹ کریں',
    'ticket.status.pending': 'زیر التواء',
    'ticket.status.in_progress': 'جاری',
    'ticket.status.completed': 'مکمل',
    'ticket.status.delivered': 'ڈیلیور',
    'ticket.status.cancelled': 'منسوخ',
    'ticket.status.not_ok': 'ٹھیک نہیں',
    'dashboard.welcomeBack': 'خوش آمدید',
    'page.tickets.title': 'ٹکٹس',
    'page.tickets.subtitle': 'اپنے مرمت کے ٹکٹس کا انتظام کریں',
    'page.trash.title': 'ٹریش',
    'page.trash.subtitle': 'حذف شدہ ٹکٹس اور مصنوعات',
    'page.subscription.title': 'سبسکرپشن',
    'page.subscription.subtitle': 'اپنا پلان منتخب کریں',
    'page.analytics.title': 'تجزیات',
    'page.settings.title': 'ترتیبات',
    'settings.language': 'زبان',
    'settings.selectLanguage': 'زبان منتخب کریں',
  },
  pa: {
    'common.loading': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    'common.save': 'ਸੁਰੱਖਿਅਤ ਕਰੋ',
    'common.cancel': 'ਰੱਦ ਕਰੋ',
    'common.delete': 'ਮਿਟਾਓ',
    'common.edit': 'ਸੰਪਾਦਨ ਕਰੋ',
    'common.print': 'ਪ੍ਰਿੰਟ ਕਰੋ',
    'common.status': 'ਸਥਿਤੀ',
    'common.confirm': 'ਪੁਸ਼ਟੀ ਕਰੋ',
    'common.confirmDelete': 'ਮਿਟਾਉਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
    'common.deleteConfirmation': 'ਕੀ ਤੁਸੀਂ ਯਕੀਨਨ ਇਸ ਟਿਕਟ ਨੂੰ ਮਿਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
    'common.restore': 'ਪੁਨਰਸਥਾਪਿਤ ਕਰੋ',
    'common.deletePermanently': 'ਸਥਾਈ ਤੌਰ \'ਤੇ ਮਿਟਾਓ',
    'header.language': 'ਭਾਸ਼ਾ',
    'header.english': 'ਅੰਗਰੇਜ਼ੀ',
    'header.portuguese': 'ਪੁਰਤਗਾਲੀ',
    'header.german': 'ਜਰਮਨ',
    'header.french': 'ਫਰਾਂਸੀਸੀ',
    'header.urdu': 'ਉਰਦੂ',
    'header.punjabi': 'ਪੰਜਾਬੀ',
    'header.hindi': 'ਹਿੰਦੀ',
    'ticket.edit': 'ਟਿਕਟ ਸੰਪਾਦਨ ਕਰੋ',
    'ticket.delete': 'ਟਿਕਟ ਮਿਟਾਓ',
    'ticket.changeStatus': 'ਸਥਿਤੀ ਬਦਲੋ',
    'ticket.printReceipt': 'ਰਸੀਦ ਪ੍ਰਿੰਟ ਕਰੋ',
    'ticket.status.pending': 'ਬਾਕੀ',
    'ticket.status.in_progress': 'ਜਾਰੀ',
    'ticket.status.completed': 'ਪੂਰਾ',
    'ticket.status.delivered': 'ਡਿਲੀਵਰ',
    'ticket.status.cancelled': 'ਰੱਦ',
    'ticket.status.not_ok': 'ਠੀਕ ਨਹੀਂ',
    'dashboard.welcomeBack': 'ਵਾਪਸੀ \'ਤੇ ਸਵਾਗਤ',
    'page.tickets.title': 'ਟਿਕਟ',
    'page.tickets.subtitle': 'ਆਪਣੇ ਮੁਰੰਮਤ ਟਿਕਟਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ',
    'page.trash.title': 'ਕੂੜਾ',
    'page.trash.subtitle': 'ਮਿਟਾਏ ਗਏ ਟਿਕਟ ਅਤੇ ਉਤਪਾਦ',
    'page.subscription.title': 'ਗਾਹਕੀ',
    'page.subscription.subtitle': 'ਆਪਣਾ ਪਲਾਨ ਚੁਣੋ',
    'page.analytics.title': 'ਵਿਸ਼ਲੇਸ਼ਣ',
    'page.settings.title': 'ਸੈਟਿੰਗਾਂ',
    'settings.language': 'ਭਾਸ਼ਾ',
    'settings.selectLanguage': 'ਭਾਸ਼ਾ ਚੁਣੋ',
  },
  hi: {
    'common.loading': 'लोड हो रहा है...',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.print': 'प्रिंट करें',
    'common.status': 'स्थिति',
    'common.confirm': 'पुष्टि करें',
    'common.confirmDelete': 'हटाने की पुष्टि करें',
    'common.deleteConfirmation': 'क्या आप वाकई इस टिकट को हटाना चाहते हैं?',
    'common.restore': 'पुनर्स्थापित करें',
    'common.deletePermanently': 'स्थायी रूप से हटाएं',
    'header.language': 'भाषा',
    'header.english': 'अंग्रेजी',
    'header.portuguese': 'पुर्तगाली',
    'header.german': 'जर्मन',
    'header.french': 'फ्रेंच',
    'header.urdu': 'उर्दू',
    'header.punjabi': 'पंजाबी',
    'header.hindi': 'हिंदी',
    'ticket.edit': 'टिकट संपादित करें',
    'ticket.delete': 'टिकट हटाएं',
    'ticket.changeStatus': 'स्थिति बदलें',
    'ticket.printReceipt': 'रसीद प्रिंट करें',
    'ticket.status.pending': 'लंबित',
    'ticket.status.in_progress': 'प्रगति में',
    'ticket.status.completed': 'पूर्ण',
    'ticket.status.delivered': 'डिलीवर',
    'ticket.status.cancelled': 'रद्द',
    'ticket.status.not_ok': 'ठीक नहीं',
    'dashboard.welcomeBack': 'वापसी पर स्वागत है',
    'page.tickets.title': 'टिकट',
    'page.tickets.subtitle': 'अपने मरम्मत टिकट प्रबंधित करें',
    'page.trash.title': 'ट्रैश',
    'page.trash.subtitle': 'हटाए गए टिकट और उत्पाद',
    'page.subscription.title': 'सदस्यता',
    'page.subscription.subtitle': 'अपनी योजना चुनें',
    'page.analytics.title': 'विश्लेषण',
    'page.settings.title': 'सेटिंग्स',
    'settings.language': 'भाषा',
    'settings.selectLanguage': 'भाषा चुनें',
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem('language');
      if (stored && ['en', 'pt', 'de', 'fr', 'ur', 'pa', 'hi'].includes(stored)) {
        setLanguageState(stored as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = useMemo(() => {
    return (key: string) => {
      const current = translations[language][key];
      if (current !== undefined) return current;
      const fallback = translations.en[key];
      return fallback ?? key;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
