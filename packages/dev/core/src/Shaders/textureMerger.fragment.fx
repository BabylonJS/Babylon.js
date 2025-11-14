// Texture merging fragment shader
// Uses preprocessor defines to conditionally enable texture sampling

// Conditional texture uniforms based on defines
#ifdef USE_TEXTURE0
uniform sampler2D inputTexture0;
#endif
#ifdef USE_TEXTURE1
uniform sampler2D inputTexture1;
#endif
#ifdef USE_TEXTURE2
uniform sampler2D inputTexture2;
#endif
#ifdef USE_TEXTURE3
uniform sampler2D inputTexture3;
#endif

// Channel configuration uniforms (only for texture-based channels)
#ifdef RED_FROM_TEXTURE
uniform int redTextureIndex;
uniform int redSourceChannel;
#else
uniform float redConstantValue;
#endif

#ifdef GREEN_FROM_TEXTURE
uniform int greenTextureIndex;
uniform int greenSourceChannel;
#else
uniform float greenConstantValue;
#endif

#ifdef BLUE_FROM_TEXTURE
uniform int blueTextureIndex;
uniform int blueSourceChannel;
#else
uniform float blueConstantValue;
#endif

#ifdef ALPHA_FROM_TEXTURE
uniform int alphaTextureIndex;
uniform int alphaSourceChannel;
#else
uniform float alphaConstantValue;
#endif

// Input from vertex shader
varying vec2 vUV;

// Helper function to sample from a texture by index
#if defined(RED_FROM_TEXTURE) || defined(GREEN_FROM_TEXTURE) || defined(BLUE_FROM_TEXTURE) || defined(ALPHA_FROM_TEXTURE)
vec4 sampleTexture(int textureIndex, vec2 uv) {
    switch (textureIndex) {
        #ifdef USE_TEXTURE0
        case 0:
            return texture2D(inputTexture0, uv);
        #endif
        #ifdef USE_TEXTURE1
        case 1:
            return texture2D(inputTexture1, uv);
        #endif
        #ifdef USE_TEXTURE2
        case 2:
            return texture2D(inputTexture2, uv);
        #endif
        #ifdef USE_TEXTURE3
        case 3:
            return texture2D(inputTexture3, uv);
        #endif
        default:
            return vec4(0.0, 0.0, 0.0, 1.0); // Fallback
    }
}

// Helper function to extract a specific channel from a vec4
float extractChannel(vec4 color, int channelIndex) {
    switch (channelIndex) {
        case 0:
            return color.r; // Red channel (0)
        case 1:
            return color.g; // Green channel (1)
        case 2:
            return color.b; // Blue channel (2)
        default:
            return color.a; // Alpha channel (3)
    }
}
#endif

void main() {
    vec2 uv = vUV;
    
    // Sample red channel
    #ifdef RED_FROM_TEXTURE
    vec4 redSample = sampleTexture(redTextureIndex, uv);
    float r = extractChannel(redSample, redSourceChannel);
    #else
    float r = redConstantValue;
    #endif
    
    // Sample green channel
    #ifdef GREEN_FROM_TEXTURE
    vec4 greenSample = sampleTexture(greenTextureIndex, uv);
    float g = extractChannel(greenSample, greenSourceChannel);
    #else
    float g = greenConstantValue;
    #endif
    
    // Sample blue channel
    #ifdef BLUE_FROM_TEXTURE
    vec4 blueSample = sampleTexture(blueTextureIndex, uv);
    float b = extractChannel(blueSample, blueSourceChannel);
    #else
    float b = blueConstantValue;
    #endif
    
    // Sample alpha channel
    #ifdef ALPHA_FROM_TEXTURE
    vec4 alphaSample = sampleTexture(alphaTextureIndex, uv);
    float a = extractChannel(alphaSample, alphaSourceChannel);
    #else
    float a = alphaConstantValue;
    #endif
    
    gl_FragColor = vec4(r, g, b, a);
}