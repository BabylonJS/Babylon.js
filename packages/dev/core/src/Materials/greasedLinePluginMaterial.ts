import { StandardMaterial } from "core/Materials/standardMaterial";
import { Engine } from "../Engines/engine";
import { RawTexture } from "./Textures/rawTexture";
import { MaterialPluginBase } from "./materialPluginBase";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import type { Vector2 } from "../Maths/math.vector";
import { TmpVectors } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import type { Nullable } from "../types";
import type { Material } from "./material";
import { MaterialDefines } from "./materialDefines";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { PBRMaterial } from "./PBR/pbrMaterial";
import { DeepCopier } from "../Misc/deepCopier";
import type { BaseTexture } from "./Textures/baseTexture";

export enum GreasedLineMeshMaterialType {
    MATERIAL_TYPE_STANDARD = 0,
    MATERIAL_TYPE_PBR = 1,
}

export enum GreasedLineMeshColorMode {
    COLOR_MODE_SET = 0,
    COLOR_MODE_ADD = 1,
    COLOR_MODE_MULTIPLY = 2,
}

/**
 * Options for GreasedLineMaterial
 */
export interface GreasedLineMaterialOptions {
    /**
     * Line width.
     * Default to 0.1 if @see sizeAttenuation is false, or to 1 if it's true.
     */
    width?: number;
    /**
     * If false then width units = scene units. If true then line will width be reduced.
     * Defaults to false.
     */
    sizeAttenuation?: boolean;
    /**
     * Type of the material to use to render the line.
     * Defaults to StandardMaterial.
     */
    materialType?: GreasedLineMeshMaterialType;
    /**
     * Color of the line. Applies to all line segments.
     * Defaults to White.
     */
    color?: Color3;
    /**
     * Color mode of the line. Applient to all line segments.
     * The pixel color from the material shader will be modified with the value of @see color using the colorMode.
     * Defaults to @see GreasedLineMeshColorMode.SET
     */
    colorMode?: GreasedLineMeshColorMode;
    /**
     * Colors of the line segments.
     * Defaults to empty.
     */
    colors?: Color3[];
    /**
     * If true, @see colors are used, otherwise they're ignored.
     * Defaults to false.
     */
    useColors?: boolean;
    /**
     * Sampling type of the colors texture
     * Defaults to NEAREST_NEAREST.
     */
    colorsSampling?: number;
    /**
     * If true, dashing is used.
     * Defaults to false.
     */
    useDash?: boolean;
    /**
     * @see GreasedLinePluginMaterial.setDashArray
     * Defaults to 1.
     */
    dashArray?: number;
    /**
     * Defaults to 0.
     * @see GreasedLinePluginMaterial.setDashOffset
     */
    dashOffset?: number;
    /**
     * Defaults to 0.5.
     * @see GreasedLinePluginMaterial.setDashRatio
     */
    dashRatio?: number;
    /**
     * Defaults to 1.
     * @see GreasedLinePluginMaterial.setVisibility
     */
    visibility?: number;
    /**
     * Defaults to engine.getRenderWidth() and engine.getRenderHeight()
     * Rendering resolution
     */
    resolution?: Vector2;
}

/**
 * @internal
 */
export class MaterialGreasedLineDefines extends MaterialDefines {
    /**
     * The material has a color option specified
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GREASED_LINE_HAS_COLOR = false;
    /**
     * The material's size attenuation optiom
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GREASED_LINE_SIZE_ATTENUATION = false;
}

/**
 * GreasedLinePluginMaterial for GreasedLineMesh
 */
export class GreasedLinePluginMaterial extends MaterialPluginBase {
    /**
     * Plugin name
     */
    public static readonly GREASED_LINE_MATERIAL_NAME = "GreasedLine";

    private _colorsTexture?: RawTexture;

    private _dashArray = 0;

    private _options: GreasedLineMaterialOptions;

    private _engine: Engine;

    private static _EmptyColorsTexture: BaseTexture;

    constructor(
        material: Material,
        private _scene: Scene,

        options: GreasedLineMaterialOptions
    ) {
        const defines = new MaterialGreasedLineDefines();
        defines.GREASED_LINE_HAS_COLOR = !!options.color;
        defines.GREASED_LINE_SIZE_ATTENUATION = options.sizeAttenuation ?? false;

        super(material, GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME, 200, defines);

        this._options = options;
        this._engine = this._scene.getEngine();

        if (options.colors) {
            this._createColorsTexture(`${material.name}-colors-texture`, options.colors);
        } else if (this._engine.isWebGPU) {
            GreasedLinePluginMaterial._PrepareEmptyColorsTexture(_scene);
        }

        this.setDashArray(options.dashArray ?? 1); // calculate the _dashArray value

        this._enable(true); // always enabled
    }

