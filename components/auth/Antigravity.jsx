"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Antigravity({
  count = 280,
  magnetRadius = 12,
  ringRadius = 5.8,
  waveSpeed = 0.6,
  waveAmplitude = 0.8,
  particleSize = 0.85,
  lerpSpeed = 0.035,
  autoAnimate = true,
  particleVariance = 1,
  rotationSpeed = 0.2,
  depthFactor = 0.5,
  pulseSpeed = 1.8,
  particleShape = "capsule",
  fieldStrength = 10,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 400;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 0, 50);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Visible viewport dimensions at z=0
    const vFOV = (camera.fov * Math.PI) / 180;
    const vHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const vWidth = vHeight * camera.aspect;

    // Geometry based on particleShape (scaled down for delicate elegance)
    let geometry;
    if (particleShape === "sphere") {
      geometry = new THREE.SphereGeometry(0.12, 12, 12);
    } else if (particleShape === "box") {
      geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    } else if (particleShape === "tetrahedron") {
      geometry = new THREE.TetrahedronGeometry(0.18);
    } else {
      geometry = new THREE.CapsuleGeometry(0.065, 0.24, 4, 8);
    }

    // Material with instance colors
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();

    // Particle state array
    const particles = [];
    const colorObj = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const x = (Math.random() - 0.5) * vWidth;
      const y = (Math.random() - 0.5) * vHeight;
      const z = (Math.random() - 0.5) * 16;
      const randomRadiusOffset = (Math.random() - 0.5) * 1.5;

      particles.push({
        t,
        factor,
        speed,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        randomRadiusOffset,
      });
    }

    scene.add(instancedMesh);

    // Mouse Tracking & Auto-Animate Flag
    const mouse = { x: 0.3, y: 0 };
    const virtualMouse = { x: (vWidth * 0.15), y: 0 };
    const isHoveringRight = { current: false };

    const handlePointerMove = (e) => {
      // Check if mouse is on the right side of the screen
      const isRightHalf = e.clientX >= window.innerWidth / 2;

      if (!isRightHalf) {
        // When mouse goes left over the split, immediately resume auto animation!
        isHoveringRight.current = false;
        return;
      }

      isHoveringRight.current = true;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouse.x = (clientX / rect.width) * 2 - 1;
      mouse.y = -(clientY / rect.height) * 2 + 1;
    };

    const handlePointerLeave = () => {
      isHoveringRight.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", handlePointerLeave);
    document.addEventListener("mouseleave", handlePointerLeave);

    // Conic 360° Hue Gradient Helper Function
    const getConicColor = (angleRad, timeOffset = 0) => {
      // Normalize angle to [0, 1]
      let normalizedAngle = ((angleRad + Math.PI) / (2 * Math.PI) + timeOffset) % 1;
      if (normalizedAngle < 0) normalizedAngle += 1;

      // Map 360° around the wheel:
      // 0.00 (0°)   -> Sky Blue (#38BDF8, ~198°)
      // 0.20 (72°)  -> Brand Blue/Indigo (#4F46E5, ~235°)
      // 0.40 (144°) -> Electric Purple (#8B5CF6, ~265°)
      // 0.60 (216°) -> Vibrant Magenta/Pink (#EC4899, ~325°)
      // 0.80 (288°) -> Warm Coral/Peach (#FB923C, ~28°)
      // 1.00 (360°) -> Back to Sky Blue (#38BDF8)
      const hue = (195 + normalizedAngle * 360) % 360;
      colorObj.setHSL(hue / 360, 0.92, 0.60);
      return colorObj;
    };

    // Clock
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      let destX, destY;

      if (autoAnimate && !isHoveringRight.current) {
        // Autonomous smooth orbital movement in the right panel area
        const orbitTime = elapsedTime * 0.65;
        destX = Math.sin(orbitTime) * (vWidth * 0.16) + (vWidth * 0.08);
        destY = Math.cos(orbitTime * 1.3) * (vHeight * 0.18);
      } else {
        destX = (mouse.x * vWidth) / 2;
        destY = (mouse.y * vHeight) / 2;
      }

      const smoothFactor = 0.045;
      virtualMouse.x += (destX - virtualMouse.x) * smoothFactor;
      virtualMouse.y += (destY - virtualMouse.y) * smoothFactor;

      const targetX = virtualMouse.x;
      const targetY = virtualMouse.y;
      const globalRotation = elapsedTime * rotationSpeed;
      const conicTimeOffset = elapsedTime * 0.05;

      // Animate Outer Ring Particles
      for (let i = 0; i < count; i++) {
        const particle = particles[i];
        particle.t += particle.speed / 2;
        const t = particle.t;

        const projectionFactor = 1 - particle.cz / 50;
        const projectedTargetX = targetX * projectionFactor;
        const projectedTargetY = targetY * projectionFactor;

        const dx = particle.mx - projectedTargetX;
        const dy = particle.my - projectedTargetY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetPosX = particle.mx;
        let targetPosY = particle.my;
        let targetPosZ = particle.mz * depthFactor;
        let currentAngle = Math.atan2(dy, dx);

        if (dist < magnetRadius) {
          const angle = currentAngle + globalRotation;
          const wave = Math.sin(t * waveSpeed + angle) * (0.4 * waveAmplitude);
          const deviation =
            particle.randomRadiusOffset * (4 / (fieldStrength + 0.1));
          const currentRingRadius = ringRadius + wave + deviation;

          targetPosX = projectedTargetX + currentRingRadius * Math.cos(angle);
          targetPosY = projectedTargetY + currentRingRadius * Math.sin(angle);
          targetPosZ =
            particle.mz * depthFactor +
            Math.sin(t) * (0.8 * waveAmplitude * depthFactor);

          currentAngle = angle;
        }

        particle.cx += (targetPosX - particle.cx) * lerpSpeed;
        particle.cy += (targetPosY - particle.cy) * lerpSpeed;
        particle.cz += (targetPosZ - particle.cz) * lerpSpeed;

        dummy.position.set(particle.cx, particle.cy, particle.cz);
        dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz);
        dummy.rotateX(Math.PI / 2);

        const currentDistToMouse = Math.sqrt(
          Math.pow(particle.cx - projectedTargetX, 2) +
            Math.pow(particle.cy - projectedTargetY, 2)
        );

        const distFromRing = Math.abs(currentDistToMouse - ringRadius);
        let scaleFactor = 1 - distFromRing / 7;
        scaleFactor = Math.max(0, Math.min(1, scaleFactor));

        const finalScale =
          scaleFactor *
          (0.75 + Math.sin(t * pulseSpeed) * 0.25 * particleVariance) *
          particleSize;

        dummy.scale.set(finalScale, finalScale, finalScale);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);

        // Apply Conic 360° Gradient to each particle based on its angle around target
        const particleAngle = Math.atan2(
          particle.cy - projectedTargetY,
          particle.cx - projectedTargetX
        );
        const particleColor = getConicColor(particleAngle, conicTimeOffset);
        instancedMesh.setColorAt(i, particleColor);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerLeave);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [
    count,
    magnetRadius,
    ringRadius,
    waveSpeed,
    waveAmplitude,
    particleSize,
    lerpSpeed,
    autoAnimate,
    particleVariance,
    rotationSpeed,
    depthFactor,
    pulseSpeed,
    particleShape,
    fieldStrength,
  ]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
}



