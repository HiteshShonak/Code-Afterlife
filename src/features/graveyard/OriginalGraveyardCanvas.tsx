"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sparkles, Text, BakeShadows } from "@react-three/drei";
import * as THREE from "three";
// @ts-ignore
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { useMemo, useRef, useState, useEffect, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
// @ts-ignore
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import type { Project } from "./types";
import { GraveyardSidebar } from "./GraveyardSidebar";
import { GraveyardHeader, type GraveyardFilters } from "./GraveyardHeader";

const simplex = new SimplexNoise();

// suppress warning
if (typeof window !== "undefined") {
  const _origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    _origWarn(...args);
  };
}

// ─── TERRAIN HEIGHT ───────────────────────────────────────────────────────────

function getTerrainHeight(x: number, z: number) {
  // terrain noise
  const height = simplex.noise(x * 0.04, z * 0.04) * 1.5;
  const mid = simplex.noise(x * 0.15, z * 0.15) * 0.3;
  const micro = simplex.noise(x * 0.6, z * 0.6) * 0.05;
  return height + mid + micro;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const VISIBLE_ROUNDED = 55; // Enough for a dense field

// fog zone
const FOG_NEAR = 12;
const FOG_FAR = 36;

// directional recycling
const RECYCLE_DIST = 75;

// spawning - recycled tombs appear past fog (already correct)
const SPAWN_MIN = FOG_FAR + 8;
const SPAWN_MAX = FOG_FAR + 30;

// Initial spawn zone: all starting tombs must be INSIDE the clear visible area
// so the player sees a populated graveyard immediately on load.
// Min = just past arm's reach; Max = just inside fog wall.
const USER_SPAWN_MIN = 10;
const USER_SPAWN_MAX = FOG_NEAR + 6; // 18 - well inside clear view

// spacing
const MIN_DIST_ROUNDED = 10;
const MAX_DIST_ROUNDED = 13;

// Proximity required to interact with a tombstone
const INTERACT_DIST = 21;

// Hovered stone always gets text regardless of distance

// chunk system
const CHUNK_SIZE = 80;
const CHUNK_GRID = 3;

// Text LOD - module-level so it isn’t recomputed inside TombstoneText on every call
const LOD_SQ = (FOG_FAR + 4) * (FOG_FAR + 4);

// Canvas props hoisted to module level - object identity is stable across renders
const CANVAS_CAMERA = { position: [0, 5, 14] as [number, number, number], fov: 60 };
const CANVAS_GL     = { antialias: true, alpha: false };
const CANVAS_SHADOWS = { type: 3 } as const;

// collision grid

class CollisionGrid {
  private cells = new Map<string, THREE.Vector3[]>();
  private cellSize: number;

  constructor(cellSize = 30) {
    this.cellSize = cellSize;
  }

  clear() {
    this.cells.clear();
  }

  private key(x: number, z: number) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  add(pos: THREE.Vector3) {
    const k = this.key(pos.x, pos.z);
    if (!this.cells.has(k)) this.cells.set(k, []);
    this.cells.get(k)!.push(pos.clone());
  }

  remove(pos: THREE.Vector3) {
    const k = this.key(pos.x, pos.z);
    const arr = this.cells.get(k);
    if (!arr) return;
    const idx = arr.findIndex(p => p.distanceToSquared(pos) < 0.01);
    if (idx !== -1) arr.splice(idx, 1);
  }

  isTooClose(x: number, z: number, minDist: number): boolean {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    // check neighbors
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const k = `${cx + dx},${cz + dz}`;
        const arr = this.cells.get(k);
        if (!arr) continue;
        for (const p of arr) {
          const ddx = p.x - x;
          const ddz = p.z - z;
          if (ddx * ddx + ddz * ddz < minDist * minDist) return true;
        }
      }
    }
    return false;
  }

  // check neighbor
  hasNeighborWithin(x: number, z: number, maxDist: number): boolean {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    const cells = Math.ceil(maxDist / this.cellSize) + 1;
    for (let dx = -cells; dx <= cells; dx++) {
      for (let dz = -cells; dz <= cells; dz++) {
        const k = `${cx + dx},${cz + dz}`;
        const arr = this.cells.get(k);
        if (!arr) continue;
        for (const p of arr) {
          const ddx = p.x - x;
          const ddz = p.z - z;
          if (ddx * ddx + ddz * ddz <= maxDist * maxDist) return true;
        }
      }
    }
    return false;
  }
}

// Singleton shared across all tombstone types
const globalGrid = new CollisionGrid(30);

// ─── GEOMETRIES ───────────────────────────────────────────────────────────────

class RoundedTombstoneGeometry extends THREE.BufferGeometry {
  constructor(width = 0.6, height = 1.0, depth = 0.2) {
    super();
    const baseH = height * 0.7;
    const base = new THREE.BoxGeometry(width, baseH, depth); base.translate(0, baseH / 2, 0);
    const top = new THREE.CylinderGeometry(width / 2, width / 2, depth, 16, 1, false, 0, Math.PI);
    top.rotateY(Math.PI / 2); top.rotateX(Math.PI / 2); top.translate(0, baseH + (height - baseH) / 2 - depth / 2 - 0.05, 0);
    this.copy(BufferGeometryUtils.mergeGeometries([base, top], true));
  }
}

// polar spawn

const _rotY = new THREE.Matrix4();
const _dir = new THREE.Vector3();

function polarSpawn(camPos: THREE.Vector3, forward: THREE.Vector3, minR: number, maxR: number): { x: number; z: number } {
  const angle = (Math.random() - 0.5) * Math.PI * 1.4; // ±126° arc in front
  const radius = minR + Math.random() * (maxR - minR);
  _rotY.makeRotationY(angle);
  _dir.copy(forward).applyMatrix4(_rotY);
  _dir.y = 0; _dir.normalize();
  return {
    x: camPos.x + _dir.x * radius,
    z: camPos.z + _dir.z * radius,
  };
}

