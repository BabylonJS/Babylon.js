import { serialize, serializeAsColor3 } from "../Misc/decorators";
import type { Nullable } from "../types";
import { Scene } from "../scene";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import type { Effect } from "../Materials/effect";
import type { Material } from "../Materials/material";
import { EffectLayer } from "./effectLayer";
import { Constants } from "../Engines/constants";
import { RegisterClass } from "../Misc/typeStore";

import { SerializationHelper } from "../Misc/decorators.serialization";
import type { IThinSelectionOutlineLayerOptions } from "./thinSelectionOutlineLayer";
import { ThinSelectionOutlineLayer } from "./thinSelectionOutlineLayer";
import type { Color3 } from "../Maths/math.color";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Return a the first selection outline layer of the scene with a given name.
         * @param name The name of the selection outline layer to look for.
         * @returns The selection outline layer if found otherwise null.
         */
        getSelectionOutlineLayerByName(name: string): Nullable<SelectionOutlineLayer>;
    }
}

Scene.prototype.getSelectionOutlineLayerByName = function (name: string): Nullable<SelectionOutlineLayer> {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === SelectionOutlineLayer.EffectName) {
            return (<any>this.effectLayers[index]) as SelectionOutlineLayer;
        }
    }

    return null;
};

/**
 * Selection outline layer options. This helps customizing the behaviour
 * of the selection outline layer.
 */
export interface ISelectionOutlineLayerOptions extends IThinSelectionOutlineLayerOptions {
    /**
     * Enable MSAA by choosing the number of samples. Default: 1
     */
    mainTextureSamples?: number;
}

/**
 * The selection outline layer Helps adding a outline effect around a mesh.
 *
 * Once instantiated in a scene, simply use the addMesh or removeMesh method to add or remove
 * outlined meshes to your scene.
 */
export class SelectionOutlineLayer extends EffectLayer {
    /**
     * Effect Name of the selection outline layer.
     */
    public static get EffectName() {
        return ThinSelectionOutlineLayer.EffectName;
    }

    /**
     * The outline color (default (1, 0.5, 0))
     */
    @serializeAsColor3()
    public get outlineColor(): Color3 {
        return this._thinEffectLayer.outlineColor;
    }

    public set outlineColor(value: Color3) {
        this._thinEffectLayer.outlineColor = value;
    }

    /**
     * The thickness of the edges (default: 2.0)
     */
    @serialize()
    public get outlineThickness(): number {
        return this._thinEffectLayer.outlineThickness;
    }

    public set outlineThickness(value: number) {
        this._thinEffectLayer.outlineThickness = value;
    }

    /**
     * The strength of the occlusion effect (default: 0.8)
     */
    @serialize()
    public get occlusionStrength(): number {
        return this._thinEffectLayer.occlusionStrength;
    }

    public set occlusionStrength(value: number) {
        this._thinEffectLayer.occlusionStrength = value;
    }

    /**
     * The occlusion threshold (default: 0.01)
     */
    @serialize()
    public get occlusionThreshold(): number {
        return this._thinEffectLayer.occlusionThreshold;
    }

    public set occlusionThreshold(value: number) {
        this._thinEffectLayer.occlusionThreshold = value;
    }

    @serialize("options")
    private _options: Required<ISelectionOutlineLayerOptions>;

    protected override readonly _thinEffectLayer: ThinSelectionOutlineLayer;

    /**
     * Instantiates a new selection outline Layer and references it to the scene..
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see ISelectionOutlineLayerOptions for more information)
     */
    public constructor(name: string, scene?: Scene, options?: Partial<ISelectionOutlineLayerOptions>) {
        super(name, scene, options !== undefined ? !!options.forceGLSL : false, new ThinSelectionOutlineLayer(name, scene, options));

        // Adapt options
        this._options = {
            mainTextureRatio: 1.0,
            mainTextureFixedSize: 0,
            alphaBlendingMode: Constants.ALPHA_COMBINE,
            camera: null,
            mainTextureSamples: 1,
            renderingGroupId: -1,
            mainTextureType: Constants.TEXTURETYPE_FLOAT,
            mainTextureFormat: Constants.TEXTUREFORMAT_RG,
            forceGLSL: false,
            storeCameraSpaceZ: false,
            ...options,
        };

        // Initialize the layer
        this._init(this._options);

        // Do not render as long as no meshes have been added
        this._shouldRender = false;

        this._scene.enableDepthRenderer();
    }

    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    public getEffectName(): string {
        return SelectionOutlineLayer.EffectName;
    }

