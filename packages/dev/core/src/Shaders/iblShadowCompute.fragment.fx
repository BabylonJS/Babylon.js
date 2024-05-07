precision highp sampler2D;
precision highp sampler3D;
#define PI 3.1415927
varying vec2 vUV;

uniform sampler2D depthSampler;
uniform sampler2D linearDepthSampler;
uniform sampler2D worldNormalSampler;
uniform sampler2D worldPositionSampler;
uniform sampler2D blueNoiseSampler;
// Importance sampling
uniform sampler2D icdfxSampler;
uniform sampler2D icdfySampler;
uniform sampler3D voxelGridSampler;

// shadow parameters: int nbDirs, int frameId, int downscale, float envRot
uniform vec4 shadowParameters;

#define SHADOWdirs shadowParameters.x
#define SHADOWframe shadowParameters.y
#define SHADOWdownscale shadowParameters.z
#define SHADOWenvRot shadowParameters.w

// morton code offset, max voxel grid mip
uniform vec4 offsetDataParameters;

#define PixelOffset offsetDataParameters.xy
#define highestMipLevel offsetDataParameters.z

// screen space shadow parameters
uniform vec4 sssParameters;

#define SSSsamples sssParameters.x
#define SSSstride sssParameters.y
#define SSSmaxDistance sssParameters.z
#define SSSthickness sssParameters.w

// Uniform matrices
uniform mat4 projMtx;
uniform mat4 viewMtx;
uniform mat4 invProjMtx;
uniform mat4 invViewMtx;
uniform mat4 wsNormalizationMtx;

#define PI 3.1415927
#define GOLD 0.618034

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

bool anyHitVoxelsSimple(const vec3 O, const vec3 D) {
  const float stepSize = 0.01;
  const int maxSteps = 100;
  const float selfShadowingOffset =
      stepSize * 0.75; // Adjust this value as needed
  vec3 currentPosition = O + D * selfShadowingOffset; // Offset the ray origin
  vec3 step = D * stepSize;

  // Check if the ray will intersect the voxel grid
  vec3 t0 = (vec3(0.0, 0.0, 0.0) - O) / D;
  vec3 t1 = (vec3(1.0, 1.0, 1.0) - O) / D;
  vec3 tmin = min(t0, t1);
  vec3 tmax = max(t0, t1);
  float tEnter = max(max(tmin.x, tmin.y), tmin.z);
  float tExit = min(min(tmax.x, tmax.y), tmax.z);
  if (tEnter > tExit || tExit < 0.0) {
    return false;
  }

  for (int i = 0; i < maxSteps; ++i) {
    // TODO - If the direction isn't pointing at the voxel grid, discard.
    if (currentPosition.x >= 0.0 && currentPosition.y >= 0.0 &&
        currentPosition.z >= 0.0 && currentPosition.x <= 1.0 &&
        currentPosition.y <= 1.0 && currentPosition.z <= 1.0) {
      float voxelValue = texture(voxelGridSampler, currentPosition).r;
      if (voxelValue > 0.0) {
        return true;
      }
    }
    currentPosition += step;
  }
  return false;
}

int stack[24];                           // Swapped dimension
#define PUSH(i) stack[stackLevel++] = i; // order, small
#define POP() stack[--stackLevel]        // perf improvement

