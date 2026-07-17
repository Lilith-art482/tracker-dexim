import { useEffect, useRef, useCallback } from 'react';
import type { Emotion } from '../types';
import { playEmotionSound } from '../utils/sounds';

interface RobotAssistantProps {
  emotion: Emotion;
  speechText?: string;
  className?: string;
}

const emotionConfig: Record<Emotion, {
  leftOpen: number; rightOpen: number;
  leftPupilX: number; leftPupilY: number;
  rightPupilX: number; rightPupilY: number;
  pupilSize: number; irisColor: string;
  extra: string;
}> = {
  happy: {
    leftOpen: 0.95, rightOpen: 0.95,
    leftPupilX: 0, leftPupilY: -2,
    rightPupilX: 0, rightPupilY: -2,
    pupilSize: 18, irisColor: '#8b7fc7',
    extra: `
      <circle cx="130" cy="125" r="8" fill="#ffb3c6" opacity="0.6" />
      <circle cx="270" cy="125" r="8" fill="#ffb3c6" opacity="0.6" />
      <path d="M 130 118 L 136 112 L 142 118" fill="none" stroke="#fff9f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
      <path d="M 258 118 L 264 112 L 270 118" fill="none" stroke="#fff9f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
      <path d="M 185 170 Q 200 190 215 170" stroke="#ffb3c6" stroke-width="4" fill="none" stroke-linecap="round" />
    `
  },
  sleepy: {
    leftOpen: 0.25, rightOpen: 0.25,
    leftPupilX: 0, leftPupilY: 0,
    rightPupilX: 0, rightPupilY: 0,
    pupilSize: 12, irisColor: '#a89bc9',
    extra: `
      <text x="300" y="100" font-size="18" fill="#c8b0ff" opacity="0.6" font-weight="bold">z</text>
      <text x="315" y="85" font-size="14" fill="#c8b0ff" opacity="0.4" font-weight="bold">Z</text>
      <text x="325" y="72" font-size="10" fill="#c8b0ff" opacity="0.3" font-weight="bold">Z</text>
      <line x1="190" y1="170" x2="210" y2="170" stroke="#b8a8d0" stroke-width="3" stroke-linecap="round" />
    `
  },
  thirsty: {
    leftOpen: 0.9, rightOpen: 0.9,
    leftPupilX: 0, leftPupilY: 4,
    rightPupilX: 0, rightPupilY: 4,
    pupilSize: 16, irisColor: '#b8a0d0',
    extra: `
      <ellipse cx="155" cy="152" rx="4" ry="7" fill="#7ec8e3" opacity="0.8" />
      <ellipse cx="155" cy="150" rx="2" ry="3" fill="white" opacity="0.5" />
      <path d="M 280 120 Q 284 130 280 135 Q 276 130 280 120" fill="#7ec8e3" opacity="0.5" />
      <path d="M 190 175 Q 200 165 210 175" stroke="#b8a8d0" stroke-width="3" fill="none" stroke-linecap="round" />
    `
  },
  inspired: {
    leftOpen: 1.0, rightOpen: 1.0,
    leftPupilX: 0, leftPupilY: -3,
    rightPupilX: 0, rightPupilY: -3,
    pupilSize: 20, irisColor: '#b8a0ff',
    extra: `
      <path d="M 130 112 L 134 106 L 140 110 L 134 114 Z" fill="#fff9f0" opacity="0.9" />
      <path d="M 260 112 L 264 106 L 270 110 L 264 114 Z" fill="#fff9f0" opacity="0.9" />
      <path d="M 195 108 L 200 98 L 205 108 L 215 110 L 207 116 L 210 126 L 200 120 L 190 126 L 193 116 L 185 110 Z" fill="#ffd700" opacity="0.9" />
      <circle cx="200" cy="140" r="30" fill="#c8b0ff" opacity="0.15" />
    `
  },
  neutral: {
    leftOpen: 0.8, rightOpen: 0.8,
    leftPupilX: 0, leftPupilY: 0,
    rightPupilX: 0, rightPupilY: 0,
    pupilSize: 15, irisColor: '#9b8fc0',
    extra: `<circle cx="200" cy="170" r="4" fill="#b8a8d0" />`
  },
  love: {
    leftOpen: 0.9, rightOpen: 0.9,
    leftPupilX: 0, leftPupilY: -2,
    rightPupilX: 0, rightPupilY: -2,
    pupilSize: 16, irisColor: '#ff8da1',
    extra: `
      <path d="M 135 132 A 6 6 0 0 1 147 132 A 6 6 0 0 1 159 132 Q 159 140 147 148 Q 135 140 135 132" fill="#ff4d6d" />
      <path d="M 235 132 A 6 6 0 0 1 247 132 A 6 6 0 0 1 259 132 Q 259 140 247 148 Q 235 140 235 132" fill="#ff4d6d" />
      <text x="80" y="100" font-size="20">❤️</text>
      <text x="310" y="100" font-size="20">❤️</text>
      <path d="M 190 170 Q 200 177 210 170" stroke="#ff8da1" stroke-width="3" fill="none" stroke-linecap="round" />
    `
  },
  thinking: {
    leftOpen: 0.6, rightOpen: 0.6,
    leftPupilX: 4, leftPupilY: -2,
    rightPupilX: -4, rightPupilY: -2,
    pupilSize: 14, irisColor: '#a89bc9',
    extra: `
      <circle cx="190" cy="175" r="3" fill="#b8a8d0" />
      <circle cx="200" cy="175" r="3" fill="#b8a8d0" />
      <circle cx="210" cy="175" r="3" fill="#b8a8d0" />
      <text x="300" y="90" font-size="22" opacity="0.4">⚙️</text>
    `
  }
};

