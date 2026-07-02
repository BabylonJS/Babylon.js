// Gaussian Splatting GPU depth sort - depth + range pass.
//
// For each active render slot, reads its source splat index from `seed`, fetches the splat center from
// `positions` (stride 4: xyz + 1), and computes the signed camera-forward depth using precomputed
// coefficients (coeff = a,b,c,d, already multiplied by the right-handed sign on the CPU):
//   depth = a*x + b*y + c*z + d
// It stores the depth per slot and atomically tracks the min/max depth across all active slots so the
// histogram pass can map depths to buckets.

struct Params {
    count : u32,
    paddedCount : u32,
    numBuckets : u32,
    pad : u32,
    coeff : vec4f,
};

@group(0) @binding(0) var<storage, read> positions : array<f32>;
@group(0) @binding(1) var<storage, read> seed : array<f32>;
@group(0) @binding(2) var<storage, read_write> depth : array<f32>;
@group(0) @binding(3) var<storage, read_write> range : array<atomic<i32>>;
@group(0) @binding(4) var<uniform> params : Params;

fn atomicMinFloat(atomicVar : ptr<storage, atomic<i32>, read_write>, value : f32) {
    let intValue = bitcast<i32>(value);
    loop {
        let oldIntValue = atomicLoad(atomicVar);
        if (value >= bitcast<f32>(oldIntValue)) {
            break;
        }
        if (atomicCompareExchangeWeak(atomicVar, oldIntValue, intValue).old_value == oldIntValue) {
            break;
        }
    }
}

fn atomicMaxFloat(atomicVar : ptr<storage, atomic<i32>, read_write>, value : f32) {
    let intValue = bitcast<i32>(value);
    loop {
        let oldIntValue = atomicLoad(atomicVar);
        if (value <= bitcast<f32>(oldIntValue)) {
            break;
        }
        if (atomicCompareExchangeWeak(atomicVar, oldIntValue, intValue).old_value == oldIntValue) {
            break;
        }
    }
}

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let i = gid.x;
    if (i >= params.count) {
        return;
    }
    let src = u32(seed[i] + 0.5);
    let o = src * 4u;
    let d = params.coeff.x * positions[o] + params.coeff.y * positions[o + 1u] + params.coeff.z * positions[o + 2u] + params.coeff.w;
    depth[i] = d;
    atomicMinFloat(&range[0], d);
    atomicMaxFloat(&range[1], d);
}
