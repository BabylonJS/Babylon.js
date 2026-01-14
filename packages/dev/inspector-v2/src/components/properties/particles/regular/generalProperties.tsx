import type { FunctionComponent } from "react";
import type { ISelectionService } from "../../../../services/selectionService";
import { ArrowDownloadRegular, CloudArrowDownRegular, CloudArrowUpRegular, EditRegular, EyeRegular, PlayRegular, StopRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useState } from "react";

import { Tools } from "core/Misc/tools";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleHelper } from "core/Particles/particleHelper";
import { ParticleSystem } from "core/Particles/particleSystem";
import { ConvertToNodeParticleSystemSetAsync } from "core/Particles/Node/nodeParticleSystemSet.helper";
import { BlendModeOptions, ParticleBillboardModeOptions } from "shared-ui-components/constToOptionsMaps";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../../hooks/observableHooks";
import { NotifyPlaygroundOfSnippetChange, PersistSnippetId, PromptForSnippetId, SaveToSnippetServer } from "../../../../utils/snippetUtils";
import { BoundProperty } from "../../boundProperty";

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
 * Display general (high-level) information about a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemGeneralProperties: FunctionComponent<{ particleSystem: ParticleSystem; selectionService: ISelectionService }> = (props) => {
    const { particleSystem: system, selectionService } = props;

    const scene = system.getScene();

    const isBillboardBased = useProperty(system, "isBillboardBased");

    const capacity = useObservableState(() => system.getCapacity());
    const activeCount = useObservableState(() => system.getActiveCount(), scene?.onBeforeRenderObservable);

    const isAlive = useObservableState(() => system.isAlive(), scene?.onBeforeRenderObservable);
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
                // Apply in-place to keep selection stable.
                ParticleSystem._Parse(candidate, system, scene, "");
            } catch (e) {
                alert("Failed to load particle system: " + e);
            }
        },
        [scene, system]
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

        const isGpu = system instanceof GPUParticleSystem;
        const oldSnippetId = system.snippetId;

        // Dispose the old system and clear selection (v1 behavior)
        system.dispose();
        selectionService.selectedEntity = null;

        try {
            const newSystem = await ParticleHelper.ParseFromSnippetAsync(snippetId, scene, isGpu);
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
            <StringifiedPropertyLine label="Capacity" description="Maximum number of particles in the system." value={capacity} />
            <StringifiedPropertyLine label="Active Particles" description="Current number of active particles." value={activeCount} />

            <BoundProperty component={NumberDropdownPropertyLine} label="Blend Mode" target={system} propertyKey="blendMode" options={BlendModeOptions} />
            <BoundProperty component={Vector3PropertyLine} label="World Offset" target={system} propertyKey="worldOffset" />
            {!system.isNodeGenerated && <BoundProperty component={Vector3PropertyLine} label="Gravity" target={system} propertyKey="gravity" />}
            <BoundProperty component={SwitchPropertyLine} label="Is Billboard" target={system} propertyKey="isBillboardBased" />
            {isBillboardBased && (
                <BoundProperty component={NumberDropdownPropertyLine} label="Billboard Mode" target={system} propertyKey="billboardMode" options={ParticleBillboardModeOptions} />
            )}
            <BoundProperty component={SwitchPropertyLine} label="Is Local" target={system} propertyKey="isLocal" />
            <BoundProperty component={SwitchPropertyLine} label="Force Depth Write" target={system} propertyKey="forceDepthWrite" />
            <BoundProperty component={NumberInputPropertyLine} label="Update Speed" target={system} propertyKey="updateSpeed" min={0} step={0.01} />

            <ButtonLine
                label={system.isNodeGenerated ? "Edit" : "View"}
                icon={system.isNodeGenerated ? EditRegular : EyeRegular}
                onClick={async () => {
                    const scene = system.getScene();
                    if (!scene) {
                        return;
                    }

                    const systemSet = system.source ? system.source : await ConvertToNodeParticleSystemSetAsync("source", [system]);

                    if (systemSet) {
                        // TODO: Figure out how to get all the various build steps to work with this.
                        //       See the initial attempt here: https://github.com/BabylonJS/Babylon.js/pull/17646
                        // const { NodeParticleEditor } = await import("node-particle-editor/nodeParticleEditor");
                        // NodeParticleEditor.Show({ nodeParticleSet: systemSet, hostScene: scene, backgroundColor: scene.clearColor });
                        await systemSet.editAsync({ nodeEditorConfig: { backgroundColor: scene.clearColor, disposeOnClose: false } });
                    }
                }}
            />

            {isStopping ? (
                <TextPropertyLine label="System is stopping..." value="" />
            ) : isAlive ? (
                <ButtonLine
                    label="Stop"
                    icon={StopRegular}
                    onClick={() => {
                        setStopRequested(true);
                        system.stop();
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

            {!system.isNodeGenerated && (
                <>
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
            )}
        </>
    );
};
