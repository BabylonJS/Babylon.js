import { NodeMaterial, NodeMaterialDefines } from '../../../nodeMaterial';
import { NodeMaterialBlock } from '../../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../../Misc/typeStore';
import { AbstractMesh } from '../../../../../Meshes/abstractMesh';
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";

export class AnisotropyBlock extends NodeMaterialBlock {

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("direction", NodeMaterialBlockConnectionPointTypes.Vector2, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("anisotropy", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("anisotropy", this, NodeMaterialConnectionPointDirection.Output, AnisotropyBlock, "AnisotropyBlock"));
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("anisotropicOut");
        state._excludeVariableName("TBN");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "AnisotropyBlock";
    }

    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public get direction(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get anisotropy(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public getCode(): string {
        let code = `anisotropicOutParams anisotropicOut;\r\n`;

        const intensity = this.intensity.isConnected ? this.intensity.associatedVariableName : "1.0";
        const direction = this.direction.isConnected ? this.direction.associatedVariableName : "vec2(1., 0.)";
        const texture = this.texture.isConnected ? this.texture.associatedVariableName : "vec3(0.)";

        code += `anisotropicBlock(
                vec3(${direction}, ${intensity}),
            #ifdef ANISOTROPIC_TEXTURE
                ${texture},
            #endif
                TBN,
                normalW,
                viewDirectionW,
                anisotropicOut
            );\r\n`;

        return code;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("ANISOTROPIC", true);
        defines.setValue("ANISOTROPIC_TEXTURE", this.texture.isConnected);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.AnisotropyBlock"] = AnisotropyBlock;