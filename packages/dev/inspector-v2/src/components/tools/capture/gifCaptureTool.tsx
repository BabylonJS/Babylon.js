import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useState, useCallback } from "react";
import type { Scene } from "core/scene";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { RecordRegular, RecordStopRegular } from "@fluentui/react-icons";
import { Tools } from "core/Misc/tools";
import { Label } from "@fluentui/react-components";
import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import type { Nullable } from "core/types";
import type gif from "gif.js.optimized";
import type { Observer } from "core/Misc/observable";

type RecordingState = "Idle" | "Recording" | "Rendering";

type RecordingResources = {
    gif: gif;
    captureObserver: Observer<Scene>;
    previousHardwareScaling: number;
};

export const GIFCaptureTool = MakeLazyComponent(
    async () => {
        const gif = (await import("gif.js.optimized")).default;

        // TODO: Figure out how to grab this from NPM package instead of CDN
        const workerContent = await Tools.LoadFileAsync("https://cdn.jsdelivr.net/gh//terikon/gif.js.optimized@0.1.6/dist/gif.worker.js");
        const workerBlob = new Blob([workerContent], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(workerBlob);

        return ({ scene }: { scene: Scene }) => {
            const [recordingState, setRecordingState] = useState<RecordingState>("Idle");
            const [recordingResources, setRecordingResources] = useState<Nullable<RecordingResources>>(null);
            const [targetWidth, setTargetWidth] = useState(512);
            const [frequency, setFrequency] = useState(200);

            const startRecording = useCallback(() => {
                if (recordingState !== "Idle") {
                    return;
                }

                // Set state immediately to recording so future button clicks don't start multiple recordings
                setRecordingState("Recording");

                const engine = scene.getEngine();
                const canvas = engine.getRenderingCanvas();
                if (!canvas) {
                    return;
                }

                const gifInstance = new gif({
                    workers: 2,
                    quality: 10,
                    workerScript: workerUrl,
                });

                // Adjust hardware scaling to match desired width
                const previousHardwareScaling = engine.getHardwareScalingLevel();
                engine.setHardwareScalingLevel(engine.getRenderWidth() / (targetWidth * globalThis.devicePixelRatio) || 1);

                // Capture frames after each render using onEndFrameObservable (TODO: better method for this)
                let lastCaptureTime = 0;
                const captureObserver = scene.onAfterRenderObservable.add(() => {
                    const now = Date.now();
                    if (now - lastCaptureTime >= frequency && gifInstance) {
                        lastCaptureTime = now;
                        gifInstance.addFrame(canvas, { delay: 1, copy: true });
                    }
                });

                setRecordingResources({
                    gif: gifInstance,
                    captureObserver: captureObserver,
                    previousHardwareScaling: previousHardwareScaling,
                });
            }, [recordingState, setRecordingState, setRecordingResources, scene, targetWidth, frequency]);

            const stopRecording = useCallback(() => {
                if (recordingState !== "Recording") {
                    return;
                }

                if (!recordingResources) {
                    return;
                }

                // Remove the frame capture observer
                scene.onAfterRenderObservable.remove(recordingResources.captureObserver);

                // Restore previous hardware scaling
                scene.getEngine().setHardwareScalingLevel(recordingResources.previousHardwareScaling);

                if (recordingResources.gif) {
                    recordingResources.gif.on("finished", (blob: Blob) => {
                        // Download the rendered GIF
                        Tools.Download(blob, "recording.gif");

                        // Reset state
                        setRecordingState("Idle");
                        setRecordingResources(null);
                    });

                    // Start rendering the GIF
                    setRecordingState("Rendering");
                    recordingResources.gif.render();
                }
            }, [recordingState, setRecordingState, recordingResources, setRecordingResources, scene]);

            return (
                <>
                    {recordingState === "Idle" && <ButtonLine label="Record GIF" icon={RecordRegular} onClick={startRecording} />}
                    {recordingState === "Recording" && <ButtonLine label="Stop" icon={RecordStopRegular} onClick={stopRecording} />}
                    {recordingState === "Rendering" && <Label>Creating the GIF file...</Label>}
                    <Collapse visible={recordingState === "Idle"}>
                        <SyncedSliderPropertyLine
                            label="Resolution"
                            description="The pixel width of the output. The height will be adjusted accordingly to maintain the aspect ratio."
                            value={targetWidth}
                            onChange={(value) => setTargetWidth(Math.floor(value))}
                            min={128}
                            max={2048}
                            step={128}
                        />
                        <SyncedSliderPropertyLine
                            label="Frequency (ms)"
                            description="The time interval in milliseconds between each capture of the scene."
                            value={frequency}
                            onChange={(value) => setFrequency(Math.floor(value))}
                            min={50}
                            max={1000}
                            step={50}
                        />
                    </Collapse>
                </>
            );
        };
    },
    { spinnerSize: "extra-tiny", spinnerLabel: "Loading..." }
);
