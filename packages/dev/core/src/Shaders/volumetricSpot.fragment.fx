precision highp float;
varying vec3 vPositionW;
varying vec3 vNormalW;
uniform float exponent;
uniform float angle;
uniform vec3 lightPos;
uniform vec3 diffuse;
uniform float intensity;

void main() {
    float rayIntensity = distance(vPositionW, lightPos) / exponent;
    rayIntensity = 1.0 - clamp(rayIntensity, 0.0, 1.0);

    vec3 normal = vNormalW;
    normal.z = abs(normal.z);
    
    vec3 forward = vec3(0., 0., 1.0);
    float angleIntensity = dot(normal, forward);

    //smooth the intensity
    angleIntensity = pow(angleIntensity, angle);
    rayIntensity *= angleIntensity;

    gl_FragColor = vec4(diffuse, rayIntensity * intensity);
}