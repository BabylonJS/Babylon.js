import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { makeStyles, tokens } from "@fluentui/react-components";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { SettingsPopover } from "./settingsPopover";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
    row: { display: "flex", alignItems: "center", gap: "4px" },
});

type CamerasContentProps = {
    scene: Scene;
};

/**
 * Cameras content component
 * @param props - Component props
 * @returns React component
 */
export const CamerasContent: FunctionComponent<CamerasContentProps> = ({ scene }) => {
    const classes = useStyles();

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

    return (
        <div className={classes.section}>
            {/* ArcRotate Camera */}
            <div className={classes.row}>
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
            </div>

            {/* Universal Camera */}
            <div className={classes.row}>
                <Button onClick={handleCreateUniversalCamera} label="Universal Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={universalCameraName} onChange={(value) => setUniversalCameraName(value)} />
                    <Vector3PropertyLine label="Position" value={universalCameraPosition} onChange={(value) => setUniversalCameraPosition(value)} />
                    <Button appearance="primary" onClick={handleCreateUniversalCamera} label="Create" />
                </SettingsPopover>
            </div>
        </div>
    );
};
