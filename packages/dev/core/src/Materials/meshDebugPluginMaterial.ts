/* eslint-disable @typescript-eslint/naming-convention */
import type { Engine } from "../Engines/engine";
import { MaterialPluginBase } from "./materialPluginBase";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import type { Nullable } from "../types";
import { MaterialDefines } from "./materialDefines";
import type { PBRBaseMaterial } from "./PBR/pbrBaseMaterial";
import type { StandardMaterial } from "./standardMaterial";
import type { SubMesh } from "../Meshes/subMesh";
import { RegisterClass } from "../Misc/typeStore";
import { Color3, Vector3 } from "core/Maths/math";

/**
 * Supported visualizations of MeshDebugPluginMaterial
 */
export enum MeshDebugMode {
    /**
     * Material without any mesh debug visualization
     */
    NONE = 0,
    /**
     * Wireframe displayed over mesh
     */
    TRIANGLES = 1,
    /**
     * TODO: This is NOT IMPLEMENTED yet!
     * Wireframe with dots over vertices displayed over mesh
     */
    VERTICES = 2, 
    /**
     * UV set 1 checkerboard grid displayed over original material
     */
    UV1 = 3,
    /**
     * UV set 2 checkerboard grid displayed over original material
     */
    UV2 = 4, 
    /**
     * Vertex colors displayed over original material
     */
    VERTEXCOLORS = 5,
    /**
     * Arbitrary, distinguishable color assigned to material
     */
    MATERIALIDS = 6
}

/**
 * Options for MeshDebugPluginMaterial
 */
export interface MeshDebugOptions {
    /**
     * Current mesh debug mode.
     * Defaults to NONE, or 0.
     */
    mode?: MeshDebugMode;
    /**
     * Amount of blending in range [0,1] to perform on material underneath.
     * Only applies to UV1, UV2, Vertex Colors, and Material IDs.
     * Defaults to 0.2.
     */
    blendFactor?: number;
    /**
     * Thickness of wireframe lines in TRIANGLES mode.
     * Defaults to 0.2. //TODO 
     */
    edgeThickness?: number;
    /**
     * Color of wireframe lines in TRIANGLES mode.
     * Defaults to (0.1, 0.1, 0.1).
     */
    edgeColor?: Vector3;
    /**
     * Size of dots over vertices in VERTICES mode.
     * Defaults to 1.0. //TODO
     */
    dotRadius?: number;
    /**
     * Thickness of wireframe lines in VERTICES mode.
     * Defaults to 0.05. //TODO
     */
    dotEdgeThickness?: number;
    /**
     * Color of dots over vertices in VERTICES mode.
     * Defaults to (0.1, 0.1, 0.1).
     */
    dotColor?: Vector3;
    /**
     * Number of squares along an axis in UV1 or UV2 mode.
     * Defaults to 40.
     */
    uvScale?: number;
    /**
     * Color 1 (of 2) of checkerboard grid in UV1 or UV2 mode.
     * Defaults to (0.4, 0.4, 0.4).
     */
    checkerboardColor1?: Vector3;
    /**
     * Color 2 (of 2) of checkerboard grid in UV1 or UV2 mode.
     * Defaults to (0.8, 0.8, 0.8).
     */
    checkerboardColor2?: Vector3;
    /**
     * Arbitrary color of this material in MATERIALIDS mode.
     * Defaults to randomly-generated color.
     */
    materialColor?: Vector3;
}

/**
 * @internal
 */
export class MeshDebugDefines extends MaterialDefines {
    MODE: MeshDebugMode = MeshDebugMode.NONE;
}

/**
 * Plugin that implements various mesh debug visualizations, 
 * List of available visualizations can be found in MeshDebugMode enum.
 * @since X.X.XX
 */
export class MeshDebugPluginMaterial extends MaterialPluginBase {

    private _isEnabled: boolean;

    private _options: MeshDebugOptions;

