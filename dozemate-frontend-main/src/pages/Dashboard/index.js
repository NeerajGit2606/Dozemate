import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { setupMqttMode } from "../../services/mqttMode";
import { setupDatabaseMode } from "../../services/databaseMode";
import { disconnectMQTT } from "../../mqtt/mqtt";
import "./Dashboard.css";
import ParameterChart from "../../components/ParameterChart";
import { fetchHealthData } from "../../services/healthDataService";
import metricsConfig from "../../config/metricsConfig";
import { apiUrl } from "../../config/api";

Chart.register(...registerables, zoomPlugin, ChartDataLabels);

const MAX_STORAGE_MINUTES = 1440; // 24 hours
const DISPLAY_WINDOW_MINUTES = 30; // Window size
const RIGHT_MARGIN_MINUTES = 2; // 2 minutes margin on the right when live



// Global connection state to persist across re-renders
let globalConnectionState = {
    isConnected: false,
    mode: "database",
    mqttClient: null
};

const Dashboard = React.memo(() => {
    console.log("Dashboard component rendering..."); // Debug log

    const [graphConfig, setGraphConfig] = useState({});
    // Declare all hooks at the top
    const chartRef = useRef(null);
    const isInitializedRef = useRef(false);

    const [data, setData] = useState({
        temperature: null,
        humidity: null,
        iaq: null,
        co2: null,
        tvoc: null,
        bvoc: null,
        hrv: null,
        stress: null,
        sdnn: null,
        rmssd: null,
        lf_pow: null,
        hf_pow: null,
        lf_hf_ratio: null,
        battery: null,
        motion: null,
        presence: null,
        activity: null,
        mic: null
    });

    const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark'));

    // Memoize the getTextColor function
    const getTextColor = useCallback(() => {
        return isDark ? '#e0e0e0' : '#555555';
    }, [isDark]);

    const [chartData, setChartData] = useState(() => {
        const storedData = localStorage.getItem("chartData");
        return storedData
            ? JSON.parse(storedData)
            : {
                labels: [],
                datasets: [
                    { label: "Respiration", data: [], borderColor: "rgba(54,162,235,1)", backgroundColor: "rgba(54,162,235,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Heart Rate", data: [], borderColor: "rgba(255,99,132,1)", backgroundColor: "rgba(255,99,132,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Temperature", data: [], borderColor: "rgba(255,165,0,1)", backgroundColor: "rgba(255,165,0,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Humidity", data: [], borderColor: "rgba(75,192,192,1)", backgroundColor: "rgba(75,192,192,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "IAQ", data: [], borderColor: "rgba(153,102,255,1)", backgroundColor: "rgba(153,102,255,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "eCO₂", data: [], borderColor: "rgba(0,128,0,1)", backgroundColor: "rgba(0,128,0,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "TVOC", data: [], borderColor: "rgba(255,206,86,1)", backgroundColor: "rgba(255,206,86,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Stress", data: [], borderColor: "rgba(199,21,133,1)", backgroundColor: "rgba(199,21,133,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Battery", data: [], borderColor: "rgba(0,0,0,1)", backgroundColor: "rgba(0,0,0,0.1)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Pressure", data: [], borderColor: "rgba(128,0,128,1)", backgroundColor: "rgba(128,0,128,0.1)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "bVOC", data: [], borderColor: "rgba(0,128,128,1)", backgroundColor: "rgba(0,128,128,0.1)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Gas/Perceor", data: [], borderColor: "rgba(139,69,19,1)", backgroundColor: "rgba(139,69,19,0.1)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },

                ],
            };
    });

    // ✅ Derived from chartData (single source of truth)
    const labels = useMemo(() => chartData.labels || [], [chartData]);

    const respiration = useMemo(
        () => chartData.datasets?.[0]?.data || [],
        [chartData]
    );

    const heartRate = useMemo(
        () => chartData.datasets?.[1]?.data || [],
        [chartData]
    );

    const temperature = useMemo(
        () => chartData.datasets?.[2]?.data || [],
        [chartData]
    );



    const humidity = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "Humidity")?.data || [],
        [chartData]
    );

    const iaq = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "IAQ")?.data || [],
        [chartData]
    );

    const co2 = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "eCO₂")?.data || [],
        [chartData]
    );

    const tvoc = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "TVOC")?.data || [],
        [chartData]
    );

    const stress = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "Stress")?.data || [],
        [chartData]
    );

    const sdnn = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "SDNN")?.data || [],
        [chartData]
    );

    const rmssd = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "RMSSD")?.data || [],
        [chartData]
    );

    const battery = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "Battery")?.data || [],
        [chartData]
    );

    const pressure = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "Pressure")?.data || [],
        [chartData]
    );

    const bvoc = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "bVOC")?.data || [],
        [chartData]
    );

    const gasPercer = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "Gas/Perceor")?.data || [],
        [chartData]
    );

    const [mode, setMode] = useState(() => globalConnectionState.mode);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    const graphChoice = (key) => {
        return graphConfig[key] ?? metricsConfig[key]?.graph ?? "NA";
    };

    const getXWindow = useCallback(() => {
        const now = Date.now();
        const xMin = new Date(now - DISPLAY_WINDOW_MINUTES * 60_000);
        const xMax = new Date(now - RIGHT_MARGIN_MINUTES * 60_000);
        return { xMin, xMax };
    }, []);

    const { xMin, xMax } = getXWindow();
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);

    // After fetching devices for user
    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch(apiUrl("/api/manage/users/me"), { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(user => {
                if (user.devices?.length) {
                    console.log(user.devices);
                    setSelectedDeviceId(user.devices[0].deviceId); // pick first
                }
            });
    }, []);

    // Initialize connection only once
    useEffect(() => {
        if (isInitializedRef.current) return;

        console.log("Initializing Dashboard connection..."); // Debug log
        isInitializedRef.current = true;

        const initializeConnection = async () => {
            if (mode === "mqtt") {
                try {
                    const client = await setupMqttMode(setData, setChartData, chartRef, isAutoScrolling);
                    globalConnectionState.mqttClient = client;
                    globalConnectionState.isConnected = true;
                    globalConnectionState.mode = "mqtt";
                } catch (error) {
                    console.error("Failed to setup MQTT:", error);
                }
            } else {
                setupDatabaseMode(setData, setChartData, chartRef);
                globalConnectionState.isConnected = true;
                globalConnectionState.mode = "database";
            }
        };

        initializeConnection();

        // Cleanup function that only runs on component unmount
        return () => {
            console.log("Dashboard component unmounting..."); // Debug log
            if (globalConnectionState.mqttClient) {
                disconnectMQTT();
                globalConnectionState.mqttClient = null;
            }
            globalConnectionState.isConnected = false;
            isInitializedRef.current = false;
        };
    }, []); // Empty dependency array - only run once

    // Handle mode changes separately
    useEffect(() => {
        if (!isInitializedRef.current) return;

        const handleModeChange = async () => {
            if (globalConnectionState.mode !== mode) {
                console.log(`Switching mode from ${globalConnectionState.mode} to ${mode}`); // Debug log

                // Disconnect existing connection
                if (globalConnectionState.mqttClient) {
                    disconnectMQTT();
                    globalConnectionState.mqttClient = null;
                }

                // Setup new connection
                if (mode === "mqtt") {
                    try {
                        const client = await setupMqttMode(setData, setChartData, chartRef, isAutoScrolling);
                        globalConnectionState.mqttClient = client;
                    } catch (error) {
                        console.error("Failed to setup MQTT:", error);
                    }
                } else {
                    setupDatabaseMode(setData, setChartData, chartRef);
                }

                globalConnectionState.mode = mode;
            }
        };

        handleModeChange();
    }, [mode, isAutoScrolling]);

    const loadLiveChartData = async () => {
        const token = localStorage.getItem("token");
        if (!selectedDeviceId) return;

        const now = new Date();
        const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // last 1h
        const end = now.toISOString();

        try {
            const res = await fetch(
                apiUrl(`/api/devices/history?deviceId=${selectedDeviceId}&from=${start}&to=${end}&limit=500`),
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const json = await res.json();
            console.log("📊 /devices/history result:", json);

            const rows = Array.isArray(json) ? json : json.data || [];
            const summary = json.summary || {};
            console.log("✅ Parsed rows for charts:", rows.length);
            const newLabels = rows.map((r) => new Date(r.timestamp));
            const newHeartRate = rows.map((r) => r.heartRate);
            const newRespiration = rows.map((r) => r.respiration);
            const newTemperature = rows.map((r) => r.temperature);
            const newHumidity = rows.map((r) => r.humidity);
            const newIaq = rows.map((r) => r.iaq);
            const newCo2 = rows.map((r) => r.co2 ?? r.eco2);
            const newTvoc = rows.map((r) => r.tvoc);
            const newStress = rows.map((r) => r.stress);
            const newBattery = rows.map((r) => r.signals?.battery ?? null);
            const newPressure = rows.map((r) => r.pressure);
            const newBvoc = rows.map((r) => r.bvoc);
            const newGasPercer = rows.map((r) => r.gasPercer);

            // ✅ Update main live metrics + summary
            setData((prev) => ({
                ...prev,
                heartRate: summary.avgHR ?? newHeartRate.at(-1),
                respiration: newRespiration.at(-1),
                temperature: newTemperature.at(-1),
                humidity: newHumidity.at(-1),
                stress: newStress.at(-1),
                battery: newBattery.at(-1),
                summaryHR: summary, // store min/avg/max here
            }));

            // ✅ Update charts
            setChartData({
                labels: newLabels,
                datasets: [
                    {
                        label: "Heart Rate",
                        data: newHeartRate,
                        borderColor: "rgba(255,99,132,1)",
                        backgroundColor: "rgba(255,99,132,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Respiration",
                        data: newRespiration,
                        borderColor: "rgba(54,162,235,1)",
                        backgroundColor: "rgba(54,162,235,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Temperature",
                        data: newTemperature,
                        borderColor: "rgba(255,165,0,1)",
                        backgroundColor: "rgba(255,165,0,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Humidity",
                        data: newHumidity,
                        borderColor: "rgba(75,192,192,1)",
                        backgroundColor: "rgba(75,192,192,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "TVOC",
                        data: newTvoc,
                        borderColor: "rgba(255,206,86,1)",
                        backgroundColor: "rgba(255,206,86,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Pressure",
                        data: newPressure,
                        borderColor: "rgba(128,0,128,1)",
                        backgroundColor: "rgba(128,0,128,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "bVOC",
                        data: newBvoc,
                        borderColor: "rgba(0,128,128,1)",
                        backgroundColor: "rgba(0,128,128,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Gas/Perceor",
                        data: newGasPercer,
                        borderColor: "rgba(139,69,19,1)",
                        backgroundColor: "rgba(139,69,19,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                ],
            });

        } catch (error) {
            console.error("Live chart data fetch failed:", error);
        }
    };


    const inAlert = (key, value) => {
        if (value == null) return false;

        // Prefer dynamic config from DB
        const min = graphConfig[key]?.alertMin ?? metricsConfig[key]?.alertMin;
        const max = graphConfig[key]?.alertMax ?? metricsConfig[key]?.alertMax;

        if (min == null && max == null) return false;
        if (min != null && value < min) return true;
        if (max != null && value > max) return true;

        return false;
    };

    const COLOR_CLASSES = {
        temp: 'rose-pink',
        humidity: 'light-apricot',
        iaq: 'soft-yellow',
        co2: 'cool-mint',
        tvoc: 'sky-mist',
        etoh: 'lavender-fog',
        hrv: 'light-steel',
        stress: 'coral-peach',
    };

    const ValueCard = ({ title, unit, dataPoints }) => {
        const latest = dataPoints.length ? dataPoints.at(-1) : "—";

        console.log("📊 Updating Dashboard state:", {
            temperature: latest.temperature,
            humidity: latest.humidity,
            co2: latest.eco2,
            tvoc: latest.tvoc,
            heartRate: latest.heartRate,
            respiration: latest.respiration,
        });
        return (
            <div className="value-card">
                <h4>{title}</h4>
                <p>{latest}{latest !== "—" ? ` ${unit}` : ""}</p>
            </div>
        );
    };


    // Update chart colors when theme changes
    useEffect(() => {
        const updateChartTheme = () => {
            const newIsDark = document.body.classList.contains('dark');
            setIsDark(newIsDark);

            if (!chartRef.current) return;

            const textColor = newIsDark ? '#e0e0e0' : '#555555';

            // Update legend colors
            chartRef.current.options.plugins.legend.labels.color = textColor;

            // Update axis colors
            chartRef.current.options.scales.x.ticks.color = textColor;
            chartRef.current.options.scales.y.ticks.color = textColor;

            // Update datalabel background
            chartRef.current.options.plugins.datalabels.backgroundColor =
                newIsDark ? 'rgba(45, 45, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)';

            chartRef.current.update();
        };

        // Create observer to watch for class changes on body
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    updateChartTheme();
                }
            });
        });

        // Start observing
        observer.observe(document.body, { attributes: true });

        // Call once to set initial colors
        updateChartTheme();

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        loadLiveChartData();
        const interval = setInterval(loadLiveChartData, 6000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch(apiUrl("/api/graph-settings"), {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const map = {};
                console.log("Graph settings API response:", data);

                const settings = Array.isArray(data) ? data : data.settings || [];
                settings.forEach(s => {
                    map[s.metric] = s.selectedType;
                });

                setGraphConfig(map);
            })

    }, []);


    return (
        <div className="dashboard-container">

            <div className="dashboard-wrapper">
                <div className="metrics-table">
                    {[
                        "heartRate", "respiration", "temperature", "humidity", "stress", "battery",
                        "pressure", "iaq", "bvoc", "co2", "tvoc", "gasPercer"
                    ].map((key) => (
                        (graphChoice(key) === "Value" || graphChoice(key) === "Line") && (
                            <div key={key} className={`metric-cell ${key}`}>
                                <div className="label">
                                    {{
                                        heartRate: "Heart Rate",
                                        respiration: "Respiration",
                                        temperature: "Temp",
                                        humidity: "Humidity",
                                        stress: "Stress",
                                        battery: "Battery",
                                        pressure: "Pressure",
                                        iaq: "IAQ",
                                        bvoc: "bVOC",
                                        co2: "CO₂",
                                        tvoc: "TVOC",
                                        gasPercer: "Gas/Perceor"
                                    }[key]}
                                </div>
                                <div
                                    className={`value ${["heartRate", "respiration", "temperature", "humidity", "stress"].includes(key) &&
                                        inAlert(key, data[key])
                                        ? "alert"
                                        : ""
                                        }`}
                                >
                                    {key === "respiration"
                                        ? respiration.length
                                            ? `${respiration.at(-1)} (rpm)`
                                            : "—"
                                        : key === "heartRate"
                                            ? data.summaryHR?.avgHR
                                                ? `${data.summaryHR.avgHR.toFixed(1)} (bpm)`
                                                : heartRate.length
                                                    ? `${heartRate.at(-1)} (bpm)`
                                                    : "—"
                                            : data[key] != null
                                                ? `${Number(data[key]).toFixed(
                                                    ["temperature", "humidity", "iaq", "co2", "tvoc", "bvoc", "pressure"].includes(key) ? 1 : 0
                                                )} ${{
                                                    heartRate: "bpm",
                                                    respiration: "rpm",
                                                    temperature: "°C",
                                                    humidity: "%",
                                                    stress: "",
                                                    battery: "%",
                                                    pressure: "hPa",
                                                    iaq: "",
                                                    bvoc: "ppb",
                                                    co2: "ppm",
                                                    tvoc: "ppb",
                                                    gasPercer: ""
                                                }[key]
                                                }`
                                                : "—"}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>

            <div className="param-chart-grid">
                {/* ====== Time-series charts per Excel (Line only) ====== */}
                {graphChoice("heartRate") === "Line" && (
                    <ParameterChart
                        title="Heart Rate"
                        unit="bpm"
                        labels={labels}
                        dataPoints={heartRate}
                        min={metricsConfig.heartRate.min}
                        max={metricsConfig.heartRate.max}
                        borderColor="rgba(255, 99, 132, 1)"
                        backgroundColor="rgba(255, 99, 132, 0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("heartRate") === "Value" && (
                    <ValueCard
                        title="Heart Rate"
                        unit="bpm"
                        dataPoints={heartRate}
                    />
                )}

                {graphChoice("respiration") === "Line" && (
                    <ParameterChart
                        title="Respiration"
                        unit="rpm"
                        labels={labels}
                        dataPoints={respiration}
                        min={metricsConfig.respiration.min}
                        max={metricsConfig.respiration.max}
                        borderColor="rgba(54, 162, 235, 1)"
                        backgroundColor="rgba(54, 162, 235, 0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("respiration") === "Value" && (
                    <ValueCard title="Respiration" unit="rpm" dataPoints={respiration} />
                )}

                {graphChoice("temperature") === "Line" && (
                    <ParameterChart
                        title="Temperature"
                        unit="°C"
                        labels={labels}
                        dataPoints={temperature}
                        min={metricsConfig.temperature.min}
                        max={metricsConfig.temperature.max}
                        borderColor="rgba(255,165,0,1)"
                        backgroundColor="rgba(255,165,0,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("temperature") === "Value" && (
                    <ValueCard title="Temperature" unit="°C" dataPoints={temperature} />
                )}

                {graphChoice("humidity") === "Line" && (
                    <ParameterChart
                        title="Humidity"
                        unit="%"
                        labels={labels}
                        dataPoints={humidity}
                        min={metricsConfig.humidity.min}
                        max={metricsConfig.humidity.max}
                        borderColor="rgba(75,192,192,1)"
                        backgroundColor="rgba(75,192,192,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("humidity") === "Value" && (
                    <ValueCard title="Humidity" unit="%" dataPoints={humidity} />
                )}

                {graphChoice("iaq") === "Line" && (
                    <ParameterChart
                        title="IAQ"
                        unit=""
                        labels={labels}
                        dataPoints={iaq}
                        min={metricsConfig.iaq.min}
                        max={metricsConfig.iaq.max}
                        borderColor="rgba(153,102,255,1)"
                        backgroundColor="rgba(153,102,255,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("iaq") === "Value" && (
                    <ValueCard title="IAQ" unit="" dataPoints={iaq} />
                )}

                {graphChoice("co2") === "Line" && (
                    <ParameterChart
                        title="eCO₂"
                        unit="ppm"
                        labels={labels}
                        dataPoints={co2}
                        min={metricsConfig.co2.min}
                        max={metricsConfig.co2.max}
                        borderColor="rgba(0,128,0,1)"
                        backgroundColor="rgba(0,128,0,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("co2") === "Value" && (
                    <ValueCard title="eCO₂" unit="ppm" dataPoints={co2} />
                )}

                {graphChoice("tvoc") === "Line" && (
                    <ParameterChart
                        title="TVOC"
                        unit="ppb"
                        labels={labels}
                        dataPoints={tvoc}
                        min={metricsConfig.tvoc.min}
                        max={metricsConfig.tvoc.max}
                        borderColor="rgba(255,206,86,1)"
                        backgroundColor="rgba(255,206,86,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("tvoc") === "Value" && (
                    <ValueCard title="TVOC" unit="ppb" dataPoints={tvoc} />
                )}

                {graphChoice("stress") === "Line" && (
                    <ParameterChart
                        title="Stress"
                        unit=""
                        labels={labels}
                        dataPoints={stress}
                        min={metricsConfig.stress.min}
                        max={metricsConfig.stress.max}
                        borderColor="rgba(199,21,133,1)"
                        backgroundColor="rgba(199,21,133,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("stress") === "Value" && (
                    <ValueCard title="Stress" unit="" dataPoints={stress} />
                )}

                {graphChoice("sdnn") === "Line" && (
                    <ParameterChart
                        title="SDNN"
                        unit="ms"
                        labels={labels}
                        dataPoints={sdnn}
                        min={metricsConfig.sdnn.min}
                        max={metricsConfig.sdnn.max}
                        borderColor="rgba(100,149,237,1)"
                        backgroundColor="rgba(100,149,237,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}
                {graphChoice("sdnn") === "Value" && (
                    <ValueCard title="SDNN" unit="ms" dataPoints={sdnn} />
                )}
                {graphChoice("rmssd") === "Line" && (
                    <ParameterChart
                        title="RMSSD"
                        unit="ms"
                        labels={labels}
                        dataPoints={rmssd}
                        min={metricsConfig.rmssd.min}
                        max={metricsConfig.rmssd.max}
                        borderColor="rgba(255,140,0,1)"
                        backgroundColor="rgba(255,140,0,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}
                {graphChoice("rmssd") === "Value" && (
                    <ValueCard title="RMSSD" unit="ms" dataPoints={rmssd} />
                )}

                {graphChoice("battery") === "Line" && (
                    <ParameterChart
                        title="Battery"
                        unit="%"
                        labels={labels}
                        dataPoints={battery}
                        min={metricsConfig.battery.min}
                        max={metricsConfig.battery.max}
                        borderColor="rgba(0,0,0,1)"
                        backgroundColor="rgba(0,0,0,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}
                {graphChoice("battery") === "Value" && (
                    <ValueCard title="Battery" unit="%" dataPoints={battery} />
                )}

                {graphChoice("pressure") === "Line" && (
                    <ParameterChart
                        title="Pressure"
                        unit="hPa"
                        labels={labels}
                        dataPoints={pressure}
                        min={metricsConfig.pressure.min}
                        max={metricsConfig.pressure.max}
                        borderColor="rgba(128,0,128,1)"
                        backgroundColor="rgba(128,0,128,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}
                {graphChoice("pressure") === "Value" && (
                    <ValueCard title="Pressure" unit="hPa" dataPoints={pressure} />
                )}

                {graphChoice("bvoc") === "Line" && (
                    <ParameterChart
                        title="bVOC"
                        unit="ppb"
                        labels={labels}
                        dataPoints={bvoc}
                        min={metricsConfig.bvoc.min}
                        max={metricsConfig.bvoc.max}
                        borderColor="rgba(0,128,128,1)"
                        backgroundColor="rgba(0,128,128,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}
                {graphChoice("bvoc") === "Value" && (
                    <ValueCard title="bVOC" unit="ppb" dataPoints={bvoc} />
                )}

                {graphChoice("gasPercer") === "Line" && (
                    <ParameterChart
                        title="Gas/Perceor"
                        unit=""
                        labels={labels}
                        dataPoints={gasPercer}
                        min={metricsConfig.gasPercer.min}
                        max={metricsConfig.gasPercer.max}
                        borderColor="rgba(139,69,19,1)"
                        backgroundColor="rgba(139,69,19,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}
                {graphChoice("gasPercer") === "Value" && (
                    <ValueCard title="Gas/Perceor" unit="" dataPoints={gasPercer} />
                )}

            </div>


        </div>
    );
});

// Add display name for debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard;
