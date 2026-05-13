// Texture processing fragment shader
// Supports multiply, max, lerp, and invert operations with texture/constant/combined operands.
//
// Defines:
//   OPERAND_A_TEXTURE      - operand A has a texture
//   OPERAND_A_FACTOR       - operand A has a constant vec4 factor
//   OPERAND_A_SRGB         - linearize operand A RGB channels (IEC 61966-2-1) before swizzle/factor
//   OPERAND_A_CHANNEL_R    - swizzle operand A sample to RRRA before use
//   OPERAND_A_CHANNEL_G    - swizzle operand A sample to GGGA before use
//   OPERAND_A_CHANNEL_B    - swizzle operand A sample to BBBA before use
//   OPERAND_A_CHANNEL_A    - swizzle operand A sample to AAAA before use
//   OPERAND_B_TEXTURE      - operand B has a texture
//   OPERAND_B_FACTOR       - operand B has a constant vec4 factor
//   OPERAND_B_SRGB         - linearize operand B RGB channels before swizzle/factor
//   OPERAND_A_MATRIX       - operand A texture has a UV transform to bake; uses textureAMatrix uniform
//   OPERAND_B_CHANNEL_R/G/B/A - same channel swizzles for operand B
//   OPERAND_B_MATRIX       - operand B texture has a UV transform to bake; uses textureBMatrix uniform
//   OP_LERP                - use mix(a, b, t) instead of a * b
//   OP_MAX                 - use max(a, b) instead of a * b
//   OP_INVERT              - unary: invert selected channels of operand A (operand B is ignored)
//   INVERT_R               - invert the red channel (used with OP_INVERT)
//   INVERT_G               - invert the green channel (used with OP_INVERT)
//   INVERT_B               - invert the blue channel (used with OP_INVERT)
//   INVERT_A               - invert the alpha channel (used with OP_INVERT)
//   OP_CHANNEL_MAX         - unary: broadcast max(r,g,b[,a]) of operand A to all output channels
//   CHANNEL_MAX_INCLUDE_ALPHA - include alpha in the max computation and broadcast to all four channels
//   LERP_T_TEXTURE         - t operand has a texture
//   LERP_T_FACTOR          - t operand has a constant vec4 factor (combined with texture when both are set)
//   LERP_T_SRGB            - linearize t operand RGB channels before swizzle/factor
//   LERP_T_CHANNEL_R/G/B/A - channel swizzles for the lerp t operand
//   LERP_T_MATRIX          - t operand texture has a UV transform to bake; uses textureTMatrix uniform
//   OUTPUT_MASK_R_ZERO     - set red channel of result to 0.0 (excluded from output)
//   OUTPUT_MASK_G_ZERO     - set green channel of result to 0.0
//   OUTPUT_MASK_B_ZERO     - set blue channel of result to 0.0
//   OUTPUT_MASK_A_ONE      - set alpha channel of result to 1.0 (excluded from output)
//   OUTPUT_SRGB            - convert the final linear result to sRGB (IEC 61966-2-1) before output
//
// When both TEXTURE and FACTOR are set for the same operand, the result is sample(texture) * factor.
// When only TEXTURE is set, the result is sample(texture).
// When only FACTOR is set, the result is the constant factor.
// For texture operands: UV matrix is applied first (when MATRIX is set), then sRGB linearization,
// then channel swizzle, then factor multiplication. OUTPUT_SRGB is applied last, to RGB only.

#ifdef OPERAND_A_TEXTURE
uniform sampler2D textureA;
#endif
#ifdef OPERAND_B_TEXTURE
uniform sampler2D textureB;
#endif
#if defined(OP_LERP) && defined(LERP_T_TEXTURE)
uniform sampler2D textureT;
#endif

#ifdef OPERAND_A_MATRIX
uniform mat4 textureAMatrix;
#endif
#ifdef OPERAND_B_MATRIX
uniform mat4 textureBMatrix;
#endif
#if defined(OP_LERP) && defined(LERP_T_MATRIX)
uniform mat4 textureTMatrix;
#endif

#if !defined(OPERAND_A_TEXTURE) || defined(OPERAND_A_FACTOR)
uniform vec4 factorA;
#endif
#if !defined(OPERAND_B_TEXTURE) || defined(OPERAND_B_FACTOR)
uniform vec4 factorB;
#endif
#if defined(OP_LERP) && (!defined(LERP_T_TEXTURE) || defined(LERP_T_FACTOR))
uniform vec4 factorT;
#endif

varying vec2 vUV;

