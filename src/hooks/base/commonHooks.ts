import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DependencyList,
  type Dispatch,
  type EffectCallback,
  type FocusEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { NavigateFunction } from 'react-router'
import type { EntityId, SortOrder, SortState } from '@/interfaces/base/common'
import type {
  AuthUser,
  HotkeyBinding,
  HotkeyMap,
  IResourceService,
  NotifyAdapter,
  ResourceHooksConfig,
  ValidationRules,
} from './types'

/**
 * All common hooks — ONE file (copy/paste ready).
 * Feature folders import from here and wire project config.
 *
 * import { useToggle, createResourceHooks } from '@/hooks/base/commonHooks'
 */

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

// ─── Internal helpers ────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createRafThrottle<T extends unknown[]>(fn: (...args: T) => void, wait = 100) {
  let last = 0
  let rafId: number | null = null

  return (...args: T) => {
    const now = Date.now()
    const run = () => {
      last = Date.now()
      fn(...args)
    }

    if (now - last >= wait) {
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      run()
      return
    }

    if (rafId == null) {
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (Date.now() - last >= wait) run()
      })
    }
  }
}

interface CacheEntry<T> {
  data: T
  ts: number
}

const store = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export function readCache<T>(key: string, ttl: number): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (ttl > 0 && Date.now() - entry.ts > ttl) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function writeCache<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() })
}

export function invalidateCache(key: string): void {
  store.delete(key)
  inflight.delete(key)
}

export function clearCache(): void {
  store.clear()
  inflight.clear()
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T> | T,
  ttl = 60_000
): Promise<T> {
  const cached = readCache<T>(key, ttl)
  if (cached != null) return cached

  if (inflight.has(key)) return inflight.get(key) as Promise<T>

  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      writeCache(key, data)
      return data
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

function parseHotkey(hotkey: string): HotkeyBinding {
  const parts = hotkey.toLowerCase().split('+').map((p) => p.trim())
  return {
    key: parts[parts.length - 1] ?? '',
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
  }
}

function comboFromBinding(binding: HotkeyBinding): string {
  const parts: string[] = []
  if (binding.ctrl) parts.push('ctrl')
  if (binding.shift) parts.push('shift')
  if (binding.alt) parts.push('alt')
  if (binding.meta) parts.push('meta')
  parts.push(binding.key)
  return parts.join('+')
}

// ─── Resource helpers ───────────────────────────────────────────

function unwrap<T>(response: T | { data: T }): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

function ok(notify: NotifyAdapter | undefined, message: string): void {
  notify?.success?.(message)
}

function fail(notify: NotifyAdapter | undefined, message: string): void {
  notify?.error?.(message)
}

function applySearch<T>(
  items: T[],
  query: string,
  keys: (keyof T & string)[],
  caseSensitive: boolean
): T[] {
  if (!query) return items
  const q = caseSensitive ? query : query.toLowerCase()
  return items.filter((item) => {
    const record = item as Record<string, unknown>
    const fields = keys.length ? keys.map((k) => record[k]) : [item as unknown]
    return fields.some((field) => {
      if (field == null) return false
      const value = caseSensitive ? String(field) : String(field).toLowerCase()
      return value.includes(q)
    })
  })
}

function applySort<T>(
  items: T[],
  sortKey: (keyof T & string) | null,
  sortOrder: SortOrder
): T[] {
  if (!sortKey) return items
  const sorted = [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortKey]
    const bv = (b as Record<string, unknown>)[sortKey]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return av - bv
    return String(av).localeCompare(String(bv))
  })
  return sortOrder === 'desc' ? sorted.reverse() : sorted
}

// ─── State hooks ────────────────────────────────────────────────

export interface ToggleActions {
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
  setValue: Dispatch<SetStateAction<boolean>>
}

export function useToggle(defaultValue = false): [boolean, ToggleActions] {
  const [value, setValue] = useState(defaultValue)
  return [
    value,
    {
      toggle: () => setValue((prev) => !prev),
      setTrue: () => setValue(true),
      setFalse: () => setValue(false),
      setValue,
    },
  ]
}

export interface BooleanState {
  value: boolean
  setValue: Dispatch<SetStateAction<boolean>>
  setTrue: () => void
  setFalse: () => void
  toggle: () => void
}

export function useBoolean(defaultValue = false): BooleanState {
  const [value, setValue] = useState(defaultValue)
  return {
    value,
    setValue,
    setTrue: () => setValue(true),
    setFalse: () => setValue(false),
    toggle: () => setValue((prev) => !prev),
  }
}

export interface DisclosureState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

export function useDisclosure(defaultOpen = false): DisclosureState {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    setIsOpen,
  }
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

export function useMounted(): () => boolean {
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return () => mountedRef.current
}

export function useMountedState(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  return mounted
}

export function useUpdateEffect(effect: EffectCallback, deps: DependencyList): void {
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    return effect()
  }, deps)
}

export function useUnmount(fn: () => void): void {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(
    () => () => {
      fnRef.current()
    },
    []
  )
}

export interface CounterOptions {
  min?: number
  max?: number
  step?: number
}

export interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
  set: (n: number) => void
  setCount: Dispatch<SetStateAction<number>>
}

export function useCounter(initial = 0, options: CounterOptions = {}): CounterState {
  const { min = -Infinity, max = Infinity, step = 1 } = options
  const [count, setCount] = useState(initial)

  const clamp = (n: number) => Math.min(Math.max(n, min), max)

  return {
    count,
    increment: () => setCount((c) => clamp(c + step)),
    decrement: () => setCount((c) => clamp(c - step)),
    reset: () => setCount(initial),
    set: (n) => setCount(clamp(n)),
    setCount,
  }
}

export interface StepOptions {
  initialStep?: number
  loop?: boolean
}

export interface StepState {
  step: number
  next: () => void
  prev: () => void
  goTo: (n: number) => void
  reset: () => void
  isFirst: boolean
  isLast: boolean
  canNext: boolean
  canPrev: boolean
}

export function useStep(maxStep: number, options: StepOptions = {}): StepState {
  const { initialStep = 0, loop = false } = options
  const [step, setStep] = useState(initialStep)

  return {
    step,
    next: () =>
      setStep((s) => {
        if (s >= maxStep) return loop ? 0 : s
        return s + 1
      }),
    prev: () =>
      setStep((s) => {
        if (s <= 0) return loop ? maxStep : s
        return s - 1
      }),
    goTo: (n) => setStep(Math.min(Math.max(n, 0), maxStep)),
    reset: () => setStep(initialStep),
    isFirst: step === 0,
    isLast: step === maxStep,
    canNext: step < maxStep || loop,
    canPrev: step > 0 || loop,
  }
}

export interface ArrayState<T> {
  array: T[]
  setArray: Dispatch<SetStateAction<T[]>>
  push: (item: T) => void
  remove: (index: number) => void
  removeBy: (predicate: (item: T) => boolean) => void
  update: (index: number, value: T) => void
  insert: (index: number, item: T) => void
  clear: () => void
  reset: () => void
}

export function useArray<T>(initial: T[] = []): ArrayState<T> {
  const [array, setArray] = useState(initial)

  return {
    array,
    setArray,
    push: (item) => setArray((a) => [...a, item]),
    remove: (index) => setArray((a) => a.filter((_, i) => i !== index)),
    removeBy: (predicate) => setArray((a) => a.filter((item) => !predicate(item))),
    update: (index, value) =>
      setArray((a) => a.map((item, i) => (i === index ? value : item))),
    insert: (index, item) =>
      setArray((a) => [...a.slice(0, index), item, ...a.slice(index)]),
    clear: () => setArray([]),
    reset: () => setArray(initial),
  }
}

