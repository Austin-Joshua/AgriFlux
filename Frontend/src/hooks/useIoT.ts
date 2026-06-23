import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRealisticData } from './useRealisticData';

/**
 * useIoT Hook (Real-Time WebSocket Edition)
 * Provides instant IoT data syncing via Socket.IO with a robust polling fallback.
 */
export const useIoT = () => {
  // Demo Mode data generator
  const demoData = useRealisticData();

  // UI & Connection State
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Sensor State
  const [moisture, setMoisture] = useState(45.0);
  const [temperature, setTemperature] = useState(24.5);
  const [humidity, setHumidity] = useState(62.0);
  const [pumpActive, setPumpActive] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());

  // Refs for socket and polling
  const socketRef = useRef<Socket | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Simulation Logic (Demo Mode)
   */
  useEffect(() => {
    if (isLiveMode) return;

    const interval = setInterval(() => {
      setMoisture((prev) => {
        if (pumpActive) return Math.min(85, prev + 0.4);
        const drift = Math.random() * 0.15 - 0.05;
        return Math.max(20, prev - drift);
      });

      setTemperature((prev) => prev + (Math.random() * 0.1 - 0.05));
      setHumidity((prev) => prev + (Math.random() * 0.2 - 0.1));
      setLastSync(new Date());
      setIsOnline(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveMode, pumpActive]);

  /**
   * Socket.IO Integration
   */
  useEffect(() => {
    if (!isLiveMode) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      return;
    }

    // Initialize Socket
    // In local dev, backend is on 5001
    const socket = io('http://localhost:5001', {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('📡 [SOCKET] Connected to AgriFlux IoT Gateway');
      setSocketConnected(true);
      setIsOnline(true);
    });

    socket.on('iot-update', (data) => {
      console.log('📡 [SOCKET] Real-time data received');
      setMoisture(data.moisture);
      setTemperature(data.temperature);
      setHumidity(data.humidity);
      setPumpActive(data.pumpStatus);
      setLastSync(new Date(data.timestamp));
      setIsOnline(data.isOnline);
    });

    socket.on('disconnect', () => {
      console.warn('📡 [SOCKET] Disconnected');
      setSocketConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLiveMode]);

  /**
   * Fallback Polling (Smart Hybrid)
   * If live mode is active AND socket is NOT connected, poll every 5s.
   */
  const fetchLatestData = useCallback(async () => {
    try {
      const response = await fetch('/api/iot-data');
      const result = await response.json();
      if (result.success && result.data) {
        const { data } = result;
        setMoisture(data.moisture);
        setTemperature(data.temperature);
        setHumidity(data.humidity);
        setPumpActive(data.pumpStatus);
        setLastSync(new Date(data.timestamp));
        setIsOnline(data.isOnline);
      }
    } catch (error) {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    if (isLiveMode && !socketConnected) {
      console.info('📡 [FALLBACK] WebSocket inactive, starting 5s polling');
      pollingInterval.current = setInterval(fetchLatestData, 5000);
      fetchLatestData();
    } else {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [isLiveMode, socketConnected, fetchLatestData]);

  const togglePump = useCallback(async () => {
    const targetState = !pumpActive;
    // Optimistic local state update
    setPumpActive(targetState);
    setLastSync(new Date());

    if (socketConnected && socketRef.current) {
      console.log('📡 [IoT] Emitting pump status to Socket:', targetState);
      socketRef.current.emit('iot-control', { pumpStatus: targetState });
    } else {
      console.log('📡 [IoT] Fallback to POST control endpoint:', targetState);
      try {
        const response = await fetch('/api/iot-data/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pumpStatus: targetState }),
        });
        const result = await response.json();
        if (!result.success) {
          // Revert on failure
          setPumpActive(!targetState);
        }
      } catch (error) {
        console.error('❌ Failed to toggle pump remotely:', error);
        setPumpActive(!targetState);
      }
    }
    return targetState;
  }, [pumpActive, socketConnected]);

  const toggleMode = () => setIsLiveMode((prev) => !prev);

  return {
    moisture: Math.round(moisture * 10) / 10,
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity * 10) / 10,
    pumpStatus: pumpActive ? 'ON' : 'OFF',
    pumpActive,
    lastSync,

    isLiveMode,
    isLoading,
    isOnline,
    socketConnected,
    isSimulated: !isLiveMode,

    togglePump,
    toggleMode,
  };
};
