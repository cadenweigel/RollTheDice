'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

interface DiceCanvasProps {
  isRolling: boolean;
  lastRoll: {
    dieA: number;
    dieB: number;
  } | null;
}

// Die face mapping - each face shows a specific value
// Standard die configuration where opposite faces sum to 7
const DIE_FACE_MAPPING = {
  // Face 1: shows value 1
  1: { rotation: [0, 0, 0], pips: [[0, 0, 0.51]] },
  // Face 2: shows value 2  
  2: { rotation: [0, -Math.PI / 2, 0], pips: [[-0.25, -0.25, 0.51], [0.25, 0.25, 0.51]] },
  // Face 3: shows value 3
  3: { rotation: [0, Math.PI / 2, 0], pips: [[-0.25, -0.25, 0.51], [0, 0, 0.51], [0.25, 0.25, 0.51]] },
  // Face 4: shows value 4
  4: { rotation: [Math.PI / 2, 0, 0], pips: [[-0.25, -0.25, 0.51], [0.25, -0.25, 0.51], [-0.25, 0.25, 0.51], [0.25, 0.25, 0.51]] },
  // Face 5: shows value 5
  5: { rotation: [-Math.PI / 2, 0, 0], pips: [[-0.25, -0.25, 0.51], [0.25, -0.25, 0.51], [0, 0, 0.51], [-0.25, 0.25, 0.51], [0.25, 0.25, 0.51]] },
  // Face 6: shows value 6
  6: { rotation: [Math.PI, 0, 0], pips: [[-0.25, -0.25, 0.51], [0.25, -0.25, 0.51], [-0.25, 0, 0.51], [0.25, 0, 0.51], [-0.25, 0.25, 0.51], [0.25, 0.25, 0.51]] }
}