export interface SetState<T> {
  set: Set<T>
  add: (value: T) => void
  remove: (value: T) => void
  toggle: (value: T) => void
  clear: () => void
  reset: () => void
  has: (value: T) => boolean
  size: number
}

export function useSet<T>(initial: T[] = []): SetState<T> {
  const [set, setSet] = useState(() => new Set(initial))

  return {
    set,
    add: (value) => setSet((s) => new Set(s).add(value)),
    remove: (value) =>
      setSet((s) => {
        const next = new Set(s)
        next.delete(value)
        return next
      }),
    toggle: (value) =>
      setSet((s) => {
        const next = new Set(s)
        if (next.has(value)) next.delete(value)
        else next.add(value)
        return next
      }),
    clear: () => setSet(new Set()),
    reset: () => setSet(new Set(initial)),
    has: (value) => set.has(value),
    size: set.size,
  }
}

export interface MapState<K, V> {
  map: Map<K, V>
  set: (key: K, value: V) => void
  remove: (key: K) => void
  clear: () => void
  reset: () => void
  get: (key: K) => V | undefined
  size: number
}

export function useMap<K, V>(initial: Iterable<readonly [K, V]> = []): MapState<K, V> {
  const [map, setMap] = useState(() => new Map(initial))

  return {
    map,
    set: (key, value) => setMap((m) => new Map(m).set(key, value)),
    remove: (key) =>
      setMap((m) => {
        const next = new Map(m)
        next.delete(key)
        return next
      }),
    clear: () => setMap(new Map()),
    reset: () => setMap(new Map(initial)),
    get: (key) => map.get(key),
    size: map.size,
  }
}

// ─── Timing hooks ────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useThrottle<T>(value: T, interval = 300): T {
  const [throttled, setThrottled] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottled(value)
        lastRan.current = Date.now()
      }
    }, interval - (Date.now() - lastRan.current))

    return () => clearTimeout(handler)
  }, [value, interval])

  return throttled
}

export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay == null) return
    const id = setTimeout(() => savedCallback.current(), delay)
    return () => clearTimeout(id)
  }, [delay])
}

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay == null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

// ─── Storage hooks ────────────────────────────────────────────────

function createStorageHook(storageArea: () => Storage) {
  return function useStorage<T>(
    key: string,
    initialValue: T
  ): [T, Dispatch<SetStateAction<T>>, () => void] {
    const [value, setValue] = useState<T>(() => {
      if (!isBrowser) return initialValue
      try {
        const raw = storageArea().getItem(key)
        return raw != null ? (JSON.parse(raw) as T) : initialValue
      } catch {
        return initialValue
      }
    })

    useEffect(() => {
      try {
        storageArea().setItem(key, JSON.stringify(value))
      } catch {
        // ignore (quota exceeded, private mode, etc.)
      }
    }, [key, value])

    const remove = useCallback(() => {
      try {
        storageArea().removeItem(key)
        setValue(initialValue)
      } catch {
        // ignore
      }
    }, [key, initialValue])

    return [value, setValue, remove]
  }
}

export const useLocalStorage = createStorageHook(() => window.localStorage)
export const useSessionStorage = createStorageHook(() => window.sessionStorage)

// ─── Browser hooks ────────────────────────────────────────────────

interface NetworkInformation extends EventTarget {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (!isBrowser) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export interface WindowSize {
  width: number
  height: number
}

export function useWindowSize(throttleMs = 100): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => ({
    width: isBrowser ? window.innerWidth : 0,
    height: isBrowser ? window.innerHeight : 0,
  }))

  useEffect(() => {
    if (!isBrowser) return

    const onResize = createRafThrottle(() => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }, throttleMs)

    window.addEventListener('resize', onResize, { passive: true })
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [throttleMs])

  return size
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => (isBrowser ? navigator.onLine : true))

  useEffect(() => {
    function goOnline() {
      setIsOnline(true)
    }
    function goOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}

export interface NetworkState {
  isOnline: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

export function useNetwork(): NetworkState {
  const isOnline = useOnlineStatus()
  const nav = isBrowser ? (navigator as NavigatorWithConnection) : null
  const [network, setNetwork] = useState<Omit<NetworkState, 'isOnline'>>(() => ({
    effectiveType: nav?.connection?.effectiveType,
    downlink: nav?.connection?.downlink,
    rtt: nav?.connection?.rtt,
    saveData: nav?.connection?.saveData ?? false,
  }))

  useEffect(() => {
    const conn = (navigator as NavigatorWithConnection).connection
    if (!conn) return

    function onChange() {
      setNetwork({
        effectiveType: conn!.effectiveType,
        downlink: conn!.downlink,
        rtt: conn!.rtt,
        saveData: conn!.saveData,
      })
    }

    conn.addEventListener('change', onChange)
    return () => conn.removeEventListener('change', onChange)
  }, [])

  return { isOnline, ...network }
}

export interface DocumentTitleOptions {
  restoreOnUnmount?: boolean
}

export function useDocumentTitle(title: string, options: DocumentTitleOptions = {}): void {
  const { restoreOnUnmount = false } = options
  const defaultTitle = useRef(isBrowser ? document.title : '')

  useEffect(() => {
    if (isBrowser) document.title = title
  }, [title])

  useEffect(() => {
    const prev = defaultTitle.current
    return () => {
      if (restoreOnUnmount && isBrowser) document.title = prev
    }
  }, [restoreOnUnmount])
}

export function useDocumentVisibility(): DocumentVisibilityState {
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() =>
    isBrowser ? document.visibilityState : 'visible'
  )

  useEffect(() => {
    function onChange() {
      setVisibilityState(document.visibilityState)
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visibilityState
}

export interface ClipboardState {
  copy: (text: string) => Promise<void>
  copied: boolean
  error: unknown
}

export function useClipboard(resetDelay = 2000): ClipboardState {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          const el = document.createElement('textarea')
          el.value = text
          el.style.position = 'fixed'
          el.style.opacity = '0'
          document.body.appendChild(el)
          el.select()
          document.execCommand('copy')
          document.body.removeChild(el)
        }
        setCopied(true)
        setError(null)
        setTimeout(() => setCopied(false), resetDelay)
      } catch (err) {
        setError(err)
        setCopied(false)
      }
    },
    [resetDelay]
  )

  return { copy, copied, error }
}

export const useCopy = useClipboard

export interface DarkModeOptions {
  storageKey?: string
  defaultValue?: string
  attribute?: 'class' | string
  darkValue?: string
  lightValue?: string
}

export interface DarkModeState {
  isDark: boolean
  theme: string
  setTheme: Dispatch<SetStateAction<string>>
  toggle: () => void
  enable: () => void
  disable: () => void
}

export function useDarkMode(options: DarkModeOptions = {}): DarkModeState {
  const {
    storageKey = 'theme',
    defaultValue = 'light',
    attribute = 'class',
    darkValue = 'dark',
    lightValue = 'light',
  } = options

  const [theme, setTheme] = useLocalStorage(storageKey, defaultValue)
  const isDark = theme === 'dark'

  useIsomorphicLayoutEffect(() => {
    if (!isBrowser) return
    const root = document.documentElement
    if (attribute === 'class') {
      root.classList.remove(darkValue, lightValue)
      root.classList.add(isDark ? darkValue : lightValue)
    } else {
      root.setAttribute(attribute, isDark ? darkValue : lightValue)
    }
  }, [isDark, attribute, darkValue, lightValue])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [setTheme])
  const enable = useCallback(() => setTheme('dark'), [setTheme])
  const disable = useCallback(() => setTheme('light'), [setTheme])

  return { isDark, theme, setTheme, toggle, enable, disable }
}

