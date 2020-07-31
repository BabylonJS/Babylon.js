import { serializeAsMeshReference, serializeAsVector3, SerializationHelper } from "../Misc/decorators";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Nullable } from "../types";
import { AbstractScene } from "../abstractScene";
import { Scene } from "../scene";
import { Constants } from "../Engines/constants";

declare module "../abstractScene" {
    export interface AbstractScene {
        /**
         * The list of reflection probes added to the scene
         * @see http://doc.babylonjs.com/how_to/how_to_use_reflection_probes
         */
        reflectionProbes: Array<ReflectionProbe>;

        /**
         * Removes the given reflection probe from this scene.
         * @param toRemove The reflection probe to remove
         * @returns The index of the removed reflection probe
         */
        removeReflectionProbe(toRemove: ReflectionProbe): number;

        /**
         * Adds the given reflection probe to this scene.
         * @param newReflectionProbe The reflection probe to add
         */
        addReflectionProbe(newReflectionProbe: ReflectionProbe): void;
    }
}

AbstractScene.prototype.removeReflectionProbe = function(toRemove: ReflectionProbe): number {
    if (!this.reflectionProbes) {
        return -1;
    }

    var index = this.reflectionProbes.indexOf(toRemove);
    if (index !== -1) {
        this.reflectionProbes.splice(index, 1);
    }

    return index;
};

AbstractScene.prototype.addReflectionProbe = function(newReflectionProbe: ReflectionProbe): void {
    if (!this.reflectionProbes) {
        this.reflectionProbes = [];
    }

    this.reflectionProbes.push(newReflectionProbe);
};

/**
 * Class used to generate realtime reflection / refraction cube textures
 * @see http://doc.babylonjs.com/how_to/how_to_use_reflection_probes
 */
export class ReflectionProbe {
    private _scene: Scene;
    private _renderTargetTexture: RenderTargetTexture;
    private _projectionMatrix: Matrix;
    private _viewMatrix = Matrix.Identity();
    private _target = Vector3.Zero();
    private _add = Vector3.Zero();
    @serializeAsMeshReference()
    private _attachedMesh: Nullable<AbstractMesh>;

    private _invertYAxis = false;

    /** Gets or sets probe position (center of the cube map) */
    @serializeAsVector3()
    public position = Vector3.Zero();

    /**
     * Creates a new reflection probe
     * @param name defines the name of the probe
     * @param size defines the texture resolution (for each face)
     * @param scene defines the hosting scene
     * @param generateMipMaps defines if mip maps should be generated automatically (true by default)
     * @param useFloat defines if HDR data (flaot data) should be used to store colors (false by default)
     */
    constructor(
        /** defines the name of the probe */
        public name: string,
        size: number, scene: Scene, generateMipMaps = true, useFloat = false) {
        this._scene = scene;

        // Create the scene field if not exist.
        if (!this._scene.reflectionProbes) {
            this._scene.reflectionProbes = new Array<ReflectionProbe>();
        }
        this._scene.reflectionProbes.push(this);

        let textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (useFloat) {
            const caps = this._scene.getEngine().getCaps();
            if (caps.textureHalfFloatRender) {
                textureType = Constants.TEXTURETYPE_HALF_FLOAT;
            }
            else if (caps.textureFloatRender) {
                textureType = Constants.TEXTURETYPE_FLOAT;
            }
        }
        this._renderTargetTexture = new RenderTargetTexture(name, size, scene, generateMipMaps, true, textureType, true);

        this._renderTargetTexture.realTimeFiltering = true;

        this._renderTargetTexture.onBeforeRenderObservable.add((faceIndex: number) => {
            switch (faceIndex) {
                case 0:
                    this._add.copyFromFloats(1, 0, 0);
                    break;
                case 1:
                    this._add.copyFromFloats(-1, 0, 0);
                    break;
                case 2:
                    this._add.copyFromFloats(0, this._invertYAxis ? 1 : -1, 0);
                    break;
                case 3:
                    this._add.copyFromFloats(0, this._invertYAxis ? -1 : 1, 0);
                    break;
                case 4:
                    this._add.copyFromFloats(0, 0, 1);
                    break;
                case 5:
                    this._add.copyFromFloats(0, 0, -1);
                    break;

            }

            if (this._attachedMesh) {
                this.position.copyFrom(this._attachedMesh.getAbsolutePosition());
            }

            this.position.addToRef(this._add, this._target);

            Matrix.LookAtLHToRef(this.position, this._target, Vector3.Up(), this._viewMatrix);

            if (scene.activeCamera) {
                this._projectionMatrix = Matrix.PerspectiveFovLH(Math.PI / 2, 1, scene.activeCamera.minZ, scene.activeCamera.maxZ);
                scene.setTransformMatrix(this._viewMatrix, this._projectionMatrix);
            }

            scene._forcedViewPosition = this.position;
        });

        this._renderTargetTexture.onAfterUnbindObservable.add(() => {
            scene._forcedViewPosition = null;
            scene.updateTransformMatrix(true);
        });
    }

