import { Engine } from "../Engines/engine";
import { RawTexture } from "./Textures/rawTexture";
import { MaterialPluginBase } from "./materialPluginBase";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import { Vector2, TmpVectors } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import type { Nullable } from "../types";
import type { Material } from "./material";
import { MaterialDefines } from "./materialDefines";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { BaseTexture } from "./Textures/baseTexture";
import { RegisterClass } from "../Misc/typeStore";

/**
 * Material types for GreasedLine
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#materialtype}
 */
export enum GreasedLineMeshMaterialType {
    /**
     * StandardMaterial
     */
    MATERIAL_TYPE_STANDARD = 0,
    /**
     * PBR Material
     */
    MATERIAL_TYPE_PBR = 1,
}

/**
 * Color blending mode of the @see GreasedLineMaterial and the base material
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#colormode}
 */
export enum GreasedLineMeshColorMode {
    /**
     * Color blending mode SET
     */
    COLOR_MODE_SET = 0,
    /**
     * Color blending mode ADD
     */
    COLOR_MODE_ADD = 1,
    /**
     * Color blending mode ADD
     */
    COLOR_MODE_MULTIPLY = 2,
}

/**
 * Color distribution type of the @see colors.
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#colordistributiontype}
 *
 */
export enum GreasedLineMeshColorDistributionType {
    /**
     * Colors distributed between segments of the line
     */
    COLOR_DISTRIBUTION_TYPE_SEGMENT = 0,
    /**
     * Colors distributed along the line ingoring the segments
     */
    COLOR_DISTRIBUTION_TYPE_LINE = 1,
}

/**
 * Options for GreasedLineMaterial
 */
export interface GreasedLineMaterialOptions {
    /**
     * Line width. If sizeAttenuation os false scene units will be used for width.
     * Defaults to 0.1 if @see sizeAttenuation is false, or to 1 if it's true.
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
     * Color mode of the line. Applies to all line segments.
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
     * The method used to distribute the colors along the line.
     * You can use segment distribution when each segment will use on color from the color table.
     * Or you can use line distribution when the colors are distributed evenly along the line ignoring the segments.
     */
    colorDistributionType?: GreasedLineMeshColorDistributionType;
    /**
     * If true, dashing is used.
     * Defaults to false.
     */
    useDash?: boolean;
    /**
     * @see GreasedLinePluginMaterial.setDashCount
     * Number of dashes in the line.
     * Defaults to 1.
     */
    dashCount?: number;
    /**
     * Offset of the dashes along the line. 0 to 1.
     * Defaults to 0.
     * @see GreasedLinePluginMaterial.setDashOffset
     */
    dashOffset?: number;
    /**
     * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
     * Defaults to 0.5.
     * @see GreasedLinePluginMaterial.setDashRatio
     */
    dashRatio?: number;
    /**
     * Sets the line length visibility.
     * 0 - 0% of the line will be visible.
     * 1 - 100% of the line will be visible.
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
    /**
     * The type of color distribution is set to line this value equals to true.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE = false;
}

/**
 * GreasedLinePluginMaterial for GreasedLineMesh
 */
export class GreasedLinePluginMaterial extends MaterialPluginBase {
    /**
     * Plugin name
     */
    public static readonly GREASED_LINE_MATERIAL_NAME = "GreasedLinePluginMaterial";

    /**
     * Default line color for newly created lines
     */
    public static DEFAULT_COLOR = Color3.White();
    /**
     * Default line width when sizeAttenuation is true
     */
    public static DEFAULT_WIDTH_ATTENUATED = 1;
    /**
     * Defaule line width
     */
    public static DEFAULT_WIDTH = 0.1;

    private static _EmptyColorsTexture: BaseTexture;

    /**
     * Whether to use the colors option to colorize the line
     */
    public useColors: boolean;

    /**
     * Normalized value of how much of the line will be visible
     * 0 - 0% of the line will be visible
     * 1 - 100% of the line will be visible
     */
    public visibility: number;

    /**
     * Dash offset
     */
    public dashOffset: number;

    /**
     * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
     */
    public dashRatio: number;

    /**
     * Line base width. At each point the line width is calculated by widths[pointIndex] * width
     */
    public width: number;

    /**
     * The type of sampling of the colors texture. The values are the same when using with textures.
     */
    public colorsSampling: number;

    /**
     * Turns on/off dash mode
     */
    public useDash: boolean;

