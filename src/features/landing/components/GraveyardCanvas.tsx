"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";
// @ts-ignore
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
// @ts-ignore
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";

// ─── TERRAIN ──────────────────────────────────────────────────────────────────

const simplex = new SimplexNoise();

function getTerrainHeight(x: number, z: number): number {
  return (
    simplex.noise(x * 0.04, z * 0.04) * 1.5 +
    simplex.noise(x * 0.15, z * 0.15) * 0.3 +
    simplex.noise(x * 0.6, z * 0.6) * 0.05
  );
}

// ─── TOMBSTONE GEOMETRY ───────────────────────────────────────────────────────

class RoundedTombstoneGeometry extends THREE.BufferGeometry {
  constructor(width = 0.6, height = 1.0, depth = 0.2) {
    super();
    const baseH = height * 0.7;
    const base = new THREE.BoxGeometry(width, baseH, depth);
    base.translate(0, baseH / 2, 0);
    const top = new THREE.CylinderGeometry(width / 2, width / 2, depth, 16, 1, false, 0, Math.PI);
    top.rotateY(Math.PI / 2);
    top.rotateX(Math.PI / 2);
    top.translate(0, baseH + (height - baseH) / 2 - depth / 2 - 0.05, 0);
    this.copy(BufferGeometryUtils.mergeGeometries([base, top], true));
  }
}

// ─── STONE DATA ───────────────────────────────────────────────────────────────
// showText: only the two mid stones (left/right) are readable.
// All far stones and background silhouettes have no text → pure dark shapes.

interface TombstoneDef {
  x: number; z: number; scale: number; rotY: number;
  name: string; born: string; died: string; epitaph: string;
  readable?: boolean; // true = mid-ground readable pair
}

const STONES: TombstoneDef[] = [
  // ── READABLE PAIR ── (one each side, primary midground)
  { x: -12, z: -9,  scale: 5.8, rotY: 0.18,  readable: true,
    name: "StudyFlow", born: "Mar 2022", died: "Aug 2023", epitaph: "Calendar sync was working." },
  { x:  12, z: -10, scale: 5.4, rotY: -0.22, readable: true,
    name: "QuickNote", born: "Jun 2023", died: "Jan 2024", epitaph: "The migration script did not." },

  // ── SILHOUETTES — no text, darker material, fade into fog ──
  { x: -22, z: -18, scale: 4.2, rotY: 0.3,  name: "", born: "", died: "", epitaph: "" },
  { x:  22, z: -19, scale: 4.0, rotY: -0.3, name: "", born: "", died: "", epitaph: "" },
  { x: -32, z: -28, scale: 3.2, rotY: 0.5,  name: "", born: "", died: "", epitaph: "" },
  { x:  -4, z: -26, scale: 3.0, rotY: -0.1, name: "", born: "", died: "", epitaph: "" },
  { x:  30, z: -30, scale: 2.8, rotY: -0.6, name: "", born: "", died: "", epitaph: "" },
  { x:   6, z: -32, scale: 2.5, rotY: 0.2,  name: "", born: "", died: "", epitaph: "" },
];

// ─── TOMBSTONE ────────────────────────────────────────────────────────────────

