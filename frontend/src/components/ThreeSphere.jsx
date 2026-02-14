import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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
  const { invalidate } = useThree();
  const animationRef = useRef();

  const { geometry, ranges, totalMinutes } = useMemo(() => {
    // ✅ Smooth appearance
    const sphere = new THREE.SphereGeometry(2, 96, 96).toNonIndexed();

    const categories = Object.entries(data.categories || {});
    const total = categories.reduce((sum, [, m]) => sum + m, 0);

    let currentAngle = 0;
    const computedRanges = categories.map(([cat, minutes]) => {
      const angleSize = total ? (minutes / total) * Math.PI * 2 : 0;
      const start = currentAngle;
      const end = currentAngle + angleSize;
      currentAngle += angleSize;
      return { cat, minutes, start, end };
    });

    const positionAttr = sphere.attributes.position;
    const colors = new Float32Array(positionAttr.count * 3);

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const z = positionAttr.getZ(i);

      let angle = Math.atan2(z, x);
      if (angle < 0) angle += Math.PI * 2;

      let color = new THREE.Color("#444");

      for (const range of computedRanges) {
        if (angle >= range.start && angle < range.end) {
          color.set(CATEGORY_COLORS[range.cat]);
          break;
        }
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    sphere.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return { geometry: sphere, ranges: computedRanges, totalMinutes: total };
  }, [data]);

  // Entrance animation
  useEffect(() => {
    if (!meshRef.current) return;

    meshRef.current.scale.set(0, 0, 0);

    animationRef.current = gsap.to(meshRef.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.8,
      ease: "power3.out",
      onUpdate: invalidate,
    });

    return () => {
      animationRef.current?.kill();
      geometry.dispose();
    };
  }, [geometry, invalidate]);

  // Hover darkening (optimized)
  useEffect(() => {
    if (!meshRef.current) return;

    const colorAttr = geometry.attributes.color;
    const positionAttr = geometry.attributes.position;

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const z = positionAttr.getZ(i);

      let angle = Math.atan2(z, x);
      if (angle < 0) angle += Math.PI * 2;

      let color = new THREE.Color("#444");

      for (const range of ranges) {
        if (angle >= range.start && angle < range.end) {
          color.set(CATEGORY_COLORS[range.cat]);

          // ✅ Darker on hover
          if (hoveredCategory?.cat === range.cat) {
            color.multiplyScalar(0.55);
          }

          break;
        }
      }

      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }

    colorAttr.needsUpdate = true;
    invalidate();
  }, [hoveredCategory, ranges, geometry, invalidate]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerMove={(e) => {
        e.stopPropagation();
        const point = e.point;

        let angle = Math.atan2(point.z, point.x);
        if (angle < 0) angle += Math.PI * 2;

        for (const range of ranges) {
          if (angle >= range.start && angle < range.end) {
            setHoveredCategory({
              ...range,
              percentage: totalMinutes
                ? ((range.minutes / totalMinutes) * 100).toFixed(1)
                : 0,
            });
            return;
          }
        }
      }}
      onPointerOut={() => setHoveredCategory(null)}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.6}
        metalness={0.15}
      />
    </mesh>
  );
}

export default function ThreeSphere({ data }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative h-full min-h-[450px] w-full rounded-2xl overflow-hidden bg-black">
      <Canvas
        frameloop="demand"   // ✅ still no lag
        camera={{ position: [0, 10, 5], fov: 35 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.1} />
        <directionalLight position={[-5, -3, -5]} intensity={0.4} />

        {/* ✅ Rotation restored */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          onChange={() => {}}
        />

        <ColoredSphere
          data={data}
          hoveredCategory={hovered}
          setHoveredCategory={setHovered}
        />
      </Canvas>

      {hovered && (
        <div className="absolute bottom-8 w-[200px] left-1/2 -translate-x-1/2
                        bg-zinc-900/80 backdrop-blur-xl
                        border border-zinc-700
                        px-6 py-4 rounded-2xl
                        shadow-lg text-white">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: CATEGORY_COLORS[hovered.cat] }}
            />
            <span className="font-semibold text-lg">{hovered.cat}</span>
          </div>
          <div className="text-sm text-zinc-400">
            {hovered.minutes} minutes
          </div>
          <div className="text-sm text-zinc-400">
            {hovered.percentage}% of total
          </div>
        </div>
      )}
    </div>
  );
}