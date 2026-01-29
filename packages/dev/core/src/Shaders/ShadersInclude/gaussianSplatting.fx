#if !defined(WEBGL2) && !defined(WEBGPU) && !defined(NATIVE)
mat3 transpose(mat3 matrix) {
    return mat3(matrix[0][0], matrix[1][0], matrix[2][0],
        matrix[0][1], matrix[1][1], matrix[2][1],
        matrix[0][2], matrix[1][2], matrix[2][2]);
}
#endif

vec2 getDataUV(float index, vec2 textureSize) {
    float y = floor(index / textureSize.x);
    float x = index - y * textureSize.x;
    return vec2((x + 0.5) / textureSize.x, (y + 0.5) / textureSize.y);
}

#if SH_DEGREE > 0 || IS_COMPOUND
ivec2 getDataUVint(float index, vec2 textureSize) {
    float y = floor(index / textureSize.x);
    float x = index - y * textureSize.x;
    return ivec2(uint(x + 0.5), uint(y + 0.5));
}
#endif

struct Splat {
    vec4 center;
    vec4 color;
    vec4 covA;
    vec4 covB;
#if SH_DEGREE > 0
    uvec4 sh0; // 4 * 32bits uint
#endif
#if SH_DEGREE > 1
    uvec4 sh1;
#endif
#if SH_DEGREE > 2
    uvec4 sh2;
#endif
#if IS_COMPOUND
    uint partIndex;
#endif
};

float getSplatIndex(int localIndex)
{
    float splatIndex;
    switch (localIndex)
    {
        case 0: splatIndex = splatIndex0.x; break;
        case 1: splatIndex = splatIndex0.y; break;
        case 2: splatIndex = splatIndex0.z; break;
        case 3: splatIndex = splatIndex0.w; break;

        case 4: splatIndex = splatIndex1.x; break;
        case 5: splatIndex = splatIndex1.y; break;
        case 6: splatIndex = splatIndex1.z; break;
        case 7: splatIndex = splatIndex1.w; break;

        case 8: splatIndex = splatIndex2.x; break;
        case 9: splatIndex = splatIndex2.y; break;
        case 10: splatIndex = splatIndex2.z; break;
        case 11: splatIndex = splatIndex2.w; break;

        case 12: splatIndex = splatIndex3.x; break;
        case 13: splatIndex = splatIndex3.y; break;
        case 14: splatIndex = splatIndex3.z; break;
        case 15: splatIndex = splatIndex3.w; break;
    }
    return splatIndex;
}

Splat readSplat(float splatIndex)
{
    Splat splat;
    vec2 splatUV = getDataUV(splatIndex, dataTextureSize);
    splat.center = texture2D(centersTexture, splatUV);
    splat.color = texture2D(colorsTexture, splatUV);
    splat.covA = texture2D(covariancesATexture, splatUV) * splat.center.w;
    splat.covB = texture2D(covariancesBTexture, splatUV) * splat.center.w;
#if SH_DEGREE > 0 || IS_COMPOUND
    ivec2 splatUVint = getDataUVint(splatIndex, dataTextureSize);
#endif
#if SH_DEGREE > 0
    splat.sh0 = texelFetch(shTexture0, splatUVint, 0);
#endif
#if SH_DEGREE > 1
    splat.sh1 = texelFetch(shTexture1, splatUVint, 0);
#endif
#if SH_DEGREE > 2
    splat.sh2 = texelFetch(shTexture2, splatUVint, 0);
#endif
#if IS_COMPOUND
    splat.partIndex = uint(texture2D(partIndicesTexture, splatUV).r * 255.0 + 0.5);
#endif
    return splat;
}
    
