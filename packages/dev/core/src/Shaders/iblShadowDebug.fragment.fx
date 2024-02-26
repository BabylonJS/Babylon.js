precision highp float;
uniform sampler2D worldNormalSampler;
uniform sampler2D localPositionSampler;
uniform sampler2D velocitySampler;
uniform sampler2D depthSampler;

void main()
{
    ivec2 quarter_fragCoord = ivec2(gl_FragCoord.xy * vec2(2.0));
    vec2 texSize = vec2(textureSize(worldNormalSampler, 0));
    vec4 normal = texelFetch(worldNormalSampler, quarter_fragCoord - ivec2(0.0, texSize.y), 0);
    vec4 position = texelFetch(localPositionSampler, quarter_fragCoord - ivec2(texSize.x, texSize.y), 0);
    vec4 depth = texelFetch(depthSampler, quarter_fragCoord - ivec2(texSize.x, 0.0), 0).rrra;
    depth.rgb *= 0.01;
    vec4 velocity = texelFetch(velocitySampler, quarter_fragCoord, 0);
    velocity.xy = clamp(velocity.xy * 2.0 - vec2(1.0), 0.0, 1.0);
    glFragColor = normal + position + depth + velocity;
}