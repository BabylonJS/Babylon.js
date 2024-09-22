attribute vec3 position;
attribute vec3 normal;

varying vec3 vNormalizedPosition;

uniform mat4 world;
uniform mat4 invWorldScale;
uniform mat4 viewMatrix;

void main(void) {
    // inverse scale this by world scale to put in 0-1 space.
    gl_Position = viewMatrix * invWorldScale * world * vec4(position, 1.);
    // gl_Position.xyz = gl_Position.zyx;
    vNormalizedPosition.xyz = gl_Position.xyz * 0.5 + 0.5;
    // vNormalizedPosition.xyz = vNormalizedPosition.zyx;
    #ifdef IS_NDC_HALF_ZRANGE
        gl_Position.z = gl_Position.z * 0.5 + 0.5;
    #endif
}