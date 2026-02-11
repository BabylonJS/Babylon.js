varying vec2 vPosition;
flat varying float vMeshID;

void main(void) {
    // Gaussian discard - same as gaussianSplattingFragmentDeclaration
    float A = -dot(vPosition, vPosition);
    if (A < -4.0) discard;

    // Encode picking ID into RGB
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
    int castedId = int(vMeshID);
    vec3 color = vec3(
        float((castedId >> 16) & 0xFF),
        float((castedId >> 8) & 0xFF),
        float(castedId & 0xFF)
    ) / 255.0;
    gl_FragColor = vec4(color, 1.0);
#else
    float castedId = floor(vMeshID + 0.5);
    vec3 color = vec3(
        floor(mod(castedId, 16777216.0) / 65536.0),
        floor(mod(castedId, 65536.0) / 256.0),
        mod(castedId, 256.0)
    ) / 255.0;
    gl_FragColor = vec4(color, 1.0);
#endif
}
