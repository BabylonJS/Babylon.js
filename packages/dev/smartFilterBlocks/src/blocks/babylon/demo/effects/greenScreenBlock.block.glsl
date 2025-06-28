/*  
{ 
    "smartFilterBlockType": "GreenScreenBlock", 
    "namespace": "Babylon.Demo.Effects", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
uniform sampler2D background;
uniform vec3 reference;
uniform float distance;

vec4 greenScreen(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);
    vec4 background = texture2D(background, vUV);

    if (length(color.rgb - reference) < distance) {
        return background;
    }

    return color;
}