export interface ThemeOptions {
  storageKey?: string
  defaultTheme?: string
}

export interface ThemeState {
  theme: string
  setTheme: Dispatch<SetStateAction<string>>
  cycle: () => void
  themes: string[]
}

export function useTheme(themes: string[] = ['light', 'dark'], options: ThemeOptions = {}): ThemeState {
  const { storageKey = 'app-theme', defaultTheme = themes[0] } = options
  const [theme, setTheme] = useLocalStorage(storageKey, defaultTheme)

  const cycle = useCallback(() => {
    setTheme((current) => {
      const index = themes.indexOf(current)
      return themes[(index + 1) % themes.length] ?? themes[0] ?? current
    })
  }, [setTheme, themes])

  return { theme, setTheme, cycle, themes }
}

export interface OrientationState {
  type: string
  angle: number
  isPortrait: boolean | undefined
  isLandscape: boolean | undefined
}

export function useOrientation(): OrientationState {
  const [orientation, setOrientation] = useState(() => ({
    type: isBrowser ? screen.orientation?.type ?? 'landscape-primary' : 'landscape-primary',
    angle: isBrowser ? screen.orientation?.angle ?? 0 : 0,
  }))

  useEffect(() => {
    function onChange() {
      setOrientation({
        type: screen.orientation?.type ?? 'landscape-primary',
        angle: screen.orientation?.angle ?? 0,
      })
    }

    screen.orientation?.addEventListener('change', onChange)
    window.addEventListener('orientationchange', onChange)
    return () => {
      screen.orientation?.removeEventListener('change', onChange)
      window.removeEventListener('orientationchange', onChange)
    }
  }, [])

  const isPortrait = orientation.type?.includes('portrait')
  const isLandscape = orientation.type?.includes('landscape')

  return { ...orientation, isPortrait, isLandscape }
}

export interface FullscreenState {
  isFullscreen: boolean
  enter: () => Promise<void>
  exit: () => Promise<void>
  toggle: () => Promise<void>
}

export function useFullscreen(targetRef?: RefObject<HTMLElement | null>): FullscreenState {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const enter = useCallback(async () => {
    const el = targetRef?.current ?? document.documentElement
    await el.requestFullscreen?.()
  }, [targetRef])

  const exit = useCallback(async () => {
    if (document.fullscreenElement) await document.exitFullscreen?.()
  }, [])

  const toggle = useCallback(async () => {
    if (document.fullscreenElement) await exit()
    else await enter()
  }, [enter, exit])

  return { isFullscreen, enter, exit, toggle }
}

export function useIdle(timeout = 60_000): boolean {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isBrowser) return

    function reset() {
      setIsIdle(false)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIsIdle(true), timeout)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [timeout])

  return isIdle
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export interface GeolocationState {
  loading: boolean
  accuracy: number | null
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  latitude: number | null
  longitude: number | null
  speed: number | null
  timestamp: number | null
  error: GeolocationPositionError | Error | null
  getPosition: () => void
}

export function useGeolocation(options: GeolocationOptions = {}): GeolocationState {
  const { enableHighAccuracy = false, timeout = 10_000, maximumAge = 0 } = options
  const [state, setState] = useState<Omit<GeolocationState, 'getPosition'>>({
    loading: false,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
    error: null,
  })

  const getPosition = useCallback(() => {
    if (!navigator?.geolocation) {
      setState((s) => ({ ...s, error: new Error('Geolocation not supported') }))
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { coords, timestamp } = pos
        setState({
          loading: false,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          altitudeAccuracy: coords.altitudeAccuracy,
          heading: coords.heading,
          latitude: coords.latitude,
          longitude: coords.longitude,
          speed: coords.speed,
          timestamp,
          error: null,
        })
      },
      (error) => setState((s) => ({ ...s, loading: false, error })),
      { enableHighAccuracy, timeout, maximumAge }
    )
  }, [enableHighAccuracy, timeout, maximumAge])

  return { ...state, getPosition }
}

// ─── Events hooks ────────────────────────────────────────────────

type EventTargetLike = Window | Document | HTMLElement | null | undefined

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: EventTargetLike,
  options?: boolean | AddEventListenerOptions
): void
export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: EventTargetLike,
  options?: boolean | AddEventListenerOptions
): void
export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: EventTargetLike,
  options?: boolean | AddEventListenerOptions
): void {
  const savedHandler = useRef(handler)
  savedHandler.current = handler

  const target = element ?? (isBrowser ? window : null)

  useEffect(() => {
    if (!target || !('addEventListener' in target)) return

    const listener = (event: Event) => savedHandler.current(event)
    target.addEventListener(eventName, listener as EventListener, options)
    return () => target.removeEventListener(eventName, listener as EventListener, options)
  }, [eventName, target, options])
}

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const el = ref.current
      if (!el || !(event.target instanceof Node) || el.contains(event.target)) return
      handler(event)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [handler])

  return ref
}

export function useHover<T extends HTMLElement = HTMLElement>(): [
  (node: T | null) => void,
  boolean,
] {
  const [isHovered, setIsHovered] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const ref = useCallback((node: T | null) => {
    cleanupRef.current?.()
    cleanupRef.current = null

    if (!node) return

    const onEnter = () => setIsHovered(true)
    const onLeave = () => setIsHovered(false)

    node.addEventListener('mouseenter', onEnter)
    node.addEventListener('mouseleave', onLeave)

    cleanupRef.current = () => {
      node.removeEventListener('mouseenter', onEnter)
      node.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  useEffect(() => () => cleanupRef.current?.(), [])

  return [ref, isHovered]
}

export interface MousePosition {
  x: number
  y: number
}

export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = createRafThrottle((event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY })
    }, 50)

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return position
}

export interface LongPressOptions {
  delay?: number
  onClick?: (event: ReactMouseEvent) => void
}

export interface LongPressHandlers {
  onMouseDown: (event: ReactMouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onTouchStart: (event: ReactTouchEvent) => void
  onTouchEnd: () => void
  onClick: (event: ReactMouseEvent) => void
}

export function useLongPress(
  callback: (event: ReactMouseEvent | ReactTouchEvent) => void,
  options: LongPressOptions = {}
): LongPressHandlers {
  const { delay = 500, onClick } = options
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPress = useRef(false)

  const start = useCallback(
    (event: ReactMouseEvent | ReactTouchEvent) => {
      isLongPress.current = false
      timerRef.current = setTimeout(() => {
        isLongPress.current = true
        callback(event)
      }, delay)
    },
    [callback, delay]
  )

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const click = useCallback(
    (event: ReactMouseEvent) => {
      if (isLongPress.current) return
      onClick?.(event)
    },
    [onClick]
  )

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: click,
  }
}

export function useDoubleClick(
  callback: (event: ReactMouseEvent) => void,
  delay = 300
): (event: ReactMouseEvent) => void {
  const clickCount = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (event: ReactMouseEvent) => {
      clickCount.current += 1
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (clickCount.current >= 2) callback(event)
        clickCount.current = 0
      }, delay)
    },
    [callback, delay]
  )
}

export interface KeyPressOptions {
  event?: 'keydown' | 'keyup' | 'keypress'
  target?: RefObject<EventTarget | null>
}