    /**
     * Creates a new MeshDebugPluginMaterial
     * @param material The material to attach the mesh debug plugin to
     * @param options TODO
     */
    constructor(material: PBRBaseMaterial | StandardMaterial, options?: MeshDebugOptions) {
        options = options ?? {};

        const defines = new MeshDebugDefines();
        defines.MODE = options.mode ?? defines.MODE;
        super(material, "MeshDebug", 200, defines);
        
        // TODO: Decide on better default values & add rationale in comments of MeshDebugOptions
        this._options = options;
        this._options.mode = options.mode ?? defines.MODE;
        this._options.blendFactor = options.blendFactor ?? 0.2;
        this._options.edgeThickness = options.edgeThickness ?? 0.2;
        this._options.edgeColor = options.edgeColor ?? new Vector3(0.1,0.1,0.1);
        this._options.dotRadius = options.dotRadius ?? 1.0;
        this._options.dotEdgeThickness = options.dotEdgeThickness ?? 0.05;
        this._options.dotColor = options.dotColor ?? new Vector3(0.1,0.1,0.1);
        this._options.uvScale = options.uvScale ?? 40.0;
        this._options.checkerboardColor1 = options.checkerboardColor1 ?? new Vector3(0.4,0.4,0.4);
        this._options.checkerboardColor2 = options.checkerboardColor2 ?? new Vector3(0.8,0.8,0.8);
        this._options.materialColor = options.materialColor ?? this._generateRandColor();
    }

    /**
     * TODO: Documentation
     * @returns 
     */
    getClassName() {
        return "MeshDebugPluginMaterial";
    }

    /**
     * TODO: Documentation
     * @returns 
     */
    get isEnabled() {
        return this._isEnabled;
    }
    set isEnabled(val) {
        if (this._isEnabled === val) {
            return;
        }
        this._isEnabled = val;
        this.markAllDefinesAsDirty();
        this._enable(this._isEnabled);
    }

    /**
     * TODO: Documentation
     * @returns 
     */
    get mode() {
        return this._options.mode;
    }
    set mode(val) {
        if (this._options.mode === val) {
            return;
        }
        this._options.mode = val;
        this.markAllDefinesAsDirty();
    }

    /**
     * TODO: Documentation
     * @returns 
     */
    prepareDefines(defines: MeshDebugDefines) {
        defines.MODE = this._options.mode!;
        //TODO: Check that mesh is unindexed if trying to enter TRIANGLES or VERTICES modes
    }

    /**
     * TODO: Documentation
     * @returns 
     */
    getUniforms() {
        return {
            "ubo": [
                { name: "blendFactor", size: 1, type: "float"},
                { name: "edgeThickness", size: 1, type: "float"},
                { name: "edgeColor", size: 3, type: "vec3"},
                { name: "dotRadius", size: 1, type: "float"},
                { name: "dotEdgeThickness", size: 1, type: "float"},
                { name: "dotColor", size: 3, type: "vec3"},
                { name: "uvScale", size: 1, type: "float"},
                { name: "checkerboardColor1", size: 3, type: "vec3"},
                { name: "checkerboardColor2", size: 3, type: "vec3"},
                { name: "materialColor", size: 3, type: "vec3"},
            ],
            "fragment": `
                #if MODE != 0
                    uniform float blendFactor;
                #endif

                #if MODE == 1
                    uniform float edgeThickness;
                    uniform vec3 edgeColor;
                #elif MODE == 2
                    uniform float dotRadius;
                    uniform float dotEdgeThickness;
                    uniform vec3 dotColor;
                #elif MODE == 3 || MODE == 4
                    uniform float uvScale;
                    uniform vec3 checkerboardColor1;
                    uniform vec3 checkerboardColor2;
                #elif MODE == 6
                    uniform vec3 materialColor;
                #endif
            `,
        };
    }

