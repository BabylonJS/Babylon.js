// import { serialize, serializeAsTexture } from "core/Misc/decorators";
import { Engine } from "../Engines/engine";
import type { GreasedLineMeshColorDistribution } from "../Meshes/greasedLineMesh";
import { GreasedLineMeshColorMode } from "../Meshes/greasedLineMesh";
import { RawTexture } from "./Textures/rawTexture";
import { MaterialPluginBase } from "./materialPluginBase";
import { Material } from "./material";
import type { Scene } from "../scene";
import type { UniformBuffer } from "./uniformBuffer";
import type { Vector2 } from "../Maths/math.vector";
import type { Color3 } from "../Maths/math.color";
import type { Nullable } from "../types";
import { DeepCopier } from "core/Misc/deepCopier";

/**
 *
 */
export interface GreasedLineMaterialParameters {
    lazy?: boolean;
    width?: number;

    color?: Color3;
    colorMode?: GreasedLineMeshColorMode;
    useColors?: boolean;
    colors?: Uint8Array;
    colorDistribution?: GreasedLineMeshColorDistribution;

    sizeAttenuation?: boolean;
    visibility?: number;

    resolution?: Vector2;
    dashArray?: number;
    dashOffset?: number;
    dashRatio?: number;
    useDash?: boolean;
}

/**
 *
 */
export class GreasedLinePluginMaterial extends MaterialPluginBase {
    @serializeAsTexture("detailTexture")
    private _colorsTexture?: RawTexture;

    @serialize()
    private _parameters: GreasedLineMaterialParameters;

    private _engine: Engine;

    constructor(
        material: Material,
        private _scene: Scene,

        parameters: GreasedLineMaterialParameters
    ) {
        super(material, GreasedLinePluginMaterial.name, 200, {
            GREASED_LINE_HAS_COLOR: parameters.color,
            GREASED_LINE_SIZE_ATTENUATION: parameters.sizeAttenuation,
        });

        this._engine = this._scene.getEngine();

        if (parameters.colors) {
            this._createColorsTexture(`${material.name}-colors-texture`, parameters.colors);
        }

        this._parameters = parameters;

        this._enable(true); // always enabled
    }

    getAttributes(attributes: string[]) {
        attributes.push("offsets");
        attributes.push("previous");
        attributes.push("next");
        attributes.push("side");
        attributes.push("widths");
        attributes.push("counters");
    }

    getSamplers(samplers: string[]) {
        samplers.push("colors");
    }

    getUniforms() {
        return {
            ubo: [
                { name: "greasedLineProjection", size: 16, type: "mat4" },
                { name: "lineWidth", size: 1, type: "float" },
                { name: "resolution", size: 2, type: "vec2" },
                { name: "singleColor", size: 3, type: "vec3" },
                { name: "colorMode", size: 1, type: "float" },
                { name: "dashArray", size: 1, type: "float" },
                { name: "dashOffset", size: 1, type: "float" },
                { name: "dashRatio", size: 1, type: "float" },
                { name: "useDash", size: 1, type: "float" },
                { name: "greasedLineVisibility", size: 1, type: "float" },
                { name: "colorsWidth", size: 1, type: "float" },
                { name: "useColors", size: 1, type: "float" },
            ],
            vertex: `
      uniform float lineWidth;
      uniform vec2 resolution;
      uniform mat4 greasedLineProjection;
      `,
            fragment: `
      uniform float dashArray;
      uniform float dashOffset;
      uniform float dashRatio;
      uniform float useDash;
      uniform float greasedLineVisibility;
      uniform float colorsWidth;
      uniform float useColors;
      uniform sampler2D colors;
      uniform vec3 singleColor;
      uniform float colorMode;
      `,
        };
    }

    // only getter, it doesn't make sense to use this plugin on a mesh other than GreasedLineMesh
    // and it doesn't make sense to disable it on the mesh
    get isEnabled() {
        return true;
    }

