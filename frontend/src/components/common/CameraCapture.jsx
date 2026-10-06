import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RefreshCw, 
  X, 
  Check, 
  AlertTriangle, 
  RotateCw, 
  Video, 
  Loader2, 
  ShieldCheck, 
  AlertOctagon, 
  CheckCircle2
} from 'lucide-react';
import { aiService } from '../../services/aiService';

/**
 * CameraCapture Component for Citizen Dashboard
 * Exclusively provides live WebRTC camera capture.
 * Features: live camera stream, viewfinder crosshairs, flip camera, instant shutter capture, preview, retake, and AI road validation.
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
  captureDescription = "Capture the road damage directly using your device camera for immediate AI inspection."
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
  const [userConfirmedRoad, setUserConfirmedRoad] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Sync external capturedImage if provided or cleared
  useEffect(() => {
    if (!capturedImage) {
      setPreviewUrl(null);
      setValidationResult(null);
      setUserConfirmedRoad(false);
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
        throw new Error('Live camera is not supported or accessible in this browser. Please allow camera permissions.');
      }

      let stream = null;
      // 1. Try preferred facing mode & HD resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (err1) {
        console.warn('Initial HD constraints failed, trying basic facingMode constraint:', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode },
            audio: false
          });
        } catch (err2) {
          console.warn('facingMode failed, falling back to any video input:', err2);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

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
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
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
    setUserConfirmedRoad(false);

    try {
      const res = await aiService.validateImage(file);
      console.log('================ [AI VALIDATION DEBUG] ================');
      console.log(`Road Validation Result:     ${res.road_validation_result || (res.is_valid ? 'VALID_ROAD_IMAGE' : 'INVALID_NON_ROAD_IMAGE')}`);
      console.log(`Validation Confidence:      ${res.road_validation_confidence !== undefined ? res.road_validation_confidence : 'N/A'}`);
      console.log(`YOLO Allowed:               ${res.yolo_allowed}`);
      console.log(`Reason:                     ${res.reason || 'N/A'}`);
      console.log('=======================================================');

      if (res.is_valid === false || res.road_validation_result === 'INVALID_NON_ROAD_IMAGE') {
        const errorMsg = "This image does not appear to contain a road surface. Please capture a clear live photo of the road damage.";
        setValidationResult({
          is_valid: false,
          road_validation_result: 'INVALID_NON_ROAD_IMAGE',
          error_title: 'Unverified Road Image',
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
      const errorMsg = typeof detail === 'string' ? detail : "This image does not appear to contain a road surface. Please capture a clear live photo of the road damage.";
      setValidationResult({
        is_valid: false,
        road_validation_result: 'INVALID_NON_ROAD_IMAGE',
        error_title: 'Unverified Road Image',
        error_message: errorMsg
      });
      if (onValidationChange) onValidationChange(false, errorMsg);
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualConfirmRoad = () => {
    setUserConfirmedRoad(true);
    if (onValidationChange) onValidationChange(true, null);
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
        setCameraError('');
        stopCameraStream();
        if (onImageCapture) {
          onImageCapture(file, objUrl);
        }
        validatePhotoWithAI(file);
      }
    }, 'image/jpeg', 0.92);
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setValidationResult(null);
    setUserConfirmedRoad(false);
    if (onValidationChange) onValidationChange(true, null);
    if (onImageClear) {
      onImageClear();
    }
    startCamera(facingMode);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setValidationResult(null);
    setUserConfirmedRoad(false);
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
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all flex items-center gap-1.5 active:scale-95"
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
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black max-h-72 flex items-center justify-center group">
            <img
              src={previewUrl}
              alt="Road Damage Preview"
              className="w-full h-64 object-contain bg-slate-950"
            />
            
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-slate-950/85 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Camera className="h-3 w-3" />
              <span>Live Camera Capture</span>
            </div>

            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-slate-950/85 backdrop-blur-md text-[10px] text-slate-300 border border-slate-800">
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

          {validationResult && !validationResult.is_valid && !isValidating && !userConfirmedRoad && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 space-y-3 shadow-lg shadow-amber-950/40">
              <div className="flex items-start gap-3">
                <AlertOctagon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-amber-300 text-sm tracking-tight">AI Notice: Road Surface Verification</h4>
                  <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                    {validationResult.error_message}
                  </p>
                  {validationResult.reason && (
                    <p className="text-[10px] text-amber-400/80 font-mono mt-1 pt-1 border-t border-amber-500/20">
                      Diagnostics: {validationResult.reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/20">
                <span className="text-[10px] text-amber-300/80 italic font-medium">
                  If this is a genuine road surface or defect photo, you can confirm below:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualConfirmRoad}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition-all flex items-center gap-1 active:scale-95"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Confirm & Proceed With Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all flex items-center gap-1 active:scale-95"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retake Live Photo
                  </button>
                </div>
              </div>
            </div>
          )}

          {((validationResult && validationResult.is_valid) || userConfirmedRoad) && !isValidating && (
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
                Live Camera Viewfinder
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
              <div className="w-56 h-40 border-2 border-dashed border-amber-400/70 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-mono text-amber-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
                  Align road damage here
                </span>
              </div>
            </div>

            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-slate-300 font-mono">
              Live: {facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
            </div>
          </div>

          {/* Shutter Capture Button */}
          <div className="flex items-center justify-center gap-3 pt-1">
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

        /* 3. STATE: DEFAULT SINGLE TAKE LIVE PHOTO INTERFACE */
        <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-6 text-center space-y-4">
          
          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2 text-left mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{cameraError}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
              <Camera className="h-7 w-7" />
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-white font-['Outfit']">
                {capturePrompt}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                {captureDescription}
              </p>
            </div>

            {/* Action Button: ONLY Take Live Photo */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Take Live Photo</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-500 font-mono block pt-1">
              Direct live camera capture • Verified on-site reporting
            </span>
          </div>

        </div>
      )}

    </div>
  );
};

export default CameraCapture;
