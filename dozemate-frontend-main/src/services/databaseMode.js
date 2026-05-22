// Database mode for fetching historical data and continuous polling


import { apiUrl } from "../config/api";

export const setupDatabaseMode = (setData, setChartData, chartRef, isAutoScrolling = true) => {
  console.log("Database mode selected - setting up continuous polling");

  const POLL_INTERVAL = 6000; // 6 seconds
  const DISPLAY_WINDOW_MINUTES = 30;
  const RIGHT_MARGIN_MINUTES = 2;

  // Function to get active device ID
  const getActiveDeviceId = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return null;
      }

      const userResponse = await fetch("https://admin.dozemate.com/api/devices/user", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        console.error("Failed to fetch user devices");
        return null;
      }

      const userData = await userResponse.json();

      // Handle different response structures
      let deviceId = null;

      if (userData.activeDevice) {
        // If activeDevice is an object with deviceId
        if (typeof userData.activeDevice === 'object' && userData.activeDevice.deviceId) {
          deviceId = userData.activeDevice.deviceId;
        }
        // If activeDevice is an ID, find matching device
        else {

          const activeDevice = userData.devices?.find(d => d._id === userData.activeDevice);

          // Ignore dummy/test device IDs like "asd123"
          if (activeDevice && activeDevice.deviceId && activeDevice.deviceId !== "asd123") {
            deviceId = activeDevice.deviceId;
          }

        }
      }

      console.log("userData:", userData);
      // Fallback to first device if no active device
      if (!deviceId && userData.devices && userData.devices.length > 0) {
        deviceId = userData.devices[0].deviceId;
      }

      console.log("Active device ID for polling:", deviceId);
      return deviceId;
    } catch (error) {
      console.error("Error getting active device:", error);
      return null;
    }
  };

  // Function to fetch latest data
  const fetchLatestData = async (deviceId) => {
    if (!deviceId) return null;

    try {
      const token = localStorage.getItem("token");
      if (!token) return null;


      // Get last 60 minutes of data (consistent with frontend fetchHealthData)
      const endDate = new Date();
      const startDate = new Date(endDate - 60 * 60 * 1000); // 60 minutes ago

      console.log(`Polling data for device ${deviceId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const healthResponse = await fetch(apiUrl(
        `https://admin.dozemate.com/api/data/health/${deviceId}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log(`Received ${healthData.length} data points from server`);
        return healthData;
      } else {
        console.error("Failed to fetch health data:", await healthResponse.text());
        return null;
      }
    } catch (error) {
      console.error("Error fetching latest data:", error);
      return null;
    }
  };

  // Initial fetch and continuous polling setup
  const setupPolling = async () => {
    // Get initial device ID
    const deviceId = await getActiveDeviceId();
    if (!deviceId) {
      console.error("No device ID available for database mode");
      return null;
    }

    // Do initial fetch for historical data (last 24 hours)
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const endDate = new Date();
      const startDate = new Date(endDate - 24 * 60 * 60 * 1000); // 24 hours ago

      const initialResponse = await fetch(apiUrl(
        `https://admin.dozemate.com/api/data/health/${deviceId}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (initialResponse.ok) {
        const initialData = await initialResponse.json();
        console.log(`Loaded initial ${initialData.length} data points`);
        processAndUpdateData(initialData);
      }
    } catch (error) {
      console.error("Error fetching initial historical data:", error);
    }

    // Set up polling interval
    console.log(`Starting database polling with ${POLL_INTERVAL}ms interval`);
    const intervalId = setInterval(async () => {
      try {
        const currentDeviceId = await getActiveDeviceId();
        if (!currentDeviceId) return;

        const latestData = await fetchLatestData(currentDeviceId);
        if (latestData) {
          processAndUpdateData(latestData);
        }
      } catch (error) {
        console.error("Error during polling:", error);
      }
    }, POLL_INTERVAL);

    // Return cleanup function
    return () => {
      console.log("Cleaning up database polling");
      clearInterval(intervalId);
    };
  };



  const normalizeTimestamp = (ts) => {
    if (!ts) return NaN;
    if (ts.$date) return new Date(ts.$date).getTime(); // Mongo style
    return new Date(ts).getTime(); // string or Date
  };

  const processAndUpdateData = (healthData = []) => {
    console.log("🛠 processAndUpdateData called, size:", healthData.length);

    if (!healthData.length) {
      console.log("⚠️ No healthData received to process");
      return;
    }
    console.log("📥 Processing", healthData.length, "points");

    // sort by timestamp descending
    const sorted = [...healthData].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const latest = sorted[0];

    console.log("📊 Latest point:", {
      ts: latest.timestamp?.$date || latest.timestamp,
      hr: latest.heartRate,
      resp: latest.respiration
    });

    // Update latest values for ValueCards
    setData(prev => ({
      temperature: latest.temperature ?? prev.temperature,
      humidity: latest.humidity ?? prev.humidity,
      iaq: latest.iaq ?? prev.iaq,
      co2: latest.eco2 ?? prev.co2,    // eco2 → co2
      tvoc: latest.tvoc ?? prev.tvoc,
      etoh: latest.etoh ?? prev.etoh,
      hrv: latest.hrv ?? prev.hrv,
      stress: latest.stress ?? prev.stress,
      heartRate: latest.heartRate ?? prev.heartRate,
      respiration: latest.respiration ?? prev.respiration,
      battery: latest.signals?.battery ?? prev.battery,
      motion: latest.signals?.motion ?? prev.motion,
      presence: latest.signals?.presence ?? prev.presence,
      activity: latest.signals?.activity ?? prev.activity,
      mic: latest.signals?.mic ?? prev.mic,
    }));


    setChartData(prev => {
      const existing = new Set(prev.labels.map(l => normalizeTimestamp(l)));

      const fresh = sorted
        .filter(p => !existing.has(normalizeTimestamp(p.timestamp)))
        .map(p => ({
          ...p,
          ts: normalizeTimestamp(p.timestamp),
        }));

      if (!fresh.length) {
        console.log("ℹ️ No new chart points");
        return prev;
      }

      console.log(`➕ Adding ${fresh.length} new chart points`);

      let labels = [...prev.labels];
      // clone existing datasets by label name
      const datasets = prev.datasets.map(ds => ({ ...ds, data: [...ds.data] }));

      fresh.reverse().forEach(p => {
        if (p.signals?.presence !== 1) return;
        const ts = new Date(p.ts);
        labels.push(ts);

        const pushVal = (label, value) => {
          const ds = datasets.find(d => d.label === label);
          if (ds) ds.data.push(value ?? null);
        };

        pushVal("Heart Rate", p.heartRate);
        pushVal("Respiration", p.respiration);
        pushVal("Temperature", p.temperature);
        pushVal("Humidity", p.humidity);
        pushVal("IAQ", p.iaq);
        pushVal("eCO₂", p.eco2);               // eco2 → chart
        pushVal("TVOC", p.tvoc);
        pushVal("Stress", p.stress);
        pushVal("Battery", p.signals?.battery);
        pushVal("HRV", p.hrv);
        pushVal("EtOH", p.etoh);
        pushVal("Pressure", p.pressure ?? p.metrics?.pressure);
        pushVal("bVOC", p.bvoc ?? p.bVOC);
        pushVal("Gas/Perceor", p.gasPercer ?? p.gasPerceor ?? p.gasPerc ?? p.gasPercentage);

      });

      // enforce max points
      const MAX_POINTS = 1440;
      if (labels.length > MAX_POINTS) {
        labels = labels.slice(-MAX_POINTS);
        datasets.forEach(ds => { ds.data = ds.data.slice(-MAX_POINTS); });
      }

      console.log("✅ Chart updated. Labels:", labels.length,
        "HR:", datasets.find(d => d.label === "Heart Rate")?.data.at(-1),
        "Resp:", datasets.find(d => d.label === "Respiration")?.data.at(-1),
        "Temp:", datasets.find(d => d.label === "Temperature")?.data.at(-1),
        "Hum:", datasets.find(d => d.label === "Humidity")?.data.at(-1),
        "CO₂:", datasets.find(d => d.label === "eCO₂")?.data.at(-1),
        "TVOC:", datasets.find(d => d.label === "TVOC")?.data.at(-1),
        "Battery:", datasets.find(d => d.label === "Battery")?.data.at(-1)
      );

      return { labels, datasets };
    });



  };


  // Start polling and return the cleanup function
  return setupPolling();
};

export default setupDatabaseMode;