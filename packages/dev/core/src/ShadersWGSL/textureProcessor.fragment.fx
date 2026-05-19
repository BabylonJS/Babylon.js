// Texture processing fragment shader (WGSL)
// Supports multiply, max, lerp, and invert operations with texture/constant/combined operands.
// See GLSL counterpart for define documentation (OPERAND_A/B_SRGB, OPERAND_A/B_CHANNEL_R/G/B/A, LERP_T_SRGB, LERP_T_CHANNEL_R/G/B/A, OUTPUT_SRGB, OP_INVERT, and INVERT_R/G/B/A also apply).

#ifdef OPERAND_A_TEXTURE
var textureASampler: sampler;
var textureA: texture_2d<f32>;
#endif
#ifdef OPERAND_B_TEXTURE
var textureBSampler: sampler;
var textureB: texture_2d<f32>;
#endif
#if defined(OP_LERP) && defined(LERP_T_TEXTURE)
var textureTSampler: sampler;
var textureT: texture_2d<f32>;
#endif

#ifdef OPERAND_A_MATRIX
uniform textureAMatrix: mat4x4f;
#endif
#ifdef OPERAND_B_MATRIX
uniform textureBMatrix: mat4x4f;
#endif
#if defined(OP_LERP) && defined(LERP_T_MATRIX)
uniform textureTMatrix: mat4x4f;
#endif

#if !defined(OPERAND_A_TEXTURE) || defined(OPERAND_A_FACTOR)
uniform factorA: vec4f;
#endif
#if !defined(OPERAND_B_TEXTURE) || defined(OPERAND_B_FACTOR)
uniform factorB: vec4f;
#endif
#if defined(OP_LERP) && (!defined(LERP_T_TEXTURE) || defined(LERP_T_FACTOR))
uniform factorT: vec4f;
#endif

