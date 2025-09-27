'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { 
  QrCodeIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { QRScannerProps, CameraPermissionStatus, ScanResult } from '@/types';
import { URIDService } from '@/lib/urid-service';

export function QRScanner({ onScan, onError, isActive, className = '' }: QRScannerProps) {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [cameraId, setCameraId] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>('checking');
  const [scanResult, setScanResult] = useState<ScanResult>('idle');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const scanCooldownRef = useRef<number>(1000); // 1 second cooldown

  // Mobile-optimized scanning configuration
  const scannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    disableFlip: false,
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    },
    rememberLastUsedCamera: true,
    showTorchButtonIfSupported: true
  };

  // Request camera permission and get available cameras
  const requestCameraPermission = useCallback(async () => {
    try {
      setPermissionStatus('checking');
      
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras.length === 0) {
        throw new Error('No cameras found on this device');
      }
      
      setAvailableCameras(cameras);
      
      // Prefer back camera for QR scanning
      const backCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      ) || cameras[0];
      
      setCameraId(backCamera.id);
      setPermissionStatus('granted');
      
    } catch (error) {
      console.error('Camera permission error:', error);
      setPermissionStatus('denied');
      onError('Camera permission denied. Please enable camera access to scan QR codes.');
    }
  }, [onError]);

  // Handle successful QR scan
  const handleSuccessfulScan = useCallback((decodedText: string) => {
    const now = Date.now();
    
    // Implement scan cooldown to prevent multiple rapid scans
    if (now - lastScanTime < scanCooldownRef.current) {
      return;
    }
    
    setLastScanTime(now);
    
    // Validate URID format
    if (!URIDService.validateURID(decodedText)) {
      setScanResult('error');
      onError('Invalid QR code format. Please scan a valid URID.');
      
      // Reset scan result after delay
      setTimeout(() => setScanResult('idle'), 2000);
      return;
    }
    
    // Provide haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    // Visual success indicator
    setScanResult('success');
    onScan(decodedText);
    
    // Reset scan result after delay
    setTimeout(() => setScanResult('idle'), 1000);
    
  }, [lastScanTime, onScan, onError]);

  // Handle scan errors
  const handleScanError = useCallback((errorMessage: string) => {
    // Only log actual errors, not routine scan failures
    if (!errorMessage.includes('No QR code found')) {
      console.error('QR scan error:', errorMessage);
    }
  }, []);

  // Start scanning
  const startScanner = useCallback(async () => {
    if (!qrReaderRef.current || !cameraId || scanner) {
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode(qrReaderRef.current.id);
      
      await html5QrCode.start(
        cameraId,
        scannerConfig,
        handleSuccessfulScan,
        handleScanError
      );
      
      setScanner(html5QrCode);
      setIsScanning(true);
      
    } catch (error) {
      console.error('Failed to start scanner:', error);
      onError('Failed to start camera. Please check camera permissions and try again.');
    }
  }, [cameraId, scanner, handleSuccessfulScan, handleScanError, onError]);

  // Stop scanning
  const stopScanner = useCallback(async () => {
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
        setScanner(null);
        setIsScanning(false);
      } catch (error) {
        console.error('Failed to stop scanner:', error);
      }
    }
  }, [scanner]);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (availableCameras.length <= 1) {
      return;
    }
    
    const currentIndex = availableCameras.findIndex(cam => cam.id === cameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    
    // Stop current scanner and start with new camera
    await stopScanner();
    setCameraId(nextCamera.id);
    
  }, [availableCameras, cameraId, stopScanner]);

  // Initialize camera permission on mount
  useEffect(() => {
    requestCameraPermission();
  }, [requestCameraPermission]);

  // Start/stop scanner based on isActive prop
  useEffect(() => {
    if (isActive && permissionStatus === 'granted' && cameraId && !scanner) {
      startScanner();
    } else if (!isActive && scanner) {
      stopScanner();
    }
    
    return () => {
      if (scanner) {
        stopScanner();
      }
    };
  }, [isActive, permissionStatus, cameraId, scanner, startScanner, stopScanner]);

  // Restart scanner when camera changes
  useEffect(() => {
    if (isActive && permissionStatus === 'granted' && cameraId && !scanner) {
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [cameraId, isActive, permissionStatus, scanner, startScanner]);

  const renderPermissionRequest = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
      <CameraIcon className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h3>
      <p className="text-gray-600 text-center mb-4">
        To scan QR codes, we need access to your camera
      </p>
      <Button 
        onClick={requestCameraPermission}
        variant="primary"
        className="min-h-[44px]"
      >
        Enable Camera
      </Button>
    </div>
  );

  const renderPermissionDenied = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
      <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">Camera Access Denied</h3>
      <p className="text-red-700 text-center mb-4">
        Please enable camera permissions in your browser settings to scan QR codes
      </p>
      <Button 
        onClick={requestCameraPermission}
        variant="secondary"
        className="min-h-[44px]"
      >
        Try Again
      </Button>
    </div>
  );

  const renderScanningInterface = () => (
    <div className="relative">
      {/* Camera Feed */}
      <div className="relative rounded-lg overflow-hidden bg-black">
        <div 
          id="qr-reader" 
          ref={qrReaderRef} 
          className="w-full h-80 md:h-96"
        />
        
        {/* Scan Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg" />
          
          {/* Scan status indicator */}
          {scanResult === 'success' && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-20">
              <div className="bg-green-600 rounded-full p-4">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
          
          {scanResult === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20">
              <div className="bg-red-600 rounded-full p-4">
                <XMarkIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex justify-center space-x-4">
        {availableCameras.length > 1 && (
          <Button
            onClick={switchCamera}
            variant="tertiary"
            className="min-h-[44px] px-4"
            disabled={!isScanning}
          >
            Switch Camera
          </Button>
        )}
        
        <Button
          onClick={isScanning ? stopScanner : startScanner}
          variant={isScanning ? "secondary" : "primary"}
          className="min-h-[44px] px-6"
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Button>
      </div>
      
      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {isScanning 
            ? 'Point your camera at a QR code to scan' 
            : 'Tap "Start Scanning" to begin'
          }
        </p>
      </div>
    </div>
  );

  return (
    <div className={`qr-scanner ${className}`}>
      <div className="mb-4 text-center">
        <QrCodeIcon className="w-12 h-12 text-blue-600 mx-auto mb-2" />
        <h2 className="text-xl font-semibold text-gray-900">Scan URID QR Code</h2>
        <p className="text-gray-600">Position the QR code within the camera frame</p>
      </div>
      
      {permissionStatus === 'checking' && (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {permissionStatus === 'denied' && renderPermissionDenied()}
      {permissionStatus === 'granted' && renderScanningInterface()}
    </div>
  );
}