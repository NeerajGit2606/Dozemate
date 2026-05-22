// src/services/healthDataService.js

// Helper: group rows into fixed UTC buckets and average numeric fields
const bucketizeLatestNonZero = (rows, bucketMinutes) => {
  if (!bucketMinutes) return rows;
  const bucketMs = bucketMinutes * 60 * 1000;
  const fields = [
    // vitals/environment
    "heartRate", "respiration", "temperature", "humidity", "iaq", "eco2", "tvoc", "etoh", "hrv", "stress",
    // core HRV
    "sdnn", "rmssd", "lf", "hf", "lfhf",
    // extended HRV (from client sheet/API)
    "meanRR", "meanHR", "nn50", "pnn50", "sdsd", "sd1", "sd2", "mxdmn", "mo", "amo", "stressIndex",
    "lfPower", "hfPower", "lfhf", "sampleEntropy", "sd1sd2", "snsIndex", "pnsIndex"
  ];

  const toBucketKey = (ms) => Math.floor(ms / bucketMs) * bucketMs;

  const map = new Map(); // key -> { ts, row } latest overall
  const nzMap = new Map(); // key -> { ts, row } latest NON-ZERO

  for (const r of rows) {
    const tms = new Date(r.timestamp).getTime();
    if (!Number.isFinite(tms)) continue;
    const key = toBucketKey(tms);

    // track latest overall
    const cur = map.get(key);
    if (!cur || tms > cur.ts) map.set(key, { ts: tms, row: r });

    // track latest non-zero (any field > 0)
    const hasNonZero = fields.some(f => typeof r[f] === "number" && r[f] > 0);
    if (hasNonZero) {
      const curNZ = nzMap.get(key);
      if (!curNZ || tms > curNZ.ts) nzMap.set(key, { ts: tms, row: r });
    }
  }

  // Build output: prefer latest non-zero, else latest overall
  const out = [];
  for (const [key, latest] of map.entries()) {
    const chosen = (nzMap.get(key) || latest).row;
    // use bucket end time for label (optional)
    out.push({ ...chosen, timestamp: new Date(key + bucketMs).toISOString() });
  }

  out.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return out;
};

/**
 * Fetch health data (with summary support).
 *
 * Compatible with both:
 *   fetchHealthData(deviceId, token, 10)
 *   fetchHealthData(deviceId, token, { rangeMinutes: 60, bucketMinutes: 10 })
 */
