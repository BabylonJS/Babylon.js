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
};

fn readSplat(splatIndex: f32, dataTextureSize: vec2f) -> Splat {
    var splat: Splat;
    let splatUV = getDataUV(splatIndex, dataTextureSize);
    let splatUVi32 = vec2<i32>(i32(splatUV.x), i32(splatUV.y));
    splat.center = textureLoad(centersTexture, splatUVi32, 0);
    splat.color = textureLoad(colorsTexture, splatUVi32, 0);
    splat.covA = textureLoad(covariancesATexture, splatUVi32, 0) * splat.center.w;
    splat.covB = textureLoad(covariancesBTexture, splatUVi32, 0) * splat.center.w;

    return splat;
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
    invViewport: vec2f
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

    let J = mat3x3<f32>(
        focal.x / camspace.z, 0.0, -(focal.x * camspace.x) / (camspace.z * camspace.z),
        0.0, focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z),
        0.0, 0.0, 0.0
    );

    let invy = mat3x3<f32>(
        1.0, 0.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, 0.0, 1.0
    );

    let T = invy * transpose(mat3x3<f32>(
        modelView[0].xyz,
        modelView[1].xyz,
        modelView[2].xyz)) * J;
    let cov2d = transpose(T) * Vrk * T;

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
    return vec4f(
        vCenter + ((meshPos.x * majorAxis + meshPos.y * minorAxis) * invViewport * pos2d.w) * scale, 
        pos2d.z, 
        pos2d.w
    );
}
