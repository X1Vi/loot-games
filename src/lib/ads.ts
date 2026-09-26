export interface AdUnit {
  page: string
  width: number
  height: number
}

export type AdFormat = 'rectangle' | 'responsive-banner'

export const ADSTERRA_RECTANGLE: AdUnit = {
  page: '/adstera-300x250.html?v=2',
  width: 300,
  height: 250,
}

export const ADSTERRA_MOBILE_BANNER: AdUnit = {
  page: '/adstera-320x50.html?v=2',
  width: 320,
  height: 50,
}

export const ADSTERRA_DESKTOP_BANNER: AdUnit = {
  page: '/adstera-728x90.html?v=2',
  width: 728,
  height: 90,
}
