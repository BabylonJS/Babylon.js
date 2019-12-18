import { IShadowLight } from "../../Lights/shadowLight";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Nullable } from "../../types";
import { ShadowGenerator } from "./shadowGenerator";

declare type ShadowCSMGenerator = import("./csmShadowGenerator").CSMShadowGenerator;
declare type ICascade = import("./csmShadowGenerator").ICascade;

const UpDir = Vector3.Up();
const RightDir = Vector3.Right();
const ZeroVec = Vector3.Zero();

let tmpv1 = new Vector3(),
    tmpv2 = new Vector3(),
    matrix = new Matrix();

export class CSMShadowMap extends ShadowGenerator {

    protected static readonly frustumCornersNDCSpace = [
        new Vector3(-1.0, +1.0, -1.0),
        new Vector3(+1.0, +1.0, -1.0),
        new Vector3(+1.0, -1.0, -1.0),
        new Vector3(-1.0, -1.0, -1.0),
        new Vector3(-1.0, +1.0, +1.0),
        new Vector3(+1.0, +1.0, +1.0),
        new Vector3(+1.0, -1.0, +1.0),
        new Vector3(-1.0, -1.0, +1.0),
    ];

    protected _lightMinExtents: Vector3;

    public get lightMinExtents(): Vector3 {
        return this._lightMinExtents;
    }

    protected _lightMaxExtents: Vector3;

    public get lightMaxExtents(): Vector3 {
        return this._lightMaxExtents;
    }

    protected _parent: ShadowCSMGenerator;
    protected _cascade: Nullable<ICascade>;
    protected _frustumCornersWorldSpace: Array<Vector3>;
    protected _minExtents: Vector3;
    protected _maxExtents: Vector3;
    protected _frustumCenter: Vector3;
    protected _cascadeExtents: Vector3;
    protected _shadowCameraPos: Vector3;

    constructor(mapSize: number, light: IShadowLight, usefulFloatFirst: boolean, parent: ShadowCSMGenerator) {
        super(mapSize, light, usefulFloatFirst);

        this._light._shadowGenerator = parent;
        this._parent = parent;
        this._cascade = null;
        this._lightMinExtents = new Vector3(0, 0, 0);
        this._lightMaxExtents = new Vector3(0, 0, 0);

        this._frustumCornersWorldSpace = [];

        for (let i = 0; i < CSMShadowMap.frustumCornersNDCSpace.length; ++i) {
            this._frustumCornersWorldSpace.push(new Vector3());
        }

        this._minExtents = new Vector3();
        this._maxExtents = new Vector3();
        this._frustumCenter = new Vector3();
        this._cascadeExtents = new Vector3();
        this._shadowCameraPos = new Vector3();
    }

    public get viewMatrix(): Matrix {
        return this._viewMatrix;
    }

    public get cascade(): Nullable<ICascade> {
        return this._cascade;
    }

    public set cascade(cascade: Nullable<ICascade>) {
        this._cascade = cascade;
    }

    public getTransformMatrix(): Matrix {
        var scene = this._scene;
        if (this._currentRenderID === scene.getRenderId() && this._currentFaceIndexCache === this._currentFaceIndex) {
            return this._transformMatrix;
        }

        this._currentRenderID = scene.getRenderId();
        this._currentFaceIndexCache = this._currentFaceIndex;

        var lightPosition = this._light.position;
        if (this._light.computeTransformedInformation()) {
            lightPosition = this._light.transformedPosition;
        }

        Vector3.NormalizeToRef(this._light.getShadowDirection(this._currentFaceIndex), this._lightDirection);
        if (Math.abs(Vector3.Dot(this._lightDirection, Vector3.Up())) === 1.0) {
            this._lightDirection.z = 0.0000000000001; // Required to avoid perfectly perpendicular light
        }

        if (this._light.needProjectionMatrixCompute() || !this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !this._lightDirection.equals(this._cachedDirection)) {

            this._cachedPosition.copyFrom(lightPosition);
            this._cachedDirection.copyFrom(this._lightDirection);

            this._computeLightMatrices();
        }

        return this._transformMatrix;
    }

    // Get the 8 points of the view frustum in world space
    protected _computeFrustumInWorldSpace(): void {
        if (!this._cascade || !this._scene.activeCamera) {
            return;
        }

        const prevSplitDist = this._cascade.prevSplitDistance,
              splitDist = this._cascade.splitDistance;

        this._scene.activeCamera.getViewMatrix(); // make sure the transformation matrix we get when calling 'getTransformationMatrix()' is calculated with an up to date view matrix

        const invViewProj = Matrix.Invert(this._scene.activeCamera.getTransformationMatrix());
        for (let cornerIndex = 0; cornerIndex < CSMShadowMap.frustumCornersNDCSpace.length; ++cornerIndex) {
            Vector3.TransformCoordinatesToRef(CSMShadowMap.frustumCornersNDCSpace[cornerIndex], invViewProj, this._frustumCornersWorldSpace[cornerIndex]);
        }

        // Get the corners of the current cascade slice of the view frustum
        for (let cornerIndex = 0; cornerIndex < CSMShadowMap.frustumCornersNDCSpace.length / 2; ++cornerIndex) {
            tmpv1.copyFrom(this._frustumCornersWorldSpace[cornerIndex + 4]).subtractInPlace(this._frustumCornersWorldSpace[cornerIndex]);
            tmpv2.copyFrom(tmpv1).scaleInPlace(prevSplitDist); // near corner ray
            tmpv1.scaleInPlace(splitDist); // far corner ray

            tmpv1.addInPlace(this._frustumCornersWorldSpace[cornerIndex]);

            this._frustumCornersWorldSpace[cornerIndex + 4].copyFrom(tmpv1);
            this._frustumCornersWorldSpace[cornerIndex].addInPlace(tmpv2);
        }
    }

