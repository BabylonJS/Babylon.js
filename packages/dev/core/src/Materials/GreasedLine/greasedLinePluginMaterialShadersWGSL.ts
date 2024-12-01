import type { Nullable } from "../../types";
import { GreasedLineMeshColorMode } from "./greasedLineMaterialInterfaces";

/**
 * Returns GLSL custom shader code
 * @param shaderType vertex or fragment
 * @param cameraFacing is in camera facing mode?
 * @returns GLSL custom shader code
 */
export function getCustomCode(shaderType: string, cameraFacing: boolean): Nullable<{ [pointName: string]: string }> {
    if (shaderType === "vertex") {
        const obj: any = {
            CUSTOM_VERTEX_DEFINITIONS: `
                attribute grl_widths: f32;
                attribute grl_offsets: vec3f;
                attribute grl_colorPointers: f32;
                varying grlCounters: f32;
                varying grlColorPointer: f32;

                #ifdef GREASED_LINE_CAMERA_FACING
                    attribute grl_previousAndSide : vec4f;
                    attribute grl_nextAndCounters : vec4f;

                    fn grlFix(i: vec4f, aspect: f32) -> vec2f {
                        var res = i.xy / i.w;
                        res.x *= aspect;
                        return res;
                    }
                #else
                    attribute vec3 grl_slopes;
                    attribute float grl_counters;
                #endif


                `,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            CUSTOM_VERTEX_UPDATE_POSITION: `
                #ifdef GREASED_LINE_CAMERA_FACING
                    var grlPositionOffset: vec3f = input.grl_offsets;
                    positionUpdated = positionUpdated + grlPositionOffset;
                #else
                    positionUpdated = (positionUpdated + input.grl_offsets) + (input.grl_slopes * input.grl_widths);
                #endif
                `,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            CUSTOM_VERTEX_MAIN_END: `
                vertexOutputs.grlColorPointer = input.grl_colorPointers;

                #ifdef GREASED_LINE_CAMERA_FACING

                    let grlAspect: f32 = uniforms.grl_aspect_resolution_lineWidth.x;
                    let grlBaseWidth: f32 = uniforms.grl_aspect_resolution_lineWidth.w;

                    let grlPrevious: vec3f = input.grl_previousAndSide.xyz;
                    let grlSide: f32 = input.grl_previousAndSide.w;

                    let grlNext: vec3f = input.grl_nextAndCounters.xyz;
                    let grlCounters: f32 = input.grl_nextAndCounters.w;

                    let grlMatrix: mat4x4f = scene.viewProjection * finalWorld;
                    var grlFinalPosition: vec4f = grlMatrix * vec4f(positionUpdated, 1.0);
                    let grlPrevPos: vec4f = grlMatrix * vec4f(grlPrevious + grlPositionOffset, 1.0);
                    let grlNextPos: vec4f = grlMatrix * vec4f(grlNext + grlPositionOffset, 1.0);

                    let grlCurrentP: vec2f = grlFix(grlFinalPosition, grlAspect);
                    let grlPrevP: vec2f = grlFix(grlPrevPos, grlAspect);
                    let grlNextP: vec2f = grlFix(grlNextPos, grlAspect);

                    let grlWidth: f32 = grlBaseWidth * input.grl_widths;

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

                    let grlHalfWidth = 0.5 * grlWidth;
                    #if defined(GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM)
                        grlNormal.x *= -grlHalfWidth;
                        grlNormal.y *= -grlHalfWidth;
                    #else
                        grlNormal.x *= grlHalfWidth;
                        grlNormal.y *= grlHalfWidth;
                    #endif

                    grlNormal *= uniforms.grl_projection;

                    #if defined(GREASED_LINE_SIZE_ATTENUATION)
                        grlNormal.x *= grlFinalPosition.w;
                        grlNormal.y *= grlFinalPosition.w;

                        let resolution = vec4f(uniforms.grl_aspect_resolution_lineWidth.yz, 0.0, 1.0);
                        grlNormal.x /= (resolution * uniforms.grl_projection).x;
                        grlNormal.y /= (resolution * uniforms.grl_projection).y;
                    #endif

                    vertexOutputs.position = vec4f(grlFinalPosition.xy + grlNormal.xy * grlSide, grlFinalPosition.z, grlFinalPosition.w);
                #else
                    vertexOutputs.grlCounters = input.grl_counters;
                #endif
                `,
        };

        // TODO:
        // this._cameraFacing && (obj["!gl_Position\\=viewProjection\\*worldPos;"] = "//"); // not needed for camera facing GRL
        return obj;
    }

    if (shaderType === "fragment") {
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            CUSTOM_FRAGMENT_DEFINITIONS: `
                    varying grlCounters: f32;
                    varying grlColorPointer: 32;

                    var grl_colors: texture_2d<f32>;
                    var grl_colorsSampler: sampler;
                `,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            CUSTOM_FRAGMENT_MAIN_END: `
                    let grlColorMode: f32 = uniforms.grl_colorMode_visibility_colorsWidth_useColors.x;
                    let grlVisibility: f32 = uniforms.grl_colorMode_visibility_colorsWidth_useColors.y;
                    let grlColorsWidth: f32 = uniforms.grl_colorMode_visibility_colorsWidth_useColors.z;
                    let grlUseColors: f32 = uniforms.grl_colorMode_visibility_colorsWidth_useColors.w;

                    let grlUseDash: f32 = uniforms.grl_dashOptions.x;
                    let grlDashArray: f32 = uniforms.grl_dashOptions.y;
                    let grlDashOffset: f32 = uniforms.grl_dashOptions.z;
                    let grlDashRatio: f32 = uniforms.grl_dashOptions.w;


                    fragmentOutputs.color.a *= step(fragmentInputs.grlCounters, grlVisibility);
                    if (fragmentOutputs.color.a == 0.0) {
                        discard;
                    }

                    if (grlUseDash == 1.0) {
                        fragmentOutputs.color.a *= ceil((fragmentInputs.grlCounters + grlDashOffset - grlDashArray * floor((fragmentInputs.grlCounters + grlDashOffset) / grlDashArray)) - (grlDashArray * grlDashRatio));

                        if (fragmentOutputs.color.a == 0.0) {
                            discard;
                        }
                    }

                    #ifdef GREASED_LINE_HAS_COLOR
                        if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                           fragmentOutputs.color = vec4f(uniforms.grl_singleColor, 1.0);
                        } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                            fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb + uniforms.grl_singleColor, fragmentOutputs.color.a);
                        } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                            fragmentOutputs.color = vec4f(fragmentOutputs.color.rgb * uniforms.grl_singleColor, fragmentOutputs.color.a);
                        }
                    #else
                        if (grlUseColors == 1.) {
                            #ifdef GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE
                                let grlColor: vec4f = textureSample(grl_colors, grl_colorsSampler, vec2f(fragmentInputs.grlCounters, 0.));
                            #else
                                let lookup: vec2f = vec2(fract(fragmentInputs.grlColorPointer / uniforms.grl_textureSize.x), 1.0 - floor(fragmentInputs.grlColorPointer / uniforms.grl_textureSize.x) / max(uniforms.grl_textureSize.y - 1.0, 1.0));
                                let grlColor: vec4f = textureSample(grl_colors, grl_colorsSampler, lookup);
                            #endif
                            if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                                fragmentOutputs.color = grlColor;
                            } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                                fragmentOutputs.color += grlColor;
                            } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                                fragmentOutputs.color *= grlColor;
                            }
                        }
                    #endif


                `,
        };
    }

    return null;
}
