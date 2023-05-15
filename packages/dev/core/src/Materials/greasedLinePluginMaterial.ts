import { Engine } from "../Engines/engine";
import { RawTexture } from "./Textures/rawTexture";
import { MaterialPluginBase } from "./materialPluginBase";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import type { Vector2 } from "../Maths/math.vector";
import { TmpVectors } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import type { Nullable } from "../types";
import { serialize, serializeAsTexture } from "../Misc/decorators";
import type { Material } from "./material";
import { MaterialDefines } from "./materialDefines";
import type { AbstractMesh } from "core/Meshes/abstractMesh";

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
     * Use when @see instance is specified.
     * If true, the line will be rendered only after calling instance.updateLazy(). If false, line will be rerendered after every call to @see CreateGreasedLine
     * Defaults to false.
     */
    lazy?: boolean;
    // material related
    /**
     * Line width.
     * Default to 1.
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
     * Colors of the line segments. RGBA
     * Defaults to empty.
     */
    colors?: Uint8Array;
    /**
     * If true, @see colors are used, otherwise they're ignored.
     * Defaults to false.
     */
    useColors?: boolean;
    /**
     * If true, dashing is used.
     * Defaults to false.
     */
    useDash?: boolean;
    /**
     * @see GreasedLinePluginMaterial.setDashArray
     * Defaults to 0.
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

const GREASED_LINE_MATERIAL_NAME = "GreasedLine";

/**
 * @internal
 */
export class MaterialGreasedLineDefines extends MaterialDefines {
    GREASED_LINE_HAS_COLOR = false;
    GREASED_LINE_SIZE_ATTENUATION = false;
}

/**
 * GreasedLinePluginMaterial for GreasedLineMesh
 */
export class GreasedLinePluginMaterial extends MaterialPluginBase {
    @serializeAsTexture()
    private _colorsTexture?: RawTexture;

    @serialize()
    private _options: GreasedLineMaterialOptions;

    private _engine: Engine;

    constructor(
        material: Material,
        private _scene: Scene,

        options: GreasedLineMaterialOptions
    ) {
        const defines = new MaterialGreasedLineDefines();
        defines.GREASED_LINE_HAS_COLOR = !!options.color;
        defines.GREASED_LINE_SIZE_ATTENUATION = options.sizeAttenuation ?? false;

        super(material, GREASED_LINE_MATERIAL_NAME, 200, defines);

        this._engine = this._scene.getEngine();

        if (options.colors) {
            this._createColorsTexture(`${material.name}-colors-texture`, options.colors);
        }

        this._options = options;

        this._enable(true); // always enabled
    }

    getAttributes(attributes: string[]) {
        attributes.push("grl_offsets");
        attributes.push("grl_previousAndSide");
        attributes.push("grl_nextAndCounters");
        attributes.push("grl_widths");
    }

    getSamplers(samplers: string[]) {
        samplers.push("grl_colors");
    }

    getUniforms() {
        return {
            ubo: [
                { name: "grl_projection", size: 16, type: "mat4" },
                { name: "grl_singleColor", size: 3, type: "vec3" },
                { name: "grl_resolution_lineWidth", size: 3, type: "vec3" },
                { name: "grl_dashOptions", size: 4, type: "vec4" },
                { name: "grl_colorMode_visibility_colorsWidth_useColors", size: 4, type: "vec4" },
            ],
            vertex: `
      uniform vec3 grl_resolution_lineWidth;
      uniform mat4 grl_projection;
      `,
            fragment: `
      uniform vec4 grl_dashOptions;
      uniform vec4 grl_colorMode_visibility_colorsWidth_useColors;

      uniform sampler2D grl_colors;
      uniform vec3 grl_singleColor;
      `,
        };
    }

    // only getter, it doesn't make sense to use this plugin on a mesh other than GreasedLineMesh
    // and it doesn't make sense to disable it on the mesh
    get isEnabled() {
        return true;
    }

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
        dashOptions.y = this._options.dashArray ?? 0;
        dashOptions.z = this._options.dashOffset ?? 0;
        dashOptions.w = this._options.dashRatio ?? 0.5;
        uniformBuffer.updateVector4("grl_dashOptions", dashOptions);

