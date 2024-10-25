precision highp float;
                    
varying vec2 vUV;
        
uniform sampler2D textureSampler;
uniform sampler2D normalSampler;
uniform sampler2D depthSampler;
uniform float width;
uniform float height;
uniform vec3 edgeColor;
uniform float edgeIntensity;
uniform float edgeWidth;
uniform int renderMode; // 0: General, 1: Normal, 2: Depth, 3: Outline
        
vec3 boxBlur(sampler2D sampler, vec2 uv, vec2 texelSize) {
    vec3 result = vec3(0.0);
        
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture2D(sampler, uv + offset).rgb;
        }
    }
        
    return result / 9.0;
}
        
void main(void) {
    vec2 texelSize = vec2(1.0 / width, 1.0 / height);
        
    vec3 originalColor = texture2D(textureSampler, vUV).rgb;
        
    if (renderMode == 1 || renderMode == 2 || renderMode == 3) {
        // set background color to white for Normal, Outline Only
        if (length(originalColor) == 0.0) {
            originalColor = vec3(1.0, 1.0, 1.0); 
        }
        // set background color to white for Depth
        if (originalColor.r == 1.0 && originalColor.g == 0.0 && originalColor.b == 0.0) {
            originalColor = vec3(1.0, 1.0, 1.0); 
        }
    }
        
    vec3 normal = texture2D(normalSampler, vUV).rgb;
    float depth = texture2D(depthSampler, vUV).r;
    float edgeStrength = 0.0;
        
    int range = int(edgeWidth * 8.0); 
        
    for (int x = -range; x <= range; x++) {
        for (int y = -range; y <= range; y++) {
            if (x == 0 && y == 0) {
                continue;
            }
        
            vec3 neighborNormal = texture2D(normalSampler, vUV + texelSize * vec2(float(x), float(y))).rgb;
            float neighborDepth = texture2D(depthSampler, vUV + texelSize * vec2(float(x), float(y))).r;
            float normalDiff = length(neighborNormal - normal);
            float depthDiff = abs(neighborDepth - depth);
            edgeStrength = max(edgeStrength, max(normalDiff, depthDiff));
        }
    }
        
    edgeStrength = smoothstep(edgeWidth, edgeWidth + edgeIntensity, edgeStrength);
        
    vec3 finalColor = mix(originalColor, edgeColor, edgeStrength);
        
    gl_FragColor = vec4(finalColor, 1.0);
}