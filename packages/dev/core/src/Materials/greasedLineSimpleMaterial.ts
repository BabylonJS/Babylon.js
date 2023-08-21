import type { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { RawTexture } from "./Textures/rawTexture";
import type { GreasedLineMaterialOptions, IGreasedLineMaterial } from "./greasedLinePluginMaterial";
import { GreasedLineMeshColorMode, GreasedLineMeshColorDistributionType } from "./greasedLinePluginMaterial";

import { ShaderMaterial } from "./shaderMaterial";
import type { Nullable } from "../types";
import { Color3 } from "../Maths/math.color";
import { Vector2 } from "../Maths/math.vector";
import type { BaseTexture } from "./Textures/baseTexture";

import "../Shaders/greasedLine.fragment";
import "../Shaders/greasedLine.vertex";

/**
 * GreasedLineSimpleMaterial
 */
export class GreasedLineSimpleMaterial extends ShaderMaterial implements IGreasedLineMaterial {
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

    private _visibility: number;
    private _width: number;
    private _useDash: boolean;
    private _dashCount: number;
    private _dashArray: number;
    private _dashRatio: number;
    private _dashOffset: number;
    private _useColors: boolean;
    private _color: Color3 = Color3.White();
    private _colors: Nullable<Color3[]>;
    private _colorsDistributionType: GreasedLineMeshColorDistributionType = GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT;
    private _colorMode: GreasedLineMeshColorMode;
    private _colorsSampling: number;
    private _resolution: Vector2;
    private _sizeAttenuation: boolean;
    private _colorsTexture?: RawTexture;
    private _engine: Engine;

    /**
     * GreasedLineSimple material constructor
     * @param name material name
     * @param scene the scene
     * @param options material options
     */
    constructor(name: string, scene: Scene, options: GreasedLineMaterialOptions) {
        const defines = [
            `COLOR_DISTRIBUTION_TYPE_LINE ${GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_LINE}.`,
            `COLOR_DISTRIBUTION_TYPE_SEGMENT ${GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT}.`,
            `COLOR_MODE_SET ${GreasedLineMeshColorMode.COLOR_MODE_SET}.`,
            `COLOR_MODE_ADD ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.`,
            `COLOR_MODE_MULTIPLY ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.`,
        ];
        const attributes = ["position", "grl_widths", "grl_offsets", "grl_colorPointers"];

        scene.useRightHandedSystem && defines.push("GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM");

        if (options.cameraFacing) {
            defines.push("GREASED_LINE_CAMERA_FACING");
            attributes.push("grl_previousAndSide", "grl_nextAndCounters");
        } else {
            attributes.push("grl_slopes");
            attributes.push("grl_counters");
        }

        super(
            name,
            scene,
            {
                vertex: "greasedLine",
                fragment: "greasedLine",
            },
            {
                attributes,
                uniforms: [
                    "worldViewProjection",
                    "projection",
                    "grlColorsWidth",
                    "grlUseColors",
                    "grlWidth",
                    "grlColor",
                    "grl_colorModeAndColorDistributionType",
                    "grlResolution",
                    "grlAspect",
                    "grlAizeAttenuation",
                    "grlDashArray",
                    "grlDashOffset",
                    "grlDashRatio",
                    "grlUseDash",
                    "grlVisibility",
                ],
                samplers: ["grlColors"],
                defines,
            }
        );
        options = options || {
            color: GreasedLineSimpleMaterial.DEFAULT_COLOR,
        };

        this._engine = scene.getEngine();
        this.visibility = options.visibility ?? 1;
        this.useDash = options.useDash ?? false;
        this.dashRatio = options.dashRatio ?? 0.5;
        this.dashOffset = options.dashOffset ?? 0;
        this.dashCount = options.dashCount ?? 1; // calculate the _dashArray value, call the setter
        this.width = options.width ? options.width : options.sizeAttenuation ? GreasedLineSimpleMaterial.DEFAULT_WIDTH_ATTENUATED : GreasedLineSimpleMaterial.DEFAULT_WIDTH;
        this.sizeAttenuation = options.sizeAttenuation ?? false;
        this.color = options.color ?? Color3.White();
        this.useColors = options.useColors ?? false;
        this.colorsDistributionType = options.colorDistributionType ?? GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT;
        this.colorsSampling = options.colorsSampling ?? RawTexture.NEAREST_NEAREST;
        this.colorMode = options.colorMode ?? GreasedLineMeshColorMode.COLOR_MODE_SET;
        this._colors = options.colors ?? null;

        this.resolution = options.resolution ?? new Vector2(this._engine.getRenderWidth(), this._engine.getRenderHeight()); // calculate aspect call the setter

        if (this._colors) {
            this.setColors(this._colors);
        }

        this._engine.onDisposeObservable.add(() => {
            GreasedLineSimpleMaterial._EmptyColorsTexture?.dispose();
        });
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
        const colorsArray = GreasedLineSimpleMaterial._Color3toRGBAUint8(colors);
        this._colorsTexture = new RawTexture(colorsArray, colors.length, 1, Engine.TEXTUREFORMAT_RGBA, this.getScene(), false, true, this._colorsSampling);
        this._colorsTexture.name = name;
    }

    /**
     * Disposes the plugin material.
     */
    public dispose(): void {
        this._colorsTexture?.dispose();
        super.dispose();
    }

    private _setColorModeAndColorDistributionType() {
        this.setVector2("grl_colorModeAndColorDistributionType", new Vector2(this._colorMode, this._colorsDistributionType));
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
     * @returns
     */
    public setColors(colors: Nullable<Color3[]>, lazy = false, forceNewTexture = false): void {
        const origColorsCount = this._colors?.length ?? 0;

        this._colors = colors;

        if (colors === null || colors.length === 0) {
            this._colorsTexture?.dispose();
            return;
        }

        if (lazy && !forceNewTexture) {
            return;
        }

        if (this._colorsTexture && origColorsCount === colors.length && !forceNewTexture) {
            const colorArray = GreasedLineSimpleMaterial._Color3toRGBAUint8(colors);
            this._colorsTexture.update(colorArray);
        } else {
            this._colorsTexture?.dispose();
            this._createColorsTexture(`${this.name}-colors-texture`, colors);
        }

        if (this._colorsTexture) {
            this.setFloat("grlColorsWidth", this._colorsTexture.getSize().width);
            this.setTexture("grlColors", this._colorsTexture);
        }
    }

    /**
     * Line base width. At each point the line width is calculated by widths[pointIndex] * width
     */
    get width() {
        return this._width;
    }

    /**
     * Line base width. At each point the line width is calculated by widths[pointIndex] * width
     */
    set width(value: number) {
        this._width = value;
        this.setFloat("grlWidth", value);
    }

    /**
     * Whether to use the colors option to colorize the line
     */
    get useColors() {
        return this._useColors;
    }

    set useColors(value: boolean) {
        this._useColors = value;
        this.setFloat("grlUseColors", GreasedLineSimpleMaterial._BooleanToNumber(value));
    }

    /**
     * The type of sampling of the colors texture. The values are the same when using with textures.
     */
    get colorsSampling() {
        return this._colorsSampling;
    }

    /**
     * The type of sampling of the colors texture. The values are the same when using with textures.
     */
    set colorsSampling(value: number) {
        this._colorsSampling = value;
    }

    /**
     * Normalized value of how much of the line will be visible
     * 0 - 0% of the line will be visible
     * 1 - 100% of the line will be visible
     */
    get visibility() {
        return this._visibility;
    }

    set visibility(value: number) {
        this._visibility = value;
        this.setFloat("grlVisibility", value);
    }

    /**
     * Turns on/off dash mode
     */
    get useDash() {
        return this._useDash;
    }

    /**
     * Turns on/off dash mode
     */
    set useDash(value: boolean) {
        this._useDash = value;
        this.setFloat("grlUseDash", GreasedLineSimpleMaterial._BooleanToNumber(value));
    }

    /**
     * Gets the dash offset
     */
    get dashOffset() {
        return this._dashOffset;
    }

    /**
     * Sets the dash offset
     */
    set dashOffset(value: number) {
        this._dashOffset = value;
        this.setFloat("grlDashOffset", value);
    }

    /**
     * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
     */
    get dashRatio() {
        return this._dashRatio;
    }

    /**
     * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
     */
    set dashRatio(value: number) {
        this._dashRatio = value;
        this.setFloat("grlDashRatio", value);
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
        this.setFloat("grlDashArray", this._dashArray);
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
        this.setFloat("grlSizeAttenuation", GreasedLineSimpleMaterial._BooleanToNumber(value));
    }

    /**
     * Gets the color of the line
     */
    get color() {
        return this.color;
    }

    /**
     * Sets the color of the line
     * @param value Color3
     */
    set color(value: Color3) {
        this.setColor(value);
    }

    /**
     * Sets the color of the line. If set the whole line will be mixed with this color according to the colorMode option.
     * The simple material always needs a color to be set. If you set it to null it will set the color to the default color (GreasedLineSimpleMaterial.DEFAULT_COLOR).
     * @param value color
     */
    public setColor(value: Nullable<Color3>) {
        value = value ?? GreasedLineSimpleMaterial.DEFAULT_COLOR;
        this._color = value;
        this.setColor3("grlColor", value);
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
        this._setColorModeAndColorDistributionType();
    }

    /**
     * Gets the mixing mode of the color and colors paramaters. Default value is GreasedLineMeshColorMode.SET.
     * MATERIAL_TYPE_SIMPLE mixes the color and colors of the greased line material.
     * @see GreasedLineMeshColorMode
     */
    get colorMode() {
        return this._colorMode;
    }

    /**
     * Sets the mixing mode of the color and colors paramaters. Default value is GreasedLineMeshColorMode.SET.
     * MATERIAL_TYPE_SIMPLE mixes the color and colors of the greased line material.
     * @see GreasedLineMeshColorMode
     */
    set colorMode(value: GreasedLineMeshColorMode) {
        this._colorMode = value;
        this._setColorModeAndColorDistributionType();
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
        this._resolution = value;
        this.setVector2("grlResolution", value);
        this.setFloat("grlAspect", value.x / value.y);
    }

    /**
     * Serializes this plugin material
     * @returns serializationObjec
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        const greasedLineMaterialOptions: GreasedLineMaterialOptions = {
            colorDistributionType: this._colorsDistributionType,
            colorsSampling: this._colorsSampling,
            colorMode: this._colorMode,
            color: this._color,
            dashCount: this._dashCount,
            dashOffset: this._dashOffset,
            dashRatio: this._dashRatio,
            resolution: this._resolution,
            sizeAttenuation: this._sizeAttenuation,
            useColors: this._useColors,
            useDash: this._useDash,
            visibility: this._visibility,
            width: this._width,
        };

        this._colors && (greasedLineMaterialOptions.colors = this._colors);

        serializationObject.greasedLineMaterialOptions = greasedLineMaterialOptions;

        return serializationObject;
    }

    /**
     * Parses a serialized objects
     * @param source serialized object
     * @param scene scene
     * @param _rootUrl root url for textures
     */
    public parse(source: any, scene: Scene, _rootUrl: string): void {
        // TODO: super.parse?
        const greasedLineMaterialOptions = <GreasedLineMaterialOptions>source.greasedLineMaterialOptions;

        this._colorsTexture?.dispose();

        if (greasedLineMaterialOptions.colors) {
            this._createColorsTexture(`${this.name}-colors-texture`, greasedLineMaterialOptions.colors);
        } else {
            GreasedLineSimpleMaterial._PrepareEmptyColorsTexture(scene);
        }

        greasedLineMaterialOptions.color && (this.color = greasedLineMaterialOptions.color);
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
    }

    /**
     * A minimum size texture for the colors sampler2D when there is no colors texture defined yet.
     * For fast switching using the useColors property without the need to use defines.
     * @param scene Scene
     */
    private static _PrepareEmptyColorsTexture(scene: Scene) {
        if (!this._EmptyColorsTexture) {
            const colorsArray = new Uint8Array(4);
            GreasedLineSimpleMaterial._EmptyColorsTexture = new RawTexture(colorsArray, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false, false, RawTexture.NEAREST_NEAREST);
            GreasedLineSimpleMaterial._EmptyColorsTexture.name = "grlEmptyColorsTexture";
        }
    }
}
