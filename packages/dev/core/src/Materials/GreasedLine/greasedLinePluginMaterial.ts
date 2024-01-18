import type { Engine } from "../../Engines/engine";
import { RawTexture } from "../Textures/rawTexture";
import { MaterialPluginBase } from "../materialPluginBase";
import type { Scene } from "../../scene";
import type { UniformBuffer } from "../uniformBuffer";
import { Vector2, TmpVectors } from "../../Maths/math.vector";
import type { Color3 } from "../../Maths/math.color";
import type { Nullable } from "../../types";
import type { Material } from "../material";
import { MaterialDefines } from "../materialDefines";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { BaseTexture } from "../Textures/baseTexture";
import { RegisterClass } from "../../Misc/typeStore";
import type { GreasedLineMaterialOptions, IGreasedLineMaterial } from "./greasedLineMaterialInterfaces";
import { GreasedLineMeshColorDistributionType, GreasedLineMeshColorMode } from "./greasedLineMaterialInterfaces";
import { GreasedLineMaterialDefaults } from "./greasedLineMaterialDefaults";
import { GreasedLineTools } from "../../Misc/greasedLineTools";

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
    /**
     * True if scene is in right handed coordinate system.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM = false;

    /**
     * True if the line is in camera facing mode
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GREASED_LINE_CAMERA_FACING = true;
}

/**
 * GreasedLinePluginMaterial for GreasedLineMesh/GreasedLineRibbonMesh.
 * Use the GreasedLineBuilder.CreateGreasedLineMaterial function to create and instance of this class.
 */
export class GreasedLinePluginMaterial extends MaterialPluginBase implements IGreasedLineMaterial {
    /**
     * Plugin name
     */
    public static readonly GREASED_LINE_MATERIAL_NAME = "GreasedLinePluginMaterial";

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

    /**
     * You can provide a colorsTexture to use instead of one generated from the 'colors' option
     */
    public colorsTexture: Nullable<RawTexture> = null;

    private _scene: Scene;
    private _dashCount: number;
    private _dashArray: number;
    private _color: Nullable<Color3>;
    private _colors: Nullable<Color3[]>;
    private _colorsDistributionType: GreasedLineMeshColorDistributionType;
    private _resolution: Vector2;
    private _aspect: number;
    private _sizeAttenuation: boolean;

    private _cameraFacing: boolean;

    private _engine: Engine;

    /**
     * Creates a new instance of the GreasedLinePluginMaterial
     * @param material base material for the plugin
     * @param scene the scene
     * @param options plugin options
     */
    constructor(material: Material, scene?: Scene, options?: GreasedLineMaterialOptions) {
        options = options || {
            color: GreasedLineMaterialDefaults.DEFAULT_COLOR,
        };

        const defines = new MaterialGreasedLineDefines();
        defines.GREASED_LINE_HAS_COLOR = !!options.color && !options.useColors;
        defines.GREASED_LINE_SIZE_ATTENUATION = options.sizeAttenuation ?? false;
        defines.GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE = options.colorDistributionType === GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_LINE;
        defines.GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM = (scene ?? material.getScene()).useRightHandedSystem;
        defines.GREASED_LINE_CAMERA_FACING = options.cameraFacing ?? true;
        super(material, GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME, 200, defines);

        this._scene = scene ?? material.getScene();
        this._engine = this._scene.getEngine();

        this._cameraFacing = options.cameraFacing ?? true;

        this.visibility = options.visibility ?? 1;
        this.useDash = options.useDash ?? false;
        this.dashRatio = options.dashRatio ?? 0.5;
        this.dashOffset = options.dashOffset ?? 0;
        this.width = options.width ? options.width : options.sizeAttenuation ? GreasedLineMaterialDefaults.DEFAULT_WIDTH_ATTENUATED : GreasedLineMaterialDefaults.DEFAULT_WIDTH;
        this._sizeAttenuation = options.sizeAttenuation ?? false;
        this.colorMode = options.colorMode ?? GreasedLineMeshColorMode.COLOR_MODE_SET;
        this._color = options.color ?? null;
        this.useColors = options.useColors ?? false;
        this._colorsDistributionType = options.colorDistributionType ?? GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT;
        this.colorsSampling = options.colorsSampling ?? RawTexture.NEAREST_NEAREST;
        this._colors = options.colors ?? null;

        this.dashCount = options.dashCount ?? 1; // calculate the _dashArray value, call the setter
        this.resolution = options.resolution ?? new Vector2(this._engine.getRenderWidth(), this._engine.getRenderHeight()); // calculate aspect call the setter

        if (options.colorsTexture) {
            this.colorsTexture = options.colorsTexture; // colorsTexture from options takes precedence
        } else {
            if (this._colors) {
                this.colorsTexture = GreasedLineTools.CreateColorsTexture(`${material.name}-colors-texture`, this._colors, this.colorsSampling, this._scene);
            } else {
                this._color = this._color ?? GreasedLineMaterialDefaults.DEFAULT_COLOR;
                GreasedLineTools.PrepareEmptyColorsTexture(this._scene);
            }
        }

        this._engine.onDisposeObservable.add(() => {
            GreasedLineTools.DisposeEmptyColorsTexture();
        });

        this._enable(true); // always enabled
    }

