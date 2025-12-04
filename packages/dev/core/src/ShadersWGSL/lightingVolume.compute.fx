struct Params {
    invViewProjMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    startVertexIndex: u32,
    step: f32,
    tesselation: u32,
    orthoMin: vec3f,
    orthoMax: vec3f,
};

@group(0) @binding(0) var shadowMap : texture_2d<f32>;
@group(0) @binding(1) var<uniform> params : Params;
@group(0) @binding(2) var<storage,read_write> positions : array<f32>;

@compute @workgroup_size(8, 8, 1)
fn updateFarPlaneVertices(@builtin(global_invocation_id) global_id : vec3u) {
    let coord = global_id.xy;

#ifdef KEEP_EDGES
    if (any(coord >= vec2u(params.tesselation)) || any(coord <= vec2u(0))) {
#else
    if (any(coord > vec2u(params.tesselation))) {
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

@compute @workgroup_size(32, 1, 1)
fn updatePlaneVertices(@builtin(global_invocation_id) global_id : vec3u) {
    _ = shadowMap;

    let uindex = global_id.x;
    let index = f32(uindex);

    if (uindex > params.tesselation) {
        return;
    }

    let step = (params.orthoMax.xy - params.orthoMin.xy) / vec2f(f32(params.tesselation));

    // Right face
    var vr = params.invViewMatrix * vec4f(params.orthoMax.x, params.orthoMin.y + step.y * index, params.orthoMin.z, 1.0);
    vr = vr / vr.w;

    positions[uindex * 3 + 0] = vr.x;
    positions[uindex * 3 + 1] = vr.y;
    positions[uindex * 3 + 2] = vr.z;

    // Left face
    var vl = params.invViewMatrix * vec4f(params.orthoMin.x, params.orthoMin.y + step.y * index, params.orthoMin.z, 1.0);
    vl = vl / vl.w;

    positions[uindex * 3 + 0 + (params.tesselation + 1) * 3] = vl.x;
    positions[uindex * 3 + 1 + (params.tesselation + 1) * 3] = vl.y;
    positions[uindex * 3 + 2 + (params.tesselation + 1) * 3] = vl.z;

    // Bottom face
    var vb = params.invViewMatrix * vec4f(params.orthoMin.x + step.x * index, params.orthoMin.y, params.orthoMin.z, 1.0);
    vb = vb / vb.w;

    positions[uindex * 3 + 0 + (params.tesselation + 1) * 6] = vb.x;
    positions[uindex * 3 + 1 + (params.tesselation + 1) * 6] = vb.y;
    positions[uindex * 3 + 2 + (params.tesselation + 1) * 6] = vb.z;

    // Top face
    var vt = params.invViewMatrix * vec4f(params.orthoMin.x + step.x * index, params.orthoMax.y, params.orthoMin.z, 1.0);
    vt = vt / vt.w;

    positions[uindex * 3 + 0 + (params.tesselation + 1) * 9] = vt.x;
    positions[uindex * 3 + 1 + (params.tesselation + 1) * 9] = vt.y;
    positions[uindex * 3 + 2 + (params.tesselation + 1) * 9] = vt.z;
}
