/** This file must only contain pure code and pure imports */

/**
 * Shared shader names for the SOG -> decoded work-buffer copy pass.
 */
export const GaussianSplattingWorkBufferShaderName = "gsSogDecodeToWorkBuffer";

/**
 * Pass-through vertex shader (GLSL): the geometry is a fullscreen triangle already in NDC.
 */
export const GaussianSplattingWorkBufferVertexShaderGLSL = `precision highp float;
attribute vec3 position;
void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * Fragment shader (GLSL/WebGL2): decodes one SOG source file into the decoded GS work-buffer layout,
 * writing each splat into its allocated pixel. Mirrors the USE_SOG decode in ShadersInclude/gaussianSplatting.fx
 * but outputs the decoded MRT (center, covA, covB, color) consumed by the standard (non-SOG) draw path.
 *
 * MRT layout: 0 = center (x,y,z,1), 1 = covA (Sigma00,01,02,11), 2 = covB (Sigma12,22,0,0), 3 = color (rgba).
 */
export const GaussianSplattingWorkBufferFragmentShaderGLSL = `precision highp float;
precision highp int;

uniform sampler2D sogMeansLTex;
uniform sampler2D sogMeansUTex;
uniform sampler2D sogScalesTex;
uniform sampler2D sogQuatsTex;
uniform sampler2D sogSh0Tex;
uniform sampler2D sogCodebookTex;

uniform vec3 sogMeansMin;
uniform vec3 sogMeansMax;
uniform vec3 sogScalesMin;
uniform vec3 sogScalesMax;
uniform vec4 sogSh0Min;
uniform vec4 sogSh0Max;
uniform int uVersion;
uniform int uOffset;
uniform int uCount;
uniform int uDestWidth;
uniform int uSrcWidth;

layout(location = 0) out vec4 glFragData[4];

mat3 transposeM(mat3 m) {
    return mat3(m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]);
}

