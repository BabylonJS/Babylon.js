precision highp sampler3D;

varying vec2 vUV;

uniform sampler3D voxelTexture;
uniform sampler2D textureSampler;

uniform vec4 sizeParams;
#define offsetX sizeParams.x
#define offsetY sizeParams.y
#define widthScale sizeParams.z
#define heightScale sizeParams.w

void main(void) {

    vec2 uv =
        vec2((offsetX + vUV.x) * widthScale, (offsetY + vUV.y) * heightScale);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor.rgba = texture2D(textureSampler, vUV);
      return;
    }
    // ***** Display all slices as a grid *******
    ivec3 size = textureSize(voxelTexture, 0);
    float dimension = sqrt(float(size.z));
    vec2 samplePos = fract(uv.xy * vec2(dimension));
    int sampleIndex = int(floor(uv.x * float(dimension)) +
                          floor(uv.y * float(dimension)) * dimension);

    vec3 voxel = textureLod(voxelTexture, vec3(samplePos.xy, float(sampleIndex) / float(size.z)), MIP_NUMBER).rrr;
    glFragColor.rgb = vec3(voxel.r > 0.0 ? 1.0 : 0.0);

    //ivec2 pixCoord = ivec2(uv.xy*vec2(dimension));
    //glFragColor.r = texelFetch(voxelTexture, ivec3(pixCoord.x, pixCoord.y, sampleIndex), 2).r != 0.0 ? 1.0 : 0.0;
    glFragColor.a = 1.0;
    glFragColor.rgb += texture(textureSampler, vUV.xy).rgb;
}