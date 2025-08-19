'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import React from 'react'

interface PairDistribution3DProps {
  data: number[][]
  maxCount: number
}

function PairDistributionGrid({ data, maxCount }: PairDistribution3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Create columns for each dice combination
  const columns = useMemo(() => {
    const cols: React.ReactElement[] = []
    
    for (let dieA = 0; dieA < 6; dieA++) {
      for (let dieB = 0; dieB < 6; dieB++) {
        const count = data[dieA][dieB]
        const height = maxCount > 0 ? (count / maxCount) * 2 : 0.1 // Max height of 2 units
        
        cols.push(
          <group key={`${dieA}-${dieB}`} position={[dieA * 1.2 - 3, height / 2, dieB * 1.2 - 3]}>
            {/* Column */}
            <mesh>
              <boxGeometry args={[0.8, height, 0.8]} />
              <meshStandardMaterial 
                color={count > 0 ? '#3b82f6' : '#e5e7eb'} 
                transparent 
                opacity={count > 0 ? 0.8 : 0.3}
              />
            </mesh>
            
            {/* Count label */}
            {count > 0 && (
              <Text
                position={[0, height + 0.2, 0]}
                fontSize={0.15}
                color="#1f2937"
                anchorX="center"
                anchorY="middle"
              >
                {count}
              </Text>
            )}
            
            {/* Die labels with better formatting */}
            <Text
              position={[0, -0.1, 0]}
              fontSize={0.12}
              color="#6b7280"
              anchorX="center"
              anchorY="middle"
            >
              {dieA + 1}×{dieB + 1}
            </Text>
            
            {/* Add a subtle highlight for columns with data */}
            {count > 0 && (
              <mesh position={[0, height + 0.1, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#3b82f6" />
              </mesh>
            )}
          </group>
        )
      }
    }
    
    return cols
  }, [data, maxCount])

  // Gentle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {/* Grid lines */}
      <group>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={`grid-${i}`} position={[i * 1.2 - 3.6, 0, -3.6]}>
            <boxGeometry args={[0.02, 0.02, 7.2]} />
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={`grid-z-${i}`} position={[-3.6, 0, i * 1.2 - 3.6]}>
            <boxGeometry args={[7.2, 0.02, 0.02]} />
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
        ))}
      </group>
      
      {/* Columns */}
      {columns}
      
      {/* Axis labels with better positioning and clarity */}
      <Text position={[0, -0.5, -4.5]} fontSize={0.2} color="#374151" anchorX="center">
        Die B (1-6)
      </Text>
      <Text position={[-4.5, -0.5, 0]} fontSize={0.2} color="#374151" anchorX="center" rotation={[0, 0, -Math.PI / 2]}>
        Die A (1-6)
      </Text>
      
      {/* Individual axis value labels */}
      {Array.from({ length: 6 }, (_, i) => (
        <Text key={`dieA-${i}`} position={[i * 1.2 - 3, -0.3, -4.2]} fontSize={0.15} color="#6b7280" anchorX="center">
          {i + 1}
        </Text>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <Text key={`dieB-${i}`} position={[-4.2, -0.3, i * 1.2 - 3]} fontSize={0.15} color="#6b7280" anchorX="center">
          {i + 1}
        </Text>
      ))}
      
      {/* Title for the 3D grid */}
      <Text position={[0, 3, 0]} fontSize={0.25} color="#1f2937" anchorX="center">
        Dice Combinations
      </Text>
    </group>
  )
}

export function PairDistribution3D({ data, maxCount }: PairDistribution3DProps) {
  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 50 }}
      style={{ background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      
      {/* 3D Grid */}
      <PairDistributionGrid data={data} maxCount={maxCount} />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
        autoRotate={false}
      />
    </Canvas>
  )
} 