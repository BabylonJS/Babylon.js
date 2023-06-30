import type { Engine } from "../Engines/engine";
import { MaterialPluginBase } from "./materialPluginBase";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import type { Nullable } from "../types";
import { MaterialDefines } from "./materialDefines";
import { serialize, expandToProperty } from "../Misc/decorators";
import type { PBRBaseMaterial } from "./PBR/pbrBaseMaterial";
import type { StandardMaterial } from "./standardMaterial";
import type { SubMesh } from "../Meshes/subMesh";
import { RegisterClass } from "../Misc/typeStore";

export enum MeshDebugMode {
    NONE = 0,
    TRIANGLES = 1,
    VERTICES = 2, 
    UV1 = 3,
    UV2 = 4, 
    VERTEXCOLORS = 5,
    MATERIALIDS = 6
}

/**
 * Options for MeshDebugPluginMaterial
 */
export interface MeshDebugOptions {
    mode?: MeshDebugMode;
    useBlending?: boolean;
    seedMaterialColors?: boolean;
    materialID?: number;
}

/**
 * @internal
 */
export class MeshDebugDefines extends MaterialDefines {
    MODE: MeshDebugMode = MeshDebugMode.NONE;
    USE_BLENDING = false;
    SEED_MATERIAL_COLORS = false;
    MATERIAL_ID = Math.random();
}

/**
 * Plugin that implements various mesh debug visualizations described by MeshDebugMode
 * @since 6.1.0
 */
export class MeshDebugPluginMaterial extends MaterialPluginBase {

    // private _isEnabled = false;
    // /**
    //  * Enables or disables the mesh debug visualization on this material
    //  */
    // @serialize()
    // @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    // public isEnabled = false;

    // private _mode = MeshDebugMode.NONE;
    // /**
    //  * The mesh debug mode to display on material
    //  */
    // @serialize()
    // @expandToProperty("_markAllSubMeshesAsMiscDirty")
    // public mode = MeshDebugMode.NONE;

    // private _materialID = 0;
    // /**
    //  * A unique material ID
    //  * Used to seed each material's color in MATERIALIDS mode 
    //  */
    // @serialize()
    // @expandToProperty("_markAllSubMeshesAsMiscDirty")
    // public materialID = 0;

    // private _blendFactor = 0.2;
    // /**
    //  * A number from [0,1] to determine how strongly the 
    //  * mesh debug should blend with the underlying material.
    //  * Only applies to UVs, Vertex Colors, and Material IDs modes.
    //  */
    // @serialize()
    // @expandToProperty("_markAllSubMeshesAsMiscDirty")
    // public blendFactor = 0.2;

    // // Meta
    // private _isEnabled = false;  //NOTE unused but might be needed if moved to core, so leave it

    // // Defines
    // private _mode = MeshDebugMode.NONE;

    // // Uniforms
    // private _materialID = 0;
    // private _blendFactor = 0.2;

    // get isEnabled() {
    //     return this._isEnabled;
    // }
    // set isEnabled(enabled) {
    //     if (this._isEnabled === enabled) {
    //         return;
    //     }
    //     this._isEnabled = enabled;
    //     this.markAllDefinesAsDirty();
    //     this._enable(this._isEnabled);
    // }

    // get mode() {
    //     return this._mode;
    // }
    // set mode(val) {
    //     if (this._mode === val) {
    //         return;
    //     }
    //     this._mode = val;
    //     this.markAllDefinesAsDirty();
    // }

    // get materialID() {
    //     return this._materialID;
    // }
    // set materialID(val) {
    //     if (this._materialID === val) {
    //         return;
    //     }
    //     this._materialID = val;
    //     this.markAllDefinesAsDirty();
    // }

    // get blendFactor() {
    //     return this._blendFactor;
    // }
    // set blendFactor(val) {
    //     if (this._blendFactor === val) {
    //         return;
    //     }
    //     this._blendFactor = val;
    //     this.markAllDefinesAsDirty();
    // }

    private _options: MeshDebugOptions;

    /**
     * Creates a new MeshDebugMaterialPlugin
     * @param material The material to attach the mesh debug plugin to
     * @param addToPluginList If the plugin should be added to the material plugin list
     */
    constructor(material: PBRBaseMaterial | StandardMaterial, addToPluginList = true, options: MeshDebugOptions) {
        options = options ?? {};

        const defines = new MeshDebugDefines();
        defines.MODE = options.mode ?? defines.MODE; //may not need to be setting these to same defaults
        defines.USE_BLENDING = options.useBlending ?? defines.USE_BLENDING;
        defines.SEED_MATERIAL_COLORS = options.seedMaterialColors ?? defines.SEED_MATERIAL_COLORS; // hmm can i get away with removing this
        defines.MATERIAL_ID = options.materialID ?? defines.MATERIAL_ID;
        
        super(material, "MeshDebug", 150, defines, addToPluginList);
        
        this._options = options;
    }

    getClassName(): string {
        return "MeshDebugPluginMaterial";
    }

    prepareDefines(defines: MeshDebugDefines): void {
        const options = this._options;
        defines.MODE = options.mode ?? defines.MODE; //may not need to be setting these to same defaults
        defines.USE_BLENDING = options.useBlending ?? defines.USE_BLENDING;
        defines.SEED_MATERIAL_COLORS = options.seedMaterialColors ?? defines.SEED_MATERIAL_COLORS; // hmm can i get away with removing this
        defines.MATERIAL_ID = options.materialID ?? defines.MATERIAL_ID;
    }

