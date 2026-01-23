import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useState, useCallback, useMemo } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import type { IScreenshotSize } from "core/Misc/interfaces/screenshotSize";
import { CameraRegular } from "@fluentui/react-icons";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";
import { CreateScreenshotAsync } from "core/Misc/screenshotTools";
import { BoundProperty } from "../../properties/boundProperty";

export const ScreenshotTool: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const [screenshotSize, setScreenshotSize] = useState<IScreenshotSize>({ precision: 1, width: undefined, height: undefined });

    // Create a proxy object for screenshotSize for convenient use of BoundProperty
    const screenshotSizeProxy = useMemo(() => {
        return new Proxy(screenshotSize, {
            set(target, prop: keyof IScreenshotSize, value) {
                setScreenshotSize({ ...target, [prop]: value });
                return true;
            },
        });
    }, [screenshotSize]);

    const captureScreenshot = useCallback(async () => {
        const camera = scene.frameGraph ? FrameGraphUtils.FindMainCamera(scene.frameGraph) : scene.activeCamera;
        const sizeToUse: IScreenshotSize = { ...screenshotSize };

        if (camera) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            CreateScreenshotAsync(scene.getEngine(), camera, sizeToUse, undefined, undefined, undefined, undefined, true);
        }
    }, [scene, screenshotSize]);

    return (
        <>
            <ButtonLine label="Capture Screenshot" icon={CameraRegular} onClick={captureScreenshot} />
            <BoundProperty
                label="Precision"
                description="A scale factor for the resolution. Multiplies the width and height of the screenshot."
                component={SyncedSliderPropertyLine}
                target={screenshotSizeProxy}
                propertyKey="precision"
                nullable
                defaultValue={1}
                min={0.1}
                max={10}
                step={0.1}
            />
            <BoundProperty
                label="Width"
                description="The width of the screenshot in pixels. "
                component={SyncedSliderPropertyLine}
                target={screenshotSizeProxy}
                propertyKey="width"
                nullable
                defaultValue={512}
                min={1}
                step={1}
            />
            <BoundProperty
                label="Height"
                description="The height of the screenshot in pixels."
                component={SyncedSliderPropertyLine}
                target={screenshotSizeProxy}
                propertyKey="height"
                nullable
                defaultValue={512}
                min={1}
                step={1}
            />
        </>
    );
};
