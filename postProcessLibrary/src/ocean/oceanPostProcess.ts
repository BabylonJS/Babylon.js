import { TargetCamera } from "babylonjs/Cameras/targetCamera";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { MirrorTexture } from "babylonjs/Materials/Textures/mirrorTexture";
import { RenderTargetTexture } from "babylonjs/Materials/Textures/renderTargetTexture";
import { GeometryBufferRenderer } from "babylonjs/Rendering/geometryBufferRenderer";
import { Effect } from "babylonjs/Materials/effect";
import { PostProcess } from "babylonjs/PostProcesses/postProcess";
import { Vector2, Vector3, Plane, Matrix, Epsilon } from "babylonjs/Maths/math";
import { Nullable } from "babylonjs/types";

import "./oceanPostProcess.fragment";

/**
 * Option available in the Ocean Post Process.
 */
export interface IOceanPostProcessOptions {
    /**
     * The size of the reflection RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
     */
    reflectionSize?: number | { width: number; height: number } | { ratio: number };
    /**
     * The size of the refraction RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
     */
    refractionSize?: number | { width: number; height: number } | { ratio: number };
}

/**
 * OceanPostProcess helps rendering an infinite ocean surface that can reflect and refract environment.
 *
 * Simmply add it to your scene and let the nerd that lives in you have fun.
 * Example usage:
 *  var pp = new OceanPostProcess("myOcean", camera);
 *  pp.reflectionEnabled = true;
 *  pp.refractionEnabled = true;
 */
export class OceanPostProcess extends PostProcess {

    /**
     * Gets a boolean indicating if the real-time reflection is enabled on the ocean.
     */
    public get reflectionEnabled(): boolean {
        return this._reflectionEnabled;
    }

    /**
     * Sets weither or not the real-time reflection is enabled on the ocean.
     * Is set to true, the reflection mirror texture will be used as reflection texture.
     */
    public set reflectionEnabled(enabled: boolean) {
        if (this._reflectionEnabled === enabled) {
            return;
        }

        this._reflectionEnabled = enabled;
        this.updateEffect(this._getDefines());

        // Remove or add custom render target
        const customRenderTargets = this.getCamera().getScene().customRenderTargets;
        if (!enabled) {
            const index = customRenderTargets.indexOf(this.reflectionTexture);
            if (index !== -1) {
                customRenderTargets.splice(index, 1);
            }
        } else {
            customRenderTargets.push(this.reflectionTexture);
        }
    }

    /**
     * Gets a boolean indicating if the real-time refraction is enabled on the ocean.
     */
    public get refractionEnabled(): boolean {
        return this._refractionEnabled;
    }

    /**
     * Sets weither or not the real-time refraction is enabled on the ocean.
     * Is set to true, the refraction render target texture will be used as refraction texture.
     */
    public set refractionEnabled(enabled: boolean) {
        if (this._refractionEnabled === enabled) {
            return;
        }

        this._refractionEnabled = enabled;
        this.updateEffect(this._getDefines());

        // Remove or add custom render target
        const customRenderTargets = this.getCamera().getScene().customRenderTargets;
        if (!enabled) {
            const index = customRenderTargets.indexOf(this.refractionTexture);
            if (index !== -1) {
                customRenderTargets.splice(index, 1);
            }
        } else {
            customRenderTargets.push(this.refractionTexture);
        }
    }

    /**
     * Gets wether or not the post-processes is supported by the running hardware.
     * This requires draw buffer supports.
     */
    public get isSupported(): boolean {
        return this._geometryRenderer !== null && this._geometryRenderer.isSupported;
    }

    /**
     * This is the reflection mirror texture used to display reflections on the ocean.
     * By default, render list is empty.
     */
    public reflectionTexture: MirrorTexture;
    /**
     * This is the refraction render target texture used to display refraction on the ocean.
     * By default, render list is empty.
     */
    public refractionTexture: RenderTargetTexture;

    private _time: number = 0;
    private _cameraRotation: Vector3 = Vector3.Zero();
    private _cameraViewMatrix: Matrix = Matrix.Identity();
    private _reflectionEnabled: boolean = false;
    private _refractionEnabled: boolean = false;
    private _geometryRenderer: Nullable<GeometryBufferRenderer>;

