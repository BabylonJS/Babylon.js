import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../nodeMaterialBlockConnectionPoint";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { NodeMaterialDefines } from "../nodeMaterial";
import { NodeMaterial } from "../nodeMaterial";
import type { Effect } from "../../effect";
import type { Nullable } from "../../../types";
import { RegisterClass } from "../../../Misc/typeStore";
import { Texture } from "../../Textures/texture";
import type { Scene } from "../../../scene";
import { Constants } from "../../../Engines/constants";
import "../../../Shaders/ShadersInclude/helperFunctions";
import { ImageSourceBlock } from "./Dual/imageSourceBlock";
import { NodeMaterialConnectionPointCustomObject } from "../nodeMaterialConnectionPointCustomObject";
import { EngineStore } from "../../../Engines/engineStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";

/**
 * Block used to read a texture with triplanar mapping (see "boxmap" in https://iquilezles.org/articles/biplanar/)
 */
export class TriPlanarBlock extends NodeMaterialBlock {
    private _linearDefineName: string;
    private _gammaDefineName: string;
    protected _tempTextureRead: string;
    private _samplerName: string;
    private _textureInfoName: string;
    private _imageSource: Nullable<ImageSourceBlock>;

    /**
     * Project the texture(s) for a better fit to a cube
     */
    @editableInPropertyPage("Project as cube", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public projectAsCube: boolean = false;

    protected _texture: Nullable<Texture>;
    /**
     * Gets or sets the texture associated with the node
     */
    public get texture(): Nullable<Texture> {
        if (this.source.isConnected) {
            return (this.source.connectedPoint?.ownerBlock as ImageSourceBlock).texture;
        }
        return this._texture;
    }

    public set texture(texture: Nullable<Texture>) {
        if (this._texture === texture) {
            return;
        }

        const scene = texture?.getScene() ?? EngineStore.LastCreatedScene;

        if (!texture && scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this._texture!);
            });
        }

        this._texture = texture;

        if (texture && scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(texture);
            });
        }
    }

    /**
     * Gets the textureY associated with the node
     */
    public get textureY(): Nullable<Texture> {
        if (this.sourceY.isConnected) {
            return (this.sourceY.connectedPoint?.ownerBlock as ImageSourceBlock).texture;
        }
        return null;
    }

    /**
     * Gets the textureZ associated with the node
     */
    public get textureZ(): Nullable<Texture> {
        if (this.sourceZ?.isConnected) {
            return (this.sourceY.connectedPoint?.ownerBlock as ImageSourceBlock).texture;
        }
        return null;
    }

    protected _getImageSourceBlock(connectionPoint: Nullable<NodeMaterialConnectionPoint>): Nullable<ImageSourceBlock> {
        return connectionPoint?.isConnected ? (connectionPoint.connectedPoint!.ownerBlock as ImageSourceBlock) : null;
    }

    /**
     * Gets the sampler name associated with this texture
     */
    public get samplerName(): string {
        const imageSourceBlock = this._getImageSourceBlock(this.source);
        if (imageSourceBlock) {
            return imageSourceBlock.samplerName;
        }
        return this._samplerName;
    }

    /**
     * Gets the samplerY name associated with this texture
     */
    public get samplerYName(): Nullable<string> {
        return this._getImageSourceBlock(this.sourceY)?.samplerName ?? null;
    }

    /**
     * Gets the samplerZ name associated with this texture
     */
    public get samplerZName(): Nullable<string> {
        return this._getImageSourceBlock(this.sourceZ)?.samplerName ?? null;
    }

    /**
     * Gets a boolean indicating that this block is linked to an ImageSourceBlock
     */
    public get hasImageSource(): boolean {
        return this.source.isConnected;
    }

    private _convertToGammaSpace = false;
    /**
     * Gets or sets a boolean indicating if content needs to be converted to gamma space
     */
    public set convertToGammaSpace(value: boolean) {
        if (value === this._convertToGammaSpace) {
            return;
        }

        this._convertToGammaSpace = value;
        if (this.texture) {
            const scene = this.texture.getScene() ?? EngineStore.LastCreatedScene;
            scene?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this.texture!);
            });
        }
    }
    public get convertToGammaSpace(): boolean {
        return this._convertToGammaSpace;
    }

    private _convertToLinearSpace = false;
    /**
     * Gets or sets a boolean indicating if content needs to be converted to linear space
     */
    public set convertToLinearSpace(value: boolean) {
        if (value === this._convertToLinearSpace) {
            return;
        }

        this._convertToLinearSpace = value;
        if (this.texture) {
            const scene = this.texture.getScene() ?? EngineStore.LastCreatedScene;
            scene?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this.texture!);
            });
        }
    }
    public get convertToLinearSpace(): boolean {
        return this._convertToLinearSpace;
    }

    /**
     * Gets or sets a boolean indicating if multiplication of texture with level should be disabled
     */
    public disableLevelMultiplication = false;

    /**
     * Create a new TriPlanarBlock
     * @param name defines the block name
     * @param hideSourceZ defines a boolean indicating that normal Z should not be used (false by default)
     */
    public constructor(name: string, hideSourceZ = false) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.AutoDetect, false);
        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.AutoDetect, false);
        this.registerInput("sharpness", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput(
            "source",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("source", this, NodeMaterialConnectionPointDirection.Input, ImageSourceBlock, "ImageSourceBlock")
        );
        this.registerInput(
            "sourceY",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("sourceY", this, NodeMaterialConnectionPointDirection.Input, ImageSourceBlock, "ImageSourceBlock")
        );
        if (!hideSourceZ) {
            this.registerInput(
                "sourceZ",
                NodeMaterialBlockConnectionPointTypes.Object,
                true,
                NodeMaterialBlockTargets.VertexAndFragment,
                new NodeMaterialConnectionPointCustomObject("sourceZ", this, NodeMaterialConnectionPointDirection.Input, ImageSourceBlock, "ImageSourceBlock")
            );
        }

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this.registerOutput("level", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );
        this._inputs[1].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "TriPlanarBlock";
    }

    /**
     * Gets the position input component
     */
    public get position(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the normal input component
     */
    public get normal(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the sharpness input component
     */
    public get sharpness(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the source input component
     */
    public get source(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the sourceY input component
     */
    public get sourceY(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the sourceZ input component
     */
    public get sourceZ(): Nullable<NodeMaterialConnectionPoint> {
        return this._inputs[5];
    }

    /**
     * Gets the rgba output component
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the rgb output component
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the r output component
     */
    public get r(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the g output component
     */
    public get g(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the b output component
     */
    public get b(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the a output component
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the level output component
     */
    public get level(): NodeMaterialConnectionPoint {
        return this._outputs[6];
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (!defines._areTexturesDirty) {
            return;
        }

        const toGamma = this.convertToGammaSpace && this.texture && !this.texture.gammaSpace;
        const toLinear = this.convertToLinearSpace && this.texture && this.texture.gammaSpace;

        // Not a bug... Name defines the texture space not the required conversion
        defines.setValue(this._linearDefineName, toGamma, true);
        defines.setValue(this._gammaDefineName, toLinear, true);
    }

    public isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public bind(effect: Effect) {
        if (!this.texture) {
            return;
        }

        effect.setFloat(this._textureInfoName, this.texture.level);

        if (!this._imageSource) {
            effect.setTexture(this._samplerName, this.texture);
        }
    }

    protected _generateTextureLookup(state: NodeMaterialBuildState): void {
        const samplerName = this.samplerName;
        const samplerYName = this.samplerYName ?? samplerName;
        const samplerZName = this.samplerZName ?? samplerName;

        const sharpness = this.sharpness.isConnected ? this.sharpness.associatedVariableName : "1.0";

        const x = state._getFreeVariableName("x");
        const y = state._getFreeVariableName("y");
        const z = state._getFreeVariableName("z");
        const w = state._getFreeVariableName("w");
        const n = state._getFreeVariableName("n");
        const uvx = state._getFreeVariableName("uvx");
        const uvy = state._getFreeVariableName("uvy");
        const uvz = state._getFreeVariableName("uvz");

        state.compilationString += `
            vec3 ${n} = ${this.normal.associatedVariableName}.xyz;

            vec2 ${uvx} = ${this.position.associatedVariableName}.yz;
            vec2 ${uvy} = ${this.position.associatedVariableName}.zx;
            vec2 ${uvz} = ${this.position.associatedVariableName}.xy;
        `;

        if (this.projectAsCube) {
            state.compilationString += `
                ${uvx}.xy = ${uvx}.yx;

                if (${n}.x >= 0.0) {
                    ${uvx}.x = -${uvx}.x;
                }
                if (${n}.y < 0.0) {
                    ${uvy}.y = -${uvy}.y;
                }
                if (${n}.z < 0.0) {
                    ${uvz}.x = -${uvz}.x;
                }
            `;
        }

        state.compilationString += `
            vec4 ${x} = texture2D(${samplerName}, ${uvx});
            vec4 ${y} = texture2D(${samplerYName}, ${uvy});
            vec4 ${z} = texture2D(${samplerZName}, ${uvz});
           
            // blend weights
            vec3 ${w} = pow(abs(${n}), vec3(${sharpness}));

            // blend and return
            vec4 ${this._tempTextureRead} = (${x}*${w}.x + ${y}*${w}.y + ${z}*${w}.z) / (${w}.x + ${w}.y + ${w}.z);        
        `;
    }

    private _generateConversionCode(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string): void {
        if (swizzle !== "a") {
            // no conversion if the output is "a" (alpha)
            if (!this.texture || !this.texture.gammaSpace) {
                state.compilationString += `#ifdef ${this._linearDefineName}
                    ${output.associatedVariableName} = toGammaSpace(${output.associatedVariableName});
                    #endif
                `;
            }

            state.compilationString += `#ifdef ${this._gammaDefineName}
                ${output.associatedVariableName} = toLinearSpace(${output.associatedVariableName});
                #endif
            `;
        }
    }

    private _writeOutput(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string) {
        let complement = "";

        if (!this.disableLevelMultiplication) {
            complement = ` * ${this._textureInfoName}`;
        }

        state.compilationString += `${this._declareOutput(output, state)} = ${this._tempTextureRead}.${swizzle}${complement};\n`;
        this._generateConversionCode(state, output, swizzle);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (this.source.isConnected) {
            this._imageSource = this.source.connectedPoint!.ownerBlock as ImageSourceBlock;
        } else {
            this._imageSource = null;
        }

        this._textureInfoName = state._getFreeVariableName("textureInfoName");

        this.level.associatedVariableName = this._textureInfoName;

        this._tempTextureRead = state._getFreeVariableName("tempTextureRead");
        this._linearDefineName = state._getFreeDefineName("ISLINEAR");
        this._gammaDefineName = state._getFreeDefineName("ISGAMMA");

        if (!this._imageSource) {
            this._samplerName = state._getFreeVariableName(this.name + "Sampler");

            state._emit2DSampler(this._samplerName);
        }

        // Declarations
        state.sharedData.blockingBlocks.push(this);
        state.sharedData.textureBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);
        state.sharedData.bindableBlocks.push(this);

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        state._emitUniformFromString(this._textureInfoName, "float");

        this._generateTextureLookup(state);

        for (const output of this._outputs) {
            if (output.hasEndpoints && output.name !== "level") {
                this._writeOutput(state, output, output.name);
            }
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.convertToGammaSpace = ${this.convertToGammaSpace};\n`;
        codeString += `${this._codeVariableName}.convertToLinearSpace = ${this.convertToLinearSpace};\n`;
        codeString += `${this._codeVariableName}.disableLevelMultiplication = ${this.disableLevelMultiplication};\n`;
        codeString += `${this._codeVariableName}.projectAsCube = ${this.projectAsCube};\n`;

        if (!this.texture) {
            return codeString;
        }

        codeString += `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}", null, ${this.texture.noMipmap}, ${this.texture.invertY}, ${this.texture.samplingMode});\n`;
        codeString += `${this._codeVariableName}.texture.wrapU = ${this.texture.wrapU};\n`;
        codeString += `${this._codeVariableName}.texture.wrapV = ${this.texture.wrapV};\n`;
        codeString += `${this._codeVariableName}.texture.uAng = ${this.texture.uAng};\n`;
        codeString += `${this._codeVariableName}.texture.vAng = ${this.texture.vAng};\n`;
        codeString += `${this._codeVariableName}.texture.wAng = ${this.texture.wAng};\n`;
        codeString += `${this._codeVariableName}.texture.uOffset = ${this.texture.uOffset};\n`;
        codeString += `${this._codeVariableName}.texture.vOffset = ${this.texture.vOffset};\n`;
        codeString += `${this._codeVariableName}.texture.uScale = ${this.texture.uScale};\n`;
        codeString += `${this._codeVariableName}.texture.vScale = ${this.texture.vScale};\n`;
        codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\n`;

        return codeString;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        serializationObject.disableLevelMultiplication = this.disableLevelMultiplication;
        serializationObject.projectAsCube = this.projectAsCube;
        if (!this.hasImageSource && this.texture && !this.texture.isRenderTarget && this.texture.getClassName() !== "VideoTexture") {
            serializationObject.texture = this.texture.serialize();
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertToGammaSpace = serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;
        this.disableLevelMultiplication = !!serializationObject.disableLevelMultiplication;
        this.projectAsCube = !!serializationObject.projectAsCube;

        if (serializationObject.texture && !NodeMaterial.IgnoreTexturesAtLoadTime && serializationObject.texture.url !== undefined) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl) as Texture;
        }
    }
}

RegisterClass("BABYLON.TriPlanarBlock", TriPlanarBlock);