// ─── TREADMILL TOMBSTONES ─────────────────────────────────────────────────────

interface ActiveTombstone {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  dataIndex: number; // -1 for decorative
}

// face camera
function makeFacingQuat(tombPos: THREE.Vector3, camPos: THREE.Vector3): THREE.Quaternion {
  const dx = camPos.x - tombPos.x;
  const dz = camPos.z - tombPos.z;
  // atan2(dx, dz) gives the Y angle to face the camera in the XZ plane
  const angle = Math.atan2(dx, dz);
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(
    (Math.random() - 0.5) * 0.04,  // tiny natural tilt
    angle + (Math.random() - 0.5) * 0.28, // face camera ± slight variation
    (Math.random() - 0.5) * 0.06
  ));
}

function makeRoundedScale(): THREE.Vector3 {
  // rounded scale
  const s = (1.17 + Math.random() * 0.04) * 5.0;
  const heightMult = 0.90 + Math.random() * 0.06;
  return new THREE.Vector3(s, s * heightMult, s);
}

function tryPlacePosition(
  x: number, z: number, minDist: number
): THREE.Vector3 | null {
  if (globalGrid.isTooClose(x, z, minDist)) return null;
  const y = getTerrainHeight(x, z);
  return new THREE.Vector3(x, y, z);
}

function createInitialItem(
  camX: number, camZ: number,
  minDist: number,
  dataIndex: number,
  scaleFn: () => THREE.Vector3,
  camPos: THREE.Vector3
): ActiveTombstone | null {
  for (let attempt = 0; attempt < 500; attempt++) {
    // Spawn inside the clear visible zone so all tombs are visible at load.
    // USER_SPAWN_MIN keeps them out of the player's face;
    // USER_SPAWN_MAX keeps them before the fog wall.
    const r = USER_SPAWN_MIN + Math.random() * (USER_SPAWN_MAX - USER_SPAWN_MIN);
    const a = Math.random() * Math.PI * 2;
    const x = camX + Math.cos(a) * r;
    const z = camZ + Math.sin(a) * r;
    const pos = tryPlacePosition(x, z, minDist);
    if (!pos) continue;
    globalGrid.add(pos);
    return {
      position: pos,
      quaternion: makeFacingQuat(pos, camPos),
      scale: scaleFn(),
      dataIndex,
    };
  }
  return null;
}

