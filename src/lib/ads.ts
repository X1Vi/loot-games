export interface AdUnit {
  key: string
  width: number
  height: number
}

export type AdFormat = 'rectangle' | 'responsive-banner'

export const ADSTERRA_RECTANGLE: AdUnit = {
  key: 'd73625c77be9cd66cfcef2a8841c08e2',
  width: 300,
  height: 250,
}

export const ADSTERRA_MOBILE_BANNER: AdUnit = {
  key: '4c2207f34f4967c880c656d677a667ee',
  width: 320,
  height: 50,
}

export const ADSTERRA_DESKTOP_BANNER: AdUnit = {
  key: '492f311c62b522d0a0f8a5914220812b',
  width: 728,
  height: 90,
}

// Active direct-link unit shared with the proven gov-jobs fallback pattern.
export const ADSTERRA_SPONSOR_URL =
  'https://www.profitableratecpmnetwork.com/sz6m0i3my?key=9bf1832ed872caeb2748954ddd4d8f4f'
