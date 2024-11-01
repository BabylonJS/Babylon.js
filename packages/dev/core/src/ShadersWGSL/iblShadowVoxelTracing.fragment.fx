#define PI 3.1415927
varying vUV: vec2f;

#define DISABLE_UNIFORMITY_ANALYSIS

var depthSampler: texture_2d<f32>;
var worldNormalSampler : texture_2d<f32>;
var blueNoiseSampler: texture_2d<f32>;
// Importance sampling
var icdfxSamplerSampler: sampler;
var icdfxSampler: texture_2d<f32>;
var icdfySamplerSampler: sampler;
var icdfySampler: texture_2d<f32>;
var voxelGridSamplerSampler: sampler;
var voxelGridSampler: texture_3d<f32>;

// shadow parameters: var nbDirs: i32, var frameId: i32, unused, var envRot: f32
uniform shadowParameters: vec4f;

#define SHADOWdirs uniforms.shadowParameters.x
#define SHADOWframe uniforms.shadowParameters.y
#define SHADOWenvRot uniforms.shadowParameters.w

// voxel tracing bias parameters (normal bias, direction bias, unused, max
// mip count)
uniform voxelBiasParameters : vec4f;

#define highestMipLevel uniforms.voxelBiasParameters.z

// screen space shadow parameters
uniform sssParameters: vec4f;

#define SSSsamples uniforms.sssParameters.x
#define SSSstride uniforms.sssParameters.y
#define SSSmaxDistance uniforms.sssParameters.z
#define SSSthickness uniforms.sssParameters.w

uniform shadowOpacity: vec4f;

// Uniform matrices
uniform projMtx: mat4x4f;
uniform viewMtx: mat4x4f;
uniform invProjMtx: mat4x4f;
uniform invViewMtx: mat4x4f;
uniform wsNormalizationMtx: mat4x4f;
uniform invVPMtx: mat4x4f;

#define PI 3.1415927
#define GOLD 0.618034

struct AABB3f {
  m_min: vec3f,
  m_max: vec3f,
};

struct Ray {
  orig: vec3f,
  dir: vec3f,
  dir_rcp: vec3f,
  t_min: f32,
  t_max: f32,
};

fn make_ray(origin: vec3f, direction: vec3f, tmin: f32,
             tmax: f32) -> Ray {
  var ray: Ray;
  ray.orig = origin;
  ray.dir = direction;
  ray.dir_rcp = 1.0f / direction;
  ray.t_min = tmin;
  ray.t_max = tmax;
  return ray;
}

fn ray_box_intersection(aabb: AABB3f, ray: Ray ,
                          distance_near: ptr<function, f32>, distance_far: ptr<function, f32>) -> bool{
  var tbot: vec3f = ray.dir_rcp * (aabb.m_min - ray.orig);
  var ttop: vec3f = ray.dir_rcp * (aabb.m_max - ray.orig);
  var tmin: vec3f = min(ttop, tbot);
  var tmax: vec3f = max(ttop, tbot);
  *distance_near = max(ray.t_min, max(tmin.x, max(tmin.y, tmin.z)));
  *distance_far = min(ray.t_max, min(tmax.x, min(tmax.y, tmax.z)));
  return *distance_near <= *distance_far;
}

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
struct VoxelMarchDiagnosticInfo {
  heat: f32,
  voxel_intersect_coords: vec3i,
};
#endif

fn hash(i: u32) -> u32 {
  var temp = i ^ (i >> 16u);
  temp *= 0x7FEB352Du;
  temp ^= temp >> 15u;
  temp *= 0x846CA68Bu;
  temp ^= temp >> 16u;
  return temp;
}

fn uintBitsToFloat(x: u32) -> f32 {
    return bitcast<f32>(x);
}

fn uint2float(i: u32) -> f32 {
  return uintBitsToFloat(0x3F800000u | (i >> 9u)) - 1.0;
}

fn uv_to_normal(uv: vec2f) -> vec3f {
  var N: vec3f;

  var uvRange: vec2f = uv;
  var theta: f32 = uvRange.x * 2.0 * PI;
  var phi: f32 = uvRange.y * PI;

  N.x = cos(theta) * sin(phi);
  N.z = sin(theta) * sin(phi);
  N.y = cos(phi);
  return N;
}

fn plasticSequence(rstate: u32) -> vec2f {
  return vec2f(uint2float(rstate * 3242174889u),
              uint2float(rstate * 2447445414u));
}

