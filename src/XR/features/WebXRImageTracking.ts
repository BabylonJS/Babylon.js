import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { Observable } from "../../Misc/observable";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Matrix } from "../../Maths/math.vector";
import { Tools } from "../../Misc/tools";
import { Nullable } from "../../types";

declare const XRImageTrackingResult: XRImageTrackingResult;

/**
 * Options interface for the background remover plugin
 */
export interface IWebXRImageTrackingOptions {
    /**
     * A required array with images to track
     */
    images: {
        /**
         * The source of the image. can be a URL or an image bitmap
         */
        src: string | ImageBitmap;
        /**
         * The estimated width in the real world (in meters)
         */
        estimatedRealWorldWidth: number; // In meters!
    }[];
}

/**
 * An object representing an image tracked by the system
 */
export interface IWebXRTrackedImage {
    /**
     * The ID of this image (which is the same as the position in the array that was used to initialize the feature)
     */
    id: number;
    /**
     * Is the transformation provided emulated. If it is, the system "guesses" its real position. Otherwise it can be considered as exact position.
     */
    emulated?: boolean;
    /**
     * Just in case it is needed - the image bitmap that is being tracked
     */
    originalBitmap: ImageBitmap;
    /**
     * The native XR result image tracking result, untouched
     */
    xrTrackingResult?: XRImageTrackingResult;
    /**
     * Width in real world (meters)
     */
    realWorldWidth?: number;
    /**
     * A transformation matrix of this current image in the current reference space.
     */
    transformationMatrix: Matrix;
    /**
     * The width/height ratio of this image. can be used to calculate the size of the detected object/image
     */
    ratio?: number;
}

/**
 * Image tracking for immersive AR sessions.
 * Providing a list of images and their estimated widths will enable tracking those images in the real world.
 */
export class WebXRImageTracking extends WebXRAbstractFeature {
    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.IMAGE_TRACKING;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * This will be triggered if the underlying system deems an image untrackable.
     * The index is the index of the image from the array used to initialize the feature.
     */
    public onUntrackableImageFoundObservable: Observable<number> = new Observable();
    /**
     * An image was deemed trackable, and the system will start tracking it.
     */
    public onTrackableImageFoundObservable: Observable<IWebXRTrackedImage> = new Observable();
    /**
     * The image was found and its state was updated.
     */
    public onTrackedImageUpdatedObservable: Observable<IWebXRTrackedImage> = new Observable();

    private _trackedImages: IWebXRTrackedImage[] = [];

    private _originalTrackingRequest: XRTrackedImageInit[];

    /**
     * constructs the image tracking feature
     * @param _xrSessionManager the session manager for this module
     * @param options read-only options to be used in this module
     */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        /**
         * read-only options to be used in this module
         */
        public readonly options: IWebXRImageTrackingOptions
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "image-tracking";
        if (this.options.images.length === 0) {
            // no images provided?... return.
            return;
        }
        if (this._xrSessionManager.session) {
            this._init();
        } else {
            this._xrSessionManager.onXRSessionInit.addOnce(() => {
                this._init();
            });
        }
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        return super.attach();
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        return super.detach();
    }

    /**
     * Check if the needed objects are defined.
     * This does not mean that the feature is enabled, but that the objects needed are well defined.
     */
    public isCompatible(): boolean {
        return typeof XRImageTrackingResult !== "undefined";
    }

    /**
     * Get a tracked image by its ID.
     *
     * @param id the id of the image to load (position in the init array)
     * @returns a trackable image, if exists in this location
     */
    public getTrackedImageById(id: number): Nullable<IWebXRTrackedImage> {
        return this._trackedImages[id] || null;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();
        this._trackedImages.forEach((trackedImage) => {
            trackedImage.originalBitmap.close();
        });
        this._trackedImages.length = 0;
        this.onTrackableImageFoundObservable.clear();
        this.onUntrackableImageFoundObservable.clear();
        this.onTrackedImageUpdatedObservable.clear();
    }

    /**
     * Extends the session init object if needed
     * @returns augmentation object fo the xr session init object.
     */
    public async getXRSessionInitExtension(): Promise<Partial<XRSessionInit>> {
        if (!this.options.images || !this.options.images.length) {
            return {};
        }
        const promises = this.options.images.map((image) => {
            if (typeof image.src === "string") {
                const p = new Promise<ImageBitmap>((resolve, reject) => {
                    if (typeof image.src === "string") {
                        const img = new Image();
                        img.src = image.src;
                        img.onload = () => {
                            img.decode().then(() => {
                                this._xrSessionManager.scene.getEngine().createImageBitmap(img).then((imageBitmap) => {
                                    resolve(imageBitmap);
                                });
                            });
                        };
                        img.onerror = () => {
                            Tools.Error(`Error loading image ${image.src}`);
                            reject(`Error loading image ${image.src}`);
                        };
                    }
                });
                return p;
            } else {
                return Promise.resolve(image.src); // resolve is probably unneeded
            }
        });

        const images = await Promise.all(promises);

        this._originalTrackingRequest = images.map((image, idx) => {
            return {
                image,
                widthInMeters: this.options.images[idx].estimatedRealWorldWidth,
            };
        });

        return {
            trackedImages: this._originalTrackingRequest,
        };
    }

    protected _onXRFrame(_xrFrame: XRFrame) {
        if (!_xrFrame.getImageTrackingResults) {
            return;
        }
        const imageTrackedResults = _xrFrame.getImageTrackingResults();
        for (const result of imageTrackedResults) {
            let changed = false;
            const imageIndex = result.index;

            const imageObject = this._trackedImages[imageIndex];
            if (!imageObject) {
                // something went wrong!
                continue;
            }

            imageObject.xrTrackingResult = result;
            if (imageObject.realWorldWidth !== result.measuredWidthInMeters) {
                imageObject.realWorldWidth = result.measuredWidthInMeters;
                changed = true;
            }

            // Get the pose of the image relative to a reference space.
            const pose = _xrFrame.getPose(result.imageSpace, this._xrSessionManager.referenceSpace);

            if (pose) {
                const mat = imageObject.transformationMatrix;
                Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
                if (!this._xrSessionManager.scene.useRightHandedSystem) {
                    mat.toggleModelMatrixHandInPlace();
                }
                changed = true;
            }

            const state = result.trackingState;
            const emulated = state === "emulated";

            if (imageObject.emulated !== emulated) {
                imageObject.emulated = emulated;
                changed = true;
            }
            if (changed) {
                this.onTrackedImageUpdatedObservable.notifyObservers(imageObject);
            }
        }
    }

    private async _init() {
        if (!this._xrSessionManager.session.getTrackedImageScores) {
            return;
        }
        //
        const imageScores = await this._xrSessionManager.session.getTrackedImageScores();
        // check the scores for all
        for (let idx = 0; idx < imageScores.length; ++idx) {
            if (imageScores[idx] == "untrackable") {
                this.onUntrackableImageFoundObservable.notifyObservers(idx);
            } else {
                const originalBitmap = this._originalTrackingRequest[idx].image;
                const imageObject: IWebXRTrackedImage = {
                    id: idx,
                    originalBitmap,
                    transformationMatrix: new Matrix(),
                    ratio: originalBitmap.width / originalBitmap.height,
                };
                this._trackedImages[idx] = imageObject;
                this.onTrackableImageFoundObservable.notifyObservers(imageObject);
            }
        }
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRImageTracking.Name,
    (xrSessionManager, options) => {
        return () => new WebXRImageTracking(xrSessionManager, options);
    },
    WebXRImageTracking.Version,
    false
);
