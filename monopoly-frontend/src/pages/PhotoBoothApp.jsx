import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Cần cho việc chuyển hướng quay lại Home
import toast from 'react-hot-toast';

const PhotoBoothApp = () => {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState('capture');
  const [capturedImages, setCapturedImages] = useState([null, null, null, null]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [countdownValue, setCountdownValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCaptureBtnDisabled, setCaptureBtnDisabled] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [cameraMode, setCameraMode] = useState('user');
  const [flashMode, setFlashMode] = useState(false);
  const [mirrorMode, setMirrorMode] = useState(true);
  const [timerMode, setTimerMode] = useState(3);
  const [burstMode, setBurstMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Advanced Editor State
  const [photostripBg, setPhotostripBg] = useState('#1a1a2e');
  const [currentFilter, setCurrentFilter] = useState('none');
  const [isDateEnabled, setDateEnabled] = useState(true);
  const [customText, setCustomText] = useState('');
  const [stickers, setStickers] = useState([]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [frameStyle, setFrameStyle] = useState('classic');
  const [layoutStyle, setLayoutStyle] = useState('vertical');
  const [showGrid, setShowGrid] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  // --- Refs ---
  const videoRef = useRef(null);
  const uploadInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const photostripRef = useRef(null);
  const editorRef = useRef(null);
  const navigate = useNavigate(); // FIX: Thêm navigate

  // --- Effects ---
  useEffect(() => {
    if (activeTab === 'capture') {
      initializeCamera();
    } else {
      stopCamera();
    }
  }, [activeTab, cameraMode]);

  useEffect(() => {
    loadGallery();
    loadSettings();
  }, []);

  useEffect(() => {
    if (autoSave) {
      saveSettings();
    }
  }, [brightness, contrast, saturation, frameStyle, layoutStyle, photostripBg, isDateEnabled, soundEnabled]);

  // --- Camera Functions ---
  const initializeCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: cameraMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setErrorMessage('');
      setCaptureBtnDisabled(false);
    } catch (error) {
      console.error("Camera error:", error);
      setErrorMessage("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
      setCaptureBtnDisabled(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const switchCamera = () => {
    setCameraMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'shutter') {
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        } else if (type === 'tick') {
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        }
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.warn("Audio API not available.");
    }
  };

  // --- Capture Functions ---
  const handleCaptureClick = () => {
    if (isCaptureBtnDisabled) return;
    
    if (burstMode) {
      handleBurstCapture();
    } else {
      handleSingleCapture();
    }
  };

  const handleSingleCapture = () => {
    setCaptureBtnDisabled(true);
    let timeLeft = timerMode;
    setCountdownValue(timeLeft);

    const countdownInterval = setInterval(() => {
      timeLeft--;
      playSound('tick');
      setCountdownValue(timeLeft > 0 ? timeLeft : '📸');
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        capturePhoto();
        setTimeout(() => {
          setCountdownValue(null);
          setCaptureBtnDisabled(false);
        }, 500);
      }
    }, 1000);
  };

  const handleBurstCapture = () => {
    setCaptureBtnDisabled(true);
    let burstCount = 0;
    const maxBurst = 4 - currentSlotIndex;
    
    const burstInterval = setInterval(() => {
      if (burstCount >= maxBurst || currentSlotIndex >= 4) {
        clearInterval(burstInterval);
        setCaptureBtnDisabled(false);
        return;
      }
      
      capturePhoto();
      burstCount++;
    }, 800);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || currentSlotIndex >= 4) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    
    // Flash effect
    if (flashMode) {
      document.body.style.backgroundColor = '#ffffff';
      setTimeout(() => {
        document.body.style.backgroundColor = '';
      }, 100);
    }
    
    // Mirror effect
    if (mirrorMode && cameraMode === 'user') {
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    playSound('shutter');
    const dataURL = canvas.toDataURL("image/jpeg", 0.9);
    
    const newImages = [...capturedImages];
    newImages[currentSlotIndex] = dataURL;
    setCapturedImages(newImages);
    
    const nextSlot = currentSlotIndex + 1;
    if (nextSlot >= 4) {
      setActiveTab('editor');
    }
    setCurrentSlotIndex(nextSlot);
  };

  // --- Filter Functions ---
  const getAdvancedFilterStyle = useCallback((filter) => {
    const baseFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    const filterMap = {
      'none': baseFilter,
      'b-and-w': `${baseFilter} grayscale(100%)`,
      'sepia': `${baseFilter} sepia(100%)`,
      'warm': `${baseFilter} hue-rotate(15deg) saturate(130%)`,
      'cold': `${baseFilter} hue-rotate(180deg) saturate(120%)`,
      'vintage': `${baseFilter} sepia(60%) contrast(90%) brightness(110%)`,
      'dramatic': `${baseFilter} contrast(150%) saturate(80%)`,
      'dreamy': `${baseFilter} blur(0.5px) brightness(110%) saturate(120%)`,
      'neon': `${baseFilter} hue-rotate(90deg) saturate(200%) contrast(120%)`,
      'cyberpunk': `${baseFilter} hue-rotate(270deg) saturate(150%) contrast(130%)`,
      'sunset': `${baseFilter} hue-rotate(30deg) saturate(140%) brightness(105%)`,
      'ocean': `${baseFilter} hue-rotate(200deg) saturate(120%) brightness(95%)`
    };
    
    return filterMap[filter] || baseFilter;
  }, [brightness, contrast, saturation]);

  // --- Layout Functions ---
  const getLayoutStyle = useCallback(() => {
    if (layoutStyle === 'horizontal') {
      return {
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        maxWidth: '100%',
        height: '120px'
      };
    } else if (layoutStyle === 'grid') {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        maxWidth: '240px',
        height: '240px'
      };
    }
    
    return {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '240px',
      height: 'auto'
    };
  }, [layoutStyle]);

  const getFrameStyle = useCallback(() => {
    const frameStyles = {
      'classic': 'border-4 border-white',
      'rounded': 'border-4 border-white rounded-lg',
      'polaroid': 'border-8 border-white border-b-16',
      'film': 'border-2 border-gray-800',
      'neon': 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50',
      'gold': 'border-4 border-yellow-400',
      'none': 'border-none'
    };
    
    return frameStyles[frameStyle] || frameStyles['classic'];
  }, [frameStyle]);

  // --- Editor Functions ---
  const handleImageEdit = (index) => {
    setSelectedImageIndex(index);
  };

  const handleAddSticker = (stickerChar) => {
    const newSticker = {
      id: Date.now(),
      char: stickerChar,
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 70 + 15}%`,
      size: Math.random() * 20 + 20,
      rotation: Math.random() * 60 - 30
    };
    setStickers([...stickers, newSticker]);
  };

  const removeSticker = (id) => {
    setStickers(stickers.filter(s => s.id !== id));
  };

  // --- Save/Load Functions ---
  const loadGallery = () => {
    const savedGallery = localStorage.getItem('photoboothGallery');
    if (savedGallery) {
      try {
        setGallery(JSON.parse(savedGallery));
      } catch (error) {
        console.error('Error loading gallery:', error);
      }
    }
  };

  const saveToGallery = (imageData) => {
    const newItem = {
      id: Date.now(),
      src: imageData,
      timestamp: new Date().toISOString(),
      settings: {
        filter: currentFilter,
        brightness,
        contrast,
        saturation,
        frameStyle,
        layoutStyle,
        photostripBg
      }
    };
    
    const newGallery = [newItem, ...gallery];
    setGallery(newGallery);
    localStorage.setItem('photoboothGallery', JSON.stringify(newGallery));
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('photoboothSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setBrightness(settings.brightness || 100);
        setContrast(settings.contrast || 100);
        setSaturation(settings.saturation || 100);
        setFrameStyle(settings.frameStyle || 'classic');
        setLayoutStyle(settings.layoutStyle || 'vertical');
        setPhotostripBg(settings.photostripBg || '#1a1a2e');
        setDateEnabled(settings.isDateEnabled ?? true);
        setSoundEnabled(settings.soundEnabled ?? true);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  };

  const saveSettings = () => {
    const settings = {
      brightness,
      contrast,
      saturation,
      frameStyle,
      layoutStyle,
      photostripBg,
      isDateEnabled,
      soundEnabled
    };
    localStorage.setItem('photoboothSettings', JSON.stringify(settings));
  };

  // =========================================================
  // === HÀM ĐÃ SỬA: handleDownloadAndSave (Export to Canvas) ===
  // =========================================================
  const handleDownloadAndSave = async () => {
    const node = photostripRef.current;
    if (!node) return;

    try {
      const exportQualityMultiplier = 3; 
      const validImages = capturedImages.filter(Boolean);
      
      // Khởi tạo Canvas và tính toán kích thước
      let finalCanvasWidth = 0;
      let finalCanvasHeight = 0;

      if (layoutStyle === 'horizontal') {
        finalCanvasWidth = 480 * exportQualityMultiplier;
        finalCanvasHeight = 120 * exportQualityMultiplier;
      } else if (layoutStyle === 'grid') {
        finalCanvasWidth = 240 * exportQualityMultiplier;
        finalCanvasHeight = 240 * exportQualityMultiplier;
      } else { // vertical
        finalCanvasWidth = 240 * exportQualityMultiplier;
        finalCanvasHeight = 800 * exportQualityMultiplier; 
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = finalCanvasWidth;
      canvas.height = finalCanvasHeight;

      // Fill background
      ctx.fillStyle = photostripBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Load tất cả ảnh
      const imagePromises = validImages.map(imgSrc => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = imgSrc;
        });
      });

      const loadedImageElements = await Promise.all(imagePromises);

      // Định nghĩa kích thước khung ảnh (trên canvas export)
      let frameW = 0;
      let frameH = 0;

      if (layoutStyle === 'horizontal') {
        frameW = canvas.width / 4;
        frameH = canvas.height;
      } else if (layoutStyle === 'grid') {
        frameW = canvas.width / 2;
        frameH = canvas.height / 2;
      } else { // vertical
        frameW = canvas.width;
        frameH = canvas.height / 4;
      }

      loadedImageElements.forEach((img, index) => {
          let dx, dy;
          
          if (layoutStyle === 'horizontal') {
            dx = index * frameW;
            dy = 0;
          } else if (layoutStyle === 'grid') {
            dx = (index % 2) * frameW;
            dy = Math.floor(index / 2) * frameH;
          } else { // vertical
            dx = 0;
            dy = index * frameH;
          }
          
          // --- ÁP DỤNG object-fit: cover logic cho Canvas ---
          const imgAspectRatio = img.width / img.height;
          const destAspectRatio = frameW / frameH;
          
          let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

          if (imgAspectRatio > destAspectRatio) {
              // Ảnh gốc rộng hơn khung -> cắt bớt chiều rộng
              sWidth = img.height * destAspectRatio;
              sx = (img.width - sWidth) / 2;
          } else {
              // Ảnh gốc cao hơn khung -> cắt bớt chiều cao
              sHeight = img.width / destAspectRatio;
              sy = (img.height - sHeight) / 2;
          }
          
          // Tạo canvas tạm để áp dụng filter
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          // Áp dụng filter (brightness, contrast, saturation)
          tempCtx.filter = getAdvancedFilterStyle(currentFilter);
          tempCtx.drawImage(img, 0, 0);

          // Vẽ phần ảnh đã được cắt vào đúng khung trên canvas cuối cùng
          ctx.drawImage(
            tempCanvas,
            sx, sy, sWidth, sHeight, // Source (phần cắt từ ảnh gốc)
            dx, dy, frameW, frameH  // Destination (khung trên canvas cuối cùng)
          );
          // ----------------------------------------------------

          // Add frame (simple border for export)
          if (frameStyle !== 'none') {
            ctx.strokeStyle = frameStyle === 'neon' ? '#00ffff' : frameStyle === 'gold' ? '#FFD700' : '#ffffff';
            ctx.lineWidth = 4 * exportQualityMultiplier;
            ctx.strokeRect(dx, dy, frameW, frameH);
          }
      });
            
      // Add date and custom text
      const fontSize = 14 * exportQualityMultiplier;
      const margin = 10 * exportQualityMultiplier;
      ctx.fillStyle = ['#000000', '#1a1a2e'].includes(photostripBg) ? '#ffffff' : '#000000';
      ctx.font = `bold ${fontSize}px Arial`;

      if (customText) {
        ctx.textAlign = 'center';
        ctx.fillText(customText, canvas.width / 2, margin + fontSize);
      }

      if (isDateEnabled) {
        ctx.textAlign = 'right';
        ctx.fillText(new Date().toLocaleDateString('vi-VN'), canvas.width - margin, canvas.height - margin);
      }
      
      // Export
      const dataURL = canvas.toDataURL('image/png', 1.0);
      
      // Download
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `photostrip-${Date.now()}.png`;
      a.click();
      
      // Save to gallery
      saveToGallery(dataURL);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi xuất ảnh. Vui lòng kiểm tra console.');
    }
  };

  const resetState = () => {
    setCapturedImages([null, null, null, null]);
    setCurrentSlotIndex(0);
    setStickers([]);
    setCurrentFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCustomText('');
    setSelectedImageIndex(null);
  };

  const deleteFromGallery = (id) => {
    const updatedGallery = gallery.filter(item => item.id !== id);
    setGallery(updatedGallery);
    localStorage.setItem('photoboothGallery', JSON.stringify(updatedGallery));
  };

  // --- Components ---
  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
        activeTab === tabName
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
          : 'text-gray-300 hover:text-white hover:bg-white/10'
      }`}
    >
      <i className={`bx ${icon} text-lg`}></i>
      {label}
    </button>
  );

  const ControlSlider = ({ label, value, onChange, min = 0, max = 200, step = 1 }) => (
    <div className="control-group">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}: {value}%</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            PhotoBooth Pro
          </h1>
          <p className="text-gray-300 text-lg">Tạo những khoảnh khắc đẹp nhất với công nghệ AI</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-4 p-2 bg-black/20 backdrop-blur-lg rounded-full border border-white/10">
            <TabButton tabName="capture" label="Chụp Ảnh" icon="bx-camera" />
            <TabButton tabName="upload" label="Tải Ảnh" icon="bx-upload" />
            <TabButton tabName="editor" label="Chỉnh Sửa" icon="bx-edit-alt" />
            <TabButton tabName="gallery" label="Bộ Sưu Tập" icon="bx-image" />
            {/* FIX: Thêm nút Quay lại Home */}
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/10"
            >
                <i className="bx bx-home text-lg"></i>
                Về Trang Chủ
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          
          {/* Capture Tab */}
          {activeTab === 'capture' && (
            <div className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Camera View */}
                <div className="flex-1">
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/20">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${mirrorMode && cameraMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    
                    {/* Grid Overlay */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="border border-white/20"></div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Countdown */}
                    {countdownValue && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-8xl font-bold text-white animate-pulse">
                          {countdownValue}
                        </div>
                      </div>
                    )}
                    
                    {/* Camera Controls */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <button
                        onClick={switchCamera}
                        className="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                      >
                        <i className="bx bx-refresh text-xl"></i>
                      </button>
                      <button
                        onClick={() => setFlashMode(!flashMode)}
                        className={`p-3 rounded-full transition-colors ${flashMode ? 'bg-yellow-500 text-black' : 'bg-black/50 text-white hover:bg-black/70'}`}
                      >
                        <i className="bx bx-flash text-xl"></i>
                      </button>
                      <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-3 rounded-full transition-colors ${showGrid ? 'bg-blue-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                      >
                        <i className="bx bx-grid-alt text-xl"></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* Captured Images Preview */}
                  <div className="flex justify-center gap-4 mt-6">
                    {capturedImages.map((img, index) => (
                      <div
                        key={index}
                        className={`w-20 h-20 rounded-lg border-2 overflow-hidden ${
                          currentSlotIndex === index ? 'border-purple-500 ring-2 ring-purple-400' : 'border-gray-600'
                        }`}
                      >
                        {img ? (
                          <img src={img} alt={`Slot ${index + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <i className="bx bx-image text-2xl text-gray-500"></i>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Camera Settings */}
                <div className="w-full lg:w-80">
                  <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-4">Cài Đặt Camera</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Thời gian đếm ngược</label>
                        <select
                          value={timerMode}
                          onChange={(e) => setTimerMode(Number(e.target.value))}
                          className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 text-white"
                        >
                          <option value={0}>Chụp ngay</option>
                          <option value={3}>3 giây</option>
                          <option value={5}>5 giây</option>
                          <option value={10}>10 giây</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Chế độ liên tục</span>
                        <button
                          onClick={() => setBurstMode(!burstMode)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${burstMode ? 'bg-purple-600' : 'bg-gray-600'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${burstMode ? 'translate-x-6' : ''}`}></div>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Lật ảnh</span>
                        <button
                          onClick={() => setMirrorMode(!mirrorMode)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${mirrorMode ? 'bg-purple-600' : 'bg-gray-600'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${mirrorMode ? 'translate-x-6' : ''}`}></div>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Âm thanh</span>
                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-purple-600' : 'bg-gray-600'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : ''}`}></div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Capture Button */}
                    <button
                      onClick={handleCaptureClick}
                      disabled={isCaptureBtnDisabled || currentSlotIndex >= 4}
                      className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <i className="bx bx-camera text-2xl"></i>
                      {currentSlotIndex < 4 ? `Chụp Ảnh ${currentSlotIndex + 1}/4` : 'Đã đủ ảnh!'}
                    </button>
                    
                    {errorMessage && (
                      <p className="text-red-400 text-sm mt-4 text-center">{errorMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Tải Ảnh Lên</h2>
                <p className="text-gray-300">Chọn tối đa 4 ảnh để tạo photostrip</p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {[0, 1, 2, 3].map(index => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-800 rounded-xl border-2 border-dashed border-gray-600 hover:border-purple-500 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                    onClick={() => uploadInputRefs[index].current?.click()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      ref={uploadInputRefs[index]}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const newImages = [...capturedImages];
                            newImages[index] = event.target?.result;
                            setCapturedImages(newImages);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    
                    {capturedImages[index] ? (
                      <img
                        src={capturedImages[index]}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center group-hover:text-purple-400 transition-colors">
                        <i className="bx bx-image-add text-6xl mb-2"></i>
                        <span className="text-sm">Tải ảnh lên</span>
                      </div>
                    )}
                    
                    {capturedImages[index] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newImages = [...capturedImages];
                          newImages[index] = null;
                          setCapturedImages(newImages);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="bx bx-x text-sm"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={() => {
                    if (capturedImages.filter(Boolean).length > 0) {
                      setActiveTab('editor');
                    }
                  }}
                  disabled={capturedImages.filter(Boolean).length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                >
                  <i className="bx bx-edit-alt text-xl"></i>
                  Chỉnh sửa ảnh
                </button>
                
                <button
                  onClick={() => {
                    resetState();
                    setActiveTab('capture');
                  }}
                  className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-300 flex items-center gap-2"
                >
                  <i className="bx bx-camera text-xl"></i>
                  Chụp ảnh mới
                </button>
              </div>
            </div>
          )}

          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <div className="p-8">
              <div ref={editorRef} className="flex flex-col xl:flex-row gap-8">
                {/* Preview Area */}
                <div className="flex-1 flex justify-center">
                  <div className="relative" style={{ perspective: '1000px' }}>
                    <div
                      ref={photostripRef}
                      className="p-4 rounded-lg shadow-2xl transition-all duration-500"
                      style={{
                        backgroundColor: photostripBg,
                        transform: 'rotateY(-5deg) rotateX(2deg)',
                        ...getLayoutStyle()
                      }}
                    >
                      {capturedImages.filter(Boolean).map((img, index) => (
                        <div
                          key={index}
                          className={`relative overflow-hidden cursor-pointer group ${getFrameStyle()}`}
                          onClick={() => handleImageEdit(index)}
                          style={{
                            filter: getAdvancedFilterStyle(currentFilter),
                            ...(layoutStyle === 'vertical' ? { height: '200px' } : 
                                layoutStyle === 'horizontal' ? { width: '120px', height: '100%' } : 
                                { aspectRatio: '1' })
                          }}
                        >
                          <img
                            src={img}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {selectedImageIndex === index && (
                            <div className="absolute inset-0 bg-purple-500/20 border-2 border-purple-400"></div>
                          )}
                          
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <i className="bx bx-edit text-white text-2xl"></i>
                          </div>
                        </div>
                      ))}
                      
                      {/* Date and Custom Text */}
                      {isDateEnabled && (
                        <div
                          className="text-center text-sm font-mono mt-2"
                          style={{
                            color: ['#000000', '#1a1a2e'].includes(photostripBg) ? '#FFFFFF' : '#000000'
                          }}
                        >
                          {new Date().toLocaleDateString('vi-VN')}
                        </div>
                      )}
                      
                      {customText && (
                        <div
                          className="text-center text-lg font-bold mt-2"
                          style={{
                            color: ['#000000', '#1a1a2e'].includes(photostripBg) ? '#FFFFFF' : '#000000'
                          }}
                        >
                          {customText}
                        </div>
                      )}
                    </div>
                    
                    {/* Stickers */}
                    {stickers.map(sticker => (
                      <div
                        key={sticker.id}
                        className="absolute cursor-pointer group"
                        style={{
                          top: sticker.top,
                          left: sticker.left,
                          fontSize: `${sticker.size}px`,
                          transform: `rotate(${sticker.rotation}deg)`,
                          zIndex: 10
                        }}
                        onClick={() => removeSticker(sticker.id)}
                      >
                        {sticker.char}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <i className="bx bx-x text-white text-xs"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Controls Panel */}
                <div className="w-full xl:w-96">
                  <div className="bg-black/20 rounded-xl p-6 border border-white/10 h-fit max-h-[80vh] overflow-y-auto">
                    <h3 className="text-2xl font-bold text-white mb-6">Chỉnh Sửa</h3>
                    
                    <div className="space-y-6">
                      {/* Layout Controls */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Bố Cục</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'vertical', icon: 'bx-menu', label: 'Dọc' },
                            { value: 'horizontal', icon: 'bx-dots-horizontal-rounded', label: 'Ngang' },
                            { value: 'grid', icon: 'bx-grid-alt', label: 'Lưới' }
                          ].map(layout => (
                            <button
                              key={layout.value}
                              onClick={() => setLayoutStyle(layout.value)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                layoutStyle === layout.value
                                  ? 'border-purple-500 bg-purple-500/20'
                                  : 'border-gray-600 hover:border-gray-500'
                              }`}
                            >
                              <i className={`bx ${layout.icon} text-xl text-white block mb-1`}></i>
                              <span className="text-xs text-gray-300">{layout.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Frame Styles */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Khung Ảnh</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'classic', label: 'Cổ điển' },
                            { value: 'rounded', label: 'Bo góc' },
                            { value: 'polaroid', label: 'Polaroid' },
                            { value: 'film', label: 'Film' },
                            { value: 'neon', label: 'Neon' },
                            { value: 'gold', label: 'Vàng' },
                            { value: 'none', label: 'Không' }
                          ].map(frame => (
                            <button
                              key={frame.value}
                              onClick={() => setFrameStyle(frame.value)}
                              className={`p-2 text-sm rounded-lg border transition-all ${
                                frameStyle === frame.value
                                  ? 'border-purple-500 bg-purple-500/20 text-white'
                                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
                              }`}
                            >
                              {frame.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Filters */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Bộ Lọc</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'none', label: 'Gốc' },
                            { value: 'b-and-w', label: 'Đen trắng' },
                            { value: 'sepia', label: 'Sepia' },
                            { value: 'warm', label: 'Ấm áp' },
                            { value: 'cold', label: 'Lạnh lùng' },
                            { value: 'vintage', label: 'Vintage' },
                            { value: 'dramatic', label: 'Kịch tính' },
                            { value: 'dreamy', label: 'Mơ màng' },
                            { value: 'neon', label: 'Neon' },
                            { value: 'cyberpunk', label: 'Cyberpunk' },
                            { value: 'sunset', label: 'Hoàng hôn' },
                            { value: 'ocean', label: 'Đại dương' }
                          ].map(filter => (
                            <button
                              key={filter.value}
                              onClick={() => setCurrentFilter(filter.value)}
                              className={`p-2 text-sm rounded-lg border transition-all ${
                                currentFilter === filter.value
                                  ? 'border-purple-500 bg-purple-500/20 text-white'
                                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
                              }`}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Color Adjustments */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Màu Sắc</h4>
                        <div className="space-y-3">
                          <ControlSlider label="Độ sáng" value={brightness} onChange={setBrightness} />
                          <ControlSlider label="Độ tương phản" value={contrast} onChange={setContrast} />
                          <ControlSlider label="Độ bão hòa" value={saturation} onChange={setSaturation} />
                        </div>
                      </div>
                      
                      {/* Background Colors */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Nền</h4>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            '#1a1a2e', '#000000', '#FFFFFF', '#ff6b6b', '#4ecdc4',
                            '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8'
                          ].map(color => (
                            <button
                              key={color}
                              onClick={() => setPhotostripBg(color)}
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                photostripBg === color
                                  ? 'border-purple-500 ring-2 ring-purple-400'
                                  : 'border-gray-600 hover:border-gray-500'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Stickers */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Stickers</h4>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            '✨', '💖', '🚀', '🔥', '💀', '👽', '🌟', '💎', '🦄', '🌈',
                            '⚡', '🎉', '🎊', '🎈', '🎀', '🌸', '🌺', '🌻', '🌙', '☀️',
                            '💫', '⭐', '🌟', '✨', '💥', '💯', '🔮', '🎭', '🎪', '🎨'
                          ].map((sticker, index) => (
                            <button
                              key={`${sticker}-${index}`}
                              onClick={() => handleAddSticker(sticker)}
                              className="text-2xl p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                              {sticker}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Custom Text */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Văn Bản</h4>
                        <input
                          type="text"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder="Nhập văn bản tùy chỉnh..."
                          className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      
                      {/* Options */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Tùy Chọn</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isDateEnabled}
                              onChange={(e) => setDateEnabled(e.target.checked)}
                              className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-gray-300">Hiển thị ngày tháng</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoSave}
                              onChange={(e) => setAutoSave(e.target.checked)}
                              className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-gray-300">Tự động lưu cài đặt</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                          onClick={handleDownloadAndSave}
                          className="py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <i className="bx bx-download text-lg"></i>
                          Lưu
                        </button>
                        
                        <button
                          onClick={() => {
                            resetState();
                            setActiveTab('capture');
                          }}
                          className="py-3 px-4 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <i className="bx bx-refresh text-lg"></i>
                          Làm mới
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Bộ Sưu Tập</h2>
                <p className="text-gray-300">
                  {gallery.length > 0 ? `${gallery.length} ảnh đã lưu` : 'Chưa có ảnh nào'}
                </p>
              </div>
              
              {gallery.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {gallery.map(item => (
                    <div key={item.id} className="group relative">
                      <div className="bg-black/20 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
                        <img
                          src={item.src}
                          alt="Saved photostrip"
                          className="w-full h-auto rounded-lg"
                        />
                        
                        <div className="mt-3 flex justify-between items-center text-sm text-gray-400">
                          <span>{new Date(item.timestamp).toLocaleDateString('vi-VN')}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = item.src;
                                a.download = `photostrip-${item.id}.png`;
                                a.click();
                              }}
                              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                              title="Tải xuống"
                            >
                              <i className="bx bx-download text-white"></i>
                            </button>
                            
                            <button
                              onClick={() => deleteFromGallery(item.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <i className="bx bx-trash text-white"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="text-white text-sm">
                            <div className="flex flex-wrap gap-1 mb-1">
                              {item.settings?.filter && (
                                <span className="px-2 py-1 bg-purple-500/80 rounded text-xs">
                                  {item.settings.filter}
                                </span>
                              )}
                              {item.settings?.frameStyle && (
                                <span className="px-2 py-1 bg-blue-500/80 rounded text-xs">
                                  {item.settings.frameStyle}
                                </span>
                              )}
                              {item.settings?.layoutStyle && (
                                <span className="px-2 py-1 bg-green-500/80 rounded text-xs">
                                  {item.settings.layoutStyle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <i className="bx bx-image text-6xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400 text-lg mb-6">Chưa có ảnh nào trong bộ sưu tập</p>
                  <button
                    onClick={() => setActiveTab('capture')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <i className="bx bx-camera text-xl"></i>
                    Bắt đầu chụp ảnh
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p>PhotoBooth Pro - Tạo những khoảnh khắc đẹp nhất ✨</p>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style>{`
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .animate-ping-once {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) 1;
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PhotoBoothApp;
