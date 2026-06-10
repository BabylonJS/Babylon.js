varying vPosition: vec3f;
varying vNormal: vec3f;
varying vUV: vec2f;
varying vTangent: vec3f;
varying vBinormal: vec3f;
varying vColor: vec4f;
varying vExtra1: vec4f;

uniform _Edge_Color_: vec4f;
uniform _Proximity_Max_Intensity_: f32;
uniform _Proximity_Near_Radius_: f32;
uniform _Fade_Width_: f32;
uniform _Blob_Position_: vec3f;
uniform _Blob_Position_2_: vec3f;
uniform _Use_Blob_Texture_: f32;
uniform _Show_Frame_: f32;

uniform Use_Global_Left_Index: f32;
uniform Use_Global_Right_Index: f32;
uniform Global_Left_Index_Tip_Position: vec4f;
uniform Global_Right_Index_Tip_Position: vec4f;

var _Blob_Texture_Sampler: sampler;
var _Blob_Texture_: texture_2d<f32>;

fn filterStep(edge: vec2f, x: vec2f) -> vec2f {
    let dX: vec2f = max(fwidth(x), vec2f(0.00001));
    return clamp((x + dX - max(edge, x - dX)) / (dX * 2.0), vec2f(0.0), vec2f(1.0));
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#ifdef ENABLE_FADE
    let edgeC: vec2f = vec2f(min(input.vColor.r, input.vColor.g), min(input.vColor.b, input.vColor.a));
    let edgeDf: vec2f = fwidth(edgeC) * uniforms._Fade_Width_;
    let edgeG: vec2f = clamp(edgeC / edgeDf, vec2f(0.0), vec2f(1.0));
    let notEdge: f32 = edgeG.x * edgeG.y;
#else
    let notEdge: f32 = 1.0;
#endif

    let k: f32 = dot(input.vUV, input.vUV);
    let blobTextureCoord: vec2f = vec2f(sqrt(k), 1.0 - input.vTangent.x);
    let proceduralBlob: vec4f = vec4f(1.0) * step(1.0 - input.vTangent.x, clamp(sqrt(k) + 0.1, 0.0, 1.0));
    let sampledBlob: vec4f = textureSample(_Blob_Texture_, _Blob_Texture_Sampler, blobTextureCoord);
    let blobColor: vec4f = mix(proceduralBlob, sampledBlob, step(0.5, uniforms._Use_Blob_Texture_));
    let blob: vec4f = input.vTangent.y * blobColor * (1.0 - clamp(k, 0.0, 1.0));

    let blobPositionLeft: vec3f = mix(uniforms._Blob_Position_, uniforms.Global_Left_Index_Tip_Position.xyz, step(0.5, uniforms.Use_Global_Left_Index));
    let blobPositionRight: vec3f = mix(uniforms._Blob_Position_2_, uniforms.Global_Right_Index_Tip_Position.xyz, step(0.5, uniforms.Use_Global_Right_Index));
    let distanceXY: f32 = sqrt(min(dot(input.vExtra1.xy, input.vExtra1.xy), dot(input.vExtra1.zw, input.vExtra1.zw)) + input.vBinormal.y * input.vBinormal.y);
    let proximity: f32 = input.vBinormal.z * uniforms._Proximity_Max_Intensity_ * (1.0 - clamp(distanceXY / uniforms._Proximity_Near_Radius_, 0.0, 1.0)) * (1.0 - input.vBinormal.x) + input.vBinormal.x;
    let edgeUV: vec2f = min(input.vUV, vec2f(1.0) - input.vUV);
    let wireFilter: vec2f = filterStep(input.vNormal.xy * 0.5, edgeUV);
    let wireframe: vec4f = (1.0 - min(wireFilter.x, wireFilter.y)) * proximity * uniforms._Edge_Color_;

    let wireOrBlob: vec4f = mix(wireframe, blob, input.vNormal.z);
    let color: vec4f = mix(wireOrBlob, vec4f(0.3, 0.3, 0.3, 0.3), step(0.5, uniforms._Show_Frame_));
    fragmentOutputs.color = notEdge * color;
}
