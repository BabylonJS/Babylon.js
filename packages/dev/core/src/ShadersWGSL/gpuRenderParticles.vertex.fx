uniform view: mat4x4f;
uniform projection: mat4x4f;
uniform translationPivot: vec2f;
uniform worldOffset: vec3f;
#ifdef LOCAL
uniform emitterWM: mat4x4f;
#endif

// Particles state
attribute position: vec3f;
attribute age: f32;
attribute life: f32;
attribute size: vec3f;
#if !defined(BILLBOARD) || defined(BILLBOARDSTRETCHED_LOCAL)
attribute initialDirection: vec3f;
#endif
#ifdef BILLBOARDSTRETCHED
attribute direction: vec3f;
#endif
attribute angle: f32;
#ifdef ANIMATESHEET
attribute cellIndex: f32;
#endif
attribute offset: vec2f;
attribute uv: vec2f;

varying vUV: vec2f;
varying vColor: vec4f;
varying vPositionW: vec3f;

#if defined(BILLBOARD) && !defined(BILLBOARDY) && !defined(BILLBOARDSTRETCHED)
uniform invView: mat4x4f;
#endif

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

#ifdef COLORGRADIENTS
var colorGradientSamplerSampler: sampler;
var colorGradientSampler: texture_2d<f32>;
#ifdef COLORGRADIENTS_COLOR2
attribute seed: vec4f;
#endif
#else
uniform colorDead: vec4f;
attribute color: vec4f;
#endif

#ifdef ANIMATESHEET
uniform sheetInfos: vec3f;
#endif

#ifdef BILLBOARD
uniform eyePosition: vec3f;
#endif

fn particleBasePosition() -> vec3f {
#ifdef LOCAL
    return (uniforms.emitterWM * vec4f(vertexInputs.position, 1.0)).xyz + uniforms.worldOffset;
#else
    return vertexInputs.position + uniforms.worldOffset;
#endif
}

fn rotate(yaxis: vec3f, rotatedCorner: vec3f) -> vec3f {
    let xaxis: vec3f = normalize(cross(vec3f(0.0, 1.0, 0.0), yaxis));
    let zaxis: vec3f = normalize(cross(yaxis, xaxis));
    let rotMatrix: mat3x3f = mat3x3f(xaxis, yaxis, zaxis);
    return particleBasePosition() + rotMatrix * rotatedCorner;
}

#ifdef BILLBOARDSTRETCHED
fn rotateAlign(toCamera: vec3f, rotatedCorner: vec3f) -> vec3f {
    let normalizedToCamera: vec3f = normalize(toCamera);
#ifdef BILLBOARDSTRETCHED_LOCAL
    let normalizedCrossDirToCamera: vec3f = normalize(cross(normalize(vertexInputs.initialDirection), normalizedToCamera));
    let row1: vec3f = normalize(vertexInputs.initialDirection);
#else
    let normalizedCrossDirToCamera: vec3f = normalize(cross(normalize(vertexInputs.direction), normalizedToCamera));
    let row1: vec3f = normalize(cross(normalizedToCamera, normalizedCrossDirToCamera));
#endif

    let rotMatrix: mat3x3f = mat3x3f(normalizedCrossDirToCamera, row1, normalizedToCamera);
    return particleBasePosition() + rotMatrix * rotatedCorner;
}
#endif

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
#ifdef EMITRATECTRL
    let shouldCullParticle: bool = vertexInputs.life > 0.0 && vertexInputs.age >= vertexInputs.life;
#endif

#ifdef ANIMATESHEET
    let rowOffset: f32 = floor(vertexInputs.cellIndex / uniforms.sheetInfos.z);
    let columnOffset: f32 = vertexInputs.cellIndex - rowOffset * uniforms.sheetInfos.z;
    let uvScale: vec2f = uniforms.sheetInfos.xy;
    let uvOffset: vec2f = vec2f(vertexInputs.uv.x, 1.0 - vertexInputs.uv.y);
    vertexOutputs.vUV = (uvOffset + vec2f(columnOffset, rowOffset)) * uvScale;
#else
    vertexOutputs.vUV = vertexInputs.uv;
