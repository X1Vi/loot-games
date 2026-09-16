import { useCallback, useState } from 'react'

const STORAGE_KEY = 'loot-terminal-alerts'

function supported(): boolean {
  return typeof Notification !== 'undefined'
}

export function useNotifications() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    supported() ? Notification.permission : 'unsupported',
  )

  const toggle = useCallback(async () => {
    if (!supported()) return
    if (enabled) {
      try {
        window.localStorage.setItem(STORAGE_KEY, '0')
      } catch {
        // ignore
      }
      setEnabled(false)
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      try {
        window.localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        // ignore
      }
      setEnabled(true)
    }
  }, [enabled])

  const notify = useCallback(
    (title: string, body: string) => {
      if (!enabled || !supported() || Notification.permission !== 'granted') return
      try {
        new Notification(title, { body, icon: '/icon.svg' })
      } catch {
        // ignore
      }
    },
    [enabled],
  )

  return { enabled, permission, toggle, notify }
}