    /**
     * The mixing mode of the color paramater. Default value is GreasedLineMeshColorMode.SET
     * @see GreasedLineMeshColorMode
     */
    public colorMode: GreasedLineMeshColorMode;

    private _dashCount: number;
    private _dashArray: number;
    private _color: Nullable<Color3>;
    private _colors: Nullable<Color3[]>;
    private _colorsDistributionType: GreasedLineMeshColorDistributionType;
    private _resolution: Vector2;
    private _aspect: number;
    private _sizeAttenuation: boolean;

    private _colorsTexture?: RawTexture;

    private _engine: Engine;

    constructor(material: Material, private _scene: Scene, options?: GreasedLineMaterialOptions) {
        options = options || {
            color: GreasedLinePluginMaterial.DEFAULT_COLOR,
        };

        const defines = new MaterialGreasedLineDefines();
        defines.GREASED_LINE_HAS_COLOR = !!options.color;
        defines.GREASED_LINE_SIZE_ATTENUATION = options.sizeAttenuation ?? false;
        defines.GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE = options.colorDistributionType === GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_LINE;
        super(material, GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME, 200, defines);

        this._scene = this._scene ?? material.getScene();
        this._engine = this._scene.getEngine();

        this.visibility = options.visibility ?? 1;
        this.useDash = options.useDash ?? false;
        this.dashRatio = options.dashRatio ?? 0.5;
        this.dashOffset = options.dashOffset ?? 0;
        this.width = options.width ? options.width : options.sizeAttenuation ? GreasedLinePluginMaterial.DEFAULT_WIDTH_ATTENUATED : GreasedLinePluginMaterial.DEFAULT_WIDTH;
        this._sizeAttenuation = options.sizeAttenuation ?? false;
        this.colorMode = options.colorMode ?? GreasedLineMeshColorMode.COLOR_MODE_SET;
        this._color = options.color ?? null;
        this.useColors = options.useColors ?? false;
        this._colorsDistributionType = options.colorDistributionType ?? GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT;
        this.colorsSampling = options.colorsSampling ?? RawTexture.NEAREST_NEAREST;
        this._colors = options.colors ?? null;

        this.dashCount = options.dashCount ?? 1; // calculate the _dashArray value, call the setter
        this.resolution = options.resolution ?? new Vector2(this._engine.getRenderWidth(), this._engine.getRenderHeight()); // calculate aspect call the setter

        if (this._colors) {
            this._createColorsTexture(`${material.name}-colors-texture`, this._colors);
        } else {
            this._color = this._color ?? GreasedLinePluginMaterial.DEFAULT_COLOR;
            GreasedLinePluginMaterial._PrepareEmptyColorsTexture(_scene);
        }

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
            { name: "grl_aspect_resolution_lineWidth", size: 4, type: "vec4" },
            { name: "grl_dashOptions", size: 4, type: "vec4" },
            { name: "grl_colorMode_visibility_colorsWidth_useColors", size: 4, type: "vec4" },
        ];