varying vUV: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let uv: vec2f = input.vUV;

    // Evaluate operand A
    #ifdef OPERAND_A_TEXTURE
    #ifdef OPERAND_A_MATRIX
    var a: vec4f = textureSample(textureA, textureASampler, (uniforms.textureAMatrix * vec4f(uv, 0.0, 1.0)).xy);
    #else
    var a: vec4f = textureSample(textureA, textureASampler, uv);
    #endif
    #ifdef OPERAND_A_SRGB
    a = vec4f(mix(a.rgb / vec3f(12.92), pow((a.rgb + vec3f(0.055)) / vec3f(1.055), vec3f(2.4)), step(vec3f(0.04045), a.rgb)), a.a);
    #endif
    #ifdef OPERAND_A_CHANNEL_R
    a = vec4f(a.rrr, a.a);
    #elif defined(OPERAND_A_CHANNEL_G)
    a = vec4f(a.ggg, a.a);
    #elif defined(OPERAND_A_CHANNEL_B)
    a = vec4f(a.bbb, a.a);
    #elif defined(OPERAND_A_CHANNEL_A)
    a = a.aaaa;
    #endif
    #ifdef OPERAND_A_FACTOR
    a *= uniforms.factorA;
    #endif
    #else
    let a: vec4f = uniforms.factorA;
    #endif

    // Evaluate operand B
    #ifdef OPERAND_B_TEXTURE
    #ifdef OPERAND_B_MATRIX
    var b: vec4f = textureSample(textureB, textureBSampler, (uniforms.textureBMatrix * vec4f(uv, 0.0, 1.0)).xy);
    #else
    var b: vec4f = textureSample(textureB, textureBSampler, uv);
    #endif
    #ifdef OPERAND_B_SRGB
    b = vec4f(mix(b.rgb / vec3f(12.92), pow((b.rgb + vec3f(0.055)) / vec3f(1.055), vec3f(2.4)), step(vec3f(0.04045), b.rgb)), b.a);
    #endif
    #ifdef OPERAND_B_CHANNEL_R
    b = vec4f(b.rrr, b.a);
    #elif defined(OPERAND_B_CHANNEL_G)
    b = vec4f(b.ggg, b.a);
    #elif defined(OPERAND_B_CHANNEL_B)
    b = vec4f(b.bbb, b.a);
    #elif defined(OPERAND_B_CHANNEL_A)
    b = b.aaaa;
    #endif
    #ifdef OPERAND_B_FACTOR
    b *= uniforms.factorB;
    #endif
    #else
    let b: vec4f = uniforms.factorB;
    #endif

    // Apply operation
    #ifdef OP_CHANNEL_MAX
    var _cmax: f32 = max(max(a.r, a.g), a.b);
    #ifdef CHANNEL_MAX_INCLUDE_ALPHA
    _cmax = max(_cmax, a.a);
    var result: vec4f = vec4f(_cmax, _cmax, _cmax, _cmax);
    #else
    var result: vec4f = vec4f(_cmax, _cmax, _cmax, a.a);
    #endif
    #elif defined(OP_INVERT)
    var _ir: f32 = a.r; var _ig: f32 = a.g; var _ib: f32 = a.b; var _ia: f32 = a.a;
    #ifdef INVERT_R
    _ir = 1.0 - _ir;
    #endif
    #ifdef INVERT_G
    _ig = 1.0 - _ig;
    #endif
    #ifdef INVERT_B
    _ib = 1.0 - _ib;
    #endif
    #ifdef INVERT_A
    _ia = 1.0 - _ia;
    #endif
    var result: vec4f = vec4f(_ir, _ig, _ib, _ia);
    #elif defined(OP_LERP)
    #ifdef LERP_T_TEXTURE
    #ifdef LERP_T_MATRIX
    var t: vec4f = textureSample(textureT, textureTSampler, (uniforms.textureTMatrix * vec4f(uv, 0.0, 1.0)).xy);
    #else
    var t: vec4f = textureSample(textureT, textureTSampler, uv);
    #endif
    #ifdef LERP_T_SRGB
    t = vec4f(mix(t.rgb / vec3f(12.92), pow((t.rgb + vec3f(0.055)) / vec3f(1.055), vec3f(2.4)), step(vec3f(0.04045), t.rgb)), t.a);
    #endif
    #ifdef LERP_T_CHANNEL_R
    t = vec4f(t.rrr, t.a);
    #elif defined(LERP_T_CHANNEL_G)
    t = vec4f(t.ggg, t.a);
    #elif defined(LERP_T_CHANNEL_B)
    t = vec4f(t.bbb, t.a);
    #elif defined(LERP_T_CHANNEL_A)
    t = t.aaaa;
    #endif
    #ifdef LERP_T_FACTOR
    t *= uniforms.factorT;
    #endif
    #else
    let t: vec4f = uniforms.factorT;
    #endif
    var result: vec4f = mix(a, b, t);
    #elif defined(OP_MAX)
    var result: vec4f = max(a, b);
    #else
    var result: vec4f = a * b;
    #endif

    // Apply output channel mask (excluded color channels → 0.0, excluded alpha → 1.0)
    #if defined(OUTPUT_MASK_R_ZERO) || defined(OUTPUT_MASK_G_ZERO) || defined(OUTPUT_MASK_B_ZERO) || defined(OUTPUT_MASK_A_ONE)
    var _omr: f32 = result.r; var _omg: f32 = result.g; var _omb: f32 = result.b; var _oma: f32 = result.a;
    #ifdef OUTPUT_MASK_R_ZERO
    _omr = 0.0;
    #endif
    #ifdef OUTPUT_MASK_G_ZERO
    _omg = 0.0;
    #endif
    #ifdef OUTPUT_MASK_B_ZERO
    _omb = 0.0;
    #endif
    #ifdef OUTPUT_MASK_A_ONE
    _oma = 1.0;
    #endif
    result = vec4f(_omr, _omg, _omb, _oma);
    #endif

    // Convert result to output color space
    #ifdef OUTPUT_SRGB
    result = vec4f(mix(result.rgb * vec3f(12.92), pow(result.rgb, vec3f(1.0 / 2.4)) * vec3f(1.055) - vec3f(0.055), step(vec3f(0.0031308), result.rgb)), result.a);
    #endif
    fragmentOutputs.color = result;
}