function Tombstone({ def }: { def: TombstoneDef }) {
  const geom = useMemo(() => new RoundedTombstoneGeometry(), []);

  // Readable stones: slightly lighter so moonlight catches them.
  // Silhouettes: nearly black so they dissolve into the night.
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: def.readable ? 0x2e3d58 : 0x151c28,
    roughness: 0.92,
    metalness: 0.06,
  }), [def.readable]);

  const nameRef = useRef<THREE.MeshStandardMaterial>(null);
  const datRef  = useRef<THREE.MeshStandardMaterial>(null);
  const epiRef  = useRef<THREE.MeshStandardMaterial>(null);
  const hovered = useRef(false);

  // Idle glow targets — readable stones have a soft resting glow; silhouettes have none.
  const idleN = def.readable ? 0.45 : 0;
  const idleD = def.readable ? 0.25 : 0;
  const idleE = def.readable ? 0.16 : 0;

  useFrame((_, delta) => {
    const speed = delta * 3.0;
    const nT = hovered.current ? 3.2 : idleN;
    const dT = hovered.current ? 1.8 : idleD;
    const eT = hovered.current ? 1.3 : idleE;
    if (nameRef.current) nameRef.current.emissiveIntensity = THREE.MathUtils.lerp(nameRef.current.emissiveIntensity, nT, speed);
    if (datRef.current)  datRef.current.emissiveIntensity  = THREE.MathUtils.lerp(datRef.current.emissiveIntensity,  dT, speed);
    if (epiRef.current)  epiRef.current.emissiveIntensity  = THREE.MathUtils.lerp(epiRef.current.emissiveIntensity,  eT, speed);
  });

  const ty  = getTerrainHeight(def.x, def.z) - 0.2;
  const s   = def.scale;
  const textZ = (0.2 / 2 + 0.005) * s;
  const textY = ty + s * 0.42;

  return (
    <group
      position={[def.x, ty, def.z]}
      rotation={[0, def.rotY, 0]}
      onPointerOver={() => { if (def.readable) { hovered.current = true; document.body.style.cursor = "pointer"; } }}
      onPointerOut={()  => { hovered.current = false; document.body.style.cursor = "auto"; }}
    >
      <mesh geometry={geom} material={mat} scale={[s, s, s]} castShadow receiveShadow />

      {def.readable && (
        <group position={[0, textY - ty, textZ]}>
          <Text position={[0, 0.22 * s, 0]} fontSize={0.078 * s} maxWidth={0.5 * s}
            textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.02} fontWeight={700}>
            <meshStandardMaterial ref={nameRef} toneMapped={false} color="#0a1020"
              emissive="#5b9fd4" emissiveIntensity={idleN} roughness={1} metalness={0}
              depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
            {def.name}
          </Text>
          <Text position={[0, 0.05 * s, 0]} fontSize={0.038 * s} maxWidth={0.5 * s}
            textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.06}>
            <meshStandardMaterial ref={datRef} toneMapped={false} color="#08101e"
              emissive="#3d7aa8" emissiveIntensity={idleD} roughness={1} metalness={0}
              depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
            {`Born ${def.born}\nDied ${def.died}`}
          </Text>
          <Text position={[0, -0.1 * s, 0]} fontSize={0.032 * s} maxWidth={0.46 * s}
            textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.01}>
            <meshStandardMaterial ref={epiRef} toneMapped={false} color="#060914"
              emissive="#2d5e88" emissiveIntensity={idleE} roughness={1} metalness={0}
              depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
            {`"${def.epitaph}"`}
          </Text>
        </group>
      )}
    </group>
  );
}

// ─── CINEMATIC CAMERA ─────────────────────────────────────────────────────────
// Extremely slow, 25-second loop. Three overlapping sine waves at prime-ratio
// frequencies ensure the motion never feels repetitive or mechanical.

function CinematicCamera() {
  const { camera } = useThree();
  const t = useRef(0);

  const BASE_POS    = useMemo(() => new THREE.Vector3(0, 5.5, 18), []);
  const BASE_TARGET = useMemo(() => new THREE.Vector3(0, 1.2, -10), []);

  useFrame((_, delta) => {
    // t advances at ~0.04 rad/s → full 2π cycle ≈ 157 s (very slow)
    // Each motion uses a different prime-ratio multiplier so they never sync
    t.current += delta * 0.042;

    const lateral = Math.sin(t.current * 1.0)  * 0.22;   // ±0.22 units, ~150s cycle
    const dolly   = Math.sin(t.current * 0.73) * 0.10;   // ±0.10 units, dolly breath
    const vert    = Math.sin(t.current * 0.55) * 0.06;   // ±0.06 units, float
    const gazeX   = Math.sin(t.current * 0.41) * 0.14;   // gaze wander

    camera.position.set(
      BASE_POS.x + lateral,
      BASE_POS.y + vert,
      BASE_POS.z + dolly,
    );
    camera.lookAt(BASE_TARGET.x + gazeX, BASE_TARGET.y, BASE_TARGET.z);
  });

  return null;
}

// ─── GROUND ───────────────────────────────────────────────────────────────────

