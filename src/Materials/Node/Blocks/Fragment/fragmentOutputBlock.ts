import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';
import { Scene } from '../../../../scene';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterialDefines } from '../../nodeMaterial';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";

declare type NodeMaterial = import("../../nodeMaterial").NodeMaterial;

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
    @editableInPropertyPage("Convert to gamma space", PropertyTypeForEdition.Boolean, "PROPERTIES", { "notifiers": { "update": true }})
    public convertToGammaSpace = false;

    /** Gets or sets a boolean indicating if content needs to be converted to linear space */
    @editableInPropertyPage("Convert to linear space", PropertyTypeForEdition.Boolean, "PROPERTIES", { "notifiers": { "update": true }})
    public convertToLinearSpace = false;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FragmentOutputBlock";
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

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let rgba = this.rgba;
        let rgb = this.rgb;
        let a = this.a;

        state.sharedData.hints.needAlphaBlending = rgba.isConnected || a.isConnected;
        state.sharedData.blocksWithDefines.push(this);

        this._linearDefineName = state._getFreeDefineName("CONVERTTOLINEAR");
        this._gammaDefineName = state._getFreeDefineName("CONVERTTOGAMMA");

        let comments = `//${this.name}`;
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

        return this;
    }

    protected _dumpPropertiesCode() {
        var codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.convertToGammaSpace = ${this.convertToGammaSpace};\r\n`;
        codeString += `${this._codeVariableName}.convertToLinearSpace = ${this.convertToLinearSpace};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertToGammaSpace = serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = serializationObject.convertToLinearSpace;
    }
}

_TypeStore.RegisteredTypes["BABYLON.FragmentOutputBlock"] = FragmentOutputBlock;