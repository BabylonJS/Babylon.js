// samplers
uniform sampler2D depthSampler;

// varyings
varying vec2 vUV;

// preconputed uniforms (not effect parameters)
uniform vec2 cameraMinMaxZ;

// uniforms
uniform float focusDistance;
uniform float cocPrecalculation;

void main(void)
{
    float depth = texture2D(depthSampler, vUV).r;
    float pixelDistance = (cameraMinMaxZ.x + (cameraMinMaxZ.y - cameraMinMaxZ.x)*depth)*1000.0;	// actual distance from the lens in scene units/1000 (eg. millimeter)
    float coc = abs(cocPrecalculation* ((focusDistance - pixelDistance)/pixelDistance));
    coc = clamp(coc, 0.0, 1.0);
    gl_FragColor = vec4(coc, depth, coc, 1.0);
}
