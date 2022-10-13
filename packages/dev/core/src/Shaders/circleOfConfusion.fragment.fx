// samplers
uniform sampler2D depthSampler;

// varyings
varying vec2 vUV;

// precomputed uniforms (not effect parameters)
// cameraMinMaxZ.y => "maxZ - minZ" i.e., the near-to-far distance.
uniform vec2 cameraMinMaxZ;

// uniforms
uniform float focusDistance;
uniform float cocPrecalculation;


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void)
{
    float depth = texture2D(depthSampler, vUV).r;
    float pixelDistance = (cameraMinMaxZ.x + cameraMinMaxZ.y * depth) * 1000.0; // actual distance from the lens in scene units/1000 (eg. millimeter)
    float coc = abs(cocPrecalculation * ((focusDistance - pixelDistance) / pixelDistance));
    coc = clamp(coc, 0.0, 1.0);
    gl_FragColor = vec4(coc, coc, coc, 1.0);
}
