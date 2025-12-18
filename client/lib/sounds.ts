/**
 * Retro Arcade Sound Effects Utility
 * Uses Web Audio API to generate 8-bit style sounds
 */

/**
 * Play a click/beep sound
 * Used for: Button clicks, form submissions
 */
export const playClick = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Short beep sound
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'square'; // 8-bit sound
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  } catch (e) {
    // Silent fail if sound doesn't work
  }
};

/**
 * Play a success sound
 * Used for: Successful operations, task completion
 */
export const playSuccess = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Success chime (two notes)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Silent fail
  }
};

/**
 * Play an error sound
 * Used for: Errors, rejections, warnings
 */
export const playError = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Low buzzer sound
    oscillator.frequency.value = 200; // Lower pitch for error
    oscillator.type = 'sawtooth'; // Harsh sound
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    // Silent fail
  }
};

/**
 * Play a notification sound
 * Used for: New tasks, alerts, messages
 */
export const playNotification = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Three quick beeps
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    // Silent fail
  }
};

/**
 * Play a hover sound (subtle)
 * Used for: Button hover effects
 */
export const playHover = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Very subtle high pitch
    oscillator.frequency.value = 1500;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.03);
  } catch (e) {
    // Silent fail
  }
};

/**
 * Play a victory/win sound 🏆
 * Used for: Recruiting members, major achievements
 */
export const playWin = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a triumphant ascending melody
    const notes = [
      { freq: 523, time: 0 },      // C5
      { freq: 659, time: 0.15 },   // E5
      { freq: 784, time: 0.3 },    // G5
      { freq: 1047, time: 0.45 }   // C6 (octave up - "Ta-da!")
    ];
    
    notes.forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'triangle'; // Warm, pleasant sound
      
      const startTime = audioContext.currentTime + note.time;
      gainNode.gain.setValueAtTime(0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  } catch (e) {
    // Silent fail
  }
};

/**
 * Play a loss/game over sound 💀
 * Used for: Logout, game over scenarios
 */
export const playLoss = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a descending "game over" melody
    const notes = [
      { freq: 523, time: 0 },      // C5
      { freq: 392, time: 0.15 },   // G4 (descending)
      { freq: 330, time: 0.3 },    // E4
      { freq: 262, time: 0.5 }     // C4 (octave down - sad ending)
    ];
    
    notes.forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sawtooth'; // Slightly harsh for sad effect
      
      const startTime = audioContext.currentTime + note.time;
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.25);
    });
  } catch (e) {
    // Silent fail
  }
};
