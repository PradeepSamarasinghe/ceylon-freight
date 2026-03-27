import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Sri Lankan cities with coordinates
const SRI_LANKA_CITIES = [
  { name: "Colombo", lat: 6.9271, lng: 79.8612 },
  { name: "Kandy", lat: 7.2906, lng: 80.6337 },
  { name: "Galle", lat: 6.0535, lng: 80.2210 },
  { name: "Jaffna", lat: 9.6615, lng: 80.0255 },
  { name: "Trincomalee", lat: 8.5874, lng: 81.2152 },
  { name: "Batticaloa", lat: 7.7310, lng: 81.6747 },
  { name: "Anuradhapura", lat: 8.3114, lng: 80.4037 },
  { name: "Hambantota", lat: 6.1246, lng: 81.1185 },
  { name: "Kurunegala", lat: 7.4863, lng: 80.3647 },
  { name: "Matara", lat: 5.9549, lng: 80.5550 },
];

const ROUTES = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 6],
  [2, 9], [3, 6], [4, 5], [7, 2], [8, 0], [6, 4],
];

const GLOBE_RADIUS = 2;

// Glowing wireframe globe
function GlobeWireframe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
      <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.08} />
    </mesh>
  );
}

// Solid dark globe underneath
function GlobeSolid() {
  return (
    <Sphere args={[GLOBE_RADIUS * 0.995, 64, 64]}>
      <meshBasicMaterial color="#0f1a2e" transparent opacity={0.95} />
    </Sphere>
  );
}

// Atmosphere glow
function Atmosphere() {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#0ea5e9") },
    }),
    []
  );

  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(uColor, intensity * 0.4);
          }
        `}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// City markers on the globe
function CityNodes() {
  const positions = useMemo(
    () => SRI_LANKA_CITIES.map((c) => latLngToVector3(c.lat, c.lng, GLOBE_RADIUS * 1.01)),
    []
  );

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Core dot */}
          <mesh>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          {/* Glow */}
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Animated route arcs
function FreightRoutes() {
  const groupRef = useRef<THREE.Group>(null);

  const curves = useMemo(() => {
    return ROUTES.map(([fromIdx, toIdx]) => {
      const from = SRI_LANKA_CITIES[fromIdx];
      const to = SRI_LANKA_CITIES[toIdx];
      const start = latLngToVector3(from.lat, from.lng, GLOBE_RADIUS * 1.01);
      const end = latLngToVector3(to.lat, to.lng, GLOBE_RADIUS * 1.01);

      // Mid-point elevated above the globe
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(GLOBE_RADIUS * 1.25);

      return new THREE.QuadraticBezierCurve3(start, mid, end);
    });
  }, []);

  const lineObjects = useMemo(() => {
    return curves.map((curve) => {
      const points = curve.getPoints(40);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: "#f97316", transparent: true, opacity: 0.35 });
      return new THREE.Line(geo, mat);
    });
  }, [curves]);

  return (
    <group ref={groupRef}>
      {lineObjects.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
      {curves.map((curve, i) => (
        <RouteParticle key={`p-${i}`} curve={curve} speed={0.15 + i * 0.02} delay={i * 0.3} />
      ))}
    </group>
  );
}

function RouteParticle({ curve, speed, delay }: { curve: THREE.QuadraticBezierCurve3; speed: number; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(delay);

  useFrame((_, delta) => {
    timeRef.current += delta * speed;
    const t = (timeRef.current % 1 + 1) % 1;
    const pos = curve.getPoint(t);
    if (meshRef.current) {
      meshRef.current.position.copy(pos);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.018, 8, 8]} />
      <meshBasicMaterial color="#fb923c" />
    </mesh>
  );
}

// Stars background
function Stars() {
  const geo = useMemo(() => {
    const positions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const r = 15 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial color="#94a3b8" size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <Stars />
      <GlobeSolid />
      <GlobeWireframe />
      <Atmosphere />
      <CityNodes />
      <FreightRoutes />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />
    </>
  );
}

const Globe3D = () => {
  return (
    <div className="h-64 w-64 sm:h-80 sm:w-80 lg:h-[420px] lg:w-[420px]">
      <Canvas
        camera={{ position: [0, 1, 5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default Globe3D;