// Die component with proper face mapping and smooth animation
function Die({ 
  value, 
  position, 
  isRolling, 
  onRollComplete 
}: { 
  value: number; 
  position: [number, number, number]; 
  isRolling: boolean;
  onRollComplete?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [currentRotation, setCurrentRotation] = useState<[number, number, number]>([0, 0, 0])
  const [targetRotation, setTargetRotation] = useState<[number, number, number]>([0, 0, 0])
  const velocityRef = useRef<[number, number, number]>([0, 0, 0])
  
  useEffect(() => {
    if (meshRef.current) {
      if (isRolling) {
        // Start rolling animation with random rotations and physics-like movement
        const startRolling = () => {
          // Set initial random rotation
          const randomX = Math.random() * Math.PI * 2
          const randomY = Math.random() * Math.PI * 2
          const randomZ = Math.random() * Math.PI * 2
          
          setCurrentRotation([randomX, randomY, randomZ])
          velocityRef.current = [(Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3]
          
          meshRef.current!.rotation.set(randomX, randomY, randomZ)
        }
        
        startRolling()
        
        // Physics-like rolling animation
        let animationId: number
        const animateRolling = () => {
          if (meshRef.current && isRolling) {
            // Update velocity with some randomness
            const newVelocity: [number, number, number] = [
              velocityRef.current[0] + (Math.random() - 0.5) * 0.1,
              velocityRef.current[1] + (Math.random() - 0.5) * 0.1,
              velocityRef.current[2] + (Math.random() - 0.5) * 0.1
            ]
            
            // Apply velocity to rotation
            const newRotation: [number, number, number] = [
              meshRef.current.rotation.x + newVelocity[0],
              meshRef.current.rotation.y + newVelocity[1],
              meshRef.current.rotation.z + newVelocity[2]
            ]
            
            // Apply rotation
            meshRef.current.rotation.set(newRotation[0], newRotation[1], newRotation[2])
            setCurrentRotation(newRotation as [number, number, number])
            velocityRef.current = newVelocity
            
            animationId = requestAnimationFrame(animateRolling)
          }
        }
        
        animateRolling()
        
        return () => {
          if (animationId) {
            cancelAnimationFrame(animationId)
          }
        }
      } else {
        // Stop rolling and show the correct face
        const targetFace = DIE_FACE_MAPPING[value as keyof typeof DIE_FACE_MAPPING]
        if (targetFace) {
          setTargetRotation(targetFace.rotation)
          
          // Smooth animation to target rotation
          const animateToTarget = () => {
            if (meshRef.current) {
              const current = meshRef.current.rotation
              const target = targetFace.rotation
              
              // Smooth interpolation with easing
              const easing = 0.08
              current.x += (target[0] - current.x) * easing
              current.y += (target[1] - current.y) * easing
              current.z += (target[2] - current.z) * easing
              
              setCurrentRotation([current.x, current.y, current.z] as [number, number, number])
              
              // Check if we're close enough to target
              const threshold = 0.005
              if (Math.abs(current.x - target[0]) > threshold || 
                  Math.abs(current.y - target[1]) > threshold || 
                  Math.abs(current.z - target[2]) > threshold) {
                requestAnimationFrame(animateToTarget)
              } else {
                // Snap to exact target
                meshRef.current.rotation.set(target[0], target[1], target[2])
                setCurrentRotation(target as [number, number, number])
                velocityRef.current = [0, 0, 0]
                onRollComplete?.()
              }
            }
          }
          
          animateToTarget()
        }
      }
    }
  }, [isRolling, value, onRollComplete]) // Removed velocity from dependencies

  // Create die with pips as part of the material (no separate pip objects)
  const createDie = () => {
    // Create a custom material that renders pips as part of the die
    const material = new THREE.ShaderMaterial({
      uniforms: {
        dieValue: { value: value },
        isRolling: { value: isRolling ? 1.0 : 0.0 },
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float dieValue;
        uniform float isRolling;
        uniform float time;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        // Function to draw a circle (pip)
        float circle(vec2 uv, vec2 center, float radius) {
          float dist = distance(uv, center);
          return smoothstep(radius, radius - 0.02, dist);
        }
        
        // Get pip positions for each face value
        vec2 getPipPosition(int pipIndex, float faceValue) {
          if (faceValue < 0.5) return vec2(-1.0, -1.0); // Invalid
          
          if (faceValue < 1.5) {
            // Face 1: center
            if (pipIndex == 0) return vec2(0.5, 0.5);
          } else if (faceValue < 2.5) {
            // Face 2: top-left and bottom-right
            if (pipIndex == 0) return vec2(0.25, 0.75);
            if (pipIndex == 1) return vec2(0.75, 0.25);
          } else if (faceValue < 3.5) {
            // Face 3: diagonal line
            if (pipIndex == 0) return vec2(0.25, 0.75);
            if (pipIndex == 1) return vec2(0.5, 0.5);
            if (pipIndex == 2) return vec2(0.75, 0.25);
          } else if (faceValue < 4.5) {
            // Face 4: corners
            if (pipIndex == 0) return vec2(0.25, 0.75);
            if (pipIndex == 1) return vec2(0.75, 0.75);
            if (pipIndex == 2) return vec2(0.25, 0.25);
            if (pipIndex == 3) return vec2(0.75, 0.25);
          } else if (faceValue < 5.5) {
            // Face 5: corners + center
            if (pipIndex == 0) return vec2(0.25, 0.75);
            if (pipIndex == 1) return vec2(0.75, 0.75);
            if (pipIndex == 2) return vec2(0.5, 0.5);
            if (pipIndex == 3) return vec2(0.25, 0.25);
            if (pipIndex == 4) return vec2(0.75, 0.25);
          } else {
            // Face 6: two rows
            if (pipIndex == 0) return vec2(0.25, 0.75);
            if (pipIndex == 1) return vec2(0.75, 0.75);
            if (pipIndex == 2) return vec2(0.25, 0.5);
            if (pipIndex == 3) return vec2(0.75, 0.5);
            if (pipIndex == 4) return vec2(0.25, 0.25);
            if (pipIndex == 5) return vec2(0.75, 0.25);
          }
          return vec2(-1.0, -1.0);
        }
        
        // Determine which face is visible and get its value
        float getFaceValue(vec3 normal, vec3 position) {
          // Standard die configuration: opposite faces sum to 7
          // +X face (right): value 1
          // -X face (left): value 6  
          // +Y face (top): value 2
          // -Y face (bottom): value 5
          // +Z face (front): value 3
          // -Z face (back): value 4
          
          float absX = abs(normal.x);
          float absY = abs(normal.y);
          float absZ = abs(normal.z);
          
          if (absX > absY && absX > absZ) {
            // X face (left or right)
            return normal.x > 0.0 ? 1.0 : 6.0;
          } else if (absY > absZ) {
            // Y face (top or bottom)
            return normal.y > 0.0 ? 2.0 : 5.0;
          } else {
            // Z face (front or back)
            return normal.z > 0.0 ? 3.0 : 4.0;
          }
        }
        
        void main() {
          vec3 baseColor = vec3(0.96, 0.96, 0.96); // Light gray die
          vec3 pipColor = vec3(0.0, 0.0, 0.0); // Black pips
          
          vec4 finalColor = vec4(baseColor, 1.0);
          
          // During rolling, show random values on each face for visual effect
          if (isRolling > 0.5) {
            // Simple random pips during rolling
            float randomValue = mod(time * 0.1 + vPosition.x + vPosition.y + vPosition.z, 6.0) + 1.0;
            
            // Draw random pips for the current face
            for (int i = 0; i < 6; i++) {
              vec2 pipPos = getPipPosition(i, randomValue);
              if (pipPos.x > 0.0) {
                float pip = circle(vUv, pipPos, 0.08);
                if (pip > 0.0) {
                  finalColor.rgb = mix(finalColor.rgb, pipColor, pip);
                }
              }
            }
          } else {
            // When settled, determine which face this is
            float faceValue = getFaceValue(vNormal, vPosition);
            
            // Check if this is the front face (facing the user)
            // Since camera is fixed, the +Z face should always face the user
            bool isFrontFace = (vNormal.z > 0.5);
            
            // If this is the front face, show the rolled value
            // Otherwise show the standard face value
            float valueToShow = isFrontFace ? dieValue : faceValue;
            
            // Draw pips for the current face
            for (int i = 0; i < 6; i++) {
              vec2 pipPos = getPipPosition(i, valueToShow);
              if (pipPos.x > 0.0) {
                float pip = circle(vUv, pipPos, 0.08);
                if (pip > 0.0) {
                  finalColor.rgb = mix(finalColor.rgb, pipColor, pip);
                }
              }
            }
          }
          
          gl_FragColor = finalColor;
        }
      `,
      transparent: true
    });

    // Update time uniform for rolling animation
    if (isRolling) {
      const animateTime = () => {
        if (material.uniforms && isRolling) {
          material.uniforms.time.value += 0.016; // ~60fps
          requestAnimationFrame(animateTime);
        }
      };
      animateTime();
    }

    return (
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={material} />
      </mesh>
    );
  };

  return (
    <group position={position}>
      {createDie()}
    </group>
  );
}

export default function DiceCanvas({ isRolling, lastRoll }: DiceCanvasProps) {
  const [rollCompleteCount, setRollCompleteCount] = useState(0)
  
  const handleRollComplete = () => {
    setRollCompleteCount(prev => prev + 1)
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <Canvas camera={{ position: [0, 2, 4], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        
        {/* Dice */}
        {lastRoll ? (
          <>
            <Die 
              value={lastRoll.dieA} 
              position={[-1.5, 0, 0]} 
              isRolling={isRolling}
              onRollComplete={handleRollComplete}
            />
            <Die 
              value={lastRoll.dieB} 
              position={[1.5, 0, 0]} 
              isRolling={isRolling}
              onRollComplete={handleRollComplete}
            />
          </>
        ) : isRolling ? (
          // Show rolling dice even if there's no previous roll
          <>
            <Die 
              value={1} 
              position={[-1.5, 0, 0]} 
              isRolling={true}
              onRollComplete={handleRollComplete}
            />
            <Die 
              value={1} 
              position={[1.5, 0, 0]} 
              isRolling={true}
              onRollComplete={handleRollComplete}
            />
          </>
        ) : (
          // Show default dice when not rolling and no previous roll
          <>
            <Die value={1} position={[-1.5, 0, 0]} isRolling={false} />
            <Die value={1} position={[1.5, 0, 0]} isRolling={false} />
          </>
        )}
        
        <OrbitControls 
          enableDamping={false}
          enablePan={false} 
          enableRotate={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={8}
        />
      </Canvas>
    </div>
  )
} 