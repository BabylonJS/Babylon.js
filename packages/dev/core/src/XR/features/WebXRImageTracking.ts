import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { Observable } from "../../Misc/observable";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Matrix } from "../../Maths/math.vector";
import type { Nullable } from "../../types";
import { Tools } from "../../Misc/tools";
import type { Engine } from "../../Engines/engine";

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
 * Enum that describes the state of the image trackability score status for this session.
 */
enum ImageTrackingScoreStatus {
    // AR Session has not yet assessed image trackability scores.
    NotReceived,
    // A request to retrieve trackability scores has been sent, but no response has been received.
    Waiting,
    // Image trackability scores have been received for this session
    Received,
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

    private _trackableScoreStatus: ImageTrackingScoreStatus = ImageTrackingScoreStatus.NotReceived;
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
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public override attach(): boolean {
        return super.attach();
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public override detach(): boolean {
        return super.detach();
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
    public override dispose(): void {
        super.dispose();
        for (const trackedImage of this._trackedImages) {
            trackedImage.originalBitmap.close();
        }
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
                return (this._xrSessionManager.scene.getEngine() as Engine)._createImageBitmapFromSource(image.src);
            } else {
                return Promise.resolve(image.src); // resolve is probably unneeded
            }
        });

        try {
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
        } catch (ex) {
            Tools.Error("Error loading images for tracking, WebXRImageTracking disabled for this session.");
            return {};
        }
    }

    protected _onXRFrame(_xrFrame: XRFrame) {
        if (!_xrFrame.getImageTrackingResults || this._trackableScoreStatus === ImageTrackingScoreStatus.Waiting) {
            return;
        }

        // Image tracking scores may be generated a few frames after the XR Session initializes.
        // If we haven't received scores yet, then kick off the task to check scores and return immediately.
        if (this._trackableScoreStatus === ImageTrackingScoreStatus.NotReceived) {
            this._checkScoresAsync();
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

    private async _checkScoresAsync(): Promise<void> {
        if (!this._xrSessionManager.session.getTrackedImageScores || this._trackableScoreStatus !== ImageTrackingScoreStatus.NotReceived) {
            return;
        }

        this._trackableScoreStatus = ImageTrackingScoreStatus.Waiting;
        const imageScores = await this._xrSessionManager.session.getTrackedImageScores();
        if (!imageScores || imageScores.length === 0) {
            this._trackableScoreStatus = ImageTrackingScoreStatus.NotReceived;
            return;
        }

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

        this._trackableScoreStatus = imageScores.length > 0 ? ImageTrackingScoreStatus.Received : ImageTrackingScoreStatus.NotReceived;
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
