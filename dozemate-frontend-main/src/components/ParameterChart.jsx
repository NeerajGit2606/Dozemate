import { Line } from "react-chartjs-2";
import "./ParameterChart.css";
import { useRef } from "react";
import { IconButton } from "@mui/material";
import { ZoomIn, ZoomOut, Refresh } from "@mui/icons-material";

const ParameterChart = ({
    title,
    unit,
    labels,
    dataPoints,
    min,
    max,
    borderColor,
    backgroundColor,
    xMin,     // <-- NEW
    xMax,    // <-- NEW,
    scaleType = "time"   // 👈 NEW prop: "time" | "category"
}) => {
    const chartRef = useRef(null);
    const data = {
        labels,
        datasets: [
            {
                label: "",
                data: (dataPoints ?? []).map(d =>
                    (d === 0 || d === null || d === undefined) ? null : Number(d.toFixed(2))
                ),
                borderColor,
                backgroundColor,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                borderWidth: 2,
                spanGaps: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
            y: {
                min,  // use prop value
                max,  // use prop value
                ticks: {
                    color: "#444",
                    font: { size: 12 },
                },
                grid: {
                    display: false,
                },
            },
            x:
                scaleType === "time"
                    ? {
                        type: "time",
                        min: xMin ? xMin.getTime() : undefined,
                        max: xMax ? xMax.getTime() : undefined,
                        bounds: "ticks",
                        time: {
                            unit: "minute",
                            tooltipFormat: "hh:mm a",
                            displayFormats: { minute: "hh:mm a" },
                        },
                        ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: true,
                            color: "#444",
                            font: { size: 12 },
                        },
                        grid: { display: false },
                    }
                    : {
                        type: "category", // 👈 works for RR Intervals / RawWaveform
                        ticks: {
                            color: "#444",
                            font: { size: 12 },
                            autoSkip: true,
                        },
                        grid: { display: false },
                    },
        },
        plugins: {
            legend: { display: false },
            datalabels: {
                anchor: 'end',
                align: 'top',
                color: '#444',
                font: { size: 10, weight: 'bold' },
                display: (ctx) => {
                    const dataset = ctx.chart.data.datasets[ctx.datasetIndex];
                    return ctx.dataIndex === dataset.data.length - 1; // ✅ only last point
                },
                formatter: (value) =>
                    typeof value === "number" ? value.toFixed(2) : "",
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: "x",              // ✅ drag left/right to scroll
                    overScaleMode: "x",
                    threshold: 8,
                },
                zoom: {
                    wheel: { enabled: true },   // ✅ mouse wheel zoom
                    pinch: { enabled: true },   // ✅ touch pinch zoom
                    mode: "x",
                },
            },

        },
    };

    const validPoints = (dataPoints ?? []).filter(
        (d) => typeof d === "number" && isFinite(d)
    );
    const hasPoints = validPoints.length > 0;
    const safeMin = hasPoints ? Math.min(...validPoints) : null;
    const safeMax = hasPoints ? Math.max(...validPoints) : null;

    return (
        <div className="param-chart-wrapper">
            <div className="chart-title">
                <span>{title}</span>
                <span className="minmax">
                    Min: {hasPoints ? safeMin.toFixed(2) : "-"} {unit} | Max: {hasPoints ? safeMax.toFixed(2) : "-"} {unit}
                </span>
            </div>
            <div className="chart-canvas">


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}></span>
                    <div>
                        <IconButton size="small" onClick={() => chartRef.current?.zoom(1.2)} title="Zoom In">
                            <ZoomIn fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => chartRef.current?.zoom(0.8)} title="Zoom Out">
                            <ZoomOut fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => chartRef.current?.resetZoom()} title="Reset Zoom">
                            <Refresh fontSize="small" />
                        </IconButton>
                    </div>
                </div>


                <Line ref={chartRef} data={data} options={options} />
            </div>

        </div>
    );
};

export default ParameterChart;
