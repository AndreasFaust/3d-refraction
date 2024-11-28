"use client";
import React, { useRef } from "react";
import { TextureLoader } from "three";

import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { MeshTransmissionMaterial, useMask, Mask } from "@react-three/drei";
import { useControls } from "leva";

export default function Scene() {
  const { noiseIntensity, noiseSpeed, ...config } = useControls({
    thickness: { value: 3, min: 0, max: 3, step: 0.05 },
    roughness: { value: 0, min: 0, max: 1, step: 0.1 },
    ior: { value: 0.96, min: 0.8, max: 1.2, step: 0.01 },
    chromaticAberration: { value: 0.03, min: 0, max: 0.5, step: 0.01 },
    distortion: { value: 0.5, min: 0, max: 1, step: 0.05 },
    temporalDistortion: { value: 0.35, min: 0, max: 0.3, step: 0.01 },
    distortionScale: { value: 0.45, min: 0, max: 1, step: 0.05 },
    anisotropicBlur: { value: 0.8, min: 0, max: 10, step: 0.05 },
    color: "#fdf1ff",
    noiseIntensity: { value: 0.08, min: 0, max: 0.5, step: 0.01 },
    noiseSpeed: { value: 0.36, min: 0, max: 0.5, step: 0.01 },
  });

  return (
    <Canvas style={{ background: "white" }}>
      <Bubble
        config={config}
        noiseIntensity={noiseIntensity}
        noiseSpeed={noiseSpeed}
      />
      <ambientLight intensity={1 * Math.PI} />
    </Canvas>
  );
}

function Bubble({ config, noiseIntensity, noiseSpeed, hue, saturation }) {
  const { viewport } = useThree();
  const mesh1 = useRef(null);
  const mesh2 = useRef(null);

  const originalPositions = useRef(null);
  const time = useRef(0);

  useFrame((state, delta) => {
    time.current += delta * noiseSpeed;

    if (mesh1.current && mesh1.current.geometry) {
      const positions1 = mesh1.current.geometry.attributes.position.array;
      const positions2 = mesh2.current.geometry.attributes.position.array;

      // Store original positions if not already stored
      if (!originalPositions.current) {
        originalPositions.current = new Float32Array(positions1.length);
        for (let i = 0; i < positions1.length; i++) {
          originalPositions.current[i] = positions1[i];
        }
      }

      // Update each vertex position with noise
      for (let i = 0; i < positions1.length; i += 3) {
        const x = originalPositions.current[i];
        const y = originalPositions.current[i + 1];
        const z = originalPositions.current[i + 2];

        // Create noise based on position and time
        const noise =
          (Math.sin(x * 5 + time.current) +
            Math.sin(y * 5 + time.current) +
            Math.sin(z * 5 + time.current)) *
          noiseIntensity;

        // Apply noise in the direction of the vertex normal
        const length = Math.sqrt(x * x + y * y + z * z);
        positions1[i] = x + (x / length) * noise;
        positions1[i + 1] = y + (y / length) * noise;
        positions1[i + 2] = z + (z / length) * noise;

        positions2[i] = x + (x / length) * noise;
        positions2[i + 1] = y + (y / length) * noise;
        positions2[i + 2] = z + (z / length) * noise;
      }

      mesh1.current.geometry.attributes.position.needsUpdate = true;
      mesh1.current.rotation.y += delta * 0.2;
      mesh1.current.rotation.z += delta * 0.1;

      mesh2.current.geometry.attributes.position.needsUpdate = true;
      mesh2.current.rotation.y += delta * 0.2;
      mesh2.current.rotation.z += delta * 0.1;
    }
  });

  const stencil = useMask(1, false);
  const texture = useLoader(TextureLoader, "/lola.jpg");

  return (
    <group scale={viewport.width / 3.75}>
      <mesh ref={mesh1}>
        <sphereGeometry args={[0.4, 64, 64]} />
        <MeshTransmissionMaterial {...config} />
      </mesh>
      <Mask ref={mesh2} id={1}>
        <sphereGeometry args={[0.4, 64, 64]} />
      </Mask>
      <mesh>
        <planeGeometry args={[1.25, 1.25]} />
        <meshStandardMaterial map={texture} {...stencil} />
      </mesh>
    </group>
  );
}
