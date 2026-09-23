// Shared spherical-harmonics evaluation for Gaussian Splatting, used by both the classic rasterizer
// (texture-fed) and the compute point-splatting renderer (buffer-fed). Each caller assembles the
// coefficient array `sh` (sh[0] = DC, sh[1..24] = bands 1..4) in its own way, then this evaluates the
// view-dependent color with per-band weights `_so1.._so4` (1.0 = full; used for the SH-order debug
// toggles). Only the bands the asset has are compiled in via the SH_DEGREE define.
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
