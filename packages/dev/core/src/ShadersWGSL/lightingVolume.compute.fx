struct Params {
    invViewProjMatrix : mat4x4f,
    startVertexIndex: u32,
    step: f32,
    tesselation: u32,
};

@group(0) @binding(0) var shadowMap : texture_2d<f32>;
@group(0) @binding(1) var<uniform> params : Params;
@group(0) @binding(2) var<storage,read_write> positions : array<f32>;

@compute @workgroup_size(8, 8, 1)

fn main(@builtin(global_invocation_id) global_id : vec3u) {
    let coord = global_id.xy;

#ifdef KEEP_EDGES
    if (any(coord >= vec2u(params.tesselation)) || any(coord <= vec2u(0))) {
#else
    if (any(coord >= vec2u(params.tesselation + 1))) {
#endif
        return;
    }
   
    let stepY = floor(params.step * f32(coord.y));
    let depthCoord = vec2u(u32(floor(f32(coord.x) * params.step)), u32(stepY));

    var depth = textureLoad(shadowMap, depthCoord, 0).r;
#ifdef MOVE_FAR_DEPTH_TO_NEAR
    if (depth == 1.0) {
        depth = 0.0;
    }
#endif

    let halfTesselation = f32(params.tesselation >> 1);

    let ndc = vec4f((f32(coord.x) - halfTesselation) / halfTesselation, (f32(coord.y) - halfTesselation) / halfTesselation, depth, 1.0);

    var worldCoords = params.invViewProjMatrix * ndc;

    let idx = params.startVertexIndex + (coord.y * (params.tesselation + 1) + coord.x) * 3;

    positions[idx] = worldCoords.x / worldCoords.w;
    positions[idx + 1] = worldCoords.y / worldCoords.w;
    positions[idx + 2] = worldCoords.z / worldCoords.w;
}
