// ThreeCanvas.tsx
"use client"
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";

interface ThreeCanvasProps {
  type?: string;
  style?: React.CSSProperties;
}

const ThreeCanvas = ({ type = "default", style }: ThreeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(width, height, false);

    // type에 따라 다른 씬을 렌더링할 수 있도록 분기
    if (type === "christmas") {
      const pointLight = new THREE.PointLight(0xffffff, 100, 6);
      pointLight.position.set(0, 5, 0);
      scene.add(pointLight);

      const ambientLight = new THREE.AmbientLight(0x5f5f5f, 3);
      scene.add(ambientLight);

      const loader = new GLTFLoader();
      loader.load('/assets/blog/christmas/scene.gltf', function(gltf: GLTF) {
        scene.add(gltf.scene);
      }, undefined, function(error) {
        console.error('An error happened', error);
      });
      scene.rotation.y -= 60;

      camera.position.z = 5;
      camera.position.y = 1.5;

      // 마우스/터치 드래그로 카메라 회전 + 자동 회전
      let isDragging = false;
      let lastX = 0;
      let targetAzimuth = 0;
      let azimuth = 0;
      const radius = 5;
      const center = new THREE.Vector3(0, 1.5, 0);
      let autoRotateSpeed = 0.004;
      let autoRotateActive = true;
      let autoRotateTimeout: ReturnType<typeof setTimeout> | null = null;

      const updateCamera = () => {
        camera.position.x = center.x + radius * Math.sin(azimuth);
        camera.position.z = center.z + radius * Math.cos(azimuth);
        camera.lookAt(center);
      };
      updateCamera();

      const onPointerDown = (e: MouseEvent | TouchEvent) => {
        isDragging = true;
        autoRotateActive = false;
        if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
        lastX = (e instanceof MouseEvent) ? e.clientX : e.touches[0].clientX;
      };
      const onPointerMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        const clientX = (e instanceof MouseEvent) ? e.clientX : e.touches[0].clientX;
        const deltaX = clientX - lastX;
        lastX = clientX;
        targetAzimuth += deltaX * 0.01;
      };
      const onPointerUp = () => {
        isDragging = false;
        // 드래그 끝난 후 1.5초 뒤에 자동 회전 재개
        autoRotateTimeout = setTimeout(() => {
          autoRotateActive = true;
        }, 1500);
      };
      canvas.addEventListener('mousedown', onPointerDown);
      canvas.addEventListener('mousemove', onPointerMove);
      canvas.addEventListener('mouseup', onPointerUp);
      canvas.addEventListener('mouseleave', onPointerUp);
      canvas.addEventListener('touchstart', onPointerDown);
      canvas.addEventListener('touchmove', onPointerMove);
      canvas.addEventListener('touchend', onPointerUp);
      canvas.addEventListener('touchcancel', onPointerUp);

      // 애니메이션에서 카메라 위치 보간 + 자동 회전
      const animate = function () {
        requestAnimationFrame(animate);
        if (autoRotateActive && !isDragging) {
          targetAzimuth += autoRotateSpeed;
        }
        azimuth += (targetAzimuth - azimuth) * 0.1;
        updateCamera();
        renderer.render(scene, camera);
      };
      animate();

      // 정리
      return () => {
        canvas.removeEventListener('mousedown', onPointerDown);
        canvas.removeEventListener('mousemove', onPointerMove);
        canvas.removeEventListener('mouseup', onPointerUp);
        canvas.removeEventListener('mouseleave', onPointerUp);
        canvas.removeEventListener('touchstart', onPointerDown);
        canvas.removeEventListener('touchmove', onPointerMove);
        canvas.removeEventListener('touchend', onPointerUp);
        canvas.removeEventListener('touchcancel', onPointerUp);
        if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
      };
    } else {
      // 기본 큐브 예시
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      camera.position.z = 5;
    }

    const animate = function () {
      requestAnimationFrame(animate);
      if (type === "christmas") {
        scene.rotation.y += 0.004;
      } else {
        scene.children.forEach(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.01;
          }
        });
      }
      renderer.render(scene, camera);
    };

    animate();

    const onWindowResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    window.addEventListener('resize', onWindowResize, false);

    return () => {
      window.removeEventListener('resize', onWindowResize, false);
      renderer.dispose();
    };
  }, [type]);

  return <canvas ref={canvasRef} style={style ?? { width: "100%", height: 400, display: "block" }} />;
};

export default ThreeCanvas;