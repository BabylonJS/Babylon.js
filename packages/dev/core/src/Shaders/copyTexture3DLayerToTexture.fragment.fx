precision highp sampler3D;
            
uniform sampler3D textureSampler;
uniform int layerNum;
varying vec2 vUV;

void main(void) {
    vec3 coord = vec3(0.0, 0.0, float(layerNum));
    // Address the source by physical fragment coordinate rather than the interpolated vUV. The mip source
    // texture is authored (by iblGenerateVoxelMip) in gl_FragCoord space, and on native (bgfx) render-to-3D
    // the interpolated vUV.y is inverted relative to gl_FragCoord.y, which would copy each Z-slice Y-flipped
    // and desync the voxel-grid mip chain from mip 0 (breaking the octree occupancy descent -> no IBL shadow).
    // On WebGL vUV.xy * textureSize == gl_FragCoord.xy at pixel centers, so this is a no-op there.
    coord.xy = gl_FragCoord.xy;
    vec3 color = texelFetch(textureSampler, ivec3(coord), 0).rgb;
    gl_FragColor = vec4(color, 1);
}
