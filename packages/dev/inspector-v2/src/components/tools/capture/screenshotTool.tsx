import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useState, useCallback } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { CameraRegular } from "@fluentui/react-icons";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";
import { CreateScreenshotUsingRenderTargetAsync } from "core/Misc/screenshotTools";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";

export const ScreenshotTool: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const [precision, setPrecision] = useState<number>(1);
    const [useCustomSize, setUseCustomSize] = useState<boolean>(false);
    const [width, setWidth] = useState<number>(512);
    const [height, setHeight] = useState<number>(512);

    const captureScreenshot = useCallback(async () => {
        const engine = scene.getEngine();
        const camera = scene.frameGraph ? FrameGraphUtils.FindMainCamera(scene.frameGraph) : scene.activeCamera;
        const screenshotSize = useCustomSize ? { width, height, precision } : { precision };

        if (camera) {
            await CreateScreenshotUsingRenderTargetAsync(engine, camera, screenshotSize, "image/png", undefined, undefined, "screenshot.png");
        }
    }, [useCustomSize, precision, width, height, scene]);

    return (
        <>
            <ButtonLine label="Capture Screenshot" icon={CameraRegular} onClick={captureScreenshot} />
            <SyncedSliderPropertyLine
                label="Precision"
                description="A multiplier allowing capture at a higher or lower resolution."
                value={precision}
                onChange={setPrecision}
                min={0.1}
                max={10}
                step={0.1}
            />
            <SwitchPropertyLine label="Use Custom Size" value={useCustomSize} onChange={setUseCustomSize} />
            <Collapse visible={useCustomSize}>
                <SyncedSliderPropertyLine label="Width" description="The width of the screenshot in pixels. " value={width} onChange={setWidth} min={1} step={1} />
                <SyncedSliderPropertyLine label="Height" description="The height of the screenshot in pixels." value={height} onChange={setHeight} min={1} step={1} />
            </Collapse>
        </>
    );
};
