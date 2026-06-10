type WarrenLogoProps = {
  className?: string;
  compact?: boolean;
  variant?: "light" | "dark";
};

export function WarrenLogo({
  className = "",
  compact = false,
  variant = "light",
}: WarrenLogoProps) {
  const foreground = variant === "light" ? "#f7f0e2" : "#17130f";
  const muted = variant === "light" ? "#d7a15b" : "#8f3f21";
  const plate = variant === "light" ? "#17130f" : "#f4efe5";
  const edge = variant === "light" ? "#6f6256" : "#8f8174";

  return (
    <svg
      aria-label="Warren Welding and Generators"
      className={className}
      role="img"
      viewBox="0 0 360 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      {!compact ? (
        <g>
          <path
            d="M12 3h282l13 13v43l-13 13H12L1 61V14L12 3Z"
            fill={plate}
            stroke={edge}
            strokeWidth="2"
          />
          <path
            d="M17 9h272l11 11v35l-11 11H17L8 57V18l9-9Z"
            fill="none"
            stroke={muted}
            strokeWidth="1.5"
          />
          <circle cx="18" cy="20" fill={muted} r="2.5" />
          <circle cx="290" cy="20" fill={muted} r="2.5" />
          <circle cx="18" cy="55" fill={muted} r="2.5" />
          <circle cx="290" cy="55" fill={muted} r="2.5" />
          <text
            fill={foreground}
            fontFamily="Geist, Arial, sans-serif"
            fontSize="43"
            fontWeight="800"
            letterSpacing="5.6"
            textAnchor="middle"
            x="154"
            y="52"
          >
            WARREN
          </text>
          <path
            d="M39 59h230"
            stroke={muted}
            strokeLinecap="square"
            strokeWidth="2"
          />
          <text
            fill={muted}
            fontFamily="Geist Mono, Consolas, monospace"
            fontSize="13"
            fontWeight="700"
            letterSpacing="3.1"
            textAnchor="middle"
            x="154"
            y="91"
          >
            WELDING &amp; GENERATORS
          </text>
        </g>
      ) : (
        <g>
          <path
            d="M12 8h282l13 13v43l-13 13H12L1 66V19L12 8Z"
            fill={plate}
            stroke={edge}
            strokeWidth="2"
          />
          <path
            d="M17 14h272l11 11v35l-11 11H17L8 62V23l9-9Z"
            fill="none"
            stroke={muted}
            strokeWidth="1.5"
          />
          <text
            fill={foreground}
            fontFamily="Geist, Arial, sans-serif"
            fontSize="43"
            fontWeight="800"
            letterSpacing="5.6"
            textAnchor="middle"
            x="154"
            y="57"
          >
            WARREN
          </text>
        </g>
      )}
    </svg>
  );
}