    protected override _numInternalDraws(): number {
        return 1; // draw depth mask on main pass and outline on merge pass
    }

    /**
     * Create the merge effect. This is the shader use to blit the information back
     * to the main canvas at the end of the scene rendering.
     * @returns The effect created
     */
    protected _createMergeEffect(): Effect {
        return this._thinEffectLayer._createMergeEffect();
    }

    /**
     * Creates the render target textures and post processes used in the selection outline layer.
     */
    protected _createTextureAndPostProcesses(): void {
        this._textures = [];

        this._thinEffectLayer.bindTexturesForCompose = (effect: Effect): void => {
            effect.setTexture("maskSampler", this._mainTexture);
            const depthRenderer = this._scene.enableDepthRenderer();
            effect.setTexture("depthSampler", depthRenderer.getDepthMap());

            const mainTextureDesiredSize = this._mainTextureDesiredSize;
            this._thinEffectLayer.textureWidth = mainTextureDesiredSize.width;
            this._thinEffectLayer.textureHeight = mainTextureDesiredSize.height;
        };

        this._thinEffectLayer._createTextureAndPostProcesses();

        this._postProcesses = [];

        this._mainTexture.samples = this._options.mainTextureSamples;
        this._mainTexture.onAfterUnbindObservable.add(() => {
            // glow layer and highlight layer both call this._scene.postProcessManager.directRender
            // when you call this._scene.postProcessManager.directRender, it has 4 side effects:
            // 1. binds the framebuffer
            // 2. setAlphaMode(ALPHA_DISABLE)
            // 3. setDepthBuffer(true)
            // 4. setDepthWrite(true)
            // glow layer and highlight layer are restore framebuffer and depends on other side effects
            // but for now 3 and 4 are not needed to resolve the state management issue, so we just restore alpha mode
            this._scene.getEngine().setAlphaMode(Constants.ALPHA_DISABLE);
        });
    }

    /**
     * Creates the main texture for the effect layer.
     */
    protected override _createMainTexture(): void {
        super._createMainTexture();
        // set the render list for selective rendering
        this._mainTexture.renderList = this._thinEffectLayer._selection;
    }

