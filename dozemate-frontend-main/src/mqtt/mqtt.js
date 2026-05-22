import mqtt from 'mqtt';

const MQTT_BROKER_URL = process.env.REACT_APP_MQTT_BROKER_URL || 'mqtt://172.105.98.123:1883';
const MQTT_USERNAME = process.env.REACT_APP_MQTT_USERNAME || 'doze';
const MQTT_PASSWORD = process.env.REACT_APP_MQTT_PASSWORD || 'bK67ZwBHSWkl';

let client = null;

export const connectMQTT = (deviceId) => {
  console.log(`Connecting to MQTT broker: ${MQTT_BROKER_URL}`);
  
  if (client) {
    // If client exists but we have a different device, disconnect first
    if (client._deviceId !== deviceId) {
      console.log('Disconnecting existing client for new device');
      client.end();
      client = null;
    } else {
      console.log('Reusing existing MQTT connection');
      return client;
    }
  }

  client = mqtt.connect(MQTT_BROKER_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clientId: `dashboard_${Math.random().toString(16).substring(2, 10)}`
  });

  // Store deviceId with the client for future reference
  client._deviceId = deviceId;

  client.on('connect', () => {
    console.log(`MQTT client connected to ${MQTT_BROKER_URL}`);
    
    // Subscribe to topics based on deviceId
    if (deviceId) {
      subscribeToDeviceTopics(deviceId);
    } 
  });

  client.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });

  client.on('reconnect', () => {
    console.log('Attempting to reconnect to MQTT broker...');
  });

  client.on('offline', () => {
    console.warn('MQTT client is offline');
  });

  return client;
};



// Subscribe to device-specific topics
export const subscribeToDeviceTopics = (deviceId) => {
  if (!deviceId) {
    console.warn('No deviceId provided for subscription');
    return;
  }

  const healthTopic = `/${deviceId}/health`;
  const sleepTopic = `/${deviceId}/sleep`;

  console.log(`Subscribing to device topics for ${deviceId}:`);
  console.log(`- Health topic: ${healthTopic}`);
  console.log(`- Sleep topic: ${sleepTopic}`);

  client.subscribe(healthTopic, (err) => {
    if (!err) {
      console.log(`Successfully subscribed to health topic: ${healthTopic}`);
    } else {
      console.error(`Failed to subscribe to health topic: ${err}`);
    }
  });

  client.subscribe(sleepTopic, (err) => {
    if (!err) {
      console.log(`Successfully subscribed to sleep topic: ${sleepTopic}`);
    } else {
      console.error(`Failed to subscribe to sleep topic: ${err}`);
    }
  });
};

export const disconnectMQTT = () => {
  if (client) {
    console.log('Disconnecting MQTT client');
    client.end();
    client = null;
  }
};