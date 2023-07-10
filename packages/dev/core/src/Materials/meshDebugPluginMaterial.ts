/* eslint-disable @typescript-eslint/naming-convention */
import { MaterialPluginBase } from "./materialPluginBase";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import type { Nullable } from "../types";
import { MaterialDefines } from "./materialDefines";
import type { PBRBaseMaterial } from "./PBR/pbrBaseMaterial";
import type { StandardMaterial } from "./standardMaterial";
import { RegisterClass } from "../Misc/typeStore";
import { Color3, Vector3, Vector4 } from "core/Maths/math";
import type { Mesh } from "core/Meshes/mesh";
import { Logger } from "core/Misc/logger";
import { expandToProperty, serialize } from "core/Misc/decorators";
import type { AbstractMesh } from "core/Meshes/abstractMesh";

/**
 * Supported visualizations of MeshDebugPluginMaterial
 */
export enum MeshDebugMode {
    /**
     * Material without any mesh debug visualization
     */
    NONE = -1,
    /**
     * A wireframe of the mesh
     * NOTE: For this mode to work correctly, convertToUnIndexedMesh() or MeshDebugPluginMaterial.prepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    TRIANGLES = 0,
    /**
     * A wireframe of the mesh, with points drawn over vertices
     * NOTE: For this mode to work correctly, MeshDebugPluginMaterial.prepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    TRIANGLES_VERTICES = 1,
    /**
     * A checkerboard grid of the mesh's UV set 0
     */
    UV0 = 2,
    /**
     * A checkerboard grid of the mesh's UV set 1
     */
    UV1 = 3,
    /**
     * The mesh's vertex colors displayed as the primary texture
     */
    VERTEXCOLORS = 4,
    /**
     * An arbitrary, distinguishable color to identify the material
     */
    MATERIALIDS = 5,
    /**
     * Points drawn over vertices of mesh
     * NOTE: For this mode to work correctly, MeshDebugPluginMaterial.prepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    VERTICES = 6,
}

/**
 * Options for MeshDebugPluginMaterial that are given at initialization
 */
export interface MeshDebugOptions {
    /**
     * Mesh debug mode to initialize with.
     * Defaults to NONE.
     */
    mode?: MeshDebugMode;
    /**
     * Whether the mesh debug visualization should multiply with any PBR debug colors underneath.
     * Defaults to true.
     */
    multiplyDebug?: boolean;
    /**
     * Default diffuse color of the visualization.
     * Defaults to (1.0, 1.0, 1.0).
     */
    shadedDiffuseColor?: Vector3;
    /**
     * Default specular color of the visualization.
     * Defaults to (0.8, 0.8, 0.8).
     */
    shadedSpecularColor?: Vector3;
    /**
     * How dark the shading of the visualization is.
     * Defaults to 10.
     */
    shadedSpecularPower?: number;
    /**
     * Width of edge lines in TRIANGLES and TRIANGLE_VERTICES modes.
     * Defaults to 0.7.
     */
    wireframeThickness?: number;
    /**
     * Color of edge lines in TRIANGLES mode, and color of dots in TRIANGLES_VERTICES and VERTICES mode.
     * Defaults to (0.0, 0.0, 0.0).
     */
    wireframeColor1?: Vector3;
    /**
     * Color of edge lines in TRIANGLES_VERTICES modes.
     * Defaults to (0.8, 0.8, 0.8).
     */
    wireframeColor2?: Vector3;
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
    uvColor1?: Vector3;
    /**
     * 2nd color of checkerboard grid in UV1 or UV2 modes.
     * Defaults to (0.5, 0.5, 0.5).
     */
    uvColor2?: Vector3;
    /**
     * Identifying color of this material in MATERIALIDS mode.
     * Defaults to a randomly-generated color.
     */
    materialColor?: Vector3;
    /**
     * Multiplicand for the square root of the camera distance in TRIANGLES_VERTICES and VERTICES mode.
     * Defaults to .001
     */
    distanceScale?: number;
}

/** @internal */
export class MeshDebugDefines extends MaterialDefines {
    dbg_MODE: MeshDebugMode = MeshDebugMode.NONE;
    dbg_MULTIPLYDEBUG: boolean = true;
}

/**
 * Plugin that implements various mesh debug visualizations,
 * List of available visualizations can be found in MeshDebugMode enum.
 */
export class MeshDebugPluginMaterial extends MaterialPluginBase {
    private _isEnabled: boolean = true;
    /**
     * Whether the plugin is enabled or disabled.
     * Defaults to true.
     */
    @serialize()
    @expandToProperty("_markAllDefinesAsDirty")
    public isEnabled: boolean = true;

