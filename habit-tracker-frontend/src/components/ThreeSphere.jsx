import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

const CATEGORY_COLORS = {
  Work: "#14b8a6",
  Study: "#3b82f6",
  Exercise: "#f97316",
  Break: "#ec4899",
  Other: "#6b7280",
};

function ColoredSphere({ data, hoveredCategory, setHoveredCategory }) {
  const meshRef = useRef();
  const { camera, raycaster, mouse } = useThree();

  const { geometry, ranges, totalMinutes } = useMemo(() => {
    const sphere = new THREE.SphereGeometry(2, 128, 128).toNonIndexed();

    const categories = Object.entries(data.categories || {});
    const total = categories.reduce((sum, [, m]) => sum + m, 0);

    let currentAngle = 0;
    const computedRanges = categories.map(([cat, minutes]) => {
      const angleSize = (minutes / total) * Math.PI * 2;
      const start = currentAngle;
      const end = currentAngle + angleSize;
      currentAngle += angleSize;
      return { cat, minutes, start, end };
    });

    const positionAttr = sphere.attributes.position;
    const colors = [];

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const z = positionAttr.getZ(i);

      let angle = Math.atan2(z, x);
      if (angle < 0) angle += Math.PI * 2;

      let color = new THREE.Color("#666");

      for (const range of computedRanges) {
        if (angle >= range.start && angle < range.end) {
          color = new THREE.Color(CATEGORY_COLORS[range.cat]);
          break;
        }
      }

      colors.push(color.r, color.g, color.b);
    }

    sphere.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    return { geometry: sphere, ranges: computedRanges, totalMinutes: total };
  }, [data]);

  // Entrance animation
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(0, 0, 0);
      gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.2,
        ease: "power3.out",
      });
    }
  }, []);

  // Hover detection
  useFrame(() => {
    if (!meshRef.current) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      let angle = Math.atan2(point.z, point.x);
      if (angle < 0) angle += Math.PI * 2;

      for (const range of ranges) {
        if (angle >= range.start && angle < range.end) {
          setHoveredCategory({
            ...range,
            percentage: ((range.minutes / totalMinutes) * 100).toFixed(1),
          });
          return;
        }
      }
    }

    setHoveredCategory(null);
  });

  // Darken hovered section
  useEffect(() => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry;
    const positionAttr = geometry.attributes.position;
    const colorAttr = geometry.attributes.color;

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const z = positionAttr.getZ(i);

      let angle = Math.atan2(z, x);
      if (angle < 0) angle += Math.PI * 2;

      let color = new THREE.Color("#666");

      for (const range of ranges) {
        if (angle >= range.start && angle < range.end) {
          color = new THREE.Color(CATEGORY_COLORS[range.cat]);

          if (hoveredCategory?.cat === range.cat) {
            color.multiplyScalar(0.65);
          }

          break;
        }
      }

      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }

    colorAttr.needsUpdate = true;
  }, [hoveredCategory, ranges]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.7}
        metalness={0.1}
        emissive="#111111"
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

export default function ThreeSphere({ data }) {
  const [hovered, setHovered] = useState(null);
  const [ready, setReady] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const canvasKey = useMemo(() => JSON.stringify(data), [data]);

  // Always show loader for at least 2s, or until ready
  useEffect(() => {
    setReady(false);
    setMinTimePassed(false);
    let didCancel = false;
    const minTimer = setTimeout(() => {
      if (!didCancel) setMinTimePassed(true);
    }, 2000);
    // Simulate render complete after 400ms (replace with onCreated for real readiness)
    const fakeReady = setTimeout(() => {
      if (!didCancel) setReady(true);
    }, 400);
    return () => {
      didCancel = true;
      clearTimeout(minTimer);
      clearTimeout(fakeReady);
    };
  }, [data]);

  const showSphere = ready && minTimePassed;

  return (
    <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-black">
      {!showSphere && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-white text-sm">Loading visualization...</span>
        </div>
      )}
      {showSphere && (
        <Canvas key={canvasKey} camera={{ position: [0, 7, 4], fov: 40 }}>
          <ambientLight intensity={1.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <directionalLight position={[-5, -3, -5]} intensity={0.6} />
          <OrbitControls enableZoom={false} enablePan={false} />
          <ColoredSphere
            data={data}
            hoveredCategory={hovered}
            setHoveredCategory={setHovered}
          />
        </Canvas>
      )}
      {hovered && showSphere && (
        <div
          className="absolute w-50 bottom-8 left-1/2 -translate-x-1/2
                      bg-zinc-900/80 backdrop-blur-xl
                      border border-zinc-700
                      px-6 py-4 rounded-2xl
                      shadow-[0_0_40px_rgba(0,0,0,0.6)]
                      text-white
                      animate-fadeIn"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: CATEGORY_COLORS[hovered.cat] }}
            />
            <span className="font-semibold text-lg">{hovered.cat}</span>
          </div>
          <div className="text-sm text-zinc-400">{hovered.minutes} minutes</div>
          <div className="text-sm text-zinc-400">
            {hovered.percentage}% of total
          </div>
        </div>
      )}
    </div>
  );
}
