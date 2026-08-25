import type { FreeGame } from '../types'

const GAMERPOWER_API = 'https://www.gamerpower.com/api/giveaways'

export async function fetchGamerPowerGiveaways(): Promise<FreeGame[]> {
  const res = await fetch(GAMERPOWER_API)
  if (!res.ok) throw new Error(`GamerPower API error: ${res.status}`)
  const data = await res.json()
  return data.map((item: Record<string, unknown>) => ({
    ...item,
    source: 'gamerpower' as const,
  })) as FreeGame[]
}
