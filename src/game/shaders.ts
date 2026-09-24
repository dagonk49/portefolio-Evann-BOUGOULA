/**
 * Shaders GLSL du lab : dalles d'interaction, flux de données le long des
 * câbles et particules des anomalies. Tous les mouvements sont lents ;
 * `uMotion` = 0 les fige (réduction des mouvements).
 */
import * as THREE from "three";

export function padMaterial(color: THREE.ColorRepresentation): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uMotion: { value: 1 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uActive;
      uniform float uMotion;
      uniform vec3 uColor;
      varying vec2 vUv;
      float line(float d, float w) { return 1.0 - smoothstep(0.0, w, abs(d)); }
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;
        float t = uTime * uMotion;
        // Losange néon et cercle extérieur.
        float diamond = line(abs(p.x) + abs(p.y) - 0.72, 0.035);
        float ring = line(r - 0.95, 0.03);
        // Cercles qui pulsent vers l'extérieur quand la dalle est active.
        float pulse = line(fract(r * 1.4 - t * 0.45) - 0.5, 0.05) * smoothstep(1.0, 0.25, r);
        float fill = 0.08 + 0.1 * uActive;
        float a = fill + ring * 0.85 + diamond * (0.55 + 0.4 * uActive) + pulse * 0.45 * uActive;
        float breathe = 0.82 + 0.18 * sin(t * 2.2);
        gl_FragColor = vec4(uColor * (1.0 + uActive * 0.6), a * mix(0.6, 1.0, uActive) * breathe);
      }
    `,
  });
}

export function flowMaterial(color: THREE.ColorRepresentation, repeat = 6): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uRepeat: { value: repeat },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uMotion;
      uniform float uRepeat;
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        // Paquets qui avancent le long du câble (u = abscisse curviligne).
        float d = fract(vUv.x * uRepeat - uTime * 0.6 * uMotion);
        float packet = smoothstep(0.0, 0.06, d) * (1.0 - smoothstep(0.18, 0.26, d));
        float steady = 0.18 * (1.0 - uMotion);
        gl_FragColor = vec4(uColor, (packet * uMotion + steady) * uOpacity);
      }
    `,
  });
}

export function particleMaterial(color: THREE.ColorRepresentation): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uGather: { value: 0 },
      uIntensity: { value: 1 },
      uColor: { value: new THREE.Color(color) },
      uScale: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uMotion;
      uniform float uGather;
      uniform float uScale;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * uMotion * (0.25 + aSeed * 0.3);
        // Dérive lente et bouclée vers le haut, localisée autour de l'anomalie.
        p.y = mod(p.y + t * 0.35 + 0.9, 1.8) - 0.9;
        p.x += sin(t * 1.3 + aSeed * 6.28) * 0.05;
        p.z += cos(t * 1.1 + aSeed * 6.28) * 0.05;
        p *= mix(1.0, 0.08, uGather);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (3.0 + aSeed * 4.0) * uScale * (18.0 / -mv.z);
        vAlpha = 1.0 - smoothstep(0.5, 0.9, abs(p.y));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float soft = 1.0 - smoothstep(0.1, 0.5, d);
        gl_FragColor = vec4(uColor, soft * vAlpha * 0.8 * uIntensity);
      }
    `,
  });
}