void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    int global = p.y * uDestWidth + p.x;
    if (global < uOffset || global >= uOffset + uCount) {
        discard;
    }
    int k = global - uOffset;
    ivec2 src = ivec2(k - (k / uSrcWidth) * uSrcWidth, k / uSrcWidth);

    vec3 mL = texelFetch(sogMeansLTex, src, 0).xyz;
    vec3 mU = texelFetch(sogMeansUTex, src, 0).xyz;
    vec3 sRaw = texelFetch(sogScalesTex, src, 0).xyz;
    vec4 qRaw = texelFetch(sogQuatsTex, src, 0);
    vec4 c0 = texelFetch(sogSh0Tex, src, 0);

    // Position: q16 = (u<<8)|l normalized; n = lerp(min,max,q16); pos = sign(n)*(exp(|n|)-1)
    vec3 q16 = (mU * 256.0 + mL) * (255.0 / 65535.0);
    vec3 nPos = mix(sogMeansMin, sogMeansMax, q16);
    vec3 center = sign(nPos) * (exp(abs(nPos)) - vec3(1.0));

    // Scale (v1: lerp+exp ; v2: codebook lookup)
    vec3 splatScale;
    if (uVersion == 2) {
        vec3 sIdx = floor(sRaw * 255.0 + 0.5);
        splatScale.x = exp(texelFetch(sogCodebookTex, ivec2(int(sIdx.x), 0), 0).r);
        splatScale.y = exp(texelFetch(sogCodebookTex, ivec2(int(sIdx.y), 0), 0).r);
        splatScale.z = exp(texelFetch(sogCodebookTex, ivec2(int(sIdx.z), 0), 0).r);
    } else {
        splatScale = exp(mix(sogScalesMin, sogScalesMax, sRaw));
    }

    // Quaternion (largest-omitted, mode in alpha as 252 + omitted-index)
    const float invSqrt2 = 0.70710678118;
    vec3 qabc = (qRaw.xyz - vec3(0.5)) * 2.0 * invSqrt2;
    int qMode = int(qRaw.w * 255.0 + 0.5) - 252;
    float qd = sqrt(max(0.0, 1.0 - dot(qabc, qabc)));
    vec4 quat;
    if (qMode == 0) {
        quat = vec4(qd, qabc.x, qabc.y, qabc.z);
    } else if (qMode == 1) {
        quat = vec4(qabc.x, qd, qabc.y, qabc.z);
    } else if (qMode == 2) {
        quat = vec4(qabc.x, qabc.y, qd, qabc.z);
    } else {
        quat = vec4(qabc.x, qabc.y, qabc.z, qd);
    }

    float qw = quat.x, qx = quat.y, qy = quat.z, qz = quat.w;
    mat3 R = mat3(
        1.0 - 2.0 * (qy * qy + qz * qz), 2.0 * (qx * qy + qw * qz), 2.0 * (qx * qz - qw * qy),
        2.0 * (qx * qy - qw * qz), 1.0 - 2.0 * (qx * qx + qz * qz), 2.0 * (qy * qz + qw * qx),
        2.0 * (qx * qz + qw * qy), 2.0 * (qy * qz - qw * qx), 1.0 - 2.0 * (qx * qx + qy * qy)
    );
    mat3 S2 = mat3(
        4.0 * splatScale.x * splatScale.x, 0.0, 0.0,
        0.0, 4.0 * splatScale.y * splatScale.y, 0.0,
        0.0, 0.0, 4.0 * splatScale.z * splatScale.z
    );
    mat3 Sigma = R * S2 * transposeM(R);

    // Color (sh0)
    const float SH_C0 = 0.28209479177387814;
    vec3 colRgb;
    float colA;
    if (uVersion == 2) {
        vec3 c3;
        c3.x = texelFetch(sogCodebookTex, ivec2(256 + int(c0.x * 255.0 + 0.5), 0), 0).r;
        c3.y = texelFetch(sogCodebookTex, ivec2(256 + int(c0.y * 255.0 + 0.5), 0), 0).r;
        c3.z = texelFetch(sogCodebookTex, ivec2(256 + int(c0.z * 255.0 + 0.5), 0), 0).r;
        colRgb = vec3(0.5) + c3 * SH_C0;
        colA = c0.w;
    } else {
        vec4 cLerp = mix(sogSh0Min, sogSh0Max, c0);
        colRgb = vec3(0.5) + cLerp.xyz * SH_C0;
        colA = 1.0 / (1.0 + exp(-cLerp.w));
    }

    glFragData[0] = vec4(center, 1.0);
    glFragData[1] = vec4(Sigma[0][0], Sigma[0][1], Sigma[0][2], Sigma[1][1]);
    glFragData[2] = vec4(Sigma[1][2], Sigma[2][2], 0.0, 0.0);
    glFragData[3] = vec4(colRgb, colA);
}
`;

/**
 * Pass-through vertex shader (WGSL).
 */
export const GaussianSplattingWorkBufferVertexShaderWGSL = `
attribute position : vec3<f32>;
@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    vertexOutputs.position = vec4<f32>(input.position.xy, 0.0, 1.0);
}
`;

/**
 * Fragment shader (WGSL/WebGPU) — same decode as the GLSL variant, writing 4 MRT attachments.
 */
export const GaussianSplattingWorkBufferFragmentShaderWGSL = `
var sogMeansLTexSampler : sampler;
var sogMeansLTex : texture_2d<f32>;
var sogMeansUTexSampler : sampler;
var sogMeansUTex : texture_2d<f32>;
var sogScalesTexSampler : sampler;
var sogScalesTex : texture_2d<f32>;
var sogQuatsTexSampler : sampler;
var sogQuatsTex : texture_2d<f32>;
var sogSh0TexSampler : sampler;
var sogSh0Tex : texture_2d<f32>;
var sogCodebookTexSampler : sampler;
var sogCodebookTex : texture_2d<f32>;

