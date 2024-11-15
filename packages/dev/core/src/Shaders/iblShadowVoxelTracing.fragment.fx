precision highp sampler2D;
precision highp sampler3D;
#define PI 3.1415927
varying vec2 vUV;

#define DISABLE_UNIFORMITY_ANALYSIS

uniform sampler2D depthSampler;
uniform sampler2D worldNormalSampler;
uniform sampler2D blueNoiseSampler;
// Importance sampling
uniform sampler2D icdfxSampler;
uniform sampler2D icdfySampler;
uniform sampler3D voxelGridSampler;

// shadow parameters: int nbDirs, int frameId, unused, float envRot
uniform vec4 shadowParameters;

#define SHADOWdirs shadowParameters.x
#define SHADOWframe shadowParameters.y
#define SHADOWenvRot shadowParameters.w

// voxel tracing bias parameters (normal bias, direction bias, unused, max
// mip count)
uniform vec4 voxelBiasParameters;

#define highestMipLevel voxelBiasParameters.z

// screen space shadow parameters
uniform vec4 sssParameters;

#define SSSsamples sssParameters.x
#define SSSstride sssParameters.y
#define SSSmaxDistance sssParameters.z
#define SSSthickness sssParameters.w

uniform vec4 shadowOpacity;

// Uniform matrices
uniform mat4 projMtx;
uniform mat4 viewMtx;
uniform mat4 invProjMtx;
uniform mat4 invViewMtx;
uniform mat4 wsNormalizationMtx;
uniform mat4 invVPMtx;

#define PI 3.1415927
#define GOLD 0.618034

struct AABB3f {
  vec3 m_min;
  vec3 m_max;
};

struct Ray {
  vec3 orig;
  vec3 dir;
  vec3 dir_rcp;
  float t_min;
  float t_max;
};

Ray make_ray(const vec3 origin, const vec3 direction, const float tmin,
             const float tmax) {
  Ray ray;
  ray.orig = origin;
  ray.dir = direction;
  ray.dir_rcp = 1.0f / direction;
  ray.t_min = tmin;
  ray.t_max = tmax;
  return ray;
}

bool ray_box_intersection(const in AABB3f aabb, const in Ray ray,
                          out float distance_near, out float distance_far) {
  vec3 tbot = ray.dir_rcp * (aabb.m_min - ray.orig);
  vec3 ttop = ray.dir_rcp * (aabb.m_max - ray.orig);
  vec3 tmin = min(ttop, tbot);
  vec3 tmax = max(ttop, tbot);
  distance_near = max(ray.t_min, max(tmin.x, max(tmin.y, tmin.z)));
  distance_far = min(ray.t_max, min(tmax.x, min(tmax.y, tmax.z)));
  return distance_near <= distance_far;
}

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
struct VoxelMarchDiagnosticInfo {
  float heat;
  ivec3 voxel_intersect_coords;
};
#endif

uint hash(uint i) {
  i ^= i >> 16u;
  i *= 0x7FEB352Du;
  i ^= i >> 15u;
  i *= 0x846CA68Bu;
  i ^= i >> 16u;
  return i;
}

float uint2float(uint i) {
  return uintBitsToFloat(0x3F800000u | (i >> 9u)) - 1.0;
}

vec3 uv_to_normal(vec2 uv) {
  vec3 N;

  vec2 uvRange = uv;
  float theta = uvRange.x * 2.0 * PI;
  float phi = uvRange.y * PI;

  N.x = cos(theta) * sin(phi);
  N.z = sin(theta) * sin(phi);
  N.y = cos(phi);
  return N;
}

vec2 plasticSequence(const uint rstate) {
  return vec2(uint2float(rstate * 3242174889u),
              uint2float(rstate * 2447445414u));
}

float goldenSequence(const uint rstate) {
  return uint2float(rstate * 2654435769u);
}

float distanceSquared(vec2 a, vec2 b) {
  vec2 diff = a - b;
  return dot(diff, diff);
}

void genTB(const vec3 N, out vec3 T, out vec3 B) {
  float s = N.z < 0.0 ? -1.0 : 1.0;
  float a = -1.0 / (s + N.z);
  float b = N.x * N.y * a;
  T = vec3(1.0 + s * N.x * N.x * a, s * b, -s * N.x);
  B = vec3(b, s + N.y * N.y * a, -N.y);
}

int stack[24];                           // Swapped dimension
#define PUSH(i) stack[stackLevel++] = i; // order, small
#define POP() stack[--stackLevel]        // perf improvement

