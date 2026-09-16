import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { StandardMaterial } from "core/Materials/standardMaterial.pure";
import { Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { Color3 } from "core/Maths/math.color.pure";
import { Mesh } from "core/Meshes/mesh.pure";
import { CreateBox } from "core/Meshes/Builders/boxBuilder.pure";
import { CreateCylinder } from "core/Meshes/Builders/cylinderBuilder.pure";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder.pure";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder.pure";
import { type TransformNode } from "core/Meshes/transformNode.pure";
import { type Scene } from "core/scene";
import { Constants } from "core/Engines/constants";
import { type WebXRSpatialLayerType } from "./WebXRCompositionLayer";

/**
 * Physical dimensions used to approximate a native composition layer with a Babylon mesh.
 */
export interface IWebXRFallbackLayerDimensions {
    /** The quad width in meters. */
    width?: number;
    /** The quad height in meters. */
    height?: number;
    /** The cylinder or sphere radius in meters. */
    radius?: number;
    /** The cylinder central angle in radians. */
    centralAngle?: number;
    /** The cylinder width-to-height aspect ratio. */
    aspectRatio?: number;
    /** The equirectangular horizontal angle in radians. */
    centralHorizontalAngle?: number;
    /** The equirectangular upper vertical angle in radians. */
    upperVerticalAngle?: number;
    /** The equirectangular lower vertical angle in radians. */
    lowerVerticalAngle?: number;
}

/**
 * Wraps a mesh used when a requested native WebXR composition layer is unavailable.
 */
export class WebXRFallbackLayerWrapper {
    private readonly _currentPosition = new Vector3();
    private readonly _currentRotation = new Quaternion();
    private readonly _meshRotationOffset = new Quaternion();
    private readonly _material: StandardMaterial;
    private readonly _ownsTexture: boolean;

    /**
     * The native layer is always `null` for a fallback wrapper.
     */
    public readonly layer = null;

    /**
     * Whether this wrapper is backed by a native WebXR composition layer.
     */
    public readonly isNative = false;

    /**
     * The Babylon mesh that approximates the requested composition layer.
     */
    public readonly mesh: Mesh;

    /**
     * The texture displayed by the fallback mesh.
     */
    public readonly texture: BaseTexture;

    constructor(
        scene: Scene,
        /**
         * The requested WebXR composition layer type.
         */
        public readonly layerType: WebXRSpatialLayerType,
        /**
         * The texture displayed by the fallback mesh.
         */
        texture: BaseTexture,
        /**
         * The Babylon node whose world position and rotation control the fallback mesh.
         */
        public readonly transformNode: TransformNode,
        private readonly _ownsTransformNode: boolean,
        ownsTexture: boolean,
        dimensions: IWebXRFallbackLayerDimensions,
        worldScalingFactor: number
    ) {
        if (layerType === "XRCubeLayer") {
            const clonedTexture = texture.clone();
            if (clonedTexture) {
                texture = clonedTexture;
                texture.coordinatesMode = Constants.TEXTURE_SKYBOX_MODE;
                ownsTexture = true;
            }
        }
        this.texture = texture;
        this._ownsTexture = ownsTexture;
        this.mesh = this._createMesh(scene, dimensions);
        this.mesh.isPickable = false;
        this.mesh.rotationQuaternion = new Quaternion();
        this._material = new StandardMaterial(`WebXR ${layerType} fallback material`, scene);
        this._material.disableLighting = true;
        this._material.emissiveColor = Color3.Black();
        this._material.backFaceCulling = layerType === "XRQuadLayer";
        if (layerType === "XRCubeLayer" && this.texture.isCube) {
            this._material.reflectionTexture = this.texture;
        } else {
            this._material.emissiveTexture = this.texture;
            this._material.opacityTexture = this.texture;
        }
        this.mesh.material = this._material;
        this.updateFromTransformNode(worldScalingFactor);
    }

    private _createMesh(scene: Scene, dimensions: IWebXRFallbackLayerDimensions): Mesh {
        switch (this.layerType) {
            case "XRQuadLayer":
                return CreatePlane(
                    `WebXR ${this.layerType} fallback`,
                    {
                        width: dimensions.width ?? 1,
                        height: dimensions.height ?? 1,
                    },
                    scene
                );
            case "XRCylinderLayer": {
                const radius = dimensions.radius ?? 2;
                const centralAngle = dimensions.centralAngle ?? Math.PI / 4;
                const aspectRatio = dimensions.aspectRatio ?? 2;
                Quaternion.RotationAxisToRef(Vector3.UpReadOnly, (Math.PI - centralAngle) / 2, this._meshRotationOffset);
                return CreateCylinder(
                    `WebXR ${this.layerType} fallback`,
                    {
                        diameter: radius * 2,
                        height: (radius * centralAngle) / aspectRatio,
                        arc: centralAngle / (Math.PI * 2),
                        cap: Mesh.NO_CAP,
                        sideOrientation: Mesh.BACKSIDE,
                    },
                    scene
                );
            }
            case "XREquirectLayer": {
                const radius = dimensions.radius && Number.isFinite(dimensions.radius) ? dimensions.radius : 1000;
                const centralHorizontalAngle = dimensions.centralHorizontalAngle ?? Math.PI * 2;
                const upperVerticalAngle = dimensions.upperVerticalAngle ?? Math.PI / 2;
                const lowerVerticalAngle = dimensions.lowerVerticalAngle ?? -Math.PI / 2;
                Quaternion.RotationYawPitchRollToRef((Math.PI - centralHorizontalAngle) / 2, upperVerticalAngle - Math.PI / 2, 0, this._meshRotationOffset);
                return CreateSphere(
                    `WebXR ${this.layerType} fallback`,
                    {
                        diameter: radius * 2,
                        arc: centralHorizontalAngle / (Math.PI * 2),
                        slice: (upperVerticalAngle - lowerVerticalAngle) / Math.PI,
                        sideOrientation: Mesh.BACKSIDE,
                    },
                    scene
                );
            }
            case "XRCubeLayer":
                return CreateBox(
                    `WebXR ${this.layerType} fallback`,
                    {
                        size: 1000,
                        sideOrientation: Mesh.BACKSIDE,
                    },
                    scene
                );
        }
    }

    /**
     * Copies the transform node's world position and rotation to the fallback mesh without applying the node's scaling.
     * @param worldScalingFactor the number of Babylon scene units represented by one meter
     */
    public updateFromTransformNode(worldScalingFactor = 1): void {
        this.transformNode.computeWorldMatrix(true).decompose(undefined, this._currentRotation, this._currentPosition);
        if (this.layerType === "XRCubeLayer") {
            this.mesh.position.setAll(0);
        } else {
            this.mesh.position.copyFrom(this._currentPosition);
        }
        this._currentRotation.multiplyToRef(this._meshRotationOffset, this.mesh.rotationQuaternion!);
        this.mesh.scaling.setAll(worldScalingFactor);
    }

    /**
     * Disposes the fallback mesh, material, and any resources owned by this wrapper.
     */
    public dispose(): void {
        this.mesh.dispose(false, false);
        this._material.dispose();
        if (this._ownsTexture) {
            this.texture.dispose();
        }
        if (this._ownsTransformNode) {
            this.transformNode.dispose();
        }
    }
}
