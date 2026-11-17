import type { SVGProps } from 'react'

// Line icons drawn in the mockups. They take the text color (currentColor),
// so they follow the theme. All are decorative: the button or link next to
// them carries the text for screen readers.

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, viewBox = '0 0 16 16', ...props }: IconProps & { viewBox?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      {...props}
    >
      {children}
    </svg>
  )
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" className="fill-accent" />
      <path d="M8 9h4v10H8zM16 9h4v6h-4z" fill="#fff" />
    </svg>
  )
}

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3v10M3 8h10" />
  </Icon>
)

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </Icon>
)

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Icon>
)

export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 2l1.6 4.4L14 8l-4.4 1.6L8 14l-1.6-4.4L2 8l4.4-1.6z" />
  </Icon>
)

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 8.5l3.2 3.2L13 5" />
  </Icon>
)

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3.5v5.5M8 12v.5" />
  </Icon>
)

export const ExternalIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 3h4v4M13 3L7.5 8.5M12 9.5V13H3V4h3.5" />
  </Icon>
)

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
  </Icon>
)

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.5" />
    <path d="M3 10.5V3h7.5" />
  </Icon>
)

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
  </Icon>
)

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5z" />
  </Icon>
)

export const BoardIcon = (p: IconProps) => (
  <Icon viewBox="0 0 22 22" width={22} height={22} {...p}>
    <rect x="3" y="4" width="4.5" height="14" rx="1" />
    <rect x="8.75" y="4" width="4.5" height="9" rx="1" />
    <rect x="14.5" y="4" width="4.5" height="12" rx="1" />
  </Icon>
)

export const ChartIcon = (p: IconProps) => (
  <Icon viewBox="0 0 22 22" width={22} height={22} {...p}>
    <path d="M4 18V11M9 18V5M14 18v-9M19 18v-5" />
  </Icon>
)

export const CvIcon = (p: IconProps) => (
  <Icon viewBox="0 0 22 22" width={22} height={22} {...p}>
    <path d="M6 3h7l4 4v12H6z" />
    <path d="M9 11h5M9 14.5h5" />
  </Icon>
)

export const UserIcon = (p: IconProps) => (
  <Icon viewBox="0 0 22 22" width={22} height={22} {...p}>
    <circle cx="11" cy="8" r="3.5" />
    <path d="M4 19c1.2-3.6 3.8-5 7-5s5.8 1.4 7 5" />
  </Icon>
)
