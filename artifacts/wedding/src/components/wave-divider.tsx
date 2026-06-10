interface WaveDividerProps {
  className?: string;
}

/** A small hand-drawn ocean-wave line used as a signature section ornament. */
export function WaveDivider({ className = "" }: WaveDividerProps) {
  return (
    <svg
      viewBox="0 0 120 10"
      fill="none"
      aria-hidden="true"
      className={`h-2.5 w-24 ${className}`}
    >
      <path
        d="M1 5 Q 11 -2, 21 5 T 41 5 T 61 5 T 81 5 T 101 5 T 119 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
