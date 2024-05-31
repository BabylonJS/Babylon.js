precision highp float;
varying vec2 vUV;
                    
uniform sampler2D textureSampler;
uniform sampler2D shadowTexture;
uniform float shadowOpacity;

void main(void)
{
    vec3 color = texture(textureSampler, vUV).rgb;
    vec3 shadow = texture(shadowTexture, vUV).rgb;
    float shadowValue = mix(1.0, shadow.x, shadowOpacity);
    gl_FragColor = vec4(color * shadowValue, 1.0);
}