// Fragment shader
precision highp float;

// Varyings
varying vec2 vUV;

// Uniforms
uniform sampler2D decalSampler;
uniform sampler2D maskSampler;
// uniform vec2 textureSize;

void main() {
    vec4 mask = texture2D(maskSampler, vUV).rgba;

    if (mask.r > 0.5) {
        gl_FragColor = texture2D(decalSampler, vUV);
    } else {
        vec2 texelSize = 1.0 / 1024.0;

        vec2 uv_p01 = vUV + vec2(-1.0, 0.0) * texelSize;
        vec2 uv_p21 = vUV + vec2(1.0, 0.0) * texelSize;
        vec2 uv_p10 = vUV + vec2(0.0, -1.0) * texelSize;
        vec2 uv_p12 = vUV + vec2(0.0, 1.0) * texelSize;

        float mask_p01 = texture2D(maskSampler, uv_p01).r;
        float mask_p21 = texture2D(maskSampler, uv_p21).r;
        float mask_p10 = texture2D(maskSampler, uv_p10).r;
        float mask_p12 = texture2D(maskSampler, uv_p12).r;

        vec4 col = vec4(0.0, 0.0, 0.0, 0.0);
        float total_weight = 0.0;

        if (mask_p01 > 0.5) {
            col += texture2D(decalSampler, uv_p01);
            total_weight += 1.0;
        }
        if (mask_p21 > 0.5) {
            col += texture2D(decalSampler, uv_p21);
            total_weight += 1.0;
        }
        if (mask_p10 > 0.5) {
            col += texture2D(decalSampler, uv_p10);
            total_weight += 1.0;
        }
        if (mask_p12 > 0.5) {
            col += texture2D(decalSampler, uv_p12);
            total_weight += 1.0;
        }

        if (total_weight > 0.0) {
            gl_FragColor = col / total_weight;
        } else {
            gl_FragColor = col;
        }
    }
}