    /**
     * TODO: Documentation
     * @returns 
     */
    bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        if (this._isEnabled) {
            uniformBuffer.updateFloat("blendFactor", this._options.blendFactor!);
            uniformBuffer.updateFloat("edgeThickness", this._options.edgeThickness!);
            uniformBuffer.updateVector3("edgeColor", this._options.edgeColor!);
            uniformBuffer.updateFloat("dotRadius", this._options.dotRadius!);
            uniformBuffer.updateFloat("dotEdgeThickness", this._options.dotEdgeThickness!);
            uniformBuffer.updateVector3("dotColor", this._options.dotColor!);
            uniformBuffer.updateFloat("uvScale", this._options.uvScale!);
            uniformBuffer.updateVector3("checkerboardColor1", this._options.checkerboardColor1!);
            uniformBuffer.updateVector3("checkerboardColor2", this._options.checkerboardColor2!);
            uniformBuffer.updateVector3("materialColor", this._options.materialColor!);
        }
    }

    /**
     * TODO: Documentation
     * @returns 
     */
    getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        return shaderType === "vertex" ? {
            // Barycentric coordinate assignments
            "CUSTOM_VERTEX_DEFINITIONS": `
                varying vec3 vBarycentric;
            `,
            "CUSTOM_VERTEX_MAIN_BEGIN": `
                float vertexIndex = mod(float(gl_VertexID), 3.0);

                if (vertexIndex == 0.0) { 
                    vBarycentric = vec3(0.0,1.0,0.0); 
                }
                else if (vertexIndex == 1.0) { 
                    vBarycentric = vec3(1.0,0.0,0.0); 
                }
                else { 
                    vBarycentric = vec3(0.0,0.0,1.0); 
                }
            `,
            } : {
            // Helper function definitions
            "CUSTOM_FRAGMENT_DEFINITIONS": `
                varying vec3 vBarycentric;

                #if MODE == 1 || MODE == 2
                    float edgeFactor(float thickness) {
                        vec3 d = fwidth(vBarycentric);
                        vec3 a3 = smoothstep(vec3(0.0), d * thickness, vBarycentric);
                        return min(min(a3.x, a3.y), a3.z);
                    }
                #endif

                #if (MODE == 3 && defined(UV1)) || (MODE == 4 && defined(UV2))
                    float checkerboardFactor(vec2 uv) {
                        float uIndex = floor(uv.x * uvScale);
                        float vIndex = floor(uv.y * uvScale);
                        return mod(uIndex + vIndex, 2.0);
                    }
                #endif
            `,
            // Channels that need lighting effects
            // TODO: Find better place to update color pre-lighting instead of surfaceAlbedo
            "CUSTOM_FRAGMENT_BEFORE_LIGHTS": `
                #if MODE == 3 && defined(UV1)
                    surfaceAlbedo = mix(checkerboardColor1, checkerboardColor2, checkerboardFactor(vMainUV1));
                    #define DEBUG_BLEND
                #elif MODE == 4 && defined(UV2)
                    surfaceAlbedo = mix(checkerboardColor1, checkerboardColor2, checkerboardFactor(vMainUV2));
                    #define DEBUG_BLEND
                #elif MODE == 6
                    surfaceAlbedo = materialColor;
                    #define DEBUG_BLEND
                #endif

                vec3 newSurfaceAlbedo = surfaceAlbedo;
            `,
            // Channels that don't need lighting and don't blend with texture underneath
            "CUSTOM_FRAGMENT_MAIN_END": `
                #if MODE == 1
                    gl_FragColor = mix(vec4(edgeColor,1.0), gl_FragColor, edgeFactor(edgeThickness));
                #elif MODE == 2
                    gl_FragColor = mix(vec4(edgeColor, 1.0), gl_FragColor, edgeFactor(dotEdgeThickness));
                #elif MODE == 5 && defined(VERTEXCOLOR)
                    gl_FragColor = vColor;
                    #define DEBUG_BLEND
                #endif

                // Blending between select mesh & texture debug modes
                #if DEBUGMODE > 0 && defined(DEBUG_BLEND)
                    gl_FragColor = mix(gl_FragColor, vec4(newSurfaceAlbedo, 1.0), blendFactor);
                #endif
            `
            // TODO: Add handling for when mesh data does not exist?
        };
    }

    /**
     * TODO: Documentation
     * See https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
     * @returns 
    */
   private _generateRandColor(): Vector3 {
        // TODO: I feel like this might only work as-intended if we could call this with sequential numbers instead of random ones, but...
        const hue: number = (Math.random() + 0.618033988749895) % 1;
        const color: Color3 = Color3.FromHSV(hue * 360, 0.95, 0.99);
        return Vector3.FromArray(color.asArray());
    }

}

RegisterClass("BABYLON.MeshDebugPluginMaterial", MeshDebugPluginMaterial);