        return {
            ubo,
            vertex: `
                uniform vec4 grl_aspect_resolution_lineWidth;
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

        const resolutionLineWidth = TmpVectors.Vector4[0];
        resolutionLineWidth.x = this._aspect;
        resolutionLineWidth.y = this._resolution.x
        resolutionLineWidth.z = this._resolution.y
        resolutionLineWidth.w = this.width;
        uniformBuffer.updateVector4("grl_aspect_resolution_lineWidth", resolutionLineWidth);

        const dashOptions = TmpVectors.Vector4[0];
        dashOptions.x = GreasedLinePluginMaterial._BooleanToNumber(this.useDash);
        dashOptions.y = this._dashArray;
        dashOptions.z = this.dashOffset;
        dashOptions.w = this.dashRatio;
        uniformBuffer.updateVector4("grl_dashOptions", dashOptions);

        const colorModeVisibilityColorsWidthUseColors = TmpVectors.Vector4[1];
        colorModeVisibilityColorsWidthUseColors.x = this.colorMode;
        colorModeVisibilityColorsWidthUseColors.y = this.visibility;
        colorModeVisibilityColorsWidthUseColors.z = this._colorsTexture ? this._colorsTexture.getSize().width : 0;
        colorModeVisibilityColorsWidthUseColors.w = GreasedLinePluginMaterial._BooleanToNumber(this.useColors);
        uniformBuffer.updateVector4("grl_colorMode_visibility_colorsWidth_useColors", colorModeVisibilityColorsWidthUseColors);

        if (this._color) {
            uniformBuffer.updateColor3("grl_singleColor", this._color);
        }

        uniformBuffer.setTexture("grl_colors", this._colorsTexture ?? GreasedLinePluginMaterial._EmptyColorsTexture);
    }

    /**
     * Prepare the defines
     * @param defines
     * @param _scene
     * @param _mesh
     */
    prepareDefines(defines: MaterialGreasedLineDefines, _scene: Scene, _mesh: AbstractMesh) {
        defines.GREASED_LINE_HAS_COLOR = !!this._color;
        defines.GREASED_LINE_SIZE_ATTENUATION = this._sizeAttenuation ?? false;
        defines.GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE = this._colorsDistributionType === GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_LINE;
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
     * @param shaderType vertex/fragment
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

                    float grlAspect = grl_aspect_resolution_lineWidth.x;
                    float grlBaseWidth = grl_aspect_resolution_lineWidth.w;

                    grlColorPointer = grl_colorPointers;

                    vec3 grlPrevious = grl_previousAndSide.xyz;
                    float grlSide = grl_previousAndSide.w;

                    vec3 grlNext = grl_nextAndCounters.xyz;
                    grlCounters = grl_nextAndCounters.w;


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
                        grlNormal.xy /= ( vec4( grl_aspect_resolution_lineWidth.yz, 0., 1. ) * grl_projection ).xy;
                    #endif
                    grlFinalPosition.xy += grlNormal.xy * grlSide;
                    gl_Position = grlFinalPosition;

                    vPositionW = vec3(grlFinalPosition);

                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "!gl_Position\\=viewProjection\\*worldPos;": "//", // remove
            };
        }

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
                            #ifdef GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE
                                vec4 grlColor = texture2D(grl_colors, vec2(grlCounters, 0.), 0.);
                            #else
                                vec4 grlColor = texture2D(grl_colors, vec2(grlColorPointer/grlColorsWidth, 0.), 0.);
                            #endif
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
        this._colorsTexture = new RawTexture(colorsArray, colors.length, 1, Engine.TEXTUREFORMAT_RGBA, this._scene, false, true, this.colorsSampling);
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
     * Returns the colors used to colorize the line
     */
    get colors() {
        return this._colors;
    }

    /**
     * Sets the colors used to colorize the line
     */
    set colors(value: Nullable<Color3[]>) {
        this.setColors(value);
    }

    /**
     * Creates or updates the colors texture
     * @param colors color table RGBA
     * @param lazy if lazy, the colors are not updated
     * @param forceUpdate force creation of a new texture
     * @returns
     */
    public setColors(colors: Nullable<Color3[]>, lazy = false, forceUpdate = false): void {
        const origColorsCount = this._colors?.length ?? 0;

        this._colors = colors;

        if (colors === null || colors.length === 0) {
            this._colorsTexture?.dispose();
            return;
        }

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
        if (this._colors) {
            this.setColors(this._colors, false, true);
        }
    }

    /**
     * Gets the number of dashes in the line
     */
    get dashCount() {
        return this._dashCount;
    }
    /**
     * Sets the number of dashes in the line
     * @param value dash
     */
    set dashCount(value: number) {
        this._dashCount = value;
        this._dashArray = 1 / value;
    }

    /**
     * False means 1 unit in width = 1 unit on scene, true means 1 unit in width is reduced on the screen to make better looking lines
     */
    get sizeAttenuation() {
        return this._sizeAttenuation;
    }

    /**
     * Turn on/off attenuation of the width option and widths array.
     * @param value false means 1 unit in width = 1 unit on scene, true means 1 unit in width is reduced on the screen to make better looking lines
     */
    set sizeAttenuation(value: boolean) {
        this._sizeAttenuation = value;
        this.markAllDefinesAsDirty();
    }

    /**
     * Gets the color of the line
     */
    get color() {
        return this.color;
    }

    /**
     * Sets the color of the line
     * @param value Color3 or null to clear the color. You need to clear the color if you use colors and useColors = true
     */
    set color(value: Nullable<Color3>) {
        this.setColor(value);
    }

    /**
     * Sets the color of the line. If set the whole line will be mixed with this color according to the colorMode option.
     * @param value color
     */
    public setColor(value: Nullable<Color3>, doNotMarkDirty = false) {
        if ((this._color === null && value !== null) || (this._color !== null && value === null)) {
            this._color = value;
            !doNotMarkDirty && this.markAllDefinesAsDirty();
        } else {
            this._color = value;
        }
    }

    /**
     * Gets the color distributiopn type
     */
    get colorsDistributionType() {
        return this._colorsDistributionType;
    }

    /**
     * Sets the color distribution type
     * @see GreasedLineMeshColorDistributionType
     * @param value color distribution type
     */
    set colorsDistributionType(value: GreasedLineMeshColorDistributionType) {
        this._colorsDistributionType = value;
        this.markAllDefinesAsDirty();
    }

    /**
     * Gets the resolution
     */
    get resolution() {
        return this._resolution;
    }

    /**
     * Sets the resolution
     * @param value resolution of the screen for GreasedLine
     */
    set resolution(value: Vector2) {
        this._aspect = value.x / value.y;
        this._resolution = value;
    }

    /**
     * Serializes this plugin material
     * @returns serializationObjec
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        const greasedLineMaterialOptions: GreasedLineMaterialOptions = {
            colorDistributionType: this._colorsDistributionType,
            colorsSampling: this.colorsSampling,
            colorMode: this.colorMode,
            dashCount: this._dashCount,
            dashOffset: this.dashOffset,
            dashRatio: this.dashRatio,
            resolution: this._resolution,
            sizeAttenuation: this._sizeAttenuation,
            useColors: this.useColors,
            useDash: this.useDash,
            visibility: this.visibility,
            width: this.width,
        };

        this._colors && (greasedLineMaterialOptions.colors = this._colors);
        this._color && (greasedLineMaterialOptions.color = this._color);

        serializationObject.greasedLineMaterialOptions = greasedLineMaterialOptions;

        return serializationObject;
    }

    /**
     * Parses a serialized objects
     * @param source serialized object
     * @param scene scene
     * @param rootUrl root url for textures
     */
    public parse(source: any, scene: Scene, rootUrl: string): void {
        super.parse(source, scene, rootUrl);
        const greasedLineMaterialOptions = <GreasedLineMaterialOptions>source.greasedLineMaterialOptions;

        this._colorsTexture?.dispose();

        if (greasedLineMaterialOptions.colors) {
            this._createColorsTexture(`${this._material.name}-colors-texture`, greasedLineMaterialOptions.colors);
        } else {
            GreasedLinePluginMaterial._PrepareEmptyColorsTexture(scene);
        }

        greasedLineMaterialOptions.color && this.setColor(greasedLineMaterialOptions.color, true);
        greasedLineMaterialOptions.colorDistributionType && (this.colorsDistributionType = greasedLineMaterialOptions.colorDistributionType);
        greasedLineMaterialOptions.colorsSampling && (this.colorsSampling = greasedLineMaterialOptions.colorsSampling);
        greasedLineMaterialOptions.colorMode && (this.colorMode = greasedLineMaterialOptions.colorMode);
        greasedLineMaterialOptions.useColors && (this.useColors = greasedLineMaterialOptions.useColors);
        greasedLineMaterialOptions.visibility && (this.visibility = greasedLineMaterialOptions.visibility);
        greasedLineMaterialOptions.useDash && (this.useDash = greasedLineMaterialOptions.useDash);
        greasedLineMaterialOptions.dashCount && (this.dashCount = greasedLineMaterialOptions.dashCount);
        greasedLineMaterialOptions.dashRatio && (this.dashRatio = greasedLineMaterialOptions.dashRatio);
        greasedLineMaterialOptions.dashOffset && (this.dashOffset = greasedLineMaterialOptions.dashOffset);
        greasedLineMaterialOptions.width && (this.width = greasedLineMaterialOptions.width);
        greasedLineMaterialOptions.sizeAttenuation && (this.sizeAttenuation = greasedLineMaterialOptions.sizeAttenuation);
        greasedLineMaterialOptions.resolution && (this.resolution = greasedLineMaterialOptions.resolution);

        this.markAllDefinesAsDirty();
    }

    /**
     * A minimum size texture for the colors sampler2D when there is no colors texture defined yet.
     * For fast switching using the useColors property without the need to use defines.
     * @param scene Scene
     */
    private static _PrepareEmptyColorsTexture(scene: Scene) {
        if (!this._EmptyColorsTexture) {
            const colorsArray = new Uint8Array(4);
            this._EmptyColorsTexture = new RawTexture(colorsArray, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false, false, RawTexture.NEAREST_NEAREST);
            this._EmptyColorsTexture.name = "grlEmptyColorsTexture";
        }
    }
}

RegisterClass(`BABYLON.${GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME}`, GreasedLinePluginMaterial);