    /**
     *
     * @param uniformBuffer
     */
    bindForSubMesh(uniformBuffer: UniformBuffer) {
        const activeCamera = this._scene.activeCamera;

        if (activeCamera) {
            const projection = activeCamera.getProjectionMatrix();
            uniformBuffer.updateMatrix("greasedLineProjection", projection);
        }

        uniformBuffer.updateFloat("lineWidth", this._parameters.width ?? 1);

        uniformBuffer.updateFloat("greasedLineVisibility", this._parameters.visibility ?? 1);

        if (this._parameters.resolution) {
            uniformBuffer.updateFloat2("resolution", this._parameters.resolution.x, this._parameters.resolution.y);
        } else {
            uniformBuffer.updateFloat2("resolution", this._engine.getRenderWidth(), this._engine.getRenderHeight());
        }

        uniformBuffer.updateFloat("dashArray", this._parameters.dashArray ?? 0);
        uniformBuffer.updateFloat("dashOffset", this._parameters.dashOffset ?? 0);
        uniformBuffer.updateFloat("dashRatio", this._parameters.dashRatio ?? 0.5);
        uniformBuffer.updateFloat("useDash", GreasedLinePluginMaterial._BooleanToNumber(this._parameters.useDash));

        uniformBuffer.updateFloat("colorMode", this._parameters.colorMode ?? GreasedLineMeshColorMode.COLOR_MODE_SET);

        if (this._parameters.color) {
            uniformBuffer.updateColor3("singleColor", this._parameters.color);
        }

        uniformBuffer.updateFloat("useColors", GreasedLinePluginMaterial._BooleanToNumber(this._parameters.useColors));

        if (this._colorsTexture) {
            uniformBuffer.updateFloat("colorsWidth", this._colorsTexture.getSize().width * 2);

            uniformBuffer.setTexture("colors", this._colorsTexture);
        }

        uniformBuffer.update();
    }

    prepareDefines(defines: Record<string, unknown> /*, scene: Scene, mesh: AbstractMesh*/) {
        const parameters = this._parameters;
        defines["GREASED_LINE_HAS_COLOR"] = !!parameters.color;
        defines["GREASED_LINE_SIZE_ATTENUATION"] = parameters.sizeAttenuation;
    }

