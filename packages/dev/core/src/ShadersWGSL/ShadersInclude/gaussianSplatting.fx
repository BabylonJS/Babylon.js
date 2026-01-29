fn getDataUV(index: f32, dataTextureSize: vec2f) -> vec2<f32> {
    let y: f32 = floor(index / dataTextureSize.x);
    let x: f32 = index - y * dataTextureSize.x;
    return vec2f((x + 0.5), (y + 0.5));
}

struct Splat {
    center: vec4f,
    color: vec4f,
    covA: vec4f,
    covB: vec4f,
#if SH_DEGREE > 0
    sh0: vec4<u32>,
#endif
#if SH_DEGREE > 1
    sh1: vec4<u32>,
#endif
#if SH_DEGREE > 2
    sh2: vec4<u32>,
#endif
#if IS_COMPOUND
    partIndex: u32,
#endif
};

fn getSplatIndex(localIndex: i32, splatIndex0: vec4f, splatIndex1: vec4f, splatIndex2: vec4f, splatIndex3: vec4f) -> f32 {
    var splatIndex: f32;
    switch (localIndex)
    {
        case 0:
        {
            splatIndex = splatIndex0.x;
            break;
        }
        case 1:
        {
            splatIndex = splatIndex0.y;
            break;
        }
        case 2:
        {
            splatIndex = splatIndex0.z;
            break;
        }
        case 3:
        {
            splatIndex = splatIndex0.w;
            break;
        }

        case 4:
        {
            splatIndex = splatIndex1.x;
            break;
        }
        case 5:
        {
            splatIndex = splatIndex1.y;
            break;
        }
        case 6:
        {
            splatIndex = splatIndex1.z;
            break;
        }
        case 7:
        {
            splatIndex = splatIndex1.w;
            break;
        }

        case 8:
        {
            splatIndex = splatIndex2.x;
            break;
        }
        case 9:
        {
            splatIndex = splatIndex2.y;
            break;
        }
        case 10:
        {
            splatIndex = splatIndex2.z;
            break;
        }
        case 11:
        {
            splatIndex = splatIndex2.w;
            break;
        }

        case 12:
        {
            splatIndex = splatIndex3.x;
            break;
        }
        case 13:
        {
            splatIndex = splatIndex3.y;
            break;
        }
        case 14:
        {
            splatIndex = splatIndex3.z;
            break;
        }
        default:
        {
            splatIndex = splatIndex3.w;
            break;
        }
    }
    return splatIndex;
}

fn readSplat(splatIndex: f32, dataTextureSize: vec2f) -> Splat {
    var splat: Splat;
    let splatUV = getDataUV(splatIndex, dataTextureSize);
    let splatUVi32 = vec2<i32>(i32(splatUV.x), i32(splatUV.y));
    splat.center = textureLoad(centersTexture, splatUVi32, 0);
    splat.color = textureLoad(colorsTexture, splatUVi32, 0);
    splat.covA = textureLoad(covariancesATexture, splatUVi32, 0) * splat.center.w;
    splat.covB = textureLoad(covariancesBTexture, splatUVi32, 0) * splat.center.w;
#if SH_DEGREE > 0
    splat.sh0 = textureLoad(shTexture0, splatUVi32, 0);
#endif
#if SH_DEGREE > 1
    splat.sh1 = textureLoad(shTexture1, splatUVi32, 0);
#endif
#if SH_DEGREE > 2
    splat.sh2 = textureLoad(shTexture2, splatUVi32, 0);
#endif
#if IS_COMPOUND
    splat.partIndex = u32(textureLoad(partIndicesTexture, splatUVi32, 0).r * 255.0 + 0.5);
#endif
    return splat;
}

