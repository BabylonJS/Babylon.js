import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SyncedSliderLine } from "shared-ui-components/fluent/hoc/syncedSliderLine";
import { useState, useRef } from "react";
import GIF from "gif.js.optimized";
import { Tools } from "core/Misc/tools";
import type { Scene } from "core/scene";

interface IGifPaneProps {
    scene: Scene;
}

export const GifPane = ({ scene }: IGifPaneProps) => {
    const [gifOptions, setGifOptions] = useState({ width: 512, frequency: 200 });
    const [crunchingGIF, setCrunchingGIF] = useState(false);
    const gifRecorder = useRef<any>(null);
    const gifWorkerBlob = useRef<Blob | null>(null);
    const previousRenderingScale = useRef<number>(1);

    const recordGIFInternal = () => {
        const workerUrl = URL.createObjectURL(gifWorkerBlob.current!);
        gifRecorder.current = new GIF({
            workers: 2,
            quality: 10,
            workerScript: workerUrl,
        });
        const engine = scene.getEngine();

        previousRenderingScale.current = engine.getHardwareScalingLevel();
        engine.setHardwareScalingLevel(engine.getRenderWidth() / gifOptions.width || 1);

        const intervalId = setInterval(() => {
            if (!gifRecorder.current) {
                clearInterval(intervalId);
                return;
            }
            gifRecorder.current.addFrame(engine.getRenderingCanvas(), { delay: 0, copy: true });
        }, gifOptions.frequency);

        gifRecorder.current.on("finished", (blob: Blob) => {
            setCrunchingGIF(false);
            Tools.Download(blob, "record.gif");

            URL.revokeObjectURL(workerUrl);
            engine.setHardwareScalingLevel(previousRenderingScale.current);
        });
    };

    const recordGIFAsync = async () => {
        if (gifRecorder.current) {
            setCrunchingGIF(true);
            gifRecorder.current.render();
            gifRecorder.current = null;
            return;
        }

        if (gifWorkerBlob.current) {
            recordGIFInternal();
            return;
        }

        const workerJs = await Tools.LoadFileAsync("https://cdn.jsdelivr.net/gh//terikon/gif.js.optimized@0.1.6/dist/gif.worker.js");

        // Ensure assignment is always based on the latest ref value
        if (!gifWorkerBlob.current) {
            gifWorkerBlob.current = new Blob([workerJs], {
                type: "application/javascript",
            });
        }
        recordGIFInternal();
    };

    return (
        <>
            {crunchingGIF && <div>Creating the GIF file...</div>}
            {!crunchingGIF && <ButtonLine label={gifRecorder.current ? "Stop" : "Record"} onClick={recordGIFAsync} />}
            {!crunchingGIF && !gifRecorder.current && (
                <>
                    <SyncedSliderLine label="Resolution" value={gifOptions.width} onChange={(value) => setGifOptions({ ...gifOptions, width: value })} min={1} step={1} />
                    <SyncedSliderLine
                        label="Frequency (ms)"
                        value={gifOptions.frequency}
                        onChange={(value) => setGifOptions({ ...gifOptions, frequency: value })}
                        min={1}
                        step={1}
                    />
                </>
            )}
        </>
    );
};