    private _mode: MeshDebugMode = MeshDebugMode.NONE;
    /**
     * Current mesh debug mode.
     * Defaults to NONE.
     */
    @serialize()
    @expandToProperty("_markAllDefinesAsDirty")
    public mode: MeshDebugMode = MeshDebugMode.NONE;

    /**
     * Options for the plugin.
     * See MeshDebugOptions enum for defaults.
     */
    private _options: MeshDebugOptions = {};

    /** @internal */
    private _markAllDefinesAsDirty(): void {
        this._enable(this._isEnabled);
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
        defines.dbg_MODE = options.mode ?? defines.dbg_MODE;
        defines.dbg_MULTIPLYDEBUG = options.multiplyDebug ?? defines.dbg_MULTIPLYDEBUG;
        super(material, "MeshDebug", 200, defines);

        const defaults: MeshDebugOptions = {
            mode: defines.dbg_MODE,
            multiplyDebug: defines.dbg_MULTIPLYDEBUG,
            shadedDiffuseColor: new Vector3(1, 1, 1),
            shadedSpecularColor: new Vector3(0.8, 0.8, 0.8),
            shadedSpecularPower: 10,
            wireframeThickness: 0.7,
            wireframeColor1: new Vector3(0, 0, 0),
            wireframeColor2: new Vector3(0.8, 0.8, 0.8),
            vertexRadius: 1.2,
            uvScale: 20,
            uvColor1: new Vector3(1, 1, 1),
            uvColor2: new Vector3(0.5, 0.5, 0.5),
            materialColor: this._getRandomColor(),
            distanceScale: 0.001
        }
       
        this._options = {...defaults, ...options};
        this._mode = defines.dbg_MODE;

        this._enable(this._isEnabled);
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
            Logger.Warn("For best results with TRIANGLES, TRIANGLES_VERTICES, or VERTICES modes, please use MeshDebugPluginMaterial.prepareMeshForTrianglesAndVerticesMode() on mesh.", 1);
        }
        defines.dbg_MODE = this._mode!;
        defines.dbg_MULTIPLYDEBUG = this._options.multiplyDebug!;
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
                { name: "dbg_thicknessRadiusUvDistance", size: 4, type: "vec4" }, // wireframeThickness, vertexRadius, uvScale, and distanceScale
                { name: "dbg_wireframeColor1", size: 3, type: "vec3" },
                { name: "dbg_wireframeColor2", size: 3, type: "vec3" },
                { name: "dbg_uvColor1", size: 3, type: "vec3" },
                { name: "dbg_uvColor2", size: 3, type: "vec3" },
                { name: "dbg_materialColor", size: 3, type: "vec3" },
            ],
            fragment: `
                uniform vec3 dbg_shadedDiffuseColor;
                uniform vec4 dbg_shadedSpecularColorPower;
                uniform vec4 dbg_thicknessRadiusUvDistance;

                #if dbg_MODE == 0 || dbg_MODE == 1
                    uniform vec3 dbg_wireframeColor1;
                #endif
                #if dbg_MODE == 1
                    uniform vec3 dbg_wireframeColor2;
                #elif dbg_MODE == 2 || dbg_MODE == 3
                    uniform vec3 dbg_uvColor1;
                    uniform vec3 dbg_uvColor2;
                #elif dbg_MODE == 5
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
        if (this._isEnabled) {
            uniformBuffer.updateVector3("dbg_shadedDiffuseColor", this._options.shadedDiffuseColor!);
            uniformBuffer.updateVector4("dbg_shadedSpecularColorPower", new Vector4(this._options.shadedSpecularColor!.x, this._options.shadedSpecularColor!.y, this._options.shadedSpecularColor!.z, this._options.shadedSpecularPower!));
            uniformBuffer.updateVector4("dbg_thicknessRadiusUvDistance", new Vector4(this._options.wireframeThickness!, this._options.vertexRadius!, this._options.uvScale!, this._options.distanceScale!));
            uniformBuffer.updateVector3("dbg_wireframeColor1", this._options.wireframeColor1!);
            uniformBuffer.updateVector3("dbg_wireframeColor2", this._options.wireframeColor2!);
            uniformBuffer.updateVector3("dbg_uvColor1", this._options.uvColor1!);
            uniformBuffer.updateVector3("dbg_uvColor2", this._options.uvColor2!);
            uniformBuffer.updateVector3("dbg_materialColor", this._options.materialColor!);
        }
    }

    /**
     * Get shader code
     * @param shaderType "vertex" or "fragment"
     * @returns Shader code
     */
    public getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        return shaderType === "vertex"
            ? {
                CUSTOM_VERTEX_DEFINITIONS: `
                attribute float dbg_initialPass;

