import { useState, useRef, useEffect, type RefObject } from 'react';
import type { TransformState } from '../canvas/types.js';

interface UseCanvasInteractionProps {
  containerRef: RefObject<HTMLElement | null>;
  transform: TransformState;
  onChange: (newTransform: TransformState) => void;
  disabled?: boolean;
}

export function useCanvasInteraction({
  containerRef,
  transform,
  onChange,
  disabled = false,
}: UseCanvasInteractionProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  // Active pointers tracker for touch / mouse
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(transform.scale);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const getPinchDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return Math.hypot(dx, dy);
    };

    const handlePointerDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      setIsInteracting(true);

      const pointers = Array.from(activePointersRef.current.values());

      if (pointers.length === 1 && pointers[0]) {
        lastPanPointRef.current = { x: pointers[0].x, y: pointers[0].y };
      } else if (pointers.length === 2 && pointers[0] && pointers[1]) {
        initialPinchDistRef.current = getPinchDistance(pointers[0], pointers[1]);
        initialScaleRef.current = transform.scale;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!activePointersRef.current.has(e.pointerId)) return;

      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pointers = Array.from(activePointersRef.current.values());

      if (pointers.length === 1 && lastPanPointRef.current && pointers[0]) {
        // 1-finger / mouse drag -> Pan
        const dx = pointers[0].x - lastPanPointRef.current.x;
        const dy = pointers[0].y - lastPanPointRef.current.y;

        // Account for display element scaling vs 1080px internal resolution
        const rect = el.getBoundingClientRect();
        const displayScale = 1080 / rect.width;

        onChange({
          ...transform,
          x: transform.x + dx * displayScale,
          y: transform.y + dy * displayScale,
        });

        lastPanPointRef.current = { x: pointers[0].x, y: pointers[0].y };
      } else if (
        pointers.length === 2 &&
        initialPinchDistRef.current !== null &&
        pointers[0] &&
        pointers[1]
      ) {
        // 2-finger pinch -> Zoom
        const currentDist = getPinchDistance(pointers[0], pointers[1]);
        const scaleFactor = currentDist / initialPinchDistRef.current;
        const newScale = Math.max(0.1, Math.min(10, initialScaleRef.current * scaleFactor));

        onChange({
          ...transform,
          scale: newScale,
        });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      activePointersRef.current.delete(e.pointerId);

      const pointers = Array.from(activePointersRef.current.values());
      if (pointers.length === 1 && pointers[0]) {
        lastPanPointRef.current = { x: pointers[0].x, y: pointers[0].y };
      } else {
        lastPanPointRef.current = null;
        initialPinchDistRef.current = null;
      }

      if (pointers.length === 0) {
        setIsInteracting(false);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newScale = Math.max(0.1, Math.min(10, transform.scale * zoomFactor));

      onChange({
        ...transform,
        scale: newScale,
      });
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, disabled, transform, onChange]);

  return { isInteracting };
}
