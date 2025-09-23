import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Play, Download, Zap, Volume2, Settings, Activity, Lock, Unlock, Copy, RotateCcw, Shuffle, PauseCircle, Headphones, Repeat } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Core synthesis engine constants
const SQUARE = 0, SAWTOOTH = 1, SINE = 2, NOISE = 3;

class SynthParams {
  constructor() {
    this.wave_type = SQUARE;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.3;
    this.p_env_punch = 0;
    this.p_env_decay = 0.4;
    this.p_base_freq = 0.3;
    this.p_freq_limit = 0;
    this.p_freq_ramp = 0;
    this.p_freq_dramp = 0;
    this.p_vib_strength = 0;
    this.p_vib_speed = 0;
    this.p_arp_mod = 0;
    this.p_arp_speed = 0;
    this.p_duty = 0;
    this.p_duty_ramp = 0;
    this.p_repeat_speed = 0;
    this.p_pha_offset = 0;
    this.p_pha_ramp = 0;
    this.p_lpf_freq = 1;
    this.p_lpf_ramp = 0;
    this.p_lpf_resonance = 0;
    this.p_hpf_freq = 0;
    this.p_hpf_ramp = 0;
    // Enhanced features
    this.fm_freq = 0;
    this.fm_depth = 0;
    this.lfo_rate = 0;
    this.lfo_depth = 0;
    this.noise_type = 0; // 0=white, 1=pink, 2=brown
    this.sub_bass = 0;
    this.distortion = 0;
    this.chorus_rate = 0;
    this.chorus_depth = 0;
    this.reverb_size = 0;
    this.reverb_decay = 0;
    this.delay_time = 0;
    this.delay_feedback = 0;
    this.ring_mod_freq = 0;
    this.ring_mod_depth = 0;
    this.bit_crush = 0;
    this.sample_reduction = 0;
    this.sound_vol = 0.5;
    this.sample_rate = 44100;
    this.sample_size = 16;
    this.flanger_rate = 0;
    this.flanger_depth = 0;
    this.flanger_delay = 0.5; // a default value
  }

  // validate all
  validate() {
    for (const key in this) {
      if (typeof this[key] === 'number' && (isNaN(this[key]) || !isFinite(this[key]))) {
        console.warn(`Invalid parameter ${key}: ${this[key]}, setting to 0`);
        this[key] = 0;
      }
    }
    return this;
  }

  // All preset methods remain the same...
  pickupCoin() {
    this.reset();
    this.wave_type = SAWTOOTH;
    this.p_base_freq = 0.4 + Math.random() * 0.5;
    this.p_env_attack = 0;
    this.p_env_sustain = Math.random() * 0.1;
    this.p_env_decay = 0.1 + Math.random() * 0.4;
    this.p_env_punch = 0.3 + Math.random() * 0.3;
    if (Math.random() > 0.5) {
      this.p_arp_speed = 0.5 + Math.random() * 0.2;
      this.p_arp_mod = 0.2 + Math.random() * 0.4;
    }
    return this;
  }

  laserShoot() {
    this.reset();
    this.wave_type = Math.floor(Math.random() * 3);
    this.p_base_freq = 0.3 + Math.random() * 0.6;
    this.p_freq_ramp = -0.35 - Math.random() * 0.3;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.1 + Math.random() * 0.2;
    this.p_env_decay = Math.random() * 0.4;
    this.p_hpf_freq = Math.random() * 0.3;
    this.distortion = Math.random() * 0.3;
    return this;
  }

  explosion() {
    this.reset();
    this.wave_type = NOISE;
    this.noise_type = 0;
    this.p_base_freq = Math.pow(0.1 + Math.random() * 0.4, 2);
    this.p_freq_ramp = -0.1 + Math.random() * 0.4;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.1 + Math.random() * 0.3;
    this.p_env_decay = Math.random() * 0.5;
    this.p_env_punch = 0.2 + Math.random() * 0.6;
    this.distortion = 0.2 + Math.random() * 0.5;
    this.reverb_size = Math.random() * 0.4;
    if (Math.random() > 0.5) {
      this.p_pha_offset = -0.3 + Math.random() * 0.9;
      this.p_pha_ramp = -Math.random() * 0.3;
    }
    return this;
  }

  powerUp() {
    this.reset();
    this.wave_type = Math.random() > 0.5 ? SAWTOOTH : SQUARE;
    this.p_base_freq = 0.2 + Math.random() * 0.3;
    this.p_freq_ramp = 0.1 + Math.random() * 0.4;
    this.p_env_attack = 0;
    this.p_env_sustain = Math.random() * 0.4;
    this.p_env_decay = 0.1 + Math.random() * 0.4;
    this.chorus_rate = Math.random() * 0.3;
    this.chorus_depth = Math.random() * 0.2;
    return this;
  }

  hitHurt() {
    this.reset();
    this.wave_type = Math.floor(Math.random() * 3);
    if (this.wave_type === SINE) this.wave_type = NOISE;
    this.p_base_freq = 0.2 + Math.random() * 0.6;
    this.p_freq_ramp = -0.3 - Math.random() * 0.4;
    this.p_env_attack = 0;
    this.p_env_sustain = Math.random() * 0.1;
    this.p_env_decay = 0.1 + Math.random() * 0.2;
    if (Math.random() > 0.5) this.p_hpf_freq = Math.random() * 0.3;
    this.distortion = Math.random() * 0.4;
    return this;
  }

  jump() {
    this.reset();
    this.wave_type = SQUARE;
    this.p_duty = Math.random() * 0.6;
    this.p_base_freq = 0.3 + Math.random() * 0.3;
    this.p_freq_ramp = 0.1 + Math.random() * 0.2;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.1 + Math.random() * 0.3;
    this.p_env_decay = 0.1 + Math.random() * 0.2;
    if (Math.random() > 0.5) this.p_hpf_freq = Math.random() * 0.3;
    if (Math.random() > 0.5) this.p_lpf_freq = 1 - Math.random() * 0.6;
    return this;
  }

  ambient() {
    this.reset();
    this.wave_type = SINE;
    this.p_base_freq = 0.1 + Math.random() * 0.3;
    this.p_env_attack = 0.3 + Math.random() * 0.5;
    this.p_env_sustain = 0.5 + Math.random() * 0.5;
    this.p_env_decay = 0.3 + Math.random() * 0.7;
    this.fm_freq = Math.random() * 0.3;
    this.fm_depth = Math.random() * 0.4;
    this.reverb_size = 0.6 + Math.random() * 0.4;
    this.reverb_decay = 0.5 + Math.random() * 0.5;
    this.p_lpf_freq = 0.3 + Math.random() * 0.4;
    return this;
  }

  bell() {
    this.reset();
    this.wave_type = SINE;
    this.p_base_freq = 0.5 + Math.random() * 0.4;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.1;
    this.p_env_decay = 0.6 + Math.random() * 0.4;
    this.fm_freq = 0.8 + Math.random() * 0.2;
    this.fm_depth = 0.3 + Math.random() * 0.4;
    this.reverb_size = 0.3 + Math.random() * 0.3;
    return this;
  }

  bass() {
    this.reset();
    this.wave_type = SAWTOOTH;
    this.p_base_freq = 0.05 + Math.random() * 0.15;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.3 + Math.random() * 0.4;
    this.p_env_decay = 0.2 + Math.random() * 0.3;
    this.sub_bass = 0.4 + Math.random() * 0.6;
    this.p_lpf_freq = 0.2 + Math.random() * 0.3;
    this.distortion = Math.random() * 0.2;
    return this;
  }

  lead() {
    this.reset();
    this.wave_type = SAWTOOTH;
    this.p_base_freq = 0.4 + Math.random() * 0.4;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.4 + Math.random() * 0.4;
    this.p_env_decay = 0.2 + Math.random() * 0.3;
    this.p_vib_speed = 0.2 + Math.random() * 0.3;
    this.p_vib_strength = 0.1 + Math.random() * 0.2;
    this.chorus_rate = Math.random() * 0.2;
    this.delay_time = Math.random() * 0.3;
    return this;
  }

  blip() {
    this.reset();
    this.wave_type = SINE;
    this.p_base_freq = 0.5 + Math.random() * 0.3;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.01 + Math.random() * 0.05;
    this.p_env_decay = 0.1 + Math.random() * 0.2;
    this.p_freq_ramp = 0.1 + Math.random() * 0.3;
    return this;
  }

  zap() {
    this.reset();
    this.wave_type = SQUARE;
    this.p_base_freq = 0.6 + Math.random() * 0.4;
    this.p_freq_ramp = -0.5 - Math.random() * 0.3;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.05 + Math.random() * 0.1;
    this.p_env_decay = 0.1 + Math.random() * 0.2;
    this.p_duty = -0.2 + Math.random() * 0.4;
    this.distortion = 0.1 + Math.random() * 0.3;
    return this;
  }

  woosh() {
    this.reset();
    this.wave_type = NOISE;
    this.noise_type = 1; // Pink noise
    this.p_base_freq = 0.1 + Math.random() * 0.2;
    this.p_env_attack = 0.1 + Math.random() * 0.3;
    this.p_env_sustain = 0.2 + Math.random() * 0.4;
    this.p_env_decay = 0.3 + Math.random() * 0.5;
    this.p_lpf_freq = 0.3 + Math.random() * 0.4;
    this.p_lpf_ramp = -0.2 - Math.random() * 0.3;
    this.reverb_size = 0.3 + Math.random() * 0.4;
    return this;
  }

  drone() {
    this.reset();
    this.wave_type = SAWTOOTH;
    this.p_base_freq = 0.05 + Math.random() * 0.15;
    this.p_env_attack = 0.5 + Math.random() * 1.0;
    this.p_env_sustain = 2.0 + Math.random() * 2.0;
    this.p_env_decay = 1.0 + Math.random() * 2.0;
    this.p_vib_speed = 0.1 + Math.random() * 0.2;
    this.p_vib_strength = 0.05 + Math.random() * 0.1;
    this.chorus_rate = 0.1 + Math.random() * 0.2;
    this.chorus_depth = 0.2 + Math.random() * 0.3;
    this.p_lpf_freq = 0.4 + Math.random() * 0.3;
    return this;
  }

  click() {
    this.reset();
    this.wave_type = SQUARE;
    this.p_base_freq = 0.8 + Math.random() * 0.2;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.01;
    this.p_env_decay = 0.02 + Math.random() * 0.03;
    this.p_duty = 0.1 + Math.random() * 0.2;
    this.p_hpf_freq = 0.2 + Math.random() * 0.3;
    return this;
  }

  glitch() {
    this.reset();
    this.wave_type = Math.floor(Math.random() * 3);
    this.p_base_freq = 0.2 + Math.random() * 0.6;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.05 + Math.random() * 0.1;
    this.p_env_decay = 0.1 + Math.random() * 0.3;
    this.p_arp_speed = 0.8 + Math.random() * 0.2;
    this.p_arp_mod = -0.5 + Math.random() * 1.0;
    this.bit_crush = 0.3 + Math.random() * 0.5;
    this.distortion = 0.2 + Math.random() * 0.4;
    this.p_repeat_speed = 0.3 + Math.random() * 0.4;
    return this;
  }

  portal() {
    this.reset();
    this.wave_type = SINE;
    this.p_base_freq = 0.3 + Math.random() * 0.3;
    this.p_env_attack = 0.2 + Math.random() * 0.3;
    this.p_env_sustain = 0.5 + Math.random() * 0.5;
    this.p_env_decay = 0.8 + Math.random() * 1.0;
    this.fm_freq = 0.3 + Math.random() * 0.4;
    this.fm_depth = 0.4 + Math.random() * 0.6;
    this.ring_mod_freq = 0.1 + Math.random() * 0.3;
    this.ring_mod_depth = 0.2 + Math.random() * 0.3;
    this.reverb_size = 0.6 + Math.random() * 0.4;
    this.delay_time = 0.2 + Math.random() * 0.3;
    this.delay_feedback = 0.3 + Math.random() * 0.4;
    return this;
  }

  warning() {
    this.reset();
    this.wave_type = SQUARE;
    this.p_base_freq = 0.15 + Math.random() * 0.1;
    this.p_env_attack = 0;
    this.p_env_sustain = 0.3 + Math.random() * 0.2;
    this.p_env_decay = 0.1 + Math.random() * 0.2;
    this.p_duty = -0.3 + Math.random() * 0.2;
    this.p_repeat_speed = 0.5 + Math.random() * 0.3;
    this.distortion = 0.1 + Math.random() * 0.2;
    this.p_lpf_freq = 0.6 + Math.random() * 0.3;
    return this;
  }

  random() {
    this.reset();
    this.wave_type = Math.floor(Math.random() * 4);
    this.p_base_freq = Math.pow(Math.random(), 2);
    this.p_freq_ramp = Math.pow(Math.random() * 2 - 1, 5);
    this.p_env_attack = Math.pow(Math.random() * 2 - 1, 3);
    this.p_env_sustain = Math.pow(Math.random() * 2 - 1, 2);
    this.p_env_decay = Math.random() * 2 - 1;
    this.p_env_punch = Math.pow(Math.random() * 0.8, 2);
    this.p_duty = Math.random() * 2 - 1;
    this.p_duty_ramp = Math.pow(Math.random() * 2 - 1, 3);
    this.p_vib_strength = Math.pow(Math.random() * 2 - 1, 3);
    this.p_vib_speed = Math.random() * 2 - 1;
    this.p_arp_mod = Math.random() * 2 - 1;
    this.p_arp_speed = Math.random() * 2 - 1;
    this.p_lpf_freq = 1 - Math.pow(Math.random(), 3);
    this.p_lpf_ramp = Math.pow(Math.random() * 2 - 1, 3);
    this.p_hpf_freq = Math.pow(Math.random(), 5);
    this.p_hpf_ramp = Math.pow(Math.random() * 2 - 1, 5);
    this.distortion = Math.random() * 0.4;
    this.reverb_size = Math.random() * 0.5;
    return this;
  }

  reset() {
    Object.assign(this, new SynthParams());
    return this;
  }

  clone() {
    const clone = new SynthParams();
    Object.assign(clone, this);
    return clone;
  }

