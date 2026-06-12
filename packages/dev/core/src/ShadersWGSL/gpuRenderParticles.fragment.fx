var diffuseSamplerSampler: sampler;
var diffuseSampler: texture_2d<f32>;

varying vUV: vec2f;
varying vColor: vec4f;

#include<clipPlaneFragmentDeclaration>
#include<imageProcessingDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#include<fogFragmentDeclaration>

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    #include<clipPlaneFragment>

    let textureColor: vec4f = textureSample(diffuseSampler, diffuseSamplerSampler, input.vUV);
    var baseColor: vec4f = textureColor * input.vColor;

#ifdef BLENDMULTIPLYMODE
    let alpha: f32 = input.vColor.a * textureColor.a;
    baseColor = vec4f(baseColor.rgb * alpha + vec3f(1.0) * (1.0 - alpha), baseColor.a);
#endif

    #include<logDepthFragment>
    #include<fogFragment>(color,baseColor)

#ifdef IMAGEPROCESSINGPOSTPROCESS
    baseColor = vec4f(toLinearSpaceVec3(baseColor.rgb), baseColor.a);
#else
#ifdef IMAGEPROCESSING
    baseColor = vec4f(toLinearSpaceVec3(baseColor.rgb), baseColor.a);
    baseColor = applyImageProcessing(baseColor);
#endif
#endif

    fragmentOutputs.color = baseColor;
}
