/* eslint-disable @typescript-eslint/naming-convention */
import { MaterialPluginBase } from "./materialPluginBase";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import type { FloatArray, Nullable } from "../types";
import { MaterialDefines } from "./materialDefines";
import type { PBRBaseMaterial } from "./PBR/pbrBaseMaterial";
import type { StandardMaterial } from "./standardMaterial";
import { RegisterClass } from "../Misc/typeStore";
import { Vector3 } from "core/Maths/math";
import type { Mesh } from "core/Meshes/mesh";
import { Logger } from "core/Misc/logger";
import { expandToProperty, serialize } from "core/Misc/decorators";
import type { AbstractMesh } from "core/Meshes/abstractMesh";

const vertexDefinitions = 
`attribute float dbg_initialPass;

varying vec3 dbg_vBarycentric;
flat varying vec3 dbg_vVertexWorldPos;
flat varying float dbg_vPass;`;

const vertexMainEnd =
`float dbg_vertexIndex = mod(float(gl_VertexID), 3.);

if (dbg_vertexIndex == 0.0) { 
    dbg_vBarycentric = vec3(1.,0.,0.); 
}
else if (dbg_vertexIndex == 1.0) { 
    dbg_vBarycentric = vec3(0.,1.,0.); 
}
else { 
    dbg_vBarycentric = vec3(0.,0.,1.); 
}

dbg_vVertexWorldPos = vPositionW;
dbg_vPass = dbg_initialPass;`;

const fragmentDefinitions =
`varying vec3 dbg_vBarycentric;
flat varying vec3 dbg_vVertexWorldPos;
flat varying float dbg_vPass;

vec3 dbg_applyShading(vec3 color) {
    vec3 N = vNormalW.xyz;
    vec3 L = normalize(vEyePosition.xyz - vPositionW.xyz);
    vec3 H = normalize(L + L);
    float LdotN = clamp(dot(L,N), 0., 1.);
    float HdotN = clamp(dot(H,N), 0., 1.);
    float specTerm = pow(HdotN, dbg_shadedSpecularColorPower.w);
    color *= (LdotN / PI);
    color += dbg_shadedSpecularColorPower.rgb * (specTerm / PI);
    return color;
}

#if DBG_MODE == 1 || DBG_MODE == 3
    float dbg_edgeFactor() {
        vec3 d = fwidth(dbg_vBarycentric);
        vec3 a3 = smoothstep(vec3(0.), d * dbg_thicknessRadiusScale.x, dbg_vBarycentric);
        return min(min(a3.x, a3.y), a3.z);
    }
#endif

#if DBG_MODE == 2 || DBG_MODE == 3
    float dbg_cornerFactor() {
        vec3 worldPos = vPositionW;
        float dist = length(worldPos - dbg_vVertexWorldPos);
        float camDist = length(worldPos - vEyePosition.xyz);
        float d = sqrt(camDist) * .001;
        return smoothstep((dbg_thicknessRadiusScale.y * d), ((dbg_thicknessRadiusScale.y * 1.01) * d), dist);
    }
#endif

#if (DBG_MODE == 4 && defined(UV1)) || (DBG_MODE == 5 && defined(UV2))
    float dbg_checkerboardFactor(vec2 uv) {
        vec2 f = fract(uv * dbg_thicknessRadiusScale.z);
        f -= .5;
        return (f.x * f.y) > 0. ? 1. : 0.;
    }
#endif`;

