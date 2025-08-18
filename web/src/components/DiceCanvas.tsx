'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function SpinningBox() {
  return (
    <mesh rotation={[0.4, 0.6, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f97316" />
    </mesh>
  )
}

export default function DiceCanvas() {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <SpinningBox />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  )
} 