fn goldenSequence(rstate: u32) -> f32 {
  return uint2float(rstate * 2654435769u);
}

fn distanceSquared(a: vec2f, b: vec2f) -> f32 {
  var diff: vec2f = a - b;
  return dot(diff, diff);
}

fn genTB(N: vec3f, T: ptr<function, vec3f>, B: ptr<function, vec3f>) {
  var s: f32 = select(1.0, -1.0, N.z < 0.0);
  var a: f32 = -1.0 / (s + N.z);
  var b: f32 = N.x * N.y * a;
  *T =  vec3f(1.0 + s * N.x * N.x * a, s * b, -s * N.x);
  *B =  vec3f(b, s + N.y * N.y * a, -N.y);
}

fn lessThan(x: vec3f, y: vec3f) -> vec3<bool> {
    return x < y;
}


#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
fn anyHitVoxels(ray_vs: Ray,
                voxel_march_diagnostic_info: ptr<function, VoxelMarchDiagnosticInfo>) -> bool {
#else
fn anyHitVoxels(ray_vs: Ray) -> bool {
#endif
  var stack = array<i32, 24>();          // Swapped dimension
  var invD: vec3f = ray_vs.dir_rcp;
  var D: vec3f = ray_vs.dir;
  var O: vec3f = ray_vs.orig;
  var negD = vec3i(lessThan(D,  vec3f(0, 0, 0)));
  var voxel0: i32 = negD.x | (negD.y << 1) | (negD.z << 2);
  var t0: vec3f = -O * invD;
  var t1 = (vec3f(1.0) - O) * invD;
  var maxLod: i32 =  i32(highestMipLevel);
  var stackLevel: i32 = 0;
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  var steps: u32 = 0u;
#endif

  stack[stackLevel] = maxLod << 24;
  stackLevel++;
  while (stackLevel > 0) {
    stackLevel = stackLevel - 1;
    var elem: i32 = stack[stackLevel];
    var Coords: vec4i =
        vec4i(elem & 0xFF, (elem >> 8) & 0xFF, (elem >> 16) & 0xFF, elem >> 24);

    if (Coords.w == 0) {
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
      *voxel_march_diagnostic_info.heat =  f32(steps) / 24.0;
      //   voxel_march_diagnostic_info.voxel_intersect_coords = node_coords;
#endif
      return true;
    }

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
    ++steps;
#endif

    var invRes: f32 = exp2(f32(Coords.w - maxLod));
    var bbmin: vec3f = invRes * vec3f(Coords.xyz + negD);
    var bbmax: vec3f = invRes * vec3f(Coords.xyz - negD + vec3i(1));
    var mint: vec3f = mix(t0, t1, bbmin);
    var maxt: vec3f = mix(t0, t1, bbmax);
    var midt: vec3f = 0.5 * (mint + maxt);
    mint.x = max(0.0, mint.x);
    midt.x = max(0.0, midt.x);

    ////// NEW ////// With the conversion to a R8 voxel texture, the two
    /// following lines have been swapped
    var nodeMask: u32 =  u32(
        round(textureLoad(voxelGridSampler, Coords.xyz, Coords.w).x * 255.0));
    Coords.w--;
    var voxelBit: u32 = u32(voxel0);
    Coords = vec4i((Coords.xyz << vec3u(1)) + negD, Coords.w);

    var packedCoords: i32 =
        Coords.x | (Coords.y << 8) | (Coords.z << 16) | (Coords.w << 24);
    if (max(mint.x, max(mint.y, mint.z)) < min(midt.x, min(midt.y, midt.z)) &&
        ((1u << voxelBit) & nodeMask) != 0) {
      stack[stackLevel] = packedCoords;
      stackLevel++;
    }
    voxelBit ^= 0x1;
    packedCoords ^= 0x00001;
    if (max(midt.x, max(mint.y, mint.z)) < min(maxt.x, min(midt.y, midt.z)) &&
        ((1u << voxelBit) & nodeMask) != 0) {
      stack[stackLevel] = packedCoords;
      stackLevel++;
    }
    voxelBit ^= 0x2;
    packedCoords ^= 0x00100;
    if (max(midt.x, max(midt.y, mint.z)) < min(maxt.x, min(maxt.y, midt.z)) &&
        ((1u << voxelBit) & nodeMask) != 0) {
      stack[stackLevel] = packedCoords;
      stackLevel++;
    }
    voxelBit ^= 0x1;
    packedCoords ^= 0x00001;
    if (max(mint.x, max(midt.y, mint.z)) < min(midt.x, min(maxt.y, midt.z)) &&
        ((1u << voxelBit) & nodeMask) != 0) {
      stack[stackLevel] = packedCoords;
      stackLevel++;
    }
    voxelBit ^= 0x4;
    packedCoords ^= 0x10000;
    if (max(mint.x, max(midt.y, midt.z)) < min(midt.x, min(maxt.y, maxt.z)) &&
        ((1u << voxelBit) & nodeMask) != 0) {
      stack[stackLevel] = packedCoords;
      stackLevel++;
    }
    voxelBit ^= 0x1;
    packedCoords ^= 0x00001;
    if (max(midt.x, max(midt.y, midt.z)) < min(maxt.x, min(maxt.y, maxt.z)) &&
        ((1u << voxelBit) & nodeMask) != 0) {
      stack[stackLevel] = packedCoords;
      stackLevel++;
    }
    voxelBit ^= 0x2;
    packedCoords ^= 0x00100;
    if (max(midt.x, max(mint.y, midt.z)) < min(maxt.x, min(midt.y, maxt.z)) &&
        ((1u << voxelBit) & nodeMask) != 0) {
      stack[stackLevel] = packedCoords;
      stackLevel++;
    }
    voxelBit ^= 0x1;
    packedCoords ^= 0x00001;
    if (max(mint.x, max(mint.y, midt.z)) < min(midt.x, min(midt.y, maxt.z)) &&
        ((1u << voxelBit) & nodeMask) != 0) {
      stack[stackLevel] = packedCoords;
      stackLevel++;
    }
  }

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  *voxel_march_diagnostic_info.heat =  f32(steps) / 24.0;
#endif

  return false;
}

fn linearizeDepth(depth: f32, near: f32, far: f32) -> f32 {
    return (near * far) / (far - depth * (far - near));
}

fn screenSpaceShadow(csOrigin: vec3f, csDirection: vec3f, csZBufferSize: vec2f,
                        nearPlaneZ: f32, farPlaneZ: f32, noise: f32) -> f32 {
  // Camera space Z direction
#ifdef RIGHT_HANDED
  var csZDir : f32 = -1.0;
#else // LEFT_HANDED
  var csZDir : f32 = 1.0;
#endif
  // Max sample count per ray
  var ssSamples: f32 = SSSsamples;
  // Max world space distance from ray origin
  var ssMaxDist: f32 = SSSmaxDistance;
  // Step in pixels
  var ssStride: f32 = SSSstride;
  // Assumed depth thickness (in world space) of on screen surfaces
  var ssThickness: f32 = SSSthickness;

  var rayLength: f32 =
      select(ssMaxDist, (nearPlaneZ - csOrigin.z) / csDirection.z, 
      csZDir * (csOrigin.z + ssMaxDist * csDirection.z) < csZDir * nearPlaneZ);
  var csEndPoint: vec3f = csOrigin + rayLength * csDirection;

  var H0: vec4f = uniforms.projMtx * vec4f(csOrigin, 1.0);
  var H1: vec4f = uniforms.projMtx * vec4f(csEndPoint, 1.0);
  var Z0 = vec2f(csOrigin.z  , 1.0) / H0.w;
  var Z1 = vec2f(csEndPoint.z, 1.0) / H1.w;
  var P0 = csZBufferSize * (0.5 * H0.xy * Z0.y + 0.5);
  var P1 = csZBufferSize * (0.5 * H1.xy * Z1.y + 0.5);

  P1 +=  vec2f(select(0.0, 0.01, distanceSquared(P0, P1) < 0.0001));
  var delta: vec2f = P1 - P0;
  var permute: bool = false;
  if (abs(delta.x) < abs(delta.y)) {
    permute = true;
    P0 = P0.yx;
    P1 = P1.yx;
    delta = delta.yx;
  }

  var stepDirection: f32 = sign(delta.x);
  var invdx: f32 = stepDirection / delta.x;
  var dP: vec2f = ssStride *  vec2f(stepDirection, invdx * delta.y);
  var dZ: vec2f = ssStride * invdx * (Z1 - Z0);

  var opacity: f32 = 0.0;
  var P: vec2f = P0 + noise * dP;
  var Z: vec2f = Z0 + noise * dZ;
  var end: f32 = P1.x * stepDirection;
  var rayZMax = csZDir * Z.x / Z.y;
  var sceneDepth = rayZMax;
  Z += dZ;

  for (var stepCount: f32 = 0.0; 
        opacity < 1.0 && P.x * stepDirection < end && sceneDepth > 0.0 && stepCount < ssSamples;
       stepCount += 1) { // 'sceneDepth > 0.0' instead of 'sceneDepth < 0.0'
    var coords = vec2i(select(P, P.yx, permute));
    sceneDepth = textureLoad(depthSampler, coords, 0).x;
    sceneDepth = linearizeDepth(sceneDepth, nearPlaneZ, farPlaneZ);
    sceneDepth = csZDir * sceneDepth;
    if (sceneDepth <= 0.0) {
            break;
    }
    var rayZMin: f32 = rayZMax;
    rayZMax = csZDir * Z.x / Z.y;
    opacity += max(opacity, step(rayZMax, sceneDepth + ssThickness) * step(sceneDepth, rayZMin));
    P += dP;
    Z += dZ;
  }

  return opacity;
}

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
fn voxelShadow(wsOrigin: vec3f, wsDirection: vec3f, wsNormal: vec3f,
                  DitherNoise: vec2f,
                  voxel_march_diagnostic_info: ptr<function, VoxelMarchDiagnosticInfo>) -> f32 {
#else
fn voxelShadow(wsOrigin: vec3f, wsDirection: vec3f, wsNormal: vec3f,
                  DitherNoise: vec2f) -> f32 {
#endif
  var vxResolution: f32 = f32(textureDimensions(voxelGridSampler, 0).x);
  var T: vec3f;
  var B: vec3f;
  genTB(wsDirection, &T, &B);
  var DitherXY: vec2f = sqrt(DitherNoise.x) *  vec2f(cos(2.0 * PI * DitherNoise.y),
                                             sin(2.0 * PI * DitherNoise.y));
  var Dithering : vec3f = (uniforms.voxelBiasParameters.x * wsNormal +
                           uniforms.voxelBiasParameters.y * wsDirection +
                           DitherXY.x * T + DitherXY.y * B) /
                          vxResolution;
  var O: vec3f = 0.5 * wsOrigin + 0.5 + Dithering;

  var ray_vs = make_ray(O, wsDirection, 0.0, 10.0);

  // Early out for rays which miss the scene bounding box, common in ground
  // plane
  var voxel_aabb: AABB3f;
  voxel_aabb.m_min = vec3f(0);
  voxel_aabb.m_max = vec3f(1);

  var near: f32 = 0;
  var far: f32 = 0;
  if (!ray_box_intersection(voxel_aabb, ray_vs, &near, &far)) {
    return 0.0;
  }

  ray_vs.t_min = max(ray_vs.t_min, near);
  ray_vs.t_max = min(ray_vs.t_max, far);

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  return select(0.0f, 1.0f, anyHitVoxels(ray_vs, voxel_march_diagnostic_info));
#else
  return select(0.0f, 1.0f, anyHitVoxels(ray_vs));
#endif
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  var nbDirs = u32(SHADOWdirs);
  var frameId = u32(SHADOWframe);
  var envRot: f32 = SHADOWenvRot;

  var Resolution: vec2f =  vec2f(textureDimensions(depthSampler, 0));
  var currentPixel = vec2i(fragmentInputs.vUV * Resolution);
  var GlobalIndex =
      (frameId * u32(Resolution.y) + u32(currentPixel.y)) * u32(Resolution.x) +
      u32(currentPixel.x);

  var N : vec3f = textureLoad(worldNormalSampler, currentPixel, 0).xyz;
  if (length(N) < 0.01) {
    fragmentOutputs.color = vec4f(1.0, 1.0, 0.0, 1.0);
    return fragmentOutputs;
  }

  // TODO: Move this matrix into a uniform
  var normalizedRotation: f32 = envRot / (2.0 * PI);

  var depth : f32 = textureLoad(depthSampler, currentPixel, 0).x;
#ifndef IS_NDC_HALF_ZRANGE
  depth = depth * 2.0 - 1.0;
#endif
  var temp : vec2f = (vec2f(currentPixel) + vec2f(0.5)) * 2.0 / Resolution -
                     vec2f(1.0);
  var VP : vec4f = uniforms.invProjMtx * vec4f(temp.x, -temp.y, depth, 1.0);
  VP /= VP.w;

  N = normalize(N);
  var noise
      : vec3f =
            textureLoad(blueNoiseSampler, currentPixel & vec2i(0xFF), 0).xyz;
  noise.z = fract(noise.z + goldenSequence(frameId * nbDirs));

#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  var heat: f32 = 0.0f;
#endif
  var shadowAccum: f32 = 0.0;
  var specShadowAccum: f32 = 0.0;
  var sampleWeight : f32 = 0;
  for (var i: u32 = 0; i < nbDirs; i++) {
    var dirId: u32 = nbDirs * GlobalIndex + i;
    var L: vec4f;
    {
      var r: vec2f = plasticSequence(frameId * nbDirs + i);
      r = fract(r +  vec2f(2.0) * abs(noise.xy -  vec2f(0.5)));
      var T: vec2f;
      T.x = textureSampleLevel(icdfxSampler, icdfxSamplerSampler, vec2f(r.x, 0.0), 0.0).x;
      T.y = textureSampleLevel(icdfySampler, icdfySamplerSampler, vec2f(T.x, r.y), 0.0).x;
      T.x -= normalizedRotation;
      L =  vec4f(uv_to_normal(T), 0);
#ifndef RIGHT_HANDED
      L.z *= -1.0;
#endif
    }
    var edge_tint_const = -0.001;
    var cosNL: f32 = dot(N, L.xyz);
    var opacity: f32 = select(0.0, 1.0, cosNL < edge_tint_const);

    if (cosNL > edge_tint_const) {
      // voxel
      var VP2: vec4f = VP;
      VP2.y *= -1.0;
      // rte world-space normalization
      var unormWP : vec4f = uniforms.invViewMtx * VP2;
      var WP: vec3f = (uniforms.wsNormalizationMtx * unormWP).xyz;
      var vxNoise: vec2f =
           vec2f(uint2float(hash(dirId * 2)), uint2float(hash(dirId * 2 + 1)));
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
      VoxelMarchDiagnosticInfo voxel_march_diagnostic_info;
      opacity = max(opacity,
                    uniforms.shadowOpacity.x * voxelShadow(WP, L.xyz, N, vxNoise,
                                                  voxel_march_diagnostic_info));
      heat += voxel_march_diagnostic_info.heat;
#else
      opacity =
          max(opacity, uniforms.shadowOpacity.x * voxelShadow(WP, L.xyz, N, vxNoise));
#endif

      // sss
      var VL : vec3f = (uniforms.viewMtx * L).xyz;
      
      #ifdef RIGHT_HANDED
        var nearPlaneZ: f32 = -2.0 * uniforms.projMtx[3][2] / (uniforms.projMtx[2][2] - 1.0); // retreive camera Z near value
        var farPlaneZ: f32 = -uniforms.projMtx[3][2] / (uniforms.projMtx[2][2] + 1.0);
      #else
        var nearPlaneZ: f32 = -2.0 * uniforms.projMtx[3][2] / (uniforms.projMtx[2][2] + 1.0); // retreive camera Z near value
        var farPlaneZ: f32 = -uniforms.projMtx[3][2] / (uniforms.projMtx[2][2] - 1.0);
      #endif
      var ssShadow: f32 = uniforms.shadowOpacity.y *
                       screenSpaceShadow(VP2.xyz, VL, Resolution, nearPlaneZ, farPlaneZ,
                                         abs(2.0 * noise.z - 1.0));
      opacity = max(opacity, ssShadow);
      shadowAccum += min(1.0 - opacity, cosNL);
      sampleWeight += cosNL;
      // spec shadow
      var VR : vec3f = -(uniforms.viewMtx * vec4f(reflect(-L.xyz, N), 0.0)).xyz;
      specShadowAccum += max(1.0 - (opacity * pow(VR.z, 8.0)), 0.0);
    }
    noise.z = fract(noise.z + GOLD);
  }
#ifdef VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
  fragmentOutputs.color =
      vec4f(shadowAccum / sampleWeight, specShadowAccum / sampleWeight, heat / sampleWeight, 1.0);
#else
  fragmentOutputs.color = vec4f(shadowAccum / sampleWeight, specShadowAccum / sampleWeight, 0.0, 1.0);
#endif
}