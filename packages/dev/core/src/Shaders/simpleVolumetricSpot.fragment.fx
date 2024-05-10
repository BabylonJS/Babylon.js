precision highp float;
varying vec3 vPositionW;
varying vec3 vNormalW;
varying float viewZ;
uniform float exponent;
uniform float angle;
uniform vec3 lightPos;
uniform vec3 diffuse;
uniform float intensity;
uniform sampler2D depthTexture;
uniform float cameraNear;
uniform float cameraFar;
uniform float softRadius;
uniform vec2 resolution;

float perspectiveDepthToViewZ(float depth, float near, float far) {
    return (near * far) / ((far - near) * depth - far);
}

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

    //soft intersection
    vec2 uv = gl_FragCoord.xy / resolution;
    float d = texture2D(depthTexture, uv).r;
    
    rayIntensity *= smoothstep(0.0, 1.0, (viewZ - perspectiveDepthToViewZ(d, cameraNear, cameraFar)) / softRadius);


    gl_FragColor = vec4(diffuse, rayIntensity * intensity);
}