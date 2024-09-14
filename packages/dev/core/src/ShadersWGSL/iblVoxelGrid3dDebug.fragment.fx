varying vUV: vec2f;

var voxelTextureSampler: sampler;
var voxelTexture: texture_3d<f32>;
var voxelSlabTextureSampler: sampler;
var voxelSlabTexture: texture_2d<f32>;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

uniform sizeParams: vec4f;
#define offsetX uniforms.sizeParams.x
#define offsetY uniforms.sizeParams.y
#define widthScale uniforms.sizeParams.z
#define heightScale uniforms.sizeParams.w
uniform mipNumber: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    var uv: vec2f =
         vec2f((offsetX + input.vUV.x) * widthScale, (offsetY + input.vUV.y) * heightScale);
    var background: vec4f = textureSample(textureSampler, textureSamplerSampler, input.vUV);
    var voxelSlab: vec4f = textureSample(voxelSlabTexture, voxelSlabTextureSampler, input.vUV);

    // ***** Display all slices as a grid *******
    var size: vec3u = textureDimensions(voxelTexture,  i32(uniforms.mipNumber));
    var dimension: f32 = ceil(sqrt( f32(size.z)));
    var samplePos: vec2f = fract(uv.xy *  vec2f(dimension));
    var sampleIndex: u32 =  u32(floor(uv.x *  f32(dimension)) +
                          floor(uv.y *  f32(dimension)) * dimension);
    var mip_separator: f32 = 0.0;
    if (samplePos.x < 0.01 || samplePos.y < 0.01) {
      mip_separator = 1.0;
    }
    var outBounds: bool = select(false, true, sampleIndex > size.z - 1);
    sampleIndex = clamp(sampleIndex, 0, size.z - 1);

    var samplePosInt: vec2i =  vec2i(samplePos.xy *  vec2f(size.xy));
    var voxel: vec3f = textureLoad(voxelTexture,
                            vec3i(i32(samplePosInt.x), i32(samplePosInt.y), i32(sampleIndex)),
                             i32(uniforms.mipNumber)).rgb;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      fragmentOutputs.color = background;
    } else {
      if (outBounds) {
        voxel =  vec3f(0.15, 0.0, 0.0);
      } else {
        if (voxel.r > 0.001) {
          voxel.g = 1.0;
        }
        voxel.r += mip_separator;
      }
      fragmentOutputs.color = vec4f(mix(background.rgb, voxelSlab.rgb, voxelSlab.a) + voxel, 1.0);
    }
}