export function useKeyPress(
  targetKey: string | string[],
  handler: (event: KeyboardEvent) => void,
  options: KeyPressOptions = {}
): void {
  const { event = 'keydown', target } = options

  useEffect(() => {
    const el = target?.current ?? (isBrowser ? window : null)
    if (!el) return

    function onKey(e: Event) {
      const ke = e as KeyboardEvent
      const keys = Array.isArray(targetKey) ? targetKey : [targetKey]
      if (keys.includes(ke.key)) handler(ke)
    }

    el.addEventListener(event, onKey)
    return () => el.removeEventListener(event, onKey)
  }, [targetKey, handler, event, target])
}

export interface HotkeysOptions {
  enabled?: boolean
  preventDefault?: boolean
  target?: RefObject<EventTarget | null>
}

export function useHotkeys(
  hotkeys: HotkeyMap,
  handler?: (combo: string, event: KeyboardEvent) => void,
  options: HotkeysOptions = {}
): void {
  const { enabled = true, preventDefault = true, target } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    const el = target?.current ?? (isBrowser ? window : null)
    if (!el) return

    const bindings = Object.entries(hotkeys).map(([combo, fn]) => ({
      ...parseHotkey(combo),
      fn,
    }))

    function onKeyDown(event: Event) {
      const ke = event as KeyboardEvent
      for (const binding of bindings) {
        const keyMatch = ke.key.toLowerCase() === binding.key
        const ctrlMatch = binding.ctrl ? ke.ctrlKey : !ke.ctrlKey
        const shiftMatch = binding.shift ? ke.shiftKey : !ke.shiftKey
        const altMatch = binding.alt ? ke.altKey : !ke.altKey
        const metaMatch = binding.meta ? ke.metaKey : !ke.metaKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (preventDefault) ke.preventDefault()
          binding.fn(ke)
          handlerRef.current?.(comboFromBinding(binding), ke)
          break
        }
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [enabled, preventDefault, hotkeys, target])
}

// ─── Scroll hooks ────────────────────────────────────────────────

export interface ScrollPosition {
  x: number
  y: number
}

export function useScrollPosition(throttleMs = 100): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>(() => ({
    x: isBrowser ? window.scrollX : 0,
    y: isBrowser ? window.scrollY : 0,
  }))

  useEffect(() => {
    if (!isBrowser) return

    const onScroll = createRafThrottle(() => {
      setPosition({ x: window.scrollX, y: window.scrollY })
    }, throttleMs)

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [throttleMs])

  return position
}

export function useScrollLock(locked = false): void {
  useIsomorphicLayoutEffect(() => {
    if (!isBrowser || !locked) return

    const { overflow, paddingRight } = document.body.style
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [locked])
}

export interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions
}

export interface ElementSize {
  width: number
  height: number
}

export function useResizeObserver(
  options: ResizeObserverOptions = {}
): [MutableRefObject<HTMLElement | null>, ElementSize] {
  const { box = 'content-box' } = options
  const ref = useRef<HTMLElement | null>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node || !isBrowser || !window.ResizeObserver) return

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry?.contentRect
      if (rect) setSize({ width: rect.width, height: rect.height })
    })

    observer.observe(node, { box })
    return () => observer.disconnect()
  }, [box])

  return [ref, size]
}

export function useElementSize(): [MutableRefObject<HTMLElement | null>, ElementSize] {
  return useResizeObserver()
}

export interface IntersectionObserverHookOptions {
  threshold?: number | number[]
  root?: Element | Document | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver(
  options: IntersectionObserverHookOptions = {}
): [MutableRefObject<HTMLElement | null>, IntersectionObserverEntry | null, boolean] {
  const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options
  const ref = useRef<HTMLElement | null>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || !isBrowser || !window.IntersectionObserver) return
    if (freezeOnceVisible && entry?.isIntersecting) return

    const observer = new IntersectionObserver(([observedEntry]) => {
      if (observedEntry) setEntry(observedEntry)
    }, {
      threshold,
      root,
      rootMargin,
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, root, rootMargin, freezeOnceVisible, entry?.isIntersecting])

  return [ref, entry, Boolean(entry?.isIntersecting)]
}

export interface InfiniteScrollOptions {
  hasMore?: boolean
  threshold?: number
  disabled?: boolean
}

export function useInfiniteScroll(
  loadMore: () => void | Promise<void>,
  options: InfiniteScrollOptions = {}
): MutableRefObject<HTMLElement | null> {
  const { hasMore = true, threshold = 0.5, disabled = false } = options
  const [loaderRef, , isVisible] = useIntersectionObserver({ threshold })
  const loadingRef = useRef(false)

  useEffect(() => {
    if (disabled || !hasMore || !isVisible || loadingRef.current) return

    loadingRef.current = true
    Promise.resolve(loadMore()).finally(() => {
      loadingRef.current = false
    })
  }, [isVisible, hasMore, disabled, loadMore])

  return loaderRef
}

// ─── API hooks ────────────────────────────────────────────────

