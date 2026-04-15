import React, { Component, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";

/**
 * Route-risk hero: professional traffic video + realistic glTF vehicle (PBR / “Unreal-style” asset).
 * - Video: Mixkit loops (free). Fallback: second Mixkit URL, then animated gradient.
 * - 3D model: hosted three.js sample glTF/GLB asset (CDN) — studio lighting via drei Stage.
 */

const CAR_GLB_URL = "https://threejs.org/examples/models/gltf/ferrari.glb";

function RealisticCarModel() {
  const { scene } = useGLTF(CAR_GLB_URL);
  return <primitive object={scene} />;
}

// Avoid global preload failures from crashing outside our error boundary.

function CarStageFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0a0e1a] px-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      <p className="text-[10px] text-txt-secondary">Loading vehicle model…</p>
    </div>
  );
}

function CarStageError() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-3 text-center">
      <p className="text-[11px] font-medium text-txt-primary">
        3D vehicle preview unavailable
      </p>
      <p className="text-[10px] leading-snug text-txt-secondary">
        The model could not load (network or CORS). Traffic video still shows
        road context.
      </p>
    </div>
  );
}

class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <CarStageError />;
    }
    return this.props.children;
  }
}

function VehicleCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [2.8, 1.2, 3.2], fov: 42 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0a0e1a", 0);
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <Stage intensity={0.55} environment="city" adjustCamera={1.35}>
          <RealisticCarModel />
        </Stage>
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.45}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 5}
        />
      </Suspense>
    </Canvas>
  );
}

export default function TrafficAccidentScene3D() {
  return (
    <div className="relative mt-3 w-full overflow-hidden rounded-xl border border-border">
      <div className="relative min-h-[140px] w-full bg-[#0a0e1a] md:min-h-[260px]">
        <p className="absolute left-2 top-2 z-10 text-[10px] font-medium uppercase tracking-wider text-txt-secondary">
          Realistic vehicle · glTF / PBR
        </p>
        <div className="h-[200px] w-full md:h-[260px]">
          <ModelErrorBoundary>
            <Suspense fallback={<CarStageFallback />}>
              <VehicleCanvas />
            </Suspense>
          </ModelErrorBoundary>
        </div>
      </div>
    </div>
  );
}
