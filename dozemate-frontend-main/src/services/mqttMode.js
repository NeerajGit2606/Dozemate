import { connectMQTT } from '../mqtt/mqtt';

export const setupMqttMode = (setData, setChartData, chartRef, isAutoScrolling) => {
  const MAX_STORAGE_MINUTES = 1440; // 24 hours
  const DISPLAY_WINDOW_MINUTES = 30; // Window size
  const RIGHT_MARGIN_MINUTES = 2; // 2 minutes margin
  
  // Enhanced function to get active device ID from API
  const getActiveDeviceId = async () => {
    console.log("Fetching active device from server...");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return null;
      }
      
      const response = await fetch("https://admin.dozemate.com/api/devices/user", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);
        
        // First check if there's an active device
        if (data.activeDevice) {
          // Find the corresponding device to get its deviceId
          const activeDevice = data.devices.find(device => 
            device._id === data.activeDevice || 
            (typeof data.activeDevice === 'object' && device._id === data.activeDevice._id)
          );
          
          if (activeDevice) {
            console.log("Active device found:", activeDevice.deviceId);
            return activeDevice.deviceId;
          }
        }
        
        // If no active device, try the first device in the list
        if (data.devices && data.devices.length > 0) {
          console.log("No active device, using first device:", data.devices[0].deviceId);
          return data.devices[0].deviceId;
        }
        
        console.warn("No devices available for this user");
        return null;
      } else {
        const errorData = await response.json();
        console.error("API error:", errorData);
        return null;
      }
    } catch (error) {
      console.error("Error fetching active device:", error);
      return null;
    }
  };

  // Enhanced MQTT setup with better error handling and logging
  const setupMqtt = async () => {
    console.log("Setting up MQTT connection...");
    
    const deviceId = await getActiveDeviceId();
    if (!deviceId) {
      console.warn("No device ID found. Using default topic.");
    } else {
      console.log(`Using device ID: ${deviceId} for MQTT topics`);
    }
    
    const client = connectMQTT(deviceId);
    
    client.on('connect', () => {
      console.log(`MQTT Connected successfully${deviceId ? ` for device: ${deviceId}` : ''}`);
    });

    client.on('message', (topic, message) => {
      console.log(`Message received on topic: ${topic}`);
      try {
        const parsedData = JSON.parse(message.toString());
        console.log("Parsed data:", parsedData);
        const timestamp = new Date();

        // Update sensor data
        setData((prevData) => {
          const newData = {
            temp: parsedData.temp !== undefined ? parsedData.temp : prevData.temp,
            humidity: parsedData.humidity !== undefined ? parsedData.humidity : prevData.humidity,
            iaq: parsedData.iaq !== undefined ? parsedData.iaq : prevData.iaq,
            eco2: parsedData.eco2 !== undefined ? parsedData.eco2 : prevData.eco2,
            tvoc: parsedData.tvoc !== undefined ? parsedData.tvoc : prevData.tvoc,
            etoh: parsedData.etoh !== undefined ? parsedData.etoh : prevData.etoh,
            hrv: parsedData.hrv !== undefined ? parsedData.hrv : prevData.hrv,
            stress: parsedData.stress !== undefined ? parsedData.stress : prevData.stress,
          };
          console.log("Updated sensor data:", newData);
          return newData;
        });

        // Update chart data (rest of the function remains the same)
        setChartData((prevData) => {
          let newLabels = [...prevData.labels, timestamp];
          let newRespData = [...prevData.datasets[0].data, parsedData.resp || null];
          let newHRData = [...prevData.datasets[1].data, parsedData.hr || null];

          // Limit data to prevent memory issues
          if (newLabels.length > MAX_STORAGE_MINUTES) {
            newLabels = newLabels.slice(-MAX_STORAGE_MINUTES);
            newRespData = newRespData.slice(-MAX_STORAGE_MINUTES);
            newHRData = newHRData.slice(-MAX_STORAGE_MINUTES);
          }

          const updatedChartData = {
            labels: newLabels,
            datasets: [
              { ...prevData.datasets[0], data: newRespData },
              { ...prevData.datasets[1], data: newHRData },
            ],
          };

          localStorage.setItem("chartData", JSON.stringify(updatedChartData));

          // Auto-scrolling logic
          if (isAutoScrolling && chartRef.current) {
            const chart = chartRef.current;
            const visibleRange = DISPLAY_WINDOW_MINUTES * 60000;
            const marginTime = RIGHT_MARGIN_MINUTES * 60000;

            const latestTime = timestamp.getTime();
            chart.options.scales.x.min = new Date(latestTime - visibleRange + marginTime);
            chart.options.scales.x.max = new Date(latestTime + marginTime);
            chart.update();
          }

          return updatedChartData;
        });
      } catch (error) {
        console.error("Error processing MQTT message:", error, "Raw message:", message.toString());
      }
    });

    // Return the client for cleanup
    return client;
  };

  return setupMqtt();
};