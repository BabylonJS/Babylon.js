precision highp sampler2DArray;

varying vec2 vUV;

uniform sampler2DArray texture_array;
uniform sampler2D textureSampler;
uniform int slice;

void main(void) {

    // ***** Display all slices as a grid *******
    ivec3 size = textureSize(texture_array, 0);
    float dimension = sqrt(float(size.z));
    vec2 samplePos = fract(vUV.xy * vec2(dimension));
    int sampleIndex = int(floor(vUV.x * float(dimension)) + floor(vUV.y * float(dimension)) * dimension);
    glFragColor.rgb = texture(texture_array, vec3(samplePos.xy, sampleIndex)).rrr;
    // glFragColor.rgb = vec3(samplePos.x, samplePos.y, float(sampleIndex) / float(size.z));
    glFragColor.a = 1.0;
    glFragColor.rgb += texture(textureSampler, vUV.xy).rgb;

    // ***** Display a single slice *******
    // glFragColor.rgb = texture(texture_array, vec3(vUV.xy, 0)).rrr;
    // glFragColor.a = 1.0;
}