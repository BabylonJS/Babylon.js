import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Scene } from "../../../../scene";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { NodeMaterialDefines } from "../../nodeMaterial";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";
import { MaterialHelper } from "../../../materialHelper";

declare type NodeMaterial = import("../../nodeMaterial").NodeMaterial;
declare type Effect = import("../../../effect").Effect;
declare type Mesh = import("../../../../Meshes/mesh").Mesh;

/**
 * Block used to output the final color
 */
export class FragmentOutputBlock extends NodeMaterialBlock {
    private _linearDefineName: string;
    private _gammaDefineName: string;

    /**
     * Create a new FragmentOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);

        this.rgb.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
    }

    /** Gets or sets a boolean indicating if content needs to be converted to gamma space */
    @editableInPropertyPage("Convert to gamma space", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: true } })
    public convertToGammaSpace = false;

    /** Gets or sets a boolean indicating if content needs to be converted to linear space */
    @editableInPropertyPage("Convert to linear space", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: true } })
    public convertToLinearSpace = false;

    /** Gets or sets a boolean indicating if logarithmic depth should be used */
    @editableInPropertyPage("Use logarithmic depth", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public useLogarithmicDepth = false;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FragmentOutputBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("logarithmicDepthConstant");
        state._excludeVariableName("vFragmentDepth");
    }

    /**
     * Gets the rgba input component
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the rgb input component
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the a input component
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        defines.setValue(this._linearDefineName, this.convertToLinearSpace, true);
        defines.setValue(this._gammaDefineName, this.convertToGammaSpace, true);
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (this.useLogarithmicDepth && mesh) {
            MaterialHelper.BindLogDepth(undefined, effect, mesh.getScene());
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const rgba = this.rgba;
        const rgb = this.rgb;
        const a = this.a;

        state.sharedData.hints.needAlphaBlending = rgba.isConnected || a.isConnected;
        state.sharedData.blocksWithDefines.push(this);
        if (this.useLogarithmicDepth) {
            state._emitUniformFromString("logarithmicDepthConstant", "float");
            state._emitVaryingFromString("vFragmentDepth", "float");
            state.sharedData.bindableBlocks.push(this);
        }
        this._linearDefineName = state._getFreeDefineName("CONVERTTOLINEAR");
        this._gammaDefineName = state._getFreeDefineName("CONVERTTOGAMMA");

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        if (rgba.connectedPoint) {
            if (a.isConnected) {
                state.compilationString += `gl_FragColor = vec4(${rgba.associatedVariableName}.rgb, ${a.associatedVariableName});\r\n`;
            } else {
                state.compilationString += `gl_FragColor = ${rgba.associatedVariableName};\r\n`;
            }
        } else if (rgb.connectedPoint) {
            let aValue = "1.0";

            if (a.connectedPoint) {
                aValue = a.associatedVariableName;
            }

            if (rgb.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Float) {
                state.compilationString += `gl_FragColor = vec4(${rgb.associatedVariableName}, ${rgb.associatedVariableName}, ${rgb.associatedVariableName}, ${aValue});\r\n`;
            } else {
                state.compilationString += `gl_FragColor = vec4(${rgb.associatedVariableName}, ${aValue});\r\n`;
            }
        } else {
            state.sharedData.checks.notConnectedNonOptionalInputs.push(rgba);
        }

        state.compilationString += `#ifdef ${this._linearDefineName}\r\n`;
        state.compilationString += `gl_FragColor = toLinearSpace(gl_FragColor);\r\n`;
        state.compilationString += `#endif\r\n`;

        state.compilationString += `#ifdef ${this._gammaDefineName}\r\n`;
        state.compilationString += `gl_FragColor = toGammaSpace(gl_FragColor);\r\n`;
        state.compilationString += `#endif\r\n`;

        if (this.useLogarithmicDepth) {
            state.compilationString += `gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;\r\n`;
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.convertToGammaSpace = ${this.convertToGammaSpace};\r\n`;
        codeString += `${this._codeVariableName}.convertToLinearSpace = ${this.convertToLinearSpace};\r\n`;
        codeString += `${this._codeVariableName}.useLogarithmicDepth = ${this.useLogarithmicDepth};\r\n`;

        return codeString;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        serializationObject.useLogarithmicDepth = this.useLogarithmicDepth;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertToGammaSpace = serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = serializationObject.convertToLinearSpace;
        this.useLogarithmicDepth = serializationObject.useLogarithmicDepth ?? false;
    }
}

RegisterClass("BABYLON.FragmentOutputBlock", FragmentOutputBlock);
