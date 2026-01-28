import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useState, useCallback, useEffect } from "react";
import type { Scene } from "core/scene";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { RecordRegular, RecordStopRegular } from "@fluentui/react-icons";
import { Tools } from "core/Misc/tools";
import { Label } from "@fluentui/react-components";
import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import type gif from "gif.js.optimized";
import type { Observer } from "core/Misc/observable";

type RecordingSession =
    | {
          state: "Recording";
          gif: gif;
          captureObserver: Observer<Scene>;
          previousHardwareScaling: number;
      }
    | {
          state: "Rendering";
          gif: gif;
      }
    | {
          state: "Idle";
      };

export const GIFCaptureTool = MakeLazyComponent(
    async () => {
        const gif = (await import("gif.js.optimized")).default;

        // TODO: Figure out how to grab this from NPM package instead of CDN
        const workerContent = await Tools.LoadFileAsync("https://cdn.jsdelivr.net/gh//terikon/gif.js.optimized@0.1.6/dist/gif.worker.js");
        const workerBlob = new Blob([workerContent], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(workerBlob);

        return ({ scene }: { scene: Scene }) => {
            const [recordingSession, setRecordingSession] = useState<RecordingSession>({ state: "Idle" });
            const [targetWidth, setTargetWidth] = useState(512);
            const [frequency, setFrequency] = useState(200);

            useEffect(() => {
                return () => {
                    if (recordingSession.state === "Recording") {
                        // Reset session resources if component is unmounted
                        scene.onAfterRenderObservable.remove(recordingSession.captureObserver);
                        scene.getEngine().setHardwareScalingLevel(recordingSession.previousHardwareScaling);
                    }
                };
            }, [recordingSession, scene]);

            // Use functional setState to guard against multiple rapid clicks
            const startRecording = useCallback(() => {
                setRecordingSession((currentSession) => {
                    // If already recording/rendering, don't start a new session
                    if (currentSession.state !== "Idle") {
                        return currentSession;
                    }

                    const engine = scene.getEngine();
                    const canvas = engine.getRenderingCanvas();
                    if (!canvas) {
                        return currentSession;
                    }

                    const gifInstance = new gif({
                        workers: 2,
                        quality: 10,
                        workerScript: workerUrl,
                    });

                    // Adjust hardware scaling to match desired width
                    const previousHardwareScaling = engine.getHardwareScalingLevel();
                    engine.setHardwareScalingLevel(engine.getRenderWidth() / (targetWidth * globalThis.devicePixelRatio) || 1);

                    // Capture frames after each render
                    let lastCaptureTime = 0;
                    const captureObserver = scene.onAfterRenderObservable.add(() => {
                        const now = Date.now();
                        if (now - lastCaptureTime >= frequency && gifInstance) {
                            lastCaptureTime = now;
                            gifInstance.addFrame(canvas, { delay: 1, copy: true });
                        }
                    });

                    return {
                        state: "Recording",
                        gif: gifInstance,
                        captureObserver: captureObserver,
                        previousHardwareScaling: previousHardwareScaling,
                    };
                });
            }, [scene, targetWidth, frequency]);

            const stopRecording = useCallback(() => {
                setRecordingSession((currentSession) => {
                    if (currentSession.state !== "Recording") {
                        return currentSession;
                    }

                    // Remove the frame capture observer
                    scene.onAfterRenderObservable.remove(currentSession.captureObserver);

                    // Restore previous hardware scaling
                    scene.getEngine().setHardwareScalingLevel(currentSession.previousHardwareScaling);

                    currentSession.gif.on("finished", (blob: Blob) => {
                        // Download the rendered GIF
                        Tools.Download(blob, "recording.gif");

                        // Reset state
                        setRecordingSession({ state: "Idle" });
                    });

                    // Start rendering the GIF
                    currentSession.gif.render();

                    return { state: "Rendering", gif: currentSession.gif };
                });
            }, [scene]);

            return (
                <>
                    {recordingSession.state === "Idle" && <ButtonLine label="Record GIF" icon={RecordRegular} onClick={startRecording} />}
                    {recordingSession.state === "Recording" && <ButtonLine label="Stop" icon={RecordStopRegular} onClick={stopRecording} />}
                    {recordingSession.state === "Rendering" && <Label>Creating the GIF file...</Label>}
                    <Collapse visible={recordingSession.state === "Idle"}>
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