// boundary box
interface BoundaryBox {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

function TreadmillTombstones({
  onSelectProject,
  projects,
}: {
  onSelectProject: (dataIndex: number) => void;
  projects: Project[];
}) {
  const geoms = useMemo(() => ({
    rounded: new RoundedTombstoneGeometry(),
    // Default stone material - overridden per instance for RESURRECTED status
    mat: new THREE.MeshStandardMaterial({ color: 0x3a4259, roughness: 0.85, metalness: 0.1 }),
    matResurrected: new THREE.MeshStandardMaterial({ color: 0x3a5068, roughness: 0.78, metalness: 0.15, emissive: new THREE.Color(0x0a2a3a), emissiveIntensity: 0.2 }),
  }), []);

  // CAM_START is the initial camera position - memoized to avoid
  // allocating a new Vector3 on every render.
  const CAM_START = useMemo(() => new THREE.Vector3(0, 5, 0), []);
  // Dynamic TOTAL_DATA: works with any number of projects from API
  const TOTAL_DATA_DYNAMIC = Math.max(1, projects.length);
  const ACTUAL_VISIBLE = Math.min(VISIBLE_ROUNDED, TOTAL_DATA_DYNAMIC);
  const [roundedItems, setRoundedItems] = useState<ActiveTombstone[]>(() => {
    const arr: ActiveTombstone[] = [];
    for (let i = 0; i < ACTUAL_VISIBLE; i++) {
      const item = createInitialItem(0, 0, MIN_DIST_ROUNDED, i % TOTAL_DATA_DYNAMIC, makeRoundedScale, CAM_START);
      if (item) arr.push(item);
    }
    // fill hidden slots
    while (arr.length < VISIBLE_ROUNDED) {
      arr.push({
        position: new THREE.Vector3(0, -100, 0), // buried below ground
        quaternion: new THREE.Quaternion(),
        scale: new THREE.Vector3(0.001, 0.001, 0.001),
        dataIndex: arr.length % TOTAL_DATA_DYNAMIC,
      });
    }
    return arr;
  });

  // throttle recycle
  const recycleFrameRef = useRef(0);
  const _recycleForward = useMemo(() => new THREE.Vector3(), []);
  const _recycleToStone = useMemo(() => new THREE.Vector3(), []);

  // data index ref
  const dataIndexRef = useRef(VISIBLE_ROUNDED);

  // Refs for instanced meshes
  const roundedRef = useRef<THREE.InstancedMesh>(null);

  const [hovered, setHovered] = useState<number | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const flushMesh = useCallback((mesh: THREE.InstancedMesh | null, items: ActiveTombstone[]) => {
    if (!mesh) return;
    items.forEach((item, i) => {
      dummy.position.copy(item.position);
      dummy.position.y -= 0.2; // Sink deeper so corners don’t float on steep slopes
      dummy.quaternion.copy(item.quaternion);
      dummy.scale.copy(item.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  // dummy is stable (useMemo), so this dep array is correct
   
  }, [dummy]);

  useEffect(() => flushMesh(roundedRef.current, roundedItems), [roundedItems]);

  useEffect(() => {
    return () => {
      globalGrid.clear();
    };
     
  }, []);

  useFrame(({ camera }) => {
    // throttle
    recycleFrameRef.current++;
    if (recycleFrameRef.current % 3 !== 0) return;

    const camPos = camera.position;
    _recycleForward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    _recycleForward.y = 0;
    _recycleForward.normalize();

    // check behind
    let roundedDirty = false;
    // Precompute for duplicate guard - done OUTSIDE the .map() so it's
    // accessible as a stable reference (avoids temporal-dead-zone bug where
    // `newRounded` would be undefined inside its own .map() callback).
    const FOG_FAR_SQ = FOG_FAR * FOG_FAR;
    // Track which dataIndices are assigned THIS recycle tick so multiple
    // simultaneous recycled stones don't both claim the same index.
    const usedThisFrame = new Set<number>();

    const newRounded = roundedItems.map(item => {
      _recycleToStone.set(
        item.position.x - camPos.x, 0, item.position.z - camPos.z
      );
      const dist = _recycleToStone.length();
      if (dist < 1) return item;
      const dot = _recycleToStone.clone().normalize().dot(_recycleForward);
      // keep if front
      if (dot > -0.2 || dist <= RECYCLE_DIST) return item;

      // recycle ahead
      const oldPos = item.position.clone();
      globalGrid.remove(item.position);
      let newPos: THREE.Vector3 | null = null;
      for (let attempt = 0; attempt < 200 && !newPos; attempt++) {
        const { x, z } = polarSpawn(camPos, _recycleForward, SPAWN_MIN, SPAWN_MAX);
        newPos = tryPlacePosition(x, z, MIN_DIST_ROUNDED);
      }
      if (!newPos) {
        globalGrid.add(oldPos);
        return item;
      }
      globalGrid.add(newPos);
      roundedDirty = true;

      // Duplicate-visibility guard (FIXED):
      // Check roundedItems (the stable frame-start snapshot, NOT newRounded which
      // would be in the TDZ here) to find which dataIndices are currently visible
      // inside the fog zone. Also skip any index claimed earlier in this same tick.
      let nextIndex = dataIndexRef.current % TOTAL_DATA_DYNAMIC;
      if (TOTAL_DATA_DYNAMIC > 1) {
        for (let attempt = 0; attempt < TOTAL_DATA_DYNAMIC; attempt++) {
          const candidate = (dataIndexRef.current + attempt) % TOTAL_DATA_DYNAMIC;
          // Already assigned to another stone recycled this frame
          if (usedThisFrame.has(candidate)) continue;
          // Check whether any currently-visible stone carries this dataIndex.
          // "Visible" = within the full fog sphere so the player can see it.
          const visibleDuplicate = roundedItems.some(other => {
            if (other.dataIndex !== candidate) return false;
            const dx = other.position.x - camPos.x;
            const dz = other.position.z - camPos.z;
            return dx * dx + dz * dz < FOG_FAR_SQ;
          });
          if (!visibleDuplicate) { nextIndex = candidate; break; }
        }
      }
      usedThisFrame.add(nextIndex);
      dataIndexRef.current++;

      return {
        ...item,
        position: newPos,
        quaternion: makeFacingQuat(newPos, camPos),
        scale: makeRoundedScale(),
        dataIndex: nextIndex,
      };
    });
    if (roundedDirty) setRoundedItems(newRounded);
  });

  return (
    <group>
      {/* Rounded memorials - interactive only within INTERACT_DIST */}
      <instancedMesh
        ref={roundedRef}
        args={[geoms.rounded, geoms.mat, VISIBLE_ROUNDED]}
        castShadow receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          if (e.distance <= INTERACT_DIST) {
            setHovered(e.instanceId!);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => { setHovered(null); document.body.style.cursor = "auto"; }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.distance > INTERACT_DIST) return;
          if (e.instanceId !== undefined) {
            const item = roundedItems[e.instanceId];
            if (item && item.dataIndex >= 0) onSelectProject(item.dataIndex);
          }
        }}
      />
      <TombstoneText hoveredId={hovered} items={roundedItems} projects={projects} />

      {/* Hover effects - purple rim light + soul particles at hovered tombstone */}
      {hovered !== null && roundedItems[hovered] && (
        <group position={roundedItems[hovered].position}>
          <pointLight
            color="#7c4dff"
            intensity={3.0}
            distance={8}
            position={[0, roundedItems[hovered].scale.y * 0.6, 0]}
          />
          <Sparkles
            count={12}
            speed={0.15}
            size={0.6}
            scale={[2, 1.5, 2]}
            position={[0, 0.3, 0]}
            color="#9070d8"
            opacity={0.4}
          />
        </group>
      )}
    </group>
  );
}

// ─── TOMBSTONE TEXT (LOD-GATED) ───────────────────────────────────────────────

function TombstoneText({ hoveredId, items, projects }: {
  hoveredId: number | null;
  items: ActiveTombstone[];
  projects: Project[];
}) {
  const { camera } = useThree();
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // LOD_SQ is now a module-level constant - no per-call recomputation
  const visibleRef = useRef<Set<number>>(new Set(items.map((_, i) => i)));
  const [visibleSet, setVisibleSet] = useState<Set<number>>(() =>
    new Set(items.map((_, i) => i))
  );
  const frameRef = useRef(0);
  // Reuse a single Set instead of allocating new Set() every 4 frames
  const workSetRef = useRef(new Set<number>());

  useFrame(() => {
    frameRef.current++;
    if (frameRef.current % 4 !== 0) return;
    const cp = camera.position;
    const cur = itemsRef.current;
    const next = workSetRef.current;
    next.clear();
    for (let i = 0; i < cur.length; i++) {
      const dx = cp.x - cur[i].position.x;
      const dz = cp.z - cur[i].position.z;
      if (dx * dx + dz * dz <= LOD_SQ) next.add(i);
    }
    const prev = visibleRef.current;
    let changed = next.size !== prev.size;
    if (!changed) for (const idx of next) { if (!prev.has(idx)) { changed = true; break; } }
    if (changed) {
      // Clone into a new Set for state - workSetRef is mutated each frame
      const snapshot = new Set(next);
      visibleRef.current = snapshot;
      setVisibleSet(snapshot);
    }
  });

  return (
    <Suspense fallback={null}>
      <group>
        {items.map((item, i) => {
          if (item.dataIndex < 0 || item.dataIndex >= projects.length) return null;
          const project = projects[item.dataIndex];
          if (!project) return null;
          if (!visibleSet.has(i) && hoveredId !== i) return null;
          return (
            <TombstoneTextItem
              // Use dataIndex as key so React creates a fresh fiber (reset emissive lerp)
              // when a recycled slot gets a different project - prevents animation bleed.
              key={`${i}-${item.dataIndex}`}
              isHovered={hoveredId === i}
              item={item}
              project={project}
            />
          );
        })}
      </group>
    </Suspense>
  );
}

// engraved text

function TombstoneTextItem({ isHovered, item, project }: {
  isHovered: boolean;
  item: ActiveTombstone;
  project: Project;
}) {
  const nameRef = useRef<THREE.MeshStandardMaterial>(null);
  const dateRef = useRef<THREE.MeshStandardMaterial>(null);
  const quoteRef = useRef<THREE.MeshStandardMaterial>(null);
  const footerRef = useRef<THREE.MeshStandardMaterial>(null);
  // Back face refs - animated identically so hover glows on both sides
  const nameRefB = useRef<THREE.MeshStandardMaterial>(null);
  const dateRefB = useRef<THREE.MeshStandardMaterial>(null);
  const quoteRefB = useRef<THREE.MeshStandardMaterial>(null);
  const footerRefB = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    const speed = delta * 4; // Slightly faster transition
    const nTarget = isHovered ? 4.0 : 0.6;
    const dTarget = isHovered ? 2.5 : 0.35;
    const qTarget = isHovered ? 2.0 : 0.25;
    const fTarget = isHovered ? 1.5 : 0.2;
    // Front face
    if (nameRef.current) nameRef.current.emissiveIntensity = THREE.MathUtils.lerp(nameRef.current.emissiveIntensity, nTarget, speed);
    if (dateRef.current) dateRef.current.emissiveIntensity = THREE.MathUtils.lerp(dateRef.current.emissiveIntensity, dTarget, speed);
    if (quoteRef.current) quoteRef.current.emissiveIntensity = THREE.MathUtils.lerp(quoteRef.current.emissiveIntensity, qTarget, speed);
    if (footerRef.current) footerRef.current.emissiveIntensity = THREE.MathUtils.lerp(footerRef.current.emissiveIntensity, fTarget, speed);
    // Back face - same targets so both sides animate together
    if (nameRefB.current) nameRefB.current.emissiveIntensity = THREE.MathUtils.lerp(nameRefB.current.emissiveIntensity, nTarget, speed);
    if (dateRefB.current) dateRefB.current.emissiveIntensity = THREE.MathUtils.lerp(dateRefB.current.emissiveIntensity, dTarget, speed);
    if (quoteRefB.current) quoteRefB.current.emissiveIntensity = THREE.MathUtils.lerp(quoteRefB.current.emissiveIntensity, qTarget, speed);
    if (footerRefB.current) footerRefB.current.emissiveIntensity = THREE.MathUtils.lerp(footerRefB.current.emissiveIntensity, fTarget, speed);
  });

