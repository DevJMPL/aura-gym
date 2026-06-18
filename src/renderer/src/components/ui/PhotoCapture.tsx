import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react'

interface PhotoCaptureProps {
  onCapture: (base64Image: string) => void
  onCancel: () => void
}

export function PhotoCapture({ onCapture, onCancel }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      // The video element might not be mounted yet because isLoading is true.
      // We handle binding the stream in a separate useEffect.
    } catch (err: any) {
      console.error('Error accessing camera:', err)
      setError(
        err.name === 'NotAllowedError'
          ? 'Acceso a la cámara denegado. Por favor permite el acceso en tu navegador o sistema.'
          : 'No se pudo encontrar o acceder a una cámara.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  // Bind the stream to the video element once it's mounted
  useEffect(() => {
    if (videoRef.current && stream && !isLoading && !capturedImage) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Error playing video:', err)
          }
        })
      }
    }
  }, [stream, isLoading, capturedImage])

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        // Draw the video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert to base64 jpeg
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageUrl)
        stopCamera()
      }
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage)
    }
  }

  const handleClose = () => {
    stopCamera()
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2 text-white drop-shadow-md">
            <Camera className="w-5 h-5" />
            <span className="font-semibold text-sm">{'Tomar Fotografía'}</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full backdrop-blur-md transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera/Preview Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-white font-medium">{error}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {'Reintentar'}
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/60 text-sm font-medium">{'Iniciando cámara...'}</p>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          )}

          {/* Hidden Canvas for extracting image */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Face guide overlay (only when capturing) */}
          {!capturedImage && !error && !isLoading && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-80 border-2 border-white/30 rounded-[100px] border-dashed" />
            </div>
          )}
        </div>

        {/* Controls Area */}
        <div className="p-6 bg-white flex items-center justify-center gap-4">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-6 py-3 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                <span>{'Tomar otra vez'}</span>
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-8 py-3 text-white font-bold bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30 rounded-2xl transition-all transform hover:scale-105"
              >
                <Check className="w-5 h-5" />
                <span>{'Usar esta foto'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleCapture}
              disabled={!!error || isLoading}
              className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-12 h-12 bg-slate-200 rounded-full group-hover:bg-primary-500 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
