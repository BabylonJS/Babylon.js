import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useState, useRef, useCallback } from "react";
import type { FunctionComponent } from "react";
import { Tools } from "core/Misc/tools";
import type { Scene } from "core/scene";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import type { IScreenshotSize } from "core/Misc/interfaces/screenshotSize";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { VideoRecorder } from "core/Misc/videoRecorder";
import { captureEquirectangularFromScene } from "core/Misc/equirectangularCapture";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { CameraRegular, RecordRegular, RecordStopRegular } from "@fluentui/react-icons";

export const CaptureRttTools: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
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
            <ButtonLine label="Capture" icon={CameraRegular} onClick={captureRender} />
            <SyncedSliderPropertyLine
                label="Precision"
                value={screenshotSize.precision ?? 1}
                onChange={(value) => setScreenshotSize({ ...screenshotSize, precision: value ?? 1 })}
                min={0.1}
                max={10}
                step={0.1}
            />
            <SwitchPropertyLine label="Use Custom Width/Height" value={useWidthHeight} onChange={(value) => setUseWidthHeight(value)} />
            <Collapse visible={useWidthHeight}>
                <SyncedSliderPropertyLine
                    label="Width"
                    value={screenshotSize.width ?? 512}
                    onChange={(data) => setScreenshotSize({ ...screenshotSize, width: data ?? 512 })}
                    min={1}
                    step={1}
                />
                <SyncedSliderPropertyLine
                    label="Height"
                    value={screenshotSize.height ?? 512}
                    onChange={(data) => setScreenshotSize({ ...screenshotSize, height: data ?? 512 })}
                    min={1}
                    step={1}
                />
            </Collapse>
        </>
    );
};

export const CaptureScreenshotTools: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const [isRecording, setIsRecording] = useState(false);
    const videoRecorder = useRef<VideoRecorder>();

    const captureScreenshot = useCallback(() => {
        if (scene.activeCamera) {
            Tools.CreateScreenshot(scene.getEngine(), scene.activeCamera, { precision: 1 });
        }
    }, [scene]);

    const captureEquirectangularAsync = useCallback(async () => {
        if (scene.activeCamera) {
            await captureEquirectangularFromScene(scene, { size: 1024, filename: "equirectangular_capture.png" });
        }
    }, [scene]);

    const recordVideoAsync = useCallback(async () => {
        if (videoRecorder.current && videoRecorder.current.isRecording) {
            videoRecorder.current.stopRecording();
            setIsRecording(false);
            return;
        }

        if (!videoRecorder.current) {
            videoRecorder.current = new VideoRecorder(scene.getEngine());
        }

        void videoRecorder.current.startRecording();
        setIsRecording(true);
    }, [scene]);

    return (
        <>
            <ButtonLine label="Capture" icon={CameraRegular} onClick={captureScreenshot} />
            <ButtonLine label="Capture Equirectangular" icon={CameraRegular} onClick={captureEquirectangularAsync} />
            <ButtonLine label={isRecording ? "Stop Recording" : "Record Video"} icon={isRecording ? RecordStopRegular : RecordRegular} onClick={recordVideoAsync} />
        </>
    );
};
