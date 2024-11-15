precision highp float;
precision highp sampler3D;

varying vec2 vUV;


uniform sampler3D srcMip;

uniform int layerNum;

void main(void) {
  ivec3 Coords = ivec3(2) * ivec3(gl_FragCoord.x, gl_FragCoord.y, layerNum);

  uint tex =
      uint(texelFetch(srcMip, Coords + ivec3(0, 0, 0), 0).x > 0.0f ? 1u : 0u)
          << 0u |
      uint(texelFetch(srcMip, Coords + ivec3(1, 0, 0), 0).x > 0.0f ? 1u : 0u)
          << 1u |
      uint(texelFetch(srcMip, Coords + ivec3(0, 1, 0), 0).x > 0.0f ? 1u : 0u)
          << 2u |
      uint(texelFetch(srcMip, Coords + ivec3(1, 1, 0), 0).x > 0.0f ? 1u : 0u)
          << 3u |
      uint(texelFetch(srcMip, Coords + ivec3(0, 0, 1), 0).x > 0.0f ? 1u : 0u)
          << 4u |
      uint(texelFetch(srcMip, Coords + ivec3(1, 0, 1), 0).x > 0.0f ? 1u : 0u)
          << 5u |
      uint(texelFetch(srcMip, Coords + ivec3(0, 1, 1), 0).x > 0.0f ? 1u : 0u)
          << 6u |
      uint(texelFetch(srcMip, Coords + ivec3(1, 1, 1), 0).x > 0.0f ? 1u : 0u)
          << 7u;

  glFragColor.rgb = vec3(float(tex) / 255.0f, 0.0f, 0.0f);
  glFragColor.a = 1.0;
}