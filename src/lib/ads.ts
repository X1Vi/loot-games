export interface AdUnit {
  key: string
  format: 'iframe'
  width: number
  height: number
  scriptBase: string
}

export const ADSTERRA_BANNER_300x250: AdUnit = {
  key: 'd73625c77be9cd66cfcef2a8841c08e2',
  format: 'iframe',
  width: 300,
  height: 250,
  scriptBase: 'https://www.highrevenueformat.com',
}