function GroundMesh() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(120, 120, 60, 60);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, getTerrainHeight(pos.getX(i), -pos.getY(i)));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#0b1910" roughness={1} metalness={0.04} />
    </mesh>
  );
}

// ─── FOG LAYERS ───────────────────────────────────────────────────────────────
// Three planes of varying depth:
//   Layer 1: ground-level, light, covers the whole near field
//   Layer 2: mid-level, covers midground, slightly heavier
//   Layer 3: deep background only — heavy, kills far silhouettes

const fogVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const fogFrag = `
uniform float time; uniform vec3 color; uniform float opacity; varying vec2 vUv;
float rnd(vec2 s) { return fract(sin(dot(s, vec2(12.9898,78.233)))*43758.5453); }
float nse(vec2 s) { vec2 i=floor(s); vec2 f=fract(s); float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+vec2(1,1)); vec2 u=f*f*(3.0-2.0*f); return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y; }
void main() {
  vec2 p = vUv * 3.2; p.x -= time * 0.006; p.y -= time * 0.004;
  float n = nse(p)*0.5 + nse(p*2.0)*0.25 + nse(p*4.0)*0.125;
  float edge = smoothstep(0.5, 0.06, distance(vUv, vec2(0.5)));
  gl_FragColor = vec4(color, n * edge * opacity);
}`;

function FogLayers() {
  const m1 = useRef<THREE.ShaderMaterial>(null);
  const m2 = useRef<THREE.ShaderMaterial>(null);
  const m3 = useRef<THREE.ShaderMaterial>(null);

  // Layer 1: shallow ground mist — subtle blue-grey
  const u1 = useMemo(() => ({ time: { value: 0 },  color: { value: new THREE.Color("#0c1c30") }, opacity: { value: 0.32 } }), []);
  // Layer 2: midground drift — slightly cooler
  const u2 = useMemo(() => ({ time: { value: 22 }, color: { value: new THREE.Color("#0e1b2d") }, opacity: { value: 0.22 } }), []);
  // Layer 3: deep background — heavy, pushes far tombstones into darkness
  const u3 = useMemo(() => ({ time: { value: 44 }, color: { value: new THREE.Color("#070c18") }, opacity: { value: 0.68 } }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (m1.current) m1.current.uniforms.time.value = t;
    if (m2.current) m2.current.uniforms.time.value = t + 22;
    if (m3.current) m3.current.uniforms.time.value = t + 44;
  });

  return (
    <group>
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <shaderMaterial ref={m1} uniforms={u1} vertexShader={fogVert} fragmentShader={fogFrag}
          transparent depthWrite={false} blending={THREE.NormalBlending} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 110]} />
        <shaderMaterial ref={m2} uniforms={u2} vertexShader={fogVert} fragmentShader={fogFrag}
          transparent depthWrite={false} blending={THREE.NormalBlending} />
      </mesh>
      {/* Background fog — elevated and positioned deep so it buries far stones */}
      <mesh position={[0, 3.0, -26]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[130, 70]} />
        <shaderMaterial ref={m3} uniforms={u3} vertexShader={fogVert} fragmentShader={fogFrag}
          transparent depthWrite={false} blending={THREE.NormalBlending} />
      </mesh>
    </group>
  );
}

// ─── MOON HAZE ────────────────────────────────────────────────────────────────
// A very large, extremely faint billboard plane behind the tombstones
// creates the impression of a cold sky brightening around the moon.
// The haze sits in world-space so the camera breathing creates parallax.

