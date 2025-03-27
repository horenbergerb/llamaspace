export class Anomaly {
    constructor() {
      this.properties = {
        originType: this.randomChoice(['organic', 'synthetic']),
        stability: this.randomChoice(['stable', 'volatile', 'decaying', 'fluctuating']),
        activityLevel: this.randomChoice(['dormant', 'active', 'reactive', 'unknown']),
        threatLevel: this.randomChoice(['none', 'low', 'moderate', 'high']),
        energySignature: this.randomChoice(['thermal', 'radioactive', 'psionic', 'gravitic', 'unknown']),
        temporalStatus: this.randomChoice(['present', 'phased', 'looping', 'out-of-sync']),
        composition: this.randomChoice(['biomatter', 'metallic', 'crystalline', 'liquid', 'plasma']),
        behavioralPattern: this.randomChoice(['stationary', 'mobile', 'orbiting', 'emergent']),
        signalType: this.randomChoice(['none', 'encoded', 'distress', 'broadcast', 'subliminal']),
        accessibility: this.randomChoice(['surface-level', 'buried', 'in orbit', 'interdimensional']),
        artifactAge: this.randomChoice(['ancient', 'recent', 'contemporary', 'indeterminate']),
        energyOutput: this.randomFloat(0, 1e6).toFixed(2), // in megawatts
        signalStrength: this.randomFloat(0, 100).toFixed(1), // arbitrary units
        radiationLevel: this.randomFloat(0, 500).toFixed(1), // mSv/h
        massEstimate: this.randomFloat(1, 1e9).toFixed(0), // in kg
        density: this.randomFloat(0.1, 50).toFixed(2), // g/cm^3
        ageEstimate: this.randomFloat(0, 1e6).toFixed(0), // in years
        anomalyIndex: this.randomFloat(0, 100).toFixed(1), // 0–100 scale
        temperature: this.randomFloat(-200, 10000).toFixed(1), // °C
        magneticFieldStrength: this.randomFloat(0, 1000).toFixed(2), // μT
        scanConfidence: this.randomFloat(50, 100).toFixed(1), // %
        spatialDistortion: this.randomFloat(0, 5).toFixed(2), // % deviation
        timeDisplacement: this.randomFloat(-300, 300).toFixed(1) // seconds
      };
    }
  
    randomChoice(options) {
      return options[Math.floor(Math.random() * options.length)];
    }
  
    randomFloat(min, max) {
      return Math.random() * (max - min) + min;
    }
  }
  