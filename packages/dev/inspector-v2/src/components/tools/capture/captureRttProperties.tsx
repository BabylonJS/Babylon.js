import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import type { Scene } from "core/scene";
import { Tools } from "core/Misc/tools";
import { useCallback, useState } from "react";
import type { IScreenshotSize } from "core/Misc/interfaces/screenshotSize";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { SyncedSliderLine } from "shared-ui-components/fluent/hoc/syncedSliderLine";

interface ICaptureRttPropertiesProps {
    scene: Scene;
}

export const CaptureRttProperties = ({ scene }: ICaptureRttPropertiesProps) => {
    const [useWidthHeight, setUseWidthHeight] = useState(false);
    const [screenshotSize, setScreenshotSize] = useState<IScreenshotSize>({ precision: 1 });

    const captureRender = useCallback(async () => {
        const sizeToUse: IScreenshotSize = { ...screenshotSize };
        if (!useWidthHeight) {
            sizeToUse.width = undefined;
            sizeToUse.height = undefined;
        }

        if (scene.activeCamera) {
            Tools.CreateScreenshotUsingRenderTarget(scene.getEngine(), scene.activeCamera, sizeToUse, undefined, undefined, 4);
        }
    }, [scene, screenshotSize, useWidthHeight]);

    return (
        <>
            <ButtonLine label="Capture" onClick={captureRender} />
            <SyncedSliderLine
                label="Precision"
                value={screenshotSize.precision ?? 1}
                onChange={(value) => setScreenshotSize({ ...screenshotSize, precision: value ?? 1 })}
                min={0.1}
                max={10}
                step={0.1}
            />
            <SwitchPropertyLine label="Use Width/Height" value={useWidthHeight} onChange={(value) => setUseWidthHeight(value)} />
            {useWidthHeight && (
                <>
                    <SyncedSliderLine
                        label="Width"
                        value={screenshotSize.width ?? 512}
                        onChange={(data) => setScreenshotSize({ ...screenshotSize, width: data ?? 512 })}
                        min={1}
                        step={1}
                    />
                    <SyncedSliderLine label="Height" value={screenshotSize.height ?? 512} onChange={(data) => setScreenshotSize({ ...screenshotSize, height: data ?? 512 })} />
                </>
            )}
        </>
    );
};
