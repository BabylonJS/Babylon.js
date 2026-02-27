import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useCallback } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import { captureEquirectangularFromScene } from "core/Misc/equirectangularCapture";
import { CameraRegular } from "@fluentui/react-icons";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";

export const EquirectangularCaptureTool: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const captureEquirectangularAsync = useCallback(async () => {
        const currentActiveCamera = scene.activeCamera;
        if (!currentActiveCamera && scene.frameGraph) {
            scene.activeCamera = FrameGraphUtils.FindMainCamera(scene.frameGraph);
        }
        if (scene.activeCamera) {
            await captureEquirectangularFromScene(scene, { size: 1024, filename: "equirectangular_capture.png" });
        }
        // eslint-disable-next-line require-atomic-updates
        scene.activeCamera = currentActiveCamera;
    }, [scene]);

    return <ButtonLine label="Capture Equirectangular" icon={CameraRegular} onClick={captureEquirectangularAsync} />;
};
