#include<shadowMapFragmentExtraDeclaration>

#ifdef ALPHATEXTURE
varying vUV: vec2f;
var diffuseSamplerSampler: sampler;
var diffuseSampler: texture_2d<f32>;
#endif

#include<clipPlaneFragmentDeclaration>


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#include<clipPlaneFragment>

#ifdef ALPHATEXTURE
    var opacityMap: vec4f = textureSample(diffuseSampler, diffuseSamplerSampler, fragmentInputs.vUV);
    
    var alphaFromAlphaTexture: f32 = opacityMap.a;

    #if SM_SOFTTRANSPARENTSHADOW == 1
        if (uniforms.softTransparentShadowSM.y == 1.0) {
            opacityMap = vec4f(opacityMap.rgb *  vec3f(0.3, 0.59, 0.11), opacityMap.a);
            alphaFromAlphaTexture = opacityMap.x + opacityMap.y + opacityMap.z;
        }
    #endif

    #ifdef ALPHATESTVALUE
        if (alphaFromAlphaTexture < ALPHATESTVALUE) {
            discard;
        }
    #endif
#endif

#if SM_SOFTTRANSPARENTSHADOW == 1
    #ifdef ALPHATEXTURE
        if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0))))) / 64.0 >= uniforms.softTransparentShadowSM.x * alphaFromAlphaTexture)  {
            discard;
        }
    #else
        if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0))))) / 64.0 >= uniforms.softTransparentShadowSM.x) {
            discard;
        } 
    #endif
#endif

#include<shadowMapFragment>
}