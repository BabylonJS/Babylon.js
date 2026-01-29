import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { Scene } from "core/scene";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";

/**
 * Block used to render intermediate debug values
 * Please note that the node needs to be active to be generated in the shader
 * Only one DebugBlock should be active at a time
 */
export class NodeMaterialDebugBlock extends NodeMaterialBlock {
    private _isActive = false;

    /** @internal */
    public _forcedActive = false;

    /** Gets or sets a boolean indicating if we want to render alpha when using a rgba input*/
    @editableInPropertyPage("Render Alpha", PropertyTypeForEdition.Boolean, undefined)
    public renderAlpha = false;

    /**
     * Gets or sets a boolean indicating that the block is active
     */
    public get isActive(): boolean {
        return this._isActive && this.debug.isConnected;
    }

    public set isActive(value: boolean) {
        if (this._isActive === value) {
            return;
        }

        this._isActive = value;
    }

    /**
     * Creates a new NodeMaterialDebugBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true, true);

        this.registerInput("debug", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);

        this.debug.excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /** @internal */
    public override get _isFinalOutputAndActive() {
        return this.isActive || this._forcedActive;
    }

    /** @internal */
    public override get _hasPrecedence() {
        return true;
    }

    /**
     * Gets the rgba input component
     */
    public get debug(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeMaterialDebugBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (!this._isFinalOutputAndActive) {
            return this;
        }

        let outputString = "gl_FragColor";
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            outputString = "fragmentOutputs.color";
        }

        const debug = this.debug;
        if (!debug.connectedPoint) {
            return this;
        }

        if (debug.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Float) {
            state.compilationString += `${outputString}  = vec4${state.fSuffix}(${debug.associatedVariableName}, ${debug.associatedVariableName}, ${debug.associatedVariableName}, 1.0);\n`;
        } else if (debug.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector2) {
            state.compilationString += `${outputString}  = vec4${state.fSuffix}(${debug.associatedVariableName}, 0., 1.0);\n`;
        } else if (debug.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Color3 || debug.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector3) {
            state.compilationString += `${outputString}  = vec4${state.fSuffix}(${debug.associatedVariableName}, 1.0);\n`;
        } else if (this.renderAlpha) {
            state.compilationString += `${outputString}  =${debug.associatedVariableName};\n`;
        } else {
            state.compilationString += `${outputString}  = vec4${state.fSuffix}(${debug.associatedVariableName}.rgb, 1.0);\n`;
        }

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.isActive = this._isActive;
        serializationObject.renderAlpha = this.renderAlpha;
        serializationObject._forcedActive = this._forcedActive;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.isActive = serializationObject.isActive;
        this.renderAlpha = serializationObject.renderAlpha;
        this._forcedActive = serializationObject._forcedActive;
    }
}

RegisterClass("BABYLON.NodeMaterialDebugBlock", NodeMaterialDebugBlock);
