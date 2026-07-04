"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

const playBeep = async () => {
    try {
        const audio = new Audio("/sounds/beep.mp3");
        audio.volume = 0.5;
        await audio.play();
    } catch {}
};
export function useBarcodeScanner(onScan: (value: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const reader = useRef<BrowserMultiFormatReader | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const [cameraIndex, setCameraIndex] = useState(0);

  const [isOpen, setIsOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const lastScannedRef = useRef("");
  const lastScanTimeRef = useRef(0);
  const scanLockRef = useRef(false);

  const startScanner = async (index = cameraIndex) => {
    try {
       scanLockRef.current = false;

      setLoading(true);

      setError("");

      setIsOpen(true);

      if (!reader.current) {
        reader.current = new BrowserMultiFormatReader();
      }

      const availableDevices =
        await BrowserMultiFormatReader.listVideoInputDevices();

      setDevices(availableDevices);

      let selectedCamera = availableDevices[index];

      if (!selectedCamera) {
        selectedCamera =
          availableDevices.find((d) =>
            d.label.toLowerCase().includes("back"),
          ) ??
          availableDevices.find((d) =>
            d.label.toLowerCase().includes("rear"),
          ) ??
          availableDevices.find((d) =>
            d.label.toLowerCase().includes("environment"),
          ) ??
          availableDevices[0];
      }

      await reader.current.decodeFromVideoDevice(
        selectedCamera.deviceId,
        videoRef.current!,
        async (result) => {
          if (!result) return;

          scanLockRef.current = true;

          const value = result.getText();

          const now = Date.now();

          if (
            value === lastScannedRef.current &&
            now - lastScanTimeRef.current < 2000
          ) {
            return;
          }

          lastScannedRef.current = value;
          lastScanTimeRef.current = now;

          navigator.vibrate?.(100);

          await playBeep();

          onScan(value);

          stopScanner();
        },
      );
    } catch (err) {
      console.error(err);

      setError("Unable to access camera.");
    }

    setLoading(false);
  };

 const stopScanner = () => {

  scanLockRef.current = false;
  // Stop all camera tracks
  const stream = videoRef.current?.srcObject as MediaStream | null;

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  // Remove the stream from the video element
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }

  // Destroy the reader instance
  reader.current = null;

  // Close the modal
  setIsOpen(false);

  setLoading(false);

  setError("");
};

   const switchCamera = async () => {
            if (devices.length <= 1) return;

            stopScanner();

            const next = (cameraIndex + 1) % devices.length;

            setCameraIndex(next);

            setTimeout(() => {
              startScanner(next);
            }, 200);
          };

  return {
    videoRef,
    isOpen,
    loading,
    error,
    devices,
    cameraIndex,
    startScanner,
    stopScanner,
    switchCamera,
  };
}
