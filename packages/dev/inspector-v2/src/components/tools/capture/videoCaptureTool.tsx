import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import type { FunctionComponent } from "react";
import { useState, useCallback } from "react";
import type { Scene } from "core/scene";
import { RecordRegular, RecordStopRegular } from "@fluentui/react-icons";
import { VideoRecorder } from "core/Misc/videoRecorder";
import { useResource } from "../../../hooks/resourceHooks";

export const VideoCaptureTool: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const [isRecording, setIsRecording] = useState(false);
    const videoRecorder = useResource(
        useCallback(() => {
            return new VideoRecorder(scene.getEngine());
        }, [scene.getEngine()])
    );

    const recordVideoAsync = useCallback(async () => {
        if (videoRecorder && videoRecorder.isRecording) {
            videoRecorder.stopRecording();
            setIsRecording(false);
            return;
        }

        void videoRecorder.startRecording(undefined, 0); // Use 0 to prevent automatic stop; let the user stop it
        setIsRecording(true);
    }, [scene]);

    return (
        <>
            <ButtonLine label={isRecording ? "Stop Recording" : "Record Video"} icon={isRecording ? RecordStopRegular : RecordRegular} onClick={recordVideoAsync} />
        </>
    );
};
