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
#if SH_DEGREE > 3
    sh3: vec4<u32>,
    sh4: vec4<u32>,
#endif
#if IS_COMPOUND
    partIndex: u32,
#endif
#if defined(IS_FOR_VOXELIZATION)
    rotationA: vec4f,
    rotationB: vec4f,
    rotationScale: vec4f,
#endif
#ifdef USE_SOG
    splatIndex: f32,
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
#ifdef USE_SOG
    let mL = textureLoad(centersTexture, splatUVi32, 0);
    let mU = textureLoad(covariancesATexture, splatUVi32, 0);
    let sRaw = textureLoad(covariancesBTexture, splatUVi32, 0);
    let qRaw = textureLoad(sogQuatsTexture, splatUVi32, 0);
    let c0 = textureLoad(colorsTexture, splatUVi32, 0);

    let q16 = (mU.xyz * 256.0 + mL.xyz) * (255.0 / 65535.0);
    let nPos = mix(uniforms.sogMeansMin, uniforms.sogMeansMax, q16);
    let center3 = sign(nPos) * (exp(abs(nPos)) - vec3f(1.0));
    splat.center = vec4f(center3, 1.0);

#ifdef USE_SOG_V2
    let sIdx = floor(sRaw.xyz * 255.0 + 0.5);
    var splatScale: vec3f;
    splatScale.x = exp(textureLoad(sogCodebookTexture, vec2<i32>(i32(sIdx.x), 0), 0).r);
    splatScale.y = exp(textureLoad(sogCodebookTexture, vec2<i32>(i32(sIdx.y), 0), 0).r);
    splatScale.z = exp(textureLoad(sogCodebookTexture, vec2<i32>(i32(sIdx.z), 0), 0).r);
#else
    let splatScale = exp(mix(uniforms.sogScalesMin, uniforms.sogScalesMax, sRaw.xyz));
#endif

    let invSqrt2: f32 = 0.70710678118;
    let qabc = (qRaw.xyz - vec3f(0.5)) * 2.0 * invSqrt2;
    let qMode = i32(qRaw.w * 255.0 + 0.5) - 252;
    let qd = sqrt(max(0.0, 1.0 - dot(qabc, qabc)));
    var quat: vec4f;
    if (qMode == 0) { quat = vec4f(qd, qabc.x, qabc.y, qabc.z); }
    else if (qMode == 1) { quat = vec4f(qabc.x, qd, qabc.y, qabc.z); }
    else if (qMode == 2) { quat = vec4f(qabc.x, qabc.y, qd, qabc.z); }
    else { quat = vec4f(qabc.x, qabc.y, qabc.z, qd); }

    let qw = quat.x; let qx = quat.y; let qy = quat.z; let qz = quat.w;
    let R = mat3x3<f32>(
        1.0 - 2.0*(qy*qy + qz*qz), 2.0*(qx*qy + qw*qz),       2.0*(qx*qz - qw*qy),
        2.0*(qx*qy - qw*qz),       1.0 - 2.0*(qx*qx + qz*qz), 2.0*(qy*qz + qw*qx),
        2.0*(qx*qz + qw*qy),       2.0*(qy*qz - qw*qx),       1.0 - 2.0*(qx*qx + qy*qy)
    );
    let S2 = mat3x3<f32>(
        4.0*splatScale.x*splatScale.x, 0.0, 0.0,
        0.0, 4.0*splatScale.y*splatScale.y, 0.0,
        0.0, 0.0, 4.0*splatScale.z*splatScale.z
    );
    let Sigma = R * S2 * transpose(R);
    splat.covA = vec4f(Sigma[0][0], Sigma[0][1], Sigma[0][2], Sigma[1][1]);
    splat.covB = vec4f(Sigma[1][2], Sigma[2][2], 0.0, 0.0);

    let SH_C0_SOG: f32 = 0.28209479177387814;