function MoonHaze() {
  return (
    // Positioned behind the scene, angled towards camera
    <mesh position={[-14, 18, -60]} rotation={[0.18, 0.22, 0]}>
      <planeGeometry args={[80, 55]} />
      <meshBasicMaterial
        color="#1a2e52"
        transparent
        opacity={0.07}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── MOON ─────────────────────────────────────────────────────────────────────

const moonVertShader = `varying vec3 vN; void main() { vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const moonFragShader = `varying vec3 vN; void main() { vec3 c = vec3(0.74,0.82,0.98); gl_FragColor = vec4(c * (0.72 + 0.28 * vN.y), 1.0); }`;

function Moon() {
  const moonMat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: moonVertShader, fragmentShader: moonFragShader }), []);

  return (
    <group position={[-28, 26, -55]}>
      <mesh material={moonMat}>
        <sphereGeometry args={[5.5, 32, 32]} />
      </mesh>
      {/* Inner soft halo */}
      <mesh>
        <sphereGeometry args={[7.5, 16, 16]} />
        <meshBasicMaterial color="#5070b8" transparent opacity={0.055} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Outer diffuse corona */}
      <mesh>
        <sphereGeometry args={[12, 12, 12]} />
        <meshBasicMaterial color="#304878" transparent opacity={0.022} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── LIGHTING ─────────────────────────────────────────────────────────────────

function Moonlight() {
  return (
    <>
      {/* Primary moonlight — cold blue-white, moderate intensity */}
      <directionalLight
        color="#8aaae6"
        intensity={1.6}
        position={[-28, 26, -20]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.001}
      />
      {/* Sky ambient — very dark cold fill */}
      <ambientLight color="#141f38" intensity={0.5} />
      {/* Ground hemisphere — near-black so foreground stays dark */}
      <hemisphereLight color="#1e2e48" groundColor="#080e10" intensity={0.28} />
    </>
  );
}

// ─── MOONLIGHT POOL ───────────────────────────────────────────────────────────
// A faint rectangular fill light behind the central text area.
// Creates the impression that the moon is illuminating the sky behind the heading.
// Kept at near-zero intensity so it never competes with the text.

function MoonlightPool() {
  return (
    <pointLight
      color="#6080c0"
      intensity={0.9}
      distance={55}
      position={[0, 14, -18]}
      decay={2}
    />
  );
}

// ─── DUST MOTES ───────────────────────────────────────────────────────────────
// 16 particles max. Very slow drift. Extremely low opacity.
// Represent dust illuminated by cold moonlight — NOT magic sparkles.

function DustMotes() {
  const COUNT = 16;
  const geoRef = useRef<THREE.BufferGeometry>(null);

  const { positions, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds    = new Float32Array(COUNT);
    const phases    = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 5 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 6;
      speeds[i]  = 0.18 + Math.random() * 0.22;  // Very slow
      phases[i]  = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, phases };
  }, []);

  const orig = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    if (!geoRef.current) return;
    const t = clock.getElapsedTime();
    const attr = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      // Slow vertical sine + very subtle horizontal drift
      attr.setY(i, orig[i * 3 + 1] + Math.sin(t * speeds[i]           + phases[i]) * 0.30);
      attr.setX(i, orig[i * 3 + 0] + Math.sin(t * speeds[i] * 0.55    + phases[i]) * 0.18);
    }
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* Very small, very transparent — dust, not fireflies */}
      <pointsMaterial color="#88aad8" size={0.055} sizeAttenuation transparent opacity={0.22} depthWrite={false} />
    </points>
  );
}

// ─── POST FX ──────────────────────────────────────────────────────────────────
// Deliberately restrained: gentle bloom only on bright emissives,
// strong vignette to frame the scene, and a whisper of grain.

function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.28}
        kernelSize={KernelSize.MEDIUM}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.55}
      />
      <Vignette offset={0.32} darkness={0.78} blendFunction={BlendFunction.NORMAL} />
      <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} premultiplied={false} />
    </EffectComposer>
  );
}

// ─── SCENE ────────────────────────────────────────────────────────────────────

function GraveyardScene() {
  return (
    <>
      <CinematicCamera />
      <Moonlight />
      <MoonlightPool />
      <Moon />
      <MoonHaze />
      <GroundMesh />
      <FogLayers />
      <DustMotes />
      {STONES.map((def, i) => (
        <Tombstone key={i} def={def} />
      ))}
      <PostFX />
      {/* Three.js scene fog — exponential density from z=25 onwards */}
      <fog attach="fog" args={["#050c1a", 25, 85]} />
    </>
  );
}

// ─── CANVAS ───────────────────────────────────────────────────────────────────

export function GraveyardCanvas() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 5.5, 18], fov: 58, near: 0.1, far: 200 }}
      shadows={{ type: 3 }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <GraveyardScene />
      </Suspense>
    </Canvas>
  );
}