#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
// no SH for GS and WebGL1
// dir = normalized(splat pos - cam pos)
vec3 computeColorFromSHDegree(vec3 dir, const vec3 sh[16])
{
    const float SH_C0 = 0.28209479;
    const float SH_C1 = 0.48860251;
    float SH_C2[5];
    SH_C2[0] = 1.092548430;
    SH_C2[1] = -1.09254843;
    SH_C2[2] = 0.315391565;
    SH_C2[3] = -1.09254843;
    SH_C2[4] = 0.546274215;
    
    float SH_C3[7];
    SH_C3[0] = -0.59004358;
    SH_C3[1] = 2.890611442;
    SH_C3[2] = -0.45704579;
    SH_C3[3] = 0.373176332;
    SH_C3[4] = -0.45704579;
    SH_C3[5] = 1.445305721;
    SH_C3[6] = -0.59004358;

	vec3 result = /*SH_C0 * */sh[0];

#if SH_DEGREE > 0
    float x = dir.x;
    float y = dir.y;
    float z = dir.z;
    result += - SH_C1 * y * sh[1] + SH_C1 * z * sh[2] - SH_C1 * x * sh[3];

#if SH_DEGREE > 1
    float xx = x * x, yy = y * y, zz = z * z;
    float xy = x * y, yz = y * z, xz = x * z;
    result += 
        SH_C2[0] * xy * sh[4] +
        SH_C2[1] * yz * sh[5] +
        SH_C2[2] * (2.0 * zz - xx - yy) * sh[6] +
        SH_C2[3] * xz * sh[7] +
        SH_C2[4] * (xx - yy) * sh[8];

#if SH_DEGREE > 2
    result += 
        SH_C3[0] * y * (3.0 * xx - yy) * sh[9] +
        SH_C3[1] * xy * z * sh[10] +
        SH_C3[2] * y * (4.0 * zz - xx - yy) * sh[11] +
        SH_C3[3] * z * (2.0 * zz - 3.0 * xx - 3.0 * yy) * sh[12] +
        SH_C3[4] * x * (4.0 * zz - xx - yy) * sh[13] +
        SH_C3[5] * z * (xx - yy) * sh[14] +
        SH_C3[6] * x * (xx - 3.0 * yy) * sh[15];
#endif
#endif
#endif

    return result;
}

vec4 decompose(uint value)
{
    vec4 components = vec4(
                        float((value            ) & 255u),
                        float((value >> uint( 8)) & 255u),
                        float((value >> uint(16)) & 255u),
                        float((value >> uint(24)) & 255u));

    return components * vec4(2./255.) - vec4(1.);
}

vec3 computeSH(Splat splat, vec3 dir)
{
    vec3 sh[16];
    
    sh[0] = vec3(0.,0.,0.);
#if SH_DEGREE > 0
    vec4 sh00 = decompose(splat.sh0.x);
    vec4 sh01 = decompose(splat.sh0.y);
    vec4 sh02 = decompose(splat.sh0.z);

    sh[1] = vec3(sh00.x, sh00.y, sh00.z);
    sh[2] = vec3(sh00.w, sh01.x, sh01.y);
    sh[3] = vec3(sh01.z, sh01.w, sh02.x);
#endif
#if SH_DEGREE > 1
    vec4 sh03 = decompose(splat.sh0.w);
    vec4 sh04 = decompose(splat.sh1.x);
    vec4 sh05 = decompose(splat.sh1.y);

    sh[4] = vec3(sh02.y, sh02.z, sh02.w);
    sh[5] = vec3(sh03.x, sh03.y, sh03.z);
    sh[6] = vec3(sh03.w, sh04.x, sh04.y);
    sh[7] = vec3(sh04.z, sh04.w, sh05.x);
    sh[8] = vec3(sh05.y, sh05.z, sh05.w);
#endif
#if SH_DEGREE > 2
    vec4 sh06 = decompose(splat.sh1.z);
    vec4 sh07 = decompose(splat.sh1.w);
    vec4 sh08 = decompose(splat.sh2.x);
    vec4 sh09 = decompose(splat.sh2.y);
    vec4 sh10 = decompose(splat.sh2.z);
    vec4 sh11 = decompose(splat.sh2.w);

    sh[9] = vec3(sh06.x, sh06.y, sh06.z);
    sh[10] = vec3(sh06.w, sh07.x, sh07.y);
    sh[11] = vec3(sh07.z, sh07.w, sh08.x);
    sh[12] = vec3(sh08.y, sh08.z, sh08.w);
    sh[13] = vec3(sh09.x, sh09.y, sh09.z);
    sh[14] = vec3(sh09.w, sh10.x, sh10.y);
    sh[15] = vec3(sh10.z, sh10.w, sh11.x);    
#endif

    return computeColorFromSHDegree(dir, sh);
}
#else
vec3 computeSH(Splat splat, vec3 dir)
{
    return vec3(0.,0.,0.);
}
#endif