uniform sogMeansMin : vec3<f32>;
uniform sogMeansMax : vec3<f32>;
uniform sogScalesMin : vec3<f32>;
uniform sogScalesMax : vec3<f32>;
uniform sogSh0Min : vec4<f32>;
uniform sogSh0Max : vec4<f32>;
uniform uVersion : i32;
uniform uOffset : i32;
uniform uCount : i32;
uniform uDestWidth : i32;
uniform uSrcWidth : i32;

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
    let p : vec2<i32> = vec2<i32>(i32(fragmentInputs.position.x), i32(fragmentInputs.position.y));
    let global : i32 = p.y * uniforms.uDestWidth + p.x;
    if (global < uniforms.uOffset || global >= uniforms.uOffset + uniforms.uCount) {
        discard;
    }
    let k : i32 = global - uniforms.uOffset;
    let src : vec2<i32> = vec2<i32>(k - (k / uniforms.uSrcWidth) * uniforms.uSrcWidth, k / uniforms.uSrcWidth);

    let mL : vec3<f32> = textureLoad(sogMeansLTex, src, 0).xyz;
    let mU : vec3<f32> = textureLoad(sogMeansUTex, src, 0).xyz;
    let sRaw : vec3<f32> = textureLoad(sogScalesTex, src, 0).xyz;
    let qRaw : vec4<f32> = textureLoad(sogQuatsTex, src, 0);
    let c0 : vec4<f32> = textureLoad(sogSh0Tex, src, 0);

    let q16 : vec3<f32> = (mU * 256.0 + mL) * (255.0 / 65535.0);
    let nPos : vec3<f32> = mix(uniforms.sogMeansMin, uniforms.sogMeansMax, q16);
    let center : vec3<f32> = sign(nPos) * (exp(abs(nPos)) - vec3<f32>(1.0));

    var splatScale : vec3<f32>;
    if (uniforms.uVersion == 2) {
        let sIdx : vec3<f32> = floor(sRaw * 255.0 + 0.5);
        splatScale.x = exp(textureLoad(sogCodebookTex, vec2<i32>(i32(sIdx.x), 0), 0).r);
        splatScale.y = exp(textureLoad(sogCodebookTex, vec2<i32>(i32(sIdx.y), 0), 0).r);
        splatScale.z = exp(textureLoad(sogCodebookTex, vec2<i32>(i32(sIdx.z), 0), 0).r);
    } else {
        splatScale = exp(mix(uniforms.sogScalesMin, uniforms.sogScalesMax, sRaw));
    }

    let invSqrt2 : f32 = 0.70710678118;
    let qabc : vec3<f32> = (qRaw.xyz - vec3<f32>(0.5)) * 2.0 * invSqrt2;
    let qMode : i32 = i32(qRaw.w * 255.0 + 0.5) - 252;
    let qd : f32 = sqrt(max(0.0, 1.0 - dot(qabc, qabc)));
    var quat : vec4<f32>;
    if (qMode == 0) {
        quat = vec4<f32>(qd, qabc.x, qabc.y, qabc.z);
    } else if (qMode == 1) {
        quat = vec4<f32>(qabc.x, qd, qabc.y, qabc.z);
    } else if (qMode == 2) {
        quat = vec4<f32>(qabc.x, qabc.y, qd, qabc.z);
    } else {
        quat = vec4<f32>(qabc.x, qabc.y, qabc.z, qd);
    }

    let qw : f32 = quat.x;
    let qx : f32 = quat.y;
    let qy : f32 = quat.z;
    let qz : f32 = quat.w;
    let R : mat3x3<f32> = mat3x3<f32>(
        1.0 - 2.0 * (qy * qy + qz * qz), 2.0 * (qx * qy + qw * qz), 2.0 * (qx * qz - qw * qy),
        2.0 * (qx * qy - qw * qz), 1.0 - 2.0 * (qx * qx + qz * qz), 2.0 * (qy * qz + qw * qx),
        2.0 * (qx * qz + qw * qy), 2.0 * (qy * qz - qw * qx), 1.0 - 2.0 * (qx * qx + qy * qy)
    );
    let S2 : mat3x3<f32> = mat3x3<f32>(
        4.0 * splatScale.x * splatScale.x, 0.0, 0.0,
        0.0, 4.0 * splatScale.y * splatScale.y, 0.0,
        0.0, 0.0, 4.0 * splatScale.z * splatScale.z
    );
    let Sigma : mat3x3<f32> = R * S2 * transpose(R);

    let SH_C0 : f32 = 0.28209479177387814;
    var colRgb : vec3<f32>;
    var colA : f32;
    if (uniforms.uVersion == 2) {
        var c3 : vec3<f32>;
        c3.x = textureLoad(sogCodebookTex, vec2<i32>(256 + i32(c0.x * 255.0 + 0.5), 0), 0).r;
        c3.y = textureLoad(sogCodebookTex, vec2<i32>(256 + i32(c0.y * 255.0 + 0.5), 0), 0).r;
        c3.z = textureLoad(sogCodebookTex, vec2<i32>(256 + i32(c0.z * 255.0 + 0.5), 0), 0).r;
        colRgb = vec3<f32>(0.5) + c3 * SH_C0;
        colA = c0.w;
    } else {
        let cLerp : vec4<f32> = mix(uniforms.sogSh0Min, uniforms.sogSh0Max, c0);
        colRgb = vec3<f32>(0.5) + cLerp.xyz * SH_C0;
        colA = 1.0 / (1.0 + exp(-cLerp.w));
    }

    fragmentOutputs.fragData0 = vec4<f32>(center, 1.0);
    fragmentOutputs.fragData1 = vec4<f32>(Sigma[0][0], Sigma[0][1], Sigma[0][2], Sigma[1][1]);
    fragmentOutputs.fragData2 = vec4<f32>(Sigma[1][2], Sigma[2][2], 0.0, 0.0);
    fragmentOutputs.fragData3 = vec4<f32>(colRgb, colA);
}
`;
