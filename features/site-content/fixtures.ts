import type { PageContentBlock } from './types';

export const HOME_FIXTURES: PageContentBlock[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    page: 'HOME',
    contentType: 'HERO',
    contentKey: 'home-hero',
    title: 'Yazılım Atölyesi',
    subtitle: 'Birlikte öğreniyor, birlikte üretiyoruz.',
    body: 'Kulübümüzün etkinliklerini ve çalışmalarını buradan takip edebilirsin.',
    imageUrl: null,
    imageAltText: null,
    linkLabel: null,
    linkUrl: null,
    displayOrder: 10,
    active: true,
  },
];

export const ABOUT_FIXTURES: PageContentBlock[] = [
  {
    id: '00000000-0000-0000-0000-000000000102',
    page: 'ABOUT',
    contentType: 'TEXT',
    contentKey: 'about-main',
    title: 'Hakkımızda',
    subtitle: null,
    body: 'Yazılım ve teknoloji etrafında üreten bir öğrenci topluluğuyuz.',
    imageUrl: null,
    imageAltText: null,
    linkLabel: null,
    linkUrl: null,
    displayOrder: 10,
    active: true,
  },
];

export const CONTACT_FIXTURES: PageContentBlock[] = [
  {
    id: '00000000-0000-0000-0000-000000000103',
    page: 'CONTACT',
    contentType: 'CONTACT_INFO',
    contentKey: 'contact-main',
    title: 'İletişim',
    subtitle: null,
    body: 'Soruların ve iş birliği taleplerin için bize ulaşabilirsin.',
    imageUrl: null,
    imageAltText: null,
    linkLabel: null,
    linkUrl: null,
    displayOrder: 10,
    active: true,
  },
];

export const PUBLIC_SETTINGS_FIXTURES: Record<string, string> = {
  'contact.email': 'iletisim@yazilimatolyesi.local',
  'social.instagram': '',
  'social.linkedin': '',
  'legal.kvkk.notice': 'KVKK bilgilendirme metni.',
  'legal.kvkk.version': '1.0',
  'legal.marketing.notice': 'Pazarlama izni metni.',
  'legal.marketing.version': '1.0',
};
