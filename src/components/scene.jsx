"use client";
import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  Image,
  Text,
  useMask,
  Mask,
} from "@react-three/drei";
import {
  EffectComposer,
  HueSaturation,
  Bloom,
} from "@react-three/postprocessing";
import { useControls } from "leva";
import { KernelSize } from "postprocessing";
import * as THREE from "three";

export default function Scene() {
  const {
    saturation,
    environment,
    hue,
    noiseIntensity,
    noiseSpeed,
    bloomIntensity,
    bloomKernelSize,
    bloomLuminanceThreshold,
    bloomLuminanceSmoothing,
    bloomMipmapBlur,
    bloomResolutionX,
    bloomResolutionY,
    ...config
  } = useControls({
    thickness: { value: 3, min: 0, max: 3, step: 0.05 },
    roughness: { value: 0, min: 0, max: 1, step: 0.1 },
    ior: { value: 1.02, min: 0.8, max: 1.2, step: 0.01 },
    chromaticAberration: { value: 0.01, min: 0, max: 0.5, step: 0.01 },
    distortion: { value: 1, min: 0, max: 1, step: 0.05 },
    temporalDistortion: { value: 0.09, min: 0, max: 0.3, step: 0.01 },
    distortionScale: { value: 0.2, min: 0, max: 1, step: 0.05 },
    anisotropicBlur: { value: 0.8, min: 0, max: 10, step: 0.05 },
    saturation: { value: 0.48, min: 0.2, max: 0.8 },
    hue: { value: 0, min: 0, max: 2, step: 0.05 },
    color: "#fdf1ff",
    noiseIntensity: { value: 0.08, min: 0, max: 0.5, step: 0.01 },
    noiseSpeed: { value: 0.36, min: 0, max: 0.5, step: 0.01 },
    bloomIntensity: { value: 0, min: 0, max: 5, step: 0.1 }, // Bloom intensity
    bloomKernelSize: {
      value: KernelSize.MEDIUM,
      options: [
        KernelSize.VERY_SMALL,
        KernelSize.SMALL,
        KernelSize.MEDIUM,
        KernelSize.LARGE,
        KernelSize.VERY_LARGE,
        KernelSize.HUGE,
      ],
    }, // Blur kernel size
    bloomLuminanceThreshold: { value: 0.34, min: 0, max: 1, step: 0.01 }, // Luminance threshold
    bloomLuminanceSmoothing: { value: 0, min: 0, max: 1, step: 0.01 }, // Smoothness of the luminance threshold
    bloomMipmapBlur: { value: true }, // Enables or disables mipmap blur
    bloomResolutionX: { value: 0, min: 0, max: 2048, step: 1 }, // Horizontal resolution
    bloomResolutionY: { value: 0, min: 0, max: 2048, step: 1 }, // Vertical resolution
  });

  return (
    <Canvas style={{ background: "white" }}>
      <Bubble
        config={config}
        environment={environment}
        noiseIntensity={noiseIntensity}
        noiseSpeed={noiseSpeed}
      />
      <ambientLight intensity={1 * Math.PI} />
      <EffectComposer disableNormalPass multisampling={4}>
        <HueSaturation hue={hue} saturation={saturation} />
        <Bloom
          intensity={0.2} // The bloom intensity.
          kernelSize={bloomKernelSize} // blur kernel size
          luminanceThreshold={bloomLuminanceThreshold} // luminance threshold
          luminanceSmoothing={bloomLuminanceSmoothing} // smoothness of the luminance threshold
          mipmapBlur={bloomMipmapBlur} // Enables or disables mipmap blur
          resolutionX={bloomResolutionX} // The horizontal resolution
          resolutionY={bloomResolutionY} // The vertical resolution
        />
      </EffectComposer>
    </Canvas>
  );
}

function Bubble({ environment, config, noiseIntensity, noiseSpeed }) {
  const { viewport } = useThree();
  const mesh = useRef(null);

  const originalPositions = useRef(null);
  const time = useRef(0);

  useFrame((state, delta) => {
    time.current += delta * noiseSpeed;

    if (mesh.current && mesh.current.geometry) {
      const positions = mesh.current.geometry.attributes.position.array;

      // Store original positions if not already stored
      if (!originalPositions.current) {
        originalPositions.current = new Float32Array(positions.length);
        for (let i = 0; i < positions.length; i++) {
          originalPositions.current[i] = positions[i];
        }
      }

      // Update each vertex position with noise
      for (let i = 0; i < positions.length; i += 3) {
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
        positions[i] = x + (x / length) * noise;
        positions[i + 1] = y + (y / length) * noise;
        positions[i + 2] = z + (z / length) * noise;
      }

      mesh.current.geometry.attributes.position.needsUpdate = true;
      mesh.current.rotation.y += delta * 0.2;
      mesh.current.rotation.z += delta * 0.1;
    }
  });

  const stencil = useMask(1, false);

  return (
    <group scale={viewport.width / 3.75}>
      {/* <Text
        font={"/fonts/PPNeueMontreal-Bold.otf"}
        position={[0, 0, -1]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Correctiv
      </Text> */}
      <mesh ref={mesh}>
        <sphereGeometry args={[0.4, 64, 64]} />
        <MeshTransmissionMaterial {...config} />
      </mesh>
      <Image
        geometry={new THREE.CircleGeometry(1, 1)}
        position={[0, 0, 0]}
        url="/medias/lindner.jpg"
        alt="Test"
      />
    </group>
  );
}