#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
bool anyHitVoxels(const Ray ray_vs,
                  out VoxelMarchDiagnosticInfo voxel_march_diagnostic_info) {
#else
bool anyHitVoxels(const Ray ray_vs) {
#endif

  vec3 invD = ray_vs.dir_rcp;
  vec3 D = ray_vs.dir;
  vec3 O = ray_vs.orig;
  ivec3 negD = ivec3(lessThan(D, vec3(0, 0, 0)));
  int voxel0 = negD.x | negD.y << 1 | negD.z << 2;
  vec3 t0 = -O * invD, t1 = (vec3(1.0) - O) * invD;
  int maxLod = int(highestMipLevel);
  int stackLevel = 0;
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  uint steps = 0u;
#endif

  PUSH(maxLod << 24);
  while (stackLevel > 0) {
    int elem = POP();
    ivec4 Coords =
        ivec4(elem & 0xFF, elem >> 8 & 0xFF, elem >> 16 & 0xFF, elem >> 24);

    if (Coords.w == 0) {
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
      voxel_march_diagnostic_info.heat = float(steps) / 24.0;
      //   voxel_march_diagnostic_info.voxel_intersect_coords = node_coords;
#endif
      return true;
    }

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
    ++steps;
#endif

    float invRes = exp2(float(Coords.w - maxLod));
    vec3 bbmin = invRes * vec3(Coords.xyz + negD);
    vec3 bbmax = invRes * vec3(Coords.xyz - negD + ivec3(1));
    vec3 mint = mix(t0, t1, bbmin);
    vec3 maxt = mix(t0, t1, bbmax);
    vec3 midt = 0.5 * (mint + maxt);
    mint.x = max(0.0, mint.x);
    midt.x = max(0.0, midt.x);

    ////// NEW ////// With the conversion to a R8 voxel texture, the two
    /// following lines have been swapped
    int nodeMask = int(
        round(texelFetch(voxelGridSampler, Coords.xyz, Coords.w).x * 255.0));
    Coords.w--;
    int voxelBit = voxel0;
    Coords.xyz = (Coords.xyz << 1) + negD;

    int packedCoords =
        Coords.x | Coords.y << 8 | Coords.z << 16 | Coords.w << 24;
    if (max(mint.x, max(mint.y, mint.z)) < min(midt.x, min(midt.y, midt.z)) &&
        (1 << voxelBit & nodeMask) != 0)
      PUSH(packedCoords);
    voxelBit ^= 0x1;
    packedCoords ^= 0x00001;
    if (max(midt.x, max(mint.y, mint.z)) < min(maxt.x, min(midt.y, midt.z)) &&
        (1 << voxelBit & nodeMask) != 0)
      PUSH(packedCoords);
    voxelBit ^= 0x2;
    packedCoords ^= 0x00100;
    if (max(midt.x, max(midt.y, mint.z)) < min(maxt.x, min(maxt.y, midt.z)) &&
        (1 << voxelBit & nodeMask) != 0)
      PUSH(packedCoords);
    voxelBit ^= 0x1;
    packedCoords ^= 0x00001;
    if (max(mint.x, max(midt.y, mint.z)) < min(midt.x, min(maxt.y, midt.z)) &&
        (1 << voxelBit & nodeMask) != 0)
      PUSH(packedCoords);
    voxelBit ^= 0x4;
    packedCoords ^= 0x10000;
    if (max(mint.x, max(midt.y, midt.z)) < min(midt.x, min(maxt.y, maxt.z)) &&
        (1 << voxelBit & nodeMask) != 0)
      PUSH(packedCoords);
    voxelBit ^= 0x1;
    packedCoords ^= 0x00001;
    if (max(midt.x, max(midt.y, midt.z)) < min(maxt.x, min(maxt.y, maxt.z)) &&
        (1 << voxelBit & nodeMask) != 0)
      PUSH(packedCoords);
    voxelBit ^= 0x2;
    packedCoords ^= 0x00100;
    if (max(midt.x, max(mint.y, midt.z)) < min(maxt.x, min(midt.y, maxt.z)) &&
        (1 << voxelBit & nodeMask) != 0)
      PUSH(packedCoords);
    voxelBit ^= 0x1;
    packedCoords ^= 0x00001;
    if (max(mint.x, max(mint.y, midt.z)) < min(midt.x, min(midt.y, maxt.z)) &&
        (1 << voxelBit & nodeMask) != 0)
      PUSH(packedCoords);
  }

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  voxel_march_diagnostic_info.heat = float(steps) / 24.0;
#endif

  return false;
}

float linearizeDepth(float depth, float near, float far) {
    return (near * far) / (far - depth * (far - near));
}

float screenSpaceShadow(vec3 csOrigin, vec3 csDirection, vec2 csZBufferSize,
                        float nearPlaneZ, float farPlaneZ, float noise) {
  // Camera space Z direction
  #ifdef RIGHT_HANDED
    float csZDir = -1.0;
  #else // LEFT_HANDED
    float csZDir = 1.0;
  #endif
  // Max sample count per ray
  float ssSamples = SSSsamples;
  // Max world space distance from ray origin
  float ssMaxDist = SSSmaxDistance;
  // Step in pixels
  float ssStride = SSSstride;
  // Assumed depth thickness (in world space) of on screen surfaces
  float ssThickness = SSSthickness;

  float rayLength =
      csZDir * (csOrigin.z + ssMaxDist * csDirection.z) < csZDir * nearPlaneZ
          ? // '<' instead of '>'
          (nearPlaneZ - csOrigin.z) / csDirection.z
          : ssMaxDist;
  vec3 csEndPoint = csOrigin + rayLength * csDirection;

  vec4 H0 = projMtx * vec4(csOrigin, 1.0);
  vec4 H1 = projMtx * vec4(csEndPoint, 1.0);
  vec2 Z0 = vec2(csOrigin.z  , 1.0) / H0.w;
  vec2 Z1 = vec2(csEndPoint.z, 1.0) / H1.w;
  vec2 P0 = csZBufferSize * (0.5 * H0.xy * Z0.y + 0.5);
  vec2 P1 = csZBufferSize * (0.5 * H1.xy * Z1.y + 0.5);

  P1 += vec2(distanceSquared(P0, P1) < 0.0001 ? 0.01 : 0.0);
  vec2 delta = P1 - P0;
  bool permute = false;
  if (abs(delta.x) < abs(delta.y)) {
    permute = true;
    P0 = P0.yx;
    P1 = P1.yx;
    delta = delta.yx;
  }

  float stepDirection = sign(delta.x);
  float invdx = stepDirection / delta.x;
  vec2 dP = ssStride * vec2(stepDirection, invdx * delta.y);
  vec2 dZ = ssStride * invdx * (Z1 - Z0);

  float opacity = 0.0;
  vec2 P = P0 + noise * dP;
  vec2 Z = Z0 + noise * dZ;
  float end = P1.x * stepDirection;
  float rayZMax = csZDir * Z.x / Z.y;
  float sceneDepth = rayZMax;
  Z += dZ;

  for (float stepCount = 0.0;
       opacity < 1.0 && P.x * stepDirection < end && sceneDepth > 0.0 && stepCount < ssSamples;
       stepCount++, P += dP,
             Z += dZ) { // 'sceneDepth > 0.0' instead of 'sceneDepth < 0.0'
    ivec2 coords = ivec2(permute ? P.yx : P);
    sceneDepth = texelFetch(depthSampler, coords, 0).x;
    sceneDepth = linearizeDepth(sceneDepth, nearPlaneZ, farPlaneZ);
    sceneDepth = csZDir * sceneDepth;
    if (sceneDepth <= 0.0) {
            break;
    }
    float rayZMin = rayZMax;
    rayZMax = csZDir * Z.x / Z.y;
    opacity += max(opacity, step(rayZMax, sceneDepth + ssThickness) * step(sceneDepth, rayZMin));
  }

  return opacity;
}

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
float voxelShadow(vec3 wsOrigin, vec3 wsDirection, vec3 wsNormal,
                  vec2 DitherNoise,
                  out VoxelMarchDiagnosticInfo voxel_march_diagnostic_info) {
#else
float voxelShadow(vec3 wsOrigin, vec3 wsDirection, vec3 wsNormal,
                  vec2 DitherNoise) {
#endif
  float vxResolution = float(textureSize(voxelGridSampler, 0).x);
  vec3 T, B;
  genTB(wsDirection, T, B);
  vec2 DitherXY = sqrt(DitherNoise.x) * vec2(cos(2.0 * PI * DitherNoise.y),
                                             sin(2.0 * PI * DitherNoise.y));
  float sceneScale = wsNormalizationMtx[0][0];

  vec3 Dithering =
      (voxelBiasParameters.x * wsNormal + voxelBiasParameters.y * wsDirection +
       DitherXY.x * T + DitherXY.y * B) /
      vxResolution;
  vec3 O = 0.5 * wsOrigin + 0.5 + Dithering;

  Ray ray_vs = make_ray(O, wsDirection, 0.0, 10.0);

  // Early out for rays which miss the scene bounding box, common in ground
  // plane
  AABB3f voxel_aabb;
  voxel_aabb.m_min = vec3(0);
  voxel_aabb.m_max = vec3(1);

  float near, far;
  if (!ray_box_intersection(voxel_aabb, ray_vs, near, far))
    return 0.0;

  ray_vs.t_min = max(ray_vs.t_min, near);
  ray_vs.t_max = min(ray_vs.t_max, far);

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  return anyHitVoxels(ray_vs, voxel_march_diagnostic_info) ? 1.0f : 0.0f;
#else
  return anyHitVoxels(ray_vs) ? 1.0f : 0.0f;
#endif
}

void main(void) {
  uint nbDirs = uint(SHADOWdirs);
  uint frameId = uint(SHADOWframe);
  float envRot = SHADOWenvRot;

  vec2 Resolution = vec2(textureSize(depthSampler, 0));
  ivec2 currentPixel = ivec2(vUV * Resolution);
  uint GlobalIndex = (frameId * uint(Resolution.y) + uint(currentPixel.y)) *
                         uint(Resolution.x) +
                     uint(currentPixel.x);

  vec3 N = texelFetch(worldNormalSampler, currentPixel, 0).xyz;
  // N = N * vec3(2.0) - vec3(1.0);
  if (length(N) < 0.01) {
    glFragColor = vec4(1.0, 1.0, 0.0, 1.0);
    return;
  }

  float normalizedRotation = envRot / (2.0 * PI);

  float depth = texelFetch(depthSampler, currentPixel, 0).x;
#ifndef IS_NDC_HALF_ZRANGE
  depth = depth * 2.0 - 1.0;
#endif
  vec2 temp = (vec2(currentPixel) + vec2(0.5)) * 2.0 / Resolution - vec2(1.0);
  vec4 VP = invProjMtx * vec4(temp.x, -temp.y, depth, 1.0);
  VP /= VP.w;

  N = normalize(N);
  vec3 noise = texelFetch(blueNoiseSampler, currentPixel & 0xFF, 0).xyz;
  noise.z = fract(noise.z + goldenSequence(frameId * nbDirs));

#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  float heat = 0.0f;
#endif
  float shadowAccum = 0.0;
  float specShadowAccum = 0.0;
  float sampleWeight = 0.0;
  for (uint i = 0u; i < nbDirs; i++) {
    uint dirId = nbDirs * GlobalIndex + i;
    vec4 L;
    {
      vec2 r = plasticSequence(frameId * nbDirs + i);
      r = fract(r + vec2(2.0) * abs(noise.xy - vec2(0.5)));
      vec2 T;
      T.x = textureLod(icdfxSampler, vec2(r.x, 0.0), 0.0).x;
      T.y = textureLod(icdfySampler, vec2(T.x, r.y), 0.0).x;
      T.x -= normalizedRotation;
      L = vec4(uv_to_normal(T), 0);
      #ifndef RIGHT_HANDED
        L.z *= -1.0;
      #endif
    }
    float edge_tint_const = -0.001;
    float cosNL = dot(N, L.xyz);
    float opacity = cosNL < edge_tint_const ? 1.0 : 0.0;

    if (cosNL > edge_tint_const) {
      // voxel
      vec4 VP2 = VP;
      VP2.y *= -1.0;
      // rte world-space normalization
      vec4 unormWP = invViewMtx * VP2;
      vec3 WP = (wsNormalizationMtx * unormWP).xyz;
      vec2 vxNoise =
          vec2(uint2float(hash(dirId * 2u)), uint2float(hash(dirId * 2u + 1u)));
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
      VoxelMarchDiagnosticInfo voxel_march_diagnostic_info;
      opacity = max(opacity,
                    shadowOpacity.x * voxelShadow(WP, L.xyz, N, vxNoise,
                                                  voxel_march_diagnostic_info));
      heat += voxel_march_diagnostic_info.heat;
#else
      opacity =
          max(opacity, shadowOpacity.x * voxelShadow(WP, L.xyz, N, vxNoise));
#endif

      // sss
      vec3 VL = (viewMtx * L).xyz;
      
      #ifdef RIGHT_HANDED
        float nearPlaneZ = -projMtx[3][2] / (projMtx[2][2] - 1.0); // retreive camera Z near value
        float farPlaneZ = -projMtx[3][2] / (projMtx[2][2] + 1.0);
      #else
        float nearPlaneZ = -projMtx[3][2] / (projMtx[2][2] + 1.0); // retreive camera Z near value
        float farPlaneZ = -projMtx[3][2] / (projMtx[2][2] - 1.0);
      #endif
      float ssShadow = shadowOpacity.y *
                       screenSpaceShadow(VP2.xyz, VL, Resolution, nearPlaneZ, farPlaneZ,
                                         abs(2.0 * noise.z - 1.0));
      opacity = max(opacity, ssShadow);
      shadowAccum += min(1.0 - opacity, cosNL);
      sampleWeight += cosNL;
      // spec shadow
      vec3 VR = -(viewMtx * vec4(reflect(-L.xyz, N), 0.0)).xyz;
      specShadowAccum += max(1.0 - (opacity * pow(VR.z, 8.0)), 0.0);
    }
    noise.z = fract(noise.z + GOLD);
  }
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  gl_FragColor = vec4(shadowAccum / float(sampleWeight),
                      specShadowAccum / float(sampleWeight), heat / float(sampleWeight), 1.0);
#else
  gl_FragColor = vec4(shadowAccum / float(sampleWeight), specShadowAccum / float(sampleWeight), 0.0, 1.0);
#endif
}