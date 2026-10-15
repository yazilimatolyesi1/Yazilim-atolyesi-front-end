import type { PageContentBlock } from './types';

export const CONTENT_MAPPING_TABLE: Array<{
  uiField: string;
  sourceKey: 'none' | 'contentKey' | 'field';
  page?: 'HOME' | 'ABOUT' | 'CONTACT';
  contentKey?: string;
  dynamic: boolean;
  notes: string;
}> = [
  { uiField: 'Hero başlığı (HERO.title)', sourceKey: 'contentKey', page: 'HOME', contentKey: 'home-hero', dynamic: true, notes: 'Backend page_contents(HOME, HERO, home-hero).title' },
  { uiField: 'Hero alt başlık (HERO.subtitle)', sourceKey: 'contentKey', page: 'HOME', contentKey: 'home-hero', dynamic: true, notes: 'Backend page_contents(HOME, HERO, home-hero).subtitle' },
  { uiField: 'Hero gövdesi (HERO.body)', sourceKey: 'contentKey', page: 'HOME', contentKey: 'home-hero', dynamic: true, notes: 'Backend page_contents(HOME, HERO, home-hero).body' },
  { uiField: 'Kulüp adı', sourceKey: 'field', dynamic: false, notes: 'Statik: lib/content.ts club.name' },
  { uiField: 'Üniversite', sourceKey: 'field', dynamic: false, notes: 'Statik: lib/content.ts club.university' },
  { uiField: 'Hakkımızda (ABOUT)', sourceKey: 'contentKey', page: 'ABOUT', contentKey: 'about-main', dynamic: true, notes: 'Backend page_contents(ABOUT, TEXT, about-main)' },
  { uiField: 'İletişim açıklaması', sourceKey: 'contentKey', page: 'CONTACT', contentKey: 'contact-main', dynamic: true, notes: 'Backend page_contents(CONTACT, CONTACT_INFO, contact-main)' },
  { uiField: 'E-posta (footer)', sourceKey: 'none', dynamic: true, notes: 'Backend site_settings key: contact.email (public)' },
  { uiField: 'Takım bölümü (takimlar)', sourceKey: 'field', dynamic: false, notes: 'Statik: lib/content.ts teams (plan dahilinde statik bırakıldı)' },
  { uiField: 'Çalışma akışı (steps)', sourceKey: 'field', dynamic: false, notes: 'Statik: lib/content.ts steps (plan dahilinde statik bırakıldı)' },
  { uiField: 'Kurallar (rules)', sourceKey: 'field', dynamic: false, notes: 'Statik: lib/content.ts rules (plan dahilinde statik bırakıldı)' },
  { uiField: 'Güncellemeler (updates)', sourceKey: 'field', dynamic: false, notes: 'Statik: lib/content.ts updates (plan dahilinde statik bırakıldı)' },
  { uiField: 'Dikeyler (pillars)', sourceKey: 'field', dynamic: false, notes: 'Statik: lib/content.ts pillars (plan dahilinde statik bırakıldı)' },
];
