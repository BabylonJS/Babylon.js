precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
varying vec3 vNormalW;
varying vec3 vPositionW;
    
void main() {
    vec4 p = vec4(position, 1.);
    gl_Position = worldViewProjection * p;

    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
    vPositionW = vec3(world * vec4(position, 1.0));
}