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
uniform mat4 invVPMtx;

#define PI 3.1415927
#define GOLD 0.618034

struct AABB3f
{
    vec3 m_min;
    vec3 m_max;
};

struct Ray
{
    vec3 orig;
    vec3 dir;
    vec3 dir_rcp;
    float t_min;
    float t_max;
};

ivec3 compute_voxel_coords_offset(uint voxel_id)
{
    return ivec3(voxel_id & 1u, (voxel_id >> 1) & 1u, (voxel_id >> 2) & 1u);
}

Ray make_ray(const vec3 origin, const vec3 direction, const float tmin, const float tmax)
{
    Ray ray;
    ray.orig = origin;
    ray.dir = direction;
    ray.dir_rcp = 1.0f / direction;
    ray.t_min = tmin;
    ray.t_max = tmax;
    return ray;
}

bool ray_box_intersection( out float distance_near,
                           out float distance_far,
                           const in AABB3f aabb,
                           const in Ray ray)
{
    vec3 tbot = ray.dir_rcp * (aabb.m_min - ray.orig);
    vec3 ttop = ray.dir_rcp * (aabb.m_max - ray.orig);
    vec3 tmin = min(ttop, tbot);
    vec3 tmax = max(ttop, tbot);
    distance_near = max(ray.t_min, max(tmin.x, max(tmin.y, tmin.z)));
    distance_far = min(ray.t_max, min(tmax.x, min(tmax.y, tmax.z)));
    return distance_near <= distance_far;
}

float sign_force_non_zero(const float f)
{
    if (f != 0.0f)
        return sign(f);

    return 1.0f;
}

void compute_box_normal( out vec3 normal,  const in AABB3f box, const vec3 point_on_surface)
{
    vec3 box_center = 0.5f * (box.m_max + box.m_min);
    vec3 box_diagonal = max(0.5f * abs(box.m_max - box.m_min), 1e-6f);
    vec3 dir = (point_on_surface - box_center) / box_diagonal;
    vec3 dir_abs = abs(dir);
    float max_dir = max(max(dir_abs.x, dir_abs.y), dir_abs.z);

    if (max_dir == dir_abs.x)
    {
        normal = vec3(sign_force_non_zero(dir.x), 0.0f, 0.0f);
    }
    else if (max_dir == dir_abs.y)
    {
        normal = vec3(0.0f, sign_force_non_zero(dir.y), 0.0f);
    }
    else
    {
        normal = vec3(0.0f, 0.0f, sign_force_non_zero(dir.z));
    }
}

bool ray_triangle_intersection( out vec2 barys, out float distance, const vec3 ray_orig, const vec3 ray_dir, const mat3 vertices)
{
    vec3 vAB = vertices[1] - vertices[0];
    vec3 vAC = vertices[2] - vertices[0];

    vec3 h = cross(ray_dir, vAC);
    float det = dot(vAB, h);
    float det_rcp = 1.0f / det;

    float eps = 0.0f;
    float one_plus_eps = 1.0f + eps;

    vec3 s = ray_orig - vertices[0];
    float u = det_rcp * dot(s, h);
    if (u < -eps || u > one_plus_eps)
        return false;

    vec3 q = cross(s, vAB);
    float v = det_rcp * dot(ray_dir, q);
    if (v < -eps || (u + v) > one_plus_eps)
        return false;

    barys = vec2(u, v);
    distance = det_rcp * dot(vAC, q);
    return true;
}

// NOTE: VOXEL_MARCHING_NUM_MIPS refers to physical (rather than logical) mips, since mip 0 contains a 2x2x2 block of voxels
#define VOXEL_MARCHING_NODE_BITS VOXEL_MARCHING_NUM_MIPS
#define VOXEL_MARCHING_STACK_SIZE ((VOXEL_MARCHING_NUM_MIPS * 3u) + 1u)

struct VoxelTraverseStack {
    // 4 is the max number of octants a ray can intersect
    // Each time we traverse a mip level in the graph, it pops 1 node, then pushes up to 4 nodes on the stack
    // Thus the worst case stack size is 3 nodes for the first NUM_MIPS - 1 mips, and 4 for the last mip
    // So, for a logical size of 128, we have 7 mip levels, which translates to a stack size of 22
    uint stack[VOXEL_MARCHING_STACK_SIZE];
    int stack_level;
};

