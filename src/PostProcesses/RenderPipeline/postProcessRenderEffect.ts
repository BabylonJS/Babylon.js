import { Nullable } from "../../types";
import { Tools } from "../../Misc/tools";
import { Camera } from "../../Cameras/camera";
import { PostProcess } from "../../PostProcesses/postProcess";
import { Engine } from "../../Engines/engine";
/**
 * This represents a set of one or more post processes in Babylon.
 * A post process can be used to apply a shader to a texture after it is rendered.
 * @example https://doc.babylonjs.com/how_to/how_to_use_postprocessrenderpipeline
 */
export class PostProcessRenderEffect {
    private _postProcesses: { [Key: string]: Array<PostProcess> };
    private _getPostProcesses: () => Nullable<PostProcess | Array<PostProcess>>;

    private _singleInstance: boolean;

    private _cameras: { [key: string]: Nullable<Camera> };
    private _indicesForCamera: { [key: string]: number[] };

    /**
     * Name of the effect
     * @hidden
     */
    public _name: string;

    /**
     * Instantiates a post process render effect.
     * A post process can be used to apply a shader to a texture after it is rendered.
     * @param engine The engine the effect is tied to
     * @param name The name of the effect
     * @param getPostProcesses A function that returns a set of post processes which the effect will run in order to be run.
     * @param singleInstance False if this post process can be run on multiple cameras. (default: true)
     */
    constructor(engine: Engine, name: string, getPostProcesses: () => Nullable<PostProcess | Array<PostProcess>>, singleInstance?: boolean) {
        this._name = name;
        this._singleInstance = singleInstance || true;

        this._getPostProcesses = getPostProcesses;

        this._cameras = {};
        this._indicesForCamera = {};

        this._postProcesses = {};
    }

    /**
     * Checks if all the post processes in the effect are supported.
     */
    public get isSupported(): boolean {
        for (var index in this._postProcesses) {
            if (this._postProcesses.hasOwnProperty(index)) {
                let pps = this._postProcesses[index];
                for (var ppIndex = 0; ppIndex < pps.length; ppIndex++) {
                    if (!pps[ppIndex].isSupported) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Updates the current state of the effect
     * @hidden
     */
    public _update(): void {
    }

    /**
     * Attaches the effect on cameras
     * @param cameras The camera to attach to.
     * @hidden
     */
    public _attachCameras(cameras: Camera): void;
    /**
     * Attaches the effect on cameras
     * @param cameras The camera to attach to.
     * @hidden
     */
    public _attachCameras(cameras: Camera[]): void;
    /**
     * Attaches the effect on cameras
     * @param cameras The camera to attach to.
     * @hidden
     */
    public _attachCameras(cameras: any): void {
        var cameraKey;

        var cams = Tools.MakeArray(cameras || this._cameras);

        if (!cams) {
            return;
        }

        for (var i = 0; i < cams.length; i++) {
            var camera = cams[i];
            if (!camera) {
                continue;
            }

            var cameraName = camera.name;

            if (this._singleInstance) {
                cameraKey = 0;
            }
            else {
                cameraKey = cameraName;
            }

            if (!this._postProcesses[cameraKey]) {
                var postProcess = this._getPostProcesses();
                if (postProcess) {
                    this._postProcesses[cameraKey] = Array.isArray(postProcess) ? postProcess : [postProcess];
                }
            }

            if (!this._indicesForCamera[cameraName]) {
                this._indicesForCamera[cameraName] = [];
            }

            this._postProcesses[cameraKey].forEach((postProcess: PostProcess) => {
                var index = camera.attachPostProcess(postProcess);

                this._indicesForCamera[cameraName].push(index);
            });

            if (!this._cameras[cameraName]) {
                this._cameras[cameraName] = camera;
            }

        }
    }

    /**
     * Detaches the effect on cameras
     * @param cameras The camera to detatch from.
     * @hidden
     */
    public _detachCameras(cameras: Camera): void;
    /**
     * Detatches the effect on cameras
     * @param cameras The camera to detatch from.
     * @hidden
     */
    public _detachCameras(cameras: Camera[]): void;
    /**
     * Detatches the effect on cameras
     * @param cameras The camera to detatch from.
     * @hidden
     */
    public _detachCameras(cameras: any): void {
        var cams = Tools.MakeArray(cameras || this._cameras);

        if (!cams) {
            return;
        }

        for (var i = 0; i < cams.length; i++) {
            var camera: Camera = cams[i];
            var cameraName: string = camera.name;
            const postProcesses = this._postProcesses[this._singleInstance ? 0 : cameraName];

            if (postProcesses) {
                postProcesses.forEach((postProcess: PostProcess) => {
                    camera.detachPostProcess(postProcess);
                });
            }

            if (this._cameras[cameraName]) {
                this._cameras[cameraName] = null;
            }
        }
    }

    /**
     * Enables the effect on given cameras
     * @param cameras The camera to enable.
     * @hidden
     */
    public _enable(cameras: Camera): void;
    /**
     * Enables the effect on given cameras
     * @param cameras The camera to enable.
     * @hidden
     */
    public _enable(cameras: Nullable<Camera[]>): void;
    /**
     * Enables the effect on given cameras
     * @param cameras The camera to enable.
     * @hidden
     */
    public _enable(cameras: any): void {
        var cams: Nullable<Array<Camera>> = Tools.MakeArray(cameras || this._cameras);

        if (!cams) {
            return;
        }

        for (var i = 0; i < cams.length; i++) {
            var camera = cams[i];
            var cameraName = camera.name;

            for (var j = 0; j < this._indicesForCamera[cameraName].length; j++) {
                if (camera._postProcesses[this._indicesForCamera[cameraName][j]] === undefined || camera._postProcesses[this._indicesForCamera[cameraName][j]] === null) {
                    this._postProcesses[this._singleInstance ? 0 : cameraName].forEach((postProcess) => {
                        cams![i].attachPostProcess(postProcess, this._indicesForCamera[cameraName][j]);
                    });
                }
            }
        }
    }

    /**
     * Disables the effect on the given cameras
     * @param cameras The camera to disable.
     * @hidden
     */
    public _disable(cameras: Camera): void;
    /**
     * Disables the effect on the given cameras
     * @param cameras The camera to disable.
     * @hidden
     */
    public _disable(cameras: Nullable<Camera[]>): void;
    /**
     * Disables the effect on the given cameras
     * @param cameras The camera to disable.
     * @hidden
     */
    public _disable(cameras: any): void {
        var cams: Nullable<Array<Camera>> = Tools.MakeArray(cameras || this._cameras);

        if (!cams) {
            return;
        }

        for (var i = 0; i < cams.length; i++) {
            var camera = cams[i];
            var cameraName = camera.name;
            this._postProcesses[this._singleInstance ? 0 : cameraName].forEach((postProcess) => {
                camera.detachPostProcess(postProcess);
            });
        }
    }

    /**
     * Gets a list of the post processes contained in the effect.
     * @param camera The camera to get the post processes on.
     * @returns The list of the post processes in the effect.
     */
    public getPostProcesses(camera?: Camera): Nullable<Array<PostProcess>> {
        if (this._singleInstance) {
            return this._postProcesses[0];
        }
        else {
            if (!camera) {
                return null;
            }
            return this._postProcesses[camera.name];
        }
    }
}
