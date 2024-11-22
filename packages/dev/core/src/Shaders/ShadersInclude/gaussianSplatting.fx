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

struct Splat {
    vec4 center;
    vec4 color;
    vec4 covA;
    vec4 covB;
#if SH_DEGREE >= 1
    uvec4 sh0; // 4 * 32bits uint
#endif
#if SH_DEGREE >= 2
    uvec4 sh1;
#endif
#if SH_DEGREE == 3
    uvec4 sh2;
    uvec4 sh3;
#endif
};

Splat readSplat(float splatIndex)
{
    Splat splat;
    vec2 splatUV = getDataUV(splatIndex, dataTextureSize);
    splat.center = texture2D(centersTexture, splatUV);
    splat.color = texture2D(colorsTexture, splatUV);
    splat.covA = texture2D(covariancesATexture, splatUV) * splat.center.w;
    splat.covB = texture2D(covariancesBTexture, splatUV) * splat.center.w;
#if SH_DEGREE >= 1
    splat.sh0 = texture2D(shTexture0, splatUV);
#endif
#if SH_DEGREE >= 2
    splat.sh1 = texture2D(shTexture1, splatUV);
#endif
#if SH_DEGREE == 3
    splat.sh2 = texture2D(shTexture2, splatUV);
    splat.sh3 = texture2D(shTexture3, splatUV);
#endif

    return splat;
}
    
const float SH_C0 = 0.28209479;
const float SH_C1 = 0.48860251;
const float SH_C2[] = {
	1.092548430,
	-1.09254843,
	0.315391565,
	-1.09254843,
	0.546274215
};
const float SH_C3[] = {
	-0.59004358,
	2.890611442,
	-0.45704579,
	0.373176332,
	-0.45704579,
	1.445305721,
	-0.59004358
};

// dir = normalized(splat pos - cam pos)
vec3 computeColorFromSHDegree(vec3 dir, int deg, const vec3 sh[16])
{
	glm::vec3 result = SH_C0 * sh[0];

    float x = dir.x;
    float y = dir.y;
    float z = dir.z;
    result = result - SH_C1 * y * sh[1] + SH_C1 * z * sh[2] - SH_C1 * x * sh[3];

#if SH_DEGREE > 1
    float xx = x * x, yy = y * y, zz = z * z;
    float xy = x * y, yz = y * z, xz = x * z;
    result = result +
        SH_C2[0] * xy * sh[4] +
        SH_C2[1] * yz * sh[5] +
        SH_C2[2] * (2.0f * zz - xx - yy) * sh[6] +
        SH_C2[3] * xz * sh[7] +
        SH_C2[4] * (xx - yy) * sh[8];

#if SH_DEGREE > 2
    result = result +
        SH_C3[0] * y * (3.0f * xx - yy) * sh[9] +
        SH_C3[1] * xy * z * sh[10] +
        SH_C3[2] * y * (4.0f * zz - xx - yy) * sh[11] +
        SH_C3[3] * z * (2.0f * zz - 3.0f * xx - 3.0f * yy) * sh[12] +
        SH_C3[4] * x * (4.0f * zz - xx - yy) * sh[13] +
        SH_C3[5] * z * (xx - yy) * sh[14] +
        SH_C3[6] * x * (xx - 3.0f * yy) * sh[15];
#endif
#endif
	result += 0.5f;
    return result;
}

vec4 decompose(uint value)
{
    return vec4((((value >> uint(24))& 255u) * (2./255.)) - 1.,
                (((value >> uint(16))& 255u) * (2./255.)) - 1.,
                (((value >> uint( 8))& 255u) * (2./255.)) - 1.,
                (((value            )& 255u) * (2./255.)) - 1.);
}

vec3 computeSH(Splat splat, vec3 dir)
{
    vec3 sh[16];
    
#if SH_DEGREE >= 1
    vec4 sh00 = decompose(splat.sh0.x);
    vec4 sh01 = decompose(splat.sh0.y);
    vec4 sh02 = decompose(splat.sh0.z);
    vec4 sh03 = decompose(splat.sh0.w);
#endif
#if SH_DEGREE >= 2
    vec4 sh10 = decompose(splat.sh1.x);
    vec4 sh11 = decompose(splat.sh1.y);
    vec4 sh12 = decompose(splat.sh1.z);
    vec4 sh13 = decompose(splat.sh1.w);
#endif
#if SH_DEGREE == 3
    vec4 sh20 = decompose(splat.sh2.x);
    vec4 sh21 = decompose(splat.sh2.y);
    vec4 sh22 = decompose(splat.sh2.z);
    vec4 sh23 = decompose(splat.sh2.w);
    vec4 sh30 = decompose(splat.sh3.x);
    vec4 sh31 = decompose(splat.sh3.y);
    vec4 sh32 = decompose(splat.sh3.z);
    vec4 sh33 = decompose(splat.sh3.w);
#endif

    sh[0] = sh00.xyz;
    sh[1] = vec3(sh00.w, sh01.x, sh01.y);
    sh[2] = vec3(sh00.x, sh00.x, sh00.x);
    sh[3] = vec3(sh00.x, sh00.x, sh00.x);
    sh[4] = vec3(sh00.x, sh00.x, sh00.x);
    sh[5] = vec3(sh00.x, sh00.x, sh00.x);
    sh[6] = vec3(sh00.x, sh00.x, sh00.x);
    sh[7] = vec3(sh00.x, sh00.x, sh00.x);
    sh[8] = vec3(sh00.x, sh00.x, sh00.x);
    sh[9] = vec3(sh00.x, sh00.x, sh00.x);
    sh[10] = vec3(sh00.x, sh00.x, sh00.x);
    sh[11] = vec3(sh00.x, sh00.x, sh00.x);
    sh[12] = vec3(sh00.x, sh00.x, sh00.x);
    sh[13] = vec3(sh00.x, sh00.x, sh00.x);
    sh[14] = vec3(sh00.x, sh00.x, sh00.x);
    sh[15] = vec3(sh00.x, sh00.x, sh00.x);
    return computeColorFromSHDegree(dir, SH_DEGREE, sh[16]);
}

vec4 gaussianSplatting(vec2 meshPos, vec3 worldPos, vec2 scale, vec3 covA, vec3 covB, mat4 worldMatrix, mat4 viewMatrix, mat4 projectionMatrix)
{
    mat4 modelView = viewMatrix * worldMatrix;
    vec4 camspace = viewMatrix * vec4(worldPos,1.);
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

    mat3 J = mat3(
        focal.x / camspace.z, 0., -(focal.x * camspace.x) / (camspace.z * camspace.z), 
        0., focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z), 
        0., 0., 0.
    );

    mat3 invy = mat3(1,0,0, 0,-1,0,0,0,1);

    mat3 T = invy * transpose(mat3(modelView)) * J;
    mat3 cov2d = transpose(T) * Vrk * T;

    float mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
    float radius = length(vec2((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
    float lambda1 = mid + radius, lambda2 = mid - radius;

    if (lambda2 < 0.0)
    {
        return vec4(0.0, 0.0, 2.0, 1.0);
    }

    vec2 diagonalVector = normalize(vec2(cov2d[0][1], lambda1 - cov2d[0][0]));
    vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

    vec2 vCenter = vec2(pos2d);
    return vec4(
        vCenter 
        + ((meshPos.x * majorAxis
        + meshPos.y * minorAxis) * invViewport * pos2d.w) * scale, pos2d.zw);
}