const fragmentMainEnd =
`vec3 dbg_color = dbg_shadedDiffuseColor;

#if DBG_MODE == 1
    dbg_color = mix(dbg_wireframeTrianglesColor, dbg_color, dbg_edgeFactor());
#elif DBG_MODE == 2 || DBG_MODE == 3
    float dbg_cornerFactor = dbg_cornerFactor();
    if (dbg_vPass == 0. && dbg_cornerFactor == 1.) discard;
    dbg_color = mix(dbg_vertexColor, dbg_color, dbg_cornerFactor);
    #if DBG_MODE == 3
        dbg_color *= mix(dbg_wireframeVerticesColor, dbg_color, dbg_edgeFactor());
    #endif
#elif DBG_MODE == 4 && defined(UV1)
    dbg_color = mix(dbg_uvPrimaryColor, dbg_uvSecondaryColor, dbg_checkerboardFactor(vMainUV1));
#elif DBG_MODE == 5 && defined(UV2)
    dbg_color = mix(dbg_uvPrimaryColor, dbg_uvSecondaryColor, dbg_checkerboardFactor(vMainUV2));
#elif DBG_MODE == 6 && defined(VERTEXCOLOR)
    dbg_color = vColor.rgb;
#elif DBG_MODE == 7
    dbg_color = dbg_materialColor;
#endif

#if defined(DBG_MULTIPLY)
    gl_FragColor *= vec4(dbg_color, 1.);
#else
    #if DBG_MODE != 6
        gl_FragColor = vec4(dbg_applyShading(dbg_color), 1.);
    #else
        gl_FragColor = vec4(dbg_color, 1.);
    #endif                
#endif`;

/**
 * Default color palette used for MATERIALIDS mode.
 */
const materialIdColors = [
    new Vector3(.98, .26, .38),
    new Vector3(.47, .75, .3),
    new Vector3(0, .26, .77),
    new Vector3(.97, .6, .76),
    new Vector3(.19, .63, .78),
    new Vector3(.98, .80, .60),
    new Vector3(.65, .43, .15),
    new Vector3(.15, .47, .22),
    new Vector3(.67, .71, .86),
    new Vector3(.09, .46, .56),
    new Vector3(.80, .98, .02),
    new Vector3(.39, .29, .13),
    new Vector3(.53, .63, .06),
    new Vector3(.95, .96, .41),
    new Vector3(1., .72, .94),
    new Vector3(.63, .08, .31),
    new Vector3(.66, .96, .95),
    new Vector3(.22, .14, .19),
    new Vector3(.14, .65, .59),
    new Vector3(.93, 1, .68),
    new Vector3(.93, .14, .44),
    new Vector3(.47, .86, .67),
    new Vector3(.85, .07, .78),
    new Vector3(.53, .64, .98),
    new Vector3(.43, .37, .56),
    new Vector3(.71, .65, .25),
    new Vector3(.66, .19, .01),
    new Vector3(.94, .53, .12),
    new Vector3(.41, .44, .44),
    new Vector3(.24, .71, .96),
    new Vector3(.57, .28, .56),
    new Vector3(.44, .98, .42)
];

/**
 * Supported visualizations of MeshDebugPluginMaterial
 */
export enum MeshDebugMode {
    /**
     * Material without any mesh debug visualization
     */
    NONE = 0,
    /**
     * A wireframe of the mesh
     * NOTE: For this mode to work correctly, convertToUnIndexedMesh() or MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    TRIANGLES = 1,
    /**
     * Points drawn over vertices of mesh
     * NOTE: For this mode to work correctly, MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    VERTICES = 2,
    /**
     * A wireframe of the mesh, with points drawn over vertices
     * NOTE: For this mode to work correctly, MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    TRIANGLES_VERTICES = 3,
    /**
     * A checkerboard grid of the mesh's UV set 0
     */
    UV0 = 4,
    /**
     * A checkerboard grid of the mesh's UV set 1
     */
    UV1 = 5,
    /**
     * The mesh's vertex colors displayed as the primary texture
     */
    VERTEXCOLORS = 6,
    /**
     * An arbitrary, distinguishable color to identify the material
     */
    MATERIALIDS = 7,
}

/**
 * Options for MeshDebugPluginMaterial that are given at initialization
 */
