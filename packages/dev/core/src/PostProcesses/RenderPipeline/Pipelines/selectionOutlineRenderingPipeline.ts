import type { Camera } from "../../../Cameras/camera";
import { Constants } from "../../../Engines/constants";
import type { Color3 } from "../../../Maths/math.color";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { Scene } from "../../../scene";
import type { Nullable } from "../../../types";

import { PostProcessRenderPipeline } from "../postProcessRenderPipeline";
import { serialize, serializeAsColor3 } from "../../../Misc/decorators";
import { RegisterClass } from "../../../Misc/typeStore";
import { SerializationHelper } from "../../../Misc/decorators.serialization";
import { GeometryBufferRenderer } from "../../../Rendering/geometryBufferRenderer";
import type { PrePassRenderer } from "../../../Rendering/prePassRenderer";
import { SelectionMaskRenderer } from "../../../Rendering/selectionMaskRenderer";
import { PostProcess } from "../../postProcess";
import { ThinSelectionOutlinePostProcess } from "../../thinSelectionOutlinePostProcess";
import type { Effect } from "../../../Materials/effect";
import { SelectionOutlineConfiguration } from "../../../Rendering/selectionOutlineConfiguration";
import type { ISize } from "../../../Maths/math.size";
import { PostProcessRenderEffect } from "../postProcessRenderEffect";

/**
 * Selection outline rendering pipeline
 *
 * Use optimized brute force approach to render outlines around selected objects
 *
 * The selection rendering pipeline use two main steps:
 * 1. Render selected objects to a mask texture where r and g channels store selection ID and depth information
 * 2. Apply a post process that will use the mask texture to render outlines around selected objects
 */
export class SelectionOutlineRenderingPipeline extends PostProcessRenderPipeline {
    /**
     * The Selection Outline PostProcess effect id in the pipeline
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public SelectionOutlineEffect: string = "SelectionOutlineEffect";

    @serialize("msaaSamples")
    private _msaaSamples: number = 4;
    /**
     * Gets or sets the number of samples used for the outline post process
     */
    public get msaaSamples(): number {
        return this._msaaSamples;
    }
    public set msaaSamples(value: number) {
        this._msaaSamples = value;
        if (this._outlinePostProcess) {
            this._outlinePostProcess.samples = value;
        }
    }

    private _forcedGeometryBuffer: Nullable<GeometryBufferRenderer> = null;
    /**
     * Force rendering the geometry through geometry buffer.
     */
    @serialize()
    private _forceGeometryBuffer: boolean = false;
    private get _geometryBufferRenderer(): Nullable<GeometryBufferRenderer> {
        if (!this._forceGeometryBuffer) {
            return null;
        }
        return this._forcedGeometryBuffer ?? this._scene.geometryBufferRenderer;
    }
    private get _prePassRenderer(): Nullable<PrePassRenderer> {
        if (this._forceGeometryBuffer) {
            return null;
        }
        return this._scene.prePassRenderer;
    }

    /**
     * Gets or sets the outline color (default: (1, 0.5, 0) - orange)
     */
    @serializeAsColor3("outlineColor")
    public get outlineColor(): Color3 {
        return this._thinOutlinePostProcess.outlineColor;
    }
    public set outlineColor(value: Color3) {
        this._thinOutlinePostProcess.outlineColor = value;
    }

    /**
     * Gets or sets the outline thickness (default: 2.0)
     */
    @serialize("outlineThickness")
    public get outlineThickness(): number {
        return this._thinOutlinePostProcess.outlineThickness;
    }
    public set outlineThickness(value: number) {
        this._thinOutlinePostProcess.outlineThickness = value;
    }

    /**
     * Gets or sets the occlusion strength (default: 0.8)
     */
    @serialize("occlusionStrength")
    public get occlusionStrength(): number {
        return this._thinOutlinePostProcess.occlusionStrength;
    }
    public set occlusionStrength(value: number) {
        this._thinOutlinePostProcess.occlusionStrength = value;
    }