export interface FetchState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export function useFetch<T = unknown>(
  url: string | null | undefined,
  options?: RequestInit
): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(Boolean(url))

  useEffect(() => {
    if (!url) {
      setLoading(false)
      return
    }

    let active = true
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    fetch(url, { ...options, signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<T>
      })
      .then((json) => {
        if (active) setData(json)
      })
      .catch((err: Error) => {
        if (active && err.name !== 'AbortError') setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [url])

  return { data, error, loading }
}

export function useAxios<T = unknown>(
  axiosInstance: AxiosInstance | null | undefined,
  config: AxiosRequestConfig | null | undefined,
  deps: DependencyList = []
): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(Boolean(config))

  useEffect(() => {
    if (!config || !axiosInstance) {
      setLoading(false)
      return
    }

    let active = true
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    axiosInstance({ ...config, signal: controller.signal })
      .then((res) => {
        if (active) setData(res.data as T)
      })
      .catch((err: Error & { name?: string }) => {
        if (active && err.name !== 'CanceledError') setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, deps)

  return { data, error, loading }
}

export interface AsyncOptions<TArgs extends unknown[]> {
  immediate?: boolean
  immediateArgs?: TArgs
}

export interface AsyncState<T, TArgs extends unknown[]> {
  data: T | null
  error: unknown
  loading: boolean
  execute: (...args: TArgs) => Promise<T>
  setData: Dispatch<SetStateAction<T | null>>
}

export function useAsync<T, TArgs extends unknown[] = []>(
  asyncFn: (...args: TArgs) => Promise<T>,
  options: AsyncOptions<TArgs> = {}
): AsyncState<T, TArgs> {
  const { immediate = false, immediateArgs = [] as unknown as TArgs } = options
  const fnRef = useRef(asyncFn)
  fnRef.current = asyncFn

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(immediate)

  const execute = useCallback(async (...args: TArgs) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!immediate) return
    execute(...immediateArgs)
  }, [immediate, execute])

  return { data, error, loading, execute, setData }
}

export interface RetryOptions<TArgs extends unknown[]> {
  retries?: number
  delay?: number
  immediate?: boolean
  immediateArgs?: TArgs
}

export interface RetryState<T, TArgs extends unknown[]> {
  data: T | null
  error: unknown
  loading: boolean
  attempt: number
  execute: (...args: TArgs) => Promise<T | undefined>
  setData: Dispatch<SetStateAction<T | null>>
}

export function useRetry<T, TArgs extends unknown[] = []>(
  asyncFn: (...args: TArgs) => Promise<T>,
  options: RetryOptions<TArgs> = {}
): RetryState<T, TArgs> {
  const { retries = 3, delay = 1000, immediate = false, immediateArgs = [] as unknown as TArgs } = options
  const fnRef = useRef(asyncFn)
  fnRef.current = asyncFn

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const execute = useCallback(
    async (...args: TArgs) => {
      setLoading(true)
      setError(null)

      for (let i = 0; i <= retries; i++) {
        setAttempt(i + 1)
        try {
          const result = await fnRef.current(...args)
          setData(result)
          setLoading(false)
          return result
        } catch (err) {
          if (i === retries) {
            setError(err)
            setLoading(false)
            throw err
          }
          await sleep(delay * (i + 1))
        }
      }
    },
    [retries, delay]
  )

  useEffect(() => {
    if (!immediate) return
    execute(...immediateArgs)
  }, [immediate, execute])

  return { data, error, loading, attempt, execute, setData }
}

export interface CacheOptions {
  ttl?: number
  enabled?: boolean
}

export interface CacheState<T> {
  data: T | null
  error: unknown
  loading: boolean
  refresh: () => Promise<T>
  invalidate: () => void
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T> | T,
  options: CacheOptions = {}
): CacheState<T> {
  const { ttl = 60_000, enabled = true } = options
  const [data, setData] = useState<T | null>(() => readCache<T>(key, ttl))
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(enabled && readCache<T>(key, ttl) == null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      writeCache(key, result)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [key, fetcher])

  useEffect(() => {
    if (!enabled) return

    const cached = readCache<T>(key, ttl)
    if (cached != null) {
      setData(cached)
      setLoading(false)
      return
    }

    refresh()
  }, [key, ttl, enabled, refresh])

  const invalidate = useCallback(() => {
    invalidateCache(key)
    setData(null)
  }, [key])

  return { data, error, loading, refresh, invalidate }
}

export interface SWROptions {
  ttl?: number
  revalidateOnFocus?: boolean
  enabled?: boolean
}

export interface SWRState<T> {
  data: T | null
  error: unknown
  loading: boolean
  isValidating: boolean
  mutate: (nextData?: T, shouldRevalidate?: boolean) => Promise<T | void | undefined>
  revalidate: () => Promise<T | void | undefined>
}

export function useSWR<T>(
  key: string | unknown[],
  fetcher: () => Promise<T> | T,
  options: SWROptions = {}
): SWRState<T> {
  const { ttl = 60_000, revalidateOnFocus = true, enabled = true } = options
  const cacheKey = typeof key === 'string' ? key : JSON.stringify(key)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const cached = readCache<T>(cacheKey, ttl)
  const [data, setData] = useState<T | null>(cached)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(enabled && cached == null)
  const [isValidating, setIsValidating] = useState(false)

  const revalidate = useCallback(async () => {
    if (!enabled || !fetcherRef.current) return
    setIsValidating(true)
    setError(null)
    try {
      const result = await cachedFetch(cacheKey, () => fetcherRef.current(), ttl)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
      setIsValidating(false)
    }
  }, [cacheKey, enabled, ttl])

  const mutate = useCallback(
    async (nextData?: T, shouldRevalidate = true) => {
      if (typeof nextData !== 'undefined') {
        writeCache(cacheKey, nextData)
        setData(nextData)
      }
      if (shouldRevalidate) return revalidate()
    },
    [cacheKey, revalidate]
  )

  useEffect(() => {
    if (!enabled) return
    revalidate()
  }, [cacheKey, enabled, revalidate])

  useEffect(() => {
    if (!revalidateOnFocus || !enabled || !isBrowser) return

    function onFocus() {
      if (document.visibilityState === 'visible') revalidate()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [revalidateOnFocus, enabled, revalidate])

  return { data, error, loading, isValidating, mutate, revalidate }
}

export interface PollingOptions {
  enabled?: boolean
  immediate?: boolean
}

export interface PollingState<T> {
  data: T | null
  error: unknown
  loading: boolean
  refresh: () => Promise<T | void>
}

export function usePolling<T>(
  fetcher: () => Promise<T> | T,
  interval = 5000,
  options: PollingOptions = {}
): PollingState<T> {
  const { enabled = true, immediate = true } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(immediate)

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcher()
      setData(result)
      setError(null)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    if (!enabled) return
    if (immediate) fetchData()
    const id = setInterval(fetchData, interval)
    return () => clearInterval(id)
  }, [enabled, immediate, interval, fetchData])

  return { data, error, loading, refresh: fetchData }
}

export interface WebSocketOptions {
  protocols?: string | string[]
  reconnect?: boolean
  reconnectInterval?: number
  onOpen?: (event: Event) => void
  onMessage?: (data: unknown, event: MessageEvent) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
}

export interface WebSocketState {
  lastMessage: unknown
  readyState: number
  send: (data: unknown) => void
  close: () => void
  isOpen: boolean
}

export function useWebSocket(url: string | null | undefined, options: WebSocketOptions = {}): WebSocketState {
  const {
    protocols,
    reconnect = true,
    reconnectInterval = 3000,
    onOpen,
    onMessage,
    onClose,
    onError,
  } = options

  const [lastMessage, setLastMessage] = useState<unknown>(null)
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef(reconnect)

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }, [])

  const close = useCallback(() => {
    reconnectRef.current = false
    wsRef.current?.close()
  }, [])

  useEffect(() => {
    if (!url || !isBrowser) return

    reconnectRef.current = reconnect

    function connect() {
      const ws = new WebSocket(url!, protocols)
      wsRef.current = ws

      ws.onopen = (event) => {
        setReadyState(WebSocket.OPEN)
        onOpen?.(event)
      }

      ws.onmessage = (event) => {
        let parsed: unknown = event.data
        try {
          parsed = JSON.parse(event.data as string)
        } catch {
          // keep raw string
        }
        setLastMessage(parsed)
        onMessage?.(parsed, event)
      }

      ws.onclose = (event) => {
        setReadyState(WebSocket.CLOSED)
        onClose?.(event)
        if (reconnectRef.current) {
          setTimeout(connect, reconnectInterval)
        }
      }

      ws.onerror = (event) => {
        onError?.(event)
        ws.close()
      }

      setReadyState(WebSocket.CONNECTING)
    }

    connect()

    return () => {
      reconnectRef.current = false
      wsRef.current?.close()
    }
  }, [url, protocols, reconnect, reconnectInterval, onOpen, onMessage, onClose, onError])

  return {
    lastMessage,
    readyState,
    send,
    close,
    isOpen: readyState === WebSocket.OPEN,
  }
}

export interface PaginationOptions {
  initialPage?: number
  pageSize?: number
}

export interface PaginationState {
  page: number
  pageSize: number
  totalPages: number
  startIndex: number
  endIndex: number
  hasNext: boolean
  hasPrev: boolean
  nextPage: () => void
  prevPage: () => void
  goToPage: (p: number) => void
  setPage: Dispatch<SetStateAction<number>>
  setPageSize: Dispatch<SetStateAction<number>>
}

export function usePagination(totalItems: number, options: PaginationOptions = {}): PaginationState {
  const { initialPage = 1, pageSize: initialPageSize = 10 } = options
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const clampedPage = Math.min(Math.max(page, 1), totalPages)

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage)
  }, [page, clampedPage])

  const pagination = useMemo(() => {
    const startIndex = (clampedPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      page: clampedPage,
      pageSize,
      totalPages,
      startIndex,
      endIndex,
      hasNext: clampedPage < totalPages,
      hasPrev: clampedPage > 1,
    }
  }, [totalItems, clampedPage, pageSize, totalPages])

  const nextPage = useCallback(
    () => setPage((p) => Math.min(p + 1, totalPages)),
    [totalPages]
  )
  const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 1)), [])
  const goToPage = useCallback(
    (p: number) => setPage(Math.min(Math.max(p, 1), totalPages)),
    [totalPages]
  )

  return {
    ...pagination,
    nextPage,
    prevPage,
    goToPage,
    setPage,
    setPageSize,
  }
}