export interface MeshDebugOptions {
    /**
     * The mesh debug visualization.
     * Defaults to NONE.
     */
    mode?: MeshDebugMode;
    /**
     * Whether the mesh debug visualization should multiply with color underneath.
     * Defaults to true.
     */
    multiply?: boolean;
    /**
     * Diffuse color used to shade the mesh.
     * Defaults to (1.0, 1.0, 1.0).
     */
    shadedDiffuseColor?: Vector3;
    /**
     * Specular color used to shade the mesh.
     * Defaults to (0.8, 0.8, 0.8).
     */
    shadedSpecularColor?: Vector3;
    /**
     * Specular power used to shade the mesh.
     * Defaults to 10.
     */
    shadedSpecularPower?: number;
    /**
     * Width of edge lines in TRIANGLES and TRIANGLE_VERTICES modes.
     * Defaults to 0.7.
     */
    wireframeThickness?: number;
    /**
     * Color of edge lines in TRIANGLES mode.
     * Defaults to (0.0, 0.0, 0.0).
     */
    wireframeTrianglesColor?: Vector3;
    /**
     * Color of edge lines in TRIANGLES_VERTICES modes.
     * Defaults to (0.8, 0.8, 0.8).
     */
    wireframeVerticesColor?: Vector3;
    /**
     * Color of vertices in TRIANGLES_VERTICES and VERTICES mode.
     * Defaults to (0.0, 0.0, 0.0).
     */
    vertexColor?: Vector3;
    /**
     * Radius of dots drawn over vertices in TRIANGLE_VERTICES and VERTICES mode.
     * Defaults to 1.2.
     */
    vertexRadius?: number;
    /**
     * Size of tiles in UV1 or UV2 modes.
     * Defaults to 20.
     */
    uvScale?: number;
    /**
     * 1st color of checkerboard grid in UV1 or UV2 modes.
     * Defaults to (1.0, 1.0, 1.0).
     */
    uvPrimaryColor?: Vector3;
    /**
     * 2nd color of checkerboard grid in UV1 or UV2 modes.
     * Defaults to (0.5, 0.5, 0.5).
     */
    uvSecondaryColor?: Vector3;
    /**
     * Color palette to use for MATERIALIDS mode.
     * Defaults to materialIdColors table.
     */
    materialColorTable?: Array<Vector3>;
}

/** @internal */
class MeshDebugDefines extends MaterialDefines {
    DBG_MODE: MeshDebugMode = MeshDebugMode.NONE;
    DBG_MULTIPLY: boolean = true;
}

/**
 * Plugin that implements various mesh debug visualizations,
 * List of available visualizations can be found in MeshDebugMode enum.
 */
export class MeshDebugPluginMaterial extends MaterialPluginBase {

    /**
     * Total number of instances of the plugin.
     * Starts at 0.
    */
    private static _pluginCount: number = 0;

    /**
     * Index of this instance of the plugin.
     * Based on pluginCount at time of instantiation.
    */
    @serialize()
    private _pluginIndex: number;

    /**
     * Options for the plugin.
     * See MeshDebugOptions interface for defaults.
    */
   private _options: Required<MeshDebugOptions>;
   
   private _mode: MeshDebugMode = MeshDebugMode.NONE;
    /**
     * Current mesh debug visualization.
     * Defaults to NONE.
     */
    @serialize()
    @expandToProperty("_markAllDefinesAsDirty")
    public mode: MeshDebugMode = MeshDebugMode.NONE;

    private _multiply: boolean = true;
    /**
     * Whether the mesh debug visualization multiplies with colors underneath. 
     * Defaults to true.
     */
    @serialize()
    @expandToProperty("_markAllDefinesAsDirty")
    public multiply: boolean = true;

    /** @internal */
    protected _markAllDefinesAsDirty(): void {
        this.markAllDefinesAsDirty();
    }

