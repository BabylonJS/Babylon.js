import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { FollowCamera } from "core/Cameras/followCamera";
import { FlyCamera } from "core/Cameras/flyCamera";
import { GeospatialCamera } from "core/Cameras/geospatialCamera";
import { Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { SettingsPopover } from "./settingsPopover";
import { QuickCreateSection, QuickCreateRow } from "./quickCreateLayout";

type CamerasContentProps = {
    scene: Scene;
};

/**
 * Cameras content component
 * @param props - Component props
 * @returns React component
 */
export const CamerasContent: FunctionComponent<CamerasContentProps> = ({ scene }) => {
    // ArcRotate Camera state
    const [arcRotateCameraName, setArcRotateCameraName] = useState("ArcRotate Camera");
    const [arcRotateCameraTarget, setArcRotateCameraTarget] = useState(new Vector3(0, 0, 0));
    const [arcRotateCameraRadius, setArcRotateCameraRadius] = useState(10);
    const [arcRotateCameraAlpha, setArcRotateCameraAlpha] = useState(0);
    const [arcRotateCameraBeta, setArcRotateCameraBeta] = useState(45);
    const [arcRotateCameraUseRadians, setArcRotateCameraUseRadians] = useState(false);

    // Universal Camera state
    const [universalCameraName, setUniversalCameraName] = useState("Universal Camera");
    const [universalCameraPosition, setUniversalCameraPosition] = useState(new Vector3(0, 1, -10));

    // Free Camera state
    const [freeCameraName, setFreeCameraName] = useState("Free Camera");
    const [freeCameraPosition, setFreeCameraPosition] = useState(new Vector3(0, 1, -10));

    // Follow Camera state
    const [followCameraName, setFollowCameraName] = useState("Follow Camera");
    const [followCameraPosition, setFollowCameraPosition] = useState(new Vector3(0, 5, -10));
    const [followCameraRadius, setFollowCameraRadius] = useState(10);
    const [followCameraHeightOffset, setFollowCameraHeightOffset] = useState(4);
    const [followCameraRotationOffset, setFollowCameraRotationOffset] = useState(0);

    // Fly Camera state
    const [flyCameraName, setFlyCameraName] = useState("Fly Camera");
    const [flyCameraPosition, setFlyCameraPosition] = useState(new Vector3(0, 1, -10));

    // Geospatial Camera state
    const [geospatialCameraName, setGeospatialCameraName] = useState("Geospatial Camera");
    const [geospatialCameraPlanetRadius, setGeospatialCameraPlanetRadius] = useState(6371000);

    const handleCreateArcRotateCamera = () => {
        const alpha = arcRotateCameraUseRadians ? arcRotateCameraAlpha : (arcRotateCameraAlpha * Math.PI) / 180;
        const beta = arcRotateCameraUseRadians ? arcRotateCameraBeta : (arcRotateCameraBeta * Math.PI) / 180;

        const camera = new ArcRotateCamera(arcRotateCameraName, alpha, beta, arcRotateCameraRadius, arcRotateCameraTarget, scene);
        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
        if (!scene.activeCamera) {
            scene.activeCamera = camera;
        }
    };

    const handleCreateUniversalCamera = () => {
        const camera = new UniversalCamera(universalCameraName, universalCameraPosition, scene);
        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
        if (!scene.activeCamera) {
            scene.activeCamera = camera;
        }
    };

    const handleCreateFreeCamera = () => {
        const camera = new FreeCamera(freeCameraName, freeCameraPosition, scene);
        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
        if (!scene.activeCamera) {
            scene.activeCamera = camera;
        }
    };

    const handleCreateFollowCamera = () => {
        const camera = new FollowCamera(followCameraName, followCameraPosition, scene);
        camera.radius = followCameraRadius;
        camera.heightOffset = followCameraHeightOffset;
        camera.rotationOffset = followCameraRotationOffset;
        camera.attachControl(true);
        if (!scene.activeCamera) {
            scene.activeCamera = camera;
        }
    };

    const handleCreateFlyCamera = () => {
        const camera = new FlyCamera(flyCameraName, flyCameraPosition, scene);
        camera.attachControl(true);
        if (!scene.activeCamera) {
            scene.activeCamera = camera;
        }
    };

    const handleCreateGeospatialCamera = () => {
        const camera = new GeospatialCamera(geospatialCameraName, scene, { planetRadius: geospatialCameraPlanetRadius });
        camera.attachControl(true);
        if (!scene.activeCamera) {
            scene.activeCamera = camera;
        }
    };

    return (
        <QuickCreateSection>
            {/* ArcRotate Camera */}
            <QuickCreateRow>
                <Button onClick={handleCreateArcRotateCamera} label="ArcRotate Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={arcRotateCameraName} onChange={(value) => setArcRotateCameraName(value)} />
                    <Vector3PropertyLine label="Target" value={arcRotateCameraTarget} onChange={(value) => setArcRotateCameraTarget(value)} />
                    <SpinButtonPropertyLine label="Radius" value={arcRotateCameraRadius} onChange={(value) => setArcRotateCameraRadius(value)} min={0.1} max={1000} step={0.5} />
                    <SpinButtonPropertyLine
                        label={`Alpha ${arcRotateCameraUseRadians ? "(rad)" : "(deg)"}`}
                        value={arcRotateCameraAlpha}
                        onChange={(value) => setArcRotateCameraAlpha(value)}
                        min={arcRotateCameraUseRadians ? -Math.PI * 2 : -360}
                        max={arcRotateCameraUseRadians ? Math.PI * 2 : 360}
                        step={arcRotateCameraUseRadians ? 0.1 : 5}
                    />
                    <SpinButtonPropertyLine
                        label={`Beta ${arcRotateCameraUseRadians ? "(rad)" : "(deg)"}`}
                        value={arcRotateCameraBeta}
                        onChange={(value) => setArcRotateCameraBeta(value)}
                        min={arcRotateCameraUseRadians ? 0 : 0}
                        max={arcRotateCameraUseRadians ? Math.PI : 180}
                        step={arcRotateCameraUseRadians ? 0.1 : 5}
                    />
                    <CheckboxPropertyLine label="Use Radians" value={arcRotateCameraUseRadians} onChange={(value) => setArcRotateCameraUseRadians(value)} />
                    <Button appearance="primary" onClick={handleCreateArcRotateCamera} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Universal Camera */}
            <QuickCreateRow>
                <Button onClick={handleCreateUniversalCamera} label="Universal Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={universalCameraName} onChange={(value) => setUniversalCameraName(value)} />
                    <Vector3PropertyLine label="Position" value={universalCameraPosition} onChange={(value) => setUniversalCameraPosition(value)} />
                    <Button appearance="primary" onClick={handleCreateUniversalCamera} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Free Camera */}
            <QuickCreateRow>
                <Button onClick={handleCreateFreeCamera} label="Free Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={freeCameraName} onChange={(value) => setFreeCameraName(value)} />
                    <Vector3PropertyLine label="Position" value={freeCameraPosition} onChange={(value) => setFreeCameraPosition(value)} />
                    <Button appearance="primary" onClick={handleCreateFreeCamera} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Follow Camera */}
            <QuickCreateRow>
                <Button onClick={handleCreateFollowCamera} label="Follow Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={followCameraName} onChange={(value) => setFollowCameraName(value)} />
                    <Vector3PropertyLine label="Position" value={followCameraPosition} onChange={(value) => setFollowCameraPosition(value)} />
                    <SpinButtonPropertyLine label="Radius" value={followCameraRadius} onChange={(value) => setFollowCameraRadius(value)} min={0.1} max={1000} step={0.5} />
                    <SpinButtonPropertyLine
                        label="Height Offset"
                        value={followCameraHeightOffset}
                        onChange={(value) => setFollowCameraHeightOffset(value)}
                        min={-100}
                        max={100}
                        step={0.5}
                    />
                    <SpinButtonPropertyLine
                        label="Rotation Offset (deg)"
                        value={followCameraRotationOffset}
                        onChange={(value) => setFollowCameraRotationOffset(value)}
                        min={-180}
                        max={180}
                        step={5}
                    />
                    <Button appearance="primary" onClick={handleCreateFollowCamera} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Fly Camera */}
            <QuickCreateRow>
                <Button onClick={handleCreateFlyCamera} label="Fly Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={flyCameraName} onChange={(value) => setFlyCameraName(value)} />
                    <Vector3PropertyLine label="Position" value={flyCameraPosition} onChange={(value) => setFlyCameraPosition(value)} />
                    <Button appearance="primary" onClick={handleCreateFlyCamera} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Geospatial Camera */}
            <QuickCreateRow>
                <Button onClick={handleCreateGeospatialCamera} label="Geospatial Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={geospatialCameraName} onChange={(value) => setGeospatialCameraName(value)} />
                    <SpinButtonPropertyLine
                        label="Planet Radius (m)"
                        value={geospatialCameraPlanetRadius}
                        onChange={(value) => setGeospatialCameraPlanetRadius(value)}
                        min={1000}
                        max={100000000}
                        step={1000}
                    />
                    <Button appearance="primary" onClick={handleCreateGeospatialCamera} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>
        </QuickCreateSection>
    );
};
