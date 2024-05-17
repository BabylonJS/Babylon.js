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
    vec3 coordX = vec3(-layer, vUV.y, vUV.x);
    float voxelX = texture(voxelXaxisSampler, coordX).r;
    vec3 coordY = vec3(layer, vUV.x, vUV.y);
    float voxelY = texture(voxelYaxisSampler, coordY).r;
    gl_FragColor = vec4(vec3(voxelX + voxelY + voxelZ), 1.0);
}