    /**
     * Creates a new MeshDebugPluginMaterial
     * @param material Material to attach the mesh debug plugin to
     * @param options Options for the mesh debug plugin
     */
    constructor(material: PBRBaseMaterial | StandardMaterial, options?: MeshDebugOptions) {
        options = options ?? {};

        const defines = new MeshDebugDefines();
        defines.DBG_MODE = options.mode ?? defines.DBG_MODE;
        defines.DBG_MULTIPLY = options.multiply ?? defines.DBG_MULTIPLY;
        super(material, "MeshDebug", 200, defines, true, true);
        
        const defaults: Required<MeshDebugOptions> = {
            mode: defines.DBG_MODE,
            multiply: defines.DBG_MULTIPLY,
            shadedDiffuseColor: new Vector3(1, 1, 1),
            shadedSpecularColor: new Vector3(0.8, 0.8, 0.8),
            shadedSpecularPower: 10,
            wireframeThickness: 0.7,
            wireframeTrianglesColor: new Vector3(0, 0, 0),
            wireframeVerticesColor: new Vector3(0.8, 0.8, 0.8),
            vertexColor: new Vector3(0, 0, 0),
            vertexRadius: 1.2,
            uvScale: 20,
            uvPrimaryColor: new Vector3(1, 1, 1),
            uvSecondaryColor: new Vector3(0.5, 0.5, 0.5),
            materialColorTable: materialIdColors,
        }
        
        this._mode = defines.DBG_MODE;
        this._multiply = defines.DBG_MULTIPLY;
        this._options = {...defaults, ...options};
        this._pluginIndex = MeshDebugPluginMaterial._pluginCount++;
    }

    /**
     * Get the class name
     * @returns Class name
     */
    public getClassName() {
        return "MeshDebugPluginMaterial";
    }

    /**
     * Prepare the defines
     * @param defines Mesh debug defines
     * @param _scene Scene
     * @param _mesh Mesh associated with material
     */
    public prepareDefines(defines: MeshDebugDefines, scene: Scene, mesh: AbstractMesh) {
        if ((this._mode == MeshDebugMode.VERTICES || this._mode == MeshDebugMode.TRIANGLES || this._mode == MeshDebugMode.TRIANGLES_VERTICES) && !mesh.isVerticesDataPresent("dbg_initialPass")) {
            Logger.Warn("For best results with TRIANGLES, TRIANGLES_VERTICES, or VERTICES modes, please use MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode() on mesh.", 1);
        }
        defines.DBG_MODE = this._mode;
        defines.DBG_MULTIPLY = this._multiply;
    }

    /**
     * Get the shader attributes
     * @param attributes Array of attributes
     */
    public getAttributes(attr: string[]) {
        attr.push("dbg_initialPass");
    }

    /**
     * Get the shader uniforms
     * @returns Uniforms
     */
    public getUniforms() {
        return {
            ubo: [
                { name: "dbg_shadedDiffuseColor", size: 3, type: "vec3" },
                { name: "dbg_shadedSpecularColorPower", size: 4, type: "vec4" }, // shadedSpecularColor, shadedSpecularPower
                { name: "dbg_thicknessRadiusScale", size: 3, type: "vec3" }, // wireframeThickness, vertexRadius, uvScale
                { name: "dbg_wireframeTrianglesColor", size: 3, type: "vec3" },
                { name: "dbg_wireframeVerticesColor", size: 3, type: "vec3" },
                { name: "dbg_vertexColor", size: 3, type: "vec3"},
                { name: "dbg_uvPrimaryColor", size: 3, type: "vec3" },
                { name: "dbg_uvSecondaryColor", size: 3, type: "vec3" },
                { name: "dbg_materialColor", size: 3, type: "vec3" },
            ],
            fragment: `
                uniform vec3 dbg_shadedDiffuseColor;
                uniform vec4 dbg_shadedSpecularColorPower;
                uniform vec3 dbg_thicknessRadiusScale;

                #if DBG_MODE == 1 || DBG_MODE == 2
                    uniform vec3 dbg_vertexColor;
                #endif

                #if DBG_MODE == 0
                    uniform vec3 dbg_wireframeTrianglesColor;
                #elif DBG_MODE == 1
                    uniform vec3 dbg_wireframeVerticesColor;
                #elif DBG_MODE == 2 || DBG_MODE == 3
                    uniform vec3 dbg_uvPrimaryColor;
                    uniform vec3 dbg_uvSecondaryColor;
                #elif DBG_MODE == 5
                    uniform vec3 dbg_materialColor;
                #endif
            `,
        };
    }

