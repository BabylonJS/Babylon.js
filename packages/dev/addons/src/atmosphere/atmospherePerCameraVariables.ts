// Copyright (c) Microsoft Corporation.
// MIT License

import type { Camera } from "core/Cameras/camera";
import type { IMatrixLike, IVector3Like, IVector4Like } from "core/Maths/math.like";
import { Matrix, Vector3, Vector4 } from "core/Maths/math.vector";
import { Ray } from "core/Culling/ray.core";
import { Vector3Dot } from "core/Maths/math.vector.functions";

const TempRay = new Ray(Vector3.Zero(), Vector3.Zero());

/**
 * Variables that are used to render the atmosphere and are computed per-camera.
 */
export class AtmospherePerCameraVariables {
    private _inverseViewProjectionMatrixWithoutTranslation = Matrix.Identity();
    private _directionToLightRelativeToCameraGeocentricNormal = Vector3.Up();
    private _cosAngleLightToZenith = 0;
    private _cameraRadius = 0;
    private _clampedCameraRadius = 0;
    private _cameraHeight = 0;
    private _clampedCameraHeight = 0;
    private _cameraPositionGlobal = new Vector3();
    private _clampedCameraPositionGlobal = new Vector3();
    private _cosCameraHorizonAngleFromZenith = 0;
    private _sinCameraAtmosphereHorizonAngleFromNadir = 0;
    private _cameraGeocentricNormal = Vector3.Up();
    private _cameraForward = Vector3.Down();
    private _cameraNearPlane = 0;
    private _cameraPosition = new Vector3();
    private _viewport = new Vector4();
    private _lastViewMatrix = Matrix.Identity();
    private _lastProjectionMatrix = Matrix.Identity();
    private _inverseViewMatrixWithoutTranslation = Matrix.Identity();
    private _inverseProjectionMatrix = Matrix.Identity();

    /**
     * The inverse view projection matrix is used to unproject rays.
     * To avoid precision issues, the translation part of the matrix has been removed.
     */
    public get inverseViewProjectionMatrixWithoutTranslation(): IMatrixLike {
        return this._inverseViewProjectionMatrixWithoutTranslation;
    }

    /**
     * The direction to the light relative to the geocentric normal under the camera.
     */
    public get directionToLightRelativeToCameraGeocentricNormal(): IVector3Like {
        return this._directionToLightRelativeToCameraGeocentricNormal;
    }

    /**
     * The cosine of the angle between the light direction and zenith.
     */
    public get cosAngleLightToZenith(): number {
        return this._cosAngleLightToZenith;
    }

    /**
     * The distance from the camera to the planet origin in kilometers.
     */
    public get cameraRadius(): number {
        return this._cameraRadius;
    }

    /**
     * The distance from the camera to the planet origin, clamped to the planet radius offset, in kilometers.
     */
    public get clampedCameraRadius(): number {
        return this._clampedCameraRadius;
    }

    /**
     * The height of the camera above the planet surface in kilometers.
     */
    public get cameraHeight(): number {
        return this._cameraHeight;
    }

    /**
     * The height of the camera above the planet surface, clamped to the planet radius offset, in kilometers.
     */
    public get clampedCameraHeight(): number {
        return this._clampedCameraHeight;
    }

    /**
     * The camera position in global space kilometers.
     *
     * The behavior of this value depends on whether floating origin mode is enabled:
     * - If floating origin mode is enabled, this is simply the camera's global position scaled to kilometers. The atmosphere's origin height is used to offset the camera position along its geocentric normal.
     * - If floating origin mode is disabled, the camera's y position is offset by the planet radius plus any origin height.
     */
    public get cameraPositionGlobal(): IVector3Like {
        return this._cameraPositionGlobal;
    }

    /**
     * The camera position, clamped to the planet radius offset, in global space kilometers.
     * See {@link cameraPositionGlobal} for details on how the value is computed.
     */
    public get clampedCameraPositionGlobal(): IVector3Like {
        return this._clampedCameraPositionGlobal;
    }

    /**
     * The cosine of the angle from the zenith to the horizon of the planet, measured from the camera position.
     */
    public get cosCameraHorizonAngleFromZenith(): number {
        return this._cosCameraHorizonAngleFromZenith;
    }

    /**
     * The sine of the angle from the nadir to the horizon of the atmosphere, measured from the camera position.
     */
    public get sinCameraAtmosphereHorizonAngleFromNadir(): number {
        return this._sinCameraAtmosphereHorizonAngleFromNadir;
    }

    /**
     * The geocentric normal of the camera in global space i.e., the normalization of {@link cameraPositionGlobal}.
     * Note the behavior of this value depends on whether floating origin mode is enabled. See {@link cameraPositionGlobal} for details.
     */
    public get cameraGeocentricNormal(): IVector3Like {
        return this._cameraGeocentricNormal;
    }

    /**
     * The camera's forward direction in world space.
     */
    public get cameraForward(): IVector3Like {
        return this._cameraForward;
    }

    /**
     * The distance to the near plane of the camera.
     */
    public get cameraNearPlane(): number {
        return this._cameraNearPlane;
    }

    /**
     * The camera's position in world space.
     */
    public get cameraPosition(): IVector3Like {
        return this._cameraPosition;
    }

