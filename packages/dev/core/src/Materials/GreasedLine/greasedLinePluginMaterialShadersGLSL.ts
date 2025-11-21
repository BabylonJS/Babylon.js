import type { Nullable } from "../../types";
import { GreasedLineMeshColorMode } from "./greasedLineMaterialInterfaces";

/**
 * Returns GLSL custom shader code
 * @param shaderType vertex or fragment
 * @param cameraFacing is in camera facing mode?
 * @returns GLSL custom shader code
 */
/** @internal */
export function GetCustomCode(shaderType: string, cameraFacing: boolean): Nullable<{ [pointName: string]: string }> {
    if (shaderType === "vertex") {
        const obj: any = {
            CUSTOM_VERTEX_DEFINITIONS: `
                attribute float grl_widths;
                attribute vec3 grl_offsets;
                attribute float grl_colorPointers;
                varying float grlCounters;
                varying float grlColorPointer;

                #ifdef GREASED_LINE_CAMERA_FACING
                    attribute vec4 grl_previousAndSide;
                    attribute vec4 grl_nextAndCounters;

                    vec2 grlFix( vec4 i, float aspect ) {
                        vec2 res = i.xy / i.w;
                        res.x *= aspect;
                        return res;
                    }
                #else
                    attribute vec3 grl_slopes;
                    attribute float grl_counters;
                #endif
                `,
            CUSTOM_VERTEX_UPDATE_POSITION: `
                #ifdef GREASED_LINE_CAMERA_FACING
                    vec3 grlPositionOffset = grl_offsets;
                    positionUpdated += grlPositionOffset;
                #else
                    positionUpdated = (positionUpdated + grl_offsets) + (grl_slopes * grl_widths);
                #endif
                `,
            CUSTOM_VERTEX_MAIN_END: `
                grlColorPointer = grl_colorPointers;

                #ifdef GREASED_LINE_CAMERA_FACING

                    float grlAspect = grl_aspect_resolution_lineWidth.x;
                    float grlBaseWidth = grl_aspect_resolution_lineWidth.w;

                    vec3 grlPrevious = grl_previousAndSide.xyz;
                    float grlSide = grl_previousAndSide.w;

                    vec3 grlNext = grl_nextAndCounters.xyz;
                    grlCounters = grl_nextAndCounters.w;
                    float grlWidth = grlBaseWidth * grl_widths;
                    
                    vec3 worldDir = normalize(grlNext - grlPrevious);
                    vec3 nearPosition = positionUpdated + (worldDir * 0.01);
                    mat4 grlMatrix = viewProjection * finalWorld;
                    vec4 grlFinalPosition = grlMatrix * vec4(positionUpdated , 1.0);
                    vec4 screenNearPos = grlMatrix * vec4(nearPosition, 1.0);
                    vec2 grlLinePosition = grlFix(grlFinalPosition, grlAspect);
                    vec2 grlLineNearPosition = grlFix(screenNearPos, grlAspect);
                    vec2 grlDir = normalize(grlLineNearPosition - grlLinePosition);

                    vec4 grlNormal = vec4(-grlDir.y, grlDir.x, 0., 1.);

                    #ifdef GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM
                        grlNormal.xy *= -.5 * grlWidth;
                    #else
                        grlNormal.xy *= .5 * grlWidth;
                    #endif

                    grlNormal *= grl_projection;

                    #ifdef GREASED_LINE_SIZE_ATTENUATION
                        grlNormal.xy *= grlFinalPosition.w;
                        grlNormal.xy /= (vec4(grl_aspect_resolution_lineWidth.yz, 0., 1.) * grl_projection).xy;
                    #endif

                    grlFinalPosition.xy += grlNormal.xy * grlSide;
                    gl_Position = grlFinalPosition;

                    vPositionW = vec3(grlFinalPosition);
                #else
                    grlCounters = grl_counters;
                #endif
                `,
        };
        if (cameraFacing) {
            obj["!gl_Position\\=viewProjection\\*worldPos;"] = "//"; // not needed for camera facing GRL
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return obj;
    }

    if (shaderType === "fragment") {
        return {
            CUSTOM_FRAGMENT_DEFINITIONS: `
                    #ifdef PBR
                         #define grlFinalColor finalColor
                    #else
                         #define grlFinalColor color
                    #endif

                    varying float grlCounters;
                    varying float grlColorPointer;
                    uniform sampler2D grl_colors;
                `,
            CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
                    float grlColorMode = grl_colorMode_visibility_colorsWidth_useColors.x;
                    float grlVisibility = grl_colorMode_visibility_colorsWidth_useColors.y;
                    float grlColorsWidth = grl_colorMode_visibility_colorsWidth_useColors.z;
                    float grlUseColors = grl_colorMode_visibility_colorsWidth_useColors.w;

                    float grlUseDash = grl_dashOptions.x;
                    float grlDashArray = grl_dashOptions.y;
                    float grlDashOffset = grl_dashOptions.z;
                    float grlDashRatio = grl_dashOptions.w;

                    grlFinalColor.a *= step(grlCounters, grlVisibility);
                    if(grlFinalColor.a == 0.) discard;

                    if(grlUseDash == 1.){
                        grlFinalColor.a *= ceil(mod(grlCounters + grlDashOffset, grlDashArray) - (grlDashArray * grlDashRatio));
                        if (grlFinalColor.a == 0.) discard;
                    }

                    #ifdef GREASED_LINE_HAS_COLOR
                        if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                            grlFinalColor.rgb = grl_singleColor;
                        } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                            grlFinalColor.rgb += grl_singleColor;
                        } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                            grlFinalColor.rgb *= grl_singleColor;
                        }
                    #else
                        if (grlUseColors == 1.) {
                            #ifdef GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE
                                vec4 grlColor = texture2D(grl_colors, vec2(grlCounters, 0.), 0.);
                            #else
                                vec2 lookup = vec2(fract(grlColorPointer / grl_textureSize.x), 1.0 - floor(grlColorPointer / grl_textureSize.x) / max(grl_textureSize.y - 1.0, 1.0));
                                vec4 grlColor = texture2D(grl_colors, lookup, 0.0);
                            #endif
                            if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                                grlFinalColor = grlColor;
                            } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                                grlFinalColor += grlColor;
                            } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                                grlFinalColor *= grlColor;
                            }
                        }
                    #endif
                `,
        };
    }

    return null;
}
