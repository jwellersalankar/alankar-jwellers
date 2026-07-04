"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

const playBeep = () => {
  try {
    const audio = new Audio("/sounds/beep.mp3");
    audio.volume = 0.5;
    audio.play();
  } catch {}
};

export function useBarcodeScanner(onScan: (value: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ✅ Store the controls object returned by decodeFromVideoDevice —
  //    this is the ONLY reliable way to stop the internal decode loop.
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lastScannedRef = useRef("");
  const lastScanTimeRef = useRef(0);
  // ✅ Lock is now a simple boolean that is NEVER cleared inside stopScanner.
  //    It is only reset at the very start of a fresh startScanner() call.
  const scanLockRef = useRef(false);

  const stopScanner = () => {
    // ✅ Call the library's own stop() first — kills the decode loop cleanly.
    controlsRef.current?.stop();
    controlsRef.current = null;

    // Belt-and-suspenders: also kill the raw MediaStream tracks.
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // ✅ Do NOT reset scanLockRef here — leave it true so any in-flight
    //    callback frames that fire after stop() are still rejected by the guard.
    setIsOpen(false);
    setLoading(false);
    setError("");
  };

  const startScanner = async (index = cameraIndex) => {
    // ✅ Clean up any previous session before starting a new one.
    stopScanner();

    // ✅ Reset the lock only here, at the beginning of a deliberate new scan.
    scanLockRef.current = false;
    lastScannedRef.current = "";
    lastScanTimeRef.current = 0;

    try {
      setLoading(true);
      setError("");
      setIsOpen(true);

      const reader = new BrowserMultiFormatReader();
      const availableDevices =
        await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(availableDevices);

      let selectedCamera = availableDevices[index];
      if (!selectedCamera) {
        selectedCamera =
          availableDevices.find((d) =>
            d.label.toLowerCase().includes("back")
          ) ??
          availableDevices.find((d) =>
            d.label.toLowerCase().includes("rear")
          ) ??
          availableDevices.find((d) =>
            d.label.toLowerCase().includes("environment")
          ) ??
          availableDevices[0];
      }

      if (!selectedCamera) {
        setError("No camera found.");
        setLoading(false);
        return;
      }

      // ✅ decodeFromVideoDevice returns a controls object — store it.
      //    The third callback argument also exposes controls, but storing
      //    the returned Promise result is more reliable.
      const controls = await reader.decodeFromVideoDevice(
        selectedCamera.deviceId,
        videoRef.current!,
        (result, _err, innerControls) => {
          if (!result) return;

          // ✅ Check the lock BEFORE doing anything else.
          if (scanLockRef.current) return;
          scanLockRef.current = true; // ✅ Lock immediately — never cleared mid-session.

          const value = result.getText();
          const now = Date.now();

          // Debounce: ignore the same barcode scanned within 2 s.
          if (
            value === lastScannedRef.current &&
            now - lastScanTimeRef.current < 2000
          ) {
            // ✅ Release the lock so a *different* barcode can still be scanned.
            scanLockRef.current = false;
            return;
          }

          lastScannedRef.current = value;
          lastScanTimeRef.current = now;

          // ✅ Stop via the inner controls reference available in the callback —
          //    this is synchronous and immediately halts future callback firings.
          innerControls.stop();
          controlsRef.current = null;

          navigator.vibrate?.(100);
          playBeep();

          // ✅ Defer UI teardown slightly so the stop() call settles first.
          setTimeout(() => {
            stopScanner();
            onScan(value);
          }, 50);
        }
      );

      // ✅ Store the returned controls so stopScanner() can always reach them.
      controlsRef.current = controls;
    } catch (err) {
      console.error(err);
      setError("Unable to access camera.");
    }

    setLoading(false);
  };

  const switchCamera = async () => {
    if (devices.length <= 1) return;
    const next = (cameraIndex + 1) % devices.length;
    setCameraIndex(next);
    // startScanner already calls stopScanner at the top, no extra stop needed.
    await startScanner(next);
  };

  // ✅ Always stop the scanner when the component using this hook unmounts.
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

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