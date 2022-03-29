import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { MaterialHelper } from "../../../materialHelper";
import type { Effect } from "../../../effect";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import type { Mesh } from "../../../../Meshes/mesh";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
/**
 * Block used to implement clip planes
 */
export class ClipPlanesBlock extends NodeMaterialBlock {
    /**
     * Create a new ClipPlanesBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment, true);

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ClipPlanesBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("vClipPlane");
        state._excludeVariableName("fClipDistance");
        state._excludeVariableName("vClipPlane2");
        state._excludeVariableName("fClipDistance2");
        state._excludeVariableName("vClipPlane3");
        state._excludeVariableName("fClipDistance3");
        state._excludeVariableName("vClipPlane4");
        state._excludeVariableName("fClipDistance4");
        state._excludeVariableName("vClipPlane5");
        state._excludeVariableName("fClipDistance5");
        state._excludeVariableName("vClipPlane6");
        state._excludeVariableName("fClipDistance6");
    }

    /**
     * Gets the worldPosition input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public get target() {
        return NodeMaterialBlockTargets.VertexAndFragment;
    }

    public set target(value: NodeMaterialBlockTargets) {}

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        const scene = mesh.getScene();

        const useClipPlane1 = scene.clipPlane !== undefined && scene.clipPlane !== null;
        const useClipPlane2 = scene.clipPlane2 !== undefined && scene.clipPlane2 !== null;
        const useClipPlane3 = scene.clipPlane3 !== undefined && scene.clipPlane3 !== null;
        const useClipPlane4 = scene.clipPlane4 !== undefined && scene.clipPlane4 !== null;
        const useClipPlane5 = scene.clipPlane5 !== undefined && scene.clipPlane5 !== null;
        const useClipPlane6 = scene.clipPlane6 !== undefined && scene.clipPlane6 !== null;

        defines.setValue("CLIPPLANE", useClipPlane1, true);
        defines.setValue("CLIPPLANE2", useClipPlane2, true);
        defines.setValue("CLIPPLANE3", useClipPlane3, true);
        defines.setValue("CLIPPLANE4", useClipPlane4, true);
        defines.setValue("CLIPPLANE5", useClipPlane5, true);
        defines.setValue("CLIPPLANE6", useClipPlane6, true);
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();

        MaterialHelper.BindClipPlane(effect, scene);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const comments = `//${this.name}`;
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            const worldPos = this.worldPosition;

            state._emitFunctionFromInclude("clipPlaneVertexDeclaration", comments, {
                replaceStrings: [{ search: /uniform vec4 vClipPlane\d*;/g, replace: "" }],
            });
            state.compilationString += state._emitCodeFromInclude("clipPlaneVertex", comments, {
                replaceStrings: [{ search: /worldPos/g, replace: worldPos.associatedVariableName }],
            });

            state._emitUniformFromString("vClipPlane", "vec4");
            state._emitUniformFromString("vClipPlane2", "vec4");
            state._emitUniformFromString("vClipPlane3", "vec4");
            state._emitUniformFromString("vClipPlane4", "vec4");
            state._emitUniformFromString("vClipPlane5", "vec4");
            state._emitUniformFromString("vClipPlane6", "vec4");

            return;
        }

        // Fragment
        state.sharedData.bindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);

        state._emitFunctionFromInclude("clipPlaneFragmentDeclaration", comments);
        state.compilationString += state._emitCodeFromInclude("clipPlaneFragment", comments);

        return this;
    }
}

RegisterClass("BABYLON.ClipPlanesBlock", ClipPlanesBlock);