bool anyHitVoxels(const vec3 O, const vec3 D) {
  vec3 invD = 1.0 / D;
  ivec3 negD = ivec3(lessThan(D, vec3(0, 0, 0)));
  int voxel0 = negD.x | negD.y << 1 | negD.z << 2;
  vec3 t0 = -O * invD, t1 = (1.0 - O) * invD;
  int maxLod = int(highestMipLevel);
  int stackLevel = 0;

  PUSH(maxLod << 27); // Different packing
  while (stackLevel > 0) {
    int elem = POP();
    ivec4 Coords = ivec4(elem & 0x1FF, elem >> 9 & 0x1FF, elem >> 18 & 0x1FF,
                         elem >> 27); // Different packing

    if (Coords.w == 0)
      return true;

    float invRes =
        1.0 / float(1 << (maxLod - Coords.w)); // Slightly faster computation
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

    int packedCoords0 = (Coords.x | Coords.y << 9) |
                        (Coords.z << 18 | Coords.w << 27); // Different packing

    if (max(max(mint.x, mint.y), mint.z) < min(min(midt.x, midt.y), midt.z) &&
        (nodeMask >> (voxel0) & 1) != 0)
      PUSH(packedCoords0);
    if (max(max(midt.x, mint.y), mint.z) < min(min(maxt.x, midt.y), midt.z) &&
        (nodeMask >> (voxel0 ^ 1) & 1) != 0)
      PUSH(packedCoords0 ^ 0x00001);
    if (max(max(midt.x, midt.y), mint.z) < min(min(maxt.x, maxt.y), midt.z) &&
        (nodeMask >> (voxel0 ^ 3) & 1) != 0)
      PUSH(packedCoords0 ^ 0x00201);
    if (max(max(mint.x, midt.y), mint.z) < min(min(midt.x, maxt.y), midt.z) &&
        (nodeMask >> (voxel0 ^ 2) & 1) != 0)
      PUSH(packedCoords0 ^ 0x00200);
    if (max(max(mint.x, midt.y), midt.z) < min(min(midt.x, maxt.y), maxt.z) &&
        (nodeMask >> (voxel0 ^ 6) & 1) != 0)
      PUSH(packedCoords0 ^ 0x40200);
    if (max(max(midt.x, midt.y), midt.z) < min(min(maxt.x, maxt.y), maxt.z) &&
        (nodeMask >> (voxel0 ^ 7) & 1) != 0)
      PUSH(packedCoords0 ^ 0x40201);
    if (max(max(midt.x, mint.y), midt.z) < min(min(maxt.x, midt.y), maxt.z) &&
        (nodeMask >> (voxel0 ^ 5) & 1) != 0)
      PUSH(packedCoords0 ^ 0x40001);
    if (max(max(mint.x, mint.y), midt.z) < min(min(midt.x, midt.y), maxt.z) &&
        (nodeMask >> (voxel0 ^ 4) & 1) != 0)
      PUSH(packedCoords0 ^ 0x40000);
  }

  return false;
}

float screenSpaceShadow(vec3 csOrigin, vec3 csDirection, vec2 csZBufferSize,
                        float nearPlaneZ, float noise) {
  // Camera space Z direction
  float csZDir = projMtx[2][2] > 0.0 ? 1.0 : -1.0;
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
  vec2 Z0 = vec2(csOrigin.z, 1.0) / H0.w;
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

  for (float stepCount = 0.0; opacity < 1.0 && P.x * stepDirection < end &&
                              sceneDepth > 0.0 && stepCount < ssSamples;
       stepCount++, P += dP,
             Z += dZ) { // 'sceneDepth > 0.0' instead of 'sceneDepth < 0.0'
    vec2 linearZ_alpha =
        texelFetch(linearDepthSampler, ivec2(permute ? P.yx : P), 0).xy;
    sceneDepth = csZDir * linearZ_alpha.x;
    if (sceneDepth <= 0.0)
      break;
    float rayZMin = rayZMax;
    rayZMax = csZDir * Z.x / Z.y;
    opacity += max(opacity, (1.0 - linearZ_alpha.y) *
                                step(rayZMax, sceneDepth + ssThickness) *
                                step(sceneDepth, rayZMin));
  }

  return opacity;
}

float voxelShadow(vec3 wsOrigin, vec3 wsDirection, vec3 wsNormal,
                  vec2 DitherNoise) {
  float vxResolution = float(textureSize(voxelGridSampler, 0).x);
  vec3 T, B;
  genTB(wsDirection, T, B);
  vec2 DitherXY = sqrt(DitherNoise.x) * vec2(cos(2.0 * PI * DitherNoise.y),
                                             sin(2.0 * PI * DitherNoise.y));
  vec3 Dithering =
      (2.0 * wsNormal + 3.0 * wsDirection + DitherXY.x * T + DitherXY.y * B) /
      vxResolution;
  vec3 O = 0.5 * wsOrigin + 0.5 + Dithering;

  return anyHitVoxelsSimple(O, wsDirection) ? 1.0f : 0.0f;
}

