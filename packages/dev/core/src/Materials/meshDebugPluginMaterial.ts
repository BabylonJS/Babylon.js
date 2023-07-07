/* eslint-disable @typescript-eslint/naming-convention */
import { MaterialPluginBase } from "./materialPluginBase";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import type { Nullable } from "../types";
import { MaterialDefines } from "./materialDefines";
import type { PBRBaseMaterial } from "./PBR/pbrBaseMaterial";
import type { StandardMaterial } from "./standardMaterial";
import { RegisterClass } from "../Misc/typeStore";
import { Color3, Vector3 } from "core/Maths/math";
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
    NONE = 0,
    /**
     * A wireframe of the mesh
     * NOTE: For this mode to work correctly, bar() must first be called on mesh.
     */
    TRIANGLES = 1,
    /**
     * A wireframe of the mesh, with dots drawn over vertices
     * NOTE: For this mode to work correctly, foo() must first be called on mesh.
     */
    VERTICES = 2,
    /**
     * A checkerboard grid of the mesh's UV set 1
     */
    UV1 = 3,
    /**
     * A checkerboard grid of the mesh's UV set 2
     */
    UV2 = 4,
    /**
     * The mesh's vertex colors displayed as the primary texture
     */
    VERTEXCOLORS = 5,
    /**
     * An arbitrary, distinguishable color to identify the material
     */
    MATERIALIDS = 6,
}

/**
 * Options for MeshDebugPluginMaterial that are given at initialization
 */
export interface MeshDebugOptions {
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
     * Width of edge lines in TRIANGLES and VERTICES modes.
     * Defaults to 0.7.
     */
    wireframeThickness?: number;
    /**
     * Color of edge lines in TRIANGLES mode, and color of dots in VERTICES mode.
     * Defaults to (0.0, 0.0, 0.0).
     */
    wireframeColor1?: Vector3;
    /**
     * Color of edge lines in VERTICES modes.
     * Defaults to (0.9, 0.9, 0.9).
     */
    wireframeColor2?: Vector3;
    /**
     * Radius of dots drawn over vertices in VERTICES mode.
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
}

/** @internal */
export class MeshDebugDefines extends MaterialDefines {
    MODE: MeshDebugMode = MeshDebugMode.NONE;
    MULTIPLYDEBUG: boolean = true;
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
    public _markAllDefinesAsDirty(): void {
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
        defines.MULTIPLYDEBUG = options.multiplyDebug ?? defines.MULTIPLYDEBUG;
        super(material, "MeshDebug", 200, defines);

        options.multiplyDebug = defines.MULTIPLYDEBUG;
        options.shadedDiffuseColor = options.shadedDiffuseColor ?? new Vector3(1, 1, 1);
        options.shadedSpecularColor = options.shadedSpecularColor ?? new Vector3(0.8, 0.8, 0.8);
        options.shadedSpecularPower = options.shadedSpecularPower ?? 10;
        options.wireframeThickness = options.wireframeThickness ?? 0.7;
        options.wireframeColor1 = options.wireframeColor1 ?? new Vector3(0, 0, 0);
        options.wireframeColor2 = options.wireframeColor2 ?? new Vector3(0.9, 0.9, 0.9);
        options.vertexRadius = options.vertexRadius ?? 1.2;
        options.uvScale = options.uvScale ?? 20;
        options.uvColor1 = options.uvColor1 ?? new Vector3(1, 1, 1);
        options.uvColor2 = options.uvColor2 ?? new Vector3(0.5, 0.5, 0.5);
        options.materialColor = options.materialColor ?? this._getRandomColor();
        this._options = options;

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
        if ((this._mode == MeshDebugMode.VERTICES || this._mode == MeshDebugMode.TRIANGLES) && !mesh.isVerticesDataPresent("initialPass")) {
            Logger.Warn("For best results with VERTICES or TRIANGLES mode, please use MeshDebugPluginMaterial.tripleTriangles() on mesh.", 1);
        }
        defines.MODE = this._mode;
        defines.MULTIPLYDEBUG = this._options.multiplyDebug!;
    }

    /**
     * Get the shader attributes
     * @param attributes Array of attributes
     */
    public getAttributes(attr: string[]) {
        attr.push("initialPass");
    }