                varying vec3 dbg_vBarycentric;
                flat varying vec3 dbg_vVertexWorldPos;
                flat varying float dbg_vPass;
            `,
                CUSTOM_VERTEX_MAIN_END: `
                float dbg_vertexIndex = mod(float(gl_VertexID), 3.);

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
                dbg_vPass = dbg_initialPass;
            `,
              }
            : {
                CUSTOM_FRAGMENT_DEFINITIONS: `
                varying vec3 dbg_vBarycentric;
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

                #if dbg_MODE == 0 || dbg_MODE == 1
                    float dbg_edgeFactor() {
                        vec3 d = fwidth(dbg_vBarycentric);
                        vec3 a3 = smoothstep(vec3(0.), d * dbg_thicknessRadiusUvDistance.x, dbg_vBarycentric);
                        return min(min(a3.x, a3.y), a3.z);
                    }
                #endif

                #if dbg_MODE == 1 || dbg_MODE == 6
                    float dbg_cornerFactor() {
                        vec3 worldPos = vPositionW;
                        float dist = length(worldPos - dbg_vVertexWorldPos);
                        float camDist = length(worldPos - vEyePosition.xyz);
                        float d = sqrt(camDist) * dbg_thicknessRadiusUvDistance.w;
                        return smoothstep((dbg_thicknessRadiusUvDistance.y * d), ((dbg_thicknessRadiusUvDistance.y * 1.01) * d), dist);
                    }
                #endif

                #if (dbg_MODE == 2 && defined(UV1)) || (dbg_MODE == 3 && defined(UV2))
                    float dbg_checkerboardFactor(vec2 uv) {
                        vec2 f = fract(uv * dbg_thicknessRadiusUvDistance.z);
                        f -= .5;
                        return (f.x * f.y) > 0. ? 1. : 0.;
                    }
                #endif
            `,
                CUSTOM_FRAGMENT_MAIN_END: `
                vec3 dbg_color = dbg_shadedDiffuseColor;

                #if dbg_MODE == 0
                    dbg_color = mix(dbg_wireframeColor1, dbg_color, dbg_edgeFactor());
                #elif dbg_MODE == 1 || dbg_MODE == 6
                    float dbg_cornerFactor = dbg_cornerFactor();
                    if (dbg_vPass == 0. && dbg_cornerFactor == 1.) discard;
                    dbg_color = mix(dbg_wireframeColor1, dbg_color, dbg_cornerFactor);
                    #if dbg_MODE == 1
                        dbg_color *= mix(dbg_wireframeColor2, dbg_color, dbg_edgeFactor());
                    #endif
                #elif dbg_MODE == 2 && defined(UV1)
                    dbg_color = mix(dbg_uvColor1, dbg_uvColor2, dbg_checkerboardFactor(vMainUV1));
                #elif dbg_MODE == 3 && defined(UV2)
                    dbg_color = mix(dbg_uvColor1, dbg_uvColor2, dbg_checkerboardFactor(vMainUV2));
                #elif dbg_MODE == 4 && defined(VERTEXCOLOR)
                    dbg_color = vColor.rgb;
                #elif dbg_MODE == 5
                    dbg_color = dbg_materialColor;
                #endif

                #if !defined(DEBUGMODE) || DEBUGMODE == 0 
                    #if dbg_MODE != 4
                        gl_FragColor = vec4(dbg_applyShading(dbg_color), 1.);
                    #else
                        gl_FragColor = vec4(dbg_color, 1.);
                    #endif
                #elif defined(dbg_MULTIPLYDEBUG)
                    gl_FragColor *= vec4(dbg_color, 1.);
                #endif
            `,
              };
    }

    /**
     * Generate a random color
     * @returns Random RGB color as a Vector3
     */
    private _getRandomColor(): Vector3 {
        const hue: number = Math.random() * 360;
        const color: Color3 = Color3.FromHSV(hue, 0.95, 0.99);
        return Vector3.FromArray(color.asArray());
    }

    /**
     * Renders triangles in a mesh 3 times by tripling the indices in the index buffer.
     * Used to prepare a mesh to be rendered in TRIANGLES, VERTICES, or TRIANGLES_VERTICES modes.
     * NOTE: This is a destructive operation. The mesh's index buffer and vertex buffers are modified. A new vertex buffer is also created.
     * @param mesh Mesh to target
     */
    public static prepareMeshForTrianglesAndVerticesMode(mesh: Mesh): void {
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

        const totalVertices = mesh.getTotalVertices() / 2;
        const pass = new Array(totalVertices).fill(1).concat(new Array(totalVertices).fill(0));
        mesh.setVerticesData("dbg_initialPass", pass, false, 1);
    }
}

RegisterClass("BABYLON.MeshDebugPluginMaterial", MeshDebugPluginMaterial);
