import { useEffect, useRef } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";

import { createNetwork, BASE_TILT_X, BASE_ROTATION_Y } from "./network";

/*
  WebGL renderer for the hero network. Loaded lazily (see HeroNetwork) so
  three.js never blocks the hero text or the rest of the page.

  Motion budget, deliberately small:
  - the globe turns ~1 revolution every 100s
  - pointer moves tilt it by at most ~0.2 rad, eased
  - four pulses walk the edges like messages propagating between peers
  The loop only runs while the canvas is on screen and the tab is visible;
  with prefers-reduced-motion it renders a single still frame.
*/

const IDLE_SPEED = 0.06;
const PULSE_COUNT = 4;
const PULSE_SECONDS = 1.8;
const POINTER_TILT = 0.2;

const readToken = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fallback;

function NetworkCanvas({ reducedMotion, onReady, onError }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    let renderer;

    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch (error) {
      onError?.(error);
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(0, 0, 4.5);

    // Fog toward the page background gives depth: far-side nodes and edges
    // recede instead of cluttering the front.
    scene.fog = new Fog(0xffffff, 3.6, 6.3);

    const { nodes, edges, adjacency } = createNetwork();

    const globe = new Group();
    globe.rotation.set(BASE_TILT_X, BASE_ROTATION_Y, 0);
    scene.add(globe);

    // --- Edges ---
    const edgePositions = [];

    edges.forEach(([a, b]) => {
      edgePositions.push(nodes[a].x, nodes[a].y, nodes[a].z);
      edgePositions.push(nodes[b].x, nodes[b].y, nodes[b].z);
    });

    const edgeGeometry = new BufferGeometry();
    edgeGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(edgePositions, 3),
    );

    const edgeMaterial = new LineBasicMaterial({
      transparent: true,
      opacity: 0.2,
    });

    globe.add(new LineSegments(edgeGeometry, edgeMaterial));

    // --- Nodes (plain points) ---
    const pointNodes = nodes.filter((node) => !node.isBlock);
    const nodeGeometry = new IcosahedronGeometry(0.021, 1);
    const nodeMaterial = new MeshBasicMaterial({
      transparent: true,
      opacity: 0.7,
    });
    const nodeMesh = new InstancedMesh(
      nodeGeometry,
      nodeMaterial,
      pointNodes.length,
    );

    const dummy = new Object3D();

    pointNodes.forEach((node, i) => {
      dummy.position.set(node.x, node.y, node.z);
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(i, dummy.matrix);
    });

    globe.add(nodeMesh);

    // --- Blocks (wireframe cubes) ---
    const blockGeometry = new EdgesGeometry(new BoxGeometry(0.075, 0.075, 0.075));
    const blockMaterial = new LineBasicMaterial({
      transparent: true,
      opacity: 0.75,
    });
    const blocks = nodes
      .filter((node) => node.isBlock)
      .map((node, i) => {
        const block = new LineSegments(blockGeometry, blockMaterial);
        block.position.set(node.x, node.y, node.z);
        block.rotation.set(i * 0.7, i * 1.1, 0);
        globe.add(block);
        return block;
      });

    // --- Pulses travelling along edges ---
    const pulseGeometry = new IcosahedronGeometry(0.03, 1);
    const pulseMaterial = new MeshBasicMaterial();
    const pulses = Array.from({ length: PULSE_COUNT }, (_, i) => {
      const from = (i * 23) % nodes.length;
      const mesh = new Mesh(pulseGeometry, pulseMaterial);
      mesh.visible = !reducedMotion;
      globe.add(mesh);

      return {
        mesh,
        from,
        to: adjacency[from][0],
        progress: i / PULSE_COUNT,
      };
    });

    // --- Theme ---
    const applyTheme = () => {
      const primary = new Color(readToken("--color-primary", "#0a0a0a"));
      const background = new Color(readToken("--color-background", "#ffffff"));

      edgeMaterial.color.copy(primary);
      nodeMaterial.color.copy(primary);
      blockMaterial.color.copy(primary);
      pulseMaterial.color.copy(primary);
      scene.fog.color.copy(background);
    };

    applyTheme();

    // --- Sizing ---
    const resize = () => {
      const { clientWidth, clientHeight } = container;

      if (!clientWidth || !clientHeight) return;

      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    resize();

    // --- Pointer (desktop only) ---
    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const handlePointerMove = (event) => {
      pointer.x = event.clientX / window.innerWidth - 0.5;
      pointer.y = event.clientY / window.innerHeight - 0.5;
    };

    if (!reducedMotion && finePointer.matches) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
    }

    // --- Loop ---
    const timer = new Timer();
    let spin = 0;
    let firstFrame = true;

    const advancePulses = (delta) => {
      pulses.forEach((pulse) => {
        pulse.progress += delta / PULSE_SECONDS;

        if (pulse.progress >= 1) {
          pulse.progress = 0;
          const next = adjacency[pulse.to].filter((n) => n !== pulse.from);
          pulse.from = pulse.to;
          pulse.to = next[Math.floor(Math.random() * next.length)] ?? pulse.from;
        }

        const a = nodes[pulse.from];
        const b = nodes[pulse.to];
        const t = pulse.progress;

        pulse.mesh.position.set(
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t,
          a.z + (b.z - a.z) * t,
        );
      });
    };

    const render = () => {
      renderer.render(scene, camera);

      if (firstFrame) {
        firstFrame = false;
        onReady?.();
      }
    };

    const tick = (timestamp) => {
      timer.update(timestamp);
      const delta = Math.min(timer.getDelta(), 0.05);

      spin += delta * IDLE_SPEED;

      tilt.x += (pointer.y * POINTER_TILT - tilt.x) * 0.04;
      tilt.y += (pointer.x * POINTER_TILT - tilt.y) * 0.04;

      globe.rotation.x = BASE_TILT_X + tilt.x;
      globe.rotation.y = BASE_ROTATION_Y + spin + tilt.y;

      blocks.forEach((block) => {
        block.rotation.y += delta * 0.25;
      });

      advancePulses(delta);
      render();
    };

    let inView = true;
    let running = false;

    const updateLoop = () => {
      const shouldRun = !reducedMotion && inView && !document.hidden;

      if (shouldRun && !running) {
        timer.reset();
        renderer.setAnimationLoop(tick);
        running = true;
      } else if (!shouldRun && running) {
        renderer.setAnimationLoop(null);
        running = false;
      }
    };

    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateLoop();
    });
    intersection.observe(container);

    document.addEventListener("visibilitychange", updateLoop);

    // Still frames (reduced motion / paused) need an explicit redraw after
    // a resize or theme switch.
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) render();
    });
    resizeObserver.observe(container);

    const themeObserver = new MutationObserver(() => {
      applyTheme();
      if (!running) render();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const handleContextLost = (event) => {
      event.preventDefault();
      onError?.(new Error("WebGL context lost"));
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);

    advancePulses(0);
    render();
    updateLoop();

    return () => {
      renderer.setAnimationLoop(null);
      intersection.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", updateLoop);
      window.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("webglcontextlost", handleContextLost);

      [edgeGeometry, nodeGeometry, blockGeometry, pulseGeometry].forEach((g) =>
        g.dispose(),
      );
      [edgeMaterial, nodeMaterial, blockMaterial, pulseMaterial].forEach((m) =>
        m.dispose(),
      );
      nodeMesh.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [reducedMotion, onReady, onError]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export default NetworkCanvas;