    /**
     * Instantiates a new Ocean Post Process.
     * @param name the name to give to the postprocess.
     * @camera the camera to apply the post process to.
     * @param options optional object following the IOceanPostProcessOptions format used to customize reflection and refraction render targets sizes.
     */
    constructor(name: string, camera: TargetCamera, options: IOceanPostProcessOptions = { }) {
        super(name,
            "oceanPostProcess",
            ["time", "resolution", "cameraPosition", "cameraRotation"],
            ["positionSampler", "reflectionSampler", "refractionSampler"],
            {
                width: camera.getEngine().getRenderWidth(),
                height: camera.getEngine().getRenderHeight()
            },
            camera,
            Texture.TRILINEAR_SAMPLINGMODE,
            camera.getEngine(),
            true);

        // Get geometry shader
        this._geometryRenderer = camera.getScene().enableGeometryBufferRenderer(1.0);
        if (this._geometryRenderer && this._geometryRenderer.isSupported) {
            // Eanble position buffer
            this._geometryRenderer.enablePosition = true;

            // Create mirror textures
            this.reflectionTexture = new MirrorTexture("oceanPostProcessReflection", options.reflectionSize || { width: 512, height: 512 }, camera.getScene());
            this.reflectionTexture.mirrorPlane = Plane.FromPositionAndNormal(Vector3.Zero(), new Vector3(0, -1, 0));

            this.refractionTexture = new RenderTargetTexture("oceanPostProcessRefraction", options.refractionSize || { width: 512, height: 512 }, camera.getScene());
        } else {
            this.updateEffect("#define NOT_SUPPORTED\n");
        }

        // On apply the post-process
        this.onApply = (effect: Effect) => {
            if (!this._geometryRenderer || !this._geometryRenderer.isSupported) {
                return;
            }

            const engine = camera.getEngine();
            const scene = camera.getScene();

            this._time += engine.getDeltaTime() * 0.001;
            effect.setFloat("time", this._time);

            effect.setVector2("resolution", new Vector2(engine.getRenderWidth(), engine.getRenderHeight()));

            if (scene) {
                // Position
                effect.setVector3("cameraPosition", camera.globalPosition);

                // Rotation
                this._computeCameraRotation(camera);
                effect.setVector3("cameraRotation", this._cameraRotation);

                // Samplers
                effect.setTexture("positionSampler", this._geometryRenderer.getGBuffer().textures[2]);

                if (this._reflectionEnabled) {
                    effect.setTexture("reflectionSampler", this.reflectionTexture);
                }
                if (this._refractionEnabled) {
                    effect.setTexture("refractionSampler", this.refractionTexture);
                }
            }
        };
    }

    /**
     * Returns the appropriate defines according to the current configuration.
     */
    private _getDefines(): string {
        const defines: string[] = [];

        if (this._reflectionEnabled) {
            defines.push("#define REFLECTION_ENABLED");
        }

        if (this._refractionEnabled) {
            defines.push("#define REFRACTION_ENABLED");
        }

        return defines.join("\n");
    }

    /**
     * Computes the current camera rotation as the shader requires a camera rotation.
     */
    private _computeCameraRotation(camera: TargetCamera): void {
        camera.upVector.normalize();
        const target = camera.getTarget();
        camera._initialFocalDistance = target.subtract(camera.position).length();
        if (camera.position.z === target.z) {
            camera.position.z += Epsilon;
        }

        const direction = target.subtract(camera.position);
        camera._viewMatrix.invertToRef(this._cameraViewMatrix);

        this._cameraRotation.x = Math.atan(this._cameraViewMatrix.m[6] / this._cameraViewMatrix.m[10]);

        if (direction.x >= 0.0) {
            this._cameraRotation.y = (-Math.atan(direction.z / direction.x) + Math.PI / 2.0);
        } else {
            this._cameraRotation.y = (-Math.atan(direction.z / direction.x) - Math.PI / 2.0);
        }

        this._cameraRotation.z = 0;

        if (isNaN(this._cameraRotation.x)) {
            this._cameraRotation.x = 0;
        }

        if (isNaN(this._cameraRotation.y)) {
            this._cameraRotation.y = 0;
        }

        if (isNaN(this._cameraRotation.z)) {
            this._cameraRotation.z = 0;
        }
    }
}
