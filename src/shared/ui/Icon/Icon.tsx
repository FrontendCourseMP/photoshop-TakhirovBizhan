import type { JSX } from 'react'

export type IconName =
  | 'open'
  | 'save'
  | 'pipette'
  | 'levels'
  | 'resize'
  | 'filters'
  | 'zoomIn'
  | 'zoomOut'
  | 'fit'
  | 'close'
  | 'image'
  | 'alert'
  | 'copy'
  | 'reset'
  | 'check'
  | 'link'

interface IconProps {
  readonly name: IconName
  readonly size?: number
}

// Набор иконок небольшой, поэтому path-данные лежат прямо в модуле:
// это дешевле спрайта и не добавляет отдельный запрос к статике.
const ICON_PATHS: Readonly<Record<IconName, readonly string[]>> = {
  open: ['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'],
  save: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  pipette: [
    'm2 22 1-1h3l9-9',
    'M3 21v-3l9-9',
    'm15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.94 2.94 0 1 1-4.2 4.2L9 8.6a2.94 2.94 0 1 1 4.2-4.2Z',
  ],
  levels: ['M3 21h18', 'M6 21V9', 'M11 21V4', 'M16 21v-8', 'M21 21v-5'],
  resize: [
    'M9 3H5a2 2 0 0 0-2 2v4',
    'M15 3h4a2 2 0 0 1 2 2v4',
    'M9 21H5a2 2 0 0 1-2-2v-4',
    'M15 21h4a2 2 0 0 0 2-2v-4',
    'M12 8v8',
    'M8 12h8',
  ],
  filters: ['M3 3h18v18H3z', 'M9 3v18', 'M15 3v18', 'M3 9h18', 'M3 15h18'],
  zoomIn: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.3-4.3', 'M11 8v6', 'M8 11h6'],
  zoomOut: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.3-4.3', 'M8 11h6'],
  fit: [
    'M8 3H5a2 2 0 0 0-2 2v3',
    'M16 3h3a2 2 0 0 1 2 2v3',
    'M8 21H5a2 2 0 0 1-2-2v-3',
    'M16 21h3a2 2 0 0 0 2-2v-3',
  ],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  image: ['M3 3h18v18H3z', 'M8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'm21 16-5-5L5 21'],
  alert: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z', 'M12 9v4', 'M12 17h.01'],
  copy: [
    'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z',
    'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  ],
  reset: ['M3 12a9 9 0 1 0 2.6-6.4L3 8', 'M3 3v5h5'],
  check: ['M20 6 9 17l-5-5'],
  link: ['M9 15 15 9', 'M10.5 6.5 12 5a4.2 4.2 0 0 1 6 6l-1.5 1.5', 'M13.5 17.5 12 19a4.2 4.2 0 0 1-6-6l1.5-1.5'],
}

export function Icon({ name, size = 16 }: IconProps): JSX.Element {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name].map((path: string) => (
        <path d={path} key={path} />
      ))}
    </svg>
  )
}