fn computeColorFromSHDegree(dir: vec3f, sh: array<vec3<f32>, 16>) -> vec3f
{
    let SH_C0: f32 = 0.28209479;
    let SH_C1: f32 = 0.48860251;
    var SH_C2: array<f32, 5> = array<f32, 5>(
        1.092548430,
        -1.09254843,
        0.315391565,
        -1.09254843,
        0.546274215
    );

    var SH_C3: array<f32, 7> = array<f32, 7>(
        -0.59004358,
        2.890611442,
        -0.45704579,
        0.373176332,
        -0.45704579,
        1.445305721,
        -0.59004358
    );

	var result: vec3f = /*SH_C0 * */sh[0];

#if SH_DEGREE > 0
    let x: f32 = dir.x;
    let y: f32 = dir.y;
    let z: f32 = dir.z;

    result += -SH_C1 * y * sh[1] + SH_C1 * z * sh[2] - SH_C1 * x * sh[3];
#if SH_DEGREE > 1
    let xx: f32 = x * x;
    let yy: f32 = y * y;
    let zz: f32 = z * z;
    let xy: f32 = x * y;
    let yz: f32 = y * z;
    let xz: f32 = x * z;
    result += 
        SH_C2[0] * xy * sh[4] +
        SH_C2[1] * yz * sh[5] +
        SH_C2[2] * (2.0f * zz - xx - yy) * sh[6] +
        SH_C2[3] * xz * sh[7] +
        SH_C2[4] * (xx - yy) * sh[8];

#if SH_DEGREE > 2
    result += 
        SH_C3[0] * y * (3.0f * xx - yy) * sh[9] +
        SH_C3[1] * xy * z * sh[10] +
        SH_C3[2] * y * (4.0f * zz - xx - yy) * sh[11] +
        SH_C3[3] * z * (2.0f * zz - 3.0f * xx - 3.0f * yy) * sh[12] +
        SH_C3[4] * x * (4.0f * zz - xx - yy) * sh[13] +
        SH_C3[5] * z * (xx - yy) * sh[14] +
        SH_C3[6] * x * (xx - 3.0f * yy) * sh[15];
#endif
#endif
#endif

    return result;
}

fn decompose(value: u32) -> vec4f
{
    let components : vec4f = vec4f(
                        f32((value           ) & 255u),
                        f32((value >> u32( 8)) & 255u),
                        f32((value >> u32(16)) & 255u),
                        f32((value >> u32(24)) & 255u));

    return components * vec4f(2./255.) - vec4f(1.);
}

fn computeSH(splat: Splat, dir: vec3f) -> vec3f
{
    var sh: array<vec3<f32>, 16>;
    
    sh[0] = vec3f(0., 0., 0.);

#if SH_DEGREE > 0
    let sh00: vec4f = decompose(splat.sh0.x);
    let sh01: vec4f = decompose(splat.sh0.y);
    let sh02: vec4f = decompose(splat.sh0.z);

    sh[1] = vec3f(sh00.x, sh00.y, sh00.z);
    sh[2] = vec3f(sh00.w, sh01.x, sh01.y);
    sh[3] = vec3f(sh01.z, sh01.w, sh02.x);
#endif
#if SH_DEGREE > 1
    let sh03: vec4f = decompose(splat.sh0.w);
    let sh04: vec4f = decompose(splat.sh1.x);
    let sh05: vec4f = decompose(splat.sh1.y);

    sh[4] = vec3f(sh02.y, sh02.z, sh02.w);
    sh[5] = vec3f(sh03.x, sh03.y, sh03.z);
    sh[6] = vec3f(sh03.w, sh04.x, sh04.y);
    sh[7] = vec3f(sh04.z, sh04.w, sh05.x);
    sh[8] = vec3f(sh05.y, sh05.z, sh05.w);
#endif
#if SH_DEGREE > 2
    let sh06: vec4f = decompose(splat.sh1.z);
    let sh07: vec4f = decompose(splat.sh1.w);
    let sh08: vec4f = decompose(splat.sh2.x);
    let sh09: vec4f = decompose(splat.sh2.y);
    let sh10: vec4f = decompose(splat.sh2.z);
    let sh11: vec4f = decompose(splat.sh2.w);

    sh[9] = vec3f(sh06.x, sh06.y, sh06.z);
    sh[10] = vec3f(sh06.w, sh07.x, sh07.y);
    sh[11] = vec3f(sh07.z, sh07.w, sh08.x);
    sh[12] = vec3f(sh08.y, sh08.z, sh08.w);
    sh[13] = vec3f(sh09.x, sh09.y, sh09.z);
    sh[14] = vec3f(sh09.w, sh10.x, sh10.y);
    sh[15] = vec3f(sh10.z, sh10.w, sh11.x);    
#endif

    return computeColorFromSHDegree(dir, sh);
}