    /** Gets or sets the number of samples to use for multi-sampling (0 by default). Required WebGL2 */
    public get samples(): number {
        return this._renderTargetTexture.samples;
    }

    public set samples(value: number) {
        this._renderTargetTexture.samples = value;
    }

    /** Gets or sets the refresh rate to use (on every frame by default) */
    public get refreshRate(): number {
        return this._renderTargetTexture.refreshRate;
    }

    public set refreshRate(value: number) {
        this._renderTargetTexture.refreshRate = value;
    }

    /**
     * Gets the hosting scene
     * @returns a Scene
     */
    public getScene(): Scene {
        return this._scene;
    }

    /** Gets the internal CubeTexture used to render to */
    public get cubeTexture(): RenderTargetTexture {
        return this._renderTargetTexture;
    }

    /** Gets the list of meshes to render */
    public get renderList(): Nullable<AbstractMesh[]> {
        return this._renderTargetTexture.renderList;
    }

    /**
     * Attach the probe to a specific mesh (Rendering will be done from attached mesh's position)
     * @param mesh defines the mesh to attach to
     */
    public attachToMesh(mesh: Nullable<AbstractMesh>): void {
        this._attachedMesh = mesh;
    }

    /**
     * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
     */
    public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void {
        this._renderTargetTexture.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil);
    }

    /**
     * Clean all associated resources
     */
    public dispose() {
        var index = this._scene.reflectionProbes.indexOf(this);

        if (index !== -1) {
            // Remove from the scene if found
            this._scene.reflectionProbes.splice(index, 1);
        }

        if (this._renderTargetTexture) {
            this._renderTargetTexture.dispose();
            (<any>this._renderTargetTexture) = null;
        }
    }

    /**
     * Converts the reflection probe information to a readable string for debug purpose.
     * @param fullDetails Supports for multiple levels of logging within scene loading
     * @returns the human readable reflection probe info
     */
    public toString(fullDetails?: boolean): string {
        var ret = "Name: " + this.name;

        if (fullDetails) {
            ret += ", position: " + this.position.toString();

            if (this._attachedMesh) {
                ret += ", attached mesh: " + this._attachedMesh.name;
            }
        }

        return ret;
    }

    /**
     * Get the class name of the relfection probe.
     * @returns "ReflectionProbe"
     */
    public getClassName(): string {
        return "ReflectionProbe";
    }

    /**
     * Serialize the reflection probe to a JSON representation we can easily use in the resepective Parse function.
     * @returns The JSON representation of the texture
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this, this._renderTargetTexture.serialize());
        serializationObject.isReflectionProbe = true;

        return serializationObject;
    }

    /**
     * Parse the JSON representation of a reflection probe in order to recreate the reflection probe in the given scene.
     * @param parsedReflectionProbe Define the JSON representation of the reflection probe
     * @param scene Define the scene the parsed reflection probe should be instantiated in
     * @param rootUrl Define the root url of the parsing sequence in the case of relative dependencies
     * @returns The parsed reflection probe if successful
     */
    public static Parse(parsedReflectionProbe: any, scene: Scene, rootUrl: string): Nullable<ReflectionProbe> {
        let reflectionProbe: Nullable<ReflectionProbe> = null;
        if (scene.reflectionProbes) {
            for (let index = 0; index < scene.reflectionProbes.length; index++) {
                const rp = scene.reflectionProbes[index];
                if (rp.name === parsedReflectionProbe.name) {
                    reflectionProbe = rp;
                    break;
                }
            }
        }

        reflectionProbe = SerializationHelper.Parse(() => reflectionProbe || new ReflectionProbe(parsedReflectionProbe.name, parsedReflectionProbe.renderTargetSize, scene, parsedReflectionProbe._generateMipMaps), parsedReflectionProbe, scene, rootUrl);
        reflectionProbe.cubeTexture._waitingRenderList = parsedReflectionProbe.renderList;

        if (parsedReflectionProbe._attachedMesh) {
            reflectionProbe.attachToMesh(scene.getMeshByID(parsedReflectionProbe._attachedMesh));
        }

        return reflectionProbe;
    }
}
