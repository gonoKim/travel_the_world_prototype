// components/SvgImageFill.tsx
'use client';
import React, { useId } from 'react';

type Mode = 'pattern' | 'clip' | 'mask';

type Props = {
  mode?: Mode;
  viewBox?: string;
  width?: number | string;
  height?: number | string;
  pathD: string;
  imageUrl: string;
  preserveAspectRatio?: 'none' | 'xMinYMin meet' | 'xMidYMid meet' | 'xMaxYMax meet' | 'xMinYMin slice' | 'xMidYMid slice' | 'xMaxYMax slice';
  stroke?: string;
  strokeWidth?: number;
  background?: string;
  maskFadeRight?: boolean;
};

export default function SvgImageFill({
  mode = 'clip',
  viewBox = '0 0 1000 1000',
  width = '100%',
  height = 'auto',
  pathD,
  imageUrl,
  preserveAspectRatio = 'xMidYMid slice',
  stroke = '#212121',
  strokeWidth = 4,
  background = 'transparent',
  maskFadeRight = true,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const ids = {
    pattern: `pat_${uid}`,
    clip: `clip_${uid}`,
    mask: `mask_${uid}`,
    fade: `fade_${uid}`,
    shape: `shape_${uid}`,
  } as const;
  const [minX, minY, vbW, vbH] = viewBox.split(' ').map(Number) as [number, number, number, number];

  return (
    <svg viewBox={viewBox} width={width} height={height} aria-label="svg-image-fill">
      {background !== 'transparent' && (
        <rect x={minX} y={minY} width={vbW} height={vbH} fill={background} />
      )}

      <defs>
        <path id={ids.shape} d={pathD} />

        {mode === 'pattern' && (
          <pattern id={ids.pattern} patternUnits="objectBoundingBox" width={1} height={1}>
            <image href={imageUrl} width={vbW} height={vbH} preserveAspectRatio={preserveAspectRatio} />
          </pattern>
        )}

        {mode === 'clip' && (
          <clipPath id={ids.clip} clipPathUnits="userSpaceOnUse">
            <use href={`#${ids.shape}`} />
          </clipPath>
        )}

        {mode === 'mask' && (
          <>
            {maskFadeRight && (
              <linearGradient id={ids.fade} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" />
                <stop offset="80%" stopColor="white" />
                <stop offset="100%" stopColor="black" />
              </linearGradient>
            )}
            <mask id={ids.mask}>
              <use href={`#${ids.shape}`} fill="white" />
              {maskFadeRight && (
                <rect x={minX} y={minY} width={vbW} height={vbH} fill={`url(#${ids.fade})`} />
              )}
            </mask>
          </>
        )}
      </defs>

      {mode === 'pattern' && (
        <use href={`#${ids.shape}`} fill={`url(#${ids.pattern})`} stroke={stroke} strokeWidth={strokeWidth} />
      )}

      {mode === 'clip' && (
        <>
          <image
            href={imageUrl}
            x={minX}
            y={minY}
            width={vbW}
            height={vbH}
            preserveAspectRatio={preserveAspectRatio}
            clipPath={`url(#${ids.clip})`}
          />
          <use href={`#${ids.shape}`} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </>
      )}

      {mode === 'mask' && (
        <>
          <image
            href={imageUrl}
            x={minX}
            y={minY}
            width={vbW}
            height={vbH}
            preserveAspectRatio={preserveAspectRatio}
            mask={`url(#${ids.mask})`}
          />
          <use href={`#${ids.shape}`} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </>
      )}
    </svg>
  );
}
