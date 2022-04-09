import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import { InputBlock } from "../Input/inputBlock";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { Scene } from "../../../../scene";
import type { Nullable } from "../../../../types";
import { PBRIridescenceConfiguration } from "../../../../Materials/PBR/pbrIridescenceConfiguration";

/**
 * Block used to implement the iridescence module of the PBR material
 */
export class IridescenceBlock extends NodeMaterialBlock {
    /**
     * Create a new IridescenceBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("indexOfRefraction", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("thickness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput(
            "iridescence",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("iridescence", this, NodeMaterialConnectionPointDirection.Output, IridescenceBlock, "IridescenceBlock")
        );
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("iridescenceOut");
        state._excludeVariableName("vIridescenceParams");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "IridescenceBlock";
    }

    /**
     * Gets the intensity input component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the indexOfRefraction input component
     */
    public get indexOfRefraction(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the thickness input component
     */
    public get thickness(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the iridescence object output component
     */
    public get iridescence(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (!this.intensity.isConnected) {
            const intensityInput = new InputBlock("Iridescence intensity", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            intensityInput.value = 1;
            intensityInput.output.connectTo(this.intensity);

            const indexOfRefractionInput = new InputBlock("Iridescence ior", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            indexOfRefractionInput.value = 1.3;
            indexOfRefractionInput.output.connectTo(this.indexOfRefraction);

            const thicknessInput = new InputBlock("Iridescence thickness", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            thicknessInput.value = 400;
            thicknessInput.output.connectTo(this.thickness);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("IRIDESCENCE", true, true);
        defines.setValue("IRIDESCENCE_TEXTURE", false, true);
        defines.setValue("IRIDESCENCE_THICKNESS_TEXTURE", false, true);
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param iridescenceBlock instance of a IridescenceBlock or null if the code must be generated without an active iridescence module
     * @returns the shader code
     */
    public static GetCode(iridescenceBlock: Nullable<IridescenceBlock>): string {
        let code = "";

        const intensityName = iridescenceBlock?.intensity.isConnected ? iridescenceBlock.intensity.associatedVariableName : "1.";
        const indexOfRefraction = iridescenceBlock?.indexOfRefraction.isConnected
            ? iridescenceBlock.indexOfRefraction.associatedVariableName
            : PBRIridescenceConfiguration._DefaultIndexOfRefraction;
        const thickness = iridescenceBlock?.thickness.isConnected ? iridescenceBlock.thickness.associatedVariableName : PBRIridescenceConfiguration._DefaultMaximumThickness;

        code += `iridescenceOutParams iridescenceOut;

        #ifdef IRIDESCENCE
            iridescenceBlock(
                vec4(${intensityName}, ${indexOfRefraction}, 1., ${thickness}),
                NdotV,
                specularEnvironmentR0,
                #ifdef CLEARCOAT
                    NdotVUnclamped,
                #endif
                iridescenceOut
            );

            float iridescenceIntensity = iridescenceOut.iridescenceIntensity;
            specularEnvironmentR0 = iridescenceOut.specularEnvironmentR0;
        #endif\r\n`;

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.bindableBlocks.push(this);
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);
    }
}

RegisterClass("BABYLON.IridescenceBlock", IridescenceBlock);
