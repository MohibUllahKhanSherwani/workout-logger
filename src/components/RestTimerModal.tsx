import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRESET_DURATIONS = [
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
];

export const RestTimerModal: React.FC<Props> = ({ visible, onClose }) => {
  const [targetSeconds, setTargetSeconds] = useState<number>(90);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            if (Platform.OS !== 'web') {
              Vibration.vibrate([0, 500, 200, 500]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsRemaining]);

  const selectPreset = (secs: number) => {
    setTargetSeconds(secs);
    setSecondsRemaining(secs);
    setIsRunning(true);
  };

  const toggleRun = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(targetSeconds);
    }
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(targetSeconds);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Rest Timer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Preset Buttons */}
          <View style={styles.presetsRow}>
            {PRESET_DURATIONS.map((preset) => (
              <TouchableOpacity
                key={preset.seconds}
                style={[
                  styles.presetBtn,
                  targetSeconds === preset.seconds && styles.presetBtnActive,
                ]}
                onPress={() => selectPreset(preset.seconds)}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    targetSeconds === preset.seconds && styles.presetBtnTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Big Timer Display */}
          <View style={styles.timerDisplayContainer}>
            <Text style={[styles.timerDigits, secondsRemaining === 0 && styles.timerDone]}>
              {formatTimer(secondsRemaining)}
            </Text>
            <Text style={styles.timerSubtext}>
              {secondsRemaining === 0 ? 'Rest complete! Time to lift!' : isRunning ? 'Resting...' : 'Paused'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={resetTimer}>
              <Ionicons name="refresh" size={22} color="#64748b" />
              <Text style={styles.controlText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainBtn, isRunning && styles.mainBtnPause]}
              onPress={toggleRun}
            >
              <Ionicons
                name={isRunning ? 'pause' : 'play'}
                size={28}
                color="#ffffff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setSecondsRemaining((prev) => prev + 30)}
            >
              <Ionicons name="add" size={22} color="#64748b" />
              <Text style={styles.controlText}>+30s</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  presetBtnActive: {
    backgroundColor: '#0284c7',
  },
  presetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  presetBtnTextActive: {
    color: '#ffffff',
  },
  timerDisplayContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timerDigits: {
    fontSize: 64,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerDone: {
    color: '#22c55e',
  },
  timerSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
  },
  secondaryBtn: {
    alignItems: 'center',
    padding: 10,
  },
  controlText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  mainBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnPause: {
    backgroundColor: '#f59e0b',
  },
});