export interface SearchOptions<T> {
  keys?: (keyof T & string)[]
  debounceMs?: number
  caseSensitive?: boolean
}

export interface SearchState<T> {
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  results: T[]
  isSearching: boolean
}

export function useSearch<T extends Record<string, unknown>>(
  items: T[],
  options: SearchOptions<T> = {}
): SearchState<T> {
  const { keys = [], debounceMs = 300, caseSensitive = false } = options
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, debounceMs)

  const results = useMemo(() => {
    if (!debouncedQuery) return items
    const q = caseSensitive ? debouncedQuery : debouncedQuery.toLowerCase()

    return items.filter((item) => {
      const fields = keys.length ? keys.map((k) => item[k]) : [item as unknown]
      return fields.some((field) => {
        if (field == null) return false
        const value = caseSensitive ? String(field) : String(field).toLowerCase()
        return value.includes(q)
      })
    })
  }, [items, debouncedQuery, keys, caseSensitive])

  return { query, setQuery, results, isSearching: query !== debouncedQuery }
}

// ─── Form hooks ────────────────────────────────────────────────

export interface FormOptions<T extends Record<string, unknown>> {
  validate?: (values: T) => Record<string, string> | void
  onSubmit?: (values: T) => void | Promise<void>
}

export interface FormState<T extends Record<string, unknown>> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  submitting: boolean
  setValues: Dispatch<SetStateAction<T>>
  setFieldValue: (name: keyof T & string, value: unknown) => void
  setErrors: Dispatch<SetStateAction<Record<string, string>>>
  handleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSubmit: (event?: FormEvent) => void
  reset: () => void
  validate: () => Record<string, string>
}

export function useForm<T extends Record<string, unknown>>(
  initialValues: T = {} as T,
  options: FormOptions<T> = {}
): FormState<T> {
  const { validate, onSubmit } = options
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = event.target
      const checked = 'checked' in event.target ? event.target.checked : false
      setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    },
    []
  )

  const setFieldValue = useCallback((name: keyof T & string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = event.target
      setTouched((prev) => ({ ...prev, [name]: true }))
    },
    []
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const runValidation = useCallback(() => {
    const nextErrors = validate ? validate(values) ?? {} : {}
    setErrors(nextErrors)
    return nextErrors
  }, [validate, values])

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault?.()
      const nextErrors = runValidation()
      if (Object.keys(nextErrors).length > 0) return

      setSubmitting(true)
      try {
        await onSubmit?.(values)
      } finally {
        setSubmitting(false)
      }
    },
    [onSubmit, runValidation, values]
  )

  return {
    values,
    errors,
    touched,
    submitting,
    setValues,
    setFieldValue,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate: runValidation,
  }
}

export interface ValidationResult {
  errors: Record<string, string>
  isValid: boolean
}

export function useValidation<T extends Record<string, unknown>>(
  values: T,
  rules: ValidationRules<T> = {}
): ValidationResult {
  const errors = useMemo(() => {
    const next: Record<string, string> = {}
    Object.keys(rules).forEach((field) => {
      const rule = rules[field]
      const message = typeof rule === 'function' ? rule(values[field], values) : undefined
      if (message) next[field] = message
    })
    return next
  }, [values, rules])

  const isValid = Object.keys(errors).length === 0

  return { errors, isValid }
}

export interface FormApi<T extends Record<string, unknown>> {
  values: T
  setFieldValue: (name: keyof T & string, value: unknown) => void
}

export interface FieldArrayState<T> {
  fields: T[]
  append: (value: T) => void
  prepend: (value: T) => void
  remove: (index: number) => void
  update: (index: number, value: T) => void
  insert: (index: number, value: T) => void
  replace: (nextFields: T[]) => void
}

export function useFieldArray<T, TForm extends Record<string, unknown>>(
  name: keyof TForm & string,
  form: FormApi<TForm>
): FieldArrayState<T> {
  const fields = useMemo(() => (form.values[name] as T[] | undefined) ?? [], [form.values, name])

  const append = useCallback(
    (value: T) => {
      form.setFieldValue(name, [...fields, value])
    },
    [form, name, fields]
  )

  const prepend = useCallback(
    (value: T) => {
      form.setFieldValue(name, [value, ...fields])
    },
    [form, name, fields]
  )

  const remove = useCallback(
    (index: number) => {
      form.setFieldValue(
        name,
        fields.filter((_, i) => i !== index)
      )
    },
    [form, name, fields]
  )

  const update = useCallback(
    (index: number, value: T) => {
      form.setFieldValue(
        name,
        fields.map((item, i) => (i === index ? value : item))
      )
    },
    [form, name, fields]
  )

  const insert = useCallback(
    (index: number, value: T) => {
      form.setFieldValue(name, [...fields.slice(0, index), value, ...fields.slice(index)])
    },
    [form, name, fields]
  )

  const replace = useCallback(
    (nextFields: T[]) => {
      form.setFieldValue(name, nextFields)
    },
    [form, name]
  )

  return { fields, append, prepend, remove, update, insert, replace }
}

// ─── Auth / Utils hooks ────────────────────────────────────────────────

export interface AuthOptions {
  tokenKey?: string
  userKey?: string
  parseUser?: (raw: string | null) => AuthUser | null
  serializeUser?: (user: AuthUser) => string
}

export interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setToken: (nextToken: string | null) => void
  setUser: (nextUser: AuthUser | null) => void
  login: (payload: { token: string; user: AuthUser }) => void
  logout: () => void
}

export function useAuth(options: AuthOptions = {}): AuthState {
  const {
    tokenKey = 'token',
    userKey = 'user',
    parseUser = (raw) => (raw ? (JSON.parse(raw) as AuthUser) : null),
    serializeUser = (user) => JSON.stringify(user),
  } = options

  const [token, setTokenState] = useState<string | null>(() =>
    isBrowser ? localStorage.getItem(tokenKey) : null
  )
  const [user, setUserState] = useState<AuthUser | null>(() => {
    if (!isBrowser) return null
    try {
      return parseUser(localStorage.getItem(userKey))
    } catch {
      return null
    }
  })

  const setToken = useCallback(
    (nextToken: string | null) => {
      if (isBrowser) {
        if (nextToken) localStorage.setItem(tokenKey, nextToken)
        else localStorage.removeItem(tokenKey)
      }
      setTokenState(nextToken)
    },
    [tokenKey]
  )

  const setUser = useCallback(
    (nextUser: AuthUser | null) => {
      if (isBrowser) {
        if (nextUser) localStorage.setItem(userKey, serializeUser(nextUser))
        else localStorage.removeItem(userKey)
      }
      setUserState(nextUser)
    },
    [userKey, serializeUser]
  )

  const login = useCallback(
    ({ token: nextToken, user: nextUser }: { token: string; user: AuthUser }) => {
      setToken(nextToken)
      setUser(nextUser)
    },
    [setToken, setUser]
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [setToken, setUser])

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    setToken,
    setUser,
    login,
    logout,
  }
}

export interface PermissionState {
  hasRole: (role: string) => boolean
  can: (permission: string) => boolean
  canAll: (permissions: string[]) => boolean
  canAny: (permissions: string[]) => boolean
}

