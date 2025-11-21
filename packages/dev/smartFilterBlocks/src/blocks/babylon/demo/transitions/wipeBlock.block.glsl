// { "smartFilterBlockType": "WipeBlock", "namespace": "Babylon.Demo.Transitions" }

uniform sampler2D textureA;
uniform sampler2D textureB;
uniform float progress;

vec4 wipe(vec2 vUV) { // main
    vec4 colorA = texture2D(textureA, vUV);
    vec4 colorB = texture2D(textureB, vUV);
    return mix(colorB, colorA, step(progress, vUV.y));
}