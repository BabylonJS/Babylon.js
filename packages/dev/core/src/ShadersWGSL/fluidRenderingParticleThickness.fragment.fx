uniform float particleAlpha;

varying vec2 uv;

void main(void) {
    vec3 normal;

    normal.xy = uv * 2.0 - 1.0;
    float r2 = dot(normal.xy, normal.xy);
    if (r2 > 1.0) discard;
    float thickness = sqrt(1.0 - r2);

    glFragColor = vec4(vec3(particleAlpha * thickness), 1.0);
}