#ifdef USE_SOG_V2
    var c3: vec3f;
    c3.x = textureLoad(sogCodebookTexture, vec2<i32>(256 + i32(c0.x * 255.0 + 0.5), 0), 0).r;
    c3.y = textureLoad(sogCodebookTexture, vec2<i32>(256 + i32(c0.y * 255.0 + 0.5), 0), 0).r;
    c3.z = textureLoad(sogCodebookTexture, vec2<i32>(256 + i32(c0.z * 255.0 + 0.5), 0), 0).r;
    let colRgb = vec3f(0.5) + c3 * SH_C0_SOG;
    let colA = c0.w;
#else
    let cLerp = mix(uniforms.sogSh0Min, uniforms.sogSh0Max, c0);
    let colRgb = vec3f(0.5) + cLerp.xyz * SH_C0_SOG;
    let colA = 1.0 / (1.0 + exp(-cLerp.w));
#endif
    splat.color = vec4f(colRgb, colA);
    splat.splatIndex = splatIndex;
#else
    splat.center = textureLoad(centersTexture, splatUVi32, 0);
    splat.color = textureLoad(colorsTexture, splatUVi32, 0);
#if !defined(IS_FOR_VOXELIZATION)
    splat.covA = textureLoad(covariancesATexture, splatUVi32, 0) * splat.center.w;
    splat.covB = textureLoad(covariancesBTexture, splatUVi32, 0) * splat.center.w;
#endif
#endif
#if SH_DEGREE > 0 && !defined(USE_SOG)
    splat.sh0 = textureLoad(shTexture0, splatUVi32, 0);
#endif
#if SH_DEGREE > 1 && !defined(USE_SOG)
    splat.sh1 = textureLoad(shTexture1, splatUVi32, 0);
#endif
#if SH_DEGREE > 2 && !defined(USE_SOG)
    splat.sh2 = textureLoad(shTexture2, splatUVi32, 0);
#endif
#if SH_DEGREE > 3 && !defined(USE_SOG)
    splat.sh3 = textureLoad(shTexture3, splatUVi32, 0);
    splat.sh4 = textureLoad(shTexture4, splatUVi32, 0);
#endif
#if IS_COMPOUND
    splat.partIndex = u32(textureLoad(partIndicesTexture, splatUVi32, 0).r * 255.0 + 0.5);
#endif
#if defined(IS_FOR_VOXELIZATION)
    splat.rotationA = textureLoad(rotationsATexture, splatUVi32, 0);
    splat.rotationB = textureLoad(rotationsBTexture, splatUVi32, 0);
    splat.rotationScale = textureLoad(rotationScaleTexture, splatUVi32, 0);
#endif
    return splat;
}

fn computeColorFromSHDegree(dir: vec3f, sh: array<vec3<f32>, 25>, _so1: f32, _so2: f32, _so3: f32, _so4: f32) -> vec3f
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

    var SH_C4: array<f32, 9> = array<f32, 9>(
         2.5033429418,
        -1.7701307698,
         0.9461746958,
        -0.6690465436,
         0.1057855469,
        -0.6690465436,
         0.4730873479,
        -1.7701307698,
         0.6258357354
    );

	var result: vec3f = /*SH_C0 * */sh[0];

#if SH_DEGREE > 0
    let x: f32 = dir.x;
    let y: f32 = dir.y;
    let z: f32 = dir.z;

    result += _so1 * (-SH_C1 * y * sh[1] + SH_C1 * z * sh[2] - SH_C1 * x * sh[3]);
#if SH_DEGREE > 1
    let xx: f32 = x * x;
    let yy: f32 = y * y;
    let zz: f32 = z * z;
    let xy: f32 = x * y;
    let yz: f32 = y * z;
    let xz: f32 = x * z;
    result += _so2 * (
        SH_C2[0] * xy * sh[4] +
        SH_C2[1] * yz * sh[5] +
        SH_C2[2] * (2.0f * zz - xx - yy) * sh[6] +
        SH_C2[3] * xz * sh[7] +
        SH_C2[4] * (xx - yy) * sh[8]);

