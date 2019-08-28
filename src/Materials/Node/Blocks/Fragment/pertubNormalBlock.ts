import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { InputBlock } from '../Input/inputBlock';

/**
 * Block used to pertub normals based on a normal map
 */
export class PertubNormalBlock extends NodeMaterialBlock {
    /**
     * Create a new PertubNormalBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        // Vertex
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment);        
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment);        
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("normalMapColor", NodeMaterialBlockConnectionPointTypes.Color3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("strength", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);

        // Fragment
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "PertubNormalBlock";
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }    

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }    
    
    /**
    * Gets the normal map color input component
    */
    public get normalMapColor(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
    * Gets the strength input component
    */
    public get strength(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        defines.setValue("BUMP", true);
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "uv");

            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute();
            }
            uvInput.output.connectTo(this.uv);
        }

        if (!this.strength.isConnected) {
            let strengthInput = new InputBlock("strength");
            strengthInput.value = 1.0;
            strengthInput.output.connectTo(this.strength);
        }
    }    

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let comments = `//${this.name}`;        
        let uv = this.uv;
        let worldPosition = this.worldPosition;
        let worldNormal = this.worldNormal;

        state.sharedData.blocksWithDefines.push(this);

        state._emitExtension("bump", "#extension GL_OES_standard_derivatives : enable");
        state._emitFunctionFromInclude("bumpFragmentFunctions", comments, {
            replaceStrings: [
                { search: /vBumpInfos.y/g, replace: `1.0 / ${this.strength.associatedVariableName}`},
                { search: /vTangentSpaceParams/g, replace: "vec2(1.0, 1.0)"},
                { search: /vPositionW/g, replace: worldPosition.associatedVariableName + ".xyz"}
            ]
        });      
        state.compilationString += this._declareOutput(this.output, state) + " = vec4(0.);\r\n";    
        state.compilationString += state._emitCodeFromInclude("bumpFragment", comments, {
            replaceStrings: [
                { search: /perturbNormal\(TBN,vBumpUV\+uvOffset\)/g, replace: `perturbNormal(TBN, ${this.normalMapColor.associatedVariableName})` },
                { search: /vBumpInfos.y/g, replace: `1.0 / ${this.strength.associatedVariableName}`},
                { search: /vBumpUV/g, replace: uv.associatedVariableName},
                { search: /vPositionW/g, replace: worldPosition.associatedVariableName + ".xyz"},
                { search: /normalW=/g, replace: this.output.associatedVariableName + ".xyz = " },
                { search: /normalW/g, replace: worldNormal.associatedVariableName + ".xyz" }
            ]
        });

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.PertubNormalBlock"] = PertubNormalBlock;