    /**
     * Get the shader attributes
     * @param attributes array which will be filled with the attributes
     */
    getAttributes(attributes: string[]) {
        attributes.push("grl_offsets");
        attributes.push("grl_previousAndSide");
        attributes.push("grl_nextAndCounters");
        attributes.push("grl_widths");
        attributes.push("grl_colorPointers");
    }

    /**
     * Get the shader samplers
     * @param samplers
     */
    getSamplers(samplers: string[]) {
        samplers.push("grl_colors");
    }

    /**
     * Get the shader textures
     * @param activeTextures
     */
    public getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._colorsTexture) {
            activeTextures.push(this._colorsTexture);
        }
    }

    /**
     * Get the shader uniforms
     * @returns uniforms
     */
    getUniforms() {
        const ubo = [
            { name: "grl_projection", size: 16, type: "mat4" },
            { name: "grl_singleColor", size: 3, type: "vec3" },
            { name: "grl_resolution_lineWidth", size: 3, type: "vec3" },
            { name: "grl_dashOptions", size: 4, type: "vec4" },
            { name: "grl_colorMode_visibility_colorsWidth_useColors", size: 4, type: "vec4" },
        ];

        return {
            ubo,
            vertex: `
                uniform vec3 grl_resolution_lineWidth;
                uniform mat4 grl_projection;
                `,
            fragment: `
                uniform vec4 grl_dashOptions;
                uniform vec4 grl_colorMode_visibility_colorsWidth_useColors;
                uniform vec3 grl_singleColor;
                `,
        };
    }

    // only getter, it doesn't make sense to use this plugin on a mesh other than GreasedLineMesh
    // and it doesn't make sense to disable it on the mesh
    get isEnabled() {
        return true;
    }

    /**
     * Bind the uniform buffer
     * @param uniformBuffer
     */
    bindForSubMesh(uniformBuffer: UniformBuffer) {
        const activeCamera = this._scene.activeCamera;

        if (activeCamera) {
            const projection = activeCamera.getProjectionMatrix();
            uniformBuffer.updateMatrix("grl_projection", projection);
        } else {
            throw Error("GreasedLinePluginMaterial requires an active camera.");
        }

        const resolutionLineWidth = TmpVectors.Vector3[0];
        if (this._options.resolution) {
            resolutionLineWidth.x = this._options.resolution.x;
            resolutionLineWidth.y = this._options.resolution.y;
        } else {
            resolutionLineWidth.x = this._engine.getRenderWidth();
            resolutionLineWidth.y = this._engine.getRenderHeight();
        }
        resolutionLineWidth.z = this._options.width ? this._options.width : this._options.sizeAttenuation ? 1 : 0.1;
        uniformBuffer.updateVector3("grl_resolution_lineWidth", resolutionLineWidth);

        const dashOptions = TmpVectors.Vector4[0];
        dashOptions.x = GreasedLinePluginMaterial._BooleanToNumber(this._options.useDash);
        dashOptions.y = this._dashArray ?? 0;
        dashOptions.z = this._options.dashOffset ?? 0;
        dashOptions.w = this._options.dashRatio ?? 0.5;
        uniformBuffer.updateVector4("grl_dashOptions", dashOptions);

        const colorModeVisibilityColorsWidthUseColors = TmpVectors.Vector4[1];
        colorModeVisibilityColorsWidthUseColors.x = this._options.colorMode ?? GreasedLineMeshColorMode.COLOR_MODE_SET;
        colorModeVisibilityColorsWidthUseColors.y = this._options.visibility ?? 1;
        colorModeVisibilityColorsWidthUseColors.z = this._colorsTexture ? this._colorsTexture.getSize().width  : 0;
        colorModeVisibilityColorsWidthUseColors.w = GreasedLinePluginMaterial._BooleanToNumber(this._options.useColors);
        uniformBuffer.updateVector4("grl_colorMode_visibility_colorsWidth_useColors", colorModeVisibilityColorsWidthUseColors);

        if (this._options.color) {
            uniformBuffer.updateColor3("grl_singleColor", this._options.color ?? Color3.White());
        }

        if (this._colorsTexture) {
            uniformBuffer.setTexture("grl_colors", this._colorsTexture);
        } else if (this._engine.isWebGPU) {
            uniformBuffer.setTexture("grl_colors", GreasedLinePluginMaterial._EmptyColorsTexture);
        }

        uniformBuffer.update();
    }

    /**
     * Prepare the defines
     * @param defines
     * @param _scene
     * @param _mesh
     */
    prepareDefines(defines: MaterialGreasedLineDefines, _scene: Scene, _mesh: AbstractMesh) {
        const options = this._options;
        defines.GREASED_LINE_HAS_COLOR = !!options.color;
        defines.GREASED_LINE_SIZE_ATTENUATION = options.sizeAttenuation ?? false;
    }

    /**
     * Get the class name
     * @returns class name
     */
    getClassName() {
        return GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME;
    }

    /**
     * Get shader code
     * @param shaderType vertex/fragme
     * @returns shader code
     */
    getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_VERTEX_DEFINITIONS: `
                    attribute vec4 grl_previousAndSide;
                    attribute vec4 grl_nextAndCounters;
                    attribute float grl_widths;
                    attribute vec3 grl_offsets;
                    attribute float grl_colorPointers;

                    varying float grlCounters;
                    varying float grlColorPointer;

                    vec2 grlFix( vec4 i, float aspect ) {
                        vec2 res = i.xy / i.w;
                        res.x *= aspect;
                        return res;
                    }
                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_VERTEX_UPDATE_POSITION: `
                    vec3 grlPositionOffset = grl_offsets;
                    positionUpdated += grlPositionOffset;
                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_VERTEX_MAIN_END: `
                    vec2 grlResolution = grl_resolution_lineWidth.xy;
                    float grlBaseWidth = grl_resolution_lineWidth.z;

                    grlColorPointer = grl_colorPointers;

                    vec3 grlPrevious = grl_previousAndSide.xyz;
                    float grlSide = grl_previousAndSide.w;

                    vec3 grlNext = grl_nextAndCounters.xyz;
                    grlCounters = grl_nextAndCounters.w;

                    float grlAspect = grlResolution.x / grlResolution.y;

                    mat4 grlMatrix = viewProjection * world;
                    vec4 grlFinalPosition = grlMatrix * vec4( positionUpdated , 1.0 );
                    vec4 grlPrevPos = grlMatrix * vec4( grlPrevious + grlPositionOffset, 1.0 );
                    vec4 grlNextPos = grlMatrix * vec4( grlNext + grlPositionOffset, 1.0 );

                    vec2 grlCurrentP = grlFix( grlFinalPosition, grlAspect );
                    vec2 grlPrevP = grlFix( grlPrevPos, grlAspect );
                    vec2 grlNextP = grlFix( grlNextPos, grlAspect );

                    float grlWidth = grlBaseWidth * grl_widths;

                    vec2 grlDir;
                    if( grlNextP == grlCurrentP ) grlDir = normalize( grlCurrentP - grlPrevP );
                    else if( grlPrevP == grlCurrentP ) grlDir = normalize( grlNextP - grlCurrentP );
                    else {
                        vec2 grlDir1 = normalize( grlCurrentP - grlPrevP );
                        vec2 grlDir2 = normalize( grlNextP - grlCurrentP );
                        grlDir = normalize( grlDir1 + grlDir2 );
                    }
                    vec4 grlNormal = vec4( -grlDir.y, grlDir.x, 0., 1. );
                    grlNormal.xy *= .5 * grlWidth;
                    grlNormal *= grl_projection;
                    #ifdef GREASED_LINE_SIZE_ATTENUATION
                        grlNormal.xy *= grlFinalPosition.w;
                        grlNormal.xy /= ( vec4( grlResolution, 0., 1. ) * grl_projection ).xy;
                    #endif
                    grlFinalPosition.xy += grlNormal.xy * grlSide;
                    gl_Position = grlFinalPosition;



                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "!gl_Position\\=viewProjection\\*worldPos;": "//", // remove
            };
        }

        // ${this._material instanceof PBRMaterial ? "vNormal= grlNormal.xyz;vPositionW = vec3(grlFinalPosition);" : ""}

        if (shaderType === "fragment") {
            return {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                    varying float grlCounters;
                    varying float grlColorPointer;
                    uniform sampler2D grl_colors;
                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_MAIN_END: `
                    float grlColorMode = grl_colorMode_visibility_colorsWidth_useColors.x;
                    float grlVisibility = grl_colorMode_visibility_colorsWidth_useColors.y;
                    float grlColorsWidth = grl_colorMode_visibility_colorsWidth_useColors.z;
                    float grlUseColors = grl_colorMode_visibility_colorsWidth_useColors.w;

                    float grlUseDash = grl_dashOptions.x;
                    float grlDashArray = grl_dashOptions.y;
                    float grlDashOffset = grl_dashOptions.z;
                    float grlDashRatio = grl_dashOptions.w;

                    gl_FragColor.a *= step(grlCounters, grlVisibility);
                    if( gl_FragColor.a == 0. ) discard;

                    if(grlUseDash == 1.){
                        gl_FragColor.a *= ceil(mod(grlCounters + grlDashOffset, grlDashArray) - (grlDashArray * grlDashRatio));
                        if (gl_FragColor.a == 0.) discard;
                    }

                    #ifdef GREASED_LINE_HAS_COLOR
                        if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                            gl_FragColor.rgb = grl_singleColor;
                        } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                            gl_FragColor.rgb += grl_singleColor;
                        } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                            gl_FragColor.rgb *= grl_singleColor;
                        }
                    #else
                        if (grlUseColors == 1.) {
                            vec4 grlColor = texture2D(grl_colors, vec2(grlColorPointer/grlColorsWidth, 0.), 0.);
                            if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                                gl_FragColor = grlColor;
                            } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                                gl_FragColor += grlColor;
                            } else if (grlColorMode == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                                gl_FragColor *= grlColor;
                            }
                        }
                    #endif
                `,
            };
        }

        return null;
    }

    /**
     * Converts boolean to number.
     * @param bool
     * @returns 1 if true, 0 if false.
     */
    private static _BooleanToNumber(bool?: boolean) {
        return bool ? 1 : 0;
    }

    /**
     * Converts an array of Color3 to Uint8Array
     * @param colors Arrray of Color3
     * @returns Uin8Array of colors [r, g, b, a, r, g, b, a, ...]
     */
    private static _Color3toRGBAUint8(colors: Color3[]) {
        const colorTable: Uint8Array = new Uint8Array(colors.length * 4);
        for (let i = 0, j = 0; i < colors.length; i++) {
            colorTable[j++] = colors[i].r * 255;
            colorTable[j++] = colors[i].g * 255;
            colorTable[j++] = colors[i].b * 255;
            colorTable[j++] = 255;
        }

        return colorTable;
    }

    /**
     * Creates a RawTexture from an RGBA color array and sets it on the plugin material instance.
     * @param name name of the texture
     * @param colors Uint8Array of colors
     */
    private _createColorsTexture(name: string, colors: Color3[]) {
        const colorsArray = GreasedLinePluginMaterial._Color3toRGBAUint8(colors);
        this._colorsTexture = new RawTexture(colorsArray, colors.length, 1, Engine.TEXTUREFORMAT_RGBA, this._scene, false, true, this._options.colorsSampling ?? RawTexture.NEAREST_NEAREST);
        this._colorsTexture.name = name;
    }

    /**
     * Disposes the plugin material.
     */
    public dispose(): void {
        this._colorsTexture?.dispose();
        super.dispose();
    }

    /**
     * Sets whether to use the colors option to colorize the line.
     * @param value true if use the colors, otherwise false
     */
    public setUseColors(value: boolean) {
        this._options.useColors = value;
    }

    /**
     * Creates or updates the colors texture
     * @param colors color table RGBA
     * @param lazy if lazy, the colors are not updated
     * @param forceUpdate force creation of a new texture
     * @returns
     */
    public setColors(colors: Nullable<Color3[]>, lazy = false, forceUpdate = false): void {
        if (colors === null || colors.length === 0) {
            this._colorsTexture?.dispose();
            return;
        }

        const origColorsCount = this._options.colors?.length ?? 0;

        this._options.colors = colors;

        if (lazy && !forceUpdate) {
            return;
        }

        if (this._colorsTexture && origColorsCount === colors.length && !forceUpdate) {
            const colorArray = GreasedLinePluginMaterial._Color3toRGBAUint8(colors);
            this._colorsTexture.update(colorArray);
        } else {
            this._colorsTexture?.dispose();
            this._createColorsTexture(`${this._material.name}-colors-texture`, colors);
        }
    }

    /**
     * Updates the material. Use when material created in lazy mode.
     */
    public updateLazy() {
        if (this._options.colors) {
            this.setColors(this._options.colors, false, true);
        }
    }

    /**
     * Gets the plugin material options
     * @returns the plugin material options @see GreasedLineMaterialOptions
     */
    public getOptions(): GreasedLineMaterialOptions {
        return this._options;
    }

    /**
     * Sets the line length visibility.
     * 0 - 0% of the line will be visible
     * 1 - 100% of the line will be visible
     * @param value
     */
    public setVisibility(value: number) {
        this._options.visibility = value;
    }

    /**
     * Turns on/off dashmode
     * @param value
     */
    public setUseDash(value: boolean) {
        this._options.useDash = value;
    }

    /**
     * Sets the dash array.
     * @param value dash array
     */
    public setDashArray(value: number) {
        this._options.dashArray = value;
        this._dashArray = 1 / (value * 2);
    }

    /**
     * Sets the dash ratio
     * @param value dash length ratio 0..1 (0.5 = half empty, half drawn)
     */
    public setDashRatio(value: number) {
        this._options.dashRatio = value;
    }

    /**
     * Sets the dash offset
     * @param value the dashes will be offset by this value
     */
    public setDashOffset(value: number) {
        this._options.dashOffset = value;
    }

    /**
     * Sets line base width. At each point the line width is calculated by widths[pointIndex] * width
     * @param value base width
     */
    public setWidth(value: number) {
        this._options.width = value;
    }

    /**
     * Turn on/off attenuation of the width option and widths array.
     * @param value false means 1 unit in width = 1 unit on scene, true means 1 unit in width is reduced on the screen to make better looking lines
     */
    public setSizeAttenuation(value: boolean) {
        this._options.sizeAttenuation = value;
        this.markAllDefinesAsDirty();
    }

    /**
     * Sets the color of the line. If set the whole line will be mixed with this color according to the colorMode option.
     * @param value color
     */
    public setColor(value: Color3 | undefined) {
        if ((this._options.color === undefined && value !== undefined) || (this._options.color !== undefined && value === undefined)) {
            this._options.color = value;
            this.markAllDefinesAsDirty();
        } else {
            this._options.color = value;
        }
    }

    /**
     * Sets the mixing mode of the color paramater. Default value is GreasedLineMeshColorMode.SET
     * @see GreasedLineMeshColorMode
     * @param value color mode
     */
    public setColorMode(value: GreasedLineMeshColorMode) {
        this._options.colorMode = value;
    }

    /**
     * Clones the plugin material.
     * @param name New name for the cloned plugin material.
     * @returns The cloned plugin material.
     */
    public clone(name: string = `${this.name}-cloned`) {
        const materialOptions = {};
        DeepCopier.DeepCopy(this.getOptions(), materialOptions);

        const material =
            (<GreasedLineMaterialOptions>materialOptions).materialType === GreasedLineMeshMaterialType.MATERIAL_TYPE_PBR
                ? new PBRMaterial(name, this._scene)
                : new StandardMaterial(name, this._scene);
        const pluginMaterial = new GreasedLinePluginMaterial(material, this._scene, materialOptions);
        return pluginMaterial;
    }

    /**
     * Serializes this plugin material
     * @returns serializationObjec
     */
    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.materialOptions = this._options;
        return serializationObject;
    }

    // public parse(source: any, scene: Scene, rootUrl: string): void {
    //     // const materialOptions = <GreasedLineMaterialOptions>source.materialOptions;
    // }

    /**
     * WebGPU
     * A minimum size texture for the colors sampler2D.
     * WebGPU requires a bound texture if the sampler is defined in the shader.
     * For fast switching using the useColors property without the need to use defines.
     * @param scene Scene
     */
    private static _PrepareEmptyColorsTexture(scene: Scene) {
        if (!this._EmptyColorsTexture) {
            const colorsArray = new Uint8Array(4);
            this._EmptyColorsTexture = new RawTexture(colorsArray, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false, false, RawTexture.NEAREST_NEAREST);
            this._EmptyColorsTexture.name = "grlEmptyColorsWebGPUTexture";
        }
    }
}
