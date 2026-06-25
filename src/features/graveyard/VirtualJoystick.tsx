'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface VirtualJoystickProps {
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
}

const JOYSTICK_SIZE = 160;
const THUMB_SIZE = 58;
const MAX_TRAVEL = (JOYSTICK_SIZE - THUMB_SIZE) / 2;

export function VirtualJoystick({ joystickRef }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const thumbX = useSpring(rawX, { stiffness: 420, damping: 34, mass: 0.45 });
  const thumbY = useSpring(rawY, { stiffness: 420, damping: 34, mass: 0.45 });

  useEffect(() => {
    return () => {
      joystickRef.current.x = 0;
      joystickRef.current.y = 0;
    };
  }, [joystickRef]);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = baseRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const clampedDistance = Math.min(distance, MAX_TRAVEL);
    const scale = distance > 0 ? clampedDistance / distance : 0;
    const clampedX = deltaX * scale;
    const clampedY = deltaY * scale;

    rawX.set(clampedX);
    rawY.set(clampedY);
    joystickRef.current.x = clampedX / MAX_TRAVEL;
    joystickRef.current.y = clampedY / MAX_TRAVEL;
  };

  const resetJoystick = () => {
    pointerIdRef.current = null;
    rawX.set(0);
    rawY.set(0);
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
  };

  return (
    <div
      className="pointer-events-none select-none"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        zIndex: 45,
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE + 24,
        }}
      >
        <motion.div
          ref={baseRef}
          onPointerDown={(event) => {
            pointerIdRef.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            updateFromPointer(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (pointerIdRef.current !== event.pointerId) return;
            updateFromPointer(event.clientX, event.clientY);
          }}
          onPointerUp={(event) => {
            if (pointerIdRef.current !== event.pointerId) return;
            event.currentTarget.releasePointerCapture(event.pointerId);
            resetJoystick();
          }}
          onPointerCancel={(event) => {
            if (pointerIdRef.current !== event.pointerId) return;
            event.currentTarget.releasePointerCapture(event.pointerId);
            resetJoystick();
          }}
          onLostPointerCapture={() => {
            resetJoystick();
          }}
          whileTap={{ scale: 0.985 }}
          className="pointer-events-auto"
          style={{
            width: JOYSTICK_SIZE,
            height: JOYSTICK_SIZE,
            margin: '24px auto 0',
            borderRadius: 999,
            position: 'relative',
            touchAction: 'none',
            background:
              'radial-gradient(circle at 50% 26%, rgba(188, 210, 238, 0.14), rgba(24, 33, 49, 0.18) 30%, rgba(7, 11, 20, 0.62) 64%, rgba(2, 5, 11, 0.9) 100%)',
            border: '1px solid rgba(120, 145, 178, 0.16)',
            boxShadow:
              '0 18px 38px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(196, 210, 232, 0.08), inset 0 -22px 36px rgba(0, 0, 0, 0.34)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -14,
              borderRadius: 999,
              background:
                'radial-gradient(circle, rgba(9, 14, 25, 0.32), rgba(9, 14, 25, 0) 72%)',
              filter: 'blur(18px)',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 12,
              borderRadius: 999,
              border: '1px solid rgba(105, 128, 158, 0.16)',
              background:
                'radial-gradient(circle, rgba(220, 232, 247, 0.12), rgba(122, 144, 176, 0.03) 38%, rgba(255, 255, 255, 0) 72%)',
              boxShadow: 'inset 0 0 32px rgba(124, 152, 194, 0.08)',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 28,
              borderRadius: 999,
              border: '1px dashed rgba(110, 130, 159, 0.11)',
              background:
                'radial-gradient(circle, rgba(235, 241, 250, 0.08), rgba(255, 255, 255, 0) 66%)',
            }}
          />

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 4,
            height: 56,
            marginLeft: -2,
            marginTop: -28,
            borderRadius: 999,
            background:
              'linear-gradient(180deg, rgba(185, 201, 224, 0.14), rgba(185, 201, 224, 0.02))',
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 56,
            height: 4,
            marginLeft: -28,
            marginTop: -2,
            borderRadius: 999,
            background:
              'linear-gradient(90deg, rgba(185, 201, 224, 0.02), rgba(185, 201, 224, 0.14))',
          }}
        />

        <motion.div
          aria-hidden="true"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: 999,
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: -THUMB_SIZE / 2,
            marginTop: -THUMB_SIZE / 2,
            x: thumbX,
            y: thumbY,
            background:
              'radial-gradient(circle at 35% 30%, rgba(238, 244, 251, 0.42), rgba(162, 183, 211, 0.18) 34%, rgba(39, 50, 73, 0.22) 78%, rgba(9, 13, 23, 0.5) 100%)',
            border: '1px solid rgba(186, 202, 223, 0.16)',
            boxShadow:
              '0 12px 22px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -10px 16px rgba(10, 15, 28, 0.22)',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 10,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.2), rgba(255,255,255,0.01) 72%)',
            }}
          />
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