    protected _computeLightFrustum(): void {
        this._minExtents.copyFromFloats(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._maxExtents.copyFromFloats(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        this._frustumCenter.copyFromFloats(0, 0, 0);

        const camera = this._scene.activeCamera;

        if (!camera) {
            return;
        }

        // Calculate the centroid of the view frustum slice
        for (let cornerIndex = 0; cornerIndex < this._frustumCornersWorldSpace.length; ++cornerIndex) {
            this._frustumCenter.addInPlace(this._frustumCornersWorldSpace[cornerIndex]);
        }

        this._frustumCenter.scaleInPlace(1 / this._frustumCornersWorldSpace.length);

        if (this._parent.stabilizeCascades) {
            // Calculate the radius of a bounding sphere surrounding the frustum corners
            let sphereRadius = 0;
            for (let cornerIndex = 0; cornerIndex < this._frustumCornersWorldSpace.length; ++cornerIndex) {
                const dist = this._frustumCornersWorldSpace[cornerIndex].subtract(this._frustumCenter).length();
                sphereRadius = Math.max(sphereRadius, dist);
            }

            sphereRadius = Math.ceil(sphereRadius * 16) / 16;

            this._maxExtents.copyFromFloats(sphereRadius, sphereRadius, sphereRadius);
            this._minExtents.copyFromFloats(-sphereRadius, -sphereRadius, -sphereRadius);
        } else {
            // Create a temporary view matrix for the light
            const upDir = this._parent.useRightDirectionAsUpForOrthoProj ? camera.getDirection(RightDir) : UpDir;

            const lightCameraPos = this._frustumCenter;

            this._frustumCenter.addToRef(this._lightDirection, tmpv1); // tmpv1 = look at

            Matrix.LookAtLHToRef(lightCameraPos, tmpv1, upDir, matrix); // matrix = lightView

            // Calculate an AABB around the frustum corners
            for (let cornerIndex = 0; cornerIndex < this._frustumCornersWorldSpace.length; ++cornerIndex) {
                Vector3.TransformCoordinatesToRef(this._frustumCornersWorldSpace[cornerIndex], matrix, tmpv1);

                this._minExtents.minimizeInPlace(tmpv1);
                this._maxExtents.maximizeInPlace(tmpv1);
            }
        }

        return;
    }

    protected _computeLightMatrices(): void {
        const camera = this._scene.activeCamera;

        if (!camera) {
            return;
        }

        this._computeFrustumInWorldSpace();

        this._computeLightFrustum();

        this._maxExtents.subtractToRef(this._minExtents, this._cascadeExtents);

        // Get position of the shadow camera
        this._frustumCenter.addToRef(this._lightDirection.scale(this._minExtents.z), this._shadowCameraPos);

        // Come up with a new orthographic camera for the shadow caster
        const upDir = this._parent.stabilizeCascades || !this._parent.useRightDirectionAsUpForOrthoProj ? UpDir : camera.getDirection(RightDir);

        Matrix.LookAtLHToRef(this._shadowCameraPos, this._frustumCenter, upDir, this._viewMatrix);

        let minZ = 0, maxZ = this._cascadeExtents.z;

        // Try to tighten minZ and maxZ based on the bounding box of the shadow casters
        const boundingInfo = this._parent.shadowCastersBoundingInfo;

        boundingInfo.update(this._viewMatrix);

        maxZ = Math.min(maxZ, boundingInfo.boundingBox.maximumWorld.z);

        if (!this._parent.depthClamp) {
            // If we don't use depth clamping, we must set minZ so that all shadow casters are in the light frustum
            minZ = Math.min(minZ, boundingInfo.boundingBox.minimumWorld.z);
        } else {
            // If using depth clamping, we can adjust minZ to reduce the [minZ, maxZ] range (and get some additional precision in the shadow map)
            minZ = Math.max(minZ, boundingInfo.boundingBox.minimumWorld.z);
        }

        if (this._scene.useRightHandedSystem) {
            Matrix.OrthoOffCenterRHToRef(this._minExtents.x, this._maxExtents.x, this._minExtents.y, this._maxExtents.y, minZ, maxZ, this._projectionMatrix);
        } else {
            Matrix.OrthoOffCenterLHToRef(this._minExtents.x, this._maxExtents.x, this._minExtents.y, this._maxExtents.y, minZ, maxZ, this._projectionMatrix);
        }

        this._lightMinExtents.set(this._minExtents.x, this._minExtents.y, minZ);
        this._lightMaxExtents.set(this._maxExtents.x, this._maxExtents.y, maxZ);

        this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);

        if (this._parent.stabilizeCascades) {
            // Create the rounding matrix, by projecting the world-space origin and determining
            // the fractional offset in texel space
            Vector3.TransformCoordinatesToRef(ZeroVec, this._transformMatrix, tmpv1); // tmpv1 = shadowOrigin
            tmpv1.scaleInPlace(this._mapSize / 2);

            tmpv2.copyFromFloats(Math.round(tmpv1.x), Math.round(tmpv1.y), Math.round(tmpv1.z)); // tmpv2 = roundedOrigin
            tmpv2.subtractInPlace(tmpv1).scaleInPlace(2 / this._mapSize); // tmpv2 = roundOffset

            Matrix.TranslationToRef(tmpv2.x, tmpv2.y, 0.0, matrix);

            this._projectionMatrix.multiplyToRef(matrix, this._projectionMatrix);
            this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        }
    }
}
