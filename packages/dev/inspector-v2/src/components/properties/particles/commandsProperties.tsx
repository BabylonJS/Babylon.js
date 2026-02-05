import type { FunctionComponent } from "react";
import type { ISelectionService } from "../../../services/selectionService";
import { ArrowDownloadRegular, CloudArrowDownRegular, CloudArrowUpRegular, PlayRegular, StopRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useState } from "react";

import { Tools } from "core/Misc/tools";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleHelper } from "core/Particles/particleHelper";
import { ParticleSystem } from "core/Particles/particleSystem";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { NotifyPlaygroundOfSnippetChange, PersistSnippetId, PromptForSnippetId, SaveToSnippetServer } from "../../../misc/snippetUtils";

const SnippetDashboardStorageKey = "Babylon/InspectorV2/SnippetDashboard/ParticleSystems";

function TryParseJsonString(value: string | undefined): any {
    if (!value) {
        return undefined;
    }

    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

function ParseJsonLoadContents(contents: ArrayBuffer | string): any | undefined {
    if (contents instanceof ArrayBuffer) {
        const decoder = new TextDecoder("utf-8");
        return TryParseJsonString(decoder.decode(contents)) ?? undefined;
    }

    if (typeof contents === "string") {
        return TryParseJsonString(contents) ?? undefined;
    }

    return undefined;
}

function NormalizeParticleSystemSerialization(rawData: any): any {
    const jsonPayload = TryParseJsonString(rawData?.jsonPayload);
    const particleSystem = TryParseJsonString(jsonPayload?.particleSystem);
    return particleSystem ?? rawData;
}

/**
 * Display commands that can be applied to a particle system inside Inspector.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemCommandProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem; selectionService: ISelectionService }> = (props) => {
    const { particleSystem: system, selectionService } = props;

    const scene = system.getScene();

    const isCpuParticleSystem = system instanceof ParticleSystem;
    const isAlive = useObservableState(() => (isCpuParticleSystem ? system.isAlive() : system.isStarted()), scene?.onBeforeRenderObservable);
    const isStopping = useObservableState(() => system.isStopping(), scene?.onBeforeRenderObservable);
    const snippetId = useProperty(system, "snippetId");
    const [stopRequested, setStopRequested] = useState(false);

    useEffect(() => {
        if (!stopRequested) {
            return;
        }

        // Clear stop flag once the system fully stops.
        if (!isAlive && !isStopping) {
            setStopRequested(false);
        }
    }, [stopRequested, isAlive, isStopping]);

    const applyParticleSystemJsonToSystem = useCallback(
        (jsonObject: any) => {
            if (!scene) {
                alert("No scene available.");
                return;
            }

            const candidate = NormalizeParticleSystemSerialization(jsonObject);

            try {
                let newSystem: GPUParticleSystem | ParticleSystem;
                if (isCpuParticleSystem) {
                    newSystem = ParticleSystem.Parse(candidate, scene, "");
                } else {
                    newSystem = GPUParticleSystem.Parse(candidate, scene, "");
                }

                system.dispose();
                selectionService.selectedEntity = newSystem;
            } catch (e) {
                alert("Failed to load particle system: " + e);
            }
        },
        [scene, system, isCpuParticleSystem, selectionService]
    );

    const loadFromSnippetServer = useCallback(async () => {
        if (!scene) {
            alert("No scene available.");
            return;
        }

        const snippetId = PromptForSnippetId();
        if (!snippetId) {
            return;
        }

        const oldSnippetId = system.snippetId;

        // Dispose the old system and clear selection (v1 behavior)
        system.dispose();
        selectionService.selectedEntity = null;

        try {
            const newSystem = await ParticleHelper.ParseFromSnippetAsync(snippetId, scene, !isCpuParticleSystem);
            selectionService.selectedEntity = newSystem;

            // Notify the playground to update its code with the new snippet ID.
            NotifyPlaygroundOfSnippetChange(oldSnippetId, snippetId, "ParticleHelper.ParseFromSnippetAsync");
        } catch (err) {
            alert("Unable to load your particle system: " + err);
        }
    }, [scene, selectionService, system]);

    const saveToSnippetServer = useCallback(async () => {
        try {
            const content = JSON.stringify(system.serialize(true));
            const currentSnippetId = system.snippetId;

            const result = await SaveToSnippetServer({
                snippetUrl: ParticleHelper.SnippetUrl,
                currentSnippetId,
                content,
                payloadKey: "particleSystem",
                storageKey: SnippetDashboardStorageKey,
                entityName: "particle system",
            });

            // eslint-disable-next-line require-atomic-updates
            system.snippetId = result.snippetId;
            PersistSnippetId(SnippetDashboardStorageKey, result.snippetId);

            NotifyPlaygroundOfSnippetChange(result.oldSnippetId, result.snippetId, "ParticleSystem.ParseFromSnippetAsync");
        } catch {
            // Alert already shown by SaveToSnippetServer
        }
    }, [system]);

    return (
        <>
            {isStopping ? (
                <TextPropertyLine label="System is stopping..." value="" />
            ) : isAlive ? (
                <ButtonLine
                    label="Stop"
                    icon={StopRegular}
                    onClick={() => {
                        setStopRequested(true);
                        system.stop();
                        if (!isCpuParticleSystem) {
                            system.reset();
                        }
                    }}
                />
            ) : (
                <ButtonLine
                    label="Start"
                    icon={PlayRegular}
                    onClick={() => {
                        setStopRequested(false);
                        system.start();
                    }}
                />
            )}

            <FileUploadLine
                label="Load from File"
                accept=".json"
                onClick={(files) => {
                    if (files.length === 0) {
                        return;
                    }

                    const file = files[0];
                    Tools.ReadFile(
                        file,
                        (data) => {
                            const jsonObject = ParseJsonLoadContents(data);
                            if (!jsonObject) {
                                alert("Unable to load particle system from file.");
                                return;
                            }

                            applyParticleSystemJsonToSystem(jsonObject);
                        },
                        undefined,
                        true
                    );
                }}
            />

            <ButtonLine
                label="Save to File"
                icon={ArrowDownloadRegular}
                onClick={() => {
                    // Download serialization as a JSON file.
                    const data = JSON.stringify(system.serialize(true), null, 2);
                    const blob = new Blob([data], { type: "application/json" });
                    const name = (system.name && system.name.trim().length > 0 ? system.name.trim() : "particleSystem") + ".json";
                    Tools.Download(blob, name);
                }}
            />

            {snippetId && <TextPropertyLine label="Snippet ID" value={snippetId} />}
            <ButtonLine label="Load from Snippet Server" onClick={loadFromSnippetServer} icon={CloudArrowUpRegular} />
            <ButtonLine label="Save to Snippet Server" onClick={saveToSnippetServer} icon={CloudArrowDownRegular} />
        </>
    );
};
