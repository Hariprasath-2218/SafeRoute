import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/**
 * Simple 3D scene: roadway, vehicle, and cones — contextual “traffic / risk” accent for Route Risk.
 * OrbitControls auto-orbit (no zoom) for a calm dashboard feel.
 */

function CarBody() {
  return (
    <group position={[0, 0.4, 0]} rotation={[0, 0.35, 0]}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.15, 0.38, 2.05]} />
        <meshStandardMaterial color="#3B82F6" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[0, 0.42, -0.18]}>
        <boxGeometry args={[0.95, 0.32, 1.05]} />
        <meshStandardMaterial color="#0f172a" metalness={0.25} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.85, 0.06, 1.2]} />
        <meshStandardMaterial color="#93c5fd" metalness={0.5} roughness={0.25} />
      </mesh>
      {[
        [-0.52, -0.62],
        [0.52, -0.62],
        [-0.52, 0.62],
        [0.52, 0.62],
      ].map(([x, z], i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[x, -0.02, z]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 20]} />
          <meshStandardMaterial color="#111827" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function HazardCone({ position: pos }) {
  return (
    <mesh castShadow position={pos}>
      <coneGeometry args={[0.14, 0.45, 10]} />
      <meshStandardMaterial color="#F97316" roughness={0.6} />
    </mesh>
  );
}

export default function TrafficAccidentScene3D() {
  return (
    <div className="relative mt-3 h-44 w-full overflow-hidden rounded-xl border border-border bg-gradient-to-b from-[#0a0e1a] to-[#111827]">
      <p className="absolute left-2 top-2 z-10 text-[10px] font-medium uppercase tracking-wider text-txt-secondary">
        3D · route risk context
      </p>
      <Canvas
        shadows
        camera={{ position: [3.8, 2.4, 4.5], fov: 40 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
        className="h-full w-full"
      >
        <color attach="background" args={["#0a0e1a"]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 10, 6]} intensity={1.15} castShadow />
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[14, 14]} />
          <meshStandardMaterial color="#1a2332" roughness={0.92} metalness={0.05} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[1.8, 8]} />
          <meshStandardMaterial color="#2d3748" roughness={0.85} />
        </mesh>
        <CarBody />
        <HazardCone position={[0.95, 0.22, -0.7]} />
        <HazardCone position={[-0.9, 0.22, 0.55]} />
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.65}
          maxPolarAngle={Math.PI / 2.08}
          minPolarAngle={Math.PI / 4.2}
        />
      </Canvas>
    </div>
  );
}
