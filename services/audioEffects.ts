
/**
 * Service pour générer des effets sonores UI futuristes via l'API Web Audio.
 */

let audioCtx: AudioContext | null = null;
let droneNode: OscillatorNode | null = null;
let droneGain: GainNode | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
};

/**
 * Lance une ambiance sonore 'drone' très subtile.
 */
export const startAmbientDrone = () => {
  try {
    initAudio();
    if (!audioCtx || droneNode) return;

    // Création d'un drone à basse fréquence
    droneNode = audioCtx.createOscillator();
    droneGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    droneNode.type = 'sine';
    droneNode.frequency.setValueAtTime(55, audioCtx.currentTime); 

    // Filtre passe-bas pour ne garder que la rondeur
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, audioCtx.currentTime);

    // Volume extrêmement bas pour ne pas être intrusif
    droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.005, audioCtx.currentTime + 2);

    droneNode.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(audioCtx.destination);

    droneNode.start();
  } catch (e) {
    console.debug("Ambient drone activation failed", e);
  }
};

/**
 * Arrête le drone ambient.
 */
export const stopAmbientDrone = () => {
  if (droneNode && droneGain && audioCtx) {
    droneGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
    setTimeout(() => {
      droneNode?.stop();
      droneNode = null;
    }, 1100);
  }
};

/**
 * Joue un son de survol subtil et technologique.
 */
export const playHoverSound = () => {
  try {
    initAudio();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.012, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

/**
 * Joue un son de clic futuriste.
 */
export const playClickSound = () => {
  try {
    initAudio();
    if (!audioCtx) return;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(50, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.08);
    osc2.stop(audioCtx.currentTime + 0.08);
  } catch (e) {}
};

/**
 * Joue un son de notification cristallin.
 */
export const playNotificationSound = () => {
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const notes = [880, 1318.51, 1760]; // A5, E6, A6
    
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.02, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.4);
    });
  } catch (e) {}
};
