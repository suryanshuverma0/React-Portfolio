import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

import { blocks, randoms, ring, sphere, wave } from "./shapes";

/*
  Scroll-driven particle field. One point cloud carries four shapes as
  attributes; the vertex shader blends between neighbouring shapes using
  the scroll progress, with a per-point offset so the morph ripples
  through the cloud instead of snapping. JS only updates a handful of
  uniforms per frame.

  Anchors map page sections to shapes:
    #home → sphere, #research → blocks, #projects → wave, #contact → ring
*/

const ANCHORS = ["home", "research", "projects", "contact"];

// Where the cloud sits for each anchor (desktop). Hero keeps it right of
// the name; mobile centres everything.
const OFFSETS = [
  [2.3, 0.1, 0],
  [0, 0.15, 0],
  [0, -0.2, 0],
  [2.1, 0, 0],
];

// Full strength in the hero, where it frames the portrait; quieter behind
// the text-heavy sections so it never competes with reading.
const OPACITY = [0.95, 0.3, 0.26, 0.45];

const vertexShader = /* glsl */ `
  attribute vec3 aBlocks;
  attribute vec3 aWave;
  attribute vec3 aRing;
  attribute float aRandom;

  uniform float uProgress;
  uniform float uTime;
  uniform float uIntro;
  uniform float uSize;
  uniform float uPixelRatio;

  varying float vAlpha;

  void main() {
    // Stagger each point's morph for an organic ripple — only mid-transition,
    // so every shape is crisp once its section is reached.
    float ripple = sin(3.14159 * fract(uProgress)) * 0.5;
    float p = clamp(uProgress + (aRandom - 0.5) * ripple, 0.0, 3.0);
    float seg = floor(min(p, 2.999));
    float f = smoothstep(0.0, 1.0, p - seg);

    vec3 from = seg < 0.5 ? position : (seg < 1.5 ? aBlocks : aWave);
    vec3 to = seg < 0.5 ? aBlocks : (seg < 1.5 ? aWave : aRing);
    vec3 pos = mix(from, to, f);

    // Living surface while the wave is on screen.
    float waveWeight = 1.0 - min(abs(p - 2.0), 1.0);
    pos.y += sin(pos.x * 1.1 + uTime * 0.9) * cos(pos.z * 0.9 + uTime * 0.6) * 0.28 * waveWeight;

    // Gentle per-point drift so nothing ever sits perfectly still.
    float phase = aRandom * 6.2831;
    pos += vec3(sin(uTime * 0.4 + phase), cos(uTime * 0.35 + phase), sin(uTime * 0.3 + phase * 1.3)) * 0.025;

    // Intro: the cloud condenses out of a wider, faint scatter.
    float intro = 1.0 - pow(1.0 - uIntro, 3.0);
    pos *= mix(1.8 + aRandom, 1.0, intro);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    gl_PointSize = uSize * uPixelRatio * (0.6 + aRandom * 0.9) * (10.0 / -mvPosition.z);

    // Far points fade, near points stay crisp.
    float depth = smoothstep(-15.0, -6.0, mvPosition.z);
    vAlpha = (0.25 + 0.75 * aRandom) * mix(0.35, 1.0, depth) * intro;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    float alpha = smoothstep(0.5, 0.05, d) * vAlpha * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const readInk = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() || "#0a0a0a";

const isDark = () => document.documentElement.classList.contains("dark");

const lerp = (a, b, t) => a + (b - a) * t;

export function createParticleScene(canvas) {
  const mobile = window.innerWidth < 768;
  const count = mobile ? 2600 : 5600;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(sphere(count), 3));
  geometry.setAttribute("aBlocks", new BufferAttribute(blocks(count), 3));
  geometry.setAttribute("aWave", new BufferAttribute(wave(count), 3));
  geometry.setAttribute("aRing", new BufferAttribute(ring(count), 3));
  geometry.setAttribute("aRandom", new BufferAttribute(randoms(count), 1));

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uIntro: { value: 0 },
      uSize: { value: mobile ? 2.2 : 2.6 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uColor: { value: new Color(readInk()) },
      uOpacity: { value: 0 },
    },
  });

  // Light points add up to glow on black; on white they need plain alpha.
  const applyTheme = () => {
    material.uniforms.uColor.value.set(readInk());
    material.blending = isDark() ? AdditiveBlending : NormalBlending;
    material.needsUpdate = true;
  };

  applyTheme();

  const points = new Points(geometry, material);
  // On phones the cloud sits behind the copy — smaller and fainter there.
  points.scale.setScalar(mobile ? 0.8 : 1);
  scene.add(points);

  /* ---------- scroll → progress ---------- */

  // Scroll offset at which each shape is fully formed: when its section's
  // top reaches the upper third of the screen. The hero is pinned to 0 so
  // the page opens on a complete sphere.
  let anchorTops = [];

  const measure = () => {
    anchorTops = ANCHORS.map((id, index) => {
      const el = document.getElementById(id);
      if (!el) return null;
      if (index === 0) return 0;
      return Math.max(el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35, 1);
    });
  };

  // Piecewise-linear position between anchors.
  const scrollProgress = () => {
    const y = window.scrollY;
    const tops = anchorTops;

    if (tops.some((top) => top === null)) return 0;

    if (y <= 0) return 0;

    for (let i = 0; i < tops.length - 1; i += 1) {
      if (y < tops[i + 1]) return i + (y - tops[i]) / Math.max(tops[i + 1] - tops[i], 1);
    }

    return tops.length - 1;
  };

  /* ---------- pointer / touch parallax ---------- */

  const pointer = { x: 0, y: 0 };

  const onPointer = (event) => {
    const source = event.touches ? event.touches[0] : event;
    if (!source) return;
    pointer.x = (source.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (source.clientY / window.innerHeight) * 2 - 1;
  };

  /* ---------- sizing ---------- */

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    measure();
  };

  resize();

  // Section heights change as API content arrives — re-measure then.
  const bodyObserver = new ResizeObserver(measure);
  bodyObserver.observe(document.body);

  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("touchmove", onPointer, { passive: true });

  /* ---------- loop ---------- */

  let frame = 0;
  let running = true;
  let last = performance.now();
  let elapsed = 0;
  let progress = scrollProgress();
  let rotationY = 0;

  const tick = (now) => {
    if (!running) return;

    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += delta;

    const u = material.uniforms;

    progress = lerp(progress, scrollProgress(), 0.07);
    u.uProgress.value = progress;
    u.uTime.value = elapsed;
    u.uIntro.value = Math.min(u.uIntro.value + delta / 2.2, 1);

    // Blend placement and opacity between the two nearest anchors.
    const i = Math.min(Math.floor(progress), OFFSETS.length - 2);
    const t = progress - i;
    const from = mobile ? [0, 0, 0] : OFFSETS[i];
    const to = mobile ? [0, 0, 0] : OFFSETS[i + 1];

    points.position.set(lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t));
    u.uOpacity.value = lerp(u.uOpacity.value, lerp(OPACITY[i], OPACITY[i + 1], t) * (mobile ? 0.4 : 1), 0.05);

    // Slow spin, eased toward the pointer for a sense of depth.
    rotationY += delta * 0.06;
    points.rotation.y = rotationY + pointer.x * 0.25;
    points.rotation.x = lerp(points.rotation.x, 0.18 + pointer.y * 0.15, 0.04);

    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  // No point drawing for a hidden tab.
  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(frame);
    } else if (!running) {
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    running = false;
    cancelAnimationFrame(frame);
    bodyObserver.disconnect();
    themeObserver.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("touchmove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}
