'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface SimpleDiceCanvasProps {
  isRolling: boolean;
  lastRoll: {
    dieA: number;
    dieB: number;
  } | null;
}

export default function SimpleDiceCanvas({ isRolling, lastRoll }: SimpleDiceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const diceRef = useRef<THREE.Group[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f8ff)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 5)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Create dice
    createDice(scene)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    setIsInitialized(true)

    // Cleanup
    return () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [])

  // Create dice geometry
  const createDice = (scene: THREE.Scene) => {
    // Clear existing dice
    diceRef.current.forEach(die => scene.remove(die))
    diceRef.current = []

    // Create two dice
    for (let i = 0; i < 2; i++) {
      const dieGroup = new THREE.Group()
      
      // Main die body
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshLambertMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      })
      const dieMesh = new THREE.Mesh(geometry, material)
      dieMesh.castShadow = true
      dieMesh.receiveShadow = true
      dieGroup.add(dieMesh)

      // Add pips (dots)
      const pipGeometry = new THREE.SphereGeometry(0.08, 8, 8)
      const pipMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
      
      // Position pips for each face (simplified)
      const pipPositions = [
        // Face 1 (front)
        [0, 0, 0.51],
        // Face 2 (top) 
        [0, 0.51, 0],
        // Face 3 (right)
        [0.51, 0, 0],
        // Face 4 (left)
        [-0.51, 0, 0],
        // Face 5 (bottom)
        [0, -0.51, 0],
        // Face 6 (back)
        [0, 0, -0.51]
      ]

      pipPositions.forEach((pos, index) => {
        const pip = new THREE.Mesh(pipGeometry, pipMaterial)
        pip.position.set(pos[0], pos[1], pos[2])
        dieGroup.add(pip)
      })

      // Position dice side by side
      dieGroup.position.x = (i - 0.5) * 2
      scene.add(dieGroup)
      diceRef.current.push(dieGroup)
    }
  }

  // Handle dice rolling animation
  useEffect(() => {
    if (!isInitialized || !lastRoll) return

    if (isRolling) {
      // Animate dice rolling
      diceRef.current.forEach((die, index) => {
        const targetValue = index === 0 ? lastRoll.dieA : lastRoll.dieB
        
        // Random rotation animation
        const animate = () => {
          die.rotation.x += 0.1
          die.rotation.y += 0.15
          die.rotation.z += 0.08
          
          // Stop after 2 seconds and show final value
          setTimeout(() => {
            // Set final rotation to show correct face
            const finalRotation = getFinalRotation(targetValue)
            die.rotation.set(finalRotation[0], finalRotation[1], finalRotation[2])
          }, 2000)
        }
        
        animate()
      })
    }
  }, [isRolling, lastRoll, isInitialized])

  // Get final rotation for a given die value
  const getFinalRotation = (value: number): [number, number, number] => {
    switch (value) {
      case 1: return [0, 0, 0]
      case 2: return [0, -Math.PI/2, 0]
      case 3: return [Math.PI/2, 0, 0]
      case 4: return [-Math.PI/2, 0, 0]
      case 5: return [0, Math.PI/2, 0]
      case 6: return [Math.PI, 0, 0]
      default: return [0, 0, 0]
    }
  }

  return (
    <div className="w-full h-96 flex items-center justify-center">
      <div 
        ref={containerRef}
        className="w-full h-full rounded-lg shadow-lg"
        style={{ position: 'relative' }}
      />
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-gray-600">Loading 3D dice...</div>
        </div>
      )}
    </div>
  )
} 