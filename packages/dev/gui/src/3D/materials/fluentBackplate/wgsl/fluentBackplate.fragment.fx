uniform cameraPosition: vec3f;

varying vPosition: vec3f;
varying vNormal: vec3f;
varying vUV: vec2f;
varying vTangent: vec3f;
varying vBinormal: vec3f;
varying vColor: vec4f;
varying vExtra1: vec4f;
varying vExtra2: vec4f;
varying vExtra3: vec4f;

uniform _Filter_Width_: f32;
uniform _Base_Color_: vec4f;
uniform _Line_Color_: vec4f;
uniform _Rate_: f32;
uniform _Highlight_Color_: vec4f;
uniform _Highlight_Width_: f32;
uniform _Highlight_: f32;
uniform _Iridescence_Intensity_: f32;
uniform _Iridescence_Edge_Intensity_: f32;
uniform _Fade_Out_: f32;
uniform _Reflected_: f32;
uniform _Frequency_: f32;
uniform _Vertical_Offset_: f32;

var _Blob_Texture_Sampler: sampler;
var _Blob_Texture_: texture_2d<f32>;
var _Iridescent_Map_Sampler: sampler;
var _Iridescent_Map_: texture_2d<f32>;

fn roundRectFragment(radius: f32, lineWidth: f32, lineColor: vec4f, filterWidth: f32, uv: vec2f, rectParms: vec4f, fillColor: vec4f) -> vec4f {
    let d: f32 = length(max(abs(uv) - rectParms.xy, vec2f(0.0)));
    let dx: f32 = max(fwidth(d) * filterWidth, 0.00001);
    let g: f32 = min(rectParms.z, rectParms.w);
    let dgrad: f32 = max(fwidth(g) * filterWidth, 0.00001);
    let insideRect: f32 = clamp(g / dgrad, 0.0, 1.0);
    let inner: f32 = clamp((d + dx * 0.5 - max(radius - lineWidth, d - dx * 0.5)) / dx, 0.0, 1.0);
    return clamp(mix(fillColor, lineColor, inner), vec4f(0.0), vec4f(1.0)) * insideRect;
}

fn blobFragment(blobInfo1: vec4f, blobInfo2: vec4f) -> vec4f {
    let k1: f32 = dot(blobInfo1.xy, blobInfo1.xy);
    let k2: f32 = dot(blobInfo2.xy, blobInfo2.xy);
    var closer: vec3f;
    if (k1 < k2) {
        closer = vec3f(k1, blobInfo1.z, blobInfo1.w);
    } else {
        closer = vec3f(k2, blobInfo2.z, blobInfo2.w);
    }

    let blobUV: vec2f = vec2f(sqrt(closer.x), 1.0 - closer.y);
    return closer.z * textureSample(_Blob_Texture_, _Blob_Texture_Sampler, blobUV) * clamp(1.0 - closer.x, 0.0, 1.0);
}

fn lineFragment(baseColor: vec4f, highlightColor: vec4f, highlightWidth: f32, lineVertex: vec3f, highlight: f32) -> vec4f {
    let k2: f32 = 1.0 - clamp(abs(lineVertex.y / highlightWidth), 0.0, 1.0);
    return mix(baseColor, highlightColor, highlight * k2);
}

fn scaleRGB(color: vec4f, scalar: f32) -> vec4f {
    return vec4f(scalar, scalar, scalar, 1.0) * color;
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#ifdef BLOB_ENABLE
    let blobColor: vec4f = blobFragment(input.vExtra2, input.vExtra3);
#else
    let blobColor: vec4f = vec4f(0.0);
#endif

    let lineColor: vec4f = lineFragment(uniforms._Line_Color_, uniforms._Highlight_Color_, uniforms._Highlight_Width_, input.vTangent, uniforms._Highlight_);
    let incident: vec3f = normalize(input.vPosition - uniforms.cameraPosition);
    let reflected: vec3f = reflect(incident, input.vBinormal);
    var reflectedResult: f32 = dot(input.vNormal, incident);
    if (uniforms._Reflected_ > 0.5) {
        reflectedResult = dot(incident, reflected);
    }

    let iridescentU: f32 = fract((reflectedResult * uniforms._Frequency_ + 1.0) * 0.5 + input.vUV.y * uniforms._Vertical_Offset_);
    let iridescentUV: vec2f = vec2f(iridescentU, 0.5);
#ifdef IRIDESCENT_MAP_ENABLE
    let iridescentColor: vec4f = textureSample(_Iridescent_Map_, _Iridescent_Map_Sampler, iridescentUV);
#else
    let iridescentColor: vec4f = vec4f(0.0);
#endif

    let lineAndIridescent: vec4f = lineColor + vec4f(scaleRGB(iridescentColor, uniforms._Iridescence_Edge_Intensity_).rgb, 0.0);
    let fillAndIridescent: vec4f = uniforms._Base_Color_ + vec4f(scaleRGB(iridescentColor, uniforms._Iridescence_Intensity_).rgb, 0.0);
    var lineOpaque: vec4f = lineAndIridescent;
    lineOpaque.a = 1.0;
    let fillWithBlob: vec4f = blobColor + (1.0 - blobColor.a) * fillAndIridescent;
    let color: vec4f = uniforms._Fade_Out_ * roundRectFragment(input.vColor.r, input.vColor.g, lineOpaque, uniforms._Filter_Width_, input.vUV, input.vExtra1, fillWithBlob);

    if (color.a < 0.001) {
        discard;
    }

    fragmentOutputs.color = color;
}
