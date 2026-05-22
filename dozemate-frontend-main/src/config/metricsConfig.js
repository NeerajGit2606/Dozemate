// src/config/metricsConfig.js
const metricsConfig = {
  // HRV (9-min packet)
  meanRR: { min: 300, max: 2000, graph: "NA", avgSec: 540, type: "Float" },
  meanHR: { min: 40, max: 200, graph: "NA", avgSec: 540, type: "Float" },
  sdnn: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Float" },
  rmssd: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Float" },
  nn50: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Int" },
  pnn50: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Float" },
  sdsd: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Float" },
  sd1: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Float" },
  sd2: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Float" },
  mxdmn: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Float" },
  mo: { min: 0, max: 10, graph: "NA", avgSec: 540, type: "Float" },
  amo: { min: 0, max: 10, graph: "NA", avgSec: 540, type: "Float" },
  stress_ind: { min: 0, max: 100, graph: "NA", avgSec: 540, type: "Float" },
  lf_pow: { min: 100, max: 10000, graph: "NA", avgSec: 540, type: "Float" },
  hf_pow: { min: 100, max: 10000, graph: "NA", avgSec: 540, type: "Float" },
  lf_hf_ratio: { min: 0.1, max: 10, graph: "NA", avgSec: 540, type: "Float" },
  // On-change / fast signals
  motion: { min: 0, max: 1, graph: "NA", avgSec: 6, type: "Int" },
  presence: { min: 0, max: 1, graph: "NA", avgSec: 6, type: "Int" },

  // Main vitals / environment (graph types per sheet)
  heartRate: { min: 48, max: 200, graph: "Line", avgSec: 12, type: "Int", alertMin: 40, alertMax: 120 },
  respiration: { min: 2, max: 30, graph: "Line", avgSec: 30, type: "Int", alertMin: 4, alertMax: 20 },
  temperature: { min: 0, max: 160, graph: "Value", avgSec: 60, type: "Float", alertMin: 16, alertMax: 34 },
  humidity: { min: 0, max: 100, graph: "Value", avgSec: 60, type: "Float", alertMin: 20, alertMax: 80 },
  stress: { min: 0, max: 200, graph: "Value", avgSec: 0, type: "Float", alertMin: 30, alertMax: 150 },

  battery: { min: 0, max: 100, graph: "Value", avgSec: 0, type: "Int" },
  snoreNum: { min: 0, max: 4, graph: "NA", avgSec: 0, type: "Int" },
  snoreFreq: { min: 0, max: 100, graph: "NA", avgSec: 0, type: "Float" },
  pressure: { min: 0, max: null, graph: "Value", avgSec: 0, type: "Float" },

  iaq: { min: 0, max: 10, graph: "Value", avgSec: 120, type: "Float" },
  bvoc: { min: 0, max: 50000, graph: "Value", avgSec: 120, type: "Float" },
  co2: { min: 0, max: 10000, graph: "Value", avgSec: 120, type: "Float" },
  tvoc: { min: 0, max: 50000, graph: "Value", avgSec: 120, type: "Float" },
  gasPercer: { min: 0, max: 200, graph: "Value", avgSec: 0, type: "Float" },
};

export default metricsConfig;
