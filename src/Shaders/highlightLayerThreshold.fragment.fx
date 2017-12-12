precision highp float;

varying vec2 vUV;

uniform float threshold;
uniform sampler2D textureSampler;

void main(void) {
    vec4 color = texture2D(textureSampler, vUV);
    float alpha = smoothstep(.0, threshold, color.a);
    color.a = alpha;
    gl_FragColor = color * alpha;
}