#if SH_DEGREE > 2
    result += _so3 * (
        SH_C3[0] * y * (3.0f * xx - yy) * sh[9] +
        SH_C3[1] * xy * z * sh[10] +
        SH_C3[2] * y * (4.0f * zz - xx - yy) * sh[11] +
        SH_C3[3] * z * (2.0f * zz - 3.0f * xx - 3.0f * yy) * sh[12] +
        SH_C3[4] * x * (4.0f * zz - xx - yy) * sh[13] +
        SH_C3[5] * z * (xx - yy) * sh[14] +
        SH_C3[6] * x * (xx - 3.0f * yy) * sh[15]);

#if SH_DEGREE > 3
    result += _so4 * (
        SH_C4[0] * x * y * (xx - yy) * sh[16] +
        SH_C4[1] * y * z * (3.0f * xx - yy) * sh[17] +
        SH_C4[2] * x * y * (7.0f * zz - 1.0f) * sh[18] +
        SH_C4[3] * y * z * (7.0f * zz - 3.0f) * sh[19] +
        SH_C4[4] * (zz * (35.0f * zz - 30.0f) + 3.0f) * sh[20] +
        SH_C4[5] * x * z * (7.0f * zz - 3.0f) * sh[21] +
        SH_C4[6] * (xx - yy) * (7.0f * zz - 1.0f) * sh[22] +
        SH_C4[7] * x * z * (xx - 3.0f * yy) * sh[23] +
        SH_C4[8] * (xx * (xx - 3.0f * yy) - yy * (3.0f * xx - yy)) * sh[24]);
#endif
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

#ifdef USE_SOG
fn computeSH(splat: Splat, dir: vec3f) -> vec3f
{
#if SH_DEGREE > 0
    var sh: array<vec3<f32>, 25>;
    sh[0] = vec3f(0., 0., 0.);

    let labelSize = textureDimensions(sogShNLabelsTexture, 0);
    let idx = i32(splat.splatIndex + 0.5);
    let lw = i32(labelSize.x);
    let lx = idx - (idx / lw) * lw;
    let ly = idx / lw;
    let labelRaw = textureLoad(sogShNLabelsTexture, vec2<i32>(lx, ly), 0);
    let n = i32(labelRaw.r * 255.0 + 0.5) + i32(labelRaw.g * 255.0 + 0.5) * 256;

    let coeffs = i32(uniforms.sogShCoeffCount + 0.5);
    let u = (n - (n / 64) * 64) * coeffs;
    let v = n / 64;

    for (var k: i32 = 0; k < 24; k = k + 1) {
        if (k >= coeffs) { break; }
        let centroidRaw = textureLoad(sogShNCentroidsTexture, vec2<i32>(u + k, v), 0);
        var shCoeff: vec3f;
#ifdef USE_SOG_V2
        let rIdx = i32(centroidRaw.r * 255.0 + 0.5);
        let gIdx = i32(centroidRaw.g * 255.0 + 0.5);
        let bIdx = i32(centroidRaw.b * 255.0 + 0.5);
        shCoeff.r = textureLoad(sogCodebookTexture, vec2<i32>(512 + rIdx, 0), 0).r;
        shCoeff.g = textureLoad(sogCodebookTexture, vec2<i32>(512 + gIdx, 0), 0).r;
        shCoeff.b = textureLoad(sogCodebookTexture, vec2<i32>(512 + bIdx, 0), 0).r;
#else
        shCoeff = mix(vec3f(uniforms.sogShnMin), vec3f(uniforms.sogShnMax), centroidRaw.rgb);
#endif
        sh[k + 1] = shCoeff;
    }

    return computeColorFromSHDegree(dir, sh, 1., 1., 1., 1.);
#else
    return vec3f(0., 0., 0.);
#endif
}
#else
fn computeSHWeighted(splat: Splat, dir: vec3f, _so1: f32, _so2: f32, _so3: f32, _so4: f32) -> vec3f
{
    var sh: array<vec3<f32>, 25>;

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
#if SH_DEGREE > 3
    // sh[16] R/G/B are in sh11.y/z/w (j=45,46,47 — last 3 bytes of texture2)
    let sh12: vec4f = decompose(splat.sh3.x);
    let sh13: vec4f = decompose(splat.sh3.y);
    let sh14: vec4f = decompose(splat.sh3.z);
    let sh15: vec4f = decompose(splat.sh3.w);
    let sh16: vec4f = decompose(splat.sh4.x);
    let sh17: vec4f = decompose(splat.sh4.y);

    sh[16] = vec3f(sh11.y, sh11.z, sh11.w);
    sh[17] = vec3f(sh12.x, sh12.y, sh12.z);
    sh[18] = vec3f(sh12.w, sh13.x, sh13.y);
    sh[19] = vec3f(sh13.z, sh13.w, sh14.x);
    sh[20] = vec3f(sh14.y, sh14.z, sh14.w);
    sh[21] = vec3f(sh15.x, sh15.y, sh15.z);
    sh[22] = vec3f(sh15.w, sh16.x, sh16.y);
    sh[23] = vec3f(sh16.z, sh16.w, sh17.x);
    sh[24] = vec3f(sh17.y, sh17.z, sh17.w);
#endif
    return computeColorFromSHDegree(dir, sh, _so1, _so2, _so3, _so4);
}