    /**
     * @returns whether or not the layer needs stencil enabled during the mesh rendering.
     */
    public needStencil(): boolean {
        return this._thinEffectLayer.needStencil();
    }

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        return this._thinEffectLayer.isReady(subMesh, useInstances);
    }

    /**
     * Implementation specific of rendering the generating effect on the main canvas.
     * @param effect The effect used to render through
     * @param renderIndex
     */
    protected _internalRender(effect: Effect, renderIndex: number): void {
        this._thinEffectLayer._internalCompose(effect, renderIndex);
    }

    /**
     * @returns true if the layer contains information to display, otherwise false.
     */
    public override shouldRender(): boolean {
        return this._thinEffectLayer.shouldRender();
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    protected override _shouldRenderMesh(mesh: Mesh): boolean {
        return this._thinEffectLayer._shouldRenderMesh(mesh);
    }

    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    protected override _canRenderMesh(mesh: AbstractMesh, material: Material): boolean {
        return this._thinEffectLayer._canRenderMesh(mesh, material);
    }

    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    protected override _addCustomEffectDefines(defines: string[]): void {
        this._thinEffectLayer._addCustomEffectDefines(defines);
    }

    /**
     * Sets the required values for both the emissive texture and and the main color.
     * @param mesh
     * @param subMesh
     * @param material
     */
    protected _setEmissiveTextureAndColor(mesh: Mesh, subMesh: SubMesh, material: Material): void {
        this._thinEffectLayer._setEmissiveTextureAndColor(mesh, subMesh, material);
    }

    /**
     * Determine if a given mesh will be highlighted by the current SelectionOutlineLayer
     * @param mesh mesh to test
     * @returns true if the mesh will be highlighted by the current SelectionOutlineLayer
     */
    public override hasMesh(mesh: AbstractMesh): boolean {
        return this._thinEffectLayer.hasMesh(mesh);
    }

    /**
     * Remove all the meshes currently referenced in the selection outline layer
     */
    public clearSelection(): void {
        this._thinEffectLayer.clearSelection();
        this._mainTexture.renderList = this._thinEffectLayer._selection; // update render list
    }

    /**
     * Adds mesh or group of mesh to the current selection
     *
     * If a group of meshes is provided, they will outline as a single unit
     * @param meshOrGroup Meshes to add to the selection
     */
    public addSelection(meshOrGroup: AbstractMesh | AbstractMesh[]): void {
        this._thinEffectLayer.addSelection(meshOrGroup);
    }

    /**
     * Free any resources and references associated to a mesh.
     * Internal use
     * @param mesh The mesh to free.
     * @internal
     */
    public _disposeMesh(mesh: Mesh): void {
        this._thinEffectLayer._disposeMesh(mesh);
    }

    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    public override getClassName(): string {
        return "SelectionOutlineLayer";
    }

    /**
     * Serializes this SelectionOutline layer
     * @returns a serialized SelectionOutline layer object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.SelectionOutlineLayer";

        // Selected meshes
        serializationObject.selection = [];

        const selection = this._thinEffectLayer._selection;
        if (selection) {
            const meshUniqueIdToSelectionId = this._thinEffectLayer._meshUniqueIdToSelectionId;

            // selection can be sparse since _removeMesh can remove entries
            const selectionMap: {
                [uniqueId: number]: {
                    meshIds: string[];
                };
            } = {};

            for (let i = 0; i < selection.length; ++i) {
                const mesh = selection[i];
                const selectionId = meshUniqueIdToSelectionId[mesh.uniqueId];

                if (!selectionMap[selectionId]) {
                    selectionMap[selectionId] = {
                        meshIds: [],
                    };
                }
                selectionMap[selectionId].meshIds.push(mesh.id);
            }
            serializationObject.selection = selectionMap;
        }

        return serializationObject;
    }

    /**
     * Creates a SelectionOutline layer from parsed SelectionOutline layer data
     * @param parsedSelectionOutlineLayer defines the SelectionOutline layer data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing the SelectionOutline layer information
     * @returns a parsed SelectionOutline layer
     */
    public static override Parse(parsedSelectionOutlineLayer: any, scene: Scene, rootUrl: string): SelectionOutlineLayer {
        const selectionOutlineLayer = SerializationHelper.Parse(
            () => new SelectionOutlineLayer(parsedSelectionOutlineLayer.name, scene, parsedSelectionOutlineLayer.options),
            parsedSelectionOutlineLayer,
            scene,
            rootUrl
        );

        const selectionMap = parsedSelectionOutlineLayer.selection as { [uniqueId: number]: { meshIds: string[] } };

        // Selected meshes
        for (const outlinedMeshes of Object.values(selectionMap)) {
            const meshes: AbstractMesh[] = [];
            for (let meshIndex = 0; meshIndex < outlinedMeshes.meshIds.length; meshIndex++) {
                const meshId = outlinedMeshes.meshIds[meshIndex];
                const mesh = scene.getMeshById(meshId);
                if (mesh) {
                    meshes.push(mesh);
                }
            }

            selectionOutlineLayer.addSelection(meshes);
        }

        return selectionOutlineLayer;
    }
}

RegisterClass("BABYLON.SelectionOutlineLayer", SelectionOutlineLayer);
