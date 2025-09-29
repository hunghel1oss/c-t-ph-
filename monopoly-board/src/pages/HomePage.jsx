import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  // State cơ bản
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentModel, setCurrentModel] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isHighPerformance, setIsHighPerformance] = useState(true);

  // Refs
  const heroRef = useRef(null);
  const modelRef = useRef(null);

  // Kiểm tra hiệu suất đơn giản
  useEffect(() => {
    const checkPerformance = () => {
      const isGoodDevice = navigator.hardwareConcurrency >= 4 && window.devicePixelRatio <= 2;
      setIsHighPerformance(isGoodDevice);
    };
    checkPerformance();
  }, []);

  // Animation tải trang
  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
      if (heroRef.current) {
        const elements = heroRef.current.querySelectorAll('.animate-in');
        elements.forEach((el, i) => {
          setTimeout(() => el.classList.add('show'), i * 200);
        });
      }
    }, 100);
  }, []);

  // Scroll tracking tối ưu
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto carousel đơn giản
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentModel(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // Data models đơn giản
  const models = [
    {
      id: 1,
      name: "Gaming Hub",
      icon: "🎮",
      color: "#00f5ff",
      description: "Ultimate gaming experience"
    },
    {
      id: 2,
      name: "Social Space",
      icon: "👥",
      color: "#8b5cf6", 
      description: "Connect with players worldwide"
    },
    {
      id: 3,
      name: "Creative Studio",
      icon: "🎨",
      color: "#ffd700",
      description: "Build your own worlds"
    }
  ];

  const currentModelData = models[currentModel];

  return (
    <div className={`homepage ${isLoaded ? 'loaded' : ''}`}>
      {/* Background đơn giản */}
      <div className="background">
        <div className="gradient-bg"></div>
        {isHighPerformance && (
          <div className="particles">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${10 + Math.random() * 5}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Header đơn giản */}
      <header className="header">
        <nav className="nav">
          <Link to="/" className="logo">
            <span className="logo-text">ULTRAL GAME</span>
          </Link>

          <div className="nav-links desktop-only">
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/monopoly" className="nav-link">Monopoly</Link>
            <Link to="/management" className="nav-link">Management</Link>
            <Link to="/history" className="nav-link">History</Link>
          </div>

          <div className="auth-buttons desktop-only">
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </div>

          <button className="mobile-menu-btn mobile-only" onClick={toggleMenu}>
            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </nav>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-content">
              <Link to="/about" onClick={closeMenu}>About</Link>
              <Link to="/monopoly" onClick={closeMenu}>Monopoly</Link>
              <Link to="/management" onClick={closeMenu}>Management</Link>
              <Link to="/history" onClick={closeMenu}>History</Link>
              <div className="mobile-auth">
                <Link to="/login" className="btn btn-outline" onClick={closeMenu}>Login</Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>Register</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero section đơn giản */}
      <main className="main">
        <section className="hero" ref={heroRef}>
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge animate-in">
                <span>🚀 Next-Gen Gaming</span>
              </div>
              
              <h1 className="hero-title animate-in">
                <span className="gradient-text">EXPERIENCE</span><br/>
                <span className="gradient-text">THE FUTURE</span><br/>
                <span className="gradient-text">OF GAMING</span>
              </h1>
              
              <p className="hero-description animate-in">
                Immerse yourself in revolutionary gaming experiences with 
                cutting-edge technology and unlimited creativity.
              </p>

              <div className="hero-stats animate-in">
                <div className="stat">
                  <div className="stat-number">10M+</div>
                  <div className="stat-label">Players</div>
                </div>
                <div className="stat">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Games</div>
                </div>
                <div className="stat">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Support</div>
                </div>
              </div>

              <div className="hero-actions animate-in">
                <Link to="/monopoly" className="btn btn-primary btn-large">
                  <span>🎮</span>
                  PLAY NOW
                </Link>
                <Link to="/about" className="btn btn-outline btn-large">
                  <span>🔍</span>
                  EXPLORE
                </Link>
              </div>
            </div>

            <div className="hero-visual animate-in">
              <div className="model-container" ref={modelRef}>
                <div 
                  className="model-card"
                  style={{ '--model-color': currentModelData.color }}
                >
                  <div className="model-icon">{currentModelData.icon}</div>
                  <h3 className="model-name">{currentModelData.name}</h3>
                  <p className="model-description">{currentModelData.description}</p>
                  
                  <div className="model-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${75 + currentModel * 8}%`,
                          backgroundColor: currentModelData.color
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">{75 + currentModel * 8}%</span>
                  </div>
                </div>

                <div className="model-nav">
                  {models.map((model, index) => (
                    <button
                      key={model.id}
                      className={`model-nav-btn ${index === currentModel ? 'active' : ''}`}
                      onClick={() => setCurrentModel(index)}
                      style={{ '--btn-color': model.color }}
                    >
                      <span>{model.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section đơn giản */}
        <section className="features">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title gradient-text">Why Choose Us?</h2>
              <p className="section-subtitle">
                Experience the next generation of gaming technology
              </p>
            </div>

            <div className="features-grid">
              {[
                {
                  icon: "🎮",
                  title: "Premium Graphics",
                  description: "Stunning visuals with advanced rendering technology"
                },
                {
                  icon: "🌐",
                  title: "Global Multiplayer",
                  description: "Connect with players worldwide instantly"
                },
                {
                  icon: "🤖",
                  title: "AI-Powered",
                  description: "Smart gameplay that adapts to your style"
                },
                {
                  icon: "⚡",
                  title: "Lightning Fast",
                  description: "Zero loading times with optimized performance"
                }
              ].map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
