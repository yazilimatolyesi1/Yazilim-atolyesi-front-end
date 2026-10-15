export type ContentPage = 'HOME' | 'ABOUT' | 'CONTACT';
export type ContentType =
  | 'HERO'
  | 'TEXT'
  | 'FEATURE'
  | 'CONTACT_INFO'
  | 'SLIDER'
  | 'CUSTOM';

export interface PageContentBlock {
  id: string;
  page: ContentPage;
  contentType: ContentType;
  contentKey: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  imageAltText?: string | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
  displayOrder: number;
  active: boolean;
}

export interface PublicSetting {
  key: string;
  value: string;
}

export interface SiteContent {
  home: PageContentBlock[];
  about: PageContentBlock[];
  contact: PageContentBlock[];
  settings: Record<string, string>;
}
