precision highp float;
precision highp sampler3D;

varying vec2 vUV;

uniform sampler3D voxelXaxisSampler;
uniform sampler3D voxelYaxisSampler;
uniform sampler3D voxelZaxisSampler;

uniform float layer;

void main(void) {
    vec3 coordZ = vec3(vUV.x, vUV.y, layer);
    float voxelZ = texture(voxelZaxisSampler, coordZ).r;
    vec3 coordX = vec3(1.0 - layer, vUV.y, vUV.x);
    float voxelX = texture(voxelXaxisSampler, coordX).r;
    vec3 coordY = vec3(layer, vUV.x, vUV.y);
    float voxelY = texture(voxelYaxisSampler, coordY).r;

    //   ivec3 size = textureSize(voxelZaxisSampler, 0);
    //   ivec3 coordZ = ivec3(vUV.x * float(size.x), vUV.y * float(size.y),
    //                        int(layer * float(size.z)));

    //   ivec3 coordX = ivec3(coordZ.z, coordZ.y, coordZ.x);
    //   ivec3 coordY = ivec3(coordZ.z, coordZ.x, coordZ.y);

    //   float voxelX = texelFetch(voxelXaxisSampler, coordX, 0).r;
    //   float voxelY = texelFetch(voxelYaxisSampler, coordY, 0).r;
    //   float voxelZ = texelFetch(voxelZaxisSampler, coordZ, 0).r;

    float voxel = (voxelX > 0.0 || voxelY > 0.0 || voxelZ > 0.0) ? 1.0 : 0.0;
    glFragColor = vec4(vec3(voxel), 1.0);
    // glFragColor = vec4(voxelX, voxelY, voxelZ, 1.0);
}