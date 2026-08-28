import type { SteamDBItem, ITADItem } from '../types'

const RSS2JSON_PROXY = 'https://api.rss2json.com/v1/api.json'

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

interface RssItem {
  title: string
  link: string
  pubDate: string
  content?: string
  description?: string
}

export async function fetchSteamDBFeed(): Promise<SteamDBItem[]> {
  try {
    const url = `${RSS2JSON_PROXY}?rss_url=${encodeURIComponent('https://steamdb.info/upcoming/free/rss/')}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 'ok') return []

    return (data.items as RssItem[]).map((item) => {
      const appIdMatch = item.link.match(/\/app\/(\d+)/)
      return {
        title: stripHtml(item.title),
        link: item.link,
        appId: appIdMatch ? appIdMatch[1] : null,
        publishedDate: item.pubDate,
      }
    })
  } catch {
    return []
  }
}

export async function fetchITADFeed(): Promise<ITADItem[]> {
  try {
    const url = `${RSS2JSON_PROXY}?rss_url=${encodeURIComponent('https://isthereanydeal.com/rss/free/')}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 'ok') return []

    return (data.items as RssItem[]).map((item) => {
      const storeMatch = item.link.match(/\/\/(?:www\.)?([^.]+)\./)
      return {
        title: stripHtml(item.title),
        link: item.link,
        store: storeMatch ? storeMatch[1] : 'unknown',
        publishedDate: item.pubDate,
      }
    })
  } catch {
    return []
  }
}
