import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useState, useCallback } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import { RecordRegular, SaveRegular, ArrowDownloadRegular } from "@fluentui/react-icons";
import { SceneRecorder } from "core/Misc/sceneRecorder";
import { Tools } from "core/Misc/tools";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Label } from "@fluentui/react-components";
import { Logger } from "core/Misc/logger";
import { useResource } from "../../../hooks/resourceHooks";

export const SceneReplayTool: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const [isRecording, setIsRecording] = useState(false);
    const sceneRecorder = useResource(() => new SceneRecorder());

    const startRecording = useCallback(() => {
        sceneRecorder.track(scene);
        setIsRecording(true);
    }, [scene]);

    const exportReplay = useCallback(() => {
        const content = JSON.stringify(sceneRecorder.getDelta());
        const blob = new Blob([content], { type: "application/json" });
        Tools.Download(blob, "replay_delta.json");
        setIsRecording(false);
    }, []);

    const applyDelta = useCallback(
        (files: FileList) => {
            const file = files[0];
            if (!file) {
                return;
            }

            Tools.ReadFile(
                file,
                (data) => {
                    try {
                        const json = JSON.parse(data);
                        SceneRecorder.ApplyDelta(json, scene);
                    } catch (error) {
                        Logger.Error("Failed to apply replay delta:" + error);
                    }
                },
                undefined,
                false
            );
        },
        [scene]
    );

    return (
        <>
            {!isRecording && <ButtonLine label="Start Recording" icon={RecordRegular} onClick={startRecording} />}
            {isRecording && (
                <>
                    <Label>Recording in progress...</Label>
                    <ButtonLine label="Generate Delta File" icon={SaveRegular} onClick={exportReplay} />
                </>
            )}
            <FileUploadLine label="Apply Delta File" icon={ArrowDownloadRegular} onClick={applyDelta} accept=".json" />
        </>
    );
};