    private readonly _scene: Scene;
    private _isDirty: boolean = true;
    private _isDisposed: boolean = false;
    private readonly _camerasToBeAttached: Camera[] = [];
    private readonly _textureType: number;

    private readonly _thinOutlinePostProcess: ThinSelectionOutlinePostProcess;
    private _maskRenderer: Nullable<SelectionMaskRenderer> = null;
    private _outlinePostProcess: Nullable<PostProcess> = null;

    /**
     * Constructs a new selection outline rendering pipeline
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param cameras The array of cameras that the rendering pipeline will be attached to
     * @param forceGeometryBuffer Set to true if you want to use the legacy geometry buffer renderer. You can also pass an existing instance of GeometryBufferRenderer if you want to use your own geometry buffer renderer.
     * @param textureType The type of texture where the scene will be rendered (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     *
     */
    public constructor(
        name: string,
        scene: Scene,
        cameras?: Camera[],
        forceGeometryBuffer: boolean | GeometryBufferRenderer = false,
        textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ) {
        super(scene.getEngine(), name);

        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();

        this._scene = scene;
        this._textureType = textureType;
        if (forceGeometryBuffer instanceof GeometryBufferRenderer) {
            this._forceGeometryBuffer = true;
            this._forcedGeometryBuffer = forceGeometryBuffer;
        } else {
            this._forceGeometryBuffer = forceGeometryBuffer;
        }

        this._thinOutlinePostProcess = new ThinSelectionOutlinePostProcess(this._name, scene.getEngine());

        // Set up assets
        if (this._forceGeometryBuffer) {
            if (!this._forcedGeometryBuffer) {
                scene.enableGeometryBufferRenderer();
            }
        } else {
            scene.enablePrePassRenderer();
        }
    }

    /**
     * Get the class name
     * @returns "SelectionOutlineRenderingPipeline"
     */
    public override getClassName(): string {
        return "SelectionOutlineRenderingPipeline";
    }

    /**
     * Adds a camera to the pipeline
     * @param camera the camera to be added
     */
    public addCamera(camera: Camera): void {
        this._camerasToBeAttached.push(camera);
        this._isDirty = true;
        if (this._maskRenderer !== null) {
            // if pipeline is already built, build again
            this._buildPipeline();
        }
    }

    /**
     * Removes a camera from the pipeline
     * @param camera the camera to remove
     */
    public removeCamera(camera: Camera): void {
        const index = this._camerasToBeAttached.indexOf(camera);
        this._camerasToBeAttached.splice(index, 1);
        this._isDirty = true;
        if (this._maskRenderer !== null) {
            // if pipeline is already built, build again
            this._buildPipeline();
        }
    }

    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableGeometryBufferRenderer Set to true if you want to disable the Geometry Buffer renderer
     */
    public override dispose(disableGeometryBufferRenderer: boolean = false): void {
        if (this._isDisposed) {
            return;
        }

        this._disposePipeline();

        if (disableGeometryBufferRenderer && !this._forcedGeometryBuffer) {
            this._scene.disableGeometryBufferRenderer();
        }

        this._thinOutlinePostProcess.dispose();

        this._isDisposed = true;

        super.dispose();
    }

    private _getTextureSize(): ISize {
        const engine = this._scene.getEngine();
        const prePassRenderer = this._prePassRenderer;

        let textureSize: ISize = { width: engine.getRenderWidth(), height: engine.getRenderHeight() };

        if (prePassRenderer && this._scene.activeCamera?._getFirstPostProcess() === this._outlinePostProcess) {
            const renderTarget = prePassRenderer.getRenderTarget();

            if (renderTarget && renderTarget.textures) {
                textureSize = renderTarget.textures[prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE)].getSize();
            }
        } else if (this._outlinePostProcess!.inputTexture) {
            textureSize.width = this._outlinePostProcess!.inputTexture.width;
            textureSize.height = this._outlinePostProcess!.inputTexture.height;
        }

