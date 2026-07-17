import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import './LofiPlayer.css';

type SoundId = 'rain' | 'piano' | 'evening' | 'nature' | 'coffee' | 'fire';

interface SoundDef {
  id: SoundId;
  icon: string;
  name: string;
  url: string;
}

const SOUNDS: SoundDef[] = [
  { id: 'rain', icon: '☔', name: 'Дождь', url: 'https://cdn.pixabay.com/download/audio/2025/12/28/audio_738b7c2f2e.mp3?filename=lofi_music_library-lofi-rain-lofi-music-458077.mp3' },
  { id: 'piano', icon: '🎹', name: 'Пианино', url: 'https://cdn.pixabay.com/download/audio/2024/10/20/audio_bc27d37a27.mp3?filename=hauntsync-relaxing-piano-lofi-for-studying-253086.mp3' },
  { id: 'evening', icon: '🌙', name: 'Вечерний', url: 'https://cdn.pixabay.com/download/audio/2024/10/06/audio_d013332329.mp3?filename=lp-studio-music-soft-evening-hues-lo-fi-247667.mp3' },
  { id: 'nature', icon: '🌊', name: 'Природа', url: 'https://cdn.pixabay.com/download/audio/2024/09/30/audio_4283761bfa.mp3?filename=dbsound-morning-nature-sounds-246034.mp3' },
  { id: 'coffee', icon: '☕', name: 'Кофейня', url: 'https://cdn.pixabay.com/download/audio/2026/06/16/audio_912babebe1.mp3?filename=alex-morgan-chillhop-jazz-coffee-shop-552792.mp3' },
  { id: 'fire', icon: '🔥', name: 'Камин', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_2c362dfa75.mp3?filename=freesound_community-aachen_burning-fireplace-crackling-fire-soundswav-14561.mp3' },
];

interface SavedState {
  currentSound: SoundId;
  isPlaying: boolean;
  volume: number;
  isCompact: boolean;
}

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem('lofi_player');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(s: SavedState) {
  try {
    localStorage.setItem('lofi_player', JSON.stringify(s));
  } catch { }
}

export default function LofiPlayer() {
  const [currentSound, setCurrentSound] = useState<SoundId>('rain');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [isCompact, setIsCompact] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback((type: SoundId, vol: number) => {
    stop();
    const sound = SOUNDS.find(s => s.id === type);
    if (!sound) return;
    const audio = new Audio(sound.url);
    audio.volume = vol;
    audio.loop = true;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setCurrentSound(type);
    setIsPlaying(true);
  }, [stop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play(currentSound, volume);
    }
  }, [isPlaying, currentSound, volume, play, stop]);

  const selectSound = useCallback((type: SoundId) => {
    if (isPlaying) {
      play(type, volume);
    } else {
      setCurrentSound(type);
    }
  }, [isPlaying, volume, play]);

  const adjustVolume = useCallback((val: number) => {
    const v = Math.max(0, Math.min(1, val));
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  // Restore saved state on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setIsCompact(saved.isCompact);
      setVolume(saved.volume);
      setCurrentSound(saved.currentSound);
      setAudioReady(true);
      if (saved.isPlaying) {
        setTimeout(() => play(saved.currentSound, saved.volume), 500);
      }
    } else {
      setAudioReady(true);
      setTimeout(() => {
        play('rain', 0.25);
      }, 1500);
    }
    return () => {
      stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist state
  useEffect(() => {
    if (!audioReady) return;
    saveState({ currentSound, isPlaying, volume, isCompact });
  }, [currentSound, isPlaying, volume, isCompact, audioReady]);

  const soundInfo = SOUNDS.find(s => s.id === currentSound)!;

  return (
    <motion.div
      className={`lofi-player ${isCompact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <div className="lofi-header" onClick={() => setIsCompact(c => !c)}>
        <span className="lofi-title">🎵 Lo-Fi атмосфера</span>
        <button className="lofi-header-toggle" onClick={(e) => { e.stopPropagation(); setIsCompact(c => !c); }}>
          {isCompact ? '+' : '−'}
        </button>
      </div>

      {isCompact && (
        <div className="lofi-compact">
          <span className="compact-icon">{soundInfo.icon}</span>
          <span className="compact-name">{soundInfo.name}</span>
          <button className="lofi-play-btn compact" onClick={(e) => { e.stopPropagation(); toggle(); }}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      )}

      <div className="lofi-sound-list">
        {SOUNDS.map(s => (
          <div
            key={s.id}
            className={`lofi-sound-item ${currentSound === s.id ? 'active' : ''}`}
            onClick={() => selectSound(s.id)}
          >
            <motion.span
              className="sound-icon"
              animate={currentSound === s.id && isPlaying ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {s.icon}
            </motion.span>
            <span className="sound-name">{s.name}</span>
            <span className="sound-status">
              {currentSound === s.id && isPlaying ? '●' : currentSound === s.id ? '⏸' : ''}
            </span>
            <button
              className={`lofi-play-btn ${currentSound === s.id && isPlaying ? 'playing' : ''}`}
              onClick={(e) => { e.stopPropagation(); if (currentSound === s.id) toggle(); else play(s.id, volume); }}
            >
              {currentSound === s.id && isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>
        ))}
      </div>

      <div className="lofi-volume-row">
        <label>🔊</label>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={e => adjustVolume(parseInt(e.target.value) / 100)}
          className="lofi-volume-slider"
        />
        <span className="lofi-vol-value">{Math.round(volume * 100)}%</span>
      </div>
    </motion.div>
  );
}