  morphTo(target, amount) {
    const result = this.clone();
    for (const key in result) {
      if (typeof result[key] === 'number' && typeof target[key] === 'number') {
        result[key] = result[key] + (target[key] - result[key]) * amount;
      }
    }
    return result;
  }
}

// Enhanced audio synthesis engine with iOS fixes
class AudioSynthesizer {
  constructor() {
    console.log('AudioSynthesizer constructor called');
    this.audioContext = null;
    this.masterGain = null;
    this.isInitialized = false;
    this.initializationAttempted = false;
  }

  async initAudio() {
    if (this.initializationAttempted) {
      console.log('Audio initialization already attempted');
      return this.isInitialized;
    }

    this.initializationAttempted = true;

    try {
      console.log('Initializing audio context...');
      
      // For iOS Safari, we need to be more careful about audio context creation
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      this.audioContext = new AudioContextClass();
      console.log('Audio context created:', this.audioContext);
      console.log('Audio context state:', this.audioContext.state);

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      
      // On iOS, the context often starts in 'suspended' state
      if (this.audioContext.state === 'suspended') {
        console.log('Audio context is suspended, attempting to resume...');
        try {
          await this.audioContext.resume();
          console.log('Audio context resumed successfully, new state:', this.audioContext.state);
        } catch (resumeError) {
          console.warn('Failed to resume audio context:', resumeError);
          // Don't throw here, we'll try to resume on user interaction
        }
      }

      this.isInitialized = true;
      console.log('Audio initialization complete, final state:', this.audioContext.state);
      return true;
    } catch (e) {
      console.error('Audio initialization failed:', e);
      this.isInitialized = false;
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initAudio();
    }
    
    // Always ensure context is running before use
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Audio context resumed in ensureInitialized');
      } catch (e) {
        console.warn('Failed to resume audio context in ensureInitialized:', e);
      }
    }
    
    return this.isInitialized;
  }

  generateNoise(type, length) {
    const noise = new Float32Array(length);
    let b0 = 0, b1 = 0, b2 = 0, b6 = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;

      switch (type) {
        case 0: // White noise
          noise[i] = white;
          break;
        case 1: // Pink noise
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          noise[i] = b0 + b1 + b2 + white * 0.3104856;
          break;
        case 2: // Brown noise
          b6 = (b6 + white * 0.02) * 0.996;
          noise[i] = b6 * 3.5;
          break;
        default:
          noise[i] = white;
          break;
      }
    }
    return noise;
  }

  applyDistortion(sample, amount) {
    if (amount <= 0) return sample;
    const drive = 1 + amount * 10;
    return Math.tanh(sample * drive) / drive;
  }

  applyBitCrush(sample, amount) {
    if (amount <= 0) return sample;
    const bits = Math.floor(16 - amount * 15);
    const levels = Math.pow(2, bits);
    return Math.floor(sample * levels) / levels;
  }

  async generateBufferWithSettings(params, duration = 1.0, customSampleRate = null, customBitDepth = null) {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      console.error('Cannot generate buffer: audio not initialized');
      return null;
    }

    const targetSampleRate = customSampleRate || this.audioContext.sampleRate;
    const targetBitDepth = customBitDepth || 16;

    const buffer = await this.generateBuffer(params, duration);

    if (!buffer || !buffer.getChannelData) {
      console.error('generateBuffer returned invalid buffer:', buffer);
      return null;
    }

    try {
      const originalData = buffer.getChannelData(0);
      const originalSampleRate = this.audioContext.sampleRate;

      if (targetSampleRate < originalSampleRate) {
        console.log(`Downsampling from ${originalSampleRate}Hz to ${targetSampleRate}Hz`);

        const ratio = originalSampleRate / targetSampleRate;
        const newLength = Math.floor(originalData.length / ratio);

        const downsampledData = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
          const sourceIndex = Math.floor(i * ratio);
          downsampledData[i] = originalData[sourceIndex];
        }

        const upsampledData = new Float32Array(originalData.length);
        for (let i = 0; i < originalData.length; i++) {
          const downsampledIndex = Math.floor((i / originalData.length) * newLength);
          upsampledData[i] = downsampledData[Math.min(downsampledIndex, newLength - 1)];
        }

        originalData.set(upsampledData);
      }

      if (targetBitDepth < 16) {
        console.log(`Applying bit depth reduction to ${targetBitDepth} bits`);
        const levels = Math.pow(2, targetBitDepth - 1) - 1;

        for (let i = 0; i < originalData.length; i++) {
          const quantized = Math.floor(originalData[i] * levels) / levels;
          originalData[i] = Math.max(-1, Math.min(1, quantized));
        }
      }

      return buffer;
    } catch (error) {
      console.error('Error in generateBufferWithSettings:', error);
      return null;
    }
  }

  async generateBuffer(params, duration = 1.0) {
    console.log('generateBuffer called with:', { params, duration });

    const initialized = await this.ensureInitialized();
    
    if (!initialized || !this.audioContext) {
      console.error('Audio context not available or not initialized');
      return null;
    }

    try {
      if (!params) {
        console.warn('No parameters provided, using defaults');
        params = new SynthParams();
      }

      // Validate parameters
      const safeParams = {
        wave_type: Math.max(0, Math.min(3, Math.floor(params.wave_type || 0))),
        p_env_attack: Math.max(0, Math.min(3, params.p_env_attack || 0)),
        p_env_sustain: Math.max(0, Math.min(3, params.p_env_sustain || 0.3)),
        p_env_decay: Math.max(0, Math.min(3, params.p_env_decay || 0.4)),
        p_env_punch: Math.max(0, Math.min(3, params.p_env_punch || 0)),
        p_base_freq: Math.max(0.001, Math.min(2, params.p_base_freq || 0.3)),
        p_freq_limit: Math.max(0, Math.min(1, params.p_freq_limit || 0)),
        p_freq_ramp: Math.max(-1, Math.min(1, params.p_freq_ramp || 0)),
        p_freq_dramp: Math.max(-1, Math.min(1, params.p_freq_dramp || 0)),
        p_vib_strength: Math.max(0, Math.min(1, params.p_vib_strength || 0)),
        p_vib_speed: Math.max(0, Math.min(1, params.p_vib_speed || 0)),
        p_arp_mod: Math.max(-1, Math.min(1, params.p_arp_mod || 0)),
        p_arp_speed: Math.max(0, Math.min(1, params.p_arp_speed || 0)),
        p_duty: Math.max(-1, Math.min(1, params.p_duty || 0)),
        p_duty_ramp: Math.max(-1, Math.min(1, params.p_duty_ramp || 0)),
        p_repeat_speed: Math.max(0, Math.min(1, params.p_repeat_speed || 0)),
        p_pha_offset: Math.max(-1, Math.min(1, params.p_pha_offset || 0)),
        p_pha_ramp: Math.max(-1, Math.min(1, params.p_pha_ramp || 0)),
        p_lpf_freq: Math.max(0, Math.min(1, params.p_lpf_freq || 1)),
        p_lpf_ramp: Math.max(-1, Math.min(1, params.p_lpf_ramp || 0)),
        p_lpf_resonance: Math.max(0, Math.min(1, params.p_lpf_resonance || 0)),
        p_hpf_freq: Math.max(0, Math.min(1, params.p_hpf_freq || 0)),
        p_hpf_ramp: Math.max(-1, Math.min(1, params.p_hpf_ramp || 0)),
        fm_freq: Math.max(0, Math.min(1, params.fm_freq || 0)),
        fm_depth: Math.max(0, Math.min(1, params.fm_depth || 0)),
        lfo_rate: Math.max(0, Math.min(1, params.lfo_rate || 0)),
        lfo_depth: Math.max(0, Math.min(1, params.lfo_depth || 0)),
        noise_type: Math.max(0, Math.min(2, Math.floor(params.noise_type || 0))),
        sub_bass: Math.max(0, Math.min(1, params.sub_bass || 0)),
        distortion: Math.max(0, Math.min(1, params.distortion || 0)),
        chorus_rate: Math.max(0, Math.min(1, params.chorus_rate || 0)),
        chorus_depth: Math.max(0, Math.min(1, params.chorus_depth || 0)),
        reverb_size: Math.max(0, Math.min(1, params.reverb_size || 0)),
        reverb_decay: Math.max(0, Math.min(1, params.reverb_decay || 0)),
        delay_time: Math.max(0, Math.min(1, params.delay_time || 0)),
        delay_feedback: Math.max(0, Math.min(1, params.delay_feedback || 0)),
        ring_mod_freq: Math.max(0, Math.min(1, params.ring_mod_freq || 0)),
        ring_mod_depth: Math.max(0, Math.min(1, params.ring_mod_depth || 0)),
        bit_crush: Math.max(0, Math.min(1, params.bit_crush || 0)),
        sample_reduction: Math.max(0, Math.min(1, params.sample_reduction || 0)),
        sound_vol: Math.max(0, Math.min(1, params.sound_vol || 0.5)),
        flanger_rate: Math.max(0, Math.min(1, params.flanger_rate || 0)),
        flanger_depth: Math.max(0, Math.min(1, params.flanger_depth || 0)),
        flanger_delay: Math.max(0.1, Math.min(1, params.flanger_delay || 0.5))
      };

      const sampleRate = this.audioContext.sampleRate;
      const safeDuration = Math.max(0.1, Math.min(10, duration));
      const length = Math.floor(sampleRate * safeDuration);

      console.log('Buffer details:', { sampleRate, safeDuration, length });

      if (length <= 0 || length > sampleRate * 10) {
        console.error('Invalid buffer length:', length);
        return null;
      }

      console.log('Creating audio buffer...');
      const buffer = this.audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      console.log('Audio buffer created, starting synthesis...');

      let phase = 0, subPhase = 0, fmPhase = 0;
      let frequency = safeParams.p_base_freq * 440;
      let envelope = 1;
      let dutyCycle = Math.max(0.01, Math.min(0.99, 0.5 - safeParams.p_duty * 0.5));
      let arpTime = 0;
      let arpValue = 1;

      let noise = null;
      if (safeParams.wave_type === NOISE) {
        try {
          console.log('Generating noise...');
          noise = this.generateNoise(safeParams.noise_type, length);
          console.log('Noise generated successfully');
        } catch (e) {
          console.warn('Noise generation failed:', e);
          noise = new Float32Array(length).fill(0);
        }
      }

      console.log('Starting sample generation loop...');

      const maxDelaySize = Math.floor(sampleRate * 0.5);
      const delayBuffer = new Array(maxDelaySize).fill(0);
      let delayIndex = 0;

      const maxChorusSize = Math.floor(sampleRate * 0.02);
      const chorusDelay = new Array(maxChorusSize).fill(0);
      let chorusIndex = 0;

      const maxFlangerSize = Math.floor(sampleRate * 0.02);
      const flangerBuffer = new Array(maxFlangerSize).fill(0);
      let flangerIndex = 0;

      const attackSamples = Math.floor(safeParams.p_env_attack * sampleRate);
      const sustainSamples = Math.floor(safeParams.p_env_sustain * sampleRate);
      const decaySamples = Math.floor(safeParams.p_env_decay * sampleRate);

      for (let i = 0; i < length; i++) {
        try {
          const t = i / sampleRate;

          if (i < attackSamples) {
            envelope = attackSamples > 0 ? i / attackSamples : 1;
          } else if (i < attackSamples + sustainSamples) {
            const sustainProgress = sustainSamples > 0 ? (i - attackSamples) / sustainSamples : 0;
            envelope = 1 + (1 - sustainProgress) * 2 * safeParams.p_env_punch;
          } else if (i < attackSamples + sustainSamples + decaySamples) {
            const decayProgress = decaySamples > 0 ? (i - attackSamples - sustainSamples) / decaySamples : 1;
            envelope = Math.max(0, 1 - decayProgress);
          } else {
            envelope = 0;
          }

          if (safeParams.p_repeat_speed > 0) {
            const retriggerRate = safeParams.p_repeat_speed * 20;
            const retriggerPeriod = sampleRate / retriggerRate;
            const retriggerPhase = (i % retriggerPeriod) / retriggerPeriod;

            if (retriggerPhase < 0.1) {
              envelope *= retriggerPhase / 0.1;
            }
          }

          if (safeParams.p_arp_speed > 0) {
            arpTime += safeParams.p_arp_speed * 50 / sampleRate;
            if (arpTime >= 1) {
              arpTime = 0;
              arpValue = 1 + safeParams.p_arp_mod * (Math.random() * 2 - 1);
            }
          }

          frequency += safeParams.p_freq_ramp * 10;
          frequency = Math.max(20, Math.min(20000, frequency));

          let currentFreq = frequency * Math.max(0.1, Math.min(10, arpValue));

          if (safeParams.fm_depth > 0 && safeParams.fm_freq > 0) {
            fmPhase += (2 * Math.PI * safeParams.fm_freq * 50) / sampleRate;
            if (fmPhase > 2 * Math.PI) fmPhase -= 2 * Math.PI;
            const fmOsc = Math.sin(fmPhase);
            currentFreq += fmOsc * safeParams.fm_depth * 100;
          }

          if (safeParams.lfo_depth > 0 && safeParams.lfo_rate > 0) {
            const lfo = Math.sin(2 * Math.PI * safeParams.lfo_rate * 5 * t);
            currentFreq += lfo * safeParams.lfo_depth * 50;
          }

          if (safeParams.p_vib_strength > 0 && safeParams.p_vib_speed > 0) {
            const vibrato = Math.sin(2 * Math.PI * safeParams.p_vib_speed * 50 * t);
            currentFreq += vibrato * safeParams.p_vib_strength * currentFreq * 0.1;
          }

          if (safeParams.p_duty_ramp !== 0) {
            dutyCycle += safeParams.p_duty_ramp * 0.0001;
            dutyCycle = Math.max(0.01, Math.min(0.99, dutyCycle));
          }

          let sample = 0;
          currentFreq = Math.max(20, Math.min(20000, currentFreq));
          phase += (2 * Math.PI * currentFreq) / sampleRate;
          if (phase > 2 * Math.PI) phase -= 2 * Math.PI;

          switch (safeParams.wave_type) {
            case SQUARE:
              sample = (phase / (2 * Math.PI)) < dutyCycle ? 1 : -1;
              break;
            case SAWTOOTH:
              sample = (phase / Math.PI) - 1;
              break;
            case SINE:
              sample = Math.sin(phase);
              break;
            case NOISE:
              sample = noise && noise[i] ? noise[i] : (Math.random() * 2 - 1);
              break;
            default:
              sample = Math.sin(phase);
              break;
          }

          sample = Math.max(-1, Math.min(1, sample));

          if (safeParams.sub_bass > 0) {
            subPhase += (Math.PI * currentFreq) / sampleRate;
            if (subPhase > 2 * Math.PI) subPhase -= 2 * Math.PI;
            const subSample = Math.sin(subPhase);
            sample += subSample * safeParams.sub_bass * 0.5;
          }

          if (safeParams.ring_mod_depth > 0 && safeParams.ring_mod_freq > 0) {
            const ringOsc = Math.sin(2 * Math.PI * safeParams.ring_mod_freq * 200 * t);
            sample *= (1 - safeParams.ring_mod_depth + safeParams.ring_mod_depth * ringOsc);
          }

          if (safeParams.p_lpf_freq < 1) {
            const cutoff = Math.max(0, Math.min(1, safeParams.p_lpf_freq));
            const prevSample = i > 0 ? data[i - 1] : 0;
            sample = sample * cutoff + (1 - cutoff) * prevSample;
          }

          if (safeParams.p_hpf_freq > 0) {
            const prevSample = i > 0 ? data[i - 1] : 0;
            sample = sample - prevSample * Math.max(0, Math.min(1, safeParams.p_hpf_freq));
          }

          if (safeParams.distortion > 0) {
            sample = this.applyDistortion(sample, safeParams.distortion);
          }

          if (safeParams.bit_crush > 0) {
            sample = this.applyBitCrush(sample, safeParams.bit_crush);
          }

          if (safeParams.chorus_rate > 0 && safeParams.chorus_depth > 0) {
            const chorusLfo = Math.sin(2 * Math.PI * safeParams.chorus_rate * 5 * t);
            const chorusDelayTime = Math.floor(0.01 * sampleRate + chorusLfo * 0.005 * sampleRate);
            const chorusDelayedIndex = (chorusIndex - Math.max(1, Math.min(maxChorusSize - 1, chorusDelayTime)) + maxChorusSize) % maxChorusSize;
            const chorused = chorusDelay[chorusDelayedIndex] || 0;
            sample += chorused * safeParams.chorus_depth * 0.3;
            chorusDelay[chorusIndex] = sample;
            chorusIndex = (chorusIndex + 1) % maxChorusSize;
          }

          if (safeParams.delay_time > 0) {
            const delayTimeInSamples = Math.floor(safeParams.delay_time * sampleRate * 0.3);
            const delayedIndex = (delayIndex - Math.max(1, Math.min(maxDelaySize - 1, delayTimeInSamples)) + maxDelaySize) % maxDelaySize;
            const delayed = delayBuffer[delayedIndex] || 0;
            sample += delayed * safeParams.delay_feedback * 0.5;
            delayBuffer[delayIndex] = sample;
            delayIndex = (delayIndex + 1) % maxDelaySize;
          }

          if (safeParams.flanger_rate > 0 && safeParams.flanger_depth > 0) {
            const flangerLfo = Math.sin(2 * Math.PI * safeParams.flanger_rate * 1 * t);
            const baseDelay = Math.floor(safeParams.flanger_delay * 0.01 * sampleRate);
            const modDelay = Math.floor(flangerLfo * safeParams.flanger_depth * 0.005 * sampleRate);
            const totalDelay = Math.max(1, Math.min(maxFlangerSize - 1, baseDelay + modDelay));
            const flangerDelayedIndex = (flangerIndex - totalDelay + maxFlangerSize) % maxFlangerSize;
            const flanged = flangerBuffer[flangerDelayedIndex] || 0;
            sample += flanged * 0.3;
            flangerBuffer[flangerIndex] = sample;
            flangerIndex = (flangerIndex + 1) % maxFlangerSize;
          }

          sample = Math.max(-1, Math.min(1, sample));
          envelope = Math.max(0, Math.min(1, envelope));

          const finalSample = sample * envelope * safeParams.sound_vol * 0.3;
          data[i] = Math.max(-1, Math.min(1, isNaN(finalSample) ? 0 : finalSample));

          if (i % 10000 === 0 && i > 0) {
            console.log(`Generated ${i}/${length} samples (${Math.round(i/length*100)}%)`);
          }

        } catch (sampleError) {
          console.error(`Error at sample ${i}:`, sampleError);
          data[i] = 0;
        }
      }

      console.log('Buffer created successfully');
      return buffer;
    } catch (error) {
      console.error('Error in generateBuffer:', error);
      console.error('Error stack:', error.stack);
      console.error('Parameters:', params);
      console.error('Duration:', duration);
      return null;
    }
  }

  async playBuffer(buffer) {
    if (!buffer) {
      console.error('No buffer to play');
      return;
    }

    const initialized = await this.ensureInitialized();
    if (!initialized) {
      console.error('Cannot play buffer: audio not initialized');
      return;
    }

    try {
      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming audio context before playing...');
        await this.audioContext.resume();
      }

      console.log('Playing buffer, context state:', this.audioContext.state);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.masterGain);
      
      // Add error handling for playback
      source.onerror = (e) => {
        console.error('Audio source error:', e);
      };
      
      source.start();
      console.log('Audio started playing');
      return source;
    } catch (error) {
      console.error('Error playing buffer:', error);
    }
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }
}

