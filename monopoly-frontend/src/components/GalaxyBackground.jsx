import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const GalaxyBackground = () => {
    const mountRef = useRef(null);
    const pointsRef = useRef(null);

    // ✅ Tham số Galaxy (Đã chuyển sang useMemo)
    const parameters = useMemo(() => ({
        count: 100000,
        size: 0.01,
        radius: 2.15, 
        branches: 3, 
        spin: 3,
        randomness: 5,
        randomnessPower: 4,
        insideColor: '#ff6030', // Màu cam
        outsideColor: '#0949f0', // Màu xanh
    }), []);

    // ✅ Hàm tạo Thiên hà (sử dụng useCallback)
    const generateGalaxy = useCallback((scene, material) => {
        const { count, randomness, randomnessPower, radius, branches, spin, insideColor, outsideColor } = parameters;
        
        if (pointsRef.current) {
            pointsRef.current.geometry.dispose();
            pointsRef.current.material.dispose();
            scene.remove(pointsRef.current);
            pointsRef.current = null;
        }

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorInside = new THREE.Color(insideColor);
        const colorOutside = new THREE.Color(outsideColor);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const currentRadius = Math.random() * radius; // Đổi logic để tránh hàm Math.pow phức tạp
            const spinAngle = currentRadius * spin;
            const branchAngle = ((i % branches) / branches) * Math.PI * 2;
            
            const negPos = [1, -1];
            const randomX = Math.pow(Math.random(), randomnessPower) * randomness * negPos[Math.floor(Math.random() * negPos.length)];
            const randomY = Math.pow(Math.random(), randomnessPower) * randomness * negPos[Math.floor(Math.random() * negPos.length)];
            const randomZ = Math.pow(Math.random(), randomnessPower) * randomness * negPos[Math.floor(Math.random() * negPos.length)];

            // Vị trí (Tạo hình xoắn ốc)
            positions[i3] = Math.cos(branchAngle + spinAngle) * currentRadius + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * currentRadius + randomZ;

            // Màu sắc (Chuyển màu từ trong ra ngoài)
            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, currentRadius / radius);

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const newPoints = new THREE.Points(geometry, material);
        scene.add(newPoints);
        pointsRef.current = newPoints;
    }, [parameters]);

    // ✅ Khởi tạo Scene/Camera/Renderer
    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ canvas: mountRef.current, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // ✅ Material cho các hạt (Tối ưu từ code gốc)
        const material = new THREE.PointsMaterial({
            size: parameters.size,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        generateGalaxy(scene, material);
        
        // Cài đặt Camera
        camera.position.set(3, 3, 3);
        scene.add(camera);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enableZoom = false; 
        controls.enablePan = false;

        // Lighting (Cần thiết cho mesh, nhưng không ảnh hưởng Points, giữ để bảo vệ)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // ✅ Animation Loop
        const clock = new THREE.Clock();

        const tick = () => {
            const elapsedTime = clock.getElapsedTime();

            // ✅ HIỆU ỨNG THIÊN HÀ XOAY NHẸ (Mất khoảng 2 phút để quay hết 1 vòng)
            if (pointsRef.current) {
                pointsRef.current.rotation.y = elapsedTime * 0.05; // Tốc độ xoay nhẹ
            }
            
            // Camera chuyển động tạo cảm giác chiều sâu (rất chậm)
            camera.position.x = Math.cos(elapsedTime * 0.02) * 5; 
            camera.position.z = Math.sin(elapsedTime * 0.02) * 5;
            camera.lookAt(0, 0, 0);

            controls.update();

            renderer.render(scene, camera);
            window.requestAnimationFrame(tick);
        };
        
        tick();

        // ✅ Resize Handler
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            scene.traverse((object) => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    object.material.dispose();
                }
            });
        };
    }, [generateGalaxy, parameters]);

    // ✅ Component trả về Canvas HTML
    return <canvas ref={mountRef} className="fixed inset-0 w-full h-full z-0" />;
};

export default GalaxyBackground;