    /**
     * Bind the uniform buffer
     * @param uniformBuffer Uniform buffer
     */
    public bindForSubMesh(uniformBuffer: UniformBuffer): void {
        uniformBuffer.updateVector3("dbg_shadedDiffuseColor", this._options.shadedDiffuseColor);
        uniformBuffer.updateFloat4("dbg_shadedSpecularColorPower", this._options.shadedSpecularColor.x, this._options.shadedSpecularColor.y, this._options.shadedSpecularColor.z, this._options.shadedSpecularPower);
        uniformBuffer.updateFloat3("dbg_thicknessRadiusScale", this._options.wireframeThickness, this._options.vertexRadius, this._options.uvScale);
        uniformBuffer.updateVector3("dbg_wireframeTrianglesColor", this._options.wireframeTrianglesColor);
        uniformBuffer.updateVector3("dbg_wireframeVerticesColor", this._options.wireframeVerticesColor);
        uniformBuffer.updateVector3("dbg_vertexColor", this._options.vertexColor);
        uniformBuffer.updateVector3("dbg_uvPrimaryColor", this._options.uvPrimaryColor);
        uniformBuffer.updateVector3("dbg_uvSecondaryColor", this._options.uvSecondaryColor);
        uniformBuffer.updateVector3("dbg_materialColor", this._options.materialColorTable[this._pluginIndex % this._options.materialColorTable.length],);
    }