    /**
     * The viewport for the camera.
     */
    public get viewport(): IVector4Like {
        return this._viewport;
    }

    /**
     * Updates the variables.
     * @param camera - The camera to update the variables for.
     * @param planetRadius - The radius of the planet in kilometers.
     * @param planetRadiusWithOffset - The radius of the planet with the offset in kilometers.
     * @param atmosphereRadius - The radius of the atmosphere in kilometers.
     * @param directionToLight - The direction to the light in world space.
     * @param originHeight - The height of the origin (distance from planet's surface) in kilometers.
     */
    public update(camera: Camera, planetRadius: number, planetRadiusWithOffset: number, atmosphereRadius: number, directionToLight: IVector3Like, originHeight: number): void {
        this._cameraNearPlane = camera.minZ;
        this._cameraForward.copyFrom(camera.getForwardRayToRef(TempRay, 1).direction);

        const scene = camera.getScene();
        const engine = scene.getEngine();
        this._viewport.copyFromFloats(0.0, 0.0, engine.getRenderWidth(), engine.getRenderHeight());

        // Compute inverse view projection matrix, but remove the translational component to increase precision.
        const viewMatrix = camera.getViewMatrix();
        const projectionMatrix = camera.getProjectionMatrix();
        const lastViewMatrix = this._lastViewMatrix;
        const lastProjectionMatrix = this._lastProjectionMatrix;
        if (!lastViewMatrix.equals(viewMatrix) || !lastProjectionMatrix.equals(projectionMatrix)) {
            lastViewMatrix.copyFrom(viewMatrix);
            lastViewMatrix.setTranslation(Vector3.ZeroReadOnly);
            lastViewMatrix.invertToRef(this._inverseViewMatrixWithoutTranslation);

            lastProjectionMatrix.copyFrom(projectionMatrix);
            lastProjectionMatrix.invertToRef(this._inverseProjectionMatrix);
            this._inverseProjectionMatrix.multiplyToRef(this._inverseViewMatrixWithoutTranslation, this._inverseViewProjectionMatrixWithoutTranslation);
        }

        // Compute the global space position of the camera in kilometers.
        const cameraPositionGlobal = this._cameraPosition.copyFrom(camera.globalPosition).scaleToRef(0.001, this._cameraPositionGlobal); // scale to kilometers

        // Apply the origin height to the camera position, and in doing so, compute the camera geocentric normal.
        if (scene.floatingOriginMode) {
            // When in floating origin mode, assume world space origin is at the planet center.
            // Therefore "up" is away from the planet center (0, 0, 0).
            cameraPositionGlobal.normalizeToRef(this._cameraGeocentricNormal);
            this._cameraGeocentricNormal.scaleAndAddToRef(originHeight, cameraPositionGlobal);
        } else {
            // If not in floating origin mode, offset the camera position by the origin height.
            // Assume the origin is directly above the planet surface along the up axis (y axis).
            cameraPositionGlobal.y += planetRadius + originHeight;
            cameraPositionGlobal.normalizeToRef(this._cameraGeocentricNormal);
        }

        this._cameraRadius = cameraPositionGlobal.length(); // distance from planet center
        this._cameraHeight = this._cameraRadius - planetRadius; // height above planet surface

        // Clamp the camera parameters.
        this._clampedCameraRadius = this._cameraRadius;
        if (this._clampedCameraRadius < planetRadiusWithOffset) {
            this._clampedCameraRadius = planetRadiusWithOffset;
            this._cameraGeocentricNormal.scaleToRef(planetRadiusWithOffset, this._clampedCameraPositionGlobal);
        } else {
            this._clampedCameraPositionGlobal.copyFrom(cameraPositionGlobal);
        }

        this._cosCameraHorizonAngleFromZenith = ComputeCosHorizonAngleFromZenith(planetRadius, this._clampedCameraRadius);
        this._sinCameraAtmosphereHorizonAngleFromNadir = Math.min(1.0, atmosphereRadius / this._clampedCameraRadius);
        this._clampedCameraHeight = this._clampedCameraRadius - planetRadius;

        // Compute the direction to the light relative to the camera's geocentric normal.
        {
            this._cosAngleLightToZenith = Vector3Dot(directionToLight, this._cameraGeocentricNormal);
            const lightZenithSinAngle = Math.sqrt(Math.max(0.0, 1.0 - this._cosAngleLightToZenith * this._cosAngleLightToZenith));
            this._directionToLightRelativeToCameraGeocentricNormal.copyFromFloats(lightZenithSinAngle, this._cosAngleLightToZenith, 0.0);
            this._directionToLightRelativeToCameraGeocentricNormal.normalize();
        }
    }
}

const ComputeCosHorizonAngleFromZenith = (planetRadius: number, radius: number): number => {
    const sinHorizonAngleFromNadir = Math.min(1, planetRadius / radius);
    const cosHorizonAngleFromNadir = Math.sqrt(1 - sinHorizonAngleFromNadir * sinHorizonAngleFromNadir);
    const cosHorizonAngleFromZenith = -cosHorizonAngleFromNadir;
    return cosHorizonAngleFromZenith;
};