    /**
     * Get the shader uniforms
     * @returns Uniforms
     */
    public getUniforms() {
        return {
            ubo: [
                { name: "shadedDiffuseColor", size: 3, type: "vec3" },
                { name: "shadedSpecularColor", size: 3, type: "vec3" },
                { name: "shadedSpecularPower", size: 1, type: "float" },
                { name: "wireframeThickness", size: 1, type: "float" },
                { name: "wireframeColor1", size: 3, type: "vec3" },
                { name: "wireframeColor2", size: 3, type: "vec3" },
                { name: "vertexRadius", size: 1, type: "float" },
                { name: "uvScale", size: 1, type: "float" },
                { name: "uvColor1", size: 3, type: "vec3" },
                { name: "uvColor2", size: 3, type: "vec3" },
                { name: "materialColor", size: 3, type: "vec3" },
            ],
            fragment: `
                uniform vec3 shadedDiffuseColor;
                uniform vec3 shadedSpecularColor;
                uniform float shadedSpecularPower;

                #if MODE == 1 || MODE == 2
                    uniform float wireframeThickness;
                    uniform vec3 wireframeColor1;
                #endif
                #if MODE == 2
                    uniform float vertexRadius;
                    uniform vec3 wireframeColor2;
                #elif MODE == 3 || MODE == 4
                    uniform float uvScale;
                    uniform vec3 uvColor1;
                    uniform vec3 uvColor2;
                #elif MODE == 6
                    uniform vec3 materialColor;
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
            uniformBuffer.updateVector3("shadedDiffuseColor", this._options.shadedDiffuseColor!);
            uniformBuffer.updateVector3("shadedSpecularColor", this._options.shadedSpecularColor!);
            uniformBuffer.updateFloat("shadedSpecularPower", this._options.shadedSpecularPower!);
            uniformBuffer.updateFloat("wireframeThickness", this._options.wireframeThickness!);
            uniformBuffer.updateVector3("wireframeColor1", this._options.wireframeColor1!);
            uniformBuffer.updateVector3("wireframeColor2", this._options.wireframeColor2!);
            uniformBuffer.updateFloat("vertexRadius", this._options.vertexRadius!);
            uniformBuffer.updateFloat("uvScale", this._options.uvScale!);
            uniformBuffer.updateVector3("uvColor1", this._options.uvColor1!);
            uniformBuffer.updateVector3("uvColor2", this._options.uvColor2!);
            uniformBuffer.updateVector3("materialColor", this._options.materialColor!);
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
                attribute float initialPass;

                varying vec3 vBarycentric;
                flat varying vec3 vVertexWorldPos;
                flat varying float vPass;
            `,
                  CUSTOM_VERTEX_MAIN_END: `
                float vertexIndex = mod(float(gl_VertexID), 3.);

                if (vertexIndex == 0.0) { 
                    vBarycentric = vec3(1.,0.,0.); 
                }
                else if (vertexIndex == 1.0) { 
                    vBarycentric = vec3(0.,1.,0.); 
                }
                else { 
                    vBarycentric = vec3(0.,0.,1.); 
                }

                vVertexWorldPos = vPositionW;
                vPass = initialPass;
            `,
              }
            : {
                  CUSTOM_FRAGMENT_DEFINITIONS: `
                #define PI 3.1415926535897932384626433832795

                varying vec3 vBarycentric;
                flat varying vec3 vVertexWorldPos;
                flat varying float vPass;

                vec3 applyShading(vec3 color) {
                    vec3 N = vNormalW.xyz;
                    vec3 L = normalize(vEyePosition.xyz - vPositionW.xyz);
                    vec3 H = normalize(L + L);
                    float LdotN = clamp(dot(L,N), 0., 1.);
                    float HdotN = clamp(dot(H,N), 0., 1.);
                    float specTerm = pow(HdotN, shadedSpecularPower);
                    color *= vec3(1.) * (LdotN / PI);
                    color += shadedSpecularColor * (specTerm / PI);
                    return color;
                }

                #if MODE == 1 || MODE == 2
                    float edgeFactor() {
                        vec3 d = fwidth(vBarycentric);
                        vec3 a3 = smoothstep(vec3(0.), d * wireframeThickness, vBarycentric);
                        return min(min(a3.x, a3.y), a3.z);
                    }
                #endif

                #if MODE == 2
                    float cornerFactor() {
                        vec3 worldPos = vPositionW;
                        float dist = length(worldPos - vVertexWorldPos);
                        float camDist = length(worldPos - vEyePosition.xyz);
                        float d = sqrt(camDist) * 0.001;
                        return smoothstep((vertexRadius * d), ((vertexRadius * 1.01) * d), dist);
                    }
                #endif

                #if (MODE == 3 && defined(UV1)) || (MODE == 4 && defined(UV2))
                    float checkerboardFactor(vec2 uv) {
                        vec2 f = fract(uv * uvScale);
                        f -= .5;
                        return (f.x * f.y) > 0. ? 1. : 0.;
                    }
                #endif
            `,
                  CUSTOM_FRAGMENT_MAIN_END: `
                vec3 featureColor = shadedDiffuseColor;

                #if MODE == 1
                    featureColor = mix(wireframeColor1, featureColor, edgeFactor());
                #elif MODE == 2
                    float cornerFactor = cornerFactor();
                    if (vPass == 0. && cornerFactor == 1.) discard;
                    featureColor = mix(wireframeColor2, featureColor, edgeFactor());
                    featureColor *= mix(wireframeColor1, featureColor, cornerFactor);
                #elif MODE == 3 && defined(UV1)
                    featureColor = mix(uvColor1, uvColor2, checkerboardFactor(vMainUV1));
                #elif MODE == 4 && defined(UV2)
                    featureColor = mix(uvColor1, uvColor2, checkerboardFactor(vMainUV2));
                #elif MODE == 5 && defined(VERTEXCOLOR)
                    featureColor = vColor.rgb;
                #elif MODE == 6
                    featureColor = materialColor;
                #endif

                #if DEBUGMODE == 0
                    #if MODE != 5
                        gl_FragColor = vec4(applyShading(featureColor), 1.);
                    #else
                        gl_FragColor = vec4(featureColor, 1.);
                    #endif
                #elif defined(MULTIPLYDEBUG)
                    gl_FragColor *= vec4(featureColor, 1.);
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
     * Used to prepare a mesh to be rendered in TRIANGLES or VERTICES modes.
     * NOTE: This is a destructive operation. The mesh's index buffer will be modified.
     * @param mesh Mesh to target
     */
    public static tripleTriangles(mesh: Mesh): void {
        mesh.convertToUnIndexedMesh();

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
        mesh.setVerticesData("initialPass", pass, false, 1);
    }
}

RegisterClass("BABYLON.MeshDebugPluginMaterial", MeshDebugPluginMaterial);
