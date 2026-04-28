interface Props {
  size?: number;
  className?: string;
}

export function FlowSpringLogo({ size = 96, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FlowSpring logo"
    >
      <defs>
        <linearGradient id="fs-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#43A047" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
      </defs>
      <path
        d="M50 5 C50 5, 15 50, 15 78 C15 99, 31 115, 50 115 C69 115, 85 99, 85 78 C85 50, 50 5, 50 5 Z"
        fill="url(#fs-grad)"
      />
      <path
        d="M35 75 C35 90, 45 100, 55 100"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}