import { PBREnvironment, EnvironmentDeserializer } from "./environmentSerializer";
import { SceneManager } from '../viewer/sceneManager';

import { Tools, Quaternion } from 'babylonjs';
import { ViewerConfiguration } from "../configuration/configuration";
import { TextureUtils } from "./texture";

export class ViewerLabs {

    constructor(private _sceneManager: SceneManager) { }

    public environmentAssetsRootURL: string;
    public environment: PBREnvironment = {
        //irradiance
        irradiancePolynomialCoefficients: {
            x: new BABYLON.Vector3(0, 0, 0),
            y: new BABYLON.Vector3(0, 0, 0),
            z: new BABYLON.Vector3(0, 0, 0),
            xx: new BABYLON.Vector3(0, 0, 0),
            yy: new BABYLON.Vector3(0, 0, 0),
            zz: new BABYLON.Vector3(0, 0, 0),
            yz: new BABYLON.Vector3(0, 0, 0),
            zx: new BABYLON.Vector3(0, 0, 0),
            xy: new BABYLON.Vector3(0, 0, 0)
        },

        textureIntensityScale: 1.0
    };

    /**
         * Loads an environment map from a given URL
         * @param url URL of environment map
         * @param onSuccess Callback fired after environment successfully applied to the scene
         * @param onProgress Callback fired at progress events while loading the environment map
         * @param onError Callback fired when the load fails
         */
    public loadEnvironment(url: string, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    /**
     * Loads an environment map from a given URL
     * @param buffer ArrayBuffer containing environment map
     * @param onSuccess Callback fired after environment successfully applied to the scene
     * @param onProgress Callback fired at progress events while loading the environment map
     * @param onError Callback fired when the load fails
     */
    public loadEnvironment(buffer: ArrayBuffer, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    /**
     * Sets the environment to an already loaded environment
     * @param env PBREnvironment instance
     * @param onSuccess Callback fired after environment successfully applied to the scene
     * @param onProgress Callback fired at progress events while loading the environment map
     * @param onError Callback fired when the load fails
     */
    public loadEnvironment(env: PBREnvironment, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    public loadEnvironment(data: string | ArrayBuffer | PBREnvironment, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void {
        //@! todo: should loadEnvironment cancel any currently loading environments?
        if (data instanceof ArrayBuffer) {
            this.environment = EnvironmentDeserializer.Parse(data);
            if (onSuccess) onSuccess(this.environment);
        } else if (typeof data === 'string') {
            let url = this.getEnvironmentAssetUrl(data);
            this._sceneManager.scene._loadFile(
                url,
                (arrayBuffer: ArrayBuffer) => {
                    this.environment = EnvironmentDeserializer.Parse(arrayBuffer);
                    if (onSuccess) onSuccess(this.environment);
                },
                (progressEvent) => { if (onProgress) onProgress(progressEvent.loaded, progressEvent.total); },
                false,
                true,
                (r, e) => {
                    if (onError) {
                        onError(e);
                    }
                }
            );
        } else {
            //data assumed to be PBREnvironment object
            this.environment = data;
            if (onSuccess) onSuccess(data);
        }
    }

    /**
     * Applies an `EnvironmentMapConfiguration` to the scene
     * @param environmentMapConfiguration Environment map configuration to apply
     */
    public applyEnvironmentMapConfiguration(rotationY?: number) {
        if (!this.environment) return;

        //set orientation
        let rotatquatRotationionY = Quaternion.RotationAxis(BABYLON.Axis.Y, rotationY || 0);

        // Add env texture to the scene.
        if (this.environment.specularTexture) {
            // IE crashes when disposing the old texture and setting a new one
            if (!this._sceneManager.scene.environmentTexture) {
                this._sceneManager.scene.environmentTexture = TextureUtils.GetBabylonCubeTexture(this._sceneManager.scene, this.environment.specularTexture, false, true);
            }
            if (this._sceneManager.scene.environmentTexture) {
                this._sceneManager.scene.environmentTexture.level = this.environment.textureIntensityScale;
                this._sceneManager.scene.environmentTexture.invertZ = true;
                this._sceneManager.scene.environmentTexture.lodLevelInAlpha = true;

                var poly = this._sceneManager.scene.environmentTexture.sphericalPolynomial || new BABYLON.SphericalPolynomial();
                poly.x = this.environment.irradiancePolynomialCoefficients.x;
                poly.y = this.environment.irradiancePolynomialCoefficients.y;
                poly.z = this.environment.irradiancePolynomialCoefficients.z;
                poly.xx = this.environment.irradiancePolynomialCoefficients.xx;
                poly.xy = this.environment.irradiancePolynomialCoefficients.xy;
                poly.yy = this.environment.irradiancePolynomialCoefficients.yy;
                poly.yz = this.environment.irradiancePolynomialCoefficients.yz;
                poly.zx = this.environment.irradiancePolynomialCoefficients.zx;
                poly.zz = this.environment.irradiancePolynomialCoefficients.zz;
                this._sceneManager.scene.environmentTexture.sphericalPolynomial = poly;

                //set orientation
                BABYLON.Matrix.FromQuaternionToRef(rotatquatRotationionY, this._sceneManager.scene.environmentTexture.getReflectionTextureMatrix());
            }
        }
    }

    /**
     * Get an environment asset url by using the configuration if the path is not absolute.
     * @param url Asset url
     * @returns The Asset url using the `environmentAssetsRootURL` if the url is not an absolute path.
     */
    public getEnvironmentAssetUrl(url: string): string {
        let returnUrl = url;
        if (url && url.toLowerCase().indexOf("//") === -1) {
            if (!this.environmentAssetsRootURL) {
                Tools.Warn("Please, specify the root url of your assets before loading the configuration (labs.environmentAssetsRootURL) or disable the background through the viewer options.");
                return url;
            }

            returnUrl = this.environmentAssetsRootURL + returnUrl;
        }

        return returnUrl;
    }

}