/* eslint-disable @typescript-eslint/naming-convention */
// import { serializeAsImageProcessingConfiguration } from "../Misc/decorators";
import type { Nullable } from "../types";
import type { ImageProcessingConfiguration } from "./imageProcessingConfiguration";
import type { Observer } from "../Misc/observable";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { ColorCurves } from "../Materials/colorCurves";

type ImageProcessingMixinConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin to add Image processing defines to your material defines
 * @internal
 */
export function ImageProcessingMixin<Tbase extends ImageProcessingMixinConstructor>(base: Tbase) {
    return class extends base {
        /**
         * Constructor for the ImageProcessingMixin.
         * @param args - arguments to pass to the base class constructor
         */
        constructor(...args: any[]) {
            super(...args);
            // Decorators don't work on this annonymous class
            // so I'm setting this up manually.
            // serializeAsImageProcessingConfiguration.call(this, this, "_imageProcessingConfiguration");
        }
        /**
         * Default configuration related to image processing available in the standard Material.
         */
        public _imageProcessingConfiguration: ImageProcessingConfiguration;

        /**
         * Gets the image processing configuration used either in this material.
         */
        public get imageProcessingConfiguration(): ImageProcessingConfiguration {
            return this._imageProcessingConfiguration;
        }

        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        public set imageProcessingConfiguration(value: ImageProcessingConfiguration) {
            this._attachImageProcessingConfiguration(value);

            // Ensure the effect will be rebuilt.
            if ((this as any)._markAllSubMeshesAsImageProcessingDirty) {
                (this as any)._markAllSubMeshesAsImageProcessingDirty();
            }
        }

        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        public _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>>;

        /**
         * Attaches a new image processing configuration to the Standard Material.
         * @param configuration
         */
        public _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void {
            if (configuration === this._imageProcessingConfiguration) {
                return;
            }

            // Detaches observer
            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }

            // Pick the scene configuration if needed
            if (!configuration && (this as any).getScene) {
                this._imageProcessingConfiguration = (this as any).getScene().imageProcessingConfiguration;
            } else if (configuration) {
                this._imageProcessingConfiguration = configuration;
            }

            // Attaches observer
            if (this._imageProcessingConfiguration) {
                this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                    // Ensure the effect will be rebuilt.
                    if ((this as any)._markAllSubMeshesAsImageProcessingDirty) {
                        (this as any)._markAllSubMeshesAsImageProcessingDirty();
                    }
                });
            }
        }

        /**
         * Gets whether the color curves effect is enabled.
         */
        public get cameraColorCurvesEnabled(): boolean {
            return this.imageProcessingConfiguration.colorCurvesEnabled;
        }
        /**
         * Sets whether the color curves effect is enabled.
         */
        public set cameraColorCurvesEnabled(value: boolean) {
            this.imageProcessingConfiguration.colorCurvesEnabled = value;
        }

        /**
         * Gets whether the color grading effect is enabled.
         */
        public get cameraColorGradingEnabled(): boolean {
            return this.imageProcessingConfiguration.colorGradingEnabled;
        }
        /**
         * Gets whether the color grading effect is enabled.
         */
        public set cameraColorGradingEnabled(value: boolean) {
            this.imageProcessingConfiguration.colorGradingEnabled = value;
        }

        /**
         * Gets whether tonemapping is enabled or not.
         */
        public get cameraToneMappingEnabled(): boolean {
            return this._imageProcessingConfiguration.toneMappingEnabled;
        }
        /**
         * Sets whether tonemapping is enabled or not
         */
        public set cameraToneMappingEnabled(value: boolean) {
            this._imageProcessingConfiguration.toneMappingEnabled = value;
        }

        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        public get cameraExposure(): number {
            return this._imageProcessingConfiguration.exposure;
        }
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        public set cameraExposure(value: number) {
            this._imageProcessingConfiguration.exposure = value;
        }

        /**
         * Gets The camera contrast used on this material.
         */
        public get cameraContrast(): number {
            return this._imageProcessingConfiguration.contrast;
        }

        /**
         * Sets The camera contrast used on this material.
         */
        public set cameraContrast(value: number) {
            this._imageProcessingConfiguration.contrast = value;
        }

        /**
         * Gets the Color Grading 2D Lookup Texture.
         */
        public get cameraColorGradingTexture(): Nullable<BaseTexture> {
            return this._imageProcessingConfiguration.colorGradingTexture;
        }
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        public set cameraColorGradingTexture(value: Nullable<BaseTexture>) {
            this._imageProcessingConfiguration.colorGradingTexture = value;
        }

        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        public get cameraColorCurves(): Nullable<ColorCurves> {
            return this._imageProcessingConfiguration.colorCurves;
        }
        /**
         * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        public set cameraColorCurves(value: Nullable<ColorCurves>) {
            this._imageProcessingConfiguration.colorCurves = value;
        }
    };
}
