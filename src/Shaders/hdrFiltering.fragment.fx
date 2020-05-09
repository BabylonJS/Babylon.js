#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>

uniform samplerCube inputTexture;
uniform float hdrScale;

varying vec3 direction;

void main() {
    vec3 color = radiance(inputTexture, direction);

    gl_FragColor = vec4(color * hdrScale, 1.0);
}