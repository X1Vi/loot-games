export const INSTAGRAM_URL = 'https://www.instagram.com/loot_games_84/'
export const BUYMEACOFFEE_URL = 'https://buymeacoffee.com/x1vi_donateforopensource'
export const LIFE_SYS_URL = 'https://x1vi.itch.io/life-sim?ref=loot-terminal'
export const FEEDBACK_URL = 'https://feedback.x1vi.workers.dev/?site=loot-terminal'

/** Adds the current page so the feedback desk knows where the user came from. */
export function feedbackUrl(page?: string): string {
  const url = new URL(FEEDBACK_URL)
  const target = page ?? (typeof window === 'undefined' ? '' : window.location.href)
  if (target.length > 0) {
    url.searchParams.set('page', target)
  }
  return url.toString()
}

