#include<instancesDeclaration>
#include<sceneUboDeclaration>


attribute grl_widths: f32;
attribute grl_offsets: vec3f;
attribute grl_colorPointers: f32;
attribute position: vec3f;
uniform viewProjection: mat4x4f;
uniform projection: mat4x4f;
varying grlCounters: f32;
varying grlColorPointer: f32;

#ifdef GREASED_LINE_CAMERA_FACING
    attribute grl_nextAndCounters: vec4f;
    attribute grl_previousAndSide: vec4f;
    uniform grlResolution: vec2f;
    uniform grlAspect: f32;
    uniform grlWidth: f32;
    uniform grlSizeAttenuation: f32;

    fn grlFix(i: vec4f, aspect: f32) -> vec2f {
        var res = i.xy / i.w;
        res.x *= aspect;
        return res;
    }
#else
    attribute grl_slopes: vec3f;
    attribute grl_counters: f32;
#endif

struct GrlUBO {
    grl_colorModeAndColorDistributionType: vec2f,
    grlWidth: f32
};

var<uniform> grlUBO: GrlUBO;

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    #define CUSTOM_VERTEX_MAIN_BEGIN

    #include<instancesVertex>

    vertexOutputs.grlColorPointer = input.grl_colorPointers;
    let grlMatrix: mat4x4f = scene.viewProjection * finalWorld ;

    #ifdef GREASED_LINE_CAMERA_FACING
        let grlBaseWidth: f32 = grlUBO.grlWidth;

        let grlPrevious: vec3f = grl_previousAndSide.xyz;
        let grlSide: f32 = grl_previousAndSide.w;

        let grlNext: vec3f = grl_nextAndCounters.xyz;
        vertexOutputs.grlCounters = grl_nextAndCounters.w;


        let grlPositionOffset: vec3f = input.grl_offsets;
        let grlFinalPosition: vec4f = grlMatrix * vec4f(position + grlPositionOffset , 1.0);
        let grlPrevPos: vec4f = grlMatrix * vec4f(grlPrevious + grlPositionOffset, 1.0);
        let grlNextPos: vec4f = grlMatrix * vec4f(grlNext + grlPositionOffset, 1.0);

        let grlCurrentP: vec2f = grlFix(grlFinalPosition, grlAspect);
        let grlPrevP: vec2f = grlFix(grlPrevPos, grlAspect);
        let grlNextP: vec2f= grlFix(grlNextPos, grlAspect);

        let grlWidth:f32 = grlBaseWidth * input.grl_widths;

        var grlDir: vec2f;
        if (all(grlNextP == grlCurrentP)) {
            grlDir = normalize(grlCurrentP - grlPrevP);
        } else if (all(grlPrevP == grlCurrentP)) {
            grlDir = normalize(grlNextP - grlCurrentP);
        } else {
            let grlDir1: vec2f = normalize(grlCurrentP - grlPrevP);
            let grlDir2: vec2f = normalize(grlNextP - grlCurrentP);
            grlDir = normalize(grlDir1 + grlDir2);
        }

        var grlNormal: vec4f = vec4f(-grlDir.y, grlDir.x, 0.0, 1.0);

        let grlHalfWidth: f32 = 0.5 * grlWidth;
        #if defined(GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM)
            grlNormal.x *= -grlHalfWidth;
            grlNormal.y *= -grlHalfWidth;
        #else
            grlNormal.x *= grlHalfWidth;
            grlNormal.y *= grlHalfWidth;
        #endif

        grlNormal *= uniforms.projection;

        if (grlSizeAttenuation == 1.) {
            grlNormal.x *= grlFinalPosition.w;
            grlNormal.y *= grlFinalPosition.w;

            let pr: f32 = vec4f(uniforms.grl_aspect_resolution_lineWidth.yz, 0.0, 1.0) * uniforms.grl_projection;
            grlNormal.x /= pr.x;
            grlNormal.y /= pr.y;
        }
        vertexOutputs.position = vec4f(grlFinalPosition.xy + grlNormal.xy * grlSide, grlFinalPosition.z, grlFinalPosition.w);
    #else
        vertexOutputs.grlCounters = grl_counters;
        vertexOutputs.position = grlMatrix * vec4( (position + input.grl_offsets) + grl_slopes * input.grl_widths , 1.0 ) ;
    #endif

    #define CUSTOM_VERTEX_MAIN_END
}
