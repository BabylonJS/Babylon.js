#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUV;
        
uniform sampler2D textureSampler;
uniform sampler2D depthSampler;
uniform sampler2D normalSampler;
uniform sampler2D worldNormalSampler;
uniform sampler2D worldPositionSampler;
uniform sampler2D localPositionSampler;
uniform sampler2D velocitySampler;

void main(void)
{
    vec4 first = texture2D(textureSampler, vUV);
    vec4 depth = texture2D(depthSampler, vUV);
    vec4 normal = texture2D(normalSampler, vUV);
    vec4 worldNormal = texture2D(worldNormalSampler, vUV);
    vec4 worldPosition = texture2D(worldPositionSampler, vUV);
    vec4 localPosition = texture2D(localPositionSampler, vUV);
    vec4 velocity = texture2D(velocitySampler, vUV);
    // mixes colors
    if (vUV.x <= 0.125) { // show only base texture
        gl_FragColor = first;
    }
    else if (vUV.x <= 0.25) { // show only depth texture
        gl_FragColor.rgb = depth.rgb / 100.0;
        gl_FragColor.a = 1.0;
    }
    else if (vUV.x <= 0.375) {
        gl_FragColor.rgb = velocity.rgb;
        gl_FragColor.a = 1.0;
    }
    else if (vUV.x <= 0.5) {
        gl_FragColor.rgb = worldPosition.rgb;
        gl_FragColor.a = 1.0;
    }
    else if (vUV.x <= 0.625) {
        gl_FragColor.rgb = localPosition.rgb;
        gl_FragColor.a = 1.0;
    }
    else if (vUV.x <= 0.75) {
        gl_FragColor.rgb = worldNormal.rgb;
        gl_FragColor.a = 1.0;
    }
    else if (vUV.x <= 0.875) {
        gl_FragColor.rgb = worldNormal.rgb;
        gl_FragColor.a = 1.0;
    }
    else { // normal
        gl_FragColor.rgb = normal.rgb * vec3(0.5, 0.5, 0.0) + vec3(0.5, 0.5, 0.0);
        gl_FragColor.a = 1.0;
    }
}