void main(void) {
  uint nbDirs = uint(SHADOWdirs);
  uint frameId = uint(SHADOWframe);
  int downscale = int(SHADOWdownscale);
  float envRot = SHADOWenvRot;

  vec2 Resolution = vec2(textureSize(depthSampler, 0));
  ivec2 currentPixel = ivec2(max(vUV * Resolution - vec2(0.5), vec2(0.0)));
  ivec2 PixelCoord = ivec2(vec2(currentPixel * downscale) + PixelOffset.xy);
  uint GlobalIndex =
      (frameId * uint(Resolution.y) + uint(PixelCoord.y)) * uint(Resolution.x) +
      uint(PixelCoord.x);

  vec3 N = texelFetch(worldNormalSampler, PixelCoord, 0).xyz;
  if (all(equal(N, vec3(0, 0, 0)))) {
    gl_FragColor = vec4(0, 0, 0, 0);
    return;
  }

  // TODO: Move this matrix into a uniform
  float rotAngle = envRot;
  float cosAngle = cos(rotAngle);
  float sinAngle = sin(rotAngle);
  vec3 r1 = vec3(cosAngle, 0.0f, sinAngle);
  vec3 r2 = vec3(0.0, 1.0f, 0.0f);
  vec3 r3 = vec3(-sinAngle, 0.0f, cosAngle);
  mat3 RotMatrix = transpose(mat3(r1, r2, r3));

  float depth = texelFetch(depthSampler, PixelCoord, 0).x;
  vec2 temp = (vec2(PixelCoord) + vec2(0.5)) * 2.0 / Resolution - vec2(1.0);
  vec4 VP = invProjMtx * vec4(temp.x, temp.y, depth, 1.0);
  VP /= VP.w;

  N = normalize(N);
  vec3 noise = texelFetch(blueNoiseSampler, PixelCoord & 0xFF, 0).xyz;
  noise.z = fract(noise.z + goldenSequence(frameId * nbDirs));

  vec2 linearZ_alpha = texelFetch(linearDepthSampler, PixelCoord, 0).xy;

  float shadowAccum = 0.0;
  for (uint i = 0u; i < nbDirs; i++) {
    uint dirId = nbDirs * GlobalIndex + i;
    vec4 L;
    {
      vec2 r = plasticSequence(frameId * nbDirs + i);
      r = fract(r + 2.0 * abs(noise.xy - 0.5));
      vec2 T;
      T.x = textureLod(icdfxSampler, vec2(r.x, 0.0), 0.0).x;
      T.y = textureLod(icdfySampler, vec2(T.x, r.y), 0.0).x;
      L = vec4(uv_to_normal(T), 0);
      L.xyz = RotMatrix * L.xyz;
    }
    float edge_tint_const = linearZ_alpha.y > 0.0 ? -0.001 : -0.1;
    float cosNL = dot(N, L.xyz);
    float opacity = cosNL < edge_tint_const ? 1.0 : 0.0;

    if (cosNL > edge_tint_const) {
      // voxel
      vec4 VP2 = VP;
      VP2.y *= -1.0;
      // rte world-space normalization
      // vec4 unormWP = invViewMtx * VP2;
      vec4 unormWP = texelFetch(worldPositionSampler, PixelCoord, 0);
      vec3 WP = (wsNormalizationMtx * unormWP).xyz;
      vec2 vxNoise =
          vec2(uint2float(hash(dirId * 2u)), uint2float(hash(dirId * 2u + 1u)));
      opacity = max(opacity, voxelShadow(WP, L.xyz, N, vxNoise));

      // sss
      vec3 VL = (viewMtx * L).xyz;
      VL.y *= -1.0;
      float nearPlaneZ =
          -projMtx[3][2] / projMtx[2][2]; // retreive camera Z near value
      float ssShadow = screenSpaceShadow(VP.xyz, VL, Resolution, nearPlaneZ,
                                         abs(2.0 * noise.z - 1.0));
      opacity = max(opacity, ssShadow);
      shadowAccum += min(1.0 - opacity, smoothstep(-0.1, 0.2, cosNL));
    } else if (linearZ_alpha.y > 0.0) {
      shadowAccum += opacity / float(nbDirs);
    } else {
      shadowAccum += min(1.0 - opacity, smoothstep(-0.1, 0.2, cosNL));
    }
    noise.z = fract(noise.z + GOLD);
  }

  gl_FragColor = vec4(shadowAccum / float(nbDirs), 1.0, 0.0, 0.0);
  // gl_FragColor = vec4(1.0, 1.0, 0.0, 0.0);
}