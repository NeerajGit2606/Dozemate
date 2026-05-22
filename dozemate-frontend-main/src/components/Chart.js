import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";

Chart.register(...registerables);

const sampleData = {
  labels: [
    "08:30 AM", "10:30 AM", "12:30 PM", "02:30 PM",
    "04:30 PM", "06:30 PM", "08:30 PM", "10:30 PM"
  ],
  datasets: [
    {
      label: "Heart Rate (bpm)",
      data: [90, 88, 87, 110, 92, 91, 90, 130],
      fill: true,
      borderColor: "rgba(255, 99, 132, 1)",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      tension: 0.4,
      pointRadius: 3,
      borderWidth: 2,
    }
  ]
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: {
        font: { size: 14 },
        color: "#333"
      }
    },
    tooltip: {
      backgroundColor: "rgba(0,0,0,0.7)",
      titleColor: "#fff",
      bodyColor: "#fff",
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Time",
        font: { size: 14 }
      },
      ticks: { font: { size: 12 } }
    },
    y: {
      title: {
        display: true,
        text: "Heart Rate (bpm)",
        font: { size: 14 }
      },
      min: 60,
      max: 160,
      ticks: { stepSize: 20, font: { size: 12 } }
    }
  }
};

const SimpleChart = () => {
  return (
    <div style={{ width: "90%", maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <Line data={sampleData} options={chartOptions} />
    </div>
  );
};

export default SimpleChart;
