import { IShadowLight } from "../../Lights/shadowLight";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Nullable } from "../../types";
import { ShadowGenerator } from "./shadowGenerator";

declare type ShadowCSMGenerator = import("./csmShadowGenerator").CSMShadowGenerator;
declare type ICascade = import("./csmShadowGenerator").ICascade;

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

    constructor(mapSize: number, light: IShadowLight, usefulFloatFirst: boolean, parent: ShadowCSMGenerator) {
        super(mapSize, light, usefulFloatFirst);

        this._light._shadowGenerator = parent;
        this._parent = parent;
        this._cascade = null;
        this._lightMinExtents = new Vector3(0, 0, 0);
        this._lightMaxExtents = new Vector3(0, 0, 0);
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
    protected _computeFrustumInWorldSpace(): Array<Vector3> {
        const frustumCornersWorldSpace: Array<Vector3> = [];

        if (!this._cascade || !this._scene.activeCamera) {
            return frustumCornersWorldSpace;
        }

        const prevSplitDist = this._cascade.prevSplitDistance,
              splitDist = this._cascade.splitDistance;

        this._scene.activeCamera.getViewMatrix(); // make sure the transformation matrix we get when calling 'getTransformationMatrix()' is calculated with an up to date view matrix

        const invViewProj = Matrix.Invert(this._scene.activeCamera.getTransformationMatrix());
        for (let cornerIndex = 0; cornerIndex < CSMShadowMap.frustumCornersNDCSpace.length; ++cornerIndex) {
            frustumCornersWorldSpace.push(Vector3.TransformCoordinates(CSMShadowMap.frustumCornersNDCSpace[cornerIndex], invViewProj));
        }

        // Get the corners of the current cascade slice of the view frustum
        for (let cornerIndex = 0; cornerIndex < CSMShadowMap.frustumCornersNDCSpace.length / 2; ++cornerIndex) {
            const cornerRay = frustumCornersWorldSpace[cornerIndex + 4].subtract(frustumCornersWorldSpace[cornerIndex]),
                  nearCornerRay = cornerRay.scale(prevSplitDist),
                  farCornerRay = cornerRay.scale(splitDist);

            frustumCornersWorldSpace[cornerIndex + 4] = frustumCornersWorldSpace[cornerIndex].add(farCornerRay);
            frustumCornersWorldSpace[cornerIndex].addInPlace(nearCornerRay);
        }

        return frustumCornersWorldSpace;
    }

    protected _computeLightFrustum(frustumCornersWorldSpace: Array<Vector3>): [Vector3, Vector3, Vector3] {
        let minExtents = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
            maxExtents = new Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE),
            frustumCenter = new Vector3(0, 0, 0);

        const camera = this._scene.activeCamera;

        if (!camera) {
            return [minExtents, maxExtents, frustumCenter];
        }

        // Calculate the centroid of the view frustum slice
        for (let cornerIndex = 0; cornerIndex < frustumCornersWorldSpace.length; ++cornerIndex) {
            frustumCenter.addInPlace(frustumCornersWorldSpace[cornerIndex]);
        }

        frustumCenter.scaleInPlace(1 / frustumCornersWorldSpace.length);

        if (this._parent.stabilizeCascades) {
            // Calculate the radius of a bounding sphere surrounding the frustum corners
            let sphereRadius = 0;
            for (let cornerIndex = 0; cornerIndex < frustumCornersWorldSpace.length; ++cornerIndex) {
                const dist = frustumCornersWorldSpace[cornerIndex].subtract(frustumCenter).length();
                sphereRadius = Math.max(sphereRadius, dist);
            }

            sphereRadius = Math.ceil(sphereRadius * 16) / 16;

            maxExtents.set(sphereRadius, sphereRadius, sphereRadius);
            minExtents.set(-sphereRadius, -sphereRadius, -sphereRadius);
        } else {
            // Create a temporary view matrix for the light
            const upDir = this._parent.useRightDirectionAsUpForOrthoProj ? camera.getDirection(new Vector3(1, 0, 0)) : Vector3.Up();

            const lightCameraPos = frustumCenter,
                  lookAt = frustumCenter.add(this._lightDirection);

            let lightView = Matrix.LookAtLH(lightCameraPos, lookAt, upDir);

            // Calculate an AABB around the frustum corners
            for (let cornerIndex = 0; cornerIndex < frustumCornersWorldSpace.length; ++cornerIndex) {
                const corner = Vector3.TransformCoordinates(frustumCornersWorldSpace[cornerIndex], lightView);

                minExtents.minimizeInPlace(corner);
                maxExtents.maximizeInPlace(corner);
            }
        }

        return [minExtents, maxExtents, frustumCenter];
    }

    protected _computeLightMatrices(): void {
        const camera = this._scene.activeCamera;

        if (!camera) {
            return;
        }

        const frustumCornersWorldSpace = this._computeFrustumInWorldSpace(),
              [minExtents, maxExtents, frustumCenter] = this._computeLightFrustum(frustumCornersWorldSpace);

        const cascadeExtents = maxExtents.subtract(minExtents);

        // Get position of the shadow camera
        const shadowCameraPos = frustumCenter.add(this._lightDirection.scale(minExtents.z));

        // Come up with a new orthographic camera for the shadow caster
        const upDir = this._parent.stabilizeCascades || !this._parent.useRightDirectionAsUpForOrthoProj ? Vector3.Up() : camera.getDirection(new Vector3(1, 0, 0));

        Matrix.LookAtLHToRef(shadowCameraPos, frustumCenter, upDir, this._viewMatrix);

        let minZ = 0, maxZ = cascadeExtents.z;

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
            Matrix.OrthoOffCenterRHToRef(minExtents.x, maxExtents.x, minExtents.y, maxExtents.y, minZ, maxZ, this._projectionMatrix);
        } else {
            Matrix.OrthoOffCenterLHToRef(minExtents.x, maxExtents.x, minExtents.y, maxExtents.y, minZ, maxZ, this._projectionMatrix);
        }

        this._lightMinExtents.set(minExtents.x, minExtents.y, minZ);
        this._lightMaxExtents.set(maxExtents.x, maxExtents.y, maxZ);

        this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);

        if (this._parent.stabilizeCascades) {
            // Create the rounding matrix, by projecting the world-space origin and determining
            // the fractional offset in texel space
            const shadowOrigin = Vector3.TransformCoordinates(Vector3.Zero(), this._transformMatrix).scaleInPlace(this._mapSize / 2);

            const roundedOrigin = new Vector3(Math.round(shadowOrigin.x), Math.round(shadowOrigin.y), Math.round(shadowOrigin.z)),
                  roundOffset = roundedOrigin.subtract(shadowOrigin).scaleInPlace(2 / this._mapSize);

            this._projectionMatrix.multiplyToRef(Matrix.Translation(roundOffset.x, roundOffset.y, 0.0), this._projectionMatrix);
            this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        }
    }
}