#endif

    let ratio: f32 = min(1.0, vertexInputs.age / vertexInputs.life);
#ifdef COLORGRADIENTS
#ifdef COLORGRADIENTS_COLOR2
    let vColor1: vec4f = textureSampleLevel(colorGradientSampler, colorGradientSamplerSampler, vec2f(ratio, 0.25), 0.0);
    let vColor2: vec4f = textureSampleLevel(colorGradientSampler, colorGradientSamplerSampler, vec2f(ratio, 0.75), 0.0);
    vertexOutputs.vColor = mix(vColor1, vColor2, vertexInputs.seed.x);
#else
    vertexOutputs.vColor = textureSampleLevel(colorGradientSampler, colorGradientSamplerSampler, vec2f(ratio, 0.0), 0.0);
#endif
#else
    vertexOutputs.vColor = vertexInputs.color * vec4f(1.0 - ratio) + uniforms.colorDead * vec4f(ratio);
#endif

    let cornerPos: vec2f = (vertexInputs.offset - uniforms.translationPivot) * vertexInputs.size.yz * vertexInputs.size.x;

#ifdef BILLBOARD
    var rotatedCorner: vec4f;
    rotatedCorner.w = 0.0;

#ifdef BILLBOARDY
    rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle);
    rotatedCorner.z = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle);
    rotatedCorner.y = 0.0;
    rotatedCorner.x += uniforms.translationPivot.x;
    rotatedCorner.z += uniforms.translationPivot.y;

    var yaxis: vec3f = vertexInputs.position + uniforms.worldOffset - uniforms.eyePosition;
    yaxis.y = 0.0;
    vertexOutputs.vPositionW = rotate(normalize(yaxis), rotatedCorner.xyz);

    let viewPosition: vec4f = uniforms.view * vec4f(vertexOutputs.vPositionW, 1.0);
#elif defined(BILLBOARDSTRETCHED)
    rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle);
    rotatedCorner.y = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle);
    rotatedCorner.z = 0.0;
    rotatedCorner.x += uniforms.translationPivot.x;
    rotatedCorner.y += uniforms.translationPivot.y;

    let toCamera: vec3f = vertexInputs.position + uniforms.worldOffset - uniforms.eyePosition;
    vertexOutputs.vPositionW = rotateAlign(toCamera, rotatedCorner.xyz);

    let viewPosition: vec4f = uniforms.view * vec4f(vertexOutputs.vPositionW, 1.0);
#else
    rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle);
    rotatedCorner.y = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle);
    rotatedCorner.z = 0.0;
    rotatedCorner.x += uniforms.translationPivot.x;
    rotatedCorner.y += uniforms.translationPivot.y;

    let viewPosition: vec4f = uniforms.view * vec4f(particleBasePosition(), 1.0) + rotatedCorner;
    vertexOutputs.vPositionW = (uniforms.invView * viewPosition).xyz;
#endif

#else
    var rotatedCorner: vec3f;
    rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle);
    rotatedCorner.y = 0.0;
    rotatedCorner.z = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle);
    rotatedCorner.x += uniforms.translationPivot.x;
    rotatedCorner.z += uniforms.translationPivot.y;

    let yaxis: vec3f = normalize(vertexInputs.initialDirection);
    vertexOutputs.vPositionW = rotate(yaxis, rotatedCorner);

    let viewPosition: vec4f = uniforms.view * vec4f(vertexOutputs.vPositionW, 1.0);
#endif

    vertexOutputs.position = uniforms.projection * viewPosition;

#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6) || defined(FOG)
    let worldPos: vec4f = vec4f(vertexOutputs.vPositionW, 1.0);
#endif
    #include<clipPlaneVertex>
    #include<fogVertex>
    #include<logDepthVertex>

#ifdef EMITRATECTRL
    if (shouldCullParticle) {
        vertexOutputs.position = vec4f(0.0, 0.0, 2.0, 1.0);
        vertexOutputs.vColor = vec4f(0.0);
        vertexOutputs.vUV = vec2f(0.0);
        vertexOutputs.vPositionW = vec3f(0.0);
    }
#endif
}
