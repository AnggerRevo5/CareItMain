"use client";

import React, { useState, useEffect } from "react";
import { checkBackendHealth } from "@/lib/api";

interface BackendStatusProps {
  className?: string;
}

const BackendStatus: React.FC<BackendStatusProps> = ({ className = "" }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const response = await checkBackendHealth();
      setIsOnline(response.status === 200 && !response.error);
      setLastChecked(new Date());
    } catch (error) {
      setIsOnline(false);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Cek status di awal abis delay singkat buat hindari conflict
    const initialTimeout = setTimeout(() => {
      checkStatus();
    }, 1000);

    // Cek status setiap 60 detik (frekuensi dikurangin)
    const interval = setInterval(checkStatus, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    if (isChecking) return "bg-yellow-500";
    if (isOnline === null) return "bg-gray-500";
    return isOnline ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = () => {
    if (isChecking) return "Checking...";
    if (isOnline === null) return "Unknown";
    return isOnline ? "Online" : "Offline";
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`w-3 h-3 rounded-full ${getStatusColor()} ${
          isChecking ? "animate-pulse" : ""
        }`}
      />
      <span className="text-sm text-gray-600">Backend: {getStatusText()}</span>
      {lastChecked && (
        <span className="text-xs text-gray-400">
          ({lastChecked.toLocaleTimeString()})
        </span>
      )}
      <button
        onClick={checkStatus}
        disabled={isChecking}
        className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
      >
        Refresh
      </button>
    </div>
  );
};

export default BackendStatus;