vec4 gaussianSplatting(vec2 meshPos, vec3 worldPos, vec2 scale, vec3 covA, vec3 covB, mat4 worldMatrix, mat4 viewMatrix, mat4 projectionMatrix)
{
    mat4 modelView = viewMatrix * worldMatrix;
    vec4 camspace = viewMatrix * vec4(worldPos, 1.);
    vec4 pos2d = projectionMatrix * camspace;

    float bounds = 1.2 * pos2d.w;
    if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds
        || pos2d.y < -bounds || pos2d.y > bounds) {
        return vec4(0.0, 0.0, 2.0, 1.0);
    }

    mat3 Vrk = mat3(
        covA.x, covA.y, covA.z, 
        covA.y, covB.x, covB.y,
        covA.z, covB.y, covB.z
    );

    // Detect if projection is orthographic (projectionMatrix[3][3] == 1.0)
    bool isOrtho = abs(projectionMatrix[3][3] - 1.0) < 0.001;
    
    mat3 J;
    if (isOrtho) {
        // Orthographic projection: no perspective division needed
        // Just the focal/scale terms without z-dependence
        J = mat3(
            focal.x, 0., 0., 
            0., focal.y, 0., 
            0., 0., 0.
        );
    } else {
        // Perspective projection: original Jacobian with z-dependence
        J = mat3(
            focal.x / camspace.z, 0., -(focal.x * camspace.x) / (camspace.z * camspace.z), 
            0., focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z), 
            0., 0., 0.
        );
    }

    mat3 T = transpose(mat3(modelView)) * J;
    mat3 cov2d = transpose(T) * Vrk * T;

#if COMPENSATION
    float c00 = cov2d[0][0];
    float c11 = cov2d[1][1];
    float c01 = cov2d[0][1];
    float detOrig = c00 * c11 - c01 * c01;
#endif

    cov2d[0][0] += kernelSize;
    cov2d[1][1] += kernelSize;

#if COMPENSATION
    vec3 c2d = vec3(cov2d[0][0], c01, cov2d[1][1]);
    float detBlur = c2d.x * c2d.z - c2d.y * c2d.y;
    float compensation = sqrt(max(0., detOrig / detBlur));
    vColor.w *= compensation;
#endif

    float mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
    float radius = length(vec2((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
    float epsilon = 0.0001;
    float lambda1 = mid + radius + epsilon, lambda2 = mid - radius + epsilon;

    if (lambda2 < 0.0)
    {
        return vec4(0.0, 0.0, 2.0, 1.0);
    }

    vec2 diagonalVector = normalize(vec2(cov2d[0][1], lambda1 - cov2d[0][0]));
    vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

    vec2 vCenter = vec2(pos2d);
    
    // For ortho projection, pos2d.w is 1.0
    float scaleFactor = isOrtho ? 1.0 : pos2d.w;
    
    return vec4(
        vCenter 
        + ((meshPos.x * majorAxis
        + meshPos.y * minorAxis) * invViewport * scaleFactor) * scale, pos2d.zw);
}

#if IS_COMPOUND
mat4 getPartWorld(uint partIndex) {
    return partWorld[partIndex];
}
#endif
