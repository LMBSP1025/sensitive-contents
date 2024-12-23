// ThreeCanvas.tsx
"use client"
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";

const ThreeCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);

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

    const animate = function () {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.004;
      renderer.render(scene, camera);
    };

    animate();

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize, false);

    return () => {
      window.removeEventListener('resize', onWindowResize, false);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }} />;
};

export default ThreeCanvas;