    // getUniforms() {
    //     return {
    //         "ubo": [
    //             { name: "blendFactor", size: 1, type: "float"},
    //             { name: "materialID", size: 1, type: "float"},
    //         ],
    //         "fragment": `
    //             //possibly wrap this in a macro
    //             uniform float blendFactor;
    //             #if MODE == 6
    //                 uniform float materialID;
    //             #endif
    //             `,
    //     };
    // }

    // bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, _engine: Engine, subMesh: SubMesh) {
    //     if (this._isEnabled) {
    //         uniformBuffer.updateFloat("blendFactor", this._blendFactor);
    //         uniformBuffer.updateFloat("materialID", this._options.materialID);
    //     }
    // }


    getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        return shaderType === "vertex" ? {
            "CUSTOM_VERTEX_DEFINITIONS": `
                varying vec3 vBarycentric;
            `,
            "CUSTOM_VERTEX_MAIN_BEGIN": `
                // TODO: make this prettier good god
                if (int(mod(float(gl_VertexID), 3.)) == 0) { 
                    vBarycentric = vec3(0.,1.,0.); 
                }
                else if (int(mod(float(gl_VertexID), 3.)) == 1) { 
                    vBarycentric = vec3(1.,0.,0.); 
                }
                else { 
                    vBarycentric = vec3(0.,0.,1.); 
                }
            `,
        } : {
            "CUSTOM_FRAGMENT_DEFINITIONS": `
                varying vec3 vBarycentric;

                #if MODE == 1 || MODE == 2
                    const vec4 edgeColor = vec4(0.1, 0.1, 0.1, 1.0);
                    float edgeFactor(float edgeThickness){
                        vec3 d = fwidth(vBarycentric);
                        vec3 a3 = smoothstep(vec3(0.0), d * edgeThickness, vBarycentric);
                        return min(min(a3.x, a3.y), a3.z);
                    }
                #endif

                #if MODE == 6
                    vec4 materialRandColor() { // LOOOOOOOOL sorry ill make this look better
                        float seed = materialID + 1.0;
                        vec2 seed1 = vec2(seed, seed + 1.0);
                        vec2 seed2 = vec2(seed + 2.0, seed + 3.0);
                        vec2 seed3 = vec2(seed + 4.0, seed + 5.0);
                        return vec4(getRand(seed1), getRand(seed2), getRand(seed3), 1.0);
                    }
                #endif

                #if MODE == 3 && defined(UV1) //TODO generalize this to any UV
                    float uvScale = 40.0;
                    float checkerboardFactor(){
                        float uIndex = floor(vMainUV1.x * uvScale);
                        float vIndex = floor(vMainUV1.y * uvScale);
                        return mod(uIndex + vIndex, 2.0);
                    }
                #endif

                #if MODE == 2 // this is VERY very wrong but that's a later problem B)
                    float cornerFactor(float vertexRadius){
                        vec4 corner0WorldPos = world * vec4(1.0, 0.0, 0.0, 1.0);
                        vec4 corner1WorldPos = world * vec4(0.0, 1.0, 0.0, 1.0);
                        vec4 corner2WorldPos = world * vec4(0.0, 0.0, 1.0, 1.0);
                        
                        vec4 worldPos = (corner0WorldPos * vBarycentric.x) + (corner1WorldPos * vBarycentric.y) + (corner2WorldPos * vBarycentric.z);

                        vec3 dist = vec3(
                            length(worldPos - corner0WorldPos),
                            length(worldPos - corner1WorldPos),
                            length(worldPos - corner2WorldPos)
                        );

                        float camDist = length(worldPos - vEyePosition);
                        float d = sqrt(camDist) * 0.001;

                        vec3 smoot = smoothstep((vertexRadius * d), ((vertexRadius * 1.01) * d), dist);

                        return min(min(smoot.x, smoot.y), smoot.z);
                    }
                #endif
            `,
            "CUSTOM_FRAGMENT_MAIN_END": `
                // Store old color
                vec4 oldColor = gl_FragColor;
                
                #if MODE == 1
                    gl_FragColor = mix(edgeColor, gl_FragColor, edgeFactor(0.5));
                #elif MODE == 2
                    gl_FragColor = mix(vec4(0.1,0.1,0.1,1.0), gl_FragColor, cornerFactor(40.0));
                    gl_FragColor = mix(edgeColor, gl_FragColor, edgeFactor(0.0001));
                #elif MODE == 3 && defined(UV1)
                    gl_FragColor = mix(vec4(0.4,0.4,0.4,1.0), vec4(0.8,0.8,0.8,1.0), checkerboardFactor());
                    #define DEBUG_MULTIPLY
                #elif MODE == 4 && defined(UV2) //TODO
                    gl_FragColor = mix(vec4(0.4,0.4,0.4,1.0), vec4(0.8,0.8,0.8,1.0), checkerboardFactor());
                    #define DEBUG_MULTIPLY
                #elif MODE == 5 && defined(VERTEXCOLOR)
                    gl_FragColor = vColor;
                    #define DEBUG_MULTIPLY
                #elif MODE == 6
                    gl_FragColor = materialRandColor();
                    #define DEBUG_MULTIPLY
                #elif MODE != 0 // for debug for me
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                #endif

                // Blend with old debug color
                #if DEBUGMODE > 0 && defined(DEBUG_MULTIPLY)
                    gl_FragColor = mix(oldColor, gl_FragColor, blendFactor);
                #endif
            `,
        };
    }

}

RegisterClass("BABYLON.MeshDebugPluginMaterial", MeshDebugPluginMaterial);
