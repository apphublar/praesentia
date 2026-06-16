import Link from "next/link";
import { useId, type CSSProperties } from "react";
import {
  PRAESENTIA_MARK_LOCKUP_VIEWBOX,
  PRAESENTIA_MARK_VIEWBOX,
  praesentiaTapePath,
  resolvePraesentiaMarkColors,
  resolvePraesentiaMarkGeometry,
  type PraesentiaMarkOptions
} from "@/lib/brand/praesentia-mark";

export type PraesentiaLogoProps = {
  href?: string;
  markHeight?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
  withTape?: boolean;
  withShadow?: boolean;
  layout?: "horizontal" | "vertical";
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
  markOptions?: PraesentiaMarkOptions;
  "aria-label"?: string;
};

function PraesentiaMark({
  height = 34,
  withTape = true,
  withShadow = false,
  blurId,
  markOptions,
  crop = "lockup"
}: {
  height?: number;
  withTape?: boolean;
  withShadow?: boolean;
  blurId: string;
  markOptions?: PraesentiaMarkOptions;
  crop?: "full" | "lockup";
}) {
  const isLockup = crop === "lockup";
  const width = isLockup
    ? (height * PRAESENTIA_MARK_LOCKUP_VIEWBOX.width) / PRAESENTIA_MARK_LOCKUP_VIEWBOX.height
    : (height * PRAESENTIA_MARK_VIEWBOX.width) / PRAESENTIA_MARK_VIEWBOX.height;
  const viewBox = isLockup
    ? `${PRAESENTIA_MARK_LOCKUP_VIEWBOX.x} ${PRAESENTIA_MARK_LOCKUP_VIEWBOX.y} ${PRAESENTIA_MARK_LOCKUP_VIEWBOX.width} ${PRAESENTIA_MARK_LOCKUP_VIEWBOX.height}`
    : `0 0 ${PRAESENTIA_MARK_VIEWBOX.width} ${PRAESENTIA_MARK_VIEWBOX.height}`;
  const tilt = markOptions?.tilt ?? -5;
  const geometry = resolvePraesentiaMarkGeometry();
  const colors = resolvePraesentiaMarkColors(markOptions);

  const {
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    frameRadius,
    photoX,
    photoY,
    photoWidth,
    photoHeight,
    letterX,
    letterY,
    rotateX,
    rotateY,
    letterSize
  } = geometry;

  const tapePath = praesentiaTapePath(78, 40);

  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
      className="praesentia-mark"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <filter id={blurId} x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {withShadow && !colors.mono ? (
        <g transform={`rotate(${tilt} ${rotateX} ${rotateY})`}>
          <rect
            x={frameX + 5}
            y={frameY + 8}
            width={frameWidth}
            height={frameHeight}
            rx={frameRadius}
            fill="rgba(60,45,30,0.16)"
            filter={`url(#${blurId})`}
          />
        </g>
      ) : null}

      <g transform={`rotate(${tilt} ${rotateX} ${rotateY})`}>
        {colors.mono ? (
          <rect
            x={frameX}
            y={frameY}
            width={frameWidth}
            height={frameHeight}
            rx={frameRadius}
            fill="none"
            stroke={colors.border}
            strokeWidth={3}
          />
        ) : (
          <rect
            x={frameX}
            y={frameY}
            width={frameWidth}
            height={frameHeight}
            rx={frameRadius}
            fill={colors.frame}
            stroke={colors.border}
            strokeWidth={1.5}
          />
        )}

        <rect
          x={photoX}
          y={photoY}
          width={photoWidth}
          height={photoHeight}
          rx={3}
          fill={colors.photo}
          stroke={colors.photoLine ? colors.frame : undefined}
          strokeWidth={colors.photoLine ? 2 : undefined}
        />

        <text
          x={letterX}
          y={letterY}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight={600}
          fontSize={letterSize}
          fill={colors.letter}
        >
          P
        </text>

        {withTape ? (
          <g transform={`translate(${rotateX - 2} ${frameY - 4}) rotate(8)`}>
            <path d={tapePath} fill={colors.tape} />
            <path d={tapePath} fill="none" stroke={colors.tapeEdge} strokeWidth={1} opacity={0.5} />
          </g>
        ) : null}
      </g>
    </svg>
  );
}

function PraesentiaWordmark({
  size = 18,
  muted = false,
  style
}: {
  size?: number;
  muted?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className="praesentia-wordmark"
      style={{
        fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
        fontStyle: "normal",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        color: muted ? "var(--muted, #8a7c6a)" : "inherit",
        ...style
      }}
    >
      Praesentia
    </span>
  );
}

function PraesentiaLogoContent({
  markHeight = 34,
  showWordmark = true,
  wordmarkSize = 18,
  withTape = true,
  withShadow = false,
  layout = "horizontal",
  muted = false,
  markOptions,
  blurId
}: Omit<PraesentiaLogoProps, "href" | "className" | "style" | "aria-label"> & { blurId: string }) {
  const isVertical = layout === "vertical";

  return (
    <span
      className={`praesentia-logo-lockup${isVertical ? " is-vertical" : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexDirection: isVertical ? "column" : "row"
      }}
    >
      <PraesentiaMark
        height={markHeight}
        withTape={withTape}
        withShadow={withShadow}
        blurId={blurId}
        markOptions={markOptions}
        crop="lockup"
      />
      {showWordmark ? <PraesentiaWordmark size={wordmarkSize} muted={muted} /> : null}
    </span>
  );
}

export function PraesentiaLogo({
  href,
  markHeight = 34,
  showWordmark = true,
  wordmarkSize = 18,
  withTape = true,
  withShadow = false,
  layout = "horizontal",
  muted = false,
  className,
  style,
  markOptions,
  "aria-label": ariaLabel = "Praesentia"
}: PraesentiaLogoProps) {
  const blurId = useId().replace(/:/g, "");
  const content = (
    <PraesentiaLogoContent
      markHeight={markHeight}
      showWordmark={showWordmark}
      wordmarkSize={wordmarkSize}
      withTape={withTape}
      withShadow={withShadow}
      layout={layout}
      muted={muted}
      markOptions={markOptions}
      blurId={blurId}
    />
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel} style={{ textDecoration: "none", color: "inherit", ...style }}>
        {content}
      </Link>
    );
  }

  return (
    <span className={className} aria-label={ariaLabel} style={style}>
      {content}
    </span>
  );
}

export function PraesentiaBrandFooter({
  kicker = "feito com",
  markHeight = 24,
  wordmarkSize = 17
}: {
  kicker?: string;
  markHeight?: number;
  wordmarkSize?: number;
}) {
  return (
    <div style={{ textAlign: "center", color: "var(--faint, #8a7c6a)" }}>
      <div className="mono" style={{ fontSize: 9, marginBottom: 6 }}>
        {kicker}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PraesentiaLogo
          markHeight={markHeight}
          wordmarkSize={wordmarkSize}
          withTape={false}
          withShadow={false}
          muted
        />
      </div>
    </div>
  );
}

export function PraesentiaMarkOnly({
  height = 34,
  withTape = false,
  withShadow = false,
  markOptions,
  className,
  style
}: {
  height?: number;
  withTape?: boolean;
  withShadow?: boolean;
  markOptions?: PraesentiaMarkOptions;
  className?: string;
  style?: CSSProperties;
}) {
  const blurId = useId().replace(/:/g, "");

  return (
    <span className={className} style={style}>
      <PraesentiaMark height={height} withTape={withTape} withShadow={withShadow} blurId={blurId} markOptions={markOptions} crop="full" />
    </span>
  );
}