export function usePermission(
  user: AuthUser | null,
  rolePermissions: Record<string, string[]> = {}
): PermissionState {
  const hasRole = useCallback(
    (role: string) => {
      if (!user) return false
      if (Array.isArray(user.roles)) return user.roles.includes(role)
      return user.role === role
    },
    [user]
  )

  const can = useCallback(
    (permission: string) => {
      if (!user) return false
      if (Array.isArray(user.permissions)) return user.permissions.includes(permission)

      const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean) as string[]
      return roles.some((role) => rolePermissions[role]?.includes(permission))
    },
    [user, rolePermissions]
  )

  const canAll = useCallback(
    (permissions: string[]) => permissions.every((p) => can(p)),
    [can]
  )

  const canAny = useCallback(
    (permissions: string[]) => permissions.some((p) => can(p)),
    [can]
  )

  return { hasRole, can, canAll, canAny }
}

export interface LoggerOptions {
  enabled?: boolean
}

export interface Logger {
  log: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
}

export function useLogger(namespace = 'app', options: LoggerOptions = {}): Logger {
  const { enabled = import.meta.env?.DEV ?? true } = options

  return useMemo(() => {
    const prefix = `[${namespace}]`
    const log = (...args: unknown[]) => enabled && console.log(prefix, ...args)
    const warn = (...args: unknown[]) => enabled && console.warn(prefix, ...args)
    const error = (...args: unknown[]) => enabled && console.error(prefix, ...args)
    const info = (...args: unknown[]) => enabled && console.info(prefix, ...args)
    return { log, warn, error, info }
  }, [namespace, enabled])
}

// ─── CRUD factory ────────────────────────────────────────────────

export interface ResourceHooks<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  useList: () => ResourceListState<T, UpdateDto>
  useItem: (id: EntityId | undefined) => ResourceItemState<T>
  useForm: (id?: EntityId) => ResourceFormState<CreateDto | UpdateDto>
}

export interface ResourceListState<T, UpdateDto = Partial<T>> {
  items: T[]
  loading: boolean
  deleting: boolean
  selected: T | null
  deleteOpen: boolean
  setDeleteOpen: Dispatch<SetStateAction<boolean>>
  openDelete: (item: T) => void
  confirmDelete: () => Promise<void>
  reload: () => Promise<T[] | undefined>
  allItems: T[]
  processedItems: T[]
  refreshing: boolean
  refresh: () => Promise<T[] | undefined>
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  sort: SortState
  setSort: Dispatch<SetStateAction<SortState>>
  filters: Record<string, unknown>
  setFilters: Dispatch<SetStateAction<Record<string, unknown>>>
  pagination: Omit<PaginationState, 'nextPage' | 'prevPage' | 'goToPage' | 'setPage' | 'setPageSize'> | null
  selectedIds: EntityId[]
  toggleSelect: (id: EntityId) => void
  selectAll: () => void
  clearSelection: () => void
  bulkDelete: (ids?: EntityId[]) => Promise<void>
  bulkUpdate: (patch: UpdateDto, ids?: EntityId[]) => Promise<void>
  bulkLoading: boolean
}

export interface ResourceItemState<T> {
  item: T | null
  loading: boolean
  deleting: boolean
  deleteOpen: boolean
  setDeleteOpen: Dispatch<SetStateAction<boolean>>
  confirmDelete: () => Promise<void>
  refresh: () => Promise<T | undefined>
}

export interface ResourceFormState<TDto> {
  isEdit: boolean
  initialValues: Record<string, unknown> | null
  loading: boolean
  submitting: boolean
  submit: (values: TDto) => Promise<void>
  cancel: () => void
}

/**
 * createResourceHooks(service, config) → { useList, useItem, useForm }
 * Feature folders (hooks/product, hooks/user) call this with project config.
 */
