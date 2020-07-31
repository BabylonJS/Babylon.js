import { PBREnvironment, EnvironmentDeserializer } from "./environmentSerializer";
import { Scene } from "babylonjs/scene";
import { Vector3, Quaternion, Matrix, TmpVectors } from "babylonjs/Maths/math.vector";
import { SphericalPolynomial } from "babylonjs/Maths/sphericalPolynomial";
import { ShadowLight } from "babylonjs/Lights/shadowLight";
import { TextureUtils } from "./texture";
import { Axis } from "babylonjs/Maths/math.axis";

/**
 * The ViewerLabs class will hold functions that are not (!) backwards compatible.
 * The APIs in all labs-related classes and configuration  might change.
 * Once stable, lab features will be moved to the publis API and configuration object.
 */
export class ViewerLabs {

    constructor(private _scene: Scene) { }

    public assetsRootURL: string;
    public environment: PBREnvironment = {
        //irradiance
        irradiancePolynomialCoefficients: {
            x: new Vector3(0, 0, 0),
            y: new Vector3(0, 0, 0),
            z: new Vector3(0, 0, 0),
            xx: new Vector3(0, 0, 0),
            yy: new Vector3(0, 0, 0),
            zz: new Vector3(0, 0, 0),
            yz: new Vector3(0, 0, 0),
            zx: new Vector3(0, 0, 0),
            xy: new Vector3(0, 0, 0)
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
            if (onSuccess) { onSuccess(this.environment); }
        } else if (typeof data === 'string') {
            let url = this.getAssetUrl(data);
            this._scene._loadFile(
                url,
                (arrayBuffer: ArrayBuffer) => {
                    this.environment = EnvironmentDeserializer.Parse(arrayBuffer);
                    if (onSuccess) { onSuccess(this.environment); }
                },
                (progressEvent) => { if (onProgress) { onProgress(progressEvent.loaded, progressEvent.total); } },
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
            if (onSuccess) { onSuccess(data); }
        }
    }

    /**
     * Applies an `EnvironmentMapConfiguration` to the scene
     * @param environmentMapConfiguration Environment map configuration to apply
     */
    public applyEnvironmentMapConfiguration(rotationY?: number) {
        if (!this.environment) { return; }

        //set orientation
        let rotatquatRotationionY = Quaternion.RotationAxis(Axis.Y, rotationY || 0);

        // Add env texture to the scene.
        if (this.environment.specularTexture) {
            // IE crashes when disposing the old texture and setting a new one
            if (!this._scene.environmentTexture) {
                this._scene.environmentTexture = TextureUtils.GetBabylonCubeTexture(this._scene, this.environment.specularTexture, false, true);
            }
            if (this._scene.environmentTexture) {
                this._scene.environmentTexture.level = this.environment.textureIntensityScale;
                this._scene.environmentTexture.invertZ = true;
                this._scene.environmentTexture.lodLevelInAlpha = true;

                var poly = this._scene.environmentTexture.sphericalPolynomial || new SphericalPolynomial();
                poly.x = this.environment.irradiancePolynomialCoefficients.x;
                poly.y = this.environment.irradiancePolynomialCoefficients.y;
                poly.z = this.environment.irradiancePolynomialCoefficients.z;
                poly.xx = this.environment.irradiancePolynomialCoefficients.xx;
                poly.xy = this.environment.irradiancePolynomialCoefficients.xy;
                poly.yy = this.environment.irradiancePolynomialCoefficients.yy;
                poly.yz = this.environment.irradiancePolynomialCoefficients.yz;
                poly.zx = this.environment.irradiancePolynomialCoefficients.zx;
                poly.zz = this.environment.irradiancePolynomialCoefficients.zz;
                this._scene.environmentTexture.sphericalPolynomial = poly;

                //set orientation
                Matrix.FromQuaternionToRef(rotatquatRotationionY, this._scene.environmentTexture.getReflectionTextureMatrix());
            }
        }
    }

    /**
     * Get an environment asset url by using the configuration if the path is not absolute.
     * @param url Asset url
     * @returns The Asset url using the `environmentAssetsRootURL` if the url is not an absolute path.
     */
    public getAssetUrl(url: string): string {
        let returnUrl = url;
        if (url && url.toLowerCase().indexOf("//") === -1) {
            if (!this.assetsRootURL) {
                // Tools.Warn("Please, specify the root url of your assets before loading the configuration (labs.environmentAssetsRootURL) or disable the background through the viewer options.");
                return url;
            }

            returnUrl = this.assetsRootURL + returnUrl;
        }

        return returnUrl;
    }

    public rotateShadowLight(shadowLight: ShadowLight, amount: number, point = Vector3.Zero(), axis = Axis.Y, target = Vector3.Zero()) {
        axis.normalize();
        point.subtractToRef(shadowLight.position, TmpVectors.Vector3[0]);
        Matrix.TranslationToRef(TmpVectors.Vector3[0].x, TmpVectors.Vector3[0].y, TmpVectors.Vector3[0].z, TmpVectors.Matrix[0]);
        TmpVectors.Matrix[0].invertToRef(TmpVectors.Matrix[2]);
        Matrix.RotationAxisToRef(axis, amount, TmpVectors.Matrix[1]);
        TmpVectors.Matrix[2].multiplyToRef(TmpVectors.Matrix[1], TmpVectors.Matrix[2]);
        TmpVectors.Matrix[2].multiplyToRef(TmpVectors.Matrix[0], TmpVectors.Matrix[2]);

        TmpVectors.Matrix[2].decompose(TmpVectors.Vector3[0], TmpVectors.Quaternion[0], TmpVectors.Vector3[1]);

        shadowLight.position.addInPlace(TmpVectors.Vector3[1]);

        shadowLight.setDirectionToTarget(target);
    }

}