fn gaussianSplatting(
    meshPos: vec2<f32>, 
    worldPos: vec3<f32>, 
    scale: vec2<f32>, 
    covA: vec3<f32>, 
    covB: vec3<f32>, 
    worldMatrix: mat4x4<f32>, 
    viewMatrix: mat4x4<f32>, 
    projectionMatrix: mat4x4<f32>,
    focal: vec2f,
    invViewport: vec2f,
    kernelSize: f32
) -> vec4f {
    let modelView = viewMatrix * worldMatrix;
    let camspace = viewMatrix * vec4f(worldPos, 1.0);
    let pos2d = projectionMatrix * camspace;

    let bounds = 1.2 * pos2d.w;
    if (pos2d.z < 0. || pos2d.x < -bounds || pos2d.x > bounds || pos2d.y < -bounds || pos2d.y > bounds) {
        return vec4f(0.0, 0.0, 2.0, 1.0);
    }

    let Vrk = mat3x3<f32>(
        covA.x, covA.y, covA.z, 
        covA.y, covB.x, covB.y,
        covA.z, covB.y, covB.z
    );

    // Detect if projection is orthographic (projectionMatrix[3][3] == 1.0)
    let isOrtho = abs(projectionMatrix[3][3] - 1.0) < 0.001;
    
    var J: mat3x3<f32>;
    if (isOrtho) {
        // Orthographic projection: no perspective division needed
        // Just the focal/scale terms without z-dependence
        J = mat3x3<f32>(
            focal.x, 0.0, 0.0,
            0.0, focal.y, 0.0,
            0.0, 0.0, 0.0
        );
    } else {
        // Perspective projection: original Jacobian with z-dependence
        J = mat3x3<f32>(
            focal.x / camspace.z, 0.0, -(focal.x * camspace.x) / (camspace.z * camspace.z),
            0.0, focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z),
            0.0, 0.0, 0.0
        );
    }

    let T = transpose(mat3x3<f32>(
        modelView[0].xyz,
        modelView[1].xyz,
        modelView[2].xyz)) * J;
    var cov2d = transpose(T) * Vrk * T;

#if COMPENSATION
    let c00: f32 = cov2d[0][0];
    let c11: f32 = cov2d[1][1];
    let c01: f32 = cov2d[0][1];
    let detOrig: f32 = c00 * c11 - c01 * c01;
#endif

    cov2d[0][0] += kernelSize;
    cov2d[1][1] += kernelSize;

#if COMPENSATION
    let c2d: vec3f = vec3f(cov2d[0][0], c01, cov2d[1][1]);
    let detBlur: f32 = c2d.x * c2d.z - c2d.y * c2d.y;
    let compensation: f32 = sqrt(max(0., detOrig / detBlur));
    vertexOutputs.vColor.w *= compensation;
#endif
    
    let mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
    let radius = length(vec2<f32>((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
    let lambda1 = mid + radius;
    let lambda2 = mid - radius;

    if (lambda2 < 0.0) {
        return vec4f(0.0, 0.0, 2.0, 1.0);
    }

    let diagonalVector = normalize(vec2<f32>(cov2d[0][1], lambda1 - cov2d[0][0]));
    let majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    let minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2<f32>(diagonalVector.y, -diagonalVector.x);

    let vCenter = vec2<f32>(pos2d.x, pos2d.y);
    
    // For ortho projection, pos2d.w is 1.0r
    let scaleFactor = select(pos2d.w, 1.0, isOrtho);
    
    return vec4f(
        vCenter + ((meshPos.x * majorAxis + meshPos.y * minorAxis) * invViewport * scaleFactor) * scale, 
        pos2d.z, 
        pos2d.w
    );
}

#if IS_COMPOUND
fn getPartWorld(partIndex: u32) -> mat4x4<f32> {
    return uniforms.partWorld[partIndex];
}
#endif
