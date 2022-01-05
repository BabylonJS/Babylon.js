import { WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';
import { WebXRSessionManager } from '../webXRSessionManager';
import { TransformNode } from '../../Meshes/transformNode';
import { Matrix } from '../../Maths/math';
import { Observable } from '../../Misc/observable';

/**
 * Options used in the mesh detector module
 */
export interface IWebXRMeshDetectorOptions {
    /**
     * The node to use to transform the local results to world coordinates
     */
    worldParentNode?: TransformNode;
    /**
     * If set to true a reference of the created meshes will be kept until the next session starts
     * If not defined, meshes will be removed from the array when the feature is detached or the session ended.
     */
    doNotRemoveMeshesOnSessionEnded?: boolean;
    /**
     * Preferred detector configuration, not all preferred options will be supported by all platforms.
     */
    preferredDetectorOptions?: XRGeometryDetectorOptions;
    /**
     * If set to true, WebXRMeshDetector will convert coordinate systems for meshes.
     * If not defined, mesh conversions from right handed to left handed coordinate systems won't be conducted.
     * Right handed mesh data will be available through IWebXRVertexData.xrMesh.
     */
    convertCoordinateSystems?: boolean;
}

/**
 * A babylon interface for a XR mesh's vertex data.
 *
 * Currently not supported by WebXR, available only with BabylonNative
 */
export interface IWebXRVertexData {
    /**
     * A babylon-assigned ID for this mesh
     */
    id: number;
    /**
     * Data required for constructing a mesh in Babylon.js.
     */
    xrMesh: XRMesh;
    /**
     * The node to use to transform the local results to world coordinates.
     * WorldParentNode will only exist if it was declared in the IWebXRMeshDetectorOptions.
     */
    worldParentNode?: TransformNode;
    /**
     * An array of vertex positions in babylon space. right/left hand system is taken into account.
     * Positions will only be calculated if convertCoordinateSystems is set to true in the IWebXRMeshDetectorOptions.
     */
    positions?: Float32Array;
    /**
     * An array of indices in babylon space. Indices have a counterclockwise winding order.
     * Indices will only be populated if convertCoordinateSystems is set to true in the IWebXRMeshDetectorOptions.
     */
    indices?: Uint32Array;
    /**
     * An array of vertex normals in babylon space. right/left hand system is taken into account.
     * Normals will not be calculated if convertCoordinateSystems is undefined in the IWebXRMeshDetectorOptions.
     * Different platforms may or may not support mesh normals when convertCoordinateSystems is set to true.
     */
    normals?: Float32Array;
    /**
     * A transformation matrix to apply on the mesh that will be built using the meshDefinition.
     * Local vs. World are decided if worldParentNode was provided or not in the options when constructing the module.
     * TransformationMatrix will only be calculated if convertCoordinateSystems is set to true in the IWebXRMeshDetectorOptions.
     */
    transformationMatrix?: Matrix;
}

let meshIdProvider = 0;

/**
 * The mesh detector is used to detect meshes in the real world when in AR
 */
export class WebXRMeshDetector extends WebXRAbstractFeature {
    private _detectedMeshes: Map<XRMesh, IWebXRVertexData> = new Map<XRMesh, IWebXRVertexData>();

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.MESH_DETECTION;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * Observers registered here will be executed when a new mesh was added to the session
     */
    public onMeshAddedObservable: Observable<IWebXRVertexData> = new Observable();
    /**
     * Observers registered here will be executed when a mesh is no longer detected in the session
     */
    public onMeshRemovedObservable: Observable<IWebXRVertexData> = new Observable();
    /**
     * Observers registered here will be executed when an existing mesh updates
     */
    public onMeshUpdatedObservable: Observable<IWebXRVertexData> = new Observable();

    constructor(_xrSessionManager: WebXRSessionManager, private _options: IWebXRMeshDetectorOptions = {}) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "mesh-detection";
        if (this._xrSessionManager.session) {
            this._init();
        } else {
            this._xrSessionManager.onXRSessionInit.addOnce(() => {
                this._init();
            });
        }
    }

    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        // Only supported by BabylonNative
        if (!!this._xrSessionManager.isNative &&
            !!this._xrSessionManager.session.trySetMeshDetectorEnabled) {
            this._xrSessionManager.session.trySetMeshDetectorEnabled(false);
        }

        if (!this._options.doNotRemoveMeshesOnSessionEnded) {
            this._detectedMeshes.forEach((mesh) => {
                this.onMeshRemovedObservable.notifyObservers(mesh);
            });

            this._detectedMeshes.clear();
        }

        return true;
    }

    public dispose(): void {
        super.dispose();
        this.onMeshAddedObservable.clear();
        this.onMeshRemovedObservable.clear();
        this.onMeshUpdatedObservable.clear();
    }

    protected _onXRFrame(frame: XRFrame) {
        // TODO remove try catch
        try {
            if (!this.attached || !frame) {
                return;
            }

            const detectedMeshes = frame.worldInformation?.detectedMeshes;
            if (!!detectedMeshes) {
                let toRemove = new Set<XRMesh>();
                this._detectedMeshes.forEach((vertexData, xrMesh) => {
                    if (!detectedMeshes.has(xrMesh)) {
                        toRemove.add(xrMesh);
                    }
                });
                toRemove.forEach((xrMesh) => {
                    const vertexData = this._detectedMeshes.get(xrMesh);
                    if (!!vertexData) {
                        this.onMeshRemovedObservable.notifyObservers(vertexData);
                        this._detectedMeshes.delete(xrMesh);
                    }
                });

                // now check for new ones
                detectedMeshes.forEach((xrMesh) => {
                    if (!this._detectedMeshes.has(xrMesh)) {
                        const partialVertexData: Partial<IWebXRVertexData> = {
                            id: meshIdProvider++,
                            xrMesh: xrMesh,
                        };
                        const vertexData = this._updateVertexDataWithXRMesh(xrMesh, partialVertexData, frame);
                        this._detectedMeshes.set(xrMesh, vertexData);
                        this.onMeshAddedObservable.notifyObservers(vertexData);
                    } else {
                        // updated?
                        if (xrMesh.lastChangedTime === this._xrSessionManager.currentTimestamp) {
                            const vertexData = this._detectedMeshes.get(xrMesh);
                            if (!!vertexData) {
                                this._updateVertexDataWithXRMesh(xrMesh, vertexData, frame);
                                this.onMeshUpdatedObservable.notifyObservers(vertexData);
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.log(error.stack);
        }
    }

    private _init() {
        // Only supported by BabylonNative
        if (!!this._xrSessionManager.isNative) {
            if (!!this._xrSessionManager.session.trySetMeshDetectorEnabled) {
                this._xrSessionManager.session.trySetMeshDetectorEnabled(true);
            }

            if (!!this._options.preferredDetectorOptions &&
                !!this._xrSessionManager.session.trySetPreferredMeshDetectorOptions) {
                this._xrSessionManager.session.trySetPreferredMeshDetectorOptions(this._options.preferredDetectorOptions);
            }
        }
    }

    private _updateVertexDataWithXRMesh(xrMesh: XRMesh, mesh: Partial<IWebXRVertexData>, xrFrame: XRFrame): IWebXRVertexData {
        mesh.xrMesh = xrMesh;
        mesh.worldParentNode = this._options.worldParentNode;

        if (!!this._options.convertCoordinateSystems) {
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                mesh.positions = new Float32Array(xrMesh.positions.length);
                for (let i = 0; i < xrMesh.positions.length; i += 3) {
                    mesh.positions[i] = xrMesh.positions[i];
                    mesh.positions[i + 1] = xrMesh.positions[i + 1];
                    mesh.positions[i + 2] = -1 * xrMesh.positions[i + 2];
                }

                if (!!xrMesh.normals) {
                    mesh.normals = new Float32Array(xrMesh.normals.length);
                    for (let i = 0; i < xrMesh.normals.length; i += 3) {
                        mesh.normals[i] = xrMesh.normals[i];
                        mesh.normals[i + 1] = xrMesh.normals[i + 1];
                        mesh.normals[i + 2] = -1 * xrMesh.normals[i + 2];
                    }
                }
            } else {
                mesh.positions = xrMesh.positions;
                mesh.normals = xrMesh.normals;
            }

            // WebXR should provide indices in a counterclockwise winding order regardless of coordinate system handedness
            mesh.indices = xrMesh.indices;

            // matrix
            const pose = xrFrame.getPose(xrMesh.meshSpace, this._xrSessionManager.referenceSpace);
            if (pose) {
                const mat = mesh.transformationMatrix || new Matrix();
                Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
                if (!this._xrSessionManager.scene.useRightHandedSystem) {
                    mat.toggleModelMatrixHandInPlace();
                }
                mesh.transformationMatrix = mat;
                if (this._options.worldParentNode) {
                    mat.multiplyToRef(this._options.worldParentNode.getWorldMatrix(), mat);
                }
            }
        }

        return <IWebXRVertexData>mesh;
    }
}

WebXRFeaturesManager.AddWebXRFeature(
    WebXRMeshDetector.Name,
    (xrSessionManager, options) => {
        return () => new WebXRMeshDetector(xrSessionManager, options);
    },
    WebXRMeshDetector.Version,
    false
);