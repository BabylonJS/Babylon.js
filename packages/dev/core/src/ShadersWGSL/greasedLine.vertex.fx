#include<instancesDeclaration>
#include<sceneUboDeclaration>
#include<meshUboDeclaration>

attribute grl_widths: f32;
#ifdef GREASED_LINE_USE_OFFSETS
    attribute grl_offsets: vec3f;   
#endif
attribute grl_colorPointers: f32;
attribute position: vec3f;

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

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    #define CUSTOM_VERTEX_MAIN_BEGIN

    #include<instancesVertex>

    vertexOutputs.grlColorPointer = vertexInputs.grl_colorPointers;
    let grlMatrix: mat4x4f = scene.viewProjection * mesh.world ;

    #ifdef GREASED_LINE_CAMERA_FACING
        let grlBaseWidth: f32 = uniforms.grlWidth;

        let grlPrevious: vec3f = vertexInputs.grl_previousAndSide.xyz;
        let grlSide: f32 = vertexInputs.grl_previousAndSide.w;

        let grlNext: vec3f = vertexInputs.grl_nextAndCounters.xyz;
        vertexOutputs.grlCounters = vertexInputs.grl_nextAndCounters.w;
        let grlWidth:f32 = grlBaseWidth * vertexInputs.grl_widths;

        #ifdef GREASED_LINE_USE_OFFSETS
            var grlPositionOffset: vec3f = vertexInputs.grl_offsets;
        #else
            var grlPositionOffset = vec3f(0.);
        #endif
        let positionUpdated: vec3f = vertexInputs.position + grlPositionOffset;
        
        let worldDir: vec3f = normalize(grlNext - grlPrevious);
        let nearPosition: vec3f = positionUpdated + (worldDir * 0.001);
        let grlFinalPosition: vec4f = grlMatrix * vec4f(positionUpdated, 1.0);
        let screenNearPos: vec4f = grlMatrix * vec4(nearPosition, 1.0);
        let grlLinePosition: vec2f = grlFix(grlFinalPosition, uniforms.grlAspect);
        let grlLineNearPosition: vec2f = grlFix(screenNearPos, uniforms.grlAspect);
        let grlDir: vec2f = normalize(grlLineNearPosition - grlLinePosition);
       
        var grlNormal: vec4f = vec4f(-grlDir.y, grlDir.x, 0.0, 1.0);

        let grlHalfWidth: f32 = 0.5 * grlWidth;
        #if defined(GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM)
            grlNormal.x *= -grlHalfWidth;
            grlNormal.y *= -grlHalfWidth;
        #else
            grlNormal.x *= grlHalfWidth;
            grlNormal.y *= grlHalfWidth;
        #endif

        grlNormal *= scene.projection;

        if (uniforms.grlSizeAttenuation == 1.) {
            grlNormal.x *= grlFinalPosition.w;
            grlNormal.y *= grlFinalPosition.w;

            let pr = vec4f(uniforms.grlResolution, 0.0, 1.0) * scene.projection;
            grlNormal.x /= pr.x;
            grlNormal.y /= pr.y;
        }
        vertexOutputs.position = vec4f(grlFinalPosition.xy + grlNormal.xy * grlSide, grlFinalPosition.z, grlFinalPosition.w);
    #else
        vertexOutputs.grlCounters = vertexInputs.grl_counters;
        #ifdef GREASED_LINE_USE_OFFSETS
            let grlPositionOffset: vec3f = vertexInputs.grl_offsets;
        #else
            let grlPositionOffset: vec3f = vec3f(0.0);
        #endif
        vertexOutputs.position = grlMatrix * vec4f(vertexInputs.position + grlPositionOffset + vertexInputs.grl_slopes * vertexInputs.grl_widths, 1.0);
    #endif

    #define CUSTOM_VERTEX_MAIN_END
}
