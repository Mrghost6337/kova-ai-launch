import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { Color, Mesh, ShaderMaterial, type IUniform } from "three";
import { getPerf } from "@/lib/perf";
import "./Silk.css";

type NormalizedRGB = [number, number, number];

type UniformValue<T = number | Color> = {
  value: T;
};

type SilkUniforms = {
  uSpeed: UniformValue<number>;
  uScale: UniformValue<number>;
  uNoiseIntensity: UniformValue<number>;
  uColor: UniformValue<Color>;
  uRotation: UniformValue<number>;
  uTime: UniformValue<number>;
  [uniform: string]: IUniform;
};

const hexToNormalizedRGB = (hex: string): NormalizedRGB => {
  const clean = hex.replace("#", "");
  const red = parseInt(clean.slice(0, 2), 16) / 255;
  const green = parseInt(clean.slice(2, 4), 16) / 255;
  const blue = parseInt(clean.slice(4, 6), 16) / 255;
  return [red, green, blue];
};

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;
const float e = 2.71828182845904523536;
float noise(vec2 texCoord) {
  float G = e;
  vec2 r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}
vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c, -s, s, c);
  return rot * uv;
}
void main() {
  float rnd = noise(gl_FragCoord.xy);
  vec2 uv = rotateUvs(vUv * uScale, uRotation);
  vec2 tex = uv * uScale;
  float tOffset = uSpeed * uTime;
  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);
  float pattern = 0.6 +
    0.4 * sin(5.0 * (tex.x + tex.y +
    cos(3.0 * tex.x + 5.0 * tex.y) +
    0.02 * tOffset) +
    sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));
  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

interface SilkPlaneProps {
  speed: number;
  scale: number;
  color: string;
  noiseIntensity: number;
  rotation: number;
}

const SilkPlane = function SilkPlane({
  speed,
  scale,
  color,
  noiseIntensity,
  rotation,
}: SilkPlaneProps) {
  const meshRef = useRef<Mesh>(null);
  const { viewport, invalidate } = useThree();
  const uniforms = useMemo<SilkUniforms>(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      uRotation: { value: rotation },
      uTime: { value: 0 },
    }),
    [color, noiseIntensity, rotation, scale, speed],
  );

  useLayoutEffect(() => {
    meshRef.current?.scale.set(viewport.width, viewport.height, 1);
    // Draw at least one frame, even when the loop is paused (static mode).
    invalidate();
  }, [viewport, invalidate]);

  useFrame((_state: RootState, delta: number) => {
    const material = meshRef.current?.material;
    if (material instanceof ShaderMaterial) {
      // Three.js uniforms are intentionally updated outside React on every frame.
      // eslint-disable-next-line react-hooks/immutability
      material.uniforms.uTime.value += 0.1 * delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
};

SilkPlane.displayName = "SilkPlane";

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const Silk: React.FC<SilkProps> = ({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const perf = getPerf();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isActive = () => {
      if (document.hidden) return false;
      const rect = el.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };

    const onStateChange = () => {
      setInView((previous) => {
        const next = isActive();
        return next === previous ? previous : next;
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!document.hidden) setInView(entry.isIntersecting);
      },
      { rootMargin: "100px 0px" },
    );
    io.observe(el);

    document.addEventListener("visibilitychange", onStateChange);
    window.addEventListener("scroll", onStateChange, { passive: true });

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onStateChange);
      window.removeEventListener("scroll", onStateChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="silk-container" aria-hidden="true">
      <Canvas
        dpr={[1, perf.dprCap]}
        frameloop={inView ? "always" : "never"}
      >
        <SilkPlane
          speed={speed}
          scale={scale}
          color={color}
          noiseIntensity={noiseIntensity}
          rotation={rotation}
        />
      </Canvas>
    </div>
  );
};

export default Silk;
