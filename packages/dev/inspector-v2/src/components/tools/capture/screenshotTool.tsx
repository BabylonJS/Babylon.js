import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useState, useCallback } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import type { IScreenshotSize } from "core/Misc/interfaces/screenshotSize";
import { CameraRegular } from "@fluentui/react-icons";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";
import { CreateScreenshotAsync } from "core/Misc/screenshotTools";
import type { Nullable } from "core/types";

export const ScreenshotTool: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const [precision, setPrecision] = useState<Nullable<number>>(1);
    const [width, setWidth] = useState<Nullable<number>>(null);
    const [height, setHeight] = useState<Nullable<number>>(null);

    const captureScreenshot = useCallback(async () => {
        const camera = scene.frameGraph ? FrameGraphUtils.FindMainCamera(scene.frameGraph) : scene.activeCamera;
        const sizeToUse: IScreenshotSize = { precision: precision ?? undefined, width: width ?? undefined, height: height ?? undefined };

        if (camera) {
            await CreateScreenshotAsync(scene.getEngine(), camera, sizeToUse, undefined, undefined, undefined, undefined, true);
        }
    }, [precision, width, height, scene]);

    return (
        <>
            <ButtonLine label="Capture Screenshot" icon={CameraRegular} onClick={captureScreenshot} />
            <SyncedSliderPropertyLine
                label="Precision"
                description="A scale factor for the resolution. Multiplies the width and height of the screenshot."
                value={precision ?? 1}
                nullable
                ignoreNullable={false}
                onChange={setPrecision}
                defaultValue={1}
                min={0.1}
                max={10}
                step={0.1}
            />
            <SyncedSliderPropertyLine
                label="Width"
                description="The width of the screenshot in pixels. "
                value={width ?? 512}
                nullable
                ignoreNullable={false}
                onChange={(value) => setWidth(value !== null ? Math.floor(value) : null)}
                defaultValue={512}
                min={1}
                step={1}
            />
            <SyncedSliderPropertyLine
                label="Height"
                description="The height of the screenshot in pixels."
                value={height ?? 512}
                nullable
                ignoreNullable={false}
                onChange={(value) => setHeight(value !== null ? Math.floor(value) : null)}
                defaultValue={512}
                min={1}
                step={1}
            />
        </>
    );
};