        const colorModeVisibilityColorsWidthUseColors = TmpVectors.Vector4[1];
        colorModeVisibilityColorsWidthUseColors.x = this._options.colorMode ?? GreasedLineMeshColorMode.COLOR_MODE_SET;
        colorModeVisibilityColorsWidthUseColors.y = this._options.visibility ?? 1;
        colorModeVisibilityColorsWidthUseColors.z = this._colorsTexture ? this._colorsTexture.getSize().width * 2 : 0;
        colorModeVisibilityColorsWidthUseColors.w = GreasedLinePluginMaterial._BooleanToNumber(this._options.useColors);
        uniformBuffer.updateVector4("grl_colorMode_visibility_colorsWidth_useColors", colorModeVisibilityColorsWidthUseColors);

        if (this._options.color) {
            uniformBuffer.updateColor3("grl_singleColor", this._options.color ?? Color3.White());
        }

        if (this._colorsTexture) {
            uniformBuffer.setTexture("grl_colors", this._colorsTexture);
        }

        uniformBuffer.update();
    }

    prepareDefines(defines: MaterialGreasedLineDefines, _scene: Scene, _mesh: AbstractMesh) {
        const options = this._options;
        defines["GREASED_LINE_HAS_COLOR"] = !!options.color;
        defines["GREASED_LINE_SIZE_ATTENUATION"] = options.sizeAttenuation ?? false;
    }

    getClassName() {
        return GREASED_LINE_MATERIAL_NAME;
    }

    getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_VERTEX_DEFINITIONS: `
                    attribute vec4 grl_previousAndSide;
                    attribute vec4 grl_nextAndCounters;
                    attribute float grl_widths;
                    attribute vec3 grl_offsets;

                    varying vec3 vNormal;
                    varying vec4 vColor;
                    varying float vCounters;
                    flat out int vColorPointers;

                    vec2 fix( vec4 i, float aspect ) {
                        vec2 res = i.xy / i.w;
                        res.x *= aspect;
                        return res;
                    }
                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_VERTEX_UPDATE_POSITION: `
                    vec3 positionOffset = grl_offsets;
                    positionUpdated += positionOffset;
                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_VERTEX_MAIN_END: `
                    vColorPointers = gl_VertexID;
                    vCounters = grl_nextAndCounters.w;

                    float aspect = grl_resolution_lineWidth.x / grl_resolution_lineWidth.y;

                    mat4 m = viewProjection * world;
                    vec4 finalPosition = m * vec4( positionUpdated , 1.0 );
                    vec4 prevPos = m * vec4( grl_previousAndSide.xyz, 1.0 );
                    vec4 nextPos = m * vec4( grl_nextAndCounters.xyz, 1.0 );

                    vec2 currentP = fix( finalPosition, aspect );
                    vec2 prevP = fix( prevPos, aspect );
                    vec2 nextP = fix( nextPos, aspect );

                    float w = grl_resolution_lineWidth.z * grl_widths;

                    vec2 dir;
                    if( nextP == currentP ) dir = normalize( currentP - prevP );
                    else if( prevP == currentP ) dir = normalize( nextP - currentP );
                    else {
                        vec2 dir1 = normalize( currentP - prevP );
                        vec2 dir2 = normalize( nextP - currentP );
                        dir = normalize( dir1 + dir2 );
                    }
                    vec4 normal = vec4( -dir.y, dir.x, 0., 1. );
                    normal.xy *= .5 * w;
                    normal *= grl_projection;
                    #ifdef GREASED_LINE_SIZE_ATTENUATION
                        normal.xy *= finalPosition.w;
                        normal.xy /= ( vec4( grl_resolution_lineWidth.xy, 0., 1. ) * grl_projection ).xy;
                    #endif

                    finalPosition.xy += normal.xy * grl_previousAndSide.w;

                    gl_Position = finalPosition;

                    vNormal= normal.xyz;
                    vPositionW = vec3(finalPosition);
                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "!gl_Position\\=viewProjection\\*worldPos;": "//", // remove
            };
        }

        if (shaderType === "fragment") {
            return {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                    varying float vCounters;
                    flat in int vColorPointers;
                `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_MAIN_END: `
                    gl_FragColor.a *= step(vCounters, grl_colorMode_visibility_colorsWidth_useColors.y);
                    if( gl_FragColor.a == 0. ) discard;

                    if(grl_dashOptions.x == 1.){
                        gl_FragColor.a *= ceil(mod(vCounters + grl_dashOptions.z, grl_dashOptions.y) - (grl_dashOptions.y * grl_dashOptions.w));
                        if(gl_FragColor.a == 0.) discard;
                    }

                    #ifdef GREASED_LINE_HAS_COLOR
                        if (grl_colorMode_visibility_colorsWidth_useColors.x == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                            gl_FragColor.rgb = grl_singleColor;
                        } else if (grl_colorMode_visibility_colorsWidth_useColors.x == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                            gl_FragColor.rgb += grl_singleColor;
                        } else if (grl_colorMode_visibility_colorsWidth_useColors.x == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                            gl_FragColor.rgb *= grl_singleColor;
                        }
                    #else
                        if (grl_colorMode_visibility_colorsWidth_useColors.w == 1.) {
                            vec4 c = texture2D(grl_colors, vec2(float(vColorPointers)/(grl_colorMode_visibility_colorsWidth_useColors.z), 0.));;

                        if (grl_colorMode_visibility_colorsWidth_useColors.x == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                            gl_FragColor = c;
                        } else if (grl_colorMode_visibility_colorsWidth_useColors.x == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                            gl_FragColor += c;
                        } else if (grl_colorMode_visibility_colorsWidth_useColors.x == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                            gl_FragColor *= c;
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
     * Creates a RawTexture from a color array and sets it on the plugin material instance.
     * @param name name of the texture
     * @param colors Uint8Array of colors
     */
    private _createColorsTexture(name: string, colors: Uint8Array) {
        this._colorsTexture = new RawTexture(colors, colors.length / 4, 1, Engine.TEXTUREFORMAT_RGBA, this._scene, false, true, RawTexture.NEAREST_NEAREST);
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
    public setColors(colors: Nullable<Uint8Array>, lazy = false, forceUpdate = false): void {
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
            this._colorsTexture.update(colors);
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
     *
     * @returns
     */
    public getOptions(): GreasedLineMaterialOptions {
        // const options = {}
        // DeepCopier.DeepCopy(this._options, options);
        // return options;
        return this._options; // TODO: DeepCopy?
    }

    /**
     * Sets the line length visibility. 0 - 0% of the line will be visible, 1 - 100% of the line will be visible
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
     * @param value 1 / (number of dashes * 2)
     */
    public setDashArray(value: number) {
        this._options.dashArray = value;
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
     * Turn on/off attenuation of the width option and widths array.
     * @param value false means 1 unit in width = 1 unit on scene, true means 1 unit in width = 1 pixel (TODO: not really - make better description of this option)
     */
    public setSizeAttenuation(value: boolean) {
        this._options.sizeAttenuation = value;
        this.markAllDefinesAsDirty();
    }

    /**
     * Sets line base width. At each point the line width is calculated by widths[pointIndex] * width
     * @param value base width
     */
    public setWidth(value: number) {
        this._options.width = value;
    }

    /**
     * Sets the color of the line. If set the whole line will be mixed with this color according to the colorMode option. TODO: describe better the mixing algorithm
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
     * Sets the mixing mode of the color paramater. Default value is GreasedLineMeshColorMode.SET TODO: describe modes
     * @param value color mode
     */
    public setColorMode(value: GreasedLineMeshColorMode) {
        this._options.colorMode = value;
    }
}