fn computeSH(splat: Splat, dir: vec3f) -> vec3f
{
#if !defined(GS_DBG_ENABLED) || GS_DBG_SH_ORDER1 == 1
    let _w1: f32 = 1.0;
#else
    let _w1: f32 = 0.0;
#endif
#if !defined(GS_DBG_ENABLED) || GS_DBG_SH_ORDER2 == 1
    let _w2: f32 = 1.0;
#else
    let _w2: f32 = 0.0;
#endif
#if !defined(GS_DBG_ENABLED) || GS_DBG_SH_ORDER3 == 1
    let _w3: f32 = 1.0;
#else
    let _w3: f32 = 0.0;
#endif
#if !defined(GS_DBG_ENABLED) || GS_DBG_SH_ORDER4 == 1
    let _w4: f32 = 1.0;
#else
    let _w4: f32 = 0.0;
#endif
    return computeSHWeighted(splat, dir, _w1, _w2, _w3, _w4);
}
#endif

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

#if defined(IS_FOR_VOXELIZATION)
fn computeVoxelSplatWorldPos(rotationA: vec4f, rotationB: vec4f, rotationScale: vec4f, center: vec3f, splatWorld: mat4x4f, viewMatrix: mat4x4f, invWorldScale: mat4x4f, quadPos: vec2f) -> vec4f {
    let splatRotation = mat3x3f(
        rotationA.xyz,
        vec3f(rotationA.w, rotationB.x, rotationB.y),
        vec3f(rotationB.z, rotationB.w, rotationScale.x)
    );
    let splatScale = rotationScale.yzw;

    let view3x3 = mat3x3f(viewMatrix[0].xyz, viewMatrix[1].xyz, viewMatrix[2].xyz);
    let invWorldScale3x3 = mat3x3f(invWorldScale[0].xyz, invWorldScale[1].xyz, invWorldScale[2].xyz);
    let splatWorld3x3 = mat3x3f(splatWorld[0].xyz, splatWorld[1].xyz, splatWorld[2].xyz);
    let rotToView = view3x3 * invWorldScale3x3 * splatWorld3x3 * splatRotation;
    let axisLengthInViewZ = abs(vec3f(rotToView[0][2], rotToView[1][2], rotToView[2][2]));

    let gaussianSplatCutoffStddev: f32 = 0.7071067812; // sqrt(2)/2
    var offsetSplatSpace: vec3f;
    if (axisLengthInViewZ.x > axisLengthInViewZ.y && axisLengthInViewZ.x > axisLengthInViewZ.z) {
        offsetSplatSpace = vec3f(0.0, quadPos.x, quadPos.y) * splatScale * gaussianSplatCutoffStddev;
    } else if (axisLengthInViewZ.y > axisLengthInViewZ.z) {
        offsetSplatSpace = vec3f(quadPos.x, 0.0, quadPos.y) * splatScale * gaussianSplatCutoffStddev;
    } else {
        offsetSplatSpace = vec3f(quadPos.x, quadPos.y, 0.0) * splatScale * gaussianSplatCutoffStddev;
    }
    let vertexObjectSpace = center + splatRotation * offsetSplatSpace;
    return splatWorld * vec4f(vertexObjectSpace, 1.0);
}
#endif