  // Memoize all THREE.Vector3/Quaternion allocations so they aren’t recreated on
  // every render. Recalculate only when item geometry actually changes (position/quaternion/scale).
  const { frontPos, backPos, backQuat, sx } = useMemo(() => {
    const frontZ  = new THREE.Vector3(0, 0,  item.scale.z * 0.11).applyQuaternion(item.quaternion);
    const backZ   = new THREE.Vector3(0, 0, -item.scale.z * 0.11).applyQuaternion(item.quaternion);
    const upOff   = new THREE.Vector3(0, item.scale.y * 0.42, 0);
    const fPos    = item.position.clone().add(frontZ).add(upOff);
    const bPos    = item.position.clone().add(backZ).add(upOff);
    const bQuat   = item.quaternion.clone().multiply(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0))
    );
    return { frontPos: fPos, backPos: bPos, backQuat: bQuat, sx: item.scale.x };
  }, [item.position, item.quaternion, item.scale]);

  const isResurrected = project.status === 'RESURRECTED';
  // emissive tint
  const nameEmissive   = isResurrected ? '#fcd34d' : '#60a5fa'; // Highly saturated for bloom
  const dateEmissive   = isResurrected ? '#facc15' : '#3b82f6';
  const quoteEmissive  = isResurrected ? '#eab308' : '#2563eb';
  const footerEmissive = isResurrected ? '#ca8a04' : '#1d4ed8';

  return (
    <group>
      {/* ── FRONT FACE ── */}
      <group position={frontPos} quaternion={item.quaternion} scale={sx}>
        {/* Project Name - safely inside bounds */}
        <Text position={[0, 0.22, 0]} fontSize={0.08} maxWidth={0.5} textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.02} fontWeight={700}>
          <meshStandardMaterial ref={nameRef} toneMapped={false} color="#0a1020" emissive={nameEmissive} emissiveIntensity={0.6} roughness={1} metalness={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          {project.name}
        </Text>
        {/* Born / Died */}
        <Text position={[0, 0.06, 0]} fontSize={0.04} maxWidth={0.5} lineHeight={1.4} textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.06}>
          <meshStandardMaterial ref={dateRef} toneMapped={false} color="#08101e" emissive={dateEmissive} emissiveIntensity={0.35} roughness={1} metalness={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          {`Born ${project.born}\nDied ${project.died}`}
        </Text>
        {/* Epitaph */}
        <Text position={[0, -0.08, 0]} fontSize={0.035} maxWidth={0.5} lineHeight={1.2} textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.02}>
          <meshStandardMaterial ref={quoteRef} toneMapped={false} color="#06091a" emissive={quoteEmissive} emissiveIntensity={0.25} roughness={1} metalness={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          {project.quote}
        </Text>
        {/* Footer */}
        <Text position={[0, -0.22, 0]} fontSize={0.03} maxWidth={0.5} textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.12}>
          <meshStandardMaterial ref={footerRef} toneMapped={false} color="#060a18" emissive={footerEmissive} emissiveIntensity={0.2} roughness={1} metalness={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          Rest in Code.
        </Text>
      </group>

      {/* back face */}
      <group position={backPos} quaternion={backQuat} scale={sx}>
        <Text position={[0, 0.22, 0]} fontSize={0.08} maxWidth={0.5} textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.02} fontWeight={700}>
          <meshStandardMaterial ref={nameRefB} toneMapped={false} color="#0a1020" emissive={nameEmissive} emissiveIntensity={0.6} roughness={1} metalness={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          {project.name}
        </Text>
        <Text position={[0, 0.06, 0]} fontSize={0.04} maxWidth={0.5} lineHeight={1.4} textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.06}>
          <meshStandardMaterial ref={dateRefB} toneMapped={false} color="#08101e" emissive={dateEmissive} emissiveIntensity={0.35} roughness={1} metalness={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          {`Born ${project.born}\nDied ${project.died}`}
        </Text>
        <Text position={[0, -0.08, 0]} fontSize={0.035} maxWidth={0.5} lineHeight={1.2} textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.02}>
          <meshStandardMaterial ref={quoteRefB} toneMapped={false} color="#06091a" emissive={quoteEmissive} emissiveIntensity={0.25} roughness={1} metalness={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          {project.quote}
        </Text>
        <Text position={[0, -0.22, 0]} fontSize={0.03} maxWidth={0.5} textAlign="center" anchorX="center" anchorY="middle" letterSpacing={0.12}>
          <meshStandardMaterial ref={footerRefB} toneMapped={false} color="#060a18" emissive={footerEmissive} emissiveIntensity={0.2} roughness={1} metalness={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          Rest in Code.
        </Text>
      </group>
    </group>
  );
}

