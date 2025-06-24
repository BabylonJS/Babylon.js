import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import type { Scene } from "core/scene";
import { Tools } from "core/Misc/tools";
import { VideoRecorder } from "core/Misc/videoRecorder";
import { captureEquirectangularFromScene } from "core/Misc/equirectangularCapture";
import { useCallback, useRef, useState } from "react";

interface ICaptureScreenshotPropertiesProps {
    scene: Scene;
}

export const CaptureScreenshotProperties = ({ scene }: ICaptureScreenshotPropertiesProps) => {
    const [recordVideoText, setRecordVideoText] = useState("Record video");
    const videoRecorder = useRef<VideoRecorder | null>(null);

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
            void videoRecorder.current.stopRecording();
            return;
        }

        if (!videoRecorder.current) {
            videoRecorder.current = new VideoRecorder(scene.getEngine());
        }

        await videoRecorder.current.startRecording();
        setRecordVideoText("Stop recording");
    }, [scene]);

    return (
        <>
            <ButtonLine label="Screenshot" onClick={captureScreenshot} />
            <ButtonLine label="Generate equirectangular capture" onClick={captureEquirectangularAsync} />
            <ButtonLine label={recordVideoText} onClick={recordVideoAsync} />
        </>
    );
};