// Rest of the component code remains the same...
// (All the other components like WaveformDisplay, ParameterInfo, etc. remain exactly the same)

// Smooth parameter interpolation hook
const useSmoothParam = (targetValue, speed = 0.1) => {
  const [currentValue, setCurrentValue] = useState(targetValue || 0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentValue(current => {
        const target = targetValue || 0;
        const diff = target - current;
        if (Math.abs(diff) < 0.001) return target;
        return current + diff * speed;
      });
    }, 16);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [targetValue, speed]);

  return currentValue;
};

// Enhanced waveform display
const WaveformDisplay = ({ audioBuffer, isPlaying, title = "Waveform" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = audioBuffer.getChannelData(0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1f2937');
    gradient.addColorStop(1, '#111827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (i / 4) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (isPlaying) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
    }

    ctx.strokeStyle = isPlaying ? '#10b981' : '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = data.length / canvas.width;
    for (let i = 0; i < canvas.width; i++) {
      const sample = data[Math.floor(i * step)] || 0;
      const x = i;
      const y = (sample * canvas.height * 0.4) + (canvas.height / 2);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [audioBuffer, isPlaying]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="w-full h-24 bg-gray-900 rounded border border-gray-700"
      />
    </div>
  );
};

const ParameterInfo = ({ title, description, technical }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState('left');
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef(null);

  // An SVG icon to use for the button
  const infoIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); 
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handlers remain the same...
  const handleMouseEnter = () => {
    if (!isMobile && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition(rect.left > window.innerWidth / 2 ? 'right' : 'left');
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) setShowTooltip(false);
  };

  const handleClick = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setShowTooltip(true);
    }
  };

  const handleClose = () => {
    setShowTooltip(false);
  };

  // Desktop version
  if (!isMobile) {
    return (
      <div ref={ref} className="relative inline-block align-middle">
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="info-button" // Use the new specific class
          aria-label={`Info about ${title}`}
        >
          {infoIcon}
        </button>
        
        {showTooltip && (
          <div
            className={`absolute z-50 w-80 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-lg bottom-full mb-2 ${
              position === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            <h4 className="font-semibold text-white mb-2">{title}</h4>
            <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap">{description}</p>
            {technical && <p className="text-xs text-gray-400 italic">{technical}</p>}
          </div>
        )}
      </div>
    );
  }

  // Mobile version
  return (
    <>
      <button
        onClick={handleClick}
        className="info-button" // Use the new specific class
        aria-label={`Info about ${title}`}
      >
        {infoIcon}
      </button>
      
      {showTooltip && isMobile && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 z-[9998]" 
            onClick={handleClose}
            aria-hidden="true"
          />
          
          {/* Centered Modal Container */}
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="info-modal-title"
            >
              {/* Modal Header */}
              <div className="p-4 flex-shrink-0 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h4 id="info-modal-title" className="font-semibold text-white text-base pr-4">{title}</h4>
                  <button 
                    onClick={handleClose}
                    className="info-button-close" // Use a specific class for the close button as well
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-4 overflow-y-auto">
                <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap">{description}</p>
                {technical && <p className="text-xs text-gray-400 italic">{technical}</p>}
              </div>
            </div>
          </div>
        </>
      , document.body)}
    </>
  );
};

// Enhanced spectrum analyzer with real FFT
const SpectrumAnalyzer = ({ audioBuffer }) => {
  const canvasRef = useRef(null);

  const computeDFT = (samples, sampleRate) => {
    const N = Math.min(1024, samples.length);
    const frequencies = new Float32Array(N / 2);

    for (let k = 0; k < N / 2; k++) {
      let realSum = 0;
      let imagSum = 0;

      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        const sample = samples[n] || 0;
        realSum += sample * Math.cos(angle);
        imagSum += sample * Math.sin(angle);
      }

      frequencies[k] = Math.sqrt(realSum * realSum + imagSum * imagSum) / N;
    }

    return frequencies;
  };

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = audioBuffer.getChannelData(0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const windowSize = 1024;
    let maxRMS = 0;
    let bestStart = 0;

    const numSamples = Math.min(10, Math.floor(data.length / windowSize));
    for (let i = 0; i < numSamples; i++) {
      const start = Math.floor((i / numSamples) * (data.length - windowSize));
      let rms = 0;

      for (let j = 0; j < windowSize && start + j < data.length; j++) {
        const sample = data[start + j];
        rms += sample * sample;
      }

      rms = Math.sqrt(rms / windowSize);
      if (rms > maxRMS) {
        maxRMS = rms;
        bestStart = start;
      }
    }

    if (maxRMS < 0.001) {
      bestStart = 0;
    }

    const analysisWindow = new Float32Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      if (bestStart + i < data.length) {
        const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (windowSize - 1)));
        analysisWindow[i] = data[bestStart + i] * windowValue;
      } else {
        analysisWindow[i] = 0;
      }
    }

    const spectrum = computeDFT(analysisWindow, audioBuffer.sampleRate);

    const numBins = 32;
    const displaySpectrum = new Float32Array(numBins);
    const nyquist = audioBuffer.sampleRate / 2;

    for (let bin = 0; bin < numBins; bin++) {
      const freqStart = Math.pow(2, (bin / numBins) * Math.log2(nyquist / 20)) * 20;
      const freqEnd = Math.pow(2, ((bin + 1) / numBins) * Math.log2(nyquist / 20)) * 20;

      const startIdx = Math.floor(freqStart / nyquist * spectrum.length);
      const endIdx = Math.floor(freqEnd / nyquist * spectrum.length);

      let sum = 0;
      let count = 0;

      for (let i = startIdx; i < endIdx && i < spectrum.length; i++) {
        sum += spectrum[i];
        count++;
      }

      displaySpectrum[bin] = count > 0 ? sum / count : 0;
    }

    const maxValue = Math.max(...displaySpectrum);

    if (maxValue > 0) {
      const binWidth = canvas.width / numBins;

      for (let i = 0; i < numBins; i++) {
        const normalizedHeight = displaySpectrum[i] / maxValue;
        const height = normalizedHeight * canvas.height * 0.8;

        const hue = 240 - (i / numBins) * 120;
        const saturation = 70;
        const lightness = 40 + normalizedHeight * 30;

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(i * binWidth, canvas.height - height, binWidth - 1, height);
      }
    } else {
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No signal detected', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px monospace';
    ctx.fillText('20Hz', 2, canvas.height - 2);
    ctx.fillText('1kHz', canvas.width * 0.4, canvas.height - 2);
    ctx.fillText(`${Math.round(audioBuffer.sampleRate/2000)}kHz`, canvas.width - 30, canvas.height - 2);

  }, [audioBuffer]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-white">Frequency Spectrum</h3>
      <canvas
        ref={canvasRef}
        width={200}
        height={100}
        className="w-full h-20 bg-gray-900 rounded border border-gray-700"
      />
    </div>
  );
};

const AmplitudeMeter = ({ audioBuffer, title = "Signal Level" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = audioBuffer.getChannelData(0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let peak = 0;
    let rmsSum = 0;

    for (let i = 0; i < data.length; i++) {
      const sample = Math.abs(data[i]);
      peak = Math.max(peak, sample);
      rmsSum += sample * sample;
    }

    const rms = Math.sqrt(rmsSum / data.length);

    const peakDb = peak > 0 ? 20 * Math.log10(peak) : -100;
    const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dbRange = 60;
    const peakHeight = Math.max(0, (peakDb + dbRange) / dbRange) * canvas.height;
    const rmsHeight = Math.max(0, (rmsDb + dbRange) / dbRange) * canvas.height;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, canvas.height - rmsHeight, canvas.width * 0.4, rmsHeight);

    ctx.fillStyle = peak > 0.95 ? '#ef4444' : '#10b981';
    ctx.fillRect(canvas.width * 0.5, canvas.height - peakHeight, canvas.width * 0.4, peakHeight);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.fillText('RMS', 2, 12);
    ctx.fillText('PEAK', canvas.width * 0.5 + 2, 12);
    ctx.fillText(`${rmsDb.toFixed(1)}dB`, 2, canvas.height - 2);
    ctx.fillText(`${peakDb.toFixed(1)}dB`, canvas.width * 0.5 + 2, canvas.height - 2);

  }, [audioBuffer]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <canvas
        ref={canvasRef}
        width={200}
        height={100}
        className="w-full h-20 bg-gray-900 rounded border border-gray-700"
      />
    </div>
  );
};

const AmplitudeEnvelope = ({ audioBuffer, title = "Volume Envelope" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = audioBuffer.getChannelData(0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const windowSize = Math.floor(data.length / canvas.width);
    const envelope = [];

    for (let i = 0; i < canvas.width; i++) {
      let sum = 0;
      const start = i * windowSize;
      const end = Math.min(start + windowSize, data.length);

      for (let j = start; j < end; j++) {
        sum += data[j] * data[j];
      }

      envelope.push(Math.sqrt(sum / (end - start)));
    }

    const maxEnv = Math.max(...envelope);

    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    ctx.moveTo(0, canvas.height);
    for (let i = 0; i < envelope.length; i++) {
      const normalizedHeight = maxEnv > 0 ? (envelope[i] / maxEnv) : 0;
      const y = canvas.height - (normalizedHeight * canvas.height * 0.8);
      ctx.lineTo(i, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < envelope.length; i++) {
      const normalizedHeight = maxEnv > 0 ? (envelope[i] / maxEnv) : 0;
      const y = canvas.height - (normalizedHeight * canvas.height * 0.8);
      if (i === 0) ctx.moveTo(i, y);
      else ctx.lineTo(i, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    const duration = audioBuffer.length / audioBuffer.sampleRate;
    ctx.fillText('0s', 2, canvas.height - 2);
    ctx.fillText(`${duration.toFixed(2)}s`, canvas.width - 30, canvas.height - 2);

  }, [audioBuffer]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={60}
        className="w-full h-12 bg-gray-900 rounded border border-gray-700"
      />
    </div>
  );
};

// Parameter information database (same as before)
const parameterInfo = {
  waveform: {
    title: "Waveform Display",
    description: "Shows the shape of the sound wave. It plots the amplitude (volume) of the sound over its short duration.",
    technical: "A time-domain representation of the audio buffer. The Y-axis is amplitude (-1 to 1) and the X-axis is time."
  },
  spectrum: {
    title: "Frequency Spectrum",
    description: "Visualizes which frequencies (low to high) are present in the sound. Taller bars mean that frequency is more prominent.",
    technical: "A frequency-domain representation derived from a Discrete Fourier Transform (DFT). The X-axis is frequency (logarithmic scale) and the Y-axis is magnitude."
  },
  amplitudeMeter: {
    title: "Amplitude Meter",
    description: "Displays the sound's volume levels. RMS is the average volume, while PEAK shows the loudest single point.",
    technical: "Calculates Root Mean Square (RMS) and Peak amplitude, converting them to decibels (dBFS). A peak near 0dB indicates potential clipping."
  },
  amplitudeEnvelope: {
    title: "Volume Envelope",
    description: "Shows the overall shape of the sound's volume from start to finish. This is shaped by the Attack, Sustain, and Decay parameters.",
    technical: "Calculates the RMS amplitude over small time windows to plot the sound's overall amplitude contour over its full duration."
  },
  waveformType: {
    title: "Waveform Type",
    description: "The fundamental building block of the sound. Each shape has a unique harmonic content and character.\n\n• Square: Bright, buzzy, hollow. Classic retro game sound.\n• Sawtooth: Rich, sharp, full. Great for leads and basses.\n• Sine: Pure, smooth, clean. The most basic tone with no overtones.\n• Noise: Hissy and random. Used for percussion and effects like wind or explosions.",
    technical: "Sets the oscillator's fundamental shape. Square waves contain odd harmonics, Sawtooth waves contain all harmonics, and Sine waves contain only the fundamental frequency."
  },
  noiseType: {
    title: "Noise Type",
    description: "Different 'colors' of noise, each with a different balance of frequencies.\n\n• White: Hissy static with equal energy across all frequencies.\n• Pink: Deeper, like a waterfall, with less high-frequency content.\n• Brown: A low rumble, like distant thunder, emphasizing bass frequencies.",
    technical: "Describes the power spectral density. White noise is flat (equal power per Hz). Pink noise power drops 3dB per octave. Brown(ian) noise power drops 6dB per octave."
  },
  p_base_freq: {
    title: "Base Frequency",
    description: "Controls the fundamental pitch of the sound. Higher values create higher-pitched sounds.",
    technical: "Normalized frequency value, where 1.0 is approximately 440Hz (A4). The range is clamped between 20Hz and 20kHz during synthesis."
  },
  p_freq_ramp: {
    title: "Frequency Ramp (Slide)",
    description: "Makes the pitch slide up (positive) or down (negative) over the sound's duration.",
    technical: "A linear modulation added to the base frequency over time. Creates sweeps, risers, and dive-bomb effects."
  },
  p_freq_limit: {
    title: "Frequency Floor",
    description: "Sets a minimum pitch for downward frequency slides, preventing them from becoming inaudibly low.",
    technical: "A lower bound for the frequency. Useful for sounds like lasers or impacts that slide down but shouldn't disappear."
  },
  p_freq_dramp: {
    title: "Delta Slide",
    description: "Accelerates or decelerates the frequency slide over time, creating curved pitch changes.",
    technical: "Modulates the `p_freq_ramp` itself, creating a second-order change in frequency (acceleration)."
  },
  p_repeat_speed: {
    title: "Retrigger Rate",
    description: "Rapidly re-triggers the sound's envelope, creating a stuttering or buzzing effect.",
    technical: "Applies a sawtooth-like amplitude modulation to the envelope, simulating rapid re-triggering at a rate proportional to this value."
  },
  p_env_attack: {
    title: "Attack Time",
    description: "How quickly the sound fades in from silence to its maximum volume.",
    technical: "The duration of the Attack phase of the ADSR envelope, in seconds. A value of 0 is instantaneous."
  },
  p_env_sustain: {
    title: "Sustain Time",
    description: "How long the sound holds its volume after the initial attack.",
    technical: "The duration of the Sustain phase of the ADSR envelope, in seconds."
  },
  p_env_decay: {
    title: "Decay Time",
    description: "How quickly the sound fades out to silence after the sustain period ends.",
    technical: "The duration of the Decay phase of the ADSR envelope, in seconds."
  },
  p_env_punch: {
    title: "Sustain Punch",
    description: "Adds an initial volume boost at the beginning of the sustain phase, creating a more percussive or 'punchy' sound.",
    technical: "An amplitude boost applied at the start of the sustain phase which then decays, creating a secondary attack-decay shape within the sustain."
  },
  p_vib_speed: {
    title: "Vibrato Speed",
    description: "Controls how fast the pitch wavers up and down (vibrato).",
    technical: "The frequency of the Low-Frequency Oscillator (LFO) that modulates the pitch."
  },
  p_vib_strength: {
    title: "Vibrato Depth",
    description: "Controls how much the pitch wavers up and down (vibrato depth).",
    technical: "The amplitude of the LFO that modulates the pitch, determining the intensity of the vibrato effect."
  },
  distortion: {
    title: "Distortion",
    description: "Adds warmth, grit, and aggressive harmonics by clipping the waveform.",
    technical: "Applies a hyperbolic tangent `tanh(x)` waveshaping algorithm to the signal, adding odd harmonics."
  },
  bit_crush: {
    title: "Bit Crush",
    description: "Reduces the sound's digital resolution, creating a crunchy, lo-fi, retro video game sound.",
    technical: "Quantizes the signal's amplitude to a lower bit depth, introducing quantization error noise."
  },
  p_lpf_freq: {
    title: "Low-Pass Filter",
    description: "Cuts high frequencies, making the sound darker, more muffled, or appear farther away.",
    technical: "The cutoff frequency of a simple one-pole low-pass filter. Value of 1.0 means the filter is fully open (no effect)."
  },
  p_lpf_resonance: {
    title: "LPF Resonance",
    description: "Creates a resonant 'peak' or 'whistle' at the Low-Pass Filter's cutoff frequency, accentuating the filter's effect.",
    technical: "Boosts frequencies near the cutoff point. High values can lead to self-oscillation, creating a sine-like tone."
  },
  p_hpf_freq: {
    title: "High-Pass Filter",
    description: "Cuts low frequencies, making the sound thinner, tinnier, or removing unwanted bass rumble.",
    technical: "The cutoff frequency of a simple one-pole high-pass filter. Value of 0.0 means the filter has no effect."
  },
  chorus_rate: {
    title: "Chorus Rate",
    description: "The speed of the warbling, shimmering chorus effect.",
    technical: "The modulation rate of the chorus effect's delay line, creating a sense of multiple voices."
  },
  delay_time: {
    title: "Delay Time",
    description: "The time between the original sound and its first echo.",
    technical: "The length of the delay buffer, determining the time until the delayed signal is played back."
  },
  flanger_rate: {
    title: "Flanger Rate",
    description: "The speed of the 'whooshing' jet-engine flanger effect.",
    technical: "The modulation rate of the flanger's short, sweeping delay line."
  },
  flanger_depth: {
    title: "Flanger Depth",
    description: "The intensity or width of the flanger's sweeping effect.",
    technical: "The modulation depth of the flanger's delay line."
  },
  flanger_delay: {
    title: "Flanger Delay",
    description: "The base delay time for the flanger, affecting its tonal character.",
    technical: "Sets the center point around which the flanger's delay time is modulated."
  },
  fm_freq: {
    title: "FM Frequency",
    description: "The pitch of the modulating oscillator in Frequency Modulation (FM) synthesis. Creates complex, metallic, or bell-like tones.",
    technical: "Sets the frequency of a secondary (modulator) oscillator whose output modifies the primary (carrier) oscillator's frequency."
  },
  fm_depth: {
    title: "FM Depth",
    description: "The intensity of the FM synthesis effect.",
    technical: "The amplitude of the modulator oscillator, determining how strongly it affects the carrier's frequency."
  },
  ring_mod_freq: {
    title: "Ring Mod Frequency",
    description: "The frequency of the carrier wave for the ring modulator. Creates dissonant, robotic, and metallic textures.",
    technical: "The frequency of the sine wave that the input signal is multiplied by, producing sum and difference frequencies."
  },
  ring_mod_depth: {
    title: "Ring Mod Depth",
    description: "The mix amount of the ring modulation effect.",
    technical: "Controls the wet/dry mix between the original signal and the ring-modulated signal."
  },
  delay_feedback: {
    title: "Delay Feedback",
    description: "Controls how many echoes are produced by the delay effect. High values can lead to runaway, loud sounds.",
    technical: "The amount of the delayed signal that is fed back into the delay line's input."
  },
  sound_vol: {
    title: "Master Volume",
    description: "The final volume of this specific sound patch. This is applied before the global master volume.",
    technical: "A final linear amplitude multiplier for the generated buffer. Value of 1.0 represents 0dBFS (no change)."
  }
};

// Parameter slider (same as before)
const ParamSlider = ({
  label,
  value = 0,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  locked = false,
  onToggleLock,
  suggestion = null,
  info = null
}) => {
  const smoothValue = useSmoothParam(value, 0.1);

  const handleChange = (e) => {
    try {
      const newValue = parseFloat(e.target.value);
      if (!locked && !isNaN(newValue) && isFinite(newValue)) {
        onChange(newValue);
      }
    } catch (error) {
      console.error('Error updating parameter:', error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white">{label}</label>
          {info && <ParameterInfo {...info} />}
          {onToggleLock && (
            <button
              onClick={onToggleLock}
              className={`p-1 rounded ${locked ? 'text-yellow-400' : 'text-gray-500'} hover:text-yellow-300`}
            >
              {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          )}
        </div>
        <span className="text-xs text-gray-200 font-mono bg-gray-800 px-2 py-1 rounded">
          {(smoothValue || 0).toFixed(3)}
        </span>
      </div>

      {suggestion && (
        <div className="text-xs text-blue-400 italic">{suggestion}</div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value || 0}
        onChange={handleChange}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${
          locked ? 'opacity-50 cursor-not-allowed' : ''
        } slider`}
      />
    </div>
  );
};

// WAV export utility with Capacitor integration (same as before)
function audioBufferToWav(audioBuffer, targetSampleRate = null, targetBitDepth = 16) {
  const originalSampleRate = audioBuffer.sampleRate;
  const originalData = audioBuffer.getChannelData(0);

  const finalSampleRate = targetSampleRate || originalSampleRate;
  const finalBitDepth = targetBitDepth || 16;

  let finalData;

  if (finalSampleRate < originalSampleRate) {
    const ratio = originalSampleRate / finalSampleRate;
    const newLength = Math.floor(originalData.length / ratio);

    finalData = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = Math.floor(i * ratio);
      finalData[i] = originalData[sourceIndex];
    }
  } else {
    finalData = originalData;
  }

  if (finalBitDepth < 16) {
    const levels = Math.pow(2, finalBitDepth - 1) - 1;
    for (let i = 0; i < finalData.length; i++) {
      finalData[i] = Math.floor(finalData[i] * levels) / levels;
    }
  }

  const numChannels = 1;
  const format = 1;
  const bytesPerSample = finalBitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const buffer = new ArrayBuffer(44 + finalData.length * bytesPerSample);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  let offset = 0;
  writeString(offset, 'RIFF'); offset += 4;
  view.setUint32(offset, buffer.byteLength - 8, true); offset += 4;
  writeString(offset, 'WAVE'); offset += 4;
  writeString(offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, format, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, finalSampleRate, true); offset += 4;
  view.setUint32(offset, finalSampleRate * blockAlign, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, finalBitDepth, true); offset += 2;
  writeString(offset, 'data'); offset += 4;
  view.setUint32(offset, finalData.length * bytesPerSample, true); offset += 4;

  if (finalBitDepth === 8) {
    for (let i = 0; i < finalData.length; i++) {
      const sample = Math.max(-1, Math.min(1, finalData[i]));
      const intSample = Math.floor((sample + 1) * 127.5);
      view.setUint8(offset, intSample);
      offset += 1;
    }
  } else {
    for (let i = 0; i < finalData.length; i++) {
      const sample = Math.max(-1, Math.min(1, finalData[i]));
      const intSample = Math.floor(sample * 0x7FFF);
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Encoding/decoding functions (same as before)
function encodeParams(params) {
  const paramString = JSON.stringify(params);
  return btoa(paramString).replace(/[+/=]/g, (m) => ({ '+': '-', '/': '_', '=': '' }[m]));
}

function decodeParams(encoded) {
  try {
    const restored = encoded.replace(/[-_]/g, (m) => ({ '-': '+', '_': '/' }[m]));
    const padded = restored + '==='.slice((restored.length + 3) % 4);
    const paramString = atob(padded);
    return JSON.parse(paramString);
  } catch (e) {
    console.error('Failed to decode parameters:', e);
    return null;
  }
}

function detectClipping(audioBuffer, threshold = 0.95) {
  if (!audioBuffer) return false;
  const data = audioBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) >= threshold) return true;
  }
  return false;
}

const NumericInput = ({ label, value, onChange, min = -1, max = 1, step = 0.01, locked = false, onToggleLock }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white">{label}</label>
          {onToggleLock && (
            <button
              onClick={onToggleLock}
              className={`p-1 rounded ${locked ? 'text-yellow-400' : 'text-gray-500'} hover:text-yellow-300`}
            >
              {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value || 0}
        onChange={(e) => !locked && onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
        disabled={locked}
      />
    </div>
  );
};

// Main component with iOS fixes
export default function CompleteCrispFXR() {
  const [params, setParams] = useState(new SynthParams());
  const [paramsB, setParamsB] = useState(new SynthParams());
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioBufferB, setAudioBufferB] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [exportFormat, setExportFormat] = useState('wav');
  const [lockedParams, setLockedParams] = useState(new Set());
  const [activeSlot, setActiveSlot] = useState('A');
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [morphAmount, setMorphAmount] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [redoHistory, setRedoHistory] = useState([]);
  const [showNumericInputs, setShowNumericInputs] = useState(false);
  const [sampleRate, setSampleRate] = useState(44100);
  const [bitDepth, setBitDepth] = useState(16);
  const [isClipping, setIsClipping] = useState(false);
  const [currentShareLink, setCurrentShareLink] = useState('');

  const currentParams = activeSlot === 'A' ? params : paramsB;
  const currentBuffer = activeSlot === 'A' ? audioBuffer : audioBufferB;

  // Error boundary and logging
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error caught:', event.error);
      console.error('Error message:', event.message);
      console.error('Filename:', event.filename);
      console.error('Line number:', event.lineno);
      console.error('Column number:', event.colno);
      console.error('Stack trace:', event.error?.stack);
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      console.error('Promise:', event.promise);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const synthRef = useRef(null);

  // Initialize Capacitor and synth with iOS fixes
  useEffect(() => {
    const initApp = async () => {
      try {
        // Set status bar style for mobile - handle errors gracefully
        if (Capacitor.isNativePlatform()) {
          try {
            await StatusBar.setStyle({ style: Style.Dark });
            console.log('Status bar style set successfully');
          } catch (statusError) {
            console.warn('StatusBar.setStyle not supported:', statusError);
          }

          try {
            await StatusBar.setBackgroundColor({ color: '#000000' });
            console.log('Status bar background color set successfully');
          } catch (bgError) {
            console.warn('StatusBar.setBackgroundColor not supported:', bgError);
          }

          // Handle app state changes
          CapApp.addListener('appStateChange', ({ isActive }) => {
            console.log('App state changed. Is active?', isActive);
          });
        }

        console.log('Creating AudioSynthesizer...');
        const synth = new AudioSynthesizer();
        
        // Don't await initialization here - let it happen on user interaction
        synthRef.current = synth;
        console.log('AudioSynthesizer created successfully');
        
        // Initialize on user interaction instead of immediately
        const handleFirstUserInteraction = async () => {
          console.log('First user interaction detected, initializing audio...');
          try {
            const initialized = await synth.initAudio();
            if (initialized) {
              console.log('Audio initialized successfully on user interaction');
            } else {
              console.warn('Audio initialization failed on user interaction');
            }
          } catch (error) {
            console.error('Error during audio initialization on user interaction:', error);
          }
          
          // Remove listeners after first interaction
          document.removeEventListener('touchstart', handleFirstUserInteraction);
          document.removeEventListener('click', handleFirstUserInteraction);
        };

        // Add listeners for first user interaction
        document.addEventListener('touchstart', handleFirstUserInteraction, { once: true, passive: true });
        document.addEventListener('click', handleFirstUserInteraction, { once: true });
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
  }, []);

  // Rest of the useEffect hooks remain the same...
  useEffect(() => {
    const loadFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const soundParam = urlParams.get('sound');

      if (soundParam) {
        console.log('Found sound parameter in URL:', soundParam);
        const decodedParams = decodeParams(soundParam);
        if (decodedParams) {
          console.log('Successfully decoded parameters:', decodedParams);
          setParams(decodedParams);

          setHistory(hist => [...hist, decodedParams]);
          setHistoryIndex(0);
        } else {
          console.error('Failed to decode parameters from URL');
        }
      }
    };

    const timer = setTimeout(loadFromURL, 100);
    return () => clearTimeout(timer);
  }, []);

  const loopIntervalRef = useRef(null);

  const updateParam = useCallback((param, value) => {
    if (lockedParams.has(param)) return;

    try {
      const setterFunction = activeSlot === 'A' ? setParams : setParamsB;
      setterFunction(prev => {
        const newParams = { ...prev };
        newParams[param] = value;

        setHistory(hist => [...hist.slice(0, historyIndex + 1), newParams]);
        setHistoryIndex(prevIndex => prevIndex + 1);

        return newParams;
      });
    } catch (error) {
      console.error('Error updating parameter:', param, value, error);
    }
  }, [lockedParams, activeSlot, historyIndex]);

  const redo = useCallback(() => {
    if (redoHistory.length > 0) {
      const nextParams = redoHistory[redoHistory.length - 1];
      setRedoHistory(prev => prev.slice(0, -1));

      if (activeSlot === 'A') {
        setParams(nextParams);
      } else {
        setParamsB(nextParams);
      }

      setHistory(hist => [...hist, nextParams]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [redoHistory, activeSlot]);

  const mutateParams = useCallback(() => {
    const currentParams = activeSlot === 'A' ? params : paramsB;
    const mutated = { ...currentParams };

    const paramKeys = Object.keys(mutated).filter(key => typeof mutated[key] === 'number');
    const numToMutate = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numToMutate; i++) {
      const randomKey = paramKeys[Math.floor(Math.random() * paramKeys.length)];
      const currentValue = mutated[randomKey];
      const mutationAmount = (Math.random() - 0.5) * 0.2;
      mutated[randomKey] = Math.max(-1, Math.min(1, currentValue + mutationAmount));
    }

    if (activeSlot === 'A') {
      setParams(mutated);
    } else {
      setParamsB(mutated);
    }

    setHistory(hist => [...hist.slice(0, historyIndex + 1), mutated]);
    setHistoryIndex(prev => prev + 1);
    setRedoHistory([]);

    // Add haptic feedback on mobile
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(e => {
        console.warn('Haptics not available:', e);
      });
    }
  }, [params, paramsB, activeSlot, historyIndex]);

  const generateShareLink = useCallback(async () => {
    const currentParams = activeSlot === 'A' ? params : paramsB;
    const encoded = encodeParams(currentParams);
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?sound=${encoded}`;
    setCurrentShareLink(shareUrl);

    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Share plugin on mobile
      try {
        await Share.share({
          title: 'CrispFXR Sound',
          text: 'Check out this sound I made with CrispFXR!',
          url: shareUrl,
          dialogTitle: 'Share your sound'
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Use clipboard on web
      try {
        await navigator.clipboard.writeText(shareUrl);
        console.log('Share link copied to clipboard:', shareUrl);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert(`Copy this link: ${shareUrl}`);
      }
    }
  }, [params, paramsB, activeSlot]);

  const copyParamsAsBase64 = useCallback(async () => {
    const currentParams = activeSlot === 'A' ? params : paramsB;
    const encoded = encodeParams(currentParams);

    if (Capacitor.isNativePlatform()) {
      // On mobile, use Share plugin
      try {
        await Share.share({
          title: 'CrispFXR Parameters',
          text: encoded,
          dialogTitle: 'Share parameters'
        });
      } catch (error) {
        console.error('Error sharing parameters:', error);
      }
    } else {
      // On web, use clipboard
      try {
        await navigator.clipboard.writeText(encoded);
        console.log('Parameters copied as base64');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }, [params, paramsB, activeSlot]);

  const toggleParamLock = useCallback((param) => {
    setLockedParams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(param)) {
        newSet.delete(param);
      } else {
        newSet.add(param);
      }
      return newSet;
    });
  }, []);

  const generateSound = useCallback(async () => {
    try {
      console.log('generateSound called, activeSlot:', activeSlot);

      if (!synthRef.current) {
        console.error('synthRef.current is null');
        return;
      }

      // Ensure audio is initialized before generating
      const initialized = await synthRef.current.ensureInitialized();
      if (!initialized) {
        console.error('Audio initialization failed, cannot generate sound');
        return;
      }

      let currentParams = activeSlot === 'A' ? params : paramsB;

      if (!currentParams) {
        console.warn('No currentParams, creating default');
        currentParams = new SynthParams();
      }

      currentParams.sample_rate = sampleRate;
      currentParams.sample_size = bitDepth;

      let validatedParams = Object.assign(new SynthParams(), currentParams);
      if (validatedParams.validate) {
        validatedParams = validatedParams.validate();
      }

      if (morphAmount > 0 && morphAmount < 1) {
        const sourceParams = activeSlot === 'A' ? params : paramsB;
        const targetParams = activeSlot === 'A' ? paramsB : params;

        if (sourceParams && targetParams) {
          console.log('Applying morphing, amount:', morphAmount);
          let sourceSynth = Object.assign(new SynthParams(), sourceParams);
          let targetSynth = Object.assign(new SynthParams(), targetParams);

          if (sourceSynth.validate) sourceSynth = sourceSynth.validate();
          if (targetSynth.validate) targetSynth = targetSynth.validate();

          validatedParams = sourceSynth.morphTo(targetSynth, morphAmount);
        }
      }

      console.log('About to generate buffer...');
      const buffer = await synthRef.current.generateBufferWithSettings(validatedParams, 1.5, sampleRate, bitDepth);

      if (!buffer) {
        console.error('Failed to generate buffer');
        return;
      }

      console.log('Buffer generated successfully:', buffer);

      setIsClipping(detectClipping(buffer));

      if (activeSlot === 'A') {
        setAudioBuffer(buffer);
      } else {
        setAudioBufferB(buffer);
      }
    } catch (error) {
      console.error('Error generating sound:', error);
      console.error('Stack trace:', error.stack);
    }
  }, [params, paramsB, activeSlot, morphAmount, sampleRate, bitDepth]);

  // Generate sound when parameters change - FIXED dependencies
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateSound();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [params, paramsB, activeSlot, morphAmount, sampleRate, bitDepth, generateSound]);

  const playSound = useCallback(async (slot = activeSlot) => {
    const buffer = slot === 'A' ? audioBuffer : audioBufferB;
    if (!buffer || !synthRef.current) {
      console.log('No buffer or synth available for playback');
      return;
    }

    try {
      setIsPlaying(true);
      await synthRef.current.playBuffer(buffer);
      setTimeout(() => setIsPlaying(false), 1500);

      // Add haptic feedback on mobile
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Medium }).catch(e => {
          console.warn('Haptics not available:', e);
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      setIsPlaying(false);
    }
  }, [audioBuffer, audioBufferB, activeSlot]);

  const loadPreset = useCallback((presetName) => {
    const newParams = new SynthParams();
    newParams[presetName]();

    if (activeSlot === 'A') {
      setParams(newParams);
    } else {
      setParamsB(newParams);
    }

    setHistory(hist => [...hist.slice(0, historyIndex + 1), newParams]);
    setHistoryIndex(prevIndex => prevIndex + 1);

    // Add haptic feedback on mobile
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(e => {
        console.warn('Haptics not available:', e);
      });
    }
  }, [activeSlot, historyIndex]);

  const copySlot = useCallback(async () => {
    if (activeSlot === 'A') {
      setParamsB({ ...params });
      console.log('Copied Slot A to Slot B');
      // Generate audio for slot B immediately
      setActiveSlot('B');
      setTimeout(() => generateSound(), 100);
    } else {
      setParams({ ...paramsB });
      console.log('Copied Slot B to Slot A');
      // Generate audio for slot A immediately  
      setActiveSlot('A');
      setTimeout(() => generateSound(), 100);
    }
    
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(e => {
        console.warn('Haptics not available:', e);
      });
    }
  }, [params, paramsB, activeSlot, generateSound]);

  const morphSlots = useCallback(() => {
    const sourceParams = activeSlot === 'A' ? params : paramsB;
    const targetParams = activeSlot === 'A' ? paramsB : params;

    const sourceSynth = Object.assign(new SynthParams(), sourceParams);
    const targetSynth = Object.assign(new SynthParams(), targetParams);
    const morphed = sourceSynth.morphTo(targetSynth, 0.5);

    if (activeSlot === 'A') {
      setParams(morphed);
    } else {
      setParamsB(morphed);
    }
  }, [params, paramsB, activeSlot]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousParams = history[historyIndex - 1];
      if (activeSlot === 'A') {
        setParams(previousParams);
      } else {
        setParamsB(previousParams);
      }
    }
  }, [history, historyIndex, activeSlot]);

  const toggleLoop = useCallback(() => {
    if (isLooping) {
      clearInterval(loopIntervalRef.current);
      setIsLooping(false);
    } else {
      setIsLooping(true);
      loopIntervalRef.current = setInterval(() => {
        playSound();
      }, 2000);
    }
  }, [isLooping, playSound]);

  const getParameterSuggestion = (param, waveType) => {
    const suggestions = {
      [SQUARE]: {
        p_duty: "Try 0.1-0.9 for different timbres",
        p_duty_ramp: "Sweep for filter-like effects"
      },
      [SINE]: {
        fm_freq: "Add harmonics with FM",
        p_vib_speed: "Natural vibrato at 4-6Hz"
      },
      [NOISE]: {
        p_lpf_freq: "Essential for shaping noise",
        p_hpf_freq: "Remove unwanted low-end"
      }
    };

    return suggestions[waveType]?.[param] || null;
  };

  const exportSound = useCallback(async () => {
    const buffer = activeSlot === 'A' ? audioBuffer : audioBufferB;
    const currentParams = activeSlot === 'A' ? params : paramsB;

    if (!buffer) return;

    if (exportFormat === 'wav') {
      const wavBlob = audioBufferToWav(buffer, sampleRate, bitDepth);

      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Filesystem to save on mobile
        try {
          const reader = new FileReader();
          reader.onload = async function() {
            const base64Data = reader.result.split(',')[1]; // Remove data:audio/wav;base64, prefix

            const fileName = `crispfxr-sound-${activeSlot}-${sampleRate}hz-${bitDepth}bit-${Date.now()}.wav`;

            await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents
            });

            console.log('File saved to Documents:', fileName);

            // Share the file
            await Share.share({
              title: 'CrispFXR Sound Export',
              text: 'Exported sound from CrispFXR',
              url: fileName
            });
          };
          reader.readAsDataURL(wavBlob);
        } catch (error) {
          console.error('Error saving file:', error);
        }
      } else {
        // Use browser download on web
        downloadBlob(wavBlob, `crispfxr-sound-${activeSlot}-${sampleRate}hz-${bitDepth}bit-${Date.now()}.wav`);
      }
    } else if (exportFormat === 'json') {
      const jsonData = JSON.stringify(currentParams, null, 2);

      if (Capacitor.isNativePlatform()) {
        try {
          const fileName = `crispfxr-preset-${activeSlot}-${Date.now()}.json`;

          await Filesystem.writeFile({
            path: fileName,
            data: jsonData,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
          });

          console.log('Preset saved to Documents:', fileName);

          await Share.share({
            title: 'CrispFXR Preset Export',
            text: 'Exported preset from CrispFXR',
            url: fileName
          });
        } catch (error) {
          console.error('Error saving preset:', error);
        }
      } else {
        const jsonBlob = new Blob([jsonData], { type: 'application/json' });
        downloadBlob(jsonBlob, `crispfxr-preset-${activeSlot}-${Date.now()}.json`);
      }
    }
  }, [audioBuffer, audioBufferB, exportFormat, params, paramsB, activeSlot, sampleRate, bitDepth]);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importPreset = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const preset = JSON.parse(e.target.result);
        if (activeSlot === 'A') {
          setParams(preset);
        } else {
          setParamsB(preset);
        }
      } catch (error) {
        alert('Invalid preset file');
      }
    };
    reader.readAsText(file);
  }, [activeSlot]);

  // Update master volume
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.setMasterVolume(masterVolume);
    }
  }, [masterVolume]);

  // Generate sound when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(generateSound, 100);
    return () => clearTimeout(timeoutId);
  }, [generateSound]);

  // Cleanup loop on unmount
  useEffect(() => {
    return () => {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
          break;
        case 'm':
          e.preventDefault();
          mutateParams();
          break;
        case 's':
          e.preventDefault();
          generateShareLink();
          break;
        default:
          break;
      }
      } else {
        switch (e.key) {
          case ' ':
            e.preventDefault();
            playSound();
            break;
          case 'n':
            setShowNumericInputs(!showNumericInputs);
            break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
            const presetIndex = parseInt(e.key) - 1;
            const presetNames = ['pickupCoin', 'laserShoot', 'explosion', 'powerUp', 'hitHurt', 'jump', 'ambient', 'random'];
            if (presetNames[presetIndex]) {
              loadPreset(presetNames[presetIndex]);
            }
            break;
          case '9':
            loadPreset('blip');
            break;
          case 'q':
            loadPreset('zap');
            break;
          case 'w':
            loadPreset('woosh');
            break;
          case 'e':
            loadPreset('drone');
            break;
          case 'r':
            loadPreset('click');
            break;
          case 't':
            loadPreset('glitch');
            break;
          case 'y':
            loadPreset('portal');
            break;
          case 'u':
            loadPreset('warning');
            break;
          case 'a':
            setActiveSlot('A');
            break;
          case 'b':
            setActiveSlot('B');
            break;
          case 'l':
            toggleLoop();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [undo, redo, playSound, loadPreset, toggleLoop, mutateParams, generateShareLink, showNumericInputs]);

  // Info button handler
  const [showInfo, setShowInfo] = useState(false);
  
  const handleInfoClick = () => {
    setShowInfo(!showInfo);
  };

  const presets = [
    { name: 'pickupCoin', label: 'Pickup (1)', color: 'bg-yellow-500', emoji: '💰' },
    { name: 'laserShoot', label: 'Laser (2)', color: 'bg-red-500', emoji: '🔫' },
    { name: 'explosion', label: 'Explosion (3)', color: 'bg-orange-500', emoji: '💥' },
    { name: 'powerUp', label: 'PowerUp (4)', color: 'bg-green-500', emoji: '⚡' },
    { name: 'hitHurt', label: 'Hit (5)', color: 'bg-purple-500', emoji: '💢' },
    { name: 'jump', label: 'Jump (6)', color: 'bg-blue-500', emoji: '🦘' },
    { name: 'ambient', label: 'Ambient (7)', color: 'bg-teal-500', emoji: '🌊' },
    { name: 'random', label: 'Random (8)', color: 'bg-gray-500', emoji: '🎲' },
    { name: 'blip', label: 'Blip (9)', color: 'bg-cyan-400', emoji: '📍' },
    { name: 'zap', label: 'Zap (Q)', color: 'bg-lime-400', emoji: '⚡' },
    { name: 'woosh', label: 'Woosh (W)', color: 'bg-indigo-500', emoji: '💨' },
    { name: 'drone', label: 'Drone (E)', color: 'bg-pink-500', emoji: '🎵' },
    { name: 'click', label: 'Click (R)', color: 'bg-amber-500', emoji: '👆' },
    { name: 'glitch', label: 'Glitch (T)', color: 'bg-fuchsia-500', emoji: '📟' },
    { name: 'portal', label: 'Portal (Y)', color: 'bg-emerald-500', emoji: '🌀' },
    { name: 'warning', label: 'Warning (U)', color: 'bg-red-700', emoji: '⚠️' }
  ];

  const waveTypes = ['Square', 'Sawtooth', 'Sine', 'Noise'];
  const noiseTypes = ['White', 'Pink', 'Brown'];

  return (
  
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Interface */}
        <div className="block lg:hidden">
          {/* Title */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center mb-3">
            CrispFXR
          </h1>

          {/* Volume & Morph - FIXED draggable sliders */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-800/50 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Headphones className="w-3 h-3" />
                  <span className="text-xs">Vol:</span>
                </div>
                <span className="text-xs">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={masterVolume} 
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))} 
                className="w-full slider"
              />
            </div>
            <div className="bg-gray-800/50 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Morph:</span>
                <span className="text-xs">{Math.round(morphAmount * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={morphAmount} 
                onChange={(e) => setMorphAmount(parseFloat(e.target.value))} 
                className="w-full slider"
              />
            </div>
          </div>

          {/* Slot Controls - FIXED Copy button */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => setActiveSlot('A')} className={`py-3 rounded text-xs font-semibold ${activeSlot === 'A' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              Slot A
            </button>
            <button onClick={copySlot} className="py-3 bg-gray-600 hover:bg-gray-500 rounded text-xs font-semibold">
              <Copy className="w-3 h-3 inline mr-1" />Copy
            </button>
            <button onClick={() => setActiveSlot('B')} className={`py-3 rounded text-xs font-semibold ${activeSlot === 'B' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              Slot B
            </button>
          </div>

          {/* Waveforms A & B with info icons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-900/50 backdrop-blur rounded border border-gray-700 p-2 relative group">
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <ParameterInfo {...parameterInfo.waveform} />
              </div>
              <WaveformDisplay
                audioBuffer={audioBuffer}
                isPlaying={isPlaying && activeSlot === 'A'}
                title="Slot A"
              />
            </div>
            <div className="bg-gray-900/50 backdrop-blur rounded border border-gray-700 p-2 relative group">
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <ParameterInfo {...parameterInfo.waveform} />
              </div>
              <WaveformDisplay
                audioBuffer={audioBufferB}
                isPlaying={isPlaying && activeSlot === 'B'}
                title="Slot B"
              />
            </div>
          </div>

          {/* Play and Export Buttons - FIXED inline text */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button onClick={() => playSound('A')} disabled={!audioBuffer} className={`py-3 rounded text-xs font-semibold ${!audioBuffer ? 'bg-gray-700' : 'bg-green-600'}`}>
              <Play className="w-3 h-3 inline mr-1" />Play A
            </button>
            <button onClick={toggleLoop} className={`py-3 rounded text-xs font-semibold ${isLooping ? 'bg-red-600' : 'bg-gray-600'}`}>
              {isLooping ? <PauseCircle className="w-3 h-3 inline mr-1" /> : <Repeat className="w-3 h-3 inline mr-1" />}Loop
            </button>
            <button onClick={() => playSound('B')} disabled={!audioBufferB} className={`py-3 rounded text-xs font-semibold ${!audioBufferB ? 'bg-gray-700' : 'bg-emerald-600'}`}>
              <Play className="w-3 h-3 inline mr-1" />Play B
            </button>
            <button onClick={exportSound} disabled={!currentBuffer} className="py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded text-xs font-semibold">
              <Download className="w-3 h-3 inline mr-1" />Export
            </button>
          </div>

          {/* Presets - Mobile */}
          <div className="bg-gray-900/50 backdrop-blur rounded border border-gray-700 p-2 mb-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Presets
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {presets.slice(0, 8).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset.name)}
                  className={`p-2 ${preset.color} hover:opacity-80 rounded transition-all text-xs font-semibold preset-btn`}
                >
                  <div className="text-sm">{preset.emoji}</div>
                  <div className="text-xs leading-tight">{preset.label.split(' ')[0]}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {presets.slice(8).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset.name)}
                  className={`p-2 ${preset.color} hover:opacity-80 rounded transition-all text-xs font-semibold preset-btn`}
                >
                  <div className="text-sm">{preset.emoji}</div>
                  <div className="text-xs leading-tight">{preset.label.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Visualizations - Clean titles with small info buttons */}
          <div className="grid grid-cols-3 gap-1 mb-3">
            <div className="bg-gray-900/50 backdrop-blur rounded border border-gray-700 p-1 relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-white leading-tight">Spectrum</h3>
                <ParameterInfo {...parameterInfo.spectrum} />
              </div>
              <SpectrumAnalyzer audioBuffer={currentBuffer} />
            </div>
            <div className="bg-gray-900/50 backdrop-blur rounded border border-gray-700 p-1 relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-white leading-tight">Level</h3>
                <ParameterInfo {...parameterInfo.amplitudeMeter} />
              </div>
              <AmplitudeMeter audioBuffer={currentBuffer} />
            </div>
            <div className="bg-gray-900/50 backdrop-blur rounded border border-gray-700 p-1 relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-white leading-tight">Envelope</h3>
                <ParameterInfo {...parameterInfo.amplitudeEnvelope} />
              </div>
              <AmplitudeEnvelope audioBuffer={currentBuffer} />
            </div>
          </div>

          {/* Audio Quality - FIXED clipping detection */}
          <div className="bg-gray-900/50 backdrop-blur rounded border border-gray-700 p-2 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Audio Quality</h3>
              <button 
                onClick={async () => {
                  console.log('CLIP button clicked - regenerating audio');
                  await generateSound();
                  // Force check after generation completes
                  setTimeout(() => {
                    const buffer = activeSlot === 'A' ? audioBuffer : audioBufferB;
                    if (buffer) {
                      const clipping = detectClipping(buffer, 0.95);
                      setIsClipping(clipping);
                      console.log('Clipping detected:', clipping);
                    }
                  }, 200);
                }}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all cursor-pointer hover:opacity-80 ${
                  isClipping 
                    ? 'bg-red-600 text-white animate-pulse shadow-lg' 
                    : 'bg-green-700 text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  isClipping ? 'bg-white animate-pulse' : 'bg-green-300'
                }`}></div>
                <span className="font-bold">{isClipping ? 'CLIP!' : 'OK'}</span>
              </button>
            </div>
          
          {/* Rest stays the same */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs font-medium text-white w-8">Rate:</span>
            <div className="flex gap-1 flex-1">
              {[44100, 22050, 11025, 8000].map(rate => (
                <button
                  key={rate}
                  onClick={() => setSampleRate(rate)}
                  className={`px-1 py-1 rounded text-xs transition-colors flex-1 ${
                    sampleRate === rate ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {rate >= 1000 ? `${Math.round(rate/1000)}K` : `${rate}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-white w-8">Bits:</span>
            <div className="flex gap-1 flex-1">
              {[16, 8].map(bits => (
                <button
                  key={bits}
                  onClick={() => setBitDepth(bits)}
                  className={`px-2 py-1 rounded text-xs transition-colors flex-1 ${
                    bitDepth === bits ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {bits}bit
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Parameter Controls */}
        <div className="bg-gray-900/50 backdrop-blur rounded border border-gray-700 p-2">
          {/* Tabs - FORCE horizontal with CSS class */}
          <div className="flex items-center gap-2 mb-2 tabs-container">
            <div className="flex bg-gray-800/50 p-1 rounded flex-1">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-2 py-1 rounded transition-colors text-xs flex-1 ${
                  activeTab === 'basic' ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => setActiveTab('envelope')}
                className={`px-2 py-1 rounded transition-colors text-xs flex-1 ${
                  activeTab === 'envelope' ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                Env
              </button>
              <button
                onClick={() => setActiveTab('effects')}
                className={`px-2 py-1 rounded transition-colors text-xs flex-1 ${
                  activeTab === 'effects' ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                FX
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`px-2 py-1 rounded transition-colors text-xs flex-1 ${
                  activeTab === 'advanced' ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                Adv
              </button>
            </div>
            <button
              onClick={() => setShowNumericInputs(!showNumericInputs)}
              className={`px-2 py-1 rounded transition-colors text-xs ${
                showNumericInputs ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {showNumericInputs ? '123' : '━'}
            </button>
          </div>

          {/* Parameter content - 2 sliders per row */}
          {activeTab === 'basic' && (
            <div className="space-y-2">
              <div className="bg-gray-800/50 rounded p-2">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-blue-300">Waveform</h4>
                  <ParameterInfo {...parameterInfo.waveformType} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {waveTypes.map((wave, idx) => (
                    <label key={wave} className="flex flex-col items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={currentParams.wave_type === idx}
                        onChange={() => updateParam('wave_type', idx)}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-white">{wave}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput
                      label="Base Freq"
                      value={currentParams.p_base_freq}
                      onChange={(v) => updateParam('p_base_freq', v)}
                      min={0} max={2}
                    />
                    <NumericInput
                      label="Freq Ramp"
                      value={currentParams.p_freq_ramp}
                      onChange={(v) => updateParam('p_freq_ramp', v)}
                      min={-1} max={1}
                    />
                  </>
                ) : (
                  <>
                    <ParamSlider
                      label="Base Freq"
                      value={currentParams.p_base_freq}
                      onChange={(v) => updateParam('p_base_freq', v)}
                      min={0} max={2}
                      info={parameterInfo.p_base_freq}
                    />
                    <ParamSlider
                      label="Freq Ramp"
                      value={currentParams.p_freq_ramp}
                      onChange={(v) => updateParam('p_freq_ramp', v)}
                      min={-1} max={1}
                      info={parameterInfo.p_freq_ramp}
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput
                      label="Freq Floor"
                      value={currentParams.p_freq_limit}
                      onChange={(v) => updateParam('p_freq_limit', v)}
                      min={0} max={1}
                    />
                    <NumericInput
                      label="Retrigger"
                      value={currentParams.p_repeat_speed}
                      onChange={(v) => updateParam('p_repeat_speed', v)}
                      min={0} max={1}
                    />
                  </>
                ) : (
                  <>
                    <ParamSlider
                      label="Freq Floor"
                      value={currentParams.p_freq_limit}
                      onChange={(v) => updateParam('p_freq_limit', v)}
                      min={0} max={1}
                      info={parameterInfo.p_freq_limit}
                    />
                    <ParamSlider
                      label="Retrigger"
                      value={currentParams.p_repeat_speed}
                      onChange={(v) => updateParam('p_repeat_speed', v)}
                      min={0} max={1}
                      info={parameterInfo.p_repeat_speed}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'envelope' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="Attack" value={currentParams.p_env_attack} onChange={(v) => updateParam('p_env_attack', v)} />
                    <NumericInput label="Sustain" value={currentParams.p_env_sustain} onChange={(v) => updateParam('p_env_sustain', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="Attack" value={currentParams.p_env_attack} onChange={(v) => updateParam('p_env_attack', v)} info={parameterInfo.p_env_attack} />
                    <ParamSlider label="Sustain" value={currentParams.p_env_sustain} onChange={(v) => updateParam('p_env_sustain', v)} info={parameterInfo.p_env_sustain} />
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="Decay" value={currentParams.p_env_decay} onChange={(v) => updateParam('p_env_decay', v)} />
                    <NumericInput label="Punch" value={currentParams.p_env_punch} onChange={(v) => updateParam('p_env_punch', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="Decay" value={currentParams.p_env_decay} onChange={(v) => updateParam('p_env_decay', v)} info={parameterInfo.p_env_decay} />
                    <ParamSlider label="Punch" value={currentParams.p_env_punch} onChange={(v) => updateParam('p_env_punch', v)} info={parameterInfo.p_env_punch} />
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="Vib Speed" value={currentParams.p_vib_speed} onChange={(v) => updateParam('p_vib_speed', v)} />
                    <NumericInput label="Vib Depth" value={currentParams.p_vib_strength} onChange={(v) => updateParam('p_vib_strength', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="Vib Speed" value={currentParams.p_vib_speed} onChange={(v) => updateParam('p_vib_speed', v)} info={parameterInfo.p_vib_speed} />
                    <ParamSlider label="Vib Depth" value={currentParams.p_vib_strength} onChange={(v) => updateParam('p_vib_strength', v)} info={parameterInfo.p_vib_strength} />
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="Distortion" value={currentParams.distortion} onChange={(v) => updateParam('distortion', v)} />
                    <NumericInput label="Bit Crush" value={currentParams.bit_crush} onChange={(v) => updateParam('bit_crush', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="Distortion" value={currentParams.distortion} onChange={(v) => updateParam('distortion', v)} info={parameterInfo.distortion} />
                    <ParamSlider label="Bit Crush" value={currentParams.bit_crush} onChange={(v) => updateParam('bit_crush', v)} info={parameterInfo.bit_crush} />
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="Low Pass" value={currentParams.p_lpf_freq} onChange={(v) => updateParam('p_lpf_freq', v)} />
                    <NumericInput label="High Pass" value={currentParams.p_hpf_freq} onChange={(v) => updateParam('p_hpf_freq', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="Low Pass" value={currentParams.p_lpf_freq} onChange={(v) => updateParam('p_lpf_freq', v)} info={parameterInfo.p_lpf_freq} />
                    <ParamSlider label="High Pass" value={currentParams.p_hpf_freq} onChange={(v) => updateParam('p_hpf_freq', v)} info={parameterInfo.p_hpf_freq} />
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="Chorus" value={currentParams.chorus_rate} onChange={(v) => updateParam('chorus_rate', v)} />
                    <NumericInput label="Delay" value={currentParams.delay_time} onChange={(v) => updateParam('delay_time', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="Chorus" value={currentParams.chorus_rate} onChange={(v) => updateParam('chorus_rate', v)} info={parameterInfo.chorus_rate} />
                    <ParamSlider label="Delay" value={currentParams.delay_time} onChange={(v) => updateParam('delay_time', v)} info={parameterInfo.delay_time} />
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="FM Freq" value={currentParams.fm_freq} onChange={(v) => updateParam('fm_freq', v)} />
                    <NumericInput label="FM Depth" value={currentParams.fm_depth} onChange={(v) => updateParam('fm_depth', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="FM Freq" value={currentParams.fm_freq} onChange={(v) => updateParam('fm_freq', v)} info={parameterInfo.fm_freq} />
                    <ParamSlider label="FM Depth" value={currentParams.fm_depth} onChange={(v) => updateParam('fm_depth', v)} info={parameterInfo.fm_depth} />
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="Ring Freq" value={currentParams.ring_mod_freq} onChange={(v) => updateParam('ring_mod_freq', v)} />
                    <NumericInput label="Ring Depth" value={currentParams.ring_mod_depth} onChange={(v) => updateParam('ring_mod_depth', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="Ring Freq" value={currentParams.ring_mod_freq} onChange={(v) => updateParam('ring_mod_freq', v)} info={parameterInfo.ring_mod_freq} />
                    <ParamSlider label="Ring Depth" value={currentParams.ring_mod_depth} onChange={(v) => updateParam('ring_mod_depth', v)} info={parameterInfo.ring_mod_depth} />
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {showNumericInputs ? (
                  <>
                    <NumericInput label="Feedback" value={currentParams.delay_feedback} onChange={(v) => updateParam('delay_feedback', v)} />
                    <NumericInput label="Volume" value={currentParams.sound_vol} onChange={(v) => updateParam('sound_vol', v)} />
                  </>
                ) : (
                  <>
                    <ParamSlider label="Feedback" value={currentParams.delay_feedback} onChange={(v) => updateParam('delay_feedback', v)} info={parameterInfo.delay_feedback} />
                    <ParamSlider label="Volume" value={currentParams.sound_vol} onChange={(v) => updateParam('sound_vol', v)} info={parameterInfo.sound_vol} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* ------------------- DESKTOP SECTION STARTS HERE ------------------- */}
        {/* Single Desktop UI Wrapper */}
        <div className="hidden lg:block">

          {/* Desktop Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              CrispFXR
            </h1>
            <p className="text-gray-400 text-lg">Advanced 8-bit Sound Synthesizer</p>

            {/* Desktop Controls */}
            <div className="flex justify-center items-center gap-6 mt-6 mb-4">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-gray-400" />
                <input type="range" min="0" max="1" step="0.1" value={masterVolume} onChange={(e) => setMasterVolume(parseFloat(e.target.value))} className="w-20 slider" />
                <span className="text-xs text-white bg-gray-800 px-2 py-1 rounded w-12 text-center">{Math.round(masterVolume * 100)}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setActiveSlot('A')} className={`px-4 py-2 rounded-lg transition-colors ${activeSlot === 'A' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Slot A</button>
                <button onClick={copySlot} className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
                <button onClick={morphSlots} className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"><Shuffle className="w-4 h-4" /></button>
                <button onClick={() => setActiveSlot('B')} className={`px-4 py-2 rounded-lg transition-colors ${activeSlot === 'B' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Slot B</button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Morph:</span>
                <input type="range" min="0" max="1" step="0.01" value={morphAmount} onChange={(e) => setMorphAmount(parseFloat(e.target.value))} className="w-20 slider" />
                <span className="text-xs text-white bg-gray-800 px-2 py-1 rounded w-12 text-center">{Math.round(morphAmount * 100)}%</span>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => playSound('A')} disabled={!audioBuffer} className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 font-semibold">
                <Play className="w-5 h-5" />Play A
              </button>
              <button onClick={() => playSound('B')} disabled={!audioBufferB} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 font-semibold">
                <Play className="w-5 h-5" />Play B
              </button>
              <button onClick={toggleLoop} className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold ${isLooping ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                {isLooping ? <PauseCircle className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}{isLooping ? 'Stop Loop' : 'Loop'}
              </button>
              <button onClick={mutateParams} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2 font-semibold">
                <Shuffle className="w-5 h-5" />Mutate
              </button>
            </div>
          </div>

          {/* Presets - Desktop */}
          <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 lg:p-6 mb-6 lg:mb-8">
            <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 flex items-center gap-2">
              <Zap className="w-5 lg:w-6 h-5 lg:h-6" />
              Sound Presets
            </h3>
            <div className="grid grid-cols-8 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset.name)}
                  className={`p-4 ${preset.color} hover:opacity-80 rounded-lg transition-all transform hover:scale-105 text-sm font-semibold shadow-lg flex flex-col items-center gap-0`}
                >
                  <span className="text-lg">{preset.emoji}</span>
                  <span className="text-sm">{preset.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visualization Section - Desktop */}
          <div className="mb-6 lg:mb-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-4">
              <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 lg:p-6">
                <WaveformDisplay
                  audioBuffer={audioBuffer}
                  isPlaying={isPlaying && activeSlot === 'A'}
                  title="Waveform A"
                />
              </div>
              <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 lg:p-6">
                <WaveformDisplay
                  audioBuffer={audioBufferB}
                  isPlaying={isPlaying && activeSlot === 'B'}
                  title="Waveform B"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 lg:p-6">
                <SpectrumAnalyzer audioBuffer={currentBuffer} />
              </div>
              <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 lg:p-6">
                <AmplitudeMeter audioBuffer={currentBuffer} />
              </div>
              <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 lg:p-6">
                <AmplitudeEnvelope audioBuffer={currentBuffer} />
              </div>
            </div>
          </div>

          {/* Audio Quality & Export Controls - Desktop */}
          <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 lg:p-6 mb-6 lg:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Audio Quality</h3>
                  <button
                    className={`flex items-center gap-2 rounded px-3 py-1 text-sm ${
                      isClipping ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded ${isClipping ? 'bg-white' : 'bg-gray-500'}`}></div>
                    Clip
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white w-16">Rate:</span>
                    <div className="flex gap-1 flex-1">
                      {[44100, 22050, 11025, 8000].map(rate => (
                        <button
                          key={rate}
                          onClick={() => setSampleRate(rate)}
                          className={`px-2 py-1 rounded text-sm transition-colors flex-1 ${
                            sampleRate === rate ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {rate >= 1000 ? `${Math.round(rate/1000)}K` : `${rate}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white w-16">Bits:</span>
                    <div className="flex gap-1 flex-1">
                      {[16, 8].map(bits => (
                        <button
                          key={bits}
                          onClick={() => setBitDepth(bits)}
                          className={`px-3 py-1 rounded text-sm transition-colors flex-1 ${
                            bitDepth === bits ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {bits} bit
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Format and Import in one row */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Export & Import</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                    >
                      <option value="wav">WAV Audio</option>
                      <option value="json">JSON Preset</option>
                    </select>
                  </div>
                  <div>
                    <button onClick={exportSound} disabled={!currentBuffer} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded transition-colors flex items-center gap-2 font-semibold justify-center">
                      <Download className="w-4 h-4" />Export {activeSlot}
                    </button>
                  </div>
                  {!Capacitor.isNativePlatform() && (
                    <div className="mt-3">
                      <input type="file" accept=".json" onChange={importPreset} className="hidden" id="preset-import-desktop" />
                      <label htmlFor="preset-import-desktop" className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors flex items-center gap-2 font-semibold cursor-pointer justify-center">
                        <Download className="w-4 h-4 rotate-180" />Import Preset
                      </label>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Parameter Controls - Desktop */}
          <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg overflow-x-auto flex-1 mr-2">
                {[
                  { id: 'basic', label: 'Basic', icon: Settings },
                  { id: 'envelope', label: 'Envelope', icon: Activity },
                  { id: 'effects', label: 'Effects', icon: Zap },
                  { id: 'advanced', label: 'Advanced', icon: Volume2 }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 rounded transition-colors flex items-center gap-2 whitespace-nowrap flex-1 lg:flex-none ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => setShowNumericInputs(!showNumericInputs)}
                  className={`px-2 py-2 rounded transition-colors text-xs ${
                    showNumericInputs ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {showNumericInputs ? '123' : '━'}
                </button>
              </div>
            </div>

            {/* Desktop Parameter Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {activeTab === 'basic' && (
                <>
                  <div className="bg-gray-800/50 rounded-lg p-4 col-span-full">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold text-blue-300">Waveform Type</h4>
                      <ParameterInfo {...parameterInfo.waveformType} />
                    </div>
                    <div className="flex flex-wrap gap-4 mb-4">
                      {waveTypes.map((wave, idx) => (
                        <label key={wave} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={currentParams.wave_type === idx}
                            onChange={() => updateParam('wave_type', idx)}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-white">{wave}</span>
                        </label>
                      ))}
                    </div>

                    {currentParams.wave_type === NOISE && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold text-purple-400">Noise Type</h4>
                          <ParameterInfo {...parameterInfo.noiseType} />
                        </div>
                        <div className="flex gap-4">
                          {noiseTypes.map((noise, idx) => (
                            <label key={noise} className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="radio"
                                checked={currentParams.noise_type === idx}
                                onChange={() => updateParam('noise_type', idx)}
                                className="text-purple-600"
                              />
                              <span className="text-white">{noise}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {showNumericInputs ? (
                    <>
                      <NumericInput
                        label="Base Frequency"
                        value={currentParams.p_base_freq}
                        onChange={(v) => updateParam('p_base_freq', v)}
                        min={0} max={2}
                      />
                      <NumericInput
                        label="Frequency Ramp"
                        value={currentParams.p_freq_ramp}
                        onChange={(v) => updateParam('p_freq_ramp', v)}
                        min={-1} max={1}
                      />
                      <NumericInput
                        label="Frequency Floor"
                        value={currentParams.p_freq_limit}
                        onChange={(v) => updateParam('p_freq_limit', v)}
                        min={0} max={1}
                      />
                      <NumericInput
                        label="Delta Slide"
                        value={currentParams.p_freq_dramp}
                        onChange={(v) => updateParam('p_freq_dramp', v)}
                        min={-1} max={1}
                      />
                      <NumericInput
                        label="Retrigger Rate"
                        value={currentParams.p_repeat_speed}
                        onChange={(v) => updateParam('p_repeat_speed', v)}
                        min={0} max={1}
                      />
                    </>
                  ) : (
                    <>
                      <ParamSlider
                        label="Base Frequency"
                        value={currentParams.p_base_freq}
                        onChange={(v) => updateParam('p_base_freq', v)}
                        min={0} max={2}
                        info={parameterInfo.p_base_freq}
                      />
                      <ParamSlider
                        label="Frequency Ramp"
                        value={currentParams.p_freq_ramp}
                        onChange={(v) => updateParam('p_freq_ramp', v)}
                        min={-1} max={1}
                        info={parameterInfo.p_freq_ramp}
                      />
                      <ParamSlider
                        label="Frequency Floor"
                        value={currentParams.p_freq_limit}
                        onChange={(v) => updateParam('p_freq_limit', v)}
                        min={0} max={1}
                        info={parameterInfo.p_freq_limit}
                      />
                      <ParamSlider
                        label="Delta Slide"
                        value={currentParams.p_freq_dramp}
                        onChange={(v) => updateParam('p_freq_dramp', v)}
                        min={-1} max={1}
                        info={parameterInfo.p_freq_dramp}
                      />
                      <ParamSlider
                        label="Retrigger Rate"
                        value={currentParams.p_repeat_speed}
                        onChange={(v) => updateParam('p_repeat_speed', v)}
                        min={0} max={1}
                        info={parameterInfo.p_repeat_speed}
                      />
                    </>
                  )}
                </>
              )}

              {activeTab === 'envelope' && (
                <>
                  {showNumericInputs ? (
                    <>
                      <NumericInput
                        label="Attack Time"
                        value={currentParams.p_env_attack}
                        onChange={(v) => updateParam('p_env_attack', v)}
                      />
                      <NumericInput
                        label="Sustain Time"
                        value={currentParams.p_env_sustain}
                        onChange={(v) => updateParam('p_env_sustain', v)}
                      />
                      <NumericInput
                        label="Decay Time"
                        value={currentParams.p_env_decay}
                        onChange={(v) => updateParam('p_env_decay', v)}
                      />
                      <NumericInput
                        label="Sustain Punch"
                        value={currentParams.p_env_punch}
                        onChange={(v) => updateParam('p_env_punch', v)}
                      />
                      <NumericInput
                        label="Vibrato Speed"
                        value={currentParams.p_vib_speed}
                        onChange={(v) => updateParam('p_vib_speed', v)}
                      />
                      <NumericInput
                        label="Vibrato Depth"
                        value={currentParams.p_vib_strength}
                        onChange={(v) => updateParam('p_vib_strength', v)}
                      />
                    </>
                  ) : (
                    <>
                      <ParamSlider
                        label="Attack Time"
                        value={currentParams.p_env_attack}
                        onChange={(v) => updateParam('p_env_attack', v)}
                        info={parameterInfo.p_env_attack}
                      />
                      <ParamSlider
                        label="Sustain Time"
                        value={currentParams.p_env_sustain}
                        onChange={(v) => updateParam('p_env_sustain', v)}
                        info={parameterInfo.p_env_sustain}
                      />
                      <ParamSlider
                        label="Decay Time"
                        value={currentParams.p_env_decay}
                        onChange={(v) => updateParam('p_env_decay', v)}
                        info={parameterInfo.p_env_decay}
                      />
                      <ParamSlider
                        label="Sustain Punch"
                        value={currentParams.p_env_punch}
                        onChange={(v) => updateParam('p_env_punch', v)}
                        info={parameterInfo.p_env_punch}
                      />
                      <ParamSlider
                        label="Vibrato Speed"
                        value={currentParams.p_vib_speed}
                        onChange={(v) => updateParam('p_vib_speed', v)}
                        info={parameterInfo.p_vib_speed}
                      />
                      <ParamSlider
                        label="Vibrato Depth"
                        value={currentParams.p_vib_strength}
                        onChange={(v) => updateParam('p_vib_strength', v)}
                        info={parameterInfo.p_vib_strength}
                      />
                    </>
                  )}
                </>
              )}

              {activeTab === 'effects' && (
                <>
                  {showNumericInputs ? (
                    <>
                      <NumericInput
                        label="Distortion"
                        value={currentParams.distortion}
                        onChange={(v) => updateParam('distortion', v)}
                      />
                      <NumericInput
                        label="Bit Crush"
                        value={currentParams.bit_crush}
                        onChange={(v) => updateParam('bit_crush', v)}
                      />
                      <NumericInput
                        label="Low-pass Filter"
                        value={currentParams.p_lpf_freq}
                        onChange={(v) => updateParam('p_lpf_freq', v)}
                      />
                      <NumericInput
                        label="High-pass Filter"
                        value={currentParams.p_hpf_freq}
                        onChange={(v) => updateParam('p_hpf_freq', v)}
                      />
                      <NumericInput
                        label="Chorus Rate"
                        value={currentParams.chorus_rate}
                        onChange={(v) => updateParam('chorus_rate', v)}
                      />
                      <NumericInput
                        label="Delay Time"
                        value={currentParams.delay_time}
                        onChange={(v) => updateParam('delay_time', v)}
                      />
                      <NumericInput
                        label="Flanger Rate"
                        value={currentParams.flanger_rate}
                        onChange={(v) => updateParam('flanger_rate', v)}
                      />
                      <NumericInput
                        label="Flanger Depth"
                        value={currentParams.flanger_depth}
                        onChange={(v) => updateParam('flanger_depth', v)}
                      />
                      <NumericInput
                        label="Flanger Delay"
                        value={currentParams.flanger_delay}
                        onChange={(v) => updateParam('flanger_delay', v)}
                      />
                      <NumericInput
                        label="LPF Resonance"
                        value={currentParams.p_lpf_resonance}
                        onChange={(v) => updateParam('p_lpf_resonance', v)}
                        min={0} max={1}
                      />
                    </>
                  ) : (
                    <>
                      <ParamSlider
                        label="Distortion"
                        value={currentParams.distortion}
                        onChange={(v) => updateParam('distortion', v)}
                        info={parameterInfo.distortion}
                      />
                      <ParamSlider
                        label="Bit Crush"
                        value={currentParams.bit_crush}
                        onChange={(v) => updateParam('bit_crush', v)}
                        info={parameterInfo.bit_crush}
                      />
                      <ParamSlider
                        label="Low-pass Filter"
                        value={currentParams.p_lpf_freq}
                        onChange={(v) => updateParam('p_lpf_freq', v)}
                        info={parameterInfo.p_lpf_freq}
                      />
                      <ParamSlider
                        label="High-pass Filter"
                        value={currentParams.p_hpf_freq}
                        onChange={(v) => updateParam('p_hpf_freq', v)}
                        info={parameterInfo.p_hpf_freq}
                      />
                      <ParamSlider
                        label="Chorus Rate"
                        value={currentParams.chorus_rate}
                        onChange={(v) => updateParam('chorus_rate', v)}
                        info={parameterInfo.chorus_rate}
                      />
                      <ParamSlider
                        label="Delay Time"
                        value={currentParams.delay_time}
                        onChange={(v) => updateParam('delay_time', v)}
                        info={parameterInfo.delay_time}
                      />
                      <ParamSlider
                        label="Flanger Rate"
                        value={currentParams.flanger_rate}
                        onChange={(v) => updateParam('flanger_rate', v)}
                        info={parameterInfo.flanger_rate}
                      />
                      <ParamSlider
                        label="Flanger Depth"
                        value={currentParams.flanger_depth}
                        onChange={(v) => updateParam('flanger_depth', v)}
                        info={parameterInfo.flanger_depth}
                      />
                      <ParamSlider
                        label="Flanger Delay"
                        value={currentParams.flanger_delay}
                        onChange={(v) => updateParam('flanger_delay', v)}
                        info={parameterInfo.flanger_delay}
                      />
                      <ParamSlider
                        label="LPF Resonance"
                        value={currentParams.p_lpf_resonance}
                        onChange={(v) => updateParam('p_lpf_resonance', v)}
                        min={0} max={1}
                        info={parameterInfo.p_lpf_resonance}
                      />
                    </>
                  )}
                </>
              )}

              {activeTab === 'advanced' && (
                <>
                  {showNumericInputs ? (
                    <>
                      <NumericInput
                        label="FM Frequency"
                        value={currentParams.fm_freq}
                        onChange={(v) => updateParam('fm_freq', v)}
                      />
                      <NumericInput
                        label="FM Depth"
                        value={currentParams.fm_depth}
                        onChange={(v) => updateParam('fm_depth', v)}
                      />
                      <NumericInput
                        label="Ring Mod Freq"
                        value={currentParams.ring_mod_freq}
                        onChange={(v) => updateParam('ring_mod_freq', v)}
                      />
                      <NumericInput
                        label="Ring Mod Depth"
                        value={currentParams.ring_mod_depth}
                        onChange={(v) => updateParam('ring_mod_depth', v)}
                      />
                      <NumericInput
                        label="Delay Feedback"
                        value={currentParams.delay_feedback}
                        onChange={(v) => updateParam('delay_feedback', v)}
                      />
                      <NumericInput
                        label="Master Volume"
                        value={currentParams.sound_vol}
                        onChange={(v) => updateParam('sound_vol', v)}
                      />
                    </>
                  ) : (
                    <>
                      <ParamSlider
                        label="FM Frequency"
                        value={currentParams.fm_freq}
                        onChange={(v) => updateParam('fm_freq', v)}
                        info={parameterInfo.fm_freq}
                      />
                      <ParamSlider
                        label="FM Depth"
                        value={currentParams.fm_depth}
                        onChange={(v) => updateParam('fm_depth', v)}
                        info={parameterInfo.fm_depth}
                      />
                      <ParamSlider
                        label="Ring Mod Freq"
                        value={currentParams.ring_mod_freq}
                        onChange={(v) => updateParam('ring_mod_freq', v)}
                        info={parameterInfo.ring_mod_freq}
                      />
                      <ParamSlider
                        label="Ring Mod Depth"
                        value={currentParams.ring_mod_depth}
                        onChange={(v) => updateParam('ring_mod_depth', v)}
                        info={parameterInfo.ring_mod_depth}
                      />
                      <ParamSlider
                        label="Delay Feedback"
                        value={currentParams.delay_feedback}
                        onChange={(v) => updateParam('delay_feedback', v)}
                        info={parameterInfo.delay_feedback}
                      />
                      <ParamSlider
                        label="Master Volume"
                        value={currentParams.sound_vol}
                        onChange={(v) => updateParam('sound_vol', v)}
                        info={parameterInfo.sound_vol}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          {/* -------------------- Desktop UI ENDS HERE -------------------- */}

      </div>
    </div>

    <style>{`
      
      .slider::-webkit-slider-thumb {
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        cursor: pointer;
        border: 2px solid #1e40af;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      }
      .slider::-webkit-slider-thumb:hover {
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
        transform: scale(1.1);
      }
      .slider::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        cursor: pointer;
        border: 2px solid #1e40af;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }

      .text-white { color: #ffffff !important; }
      .text-gray-200 { color: #e5e7eb !important; }
      .text-gray-300 { color: #d1d5db !important; }
      .text-gray-400 { color: #9ca3af !important; }
      .text-gray-500 { color: #6b7280 !important; }
      .text-blue-300 { color: #93c5fd !important; }
      .text-purple-400 { color: #c084fc !important; }

      .bg-gray-900\\/50 { background-color: rgba(17, 24, 39, 0.8) !important; }
      .bg-gray-800\\/50 { background-color: rgba(31, 41, 55, 0.8) !important; }

      button { color: inherit !important; }

      .bg-emerald-600 { background-color: #059669 !important; color: white !important; }
      .disabled\\:bg-gray-700:disabled { background-color: #374151 !important; color: #9ca3af !important; }

      .bg-yellow-500 { background-color: #eab308 !important; }
      .bg-red-500 { background-color: #ef4444 !important; }
      .bg-orange-500 { background-color: #f97316 !important; }
      .bg-green-500 { background-color: #22c55e !important; }
      .bg-purple-500 { background-color: #a855f7 !important; }
      .bg-blue-500 { background-color: #3b82f6 !important; }
      .bg-teal-500 { background-color: #14b8a6 !important; }
      .bg-gray-500 { background-color: #6b7280 !important; }
      .bg-cyan-400 { background-color: #22d3ee !important; }
      .bg-lime-400 { background-color: #a3e635 !important; }
      .bg-indigo-500 { background-color: #6366f1 !important; }
      .bg-pink-500 { background-color: #ec4899 !important; }
      .bg-amber-500 { background-color: #f59e0b !important; }
      .bg-fuchsia-500 { background-color: #d946ef !important; }
      .bg-emerald-500 { background-color: #10b981 !important; }
      .bg-red-700 { background-color: #b91c1c !important; }
    `}</style>
  </div>
);
}