    /**
     * Get the shader attributes
     * @param attributes array which will be filled with the attributes
     */
    getAttributes(attributes: string[]) {
        attributes.push("grl_offsets");
        attributes.push("grl_widths");
        attributes.push("grl_colorPointers");
        attributes.push("grl_counters");
        if (this._cameraFacing) {
            attributes.push("grl_previousAndSide");
            attributes.push("grl_nextAndCounters");
        } else {
            attributes.push("grl_slopes");
        }
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
     * @param activeTextures array which will be filled with the textures
     */
    public getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this.colorsTexture) {
            activeTextures.push(this.colorsTexture);
        }
    }

    /**
     * Get the shader uniforms
     * @returns uniforms
     */
    getUniforms() {
        const ubo = [
            { name: "grl_singleColor", size: 3, type: "vec3" },
            { name: "grl_dashOptions", size: 4, type: "vec4" },
            { name: "grl_colorMode_visibility_colorsWidth_useColors", size: 4, type: "vec4" },
        ];
        if (this._cameraFacing) {
            ubo.push({ name: "grl_projection", size: 16, type: "mat4" }, { name: "grl_aspect_resolution_lineWidth", size: 4, type: "vec4" });
        }

        return {
            ubo,
            vertex: this._cameraFacing
                ? `
                uniform vec4 grl_aspect_resolution_lineWidth;
                uniform mat4 grl_projection;
                `
                : "",
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
        if (this._cameraFacing) {
            const activeCamera = this._scene.activeCamera;

            if (activeCamera) {
                const projection = activeCamera.getProjectionMatrix();
                uniformBuffer.updateMatrix("grl_projection", projection);
            } else {
                throw Error("GreasedLinePluginMaterial requires an active camera.");
            }

            const resolutionLineWidth = TmpVectors.Vector4[0];
            resolutionLineWidth.x = this._aspect;
            resolutionLineWidth.y = this._resolution.x;
            resolutionLineWidth.z = this._resolution.y;
            resolutionLineWidth.w = this.width;
            uniformBuffer.updateVector4("grl_aspect_resolution_lineWidth", resolutionLineWidth);
        }

        const dashOptions = TmpVectors.Vector4[0];
        dashOptions.x = GreasedLineTools.BooleanToNumber(this.useDash);
        dashOptions.y = this._dashArray;
        dashOptions.z = this.dashOffset;
        dashOptions.w = this.dashRatio;
        uniformBuffer.updateVector4("grl_dashOptions", dashOptions);

        const colorModeVisibilityColorsWidthUseColors = TmpVectors.Vector4[1];
        colorModeVisibilityColorsWidthUseColors.x = this.colorMode;
        colorModeVisibilityColorsWidthUseColors.y = this.visibility;
        colorModeVisibilityColorsWidthUseColors.z = this.colorsTexture ? this.colorsTexture.getSize().width : 0;
        colorModeVisibilityColorsWidthUseColors.w = GreasedLineTools.BooleanToNumber(this.useColors);
        uniformBuffer.updateVector4("grl_colorMode_visibility_colorsWidth_useColors", colorModeVisibilityColorsWidthUseColors);

        if (this._color) {
            uniformBuffer.updateColor3("grl_singleColor", this._color);
        }

        uniformBuffer.setTexture("grl_colors", this.colorsTexture ?? GreasedLineMaterialDefaults.EmptyColorsTexture);
    }

    /**
     * Prepare the defines
     * @param defines
     * @param _scene
     * @param _mesh
     */
    prepareDefines(defines: MaterialGreasedLineDefines, _scene: Scene, _mesh: AbstractMesh) {
        defines.GREASED_LINE_HAS_COLOR = !!this.color && !this.useColors;
        defines.GREASED_LINE_SIZE_ATTENUATION = this._sizeAttenuation;
        defines.GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE = this._colorsDistributionType === GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_LINE;
        defines.GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM = _scene.useRightHandedSystem;
        defines.GREASED_LINE_CAMERA_FACING = this._cameraFacing;
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
            const obj: any = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
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
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_VERTEX_UPDATE_POSITION: `
                #ifdef GREASED_LINE_CAMERA_FACING
                    vec3 grlPositionOffset = grl_offsets;
                    positionUpdated += grlPositionOffset;
                #else
                    positionUpdated = (positionUpdated + grl_offsets) + (grl_slopes * grl_widths);
                #endif
                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_VERTEX_MAIN_END: `
                grlColorPointer = grl_colorPointers;

                #ifdef GREASED_LINE_CAMERA_FACING

                    float grlAspect = grl_aspect_resolution_lineWidth.x;
                    float grlBaseWidth = grl_aspect_resolution_lineWidth.w;


                    vec3 grlPrevious = grl_previousAndSide.xyz;
                    float grlSide = grl_previousAndSide.w;

                    vec3 grlNext = grl_nextAndCounters.xyz;
                    grlCounters = grl_nextAndCounters.w;

                    mat4 grlMatrix = viewProjection * finalWorld;
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
                    #ifdef GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM
                        grlNormal.xy *= -.5 * grlWidth;
                    #else
                        grlNormal.xy *= .5 * grlWidth;
                    #endif

                    grlNormal *= grl_projection;

                    #ifdef GREASED_LINE_SIZE_ATTENUATION
                        grlNormal.xy *= grlFinalPosition.w;
                        grlNormal.xy /= ( vec4( grl_aspect_resolution_lineWidth.yz, 0., 1. ) * grl_projection ).xy;
                    #endif

                    grlFinalPosition.xy += grlNormal.xy * grlSide;
                    gl_Position = grlFinalPosition;

                    vPositionW = vec3(grlFinalPosition);
                #else
                    grlCounters = grl_counters;
                #endif
                `,
            };
            this._cameraFacing && (obj["!gl_Position\\=viewProjection\\*worldPos;"] = "//"); // not needed for camera facing GRL
            return obj;
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
     * Disposes the plugin material.
     */
    public dispose(): void {
        this.colorsTexture?.dispose();
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
     * @param forceNewTexture force creation of a new texture
     */
    public setColors(colors: Nullable<Color3[]>, lazy = false, forceNewTexture = false): void {
        const origColorsCount = this._colors?.length ?? 0;

        this._colors = colors;

        if (colors === null || colors.length === 0) {
            this.colorsTexture?.dispose();
            return;
        }

        if (lazy && !forceNewTexture) {
            return;
        }

        if (this.colorsTexture && origColorsCount === colors.length && !forceNewTexture) {
            const colorArray = GreasedLineTools.Color3toRGBAUint8(colors);
            this.colorsTexture.update(colorArray);
        } else {
            this.colorsTexture?.dispose();
            this.colorsTexture = GreasedLineTools.CreateColorsTexture(`${this._material.name}-colors-texture`, colors, this.colorsSampling, this._scene);
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
     * If set to true the line will be rendered always with the same width regardless how far it is located from the camera.
     * Not supported for non camera facing lines.
     */
    get sizeAttenuation() {
        return this._sizeAttenuation;
    }

    /**
     * Turn on/off size attenuation of the width option and widths array.
     * Not supported for non camera facing lines.
     * @param value If set to true the line will be rendered always with the same width regardless how far it is located from the camera.
     */
    set sizeAttenuation(value: boolean) {
        this._sizeAttenuation = value;
        this.markAllDefinesAsDirty();
    }

    /**
     * Gets the color of the line
     */
    get color() {
        return this._color;
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
     * @param doNotMarkDirty if true, the material will not be marked as dirty
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

        this.colorsTexture?.dispose();

        greasedLineMaterialOptions.color && this.setColor(greasedLineMaterialOptions.color, true);
        greasedLineMaterialOptions.colorDistributionType && (this.colorsDistributionType = greasedLineMaterialOptions.colorDistributionType);
        greasedLineMaterialOptions.colors && (this.colors = greasedLineMaterialOptions.colors);
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

        if (this.colors) {
            this.colorsTexture = GreasedLineTools.CreateColorsTexture(`${this._material.name}-colors-texture`, this.colors, this.colorsSampling, scene);
        } else {
            GreasedLineTools.PrepareEmptyColorsTexture(scene);
        }

        this.markAllDefinesAsDirty();
    }

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param plugin define the config where to copy the info
     */
    public copyTo(plugin: MaterialPluginBase): void {
        const dest = plugin as GreasedLinePluginMaterial;

        dest.colorsTexture?.dispose();

        if (this._colors) {
            dest.colorsTexture = GreasedLineTools.CreateColorsTexture(`${dest._material.name}-colors-texture`, this._colors, dest.colorsSampling, this._scene);
        }

        dest.setColor(this.color, true);
        dest.colorsDistributionType = this.colorsDistributionType;
        dest.colorsSampling = this.colorsSampling;
        dest.colorMode = this.colorMode;
        dest.useColors = this.useColors;
        dest.visibility = this.visibility;
        dest.useDash = this.useDash;
        dest.dashCount = this.dashCount;
        dest.dashRatio = this.dashRatio;
        dest.dashOffset = this.dashOffset;
        dest.width = this.width;
        dest.sizeAttenuation = this.sizeAttenuation;
        dest.resolution = this.resolution;

        dest.markAllDefinesAsDirty();
    }
}

RegisterClass(`BABYLON.${GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME}`, GreasedLinePluginMaterial);