void main() {
    vec2 uv = vUV;

    // Evaluate operand A
    #ifdef OPERAND_A_TEXTURE
    #ifdef OPERAND_A_MATRIX
    vec4 a = texture2D(textureA, (textureAMatrix * vec4(uv, 0.0, 1.0)).xy);
    #else
    vec4 a = texture2D(textureA, uv);
    #endif
    #ifdef OPERAND_A_SRGB
    a.rgb = mix(a.rgb / 12.92, pow((a.rgb + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), a.rgb));
    #endif
    #ifdef OPERAND_A_CHANNEL_R
    a = vec4(a.rrr, a.a);
    #elif defined(OPERAND_A_CHANNEL_G)
    a = vec4(a.ggg, a.a);
    #elif defined(OPERAND_A_CHANNEL_B)
    a = vec4(a.bbb, a.a);
    #elif defined(OPERAND_A_CHANNEL_A)
    a = a.aaaa;
    #endif
    #ifdef OPERAND_A_FACTOR
    a *= factorA;
    #endif
    #else
    vec4 a = factorA;
    #endif

    // Evaluate operand B
    #ifdef OPERAND_B_TEXTURE
    #ifdef OPERAND_B_MATRIX
    vec4 b = texture2D(textureB, (textureBMatrix * vec4(uv, 0.0, 1.0)).xy);
    #else
    vec4 b = texture2D(textureB, uv);
    #endif
    #ifdef OPERAND_B_SRGB
    b.rgb = mix(b.rgb / 12.92, pow((b.rgb + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), b.rgb));
    #endif
    #ifdef OPERAND_B_CHANNEL_R
    b = vec4(b.rrr, b.a);
    #elif defined(OPERAND_B_CHANNEL_G)
    b = vec4(b.ggg, b.a);
    #elif defined(OPERAND_B_CHANNEL_B)
    b = vec4(b.bbb, b.a);
    #elif defined(OPERAND_B_CHANNEL_A)
    b = b.aaaa;
    #endif
    #ifdef OPERAND_B_FACTOR
    b *= factorB;
    #endif
    #else
    vec4 b = factorB;
    #endif

    // Apply operation
    #ifdef OP_CHANNEL_MAX
    float _cmax = max(max(a.r, a.g), a.b);
    #ifdef CHANNEL_MAX_INCLUDE_ALPHA
    _cmax = max(_cmax, a.a);
    vec4 result = vec4(_cmax, _cmax, _cmax, _cmax);
    #else
    vec4 result = vec4(_cmax, _cmax, _cmax, a.a);
    #endif
    #elif defined(OP_INVERT)
    float _ir = a.r; float _ig = a.g; float _ib = a.b; float _ia = a.a;
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
    vec4 result = vec4(_ir, _ig, _ib, _ia);
    #elif defined(OP_LERP)
    #ifdef LERP_T_TEXTURE
    #ifdef LERP_T_MATRIX
    vec4 t = texture2D(textureT, (textureTMatrix * vec4(uv, 0.0, 1.0)).xy);
    #else
    vec4 t = texture2D(textureT, uv);
    #endif
    #ifdef LERP_T_SRGB
    t.rgb = mix(t.rgb / 12.92, pow((t.rgb + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), t.rgb));
    #endif
    #ifdef LERP_T_CHANNEL_R
    t = vec4(t.rrr, t.a);
    #elif defined(LERP_T_CHANNEL_G)
    t = vec4(t.ggg, t.a);
    #elif defined(LERP_T_CHANNEL_B)
    t = vec4(t.bbb, t.a);
    #elif defined(LERP_T_CHANNEL_A)
    t = t.aaaa;
    #endif
    #ifdef LERP_T_FACTOR
    t *= factorT;
    #endif
    #else
    vec4 t = factorT;
    #endif
    vec4 result = mix(a, b, t);
    #elif defined(OP_MAX)
    vec4 result = max(a, b);
    #else
    vec4 result = a * b;
    #endif

    // Apply output channel mask (excluded color channels → 0.0, excluded alpha → 1.0)
    #ifdef OUTPUT_MASK_R_ZERO
    result.r = 0.0;
    #endif
    #ifdef OUTPUT_MASK_G_ZERO
    result.g = 0.0;
    #endif
    #ifdef OUTPUT_MASK_B_ZERO
    result.b = 0.0;
    #endif
    #ifdef OUTPUT_MASK_A_ONE
    result.a = 1.0;
    #endif

    // Convert result to output color space
    #ifdef OUTPUT_SRGB
    result.rgb = mix(result.rgb * 12.92, pow(result.rgb, vec3(1.0 / 2.4)) * 1.055 - 0.055, step(vec3(0.0031308), result.rgb));
    #endif
    gl_FragColor = result;
}