function eyePath(cx: number, cy: number, r: number, open: number) {
  const top = cy - r * open;
  const bottom = cy + r * open;
  return `M ${cx - r} ${top} Q ${cx} ${cy - r * 1.2 * open} ${cx + r} ${top} Q ${cx} ${cy + r * 1.2 * open} ${cx - r} ${bottom} Z`;
}

function drawRobotSVG(emotion: Emotion, blink: boolean): string {
  const em = emotionConfig[emotion];
  const leftOpen = blink ? 0.05 : em.leftOpen;
  const rightOpen = blink ? 0.05 : em.rightOpen;
  const eyeY = 135;
  const lx = 145;
  const rx = 255;

  return `
    <defs>
      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4a4a7a" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#2a2a4e" stop-opacity="0.5" />
      </linearGradient>
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#c8b0ff" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#c8b0ff" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fdf6ef" />
        <stop offset="100%" stop-color="#f5e4d8" />
      </linearGradient>
    </defs>
    <rect x="60" y="40" width="280" height="260" rx="40" fill="url(#bodyGrad)" stroke="#e8d5cc" stroke-width="4" />
    <rect x="68" y="48" width="264" height="244" rx="34" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
    <rect x="80" y="60" width="240" height="200" rx="24" fill="#1a1a2e" />
    <rect x="80" y="60" width="240" height="200" rx="24" fill="url(#screenGrad)" opacity="0.4" />
    <ellipse cx="140" cy="85" rx="60" ry="20" fill="white" opacity="0.08" transform="rotate(-20 140 85)" />
    <ellipse cx="280" cy="230" rx="40" ry="12" fill="white" opacity="0.05" transform="rotate(-25 280 230)" />
    <path d="${eyePath(lx, eyeY, 22, leftOpen)}" fill="#2d2d4e" stroke="#4a4a7a" stroke-width="1.5" />
    <circle cx="${lx + em.leftPupilX}" cy="${eyeY + em.leftPupilY}" r="${em.pupilSize}" fill="${em.irisColor}" opacity="0.9" />
    <circle cx="${lx + em.leftPupilX - 4}" cy="${eyeY + em.leftPupilY - 5}" r="5" fill="white" opacity="0.4" />
    <path d="${eyePath(rx, eyeY, 22, rightOpen)}" fill="#2d2d4e" stroke="#4a4a7a" stroke-width="1.5" />
    <circle cx="${rx + em.rightPupilX}" cy="${eyeY + em.rightPupilY}" r="${em.pupilSize}" fill="${em.irisColor}" opacity="0.9" />
    <circle cx="${rx + em.rightPupilX - 4}" cy="${eyeY + em.rightPupilY - 5}" r="5" fill="white" opacity="0.4" />
    ${em.extra}
    <rect x="160" y="305" width="80" height="12" rx="6" fill="#f5e4d8" stroke="#e8d5cc" stroke-width="2" />
    <rect x="140" y="318" width="120" height="16" rx="8" fill="#f5e4d8" stroke="#e8d5cc" stroke-width="2" />
    <line x1="200" y1="40" x2="200" y2="20" stroke="#d4c4b8" stroke-width="3" stroke-linecap="round" />
    <circle cx="200" cy="18" r="6" fill="#f5c8d0" stroke="#e8b8c0" stroke-width="1.5" />
    <circle cx="200" cy="18" r="2" fill="white" opacity="0.6" />
  `;
}

export default function RobotAssistant({ emotion, speechText, className }: RobotAssistantProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const currentEmotionRef = useRef(emotion);
  const blinkTimeoutRef = useRef<number | undefined>(undefined);

  currentEmotionRef.current = emotion;

  const draw = useCallback((blink = false) => {
    if (!svgRef.current) return;
    svgRef.current.innerHTML = drawRobotSVG(currentEmotionRef.current, blink);
  }, []);

  const doBlink = useCallback(() => {
    draw(true);
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    blinkTimeoutRef.current = window.setTimeout(() => draw(false), 120);
  }, [draw]);

  useEffect(() => {
    draw(false);
    const blinkInterval = setInterval(doBlink, 4000);
    return () => {
      clearInterval(blinkInterval);
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, [draw, doBlink]);

  useEffect(() => {
    draw(false);
    playEmotionSound();
  }, [emotion, draw]);

  return (
    <div className={`robot-assistant ${className || ''}`}>
      <div className="robot-wrapper">
        {speechText && (
          <div className="robot-speech">
            <span className="speech-text">{speechText}</span>
          </div>
        )}
        <div className="robot-card">
          <svg ref={svgRef} className="robot-svg" viewBox="0 0 400 420" />
        </div>
      </div>
    </div>
  );
}