// ─── CINEMATIC MOON (tracks camera) ──────────────────────────────────────────

function CinematicMoonLight() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const moonRef = useRef<THREE.Group>(null);

  // camera offset
  const OFFSET = useMemo(() => new THREE.Vector3(-35, 28, 55), []);
  const MOON_OFFSET = useMemo(() => new THREE.Vector3(-25, 22, 55), []);

  useFrame(({ camera }) => {
    if (dirRef.current) {
      dirRef.current.position.copy(camera.position).add(OFFSET);
      dirRef.current.target.position.copy(camera.position);
      dirRef.current.target.updateMatrixWorld();
    }
    if (moonRef.current) {
      moonRef.current.position.copy(camera.position).add(MOON_OFFSET);
    }
  });

  const moonMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN; void main() { vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vN; void main() { vec3 c = vec3(0.65,0.75,0.95); gl_FragColor = vec4(c * (0.8 + 0.2 * vN.y), 1.0); }`,
  }), []);

  return (
    <>
      <directionalLight
        ref={dirRef}
        color="#9cb4f0"
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={130}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <group ref={moonRef}>
        <mesh material={moonMat}>
          <sphereGeometry args={[7, 32, 32]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[10, 16, 16]} />
          <meshBasicMaterial color="#6585c5" transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      </group>
    </>
  );
}

// ─── CAMERA FOLLOW LIGHT ──────────────────────────────────────────────────────

function CinematicCameraLight() {
  const ref = useRef<THREE.PointLight>(null);
  const _cameraLightOffset = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (ref.current) {
      _cameraLightOffset.set(0, 0.5, -2).applyQuaternion(camera.quaternion);
      ref.current.position.copy(camera.position).add(_cameraLightOffset);
    }
  });
  return <pointLight ref={ref} intensity={6.0} distance={50} color="#ccd6f6" />;
}

// ─── GROUND FOG LAYERS ────────────────────────────────────────────────────────

const fogVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const fogFrag = `
uniform float time; uniform vec3 color; varying vec2 vUv;
float rnd(vec2 s) { return fract(sin(dot(s, vec2(12.9898,78.233)))*43758.5453); }
float nse(vec2 s) { vec2 i=floor(s); vec2 f=fract(s); float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+vec2(1,1)); vec2 u=f*f*(3.0-2.0*f); return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y; }
void main() {
  vec2 p = vUv * 4.0; p.x -= time * 0.012; p.y -= time * 0.008;
  float n = nse(p)*0.5 + nse(p*2.0)*0.25 + nse(p*4.0)*0.125;
  float edge = smoothstep(0.5, 0.1, distance(vUv, vec2(0.5)));
  gl_FragColor = vec4(color, n * edge * 0.5);
}`;

function GroundFog() {
  const mat1 = useRef<THREE.ShaderMaterial>(null);
  const mat2 = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    if (mat1.current) mat1.current.uniforms.time.value = t;
    if (mat2.current) mat2.current.uniforms.time.value = t + 30;
    if (groupRef.current) {
      // snap camera
      groupRef.current.position.x = Math.round(camera.position.x);
      groupRef.current.position.z = Math.round(camera.position.z);
    }
  });
  const uniforms1 = useMemo(() => ({ time: { value: 0 }, color: { value: new THREE.Color("#0c152e") } }), []);
  const uniforms2 = useMemo(() => ({ time: { value: 30 }, color: { value: new THREE.Color("#111833") } }), []);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 110]} />
        <shaderMaterial ref={mat1} uniforms={uniforms1} vertexShader={fogVert} fragmentShader={fogFrag} transparent depthWrite={false} blending={THREE.NormalBlending} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 120]} />
        <shaderMaterial ref={mat2} uniforms={uniforms2} vertexShader={fogVert} fragmentShader={fogFrag} transparent depthWrite={false} blending={THREE.NormalBlending} />
      </mesh>
    </group>
  );
}

// ─── INFINITE TERRAIN CHUNKING ────────────────────────────────────────────────

function TerrainChunk({ chunkX, chunkZ }: { chunkX: number; chunkZ: number }) {
  const ox = chunkX * CHUNK_SIZE;
  const oz = chunkZ * CHUNK_SIZE;

  const geo = useMemo(() => {
    let g: THREE.BufferGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 48, 48);
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    g = BufferGeometryUtils.mergeVertices(g);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + ox;
      const wz = pos.getY(i) + oz; // plane is rotated, Y is world Z
      pos.setZ(i, getTerrainHeight(wx, wz));
    }
    g.computeVertexNormals();
    return g;
  }, [ox, oz]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ox, 0, oz]} receiveShadow>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color="#102e18" roughness={1} metalness={0.05} />
    </mesh>
  );
}

function GrassChunk({ chunkX, chunkZ }: { chunkX: number; chunkZ: number }) {
  const ox = chunkX * CHUNK_SIZE;
  const oz = chunkZ * CHUNK_SIZE;
  const COUNT = 12000; // Halved from 30k - same visual density, half GPU cost

  const { geometry, material } = useMemo(() => {
    const bladeGeo = new THREE.ConeGeometry(0.015, 0.05, 3);
    bladeGeo.translate(0, 0.025, 0);
    bladeGeo.rotateX(0.15);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, side: THREE.DoubleSide });
    return { geometry: bladeGeo, material: mat };
  }, []);

  const { matrices, colors } = useMemo(() => {
    const matArr = new Float32Array(COUNT * 16);
    const colArr = new Float32Array(COUNT * 3);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const baseColor = new THREE.Color("#13361e");
    const highColor = new THREE.Color("#1c522d");
    const deadColor = new THREE.Color("#0c2414");
    for (let i = 0; i < COUNT; i++) {
      const x = ox + (Math.random() - 0.5) * CHUNK_SIZE;
      const z = oz + (Math.random() - 0.5) * CHUNK_SIZE;
      const n = simplex.noise(x * 0.15, z * 0.15);
      if (n < -0.3) {
        // empty patch
        dummy.position.set(x, -100, z); // sink below ground
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        dummy.matrix.toArray(matArr, i * 16);
        baseColor.toArray(colArr, i * 3);
        continue;
      }
      const y = getTerrainHeight(x, z);
      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.rotation.z = (Math.random() - 0.5) * 0.4;
      dummy.rotation.x = (Math.random() - 0.5) * 0.4;
      const s = (0.5 + Math.random() * 0.8) * (1 + n * 0.5);
      dummy.scale.set(s, s * (1 + Math.random() * 0.5), s);
      dummy.updateMatrix();
      dummy.matrix.toArray(matArr, i * 16);
      const r = Math.random();
      color.copy(r > 0.8 ? highColor : r < 0.2 ? deadColor : baseColor);
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
      color.toArray(colArr, i * 3);
    }
    return { matrices: matArr, colors: colArr };
  }, [ox, oz]);

  return (
    <instancedMesh args={[geometry, material, COUNT]}>
      <instancedBufferAttribute attach="instanceMatrix" args={[matrices, 16]} />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}

// seamless ground
// This ensures the ground is bumpy and physically aligned with all grass and tombstones.

const GROUND_PLANE_SIZE = 140; // Beyond FOG_FAR (36 * 2)
const GROUND_SEGMENTS = 70; // 2 units per segment

function SeamlessGround() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.PlaneGeometry>(null);
  const lastSnap = useRef({ x: -9999, z: -9999 });
  const SNAP_STEP = 20; // Halved frequency for less stutter

  useFrame(({ camera }) => {
    if (!meshRef.current || !geomRef.current) return;
    const cx = Math.round(camera.position.x / SNAP_STEP) * SNAP_STEP;
    const cz = Math.round(camera.position.z / SNAP_STEP) * SNAP_STEP;
    
    if (cx !== lastSnap.current.x || cz !== lastSnap.current.z) {
      lastSnap.current = { x: cx, z: cz };
      meshRef.current.position.x = cx;
      meshRef.current.position.z = cz;
      
      // deform vertices
      const posAttr = geomRef.current.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const localX = posAttr.getX(i);
        const localY = posAttr.getY(i);
        const worldX = cx + localX;
        const worldZ = cz - localY; // Plane is rotated -90 deg on X, so local Y is world -Z
        const y = getTerrainHeight(worldX, worldZ);
        posAttr.setZ(i, y); // local Z becomes world Y
      }
      posAttr.needsUpdate = true;
      geomRef.current.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry ref={geomRef} args={[GROUND_PLANE_SIZE, GROUND_PLANE_SIZE, GROUND_SEGMENTS, GROUND_SEGMENTS]} />
      <meshStandardMaterial color="#0b1c0f" roughness={1} metalness={0.05} />
    </mesh>
  );
}

function InfiniteWorld() {
  const [chunks, setChunks] = useState<{ cx: number; cz: number }[]>(() => {
    const initial: { cx: number; cz: number }[] = [];
    const half = Math.floor(CHUNK_GRID / 2);
    for (let dx = -half; dx <= half; dx++)
      for (let dz = -half; dz <= half; dz++)
        initial.push({ cx: dx, cz: dz });
    return initial;
  });

  const lastChunk = useRef({ cx: 0, cz: 0 });

  useFrame(({ camera }) => {
    const cx = Math.round(camera.position.x / CHUNK_SIZE);
    const cz = Math.round(camera.position.z / CHUNK_SIZE);
    if (cx === lastChunk.current.cx && cz === lastChunk.current.cz) return;
    lastChunk.current = { cx, cz };
    const half = Math.floor(CHUNK_GRID / 2);
    const next: { cx: number; cz: number }[] = [];
    for (let dx = -half; dx <= half; dx++)
      for (let dz = -half; dz <= half; dz++)
        next.push({ cx: cx + dx, cz: cz + dz });
    setChunks(next);
  });

  return (
    <group>
      {/* seamless ground */}
      <SeamlessGround />
      {/* grass and bushes */}
      {chunks.map(({ cx, cz }) => (
        <group key={`${cx},${cz}`}>
          <GrassChunk chunkX={cx} chunkZ={cz} />
          <BushChunk chunkX={cx} chunkZ={cz} />
        </group>
      ))}
    </group>
  );
}

// bush clusters

function BushChunk({ chunkX, chunkZ }: { chunkX: number; chunkZ: number }) {
  const ox = chunkX * CHUNK_SIZE;
  const oz = chunkZ * CHUNK_SIZE;
  const BUSH_COUNT = 40;

  const bushGeo = useMemo(() => {
    // simple bush
    const s1 = new THREE.SphereGeometry(0.5, 6, 5);
    const s2 = new THREE.SphereGeometry(0.38, 6, 5); s2.translate(0.35, 0.15, 0.2);
    const s3 = new THREE.SphereGeometry(0.3, 6, 5); s3.translate(-0.3, 0.1, -0.15);
    return BufferGeometryUtils.mergeGeometries([s1, s2, s3], true);
  }, []);

  const bushMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x0c2818, roughness: 1, metalness: 0, side: THREE.DoubleSide,
  }), []);

  const bushes = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: number; rotY: number }[] = [];
    for (let i = 0; i < BUSH_COUNT; i++) {
      const x = ox + (Math.random() - 0.5) * CHUNK_SIZE;
      const z = oz + (Math.random() - 0.5) * CHUNK_SIZE;
      // bush clustering
      const n = simplex.noise(x * 0.06, z * 0.06);
      if (n < 0.15 || n > 0.55) continue;
      const y = getTerrainHeight(x, z);
      const s = 0.4 + Math.random() * 0.6;
      arr.push({ pos: [x, y - 0.05, z], scale: s, rotY: Math.random() * Math.PI * 2 });
    }
    return arr;
  }, [ox, oz]);

  return (
    <group>
      {bushes.map((b, i) => (
        <mesh key={i} geometry={bushGeo} material={bushMat} position={b.pos} rotation={[0, b.rotY, 0]} scale={b.scale} castShadow />
      ))}
    </group>
  );
}

// wasd controls

function WASDControls({
  controlsRef,
  boundary,
  setAtBoundary,
}: {
  controlsRef: React.RefObject<any>;
  boundary: BoundaryBox | null;
  setAtBoundary: (v: boolean) => void;
}) {
  const keys = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    const down = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k in keys.current) (keys.current as any)[k] = true; };
    const up = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k in keys.current) (keys.current as any)[k] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // banner timer
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const _WASD_fwd = useMemo(() => new THREE.Vector3(), []);
  const _WASD_right = useMemo(() => new THREE.Vector3(), []);
  const _WASD_move = useMemo(() => new THREE.Vector3(), []);
  const _WASD_moveX = useMemo(() => new THREE.Vector3(), []);
  const _WASD_moveZ = useMemo(() => new THREE.Vector3(), []);
  const _WASD_newPosX = useMemo(() => new THREE.Vector3(), []);
  const _WASD_newPosZ = useMemo(() => new THREE.Vector3(), []);
  const _WASD_finalPos = useMemo(() => new THREE.Vector3(), []);
  const _WASD_validMove = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const speed = 10 * delta;
    _WASD_fwd.set(0, 0, -1).applyQuaternion(controlsRef.current.object.quaternion);
    _WASD_fwd.y = 0; _WASD_fwd.normalize();
    _WASD_right.set(1, 0, 0).applyQuaternion(controlsRef.current.object.quaternion);
    _WASD_right.y = 0; _WASD_right.normalize();
    _WASD_move.set(0, 0, 0);
    if (keys.current.w) _WASD_move.add(_WASD_fwd);
    if (keys.current.s) _WASD_move.sub(_WASD_fwd);
    if (keys.current.a) _WASD_move.sub(_WASD_right);
    if (keys.current.d) _WASD_move.add(_WASD_right);
    if (_WASD_move.lengthSq() > 0) {
      _WASD_move.normalize().multiplyScalar(speed);
      
      const objPos = controlsRef.current.object.position;
      
      // xz collision
      _WASD_moveX.copy(_WASD_move); _WASD_moveX.z = 0;
      _WASD_moveZ.copy(_WASD_move); _WASD_moveZ.x = 0;

      _WASD_newPosX.copy(objPos).add(_WASD_moveX);
      _WASD_newPosZ.copy(objPos).add(_WASD_moveZ);

      _WASD_finalPos.copy(objPos);

      // camera collision
      if (!globalGrid.hasNeighborWithin(_WASD_newPosX.x, _WASD_newPosX.z, 2.5)) {
        _WASD_finalPos.x = _WASD_newPosX.x;
      }
      if (!globalGrid.hasNeighborWithin(_WASD_newPosZ.x, _WASD_newPosZ.z, 2.5)) {
        _WASD_finalPos.z = _WASD_newPosZ.z;
      }
      
      // clamp boundary
      let clamped = false;
      if (boundary) {
        if (_WASD_finalPos.x < boundary.minX) { _WASD_finalPos.x = boundary.minX; clamped = true; }
        if (_WASD_finalPos.x > boundary.maxX) { _WASD_finalPos.x = boundary.maxX; clamped = true; }
        if (_WASD_finalPos.z < boundary.minZ) { _WASD_finalPos.z = boundary.minZ; clamped = true; }
        if (_WASD_finalPos.z > boundary.maxZ) { _WASD_finalPos.z = boundary.maxZ; clamped = true; }
      }

      // show banner
      if (clamped) {
        setAtBoundary(true);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setAtBoundary(false), 3000);
      }

      _WASD_validMove.copy(_WASD_finalPos).sub(objPos);
      controlsRef.current.target.add(_WASD_validMove);
      controlsRef.current.object.position.copy(_WASD_finalPos);
      controlsRef.current.update();
    }
  });

  return null;
}

// exhaustion banner

function BoundaryBanner({ atBoundary }: { atBoundary: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: atBoundary ? 1 : 0, y: atBoundary ? 0 : 20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        bottom: 36,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        background: "linear-gradient(135deg, rgba(5,8,20,0.92), rgba(15,20,40,0.88))",
        border: "1px solid rgba(100,130,220,0.25)",
        backdropFilter: "blur(16px)",
        borderRadius: 16,
        padding: "16px 36px",
        textAlign: "center",
        pointerEvents: "none",
        boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(100,140,220,0.1)",
      }}
    >
      <div style={{
        color: "#8ba8e0",
        fontSize: 14,
        letterSpacing: "0.18em",
        fontFamily: "Inter, sans-serif",
        textTransform: "uppercase",
        fontWeight: 500,
      }}>
        Beyond here, no code was ever written…
      </div>
      <div style={{
        color: "#4a5a80",
        fontSize: 11,
        letterSpacing: "0.1em",
        fontFamily: "Inter, sans-serif",
        marginTop: 6,
        textTransform: "uppercase",
      }}>
        You have reached the edge of memory
      </div>
    </motion.div>
  );
}

// main component

interface OriginalGraveyardCanvasProps {
  projects: Project[];
  isAuthenticated: boolean;
  onResurrect: (projectId: string) => void;
}

export function OriginalGraveyardCanvas({ projects, isAuthenticated, onResurrect }: OriginalGraveyardCanvasProps) {
  const [loaded, setLoaded] = useState(false);
  const controlsRef = useRef<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [atBoundary, setAtBoundary] = useState(false);
  // Stable callback - avoids creating a new function ref on every render
  const handleCloseSidebar = useCallback(() => setSelectedProjectId(null), []);

  // filters
  const [filters, setFilters] = useState<GraveyardFilters>({
    search: '',
    techs: [],
    sort: 'trending',
  });

  // filter projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.quote.toLowerCase().includes(q)
      );
    }

    // sort
    if (filters.sort === 'newest') {
      result = result.sort((a, b) => b.diedAt - a.diedAt);
    } else if (filters.sort === 'oldest') {
      result = result.sort((a, b) => a.diedAt - b.diedAt);
    } else if (filters.sort === 'most_connections') {
      result = result.sort((a, b) => b.soulConnections - a.soulConnections);
    }
    // default order

    return result;
  }, [projects, filters]);

  // filter transition
  const [filterKey, setFilterKey] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);
  const isFirstRender = useRef(true);
  const filterTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // filter fade
  const isFilterFade = useRef(false);

  useEffect(() => {
    // skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // clear timers
    filterTimers.current.forEach(clearTimeout);
    filterTimers.current = [];

    // show black screen
    setSelectedProjectId(null);
    setIsFiltering(true);
    isFilterFade.current = true; // filter fade

    // remount treadmill
    const t1 = setTimeout(() => setFilterKey((k) => k + 1), 350);

    // fade overlay
    const t2 = setTimeout(() => setIsFiltering(false), 500);

    filterTimers.current = [t1, t2];
    return () => filterTimers.current.forEach(clearTimeout);
   
  }, [filteredProjects]);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#030611", overflow: "hidden", position: "relative" }}>

      {/* header */}
      <GraveyardHeader filters={filters} onChange={setFilters} />

      {/* filtered count */}
      {(filters.search || filters.techs.length > 0) && (
        <div
          className="pointer-events-none absolute bottom-8 left-1/2 z-40 -translate-x-1/2"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <div className="flex items-center gap-2 rounded-full border border-purple-500/20 bg-[#080c18]/70 px-4 py-2 backdrop-blur-md">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-400/70">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      )}

      <GraveyardSidebar
        project={selectedProjectId !== null ? filteredProjects[selectedProjectId] ?? null : null}
        isAuthenticated={isAuthenticated}
        onResurrect={onResurrect}
        onClose={handleCloseSidebar}
      />

      <BoundaryBanner atBoundary={atBoundary} />

      <Canvas
        dpr={[1, 1.5]}
        gl={CANVAS_GL}
        shadows={CANVAS_SHADOWS}
        camera={CANVAS_CAMERA}
      >
        <BakeShadows />

        {/* layered fog */}
        <color attach="background" args={["#04060d"]} />
        <fog attach="fog" args={["#050814", FOG_NEAR, FOG_FAR]} />

        {/* ambient light */}
        <hemisphereLight args={["#1e2a4f", "#060912", 0.45]} />

        {/* accent lights */}
        <pointLight position={[-8, 0.2, -10]} intensity={1.5} distance={9} color="#45548a" />
        <pointLight position={[12, 0.3, -15]} intensity={1.2} distance={11} color="#5a378a" />

        {/* cinematic rim */}
        <directionalLight position={[-30, 20, 60]} color="#6b409c" intensity={1.0} />

        {/* moonlight */}
        <CinematicMoonLight />

        {/* ground fog */}
        <GroundFog />

        {/* terrain */}
        <InfiniteWorld />

        {/* path strip */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[3, 80]} />
          <meshStandardMaterial color="#05070a" transparent opacity={0.5} roughness={0.9} />
        </mesh>

        {/* tombstones */}
        <TreadmillTombstones
          key={filterKey}
          onSelectProject={setSelectedProjectId}
          projects={filteredProjects}
        />

        {/* camera light */}
        <CinematicCameraLight />



        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.04}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={18}
          target={[0, 1.5, -5]}
        />

        <WASDControls controlsRef={controlsRef} boundary={null} setAtBoundary={setAtBoundary} />

        <EffectComposer multisampling={4}>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={1.2} mipmapBlur />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
          <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      </Canvas>

      {/* black overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-50 bg-[#030611]"
        initial="visible"
        animate={(loaded && !isFiltering) ? 'hidden' : 'visible'}
        variants={{
          visible: {
            opacity: 1,
            transition: { duration: 0, ease: 'linear' },
          },
          hidden: {
            opacity: 0,
            transition: {
              duration: isFilterFade.current ? 1.2 : 1.8,
              ease: [0.76, 0, 0.24, 1] as any,
              onComplete: () => { isFilterFade.current = false; },
            },
          },
        }}
      />
    </div>
  );
}