VoxelTraverseStack voxel_traverse_stack;

void initialize_voxel_traverse_stack() {
    voxel_traverse_stack.stack_level = 0;
}

void voxel_stack_push(ivec3 coords, uint lod) {
  voxel_traverse_stack.stack[voxel_traverse_stack.stack_level++] = uint(coords.x) | (uint(coords.y) << VOXEL_MARCHING_NODE_BITS) |
        (uint(coords.z) << (VOXEL_MARCHING_NODE_BITS * 2u)) | (lod << (VOXEL_MARCHING_NODE_BITS * 3u));
}

void voxel_stack_pop(out ivec3 coords, out uint lod) {
    uint node = voxel_traverse_stack.stack[--voxel_traverse_stack.stack_level];
    uint coord_mask = (1u << VOXEL_MARCHING_NODE_BITS) - 1u;

    coords = ivec3(node & coord_mask, (node >> VOXEL_MARCHING_NODE_BITS) & coord_mask, (node >> (VOXEL_MARCHING_NODE_BITS * 2u)) & coord_mask);
    lod = uint(node >> (VOXEL_MARCHING_NODE_BITS * 3u));
}

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
struct VoxelMarchDiagnosticInfo {
    float heat;
    ivec3 voxel_intersect_coords;
};
#endif

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
bool hierarchical_march(Ray ray_vs, out VoxelMarchDiagnosticInfo voxel_march_diagnostic_info) {
#else
bool hierarchical_march(Ray ray_vs) {
#endif
    initialize_voxel_traverse_stack();

    voxel_stack_push(ivec3(0), VOXEL_MARCHING_NUM_MIPS);
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
    uint steps = 0;
#endif
    while (voxel_traverse_stack.stack_level > 0) {
        ivec3 node_coords;
        uint lod;
        voxel_stack_pop(node_coords, lod);

        if (lod == 0u) {
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
            voxel_march_diagnostic_info.heat = float(steps) / VOXEL_MARCHING_STACK_SIZE;
            voxel_march_diagnostic_info.voxel_intersect_coords = node_coords;
#endif
            return true;
        }

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
        ++steps;
#endif

        // lod is logical lod. Physical lod is shifted down one
        uint node_mask = texelFetch(voxelGridSampler, node_coords, int(lod - 1u)).r > 0.0 ? 1u : 0u;

        --lod;
        // Get node bounds in voxel space at highest resolution
        float inv_res = 1.0 / float(1u << (VOXEL_MARCHING_NUM_MIPS - lod));

        ivec3 base_octant_coords = node_coords << 1u;

        ivec3 pos = ivec3(greaterThanEqual(ray_vs.dir, vec3(0.0)));
        uint start_octant_id = uint(pos.x | pos.y << 1 | pos.z << 2);

        for (uint i = 0u; i < 8u; ++i)
        {
            uint octant_id = start_octant_id ^ i;
            if (bool(node_mask & (1u << octant_id)))
            {
                ivec3 octant_coords = base_octant_coords + compute_voxel_coords_offset(octant_id);

                AABB3f octant_aabb;
                octant_aabb.m_min = vec3(octant_coords) * inv_res;
                octant_aabb.m_max = vec3(octant_coords + 1) * inv_res;

                float near, far;
                if (ray_box_intersection(near, far, octant_aabb, ray_vs))
                    voxel_stack_push(octant_coords, lod);
            }
        }
    }
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
    voxel_march_diagnostic_info.heat = float(steps) / VOXEL_MARCHING_STACK_SIZE;
#endif

    return false;
}

#define VOXEL_GRID_RESOLUTION 64

bool voxel_pos_in_bounds(ivec3 voxel_pos)
{
    return all(greaterThanEqual(voxel_pos, ivec3(0))) && all(lessThan(voxel_pos, ivec3(VOXEL_GRID_RESOLUTION)));
}

uint compute_packed_voxel_id(const ivec3 logical_voxel_coords)
{
    return uint((logical_voxel_coords.x & 1) | ((logical_voxel_coords.y & 1) << 1) | ((logical_voxel_coords.z & 1) << 2));
}

// Convert from logical voxel coordinates to physical texel coordinate + access mask
ivec3 compute_physical_voxel_texcoords(const ivec3 logical_voxel_coords, out uint mask)
{
    mask = 1u << compute_packed_voxel_id(logical_voxel_coords);

    return logical_voxel_coords >> 1;
}

#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
bool dda_march(Ray ray_vs, out VoxelMarchDiagnosticInfo voxel_march_diagnostic_info) {
#else
bool dda_march(Ray ray_vs) {
#endif
    // March voxels using DDA: "Fast Voxel Traversal Algorithm" (http://www.cse.yorku.ca/~amana/research/grid.pdf)
    vec3 origin_vs = float(VOXEL_GRID_RESOLUTION) * (ray_vs.orig + ray_vs.dir * ray_vs.t_min);

    ivec3 voxel_pos = ivec3(origin_vs);
    ivec3 voxel_step = ivec3(sign(ray_vs.dir));

    // Ray-lengths per voxel in each coordinate, ie the distances in t that you have to advance the ray to equal one voxel in each axis
    vec3 t_delta = abs(ray_vs.dir_rcp);

    float t_min = float(VOXEL_GRID_RESOLUTION) * ray_vs.t_min;
    float t_max = float(VOXEL_GRID_RESOLUTION) * ray_vs.t_max;

    // t_lengths is the ray length we have traversed by incrementing voxel_pos in each axis
    // We use this to determine which axis we will advance voxel_pos next
    // Initialize to t_min in all directions, plus enough such that the ray starts on a voxel boundary
    vec3 t_lengths = t_delta * vec3(abs(voxel_pos + max(voxel_step, 0))) - origin_vs + vec3(t_min);

    ivec3 texel_coords = ivec3(-1);
    uint texel_mask = 0u;

    // Stop marching once we've advanced enough voxels in all coordinates to extend the ray up to t_max
    while (any(lessThanEqual(t_lengths, vec3(t_max))))
    {
        if (voxel_pos_in_bounds(voxel_pos))
        {
            uint voxel_mask;
            ivec3 new_texel_coords = compute_physical_voxel_texcoords(voxel_pos, voxel_mask);

            if (texel_coords != new_texel_coords)
            {
                texel_coords = new_texel_coords;
                texel_mask = texelFetch(voxelGridSampler, texel_coords, 0).r > 0.0 ? 1u : 0u;
            }

            if (bool(texel_mask & voxel_mask))
            {
#if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
                voxel_march_diagnostic_info.voxel_intersect_coords = voxel_pos;
#endif
                return true;
            }
        }

        // Only increment voxel_pos in the direction of the smallest distance to the next voxel boundary, which is the smallest t_lengths

        // cmp holds a 1 for the axes in which to advance
        ivec3 cmp = ivec3(step(t_lengths.xyz, t_lengths.zxy)) * ivec3(step(t_lengths.xyz, t_lengths.yzx));

        // Once the axes are chosen, increment the ray-distance traveled via this axis (t_lengths)
        t_lengths += vec3(cmp) * t_delta;
        // And increment voxel_pos along that axis
        voxel_pos += ivec3(cmp * voxel_step);
    }
    return false;
}

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

// Super simple voxel traversal. Just start at the t_min and step along the ray
bool anyHitVoxelsSimple(const Ray ray_vs) {
  const int maxSteps = 100;
  float stepSize = (ray_vs.t_max - ray_vs.t_min) / float(maxSteps);
  vec3 currentPosition = ray_vs.orig + ray_vs.dir * ray_vs.t_min;
  vec3 step = ray_vs.dir * stepSize;
  if (ray_vs.t_min > ray_vs.t_max || ray_vs.t_max < 0.0) {
    return false;
  }
  for (int i = 0; i < maxSteps; ++i) {
    float voxelValue = texture(voxelGridSampler, currentPosition).r;
    if (voxelValue > 0.0) {
      return true;
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

    if (max(max(mint.x, mint.y), mint.z) < min(min(midt.x, midt.y), midt.z) && (nodeMask >> (voxel0) & 1) != 0) {
      PUSH(packedCoords0);
    }
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

float voxelShadow(vec3 wsOrigin, vec3 wsDirection, vec3 wsNormal, vec2 DitherNoise) {
    float vxResolution = float(textureSize(voxelGridSampler, 0).x);
    vec3 T, B;
    genTB(wsDirection, T, B);
    vec2 DitherXY = sqrt(DitherNoise.x) * vec2(cos(2.0 * PI * DitherNoise.y),
                                                sin(2.0 * PI * DitherNoise.y));
    vec3 Dithering =
        (2.0 * wsNormal + 3.0 * wsDirection + DitherXY.x * T + DitherXY.y * B) /
        vxResolution;
    vec3 O = 0.5 * wsOrigin + 0.5 + Dithering;

    Ray ray_vs = make_ray(O, wsDirection, 0.0, 10.0);

    // Early out for rays which miss the scene bounding box, common in ground plane
    AABB3f voxel_aabb;
    voxel_aabb.m_min = vec3(0);
    voxel_aabb.m_max = vec3(1);

    float near, far;
    if (!ray_box_intersection(near, far, voxel_aabb, ray_vs))
      return 0.0;

    ray_vs.t_min = max(ray_vs.t_min, near);
    ray_vs.t_max = min(ray_vs.t_max, far);

    // #if VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION
    //     return hierarchical_march(ray_vs, out_diagnostic_info) ? 1.0f : 0.0f;
    // #else
    //     return hierarchical_march(ray_vs) ? 1.0f : 0.0f;
    // #endif

    return anyHitVoxelsSimple(ray_vs) ? 1.0f : 0.0f;
}

void main(void) {
  uint nbDirs = uint(SHADOWdirs);
  uint frameId = uint(SHADOWframe);
  int downscale = int(SHADOWdownscale);
  float envRot = SHADOWenvRot;

  vec2 Resolution = vec2(textureSize(depthSampler, 0));
  ivec2 currentPixel = ivec2(vUV * Resolution);
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
  depth = depth * 2.0 - 1.0;
  vec2 temp = (vec2(PixelCoord) + vec2(0.5)) * 2.0 / Resolution - vec2(1.0);
  vec2 temp2 = vUV * vec2(2.0) - vec2(1.0);
  vec4 VP = invProjMtx * vec4(temp.x, -temp.y, depth, 1.0);
  VP /= VP.w;

  N = normalize(N);
  vec3 noise = texelFetch(blueNoiseSampler, PixelCoord & 0xFF, 0).xyz;
  noise.z = fract(noise.z + goldenSequence(frameId * nbDirs));

  vec2 linearZ_alpha = texelFetch(linearDepthSampler, PixelCoord, 0).xy;
  linearZ_alpha.x *= -1.0;

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
      vec4 unormWP = invViewMtx * VP2;
      // vec4 unormWP = texelFetch(worldPositionSampler, PixelCoord, 0);
      vec3 WP = (wsNormalizationMtx * unormWP).xyz;
      vec2 vxNoise =
          vec2(uint2float(hash(dirId * 2u)), uint2float(hash(dirId * 2u + 1u)));
      opacity = max(opacity, voxelShadow(WP, L.xyz, N, vxNoise));

      // sss
      vec3 VL = (viewMtx * L).xyz;
      VL.y *= -1.0;
      float nearPlaneZ =
          -projMtx[3][2] / projMtx[2][2]; // retreive camera Z near value
      float ssShadow = screenSpaceShadow(VP2.xyz, VL, Resolution, nearPlaneZ,
                                         abs(2.0 * noise.z - 1.0));
      opacity = max(opacity, ssShadow);
      shadowAccum += min(1.0 - opacity, smoothstep(-0.1, 0.2, cosNL));
      // } else if (linearZ_alpha.y > 0.0) {
      //   shadowAccum += opacity / float(nbDirs);
    } else {
      shadowAccum += 1.0; // min(1.0 - opacity, smoothstep(-0.1, 0.2, cosNL));
    }
    noise.z = fract(noise.z + GOLD);
  }

  gl_FragColor = vec4(shadowAccum / float(nbDirs), 1.0, 0.0, 1.0);
  // gl_FragColor = vec4(1.0, 1.0, 0.0, 0.0);
}