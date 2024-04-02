precision highp sampler3D;

varying vec2 vUV;

uniform sampler3D voxelTexture;
uniform sampler2D textureSampler;
uniform int slice;

void main(void) {

    // ***** Display all slices as a grid *******
    ivec3 size = textureSize(voxelTexture, 0);
    float dimension = sqrt(float(size.z));
    vec2 samplePos = fract(vUV.xy * vec2(dimension));
    int sampleIndex = int(floor(vUV.x * float(dimension)) + floor(vUV.y * float(dimension)) * dimension);
    glFragColor.rgb = texture(voxelTexture, vec3(samplePos.xy, float(sampleIndex) / float(size.z))).rrr;
    glFragColor.a = 1.0;
    glFragColor.rgb += texture(textureSampler, vUV.xy).rgb;

    // ***** Display a single slice *******
    // glFragColor.rgb = texture(voxelTexture, vec3(vUV.xy, 0)).rrr;
    // glFragColor.a = 1.0;
}