export const fetchHealthData = async (
  deviceId,
  token,
  minutesOrOptions = 5,
  end = new Date()
) => {
  if (!deviceId) throw new Error("deviceId is required");
  if (!token) throw new Error("auth token missing");

  const opts =
    typeof minutesOrOptions === "number"
      ? { rangeMinutes: minutesOrOptions, bucketMinutes: null }
      : minutesOrOptions || {};

  const rangeMinutes = opts.rangeMinutes ?? 5;
  const bucketMinutes = opts.bucketMinutes ?? null;

  // Convert 'end' to UTC (avoid timezone shifts)
  const endDate = end instanceof Date ? end : new Date(end);
  const utcEnd = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      endDate.getUTCHours(),
      endDate.getUTCMinutes(),
      endDate.getUTCSeconds(),
      endDate.getUTCMilliseconds()
    )
  );
  const utcStart = new Date(utcEnd.getTime() - rangeMinutes * 60 * 1000);

  const id = encodeURIComponent(deviceId);
  const historyUrl = `https://admin.dozemate.com/api/devices/history?deviceId=${id}&from=${utcStart.toISOString()}&to=${utcEnd.toISOString()}&limit=500`;

  console.log("📡 HealthData fetch (UTC window):", { start: utcStart, end: utcEnd, deviceId });

  const res = await fetch(historyUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("❌ HealthData fetch error", { url: historyUrl, status: res.status, body: text });
    throw new Error(`Health data ${res.status}: ${text || res.statusText}`);
  }

  const json = await res.json();

  // Expected shape: { status, data: [...], summary: {...} }
  const rows = Array.isArray(json) ? json : json.data || [];
  const summary = json.summary || null;

  // Normalize each record
  const norm = rows.map((it) => {
    let ts = it.timestamp ?? it.time ?? it.ts;
    if (typeof ts === "number" && ts < 1e12) ts *= 1000; // seconds → ms
    return {
      timestamp: new Date(ts).toISOString(),
      heartRate: it.heartRate ?? it.hr ?? it.heart_rate,
      respiration: it.respiration ?? it.rr ?? it.resp_rate,
      temperature: it.temperature ?? it.temp,
      humidity: it.humidity,
      iaq: it.iaq,
      eco2: it.eco2 ?? it.eCO2,
      tvoc: it.tvoc,
      etoh: it.etoh,
      hrv: it.hrv,
      stress: it.stress,

      // --- HRV core ---
      sdnn: it.metrics?.sdnn ?? it.sdnn,
      rmssd: it.metrics?.rmssd ?? it.rmssd,
      lf: it.metrics?.lf ?? it.lf ?? it.lf_power,
      hf: it.metrics?.hf ?? it.hf ?? it.hf_power,
      lfhf: it.metrics?.lfhf ?? it.lfhf ?? it.lf_hf_ratio,

      // --- Extended HRV fields ---
      meanRR: it.metrics?.mean_rr ?? it.mean_rr,
      meanHR: it.metrics?.mean_hr ?? it.mean_hr,
      nn50: it.metrics?.nn50 ?? it.nn50,
      pnn50: it.metrics?.pnn50 ?? it.pnn50,
      sdsd: it.metrics?.sdsd ?? it.sdsd,
      sd1: it.metrics?.sd1 ?? it.sd1,
      sd2: it.metrics?.sd2 ?? it.sd2,
      mxdmn: it.metrics?.mxdmn ?? it.mxdmn,
      mo: it.metrics?.mo ?? it.mo,
      amo: it.metrics?.amo ?? it.amo,
      stressIndex: it.metrics?.stress_index ?? it.stress_index,
      lfPower: it.metrics?.lf_power ?? it.lf ?? it.lfPower,
      hfPower: it.metrics?.hf_power ?? it.hf ?? it.hfPower,
      sampleEntropy: it.metrics?.sample_entropy ?? it.sample_entropy,
      sd1sd2: it.metrics?.sd1sd2 ?? it.sd1sd2,
      snsIndex: it.metrics?.sns_index ?? it.sns_index,
      pnsIndex: it.metrics?.pns_index ?? it.pns_index,

      // signals
      motion: it.signals?.motion,
      presence: it.signals?.presence,
      activity: it.signals?.activity,
      battery: it.signals?.battery,
      mic: it.signals?.mic,
      rrIntervals: it.signals?.rrIntervals ?? it.rrIntervals ?? [],
      rawWaveform: it.signals?.rawWaveform ?? it.rawWaveform ?? [],
    };
  });

  // Apply non-zero bucket filtering
  const filtered = bucketizeLatestNonZero(norm, bucketMinutes);

  if (!summary || Object.keys(summary).length === 0) {
    const valid = filtered.filter(r => r.signals?.presence === 1);
    const avg = (key) => {
      const vals = valid.map(v => v[key]).filter(x => typeof x === "number" && x > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const min = (key) => {
      const vals = valid.map(v => v[key]).filter(x => typeof x === "number" && x > 0);
      return vals.length ? Math.min(...vals) : null;
    };
    const max = (key) => {
      const vals = valid.map(v => v[key]).filter(x => typeof x === "number" && x > 0);
      return vals.length ? Math.max(...vals) : null;
    };

    const allFields = [
      "heartRate", "respiration", "temperature", "humidity", "iaq", "eco2", "tvoc", "etoh", "hrv", "stress",
      "sdnn", "rmssd", "lf", "hf", "lfhf", "meanRR", "meanHR", "nn50", "pnn50", "sdsd", "sd1", "sd2", "mxdmn", "mo", "amo", "stressIndex",
      "lfPower", "hfPower", "sampleEntropy", "sd1sd2", "snsIndex", "pnsIndex"
    ];
    summary = {};
    for (const f of allFields) {
      const vals = valid.map(v => v[f]).filter(x => typeof x === "number" && x > 0);
      if (vals.length) {
        summary[`avg_${f}`] = vals.reduce((a, b) => a + b, 0) / vals.length;
      }
    }

  }


  // ✅ Return both filtered data and summary for Dashboard
  return { data: filtered, summary };
};

