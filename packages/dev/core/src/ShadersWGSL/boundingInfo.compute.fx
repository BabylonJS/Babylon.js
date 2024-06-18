struct Buffer {
  data : array<vec3f>,
};

struct WeightData {
  data : array<vec4f>,
};

struct Results {
  minX : atomic<i32>,
  minY : atomic<i32>,
  minZ : atomic<i32>,
  maxX : atomic<i32>,
  maxY : atomic<i32>,
  maxZ : atomic<i32>,
};

fn floatToBits(value: f32) -> i32 {
    return bitcast<i32>(value);
}

fn bitsToFloat(value: i32) -> f32 {
    return bitcast<f32>(value);
}

fn atomicMinFloat(atomicVar: ptr<storage, atomic<i32>, read_write>, value: f32) {
    let intValue = floatToBits(value);

    atomicMin(atomicVar, intValue);
    // loop {
    //     let oldIntValue = atomicLoad(atomicVar);
    //     let oldValue = bitsToFloat(oldIntValue);
    //     if (value >= oldValue) {
    //         break;
    //     }
    //     if (atomicCompareExchangeWeak(atomicVar, oldIntValue, intValue).old_value == oldIntValue) {
    //         break;
    //     }
    // }
}

fn atomicMaxFloat(atomicVar: ptr<storage, atomic<i32>, read_write>, value: f32) {
    let intValue = floatToBits(value);
    
    atomicMax(atomicVar, intValue);
    // loop {
    //     let oldIntValue = atomicLoad(atomicVar);
    //     let oldValue = bitsToFloat(oldIntValue);
    //     if (value <= oldValue) {
    //         break;
    //     }
    //     if (atomicCompareExchangeWeak(atomicVar, oldIntValue, intValue).old_value == oldIntValue) {
    //         break;
    //     }
    // }
}

fn readMatrixFromRawSampler(smp : texture_2d<f32>, index : f32) -> mat4x4<f32>
{
    let offset = i32(index)  * 4;	

    let m0 = textureLoad(smp, vec2<i32>(offset + 0, 0), 0);
    let m1 = textureLoad(smp, vec2<i32>(offset + 1, 0), 0);
    let m2 = textureLoad(smp, vec2<i32>(offset + 2, 0), 0);
    let m3 = textureLoad(smp, vec2<i32>(offset + 3, 0), 0);

    return mat4x4<f32>(m0, m1, m2, m3);
}

const identity = mat4x4f(
    vec4f(1.0, 0.0, 0.0, 0.0),
    vec4f(0.0, 1.0, 0.0, 0.0),
    vec4f(0.0, 0.0, 1.0, 0.0),
    vec4f(0.0, 0.0, 0.0, 1.0)
);

@group(0) @binding(0) var<storage, read> positionBuffer : Buffer;
@group(0) @binding(1) var<storage, read_write> resultBuffer : Results;
#if NUM_BONE_INFLUENCERS > 0
@group(0) @binding(2) var boneSampler : texture_2d<f32>;
@group(0) @binding(3) var<storage, read> indexBuffer : WeightData;
@group(0) @binding(4) var<storage, read> weightBuffer : WeightData;

  // #if NUM_BONE_INFLUENCERS > 4
  //   @group(0) @binding(3) var<storage, read> matricesExtraBuffer : Buffer;
  // #endif
#endif

@compute @workgroup_size(1, 1, 1)

fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let index = global_id.x;
    if (index >= arrayLength(&positionBuffer.data)) {
        return;
    }

    let position = positionBuffer.data[index];

    var finalWorld = identity;

#if NUM_BONE_INFLUENCERS > 0
      var influence : mat4x4<f32>;
      let matricesIndices = indexBuffer.data[index];
      let matricesWeights = weightBuffer.data[index];

      influence = readMatrixFromRawSampler(boneSampler, matricesIndices.x) * matricesWeights.x;

      #if NUM_BONE_INFLUENCERS > 1
          influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices.y) * matricesWeights.y;
      #endif	
      #if NUM_BONE_INFLUENCERS > 2
          influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices.z) * matricesWeights.z;
      #endif	
      #if NUM_BONE_INFLUENCERS > 3
          influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices.w) * matricesWeights.w;
      #endif	

      finalWorld = finalWorld * influence;
#endif

    var worldPos = finalWorld * vec4f(position.x, position.y, position.z, 1.0);

    atomicMinFloat(&resultBuffer.minX, worldPos.x);
    atomicMinFloat(&resultBuffer.minY, worldPos.y);
    atomicMinFloat(&resultBuffer.minZ, worldPos.z);

    atomicMaxFloat(&resultBuffer.maxX, worldPos.x);
    atomicMaxFloat(&resultBuffer.maxY, worldPos.y);
    atomicMaxFloat(&resultBuffer.maxZ, worldPos.z);
}