import type { PageContentBlock, PublicSetting, SiteContent } from './types';
import { ABOUT_FIXTURES, CONTACT_FIXTURES, HOME_FIXTURES, PUBLIC_SETTINGS_FIXTURES } from './fixtures';

export function adaptPageContents(contents: unknown): PageContentBlock[] {
  if (!Array.isArray(contents)) return [];
  return contents
    .filter((item): item is PageContentBlock => Boolean(item && typeof item === 'object'))
    .map((item) => item as PageContentBlock);
}

export function adaptPublicSettings(settings: unknown): Record<string, string> {
  if (!Array.isArray(settings)) return {};
  const result: Record<string, string> = {};
  for (const entry of settings) {
    if (entry && typeof entry === 'object' && 'key' in entry && 'value' in entry) {
      const key = (entry as PublicSetting).key;
      const value = (entry as PublicSetting).value;
      if (typeof key === 'string') {
        result[key] = typeof value === 'string' ? value : String(value ?? '');
      }
    }
  }
  return result;
}

export function mergeSiteContent({
  home,
  about,
  contact,
  settings,
}: SiteContent): SiteContent {
  return {
    home: home.length > 0 ? home : HOME_FIXTURES,
    about: about.length > 0 ? about : ABOUT_FIXTURES,
    contact: contact.length > 0 ? contact : CONTACT_FIXTURES,
    settings: Object.keys(settings).length > 0 ? settings : PUBLIC_SETTINGS_FIXTURES,
  };
}

export function withFallbackContent(partial: Partial<SiteContent> = {}): SiteContent {
  return mergeSiteContent({
    home: partial.home ?? [],
    about: partial.about ?? [],
    contact: partial.contact ?? [],
    settings: partial.settings ?? {},
  });
}