    /**
     * Get shader code
     * @param shaderType "vertex" or "fragment"
     * @returns Shader code
     */
    public getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        return shaderType === "vertex"
            ? {
                CUSTOM_VERTEX_DEFINITIONS: vertexDefinitions,
                CUSTOM_VERTEX_MAIN_END: vertexMainEnd,
            }
            : {
                CUSTOM_FRAGMENT_DEFINITIONS: fragmentDefinitions,
                CUSTOM_FRAGMENT_MAIN_END: fragmentMainEnd,
            };
    }

    /**
     * Serializes this plugin material
     * @returns serialized object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.shadedDiffuseColor = this._options.shadedDiffuseColor.asArray();
        serializationObject.shadedSpecularColor = this._options.shadedSpecularColor.asArray();
        serializationObject.shadedSpecularPower = this._options.shadedSpecularPower;
        serializationObject.wireframeThickness = this._options.wireframeThickness;
        serializationObject.wireframeTrianglesColor = this._options.wireframeTrianglesColor.asArray();
        serializationObject.wireframeVerticesColor = this._options.wireframeVerticesColor.asArray();
        serializationObject.vertexColor = this._options.vertexColor.asArray();
        serializationObject.vertexRadius = this._options.vertexRadius;
        serializationObject.uvScale = this._options.uvScale;
        serializationObject.uvPrimaryColor = this._options.uvPrimaryColor.asArray();
        serializationObject.uvSecondaryColor = this._options.uvSecondaryColor.asArray();
        serializationObject.materialColorTable = [];
        for (const color of this._options.materialColorTable) {
            serializationObject.materialColorTable.push(color.asArray());
        }

        return serializationObject;
    }

    /**
     * Parses a serialized object
     * @param serializationObject serialized object
     * @param scene scene
     * @param rootUrl root url for textures
     */
    public parse(serializationObject: any, scene: Scene, rootUrl: string): void {
        super.parse(serializationObject, scene, rootUrl);

        this._options.mode = serializationObject.mode;
        this._options.multiply = serializationObject.multiply;
        this._options.shadedDiffuseColor = Vector3.FromArray(serializationObject.shadedDiffuseColor);
        this._options.shadedSpecularColor = Vector3.FromArray(serializationObject.shadedSpecularColor);
        this._options.shadedSpecularPower = serializationObject.shadedSpecularPower;
        this._options.wireframeThickness = serializationObject.wireframeThickness;
        this._options.wireframeTrianglesColor = Vector3.FromArray(serializationObject.wireframeTrianglesColor);
        this._options.wireframeVerticesColor = Vector3.FromArray(serializationObject.wireframeVerticesColor);
        this._options.vertexColor = Vector3.FromArray(serializationObject.vertexColor);
        this._options.vertexRadius = serializationObject.vertexRadius;
        this._options.uvScale = serializationObject.uvScale;
        this._options.uvPrimaryColor = Vector3.FromArray(serializationObject.uvPrimaryColor);
        this._options.uvSecondaryColor = Vector3.FromArray(serializationObject.uvSecondaryColor);
        this._options.materialColorTable = [];
        for (const color of serializationObject.materialColorTable) {
            this._options.materialColorTable.push(Vector3.FromArray(color));
        }
        
        this.markAllDefinesAsDirty();
    }

    /**
     * Resets static variables of the plugin to their original state
     */
    public static Reset(): void {
        this._pluginCount = 0;
    }

    /**
     * Renders triangles in a mesh 3 times by tripling the indices in the index buffer.
     * Used to prepare a mesh to be rendered in `TRIANGLES`, `VERTICES`, or `TRIANGLES_VERTICES` modes.
     * NOTE: This is a destructive operation. The mesh's index buffer and vertex buffers are modified, and a new vertex buffer is allocated.
     * If you'd like the ability to revert these changes, toggle the optional `returnRollback` flag.
     * @param mesh the mesh to target
     * @param returnRollback whether or not to return a function that reverts mesh to its initial state. Default: false.
     * @returns a rollback function if `returnRollback` is true, otherwise an empty function.
     */
    public static PrepareMeshForTrianglesAndVerticesMode(mesh: Mesh, returnRollback: boolean = false): () => void {
        let rollback = () => {};

        if (mesh.getTotalIndices() == 0) return rollback;
        
        if (returnRollback) {
            const kinds = mesh.getVerticesDataKinds();
            const indices = mesh.getIndices()!;
            const data: { [kind: string]: FloatArray } = {};
            for(const kind of kinds) {
                data[kind] = mesh.getVerticesData(kind)!;
            }

            rollback = function() {
                mesh.setIndices(indices);
                for(const kind of kinds) {
                    mesh.setVerticesData(kind, data[kind]);
                }
                mesh.removeVerticesData("dbg_initialPass");
            }
        }

        let indices = Array.from(mesh.getIndices()!);
        const newIndices1 = [];
        for (let i = 0; i < indices.length; i += 3) {
            newIndices1.push(indices[i + 1], indices[i + 2], indices[i + 0]);
        }
        mesh.setIndices(indices.concat(newIndices1));

        mesh.convertToUnIndexedMesh();

        mesh.isUnIndexed = false;

        indices = Array.from(mesh.getIndices()!);
        const newIndices2 = [];
        for (let i = indices.length / 2; i < indices.length; i += 3) {
            newIndices2.push(indices[i + 1], indices[i + 2], indices[i + 0]);
        }
        mesh.setIndices(indices.concat(newIndices2));

        const num = mesh.getTotalVertices();
        const mid = num / 2;
        const pass = new Array(num).fill(1,0,mid).fill(0,mid,num);
        mesh.setVerticesData("dbg_initialPass", pass, false, 1);

        return rollback;
    }
}

RegisterClass("BABYLON.MeshDebugPluginMaterial", MeshDebugPluginMaterial);
