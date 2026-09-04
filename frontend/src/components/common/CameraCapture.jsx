import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertTriangle, Eye, RotateCw, Sparkles, Video, Loader2, ShieldCheck, AlertOctagon } from 'lucide-react';
import { aiService } from '../../services/aiService';

/**
 * CameraCapture Component for Citizen Dashboard
 * Exclusively provides device camera capture (No file upload/browse option).
 * Supports live WebRTC camera stream, photo capture, preview, retake, and AI road validation.
 */
const CameraCapture = ({ 
  capturedImage, 
  onImageCapture, 
  onImageClear,
  onValidationChange,
  label = "Road Damage Photo",
  required = false,
  enableAiValidation = true,
  title = "Captured Road Damage Photo",
  subtitle = "Ready to attach with complaint report",
  capturePrompt = "Take Live Photo of Road Damage",
  captureDescription = "Capture the pothole or road distress directly using your device camera for immediate inspection & AI analysis.",
  hideDeviceCameraFallback = false
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  // AI Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null); // { is_valid: bool, error_message: str }

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);

  // Sync external capturedImage if provided or cleared
  useEffect(() => {
    if (!capturedImage) {
      setPreviewUrl(null);
      setValidationResult(null);
    } else if (capturedImage instanceof Blob || capturedImage instanceof File) {
      const url = URL.createObjectURL(capturedImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof capturedImage === 'string') {
      setPreviewUrl(capturedImage);
    }
  }, [capturedImage]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Check if multiple camera devices exist
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setHasMultipleCameras(videoDevices.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setIsCameraActive(false);
  };

  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    setIsCameraActive(true);
    setIsStreaming(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream not supported in this browser. Trying direct camera capture...');
      }

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsStreaming(true);
          }).catch(err => {
            console.warn('Auto-play error:', err);
            setIsStreaming(true);
          });
        };
      }
    } catch (err) {
      console.warn('Live getUserMedia camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings or use the capture button.'
          : (err.message || 'Could not start device camera.')
      );
      setIsCameraActive(false);
    }
  };

  const handleToggleFacingMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (isCameraActive) {
      startCamera(newMode);
    }
  };

  // Perform AI Validation on Captured Photo
  const validatePhotoWithAI = async (file) => {
    if (!enableAiValidation) {
      if (onValidationChange) onValidationChange(true, null);
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    try {
      const res = await aiService.validateImage(file);
      console.log('================ [AI VALIDATION DEBUG] ================');
      console.log(`Road Validation Result:     ${res.road_validation_result || (res.is_valid ? 'VALID_ROAD_IMAGE' : 'INVALID_NON_ROAD_IMAGE')}`);
      console.log(`Validation Confidence:      ${res.road_validation_confidence !== undefined ? res.road_validation_confidence : 'N/A'}`);
      console.log(`YOLO Allowed:               ${res.yolo_allowed}`);
      console.log(`Reason:                     ${res.reason || 'N/A'}`);
      console.log('=======================================================');

      if (res.is_valid === false || res.road_validation_result === 'INVALID_NON_ROAD_IMAGE') {
        const errorMsg = "This image does not appear to contain a road. Please capture a clear image of the road and the damaged area.";
        setValidationResult({
          is_valid: false,
          road_validation_result: 'INVALID_NON_ROAD_IMAGE',
          error_title: 'Invalid Image',
          error_message: errorMsg,
          reason: res.reason
        });
        if (onValidationChange) onValidationChange(false, errorMsg);
      } else {
        setValidationResult({
          is_valid: true,
          road_validation_result: 'VALID_ROAD_IMAGE',
          confidence: res.road_validation_confidence,
          error_message: null
        });
        if (onValidationChange) onValidationChange(true, null);
      }
    } catch (err) {
      console.warn('AI validation check error:', err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : "This image does not appear to contain a road. Please capture a clear image of the road and the damaged area.";
      setValidationResult({
        is_valid: false,
        road_validation_result: 'INVALID_NON_ROAD_IMAGE',
        error_title: 'Invalid Image',
        error_message: errorMsg
      });
      if (onValidationChange) onValidationChange(false, errorMsg);
    } finally {
      setIsValidating(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    
    // If front camera, flip horizontally for mirror preview match
    if (facingMode === 'user') {
      context.translate(width, 0);
      context.scale(-1, 1);
    }
    
    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `road_damage_${timestamp}.jpg`, { type: 'image/jpeg' });
        const objUrl = URL.createObjectURL(blob);
        
        setPreviewUrl(objUrl);
        stopCameraStream();
        if (onImageCapture) {
          onImageCapture(file, objUrl);
        }
        validatePhotoWithAI(file);
      }
    }, 'image/jpeg', 0.92);
  };

  // Fallback native camera capture handler (strictly camera capture via capture="environment")
  const handleFallbackCameraCapture = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
      setCameraError('');
      if (onImageCapture) {
        onImageCapture(file, objUrl);
      }
      validatePhotoWithAI(file);
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setValidationResult(null);
    if (onValidationChange) onValidationChange(true, null);
    if (onImageClear) {
      onImageClear();
    }
    startCamera(facingMode);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setValidationResult(null);
    if (onValidationChange) onValidationChange(true, null);
    stopCameraStream();
    if (onImageClear) {
      onImageClear();
    }
  };

  return (
    <div className="space-y-3">
      
      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden input strictly for direct native device camera capture fallback */}
      <input
        ref={fallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFallbackCameraCapture}
      />

      {/* 1. STATE: IMAGE PREVIEW (AFTER PHOTO IS TAKEN) */}
      {previewUrl ? (
        <div className="space-y-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-white block">
                  {title}
                </span>
                <span className="text-[10px] text-slate-400">
                  {subtitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retake Photo
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Photo Preview Frame */}
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black max-h-64 flex items-center justify-center group">
            <img
              src={previewUrl}
              alt="Road Damage Preview"
              className="w-full h-56 object-cover"
            />
            
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Camera className="h-3 w-3" />
              <span>Camera Capture</span>
            </div>

            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] text-slate-300 border border-slate-800">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* AI Image Verification Feedback */}
          {isValidating && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-xs text-amber-300">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400 shrink-0" />
              <span>Analyzing image with AI to verify road surface & damage features...</span>
            </div>
          )}

          {validationResult && !validationResult.is_valid && !isValidating && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 space-y-3 shadow-lg shadow-rose-950/40">
              <div className="flex items-start gap-3">
                <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-rose-300 text-sm tracking-tight">Invalid Image</h4>
                  <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                    This image does not appear to contain a road. Please capture a clear image of the road and the damaged area.
                  </p>
                  {validationResult.reason && (
                    <p className="text-[10px] text-rose-400/80 font-mono mt-1 pt-1 border-t border-rose-500/20">
                      Diagnostics: {validationResult.reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-rose-500/20">
                <span className="text-[10px] text-rose-300/80 italic font-medium">
                  Complaint submission is disabled until a valid road image is captured.
                </span>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retake Photo
                </button>
              </div>
            </div>
          )}

          {validationResult && validationResult.is_valid && !isValidating && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>✓ Valid Road Surface Verified – Ready for complaint report submission.</span>
            </div>
          )}
        </div>
      ) : isCameraActive ? (
        
        /* 2. STATE: LIVE CAMERA VIEWFINDER */
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-4 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-rose-400" />
                Device Camera Live Viewfinder
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                  title="Switch Camera (Front/Back)"
                >
                  <RotateCw className="h-3.5 w-3.5 text-amber-400" />
                  <span>Flip</span>
                </button>
              )}

              <button
                type="button"
                onClick={stopCameraStream}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Cancel camera"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Live Video Stream Viewport with Viewfinder Overlay */}
          <div className="relative rounded-xl overflow-hidden bg-black border border-slate-700 aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {/* Viewfinder crosshairs & defect framing overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-36 border-2 border-dashed border-amber-400/70 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-mono text-amber-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                  Align road damage here
                </span>
              </div>
            </div>

            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-slate-300 font-mono">
              Live: {facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
            </div>
          </div>

          {/* Shutter Capture Button */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-amber-300"
            >
              <div className="p-1 rounded-full bg-slate-950 text-amber-400">
                <Camera className="h-4 w-4" />
              </div>
              <span>Capture Photo Now</span>
            </button>

            <button
              type="button"
              onClick={stopCameraStream}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>
      ) : (

        /* 3. STATE: DEFAULT TAKE PHOTO / OPEN CAMERA BUTTON (NO FILE UPLOAD) */
        <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-center space-y-3">
          
          {cameraError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2 text-left mb-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span>{cameraError}</span>
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => fallbackInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-bold border border-rose-500/40"
                  >
                    📸 Open Native Device Camera
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Camera className="h-6 w-6" />
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-white">
                {capturePrompt}
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                {captureDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Take Photo / Capture Image</span>
              </button>

              {!hideDeviceCameraFallback && (
                <button
                  type="button"
                  onClick={() => fallbackInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
                  title="Launch device native camera app"
                >
                  <Video className="h-3.5 w-3.5 text-amber-400" />
                  <span>Device Camera</span>
                </button>
              )}
            </div>

            <span className="text-[10px] text-slate-500 font-mono block pt-1">
              Direct device camera capture only • No file upload allowed
            </span>
          </div>

        </div>
      )}

    </div>
  );
};

export default CameraCapture;
