#define SQRT2 1.41421356
#define PI 3.14159

uniform visibility: f32;

uniform mainColor: vec3f;
uniform lineColor: vec3f;
uniform gridControl: vec4f;
uniform gridOffset: vec3f;

// Varying
varying vPosition: vec3f;
varying vNormal: vec3f;

#include<clipPlaneFragmentDeclaration>

#include<logDepthDeclaration>

#include<fogFragmentDeclaration>

// Samplers
#ifdef OPACITY
varying vOpacityUV: vec2f;
var opacitySamplerSampler: sampler;
var opacitySampler: texture_2d<f32>;
uniform vOpacityInfos: vec2f;
#endif

fn getDynamicVisibility(position: f32) -> f32 {
    // Major grid line every Frequency defined in material.
    var majorGridFrequency: f32 = uniforms.gridControl.y;
    if (floor(position + 0.5) == floor(position / majorGridFrequency + 0.5) * majorGridFrequency)
    {
        return 1.0;
    }

    return uniforms.gridControl.z;
}

fn getAnisotropicAttenuation(differentialLength: f32) -> f32 {
    let maxNumberOfLines: f32 = 10.0;
    return clamp(1.0 / (differentialLength + 1.0) - 1.0 / maxNumberOfLines, 0.0, 1.0);
}

fn isPointOnLine(position: f32, differentialLength: f32) -> f32 {
    var fractionPartOfPosition: f32 = position - floor(position + 0.5);
    fractionPartOfPosition = fractionPartOfPosition / differentialLength;

    #ifdef ANTIALIAS
    fractionPartOfPosition = clamp(fractionPartOfPosition, -1., 1.);
    var result: f32 = 0.5 + 0.5 * cos(fractionPartOfPosition * PI);
    return result;
    #else
    if (abs(fractionPartOfPosition) < SQRT2 / 4.) {
        return 1.;
    }
    return 0.;
    #endif
}

fn contributionOnAxis(position: f32) -> f32 {
    var differentialLength: f32 = length( vec2f(dpdx(position), dpdy(position)));
    differentialLength = differentialLength * SQRT2;

    // Is the point on the line.
    var result: f32 = isPointOnLine(position, differentialLength);

    // Add dynamic visibility.
    var dynamicVisibility: f32 = getDynamicVisibility(position);
    result = result * dynamicVisibility;

    // Anisotropic filtering.
    var anisotropicAttenuation: f32 = getAnisotropicAttenuation(differentialLength);
    result = result * anisotropicAttenuation;

    return result;
}

fn normalImpactOnAxis(x: f32) -> f32 {
    var normalImpact: f32 = clamp(1.0 - 3.0 * abs(x * x * x), 0.0, 1.0);
    return normalImpact;
}


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

    // Scale position to the requested ratio.
    var gridRatio: f32 = uniforms.gridControl.x;
    var gridPos: vec3f = (fragmentInputs.vPosition + uniforms.gridOffset.xyz) / gridRatio;

    // Find the contribution of each coords.
    var x: f32 = contributionOnAxis(gridPos.x);
    var y: f32 = contributionOnAxis(gridPos.y);
    var z: f32 = contributionOnAxis(gridPos.z);

    // Find the normal contribution.
    var normal: vec3f = normalize(fragmentInputs.vNormal);
    x = x * normalImpactOnAxis(normal.x);
    y = y * normalImpactOnAxis(normal.y);
    z = z * normalImpactOnAxis(normal.z);

#ifdef MAX_LINE
    // Create the grid value from the max axis.
    var grid: f32 = clamp(max(max(x, y), z), 0., 1.);
#else
    // Create the grid value by combining axes.
    var grid: f32 = clamp(x + y + z, 0., 1.);
#endif

    // Create the color.
    var color: vec4f = vec4f(mix(uniforms.mainColor, uniforms.lineColor, vec3f(grid)), 1.0);

#ifdef FOG
    #include<fogFragment>
#endif

    var opacity: f32 = 1.0;
#ifdef TRANSPARENT
    opacity = clamp(grid, 0.08, uniforms.gridControl.w * grid);
#endif

#ifdef OPACITY
	opacity = opacity * textureSample(opacitySampler, opacitySamplerSampler, fragmentInputs.vOpacityUV).a;
#endif

    // Apply the color.
    fragmentOutputs.color =  vec4f(color.rgb, opacity * uniforms.visibility);

#ifdef TRANSPARENT
    #ifdef PREMULTIPLYALPHA
        fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb * opacity, fragmentOutputs.color.a);
    #endif
#else
#endif

#include<logDepthFragment>

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
