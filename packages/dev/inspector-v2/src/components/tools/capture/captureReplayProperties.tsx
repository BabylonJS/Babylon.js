import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { IndentedTextLineComponent } from "shared-ui-components/lines/indentedTextLineComponent";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { useState, useRef, useCallback } from "react";
import { Tools } from "core/Misc/tools";
import type { Scene } from "core/scene";
import { SceneRecorder } from "core/Misc/sceneRecorder";

interface ICaptureReplayPropertiesProps {
    scene: Scene;
}

export const CaptureReplayProperties = ({ scene }: ICaptureReplayPropertiesProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const sceneRecorder = useRef(new SceneRecorder());

    const startRecording = useCallback(async () => {
        sceneRecorder.current.track(scene);
        setIsRecording(true);
    }, [scene]);

    const exportReplay = useCallback(async () => {
        const content = JSON.stringify(sceneRecorder.current.getDelta());
        Tools.Download(new Blob([content]), "diff.json");
        setIsRecording(false);
    }, [sceneRecorder]);

    const applyDelta = useCallback(
        (file: File) => {
            Tools.ReadFile(file, (data) => {
                const json = JSON.parse(data as string);
                SceneRecorder.ApplyDelta(json, scene);
                setIsRecording(false);
            });
        },
        [scene]
    );

    return (
        <>
            {!isRecording && <ButtonLine label="Start recording" onClick={startRecording} />}
            {isRecording && <IndentedTextLineComponent value={"Record in progress"} />}
            {isRecording && <ButtonLine label="Generate delta file" onClick={exportReplay} />}
            <FileButtonLine label={`Apply delta file`} onClick={(file) => applyDelta(file)} accept=".json" />
        </>
    );
};
