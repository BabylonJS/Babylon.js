// Attributes
attribute position: vec3f;
attribute normal: vec3f;
attribute uv: vec2f;

// Uniforms
uniform world: mat4x4f;
uniform viewProjection: mat4x4f;

// Output
varying vUV: vec2f;

#ifdef BORDER
varying scaleInfo: vec2f;
uniform borderWidth: f32;
uniform scaleFactor: vec3f;
#endif

#ifdef HOVERLIGHT
varying worldPosition: vec3f;
#endif

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    vertexOutputs.vUV = vertexInputs.uv;

#ifdef BORDER
    var scale: vec3f = uniforms.scaleFactor;
    let minScale: f32 = min(min(scale.x, scale.y), scale.z);
    let maxScale: f32 = max(max(scale.x, scale.y), scale.z);
    let minOverMiddleScale: f32 = minScale / (scale.x + scale.y + scale.z - minScale - maxScale);
    let areaYZ: f32 = scale.y * scale.z;
    let areaXZ: f32 = scale.x * scale.z;
    let areaXY: f32 = scale.x * scale.y;
    var scaledBorderWidth: f32 = uniforms.borderWidth;

    if (abs(vertexInputs.normal.x) == 1.0) {
        scale.x = scale.y;
        scale.y = scale.z;

        if (areaYZ > areaXZ && areaYZ > areaXY) {
            scaledBorderWidth *= minOverMiddleScale;
        }
    } else if (abs(vertexInputs.normal.y) == 1.0) {
        scale.x = scale.z;

        if (areaXZ > areaXY && areaXZ > areaYZ) {
            scaledBorderWidth *= minOverMiddleScale;
        }
    } else {
        if (areaXY > areaYZ && areaXY > areaXZ) {
            scaledBorderWidth *= minOverMiddleScale;
        }
    }

    let scaleRatio: f32 = min(scale.x, scale.y) / max(scale.x, scale.y);
    if (scale.x > scale.y) {
        vertexOutputs.scaleInfo = vec2f(1.0 - scaledBorderWidth * scaleRatio, 1.0 - scaledBorderWidth);
    } else {
        vertexOutputs.scaleInfo = vec2f(1.0 - scaledBorderWidth, 1.0 - scaledBorderWidth * scaleRatio);
    }
#endif

    let worldPos: vec4f = uniforms.world * vec4f(vertexInputs.position, 1.0);

#ifdef HOVERLIGHT
    vertexOutputs.worldPosition = worldPos.xyz;
#endif

    vertexOutputs.position = uniforms.viewProjection * worldPos;
}