    getClassName() {
        return GreasedLinePluginMaterial.name;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCustomCode(shaderType: string): any {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `
                    attribute vec3 previous;
                    attribute vec3 next;
                    attribute float side;
                    attribute float widths;
                    attribute float counters;
                    attribute vec3 offsets;

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

                CUSTOM_VERTEX_UPDATE_POSITION: `
                    vec3 positionOffset = offsets;
                    positionUpdated += positionOffset;
                `,
                CUSTOM_VERTEX_MAIN_END: `
                    vColorPointers = gl_VertexID;
                    vCounters = counters;

                    float aspect = resolution.x / resolution.y;

                    mat4 m = viewProjection * world;
                    vec4 finalPosition = m * vec4( positionUpdated , 1.0 );
                    vec4 prevPos = m * vec4( previous, 1.0 );
                    vec4 nextPos = m * vec4( next, 1.0 );

                    vec2 currentP = fix( finalPosition, aspect );
                    vec2 prevP = fix( prevPos, aspect );
                    vec2 nextP = fix( nextPos, aspect );

                    float w =  lineWidth * widths;

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
                    normal *= greasedLineProjection;
                    #ifdef GREASED_LINE_SIZE_ATTENUATION
                    normal.xy *= finalPosition.w;
                    normal.xy /= ( vec4( resolution, 0., 1. ) * greasedLineProjection ).xy;
                    #endif

                    finalPosition.xy += normal.xy * side;

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
                    gl_FragColor.a *= step(vCounters, greasedLineVisibility);
                    if( gl_FragColor.a == 0. ) discard;

                    if(useDash == 1.){
                        gl_FragColor.a *= ceil(mod(vCounters + dashOffset, dashArray) - (dashArray * dashRatio));
                        if(gl_FragColor.a == 0.) discard;
                    }

                    #ifdef GREASED_LINE_HAS_COLOR
                        if (colorMode == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                        gl_FragColor.rgb = singleColor;
                        } else if (colorMode == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                        gl_FragColor.rgb += singleColor;
                        } else if (colorMode == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
                        gl_FragColor.rgb *= singleColor;
                        }
                    #else
                        if (useColors == 1.) {
                        vec4 c = texture2D(colors, vec2(float(vColorPointers)/(colorsWidth), 0.));;

                        if (colorMode == ${GreasedLineMeshColorMode.COLOR_MODE_SET}.) {
                            gl_FragColor = c;
                        } else if (colorMode == ${GreasedLineMeshColorMode.COLOR_MODE_ADD}.) {
                            gl_FragColor += c;
                        } else if (colorMode == ${GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY}.) {
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
     *
     * @param bool
     * @returns
     */
    private static _BooleanToNumber(bool?: boolean) {
        return bool ? 1 : 0;
    }

    /**
     *
     * @param name
     * @param colors
     */
    private _createColorsTexture(name: string, colors: Uint8Array) {
        this._colorsTexture = new RawTexture(colors, colors.length / 3, 1, Engine.TEXTUREFORMAT_RGB, this._scene, false, true, RawTexture.NEAREST_NEAREST);
        this._colorsTexture.name = name;
    }

    /**
     *
     */
    public dispose(): void {
        super.dispose(true);
        // TODO: dispose something else?
    }

    /**
     *
     * @param parsed
     * @param scene
     * @returns
     */
    public static Parse(parsed: any, scene: Scene): Nullable<GreasedLinePluginMaterial> {
        const rootUrl = ""; // TODO: ?
        const material = Material.Parse(parsed.material, scene, rootUrl);
        if (material) {
            const result = new GreasedLinePluginMaterial(material, scene, parsed.parameters);
            return result;
        }

        return null;
    }

    /**
     *
     * @param value
     */
    public setUseColors(value: boolean) {
        this._parameters.useColors = value;
    }

    /**
     * Creates or updates the colors texture
     * @param colors color table
     * @param lazy if lazy, the colors are not updated
     * @param forceUpdate force creation of a new texture
     * @returns
     */
    public setColors(colors: Nullable<Uint8Array>, lazy = false, forceUpdate = false): void {
        if (colors === null || colors.length === 0) {
            this._colorsTexture?.dispose();
            return;
        }

        const origColorsCount = this._parameters.colors?.length ?? 0;

        this._parameters.colors = colors;

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
        if (this._parameters.colors) {
            this.setColors(this._parameters.colors, false, true);
        }
    }

    /**
     *
     * @returns
     */
    public getParameters(): GreasedLineMaterialParameters {
        const parameters: GreasedLineMaterialParameters = {};
        DeepCopier.DeepCopy(this._parameters, parameters);
        return parameters;
    }

    /**
     * Sets the line length visibility. 0 - 0% of the line will be visible, 1 - 100% of the line will be visible
     * @param value
     */
    public setVisibility(value: number) {
        this._parameters.visibility = value;
    }

    /**
     * Turns on/off dashmode
     * @param value
     */
    // TODO: define?
    public setUseDash(value: boolean) {
        this._parameters.useDash = value;
    }

    /**
     * Sets the dash array.
     * @param value 1 / (number of dashes * 2)
     */
    public setDashArray(value: number) {
        this._parameters.dashArray = value;
    }

    /**
     * Sets the dash ratio
     * @param value dash length ratio 0..1 (0.5 = half empty, half drawn)
     */
    public setDashRatio(value: number) {
        this._parameters.dashRatio = value;
    }

    /**
     * Sets the dash offset
     * @param value the dashwss will be offset by this value
     */
    public setDashOffset(value: number) {
        this._parameters.dashOffset = value;
    }

    /**
     * Turn on/off attenuation of the width parameter and widths array.
     * @param value false means 1 unit in width = 1 unit on scene, true means 1 unit in width = 1 pixel (TODO: not really - make better description of this parameter)
     */
    public setSizeAttenuation(value: boolean) {
        if ((this._parameters.sizeAttenuation === undefined && value !== undefined) || (this._parameters.sizeAttenuation !== undefined && value === undefined)) {
            this._parameters.sizeAttenuation = value;
            this.markAllDefinesAsDirty();
        } else {
            this._parameters.sizeAttenuation = value;
        }
    }

    /**
     * Sets line base width. At each point the line width is calculated byt widths[pointIndex] * width
     * @param value base width
     */
    public setWidth(value: number) {
        this._parameters.width = value;
    }

    /**
     * Sets the color of the line. If set the whole line will be mixed with this color according to the colorMode parameter. TODO: describe better the mixing algorithm
     * @param value color
     */
    public setColor(value: Color3 | undefined) {
        if ((this._parameters.color === undefined && value !== undefined) || (this._parameters.color !== undefined && value === undefined)) {
            this._parameters.color = value;
            this.markAllDefinesAsDirty();
        } else {
            this._parameters.color = value;
        }
    }

    /**
     * Sets the mixing mode of the color paramater. Default value is GreasedLineMeshColorMode.SET TODO: describe modes
     * @param value color mode
     */
    public setColorMode(value: GreasedLineMeshColorMode) {
        this._parameters.colorMode = value;
    }
}
