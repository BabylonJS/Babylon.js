// Texture merging fragment shader (WGSL)
// Uses preprocessor defines to conditionally enable texture sampling

// Conditional texture uniforms based on defines
#ifdef USE_TEXTURE0
var inputTexture0Sampler: sampler;
var inputTexture0: texture_2d<f32>;
#endif
#ifdef USE_TEXTURE1
var inputTexture1Sampler: sampler;
var inputTexture1: texture_2d<f32>;
#endif
#ifdef USE_TEXTURE2
var inputTexture2Sampler: sampler;
var inputTexture2: texture_2d<f32>;
#endif
#ifdef USE_TEXTURE3
var inputTexture3Sampler: sampler;
var inputTexture3: texture_2d<f32>;
#endif

// Channel configuration uniforms (only for texture-based channels)
#ifdef RED_FROM_TEXTURE
uniform redTextureIndex: i32;
uniform redSourceChannel: i32;
#else
uniform redConstantValue: f32;
#endif

#ifdef GREEN_FROM_TEXTURE
uniform greenTextureIndex: i32;
uniform greenSourceChannel: i32;
#else
uniform greenConstantValue: f32;
#endif

#ifdef BLUE_FROM_TEXTURE
uniform blueTextureIndex: i32;
uniform blueSourceChannel: i32;
#else
uniform blueConstantValue: f32;
#endif

#ifdef ALPHA_FROM_TEXTURE
uniform alphaTextureIndex: i32;
uniform alphaSourceChannel: i32;
#else
uniform alphaConstantValue: f32;
#endif

// Input from vertex shader
varying vUV: vec2f;

// Helper function to sample from a texture by index
#if defined(RED_FROM_TEXTURE) || defined(GREEN_FROM_TEXTURE) || defined(BLUE_FROM_TEXTURE) || defined(ALPHA_FROM_TEXTURE)
fn sampleTexture(textureIndex: i32, uv: vec2f) -> vec4f {
    switch (textureIndex) {
        #ifdef USE_TEXTURE0
        case 0: {
            return textureSample(inputTexture0, inputTexture0Sampler, uv);
        }
        #endif
        #ifdef USE_TEXTURE1
        case 1: {
            return textureSample(inputTexture1, inputTexture1Sampler, uv);
        }
        #endif
        #ifdef USE_TEXTURE2
        case 2: {
            return textureSample(inputTexture2, inputTexture2Sampler, uv);
        }
        #endif
        #ifdef USE_TEXTURE3
        case 3: {
            return textureSample(inputTexture3, inputTexture3Sampler, uv);
        }
        #endif
        default: {
            return vec4f(0.0, 0.0, 0.0, 1.0); // Fallback
        }
    }
}

// Helper function to extract a specific channel from a vec4
fn extractChannel(color: vec4f, channelIndex: i32) -> f32 {
    switch (channelIndex) {
        case 0: {
            return color.r; // Red channel (0)
        }
        case 1: {
            return color.g; // Green channel (1)
        }
        case 2: {
            return color.b; // Blue channel (2)
        }
        default: {
            return color.a; // Alpha channel (3)
        }
    }
}
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let uv: vec2f = input.vUV;
    
    // Sample red channel
    #ifdef RED_FROM_TEXTURE
    let redSample: vec4f = sampleTexture(uniforms.redTextureIndex, uv);
    let r: f32 = extractChannel(redSample, uniforms.redSourceChannel);
    #else
    let r: f32 = uniforms.redConstantValue;
    #endif
    
    // Sample green channel
    #ifdef GREEN_FROM_TEXTURE
    let greenSample: vec4f = sampleTexture(uniforms.greenTextureIndex, uv);
    let g: f32 = extractChannel(greenSample, uniforms.greenSourceChannel);
    #else
    let g: f32 = uniforms.greenConstantValue;
    #endif
    
    // Sample blue channel
    #ifdef BLUE_FROM_TEXTURE
    let blueSample: vec4f = sampleTexture(uniforms.blueTextureIndex, uv);
    let b: f32 = extractChannel(blueSample, uniforms.blueSourceChannel);
    #else
    let b: f32 = uniforms.blueConstantValue;
    #endif
    
    // Sample alpha channel
    #ifdef ALPHA_FROM_TEXTURE
    let alphaSample: vec4f = sampleTexture(uniforms.alphaTextureIndex, uv);
    let a: f32 = extractChannel(alphaSample, uniforms.alphaSourceChannel);
    #else
    let a: f32 = uniforms.alphaConstantValue;
    #endif
    
    fragmentOutputs.color = vec4f(r, g, b, a);
}