export function createResourceHooks<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
>(
  service: IResourceService<T, CreateDto, UpdateDto>,
  config: ResourceHooksConfig<T> = {}
): ResourceHooks<T, CreateDto, UpdateDto> {
  const {
    resourceName = 'Item',
    listPath = '/',
    useNavigate: useNavigateHook,
    notify,
    mapToForm = (data: T) => data as unknown as Record<string, unknown>,
    getId = (item: T) => (item as { id?: EntityId }).id as EntityId,
    messages = {},
    searchKeys = [],
    filterFn,
    defaultSort = { key: null, order: 'asc' as SortOrder },
    pageSize: defaultPageSize = 10,
    enablePagination = false,
    enableOptimistic = false,
    cacheTtl = 0,
    cacheKey,
    retryCount = 0,
    retryDelay = 1000,
  } = config

  const label = resourceName
  const labelLower = resourceName.toLowerCase()
  const resolvedCacheKey = cacheKey ?? `resource:${labelLower}:list`

  const msg = {
    loadError: messages.loadError ?? `Failed to load ${labelLower}s`,
    notFound: messages.notFound ?? `${label} not found`,
    deleted: messages.deleted ?? `${label} deleted`,
    deleteError: messages.deleteError ?? `Failed to delete ${labelLower}`,
    created: messages.created ?? `${label} created`,
    updated: messages.updated ?? `${label} updated`,
    createError: messages.createError ?? `Failed to create ${labelLower}`,
    updateError: messages.updateError ?? `Failed to update ${labelLower}`,
    bulkDeleted: messages.bulkDeleted ?? `${label}s deleted`,
    bulkUpdated: messages.bulkUpdated ?? `${label}s updated`,
    bulkDeleteError: messages.bulkDeleteError ?? `Failed to delete ${labelLower}s`,
    bulkUpdateError: messages.bulkUpdateError ?? `Failed to update ${labelLower}s`,
  }

  function useNoopNav(): NavigateFunction | undefined {
    return undefined
  }

  const useNavHook = useNavigateHook ?? useNoopNav

  function useNav(): NavigateFunction | undefined {
    return useNavHook()
  }

  function useList(): ResourceListState<T, UpdateDto> {
    const [allItems, setAllItems] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [bulkLoading, setBulkLoading] = useState(false)
    const [selected, setSelected] = useState<T | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<EntityId[]>([])

    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebounce(searchQuery, 300)
    const [sort, setSort] = useState<SortState>(defaultSort)
    const [filters, setFilters] = useState<Record<string, unknown>>({})

    const fetchList = useCallback(
      async (options: { silent?: boolean } = {}) => {
        const { silent = false } = options

        if (cacheTtl > 0) {
          const cached = readCache<T[]>(resolvedCacheKey, cacheTtl)
          if (cached) {
            setAllItems(cached)
            setLoading(false)
            if (!silent) return cached
          }
        }

        if (silent) setRefreshing(true)
        else setLoading(true)

        let lastError: unknown = null

        for (let attempt = 0; attempt <= retryCount; attempt++) {
          try {
            const data = unwrap(await service.all())
            const list = Array.isArray(data) ? data : (data as { data?: T[] })?.data ?? []
            setAllItems(list)
            if (cacheTtl > 0) writeCache(resolvedCacheKey, list)
            return list
          } catch (err) {
            lastError = err
            if (attempt < retryCount) await sleep(retryDelay * (attempt + 1))
          } finally {
            if (silent) setRefreshing(false)
            else setLoading(false)
          }
        }

        fail(notify, msg.loadError)
        throw lastError
      },
      []
    )

    const load = useCallback(() => fetchList(), [fetchList])
    const refresh = useCallback(() => {
      invalidateCache(resolvedCacheKey)
      return fetchList({ silent: true })
    }, [fetchList])

    useEffect(() => {
      load()
    }, [load])

    const processedItems = useMemo(() => {
      let result = allItems
      result = applySearch(result, debouncedSearch, searchKeys, false)
      if (filterFn) result = result.filter((item) => filterFn(item, filters))
      result = applySort(result, sort.key as keyof T & string | null, sort.order)
      return result
    }, [allItems, debouncedSearch, filters, sort])

    const pagination = usePagination(processedItems.length, {
      pageSize: defaultPageSize,
    })

    const items = useMemo(() => {
      if (!enablePagination) return processedItems
      return processedItems.slice(pagination.startIndex, pagination.endIndex)
    }, [processedItems, enablePagination, pagination.startIndex, pagination.endIndex])

    function openDelete(item: T) {
      setSelected(item)
      setDeleteOpen(true)
    }

    async function confirmDelete() {
      if (!selected) return
      setDeleting(true)

      const previous = allItems
      if (enableOptimistic) {
        setAllItems((list) => list.filter((item) => getId(item) !== getId(selected)))
      }

      try {
        await service.delete(getId(selected))
        ok(notify, msg.deleted)
        setDeleteOpen(false)
        setSelected(null)
        invalidateCache(resolvedCacheKey)
        if (!enableOptimistic) await load()
        else if (cacheTtl > 0)
          writeCache(
            resolvedCacheKey,
            previous.filter((i) => getId(i) !== getId(selected))
          )
      } catch {
        if (enableOptimistic) setAllItems(previous)
        fail(notify, msg.deleteError)
      } finally {
        setDeleting(false)
      }
    }

    function toggleSelect(id: EntityId) {
      setSelectedIds((ids) =>
        ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
      )
    }

    function selectAll() {
      setSelectedIds(items.map(getId))
    }

    function clearSelection() {
      setSelectedIds([])
    }

    async function bulkDelete(ids: EntityId[] = selectedIds) {
      if (!ids.length) return
      setBulkLoading(true)

      const previous = allItems
      if (enableOptimistic) {
        setAllItems((list) => list.filter((item) => !ids.includes(getId(item))))
      }

      try {
        await Promise.all(ids.map((id) => service.delete(id)))
        ok(notify, msg.bulkDeleted)
        clearSelection()
        invalidateCache(resolvedCacheKey)
        if (!enableOptimistic) await load()
      } catch {
        if (enableOptimistic) setAllItems(previous)
        fail(notify, msg.bulkDeleteError)
      } finally {
        setBulkLoading(false)
      }
    }

    async function bulkUpdate(patch: UpdateDto, ids: EntityId[] = selectedIds) {
      if (!ids.length) return
      setBulkLoading(true)

      const previous = allItems
      if (enableOptimistic) {
        setAllItems((list) =>
          list.map((item) => (ids.includes(getId(item)) ? { ...item, ...patch } : item))
        )
      }

      try {
        await Promise.all(ids.map((id) => service.update(id, patch)))
        ok(notify, msg.bulkUpdated)
        clearSelection()
        invalidateCache(resolvedCacheKey)
        if (!enableOptimistic) await load()
      } catch {
        if (enableOptimistic) setAllItems(previous)
        fail(notify, msg.bulkUpdateError)
      } finally {
        setBulkLoading(false)
      }
    }

    return {
      items,
      loading,
      deleting,
      selected,
      deleteOpen,
      setDeleteOpen,
      openDelete,
      confirmDelete,
      reload: load,
      allItems,
      processedItems,
      refreshing,
      refresh,
      searchQuery,
      setSearchQuery,
      sort,
      setSort,
      filters,
      setFilters,
      pagination: enablePagination ? pagination : null,
      selectedIds,
      toggleSelect,
      selectAll,
      clearSelection,
      bulkDelete,
      bulkUpdate,
      bulkLoading,
    }
  }

  function useItem(id: EntityId | undefined): ResourceItemState<T> {
    const navigate = useNav()
    const [item, setItem] = useState<T | null>(null)
    const [loading, setLoading] = useState(Boolean(id))
    const [deleting, setDeleting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    const fetchItem = useCallback(
      async (itemId: EntityId, options: { silent?: boolean } = {}) => {
        const { silent = false } = options
        const key = `${resolvedCacheKey}:item:${itemId}`

        if (cacheTtl > 0) {
          const cached = readCache<T>(key, cacheTtl)
          if (cached) {
            setItem(cached)
            setLoading(false)
            return cached
          }
        }

        if (!silent) setLoading(true)

        let lastError: unknown = null
        for (let attempt = 0; attempt <= retryCount; attempt++) {
          try {
            const data = unwrap(await service.find(itemId))
            setItem(data)
            if (cacheTtl > 0) writeCache(key, data)
            return data
          } catch (err) {
            lastError = err
            if (attempt < retryCount) await sleep(retryDelay * (attempt + 1))
          } finally {
            if (!silent) setLoading(false)
          }
        }

        fail(notify, msg.notFound)
        navigate?.(listPath)
        throw lastError
      },
      [navigate]
    )

    useEffect(() => {
      if (!id) return
      let active = true

      ;(async () => {
        try {
          await fetchItem(id)
        } catch {
          if (active) setItem(null)
        }
      })()

      return () => {
        active = false
      }
    }, [id, fetchItem])

    const refresh = useCallback(() => {
      if (!id) return Promise.resolve(undefined)
      invalidateCache(`${resolvedCacheKey}:item:${id}`)
      return fetchItem(id, { silent: true })
    }, [id, fetchItem])

    async function confirmDelete() {
      if (!id) return
      setDeleting(true)
      try {
        await service.delete(id)
        ok(notify, msg.deleted)
        invalidateCache(resolvedCacheKey)
        invalidateCache(`${resolvedCacheKey}:item:${id}`)
        navigate?.(listPath)
      } catch {
        fail(notify, msg.deleteError)
      } finally {
        setDeleting(false)
      }
    }

    return {
      item,
      loading,
      deleting,
      deleteOpen,
      setDeleteOpen,
      confirmDelete,
      refresh,
    }
  }

  function useForm(id?: EntityId): ResourceFormState<CreateDto | UpdateDto> {
    const navigate = useNav()
    const isEdit = Boolean(id)
    const [initialValues, setInitialValues] = useState<Record<string, unknown> | null>(null)
    const [loading, setLoading] = useState(isEdit)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
      if (!isEdit || !id) return

      let active = true
      const key = `${resolvedCacheKey}:item:${id}`

      ;(async () => {
        setLoading(true)
        try {
          let data = cacheTtl > 0 ? readCache<T>(key, cacheTtl) : null
          if (!data) {
            data = unwrap(await service.find(id))
            if (cacheTtl > 0) writeCache(key, data)
          }
          if (!active) return
          setInitialValues(mapToForm(data))
        } catch {
          fail(notify, msg.notFound)
          navigate?.(listPath)
        } finally {
          if (active) setLoading(false)
        }
      })()

      return () => {
        active = false
      }
    }, [id, isEdit, navigate])

    async function submit(values: CreateDto | UpdateDto) {
      setSubmitting(true)
      try {
        if (isEdit && id) {
          await service.update(id, values as UpdateDto)
          ok(notify, msg.updated)
        } else {
          await service.create(values as CreateDto)
          ok(notify, msg.created)
        }
        invalidateCache(resolvedCacheKey)
        if (isEdit && id) invalidateCache(`${resolvedCacheKey}:item:${id}`)
        navigate?.(listPath)
      } catch {
        fail(notify, isEdit ? msg.updateError : msg.createError)
      } finally {
        setSubmitting(false)
      }
    }

    function cancel() {
      navigate?.(listPath)
    }

    return {
      isEdit,
      initialValues,
      loading,
      submitting,
      submit,
      cancel,
    }
  }

  return { useList, useItem, useForm }
}
