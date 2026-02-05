 import { useState, useCallback, useRef, useEffect } from "react";
 
 interface ZoomPanState {
   scale: number;
   translateX: number;
   translateY: number;
 }
 
 interface UseZoomPanOptions {
   minScale?: number;
   maxScale?: number;
   onZoomChange?: (scale: number) => void;
 }
 
 export function useZoomPan(options: UseZoomPanOptions = {}) {
   const { minScale = 1, maxScale = 3, onZoomChange } = options;
   
   const [state, setState] = useState<ZoomPanState>({
     scale: 1,
     translateX: 0,
     translateY: 0,
   });
   
   const containerRef = useRef<HTMLDivElement>(null);
   const isPanning = useRef(false);
   const startPos = useRef({ x: 0, y: 0 });
   const startTranslate = useRef({ x: 0, y: 0 });
 
   const constrainTranslate = useCallback((x: number, y: number, scale: number) => {
     if (!containerRef.current || scale <= 1) return { x: 0, y: 0 };
     
     const rect = containerRef.current.getBoundingClientRect();
     const maxX = (rect.width * (scale - 1)) / 2;
     const maxY = (rect.height * (scale - 1)) / 2;
     
     return {
       x: Math.max(-maxX, Math.min(maxX, x)),
       y: Math.max(-maxY, Math.min(maxY, y)),
     };
   }, []);
 
   const handleWheel = useCallback((e: WheelEvent) => {
     e.preventDefault();
     const delta = e.deltaY > 0 ? -0.2 : 0.2;
     
     setState((prev) => {
       const newScale = Math.max(minScale, Math.min(maxScale, prev.scale + delta));
       const constrained = constrainTranslate(prev.translateX, prev.translateY, newScale);
       onZoomChange?.(newScale);
       return { scale: newScale, translateX: constrained.x, translateY: constrained.y };
     });
   }, [minScale, maxScale, constrainTranslate, onZoomChange]);
 
   const handleDoubleClick = useCallback((e: React.MouseEvent) => {
     if (!containerRef.current) return;
     
     const rect = containerRef.current.getBoundingClientRect();
     const clickX = e.clientX - rect.left - rect.width / 2;
     const clickY = e.clientY - rect.top - rect.height / 2;
     
     setState((prev) => {
       if (prev.scale >= maxScale) {
         onZoomChange?.(1);
         return { scale: 1, translateX: 0, translateY: 0 };
       }
       const newScale = Math.min(maxScale, prev.scale + 1);
       const constrained = constrainTranslate(-clickX * 0.5, -clickY * 0.5, newScale);
       onZoomChange?.(newScale);
       return { scale: newScale, translateX: constrained.x, translateY: constrained.y };
     });
   }, [maxScale, constrainTranslate, onZoomChange]);
 
   const handleMouseDown = useCallback((e: React.MouseEvent) => {
     if (state.scale <= 1) return;
     isPanning.current = true;
     startPos.current = { x: e.clientX, y: e.clientY };
     startTranslate.current = { x: state.translateX, y: state.translateY };
   }, [state.scale, state.translateX, state.translateY]);
 
   const handleMouseMove = useCallback((e: React.MouseEvent) => {
     if (!isPanning.current) return;
     
     const deltaX = e.clientX - startPos.current.x;
     const deltaY = e.clientY - startPos.current.y;
     
     const newX = startTranslate.current.x + deltaX;
     const newY = startTranslate.current.y + deltaY;
     const constrained = constrainTranslate(newX, newY, state.scale);
     
     setState((prev) => ({ ...prev, translateX: constrained.x, translateY: constrained.y }));
   }, [state.scale, constrainTranslate]);
 
   const handleMouseUp = useCallback(() => {
     isPanning.current = false;
   }, []);
 
   const resetZoom = useCallback(() => {
     setState({ scale: 1, translateX: 0, translateY: 0 });
     onZoomChange?.(1);
   }, [onZoomChange]);
 
   const panTo = useCallback((x: number, y: number) => {
     const constrained = constrainTranslate(x, y, state.scale);
     setState((prev) => ({ ...prev, translateX: constrained.x, translateY: constrained.y }));
   }, [state.scale, constrainTranslate]);
 
   useEffect(() => {
     const container = containerRef.current;
     if (!container) return;
     
     container.addEventListener("wheel", handleWheel, { passive: false });
     return () => container.removeEventListener("wheel", handleWheel);
   }, [handleWheel]);
 
   return {
     containerRef,
     scale: state.scale,
     translateX: state.translateX,
     translateY: state.translateY,
     handleDoubleClick,
     handleMouseDown,
     handleMouseMove,
     handleMouseUp,
     resetZoom,
     panTo,
     isZoomed: state.scale > 1,
   };
 }