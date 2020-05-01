#include<hdrFilteringFunctions>
uniform samplerCube inputTexture;
uniform float hdrScale;

varying vec3 direction;

void main() {
    vec4 color = sampleFiltered(inputTexture, direction);

    gl_FragColor = vec4(color.xyz * hdrScale, 1.0);
}