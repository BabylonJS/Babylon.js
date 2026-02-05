
// We will need to use a min/max reduction algorithm at some point

struct Results {
  minX : atomic<i32>,
  minY : atomic<i32>,
  minZ : atomic<i32>,
  maxX : atomic<i32>,
  maxY : atomic<i32>,
  maxZ : atomic<i32>,
  dummy1 : i32,
  dummy2 : i32,
};

fn floatToBits(value: f32) -> i32 {
    return bitcast<i32>(value);
}

fn bitsToFloat(value: i32) -> f32 {
    return bitcast<f32>(value);
}

fn atomicMinFloat(atomicVar: ptr<storage, atomic<i32>, read_write>, value: f32) {
    let intValue = floatToBits(value);

    loop {
        let oldIntValue = atomicLoad(atomicVar);
        let oldValue = bitsToFloat(oldIntValue);
        if (value >= oldValue) {
            break;
        }
        if (atomicCompareExchangeWeak(atomicVar, oldIntValue, intValue).old_value == oldIntValue) {
            break;
        }
    }
}

fn atomicMaxFloat(atomicVar: ptr<storage, atomic<i32>, read_write>, value: f32) {
    let intValue = floatToBits(value);
    
    loop {
        let oldIntValue = atomicLoad(atomicVar);
        let oldValue = bitsToFloat(oldIntValue);
        if (value <= oldValue) {
            break;
        }
        if (atomicCompareExchangeWeak(atomicVar, oldIntValue, intValue).old_value == oldIntValue) {
            break;
        }
    }
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

struct Settings {
    morphTargetTextureInfo: vec3f,
    morphTargetCount: f32,
    indexResult : u32,
};

@group(0) @binding(0) var<storage, read> positionBuffer : array<f32>;
@group(0) @binding(1) var<storage, read_write> resultBuffer : array<Results>;
@group(0) @binding(7) var<uniform> settings : Settings;
#if NUM_BONE_INFLUENCERS > 0
  @group(0) @binding(2) var boneSampler : texture_2d<f32>;
  @group(0) @binding(3) var<storage, read> indexBuffer :  array<vec4f>;
  @group(0) @binding(4) var<storage, read> weightBuffer : array<vec4f>;

  #if NUM_BONE_INFLUENCERS > 4
    @group(0) @binding(5) var<storage, read> indexExtraBuffer : array<vec4f>;
    @group(0) @binding(6) var<storage, read> weightExtraBuffer : array<vec4f>;
  #endif
#endif
#ifdef MORPHTARGETS
@group(0) @binding(8) var morphTargets : texture_2d_array<f32>;
@group(0) @binding(9) var<storage, read> morphTargetInfluences : array<f32>;
@group(0) @binding(10) var<storage, read> morphTargetTextureIndices : array<f32>;

#endif

#ifdef MORPHTARGETS
fn readVector3FromRawSampler(targetIndex : i32, vertexIndex : u32) -> vec3f
{			
    let vertexID: u32 = vertexIndex * u32(settings.morphTargetTextureInfo.x);
    let textureWidth: u32 = u32(settings.morphTargetTextureInfo.y);
    let y: u32 = vertexID / textureWidth;
    let x: u32 = vertexID % textureWidth;
    return textureLoad(morphTargets, vec2u(x, y), u32(morphTargetTextureIndices[targetIndex]), 0).xyz;
}

fn readVector4FromRawSampler(targetIndex : i32, vertexIndex : u32) -> vec4f
{			
    let vertexID: u32 = vertexIndex * u32(settings.morphTargetTextureInfo.x);
    let textureWidth: u32 = u32(settings.morphTargetTextureInfo.y);
    let y: u32 = vertexID / textureWidth;
    let x: u32 = vertexID % textureWidth;
    return textureLoad(morphTargets, vec2u(x, y), u32(morphTargetTextureIndices[targetIndex]), 0);
}
#endif


@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let index = global_id.x;
    if (index >= arrayLength(&positionBuffer) / 3) {
        return;
    }

    let position = vec3f(positionBuffer[index * 3], positionBuffer[index * 3 + 1], positionBuffer[index * 3 + 2]);

    var finalWorld = identity;
    var positionUpdated = position;

#if NUM_BONE_INFLUENCERS > 0
      var influence : mat4x4<f32>;
      let matricesIndices = indexBuffer[index];
      let matricesWeights = weightBuffer[index];

      influence = readMatrixFromRawSampler(boneSampler, matricesIndices[0]) * matricesWeights[0];

      #if NUM_BONE_INFLUENCERS > 1
          influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices[1]) * matricesWeights[1];
      #endif	
      #if NUM_BONE_INFLUENCERS > 2
          influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices[2]) * matricesWeights[2];
      #endif	
      #if NUM_BONE_INFLUENCERS > 3
          influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndices[3]) * matricesWeights[3];
      #endif	

      #if NUM_BONE_INFLUENCERS > 4
          let matricesIndicesExtra = indexExtraBuffer[index];
          let matricesWeightsExtra = weightExtraBuffer[index];
          influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndicesExtra.x) * matricesWeightsExtra.x;
          #if NUM_BONE_INFLUENCERS > 5
              influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndicesExtra.y) * matricesWeightsExtra.y;
          #endif	
          #if NUM_BONE_INFLUENCERS > 6
              influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndicesExtra.z) * matricesWeightsExtra.z;
          #endif	
          #if NUM_BONE_INFLUENCERS > 7
              influence = influence + readMatrixFromRawSampler(boneSampler, matricesIndicesExtra.w) * matricesWeightsExtra.w;
          #endif	
      #endif	

      finalWorld = finalWorld * influence;
#endif

#ifdef MORPHTARGETS
    for (var i = 0; i < NUM_MORPH_INFLUENCERS; i = i + 1) {
        if (f32(i) >= settings.morphTargetCount) {
            break;
        }
        positionUpdated = positionUpdated + (readVector3FromRawSampler(i, index) - position) * morphTargetInfluences[i];
    }
#endif

    var worldPos = finalWorld * vec4f(positionUpdated.x, positionUpdated.y, positionUpdated.z, 1.0);

    atomicMinFloat(&resultBuffer[settings.indexResult].minX, worldPos.x);
    atomicMinFloat(&resultBuffer[settings.indexResult].minY, worldPos.y);
    atomicMinFloat(&resultBuffer[settings.indexResult].minZ, worldPos.z);

    atomicMaxFloat(&resultBuffer[settings.indexResult].maxX, worldPos.x);
    atomicMaxFloat(&resultBuffer[settings.indexResult].maxY, worldPos.y);
    atomicMaxFloat(&resultBuffer[settings.indexResult].maxZ, worldPos.z);
}