        return textureSize;
    }

    private _buildPipeline(): void {
        if (!this._isDirty || this._isDisposed) {
            return;
        }
        this._disposePipeline();
        this._isDirty = false;

        const scene = this._scene;
        this._maskRenderer = new SelectionMaskRenderer(this._name, scene);
        this._outlinePostProcess = this._createSelectionOutlinePostProcess(this._textureType);
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SelectionOutlineEffect,
                () => {
                    return this._outlinePostProcess;
                },
                true
            )
        );

        scene.postProcessRenderPipelineManager.addPipeline(this);
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
    }

    private _disposePipeline(): void {
        this._maskRenderer?.dispose();
        this._maskRenderer = null;

        if (this._outlinePostProcess) {
            for (let i = 0; i < this._cameras.length; i++) {
                const camera = this._cameras[i];
                this._outlinePostProcess.dispose(camera);
            }
            this._outlinePostProcess = null;
        }

        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
        // get back cameras to be used to reattach pipeline
        this._cameras = this._camerasToBeAttached.slice();
        this._reset();

        this._isDirty = true; // to allow rebuilding
    }

    private _createSelectionOutlinePostProcess(textureType: number): PostProcess {
        const outlinePostProcess = new PostProcess("selectionOutline", ThinSelectionOutlinePostProcess.FragmentUrl, {
            engine: this._scene.getEngine(),
            textureType,
            effectWrapper: this._thinOutlinePostProcess,
        });
        if (!this._forceGeometryBuffer) {
            outlinePostProcess._prePassEffectConfiguration = new SelectionOutlineConfiguration();
        }
        outlinePostProcess.samples = this._msaaSamples;
        outlinePostProcess.onApplyObservable.add((effect: Effect) => {
            if (this._geometryBufferRenderer) {
                effect.setTexture("depthSampler", this._geometryBufferRenderer.getGBuffer().textures[0]);
            } else if (this._prePassRenderer) {
                effect.setTexture("depthSampler", this._prePassRenderer.getRenderTarget().textures[this._prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)]);
            }

            const textureSize = this._getTextureSize();
            this._thinOutlinePostProcess.textureWidth = textureSize.width;
            this._thinOutlinePostProcess.textureHeight = textureSize.height;

            effect.setTexture("maskSampler", this._maskRenderer!.getMaskTexture());
        });

        return outlinePostProcess;
    }

    /**
     * Clears the current selection
     * @param disablePipeline If true, disables the pipeline until a new selection is set (default: false)
     */
    public clearSelection(disablePipeline: boolean = false): void {
        if (this._maskRenderer === null) {
            return;
        }

        this._maskRenderer.clearSelection();
        if (disablePipeline) {
            this._disposePipeline();
        }
    }

    /**
     * Adds meshe or group of meshes to the current selection
     *
     * If a group of meshes is provided, they will outline as a single unit
     * @param meshes Meshes to add to the selection
     */
    public addSelection(meshes: (AbstractMesh | AbstractMesh[])[]): void {
        this._buildPipeline();
        this._maskRenderer!.addSelection(meshes);
    }

    /**
     * Sets the current selection, replacing any previous selection
     *
     * If a group of meshes is provided, they will outline as a single unit
     * @param meshes Meshes to set as the current selection
     */
    public setSelection(meshes: (AbstractMesh | AbstractMesh[])[]): void {
        this._buildPipeline();
        this._maskRenderer!.setSelection(meshes);
    }

    /**
     * Gets the current selection
     */
    public get selection(): readonly AbstractMesh[] {
        if (this._maskRenderer === null) {
            return [];
        }
        return this._maskRenderer.selection;
    }

    /**
     * Serialize the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "SelectionOutlineRenderingPipeline";

        return serializationObject;
    }

    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): SelectionOutlineRenderingPipeline {
        return SerializationHelper.Parse(
            () => new SelectionOutlineRenderingPipeline(source._name, scene, undefined, source._forceGeometryBuffer, source._textureType),
            source,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.SelectionOutlineRenderingPipeline", SelectionOutlineRenderingPipeline);
