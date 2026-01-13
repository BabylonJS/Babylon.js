import type { AbstractMesh, ColorGradient, FactorGradient } from "core/index";
import type { Color3Gradient } from "core/Misc/gradients";
import type { Attractor } from "core/Particles/attractor";
import type { FunctionComponent } from "react";
import type { ISelectionService } from "../../../services/selectionService";

import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { BoxParticleEmitter } from "core/Particles/EmitterTypes/boxParticleEmitter";
import { ConeParticleEmitter } from "core/Particles/EmitterTypes/coneParticleEmitter";
import { CylinderParticleEmitter } from "core/Particles/EmitterTypes/cylinderParticleEmitter";
import { HemisphericParticleEmitter } from "core/Particles/EmitterTypes/hemisphericParticleEmitter";
import { MeshParticleEmitter } from "core/Particles/EmitterTypes/meshParticleEmitter";
import { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
import { SphereParticleEmitter } from "core/Particles/EmitterTypes/sphereParticleEmitter";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Tools } from "core/Misc/tools";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleHelper } from "core/Particles/particleHelper";
import { ParticleSystem } from "core/Particles/particleSystem";
import { BlendModeOptions, ParticleBillboardModeOptions } from "shared-ui-components/constToOptionsMaps";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Color3GradientList, Color4GradientList, FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";
import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { NotifyPlaygroundOfSnippetChange, PersistSnippetId, PromptForSnippetId, SaveToSnippetServer } from "../../../utils/snippetUtils";
import { BoundProperty } from "../boundProperty";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";
import { AttractorList } from "./attractorList";
import { CloudArrowDownRegular, CloudArrowUpRegular } from "@fluentui/react-icons";

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

    const handleSaveToSnippetServer = useCallback(async () => {
        try {
            const content = JSON.stringify(system.serialize(true));
            const currentSnippetId = system.snippetId;

            const result = await SaveToSnippetServer({
                snippetUrl: ParticleHelper.SnippetUrl,
                currentSnippetId,
                content,
                payloadKey: "particleSystem",
                storageKey: SnippetDashboardStorageKey,
            });

            // eslint-disable-next-line require-atomic-updates
            system.snippetId = result.snippetId;
            PersistSnippetId(SnippetDashboardStorageKey, result.snippetId);

            NotifyPlaygroundOfSnippetChange(result.oldSnippetId, result.snippetId, "ParticleSystem.ParseFromSnippetAsync");

            alert("Particle system saved with ID: " + system.snippetId + " (the id was also saved to your clipboard)");
        } catch (e) {
            alert("Unable to save your particle system: " + e);
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
                label={system.isNodeGenerated ? "Edit in Node Particle Editor (coming soon)" : "View in Node Particle Editor (coming soon)"}
                disabled={true}
                onClick={() => {
                    // Hook up once Node Particle Editor UX is wired.
                }}
            />

            {isStopping ? (
                <TextPropertyLine label="System is stopping..." value="" />
            ) : isAlive ? (
                <ButtonLine
                    label="Stop"
                    onClick={() => {
                        setStopRequested(true);
                        system.stop();
                    }}
                />
            ) : (
                <ButtonLine
                    label="Start"
                    onClick={() => {
                        setStopRequested(false);
                        system.start();
                    }}
                />
            )}

            {!system.isNodeGenerated && (
                <>
                    <FileUploadLine
                        label="Load from file"
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
                        label="Save to file"
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
                    <ButtonLine label="Save to Snippet Server" onClick={handleSaveToSnippetServer} icon={CloudArrowDownRegular} />
                </>
            )}
        </>
    );
};

/**
 * Display attractor-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemAttractorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const attractorsGetter = useCallback(() => system.attractors ?? [], [system]);
    const attractors = useObservableArray<ParticleSystem, Attractor>(system, attractorsGetter, "addAttractor", "removeAttractor");
    const scene = system.getScene();

    return (
        <>
            {scene ? (
                <AttractorList attractors={attractors} scene={scene} system={system} />
            ) : (
                // Handle missing scene defensively.
                <MessageBar intent="info" title="No Scene Available" message="Cannot display attractors without a scene" />
            )}
        </>
    );
};

/**
 * Display emitter-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemEmitterProperties: FunctionComponent<{ particleSystem: ParticleSystem; selectionService: ISelectionService }> = (props) => {
    const { particleSystem: system, selectionService } = props;

    const scene = system.getScene();

    type EmitterSelectionValue = "none" | "position" | `node:${number}`;

    const emitter = useProperty(system, "emitter");
    const emitterObject = emitter && !(emitter instanceof Vector3) ? (emitter as AbstractMesh) : undefined;

    const [sceneNodesVersion, setSceneNodesVersion] = useState(0);
    useEffect(() => {
        if (!scene) {
            return;
        }

        // Bump a local version counter whenever nodes change to keep emitter options up-to-date.
        const bump = () => setSceneNodesVersion((value) => value + 1);

        const newMeshToken = scene.onNewMeshAddedObservable.add(bump);
        const meshRemovedToken = scene.onMeshRemovedObservable.add(bump);
        const newTransformNodeToken = scene.onNewTransformNodeAddedObservable.add(bump);
        const transformNodeRemovedToken = scene.onTransformNodeRemovedObservable.add(bump);

        return () => {
            scene.onNewMeshAddedObservable.remove(newMeshToken);
            scene.onMeshRemovedObservable.remove(meshRemovedToken);
            scene.onNewTransformNodeAddedObservable.remove(newTransformNodeToken);
            scene.onTransformNodeRemovedObservable.remove(transformNodeRemovedToken);
        };
    }, [scene]);

    const sceneNodes = useMemo(() => {
        if (!scene) {
            return [] as AbstractMesh[];
        }

        const seenUniqueIds = new Set<number>();
        const unique: AbstractMesh[] = [];

        for (const mesh of scene.meshes) {
            const uniqueId = mesh.uniqueId;
            if (typeof uniqueId === "number") {
                if (seenUniqueIds.has(uniqueId)) {
                    continue;
                }
                seenUniqueIds.add(uniqueId);
            }
            unique.push(mesh);
        }

        const emitterUniqueId = emitterObject?.uniqueId;
        if (emitterObject && emitterUniqueId !== undefined && !seenUniqueIds.has(emitterUniqueId)) {
            // Keep the current emitter visible even if it isn't present in the scene arrays for any reason.
            unique.unshift(emitterObject);
        }

        return unique;
    }, [scene, sceneNodesVersion, emitterObject]);

    const emitterSelectionValue: EmitterSelectionValue = !emitter ? "none" : emitter instanceof Vector3 ? "position" : (`node:${emitter.uniqueId}` as const);

    const emitterVector = emitter instanceof Vector3 ? emitter : undefined;

    // Subscribe to Vector3 internal components to re-render on in-place mutations.
    useProperty(emitterVector as Vector3 | null | undefined, "_x");
    useProperty(emitterVector as Vector3 | null | undefined, "_y");
    useProperty(emitterVector as Vector3 | null | undefined, "_z");

    const particleEmitterType = useProperty(system, "particleEmitterType");

    // Use a simple string key for the dropdown, but store an emitter-type instance in the engine.
    type EmitterTypeKey = "box" | "sphere" | "cone" | "cylinder" | "hemispheric" | "point" | "mesh";

    // Derive the current dropdown value from the current instance to stay in sync with external changes.
    const derivedEmitterTypeKey: EmitterTypeKey = (() => {
        if (particleEmitterType instanceof SphereParticleEmitter) {
            return "sphere";
        }
        if (particleEmitterType instanceof ConeParticleEmitter) {
            return "cone";
        }
        if (particleEmitterType instanceof CylinderParticleEmitter) {
            return "cylinder";
        }
        if (particleEmitterType instanceof HemisphericParticleEmitter) {
            return "hemispheric";
        }
        if (particleEmitterType instanceof PointParticleEmitter) {
            return "point";
        }
        if (particleEmitterType instanceof MeshParticleEmitter) {
            return "mesh";
        }
        // Fall back to "box" for unknown emitter types to keep the dropdown valid.
        return "box";
    })();

    const [emitterTypeKey, setEmitterTypeKey] = useState<EmitterTypeKey>(derivedEmitterTypeKey);

    useEffect(() => {
        // Keep local dropdown state aligned with the derived key when the engine changes underneath.
        setEmitterTypeKey(derivedEmitterTypeKey);
    }, [derivedEmitterTypeKey]);

    return (
        <>
            <StringDropdownPropertyLine
                label="Emitter"
                value={emitterSelectionValue}
                options={[
                    { label: "None", value: "none" },
                    { label: "Position", value: "position" },
                    ...sceneNodes.map((node) => {
                        const uniqueId = node.uniqueId;
                        const name = node.name ?? "(unnamed)";
                        const label = `${name} (#${uniqueId})`;

                        return {
                            label,
                            value: `node:${uniqueId}`,
                        };
                    }),
                ]}
                onChange={(value) => {
                    const next = value as EmitterSelectionValue;

                    if (next === "none") {
                        system.emitter = null;
                        return;
                    }

                    if (next === "position") {
                        if (!(system.emitter instanceof Vector3)) {
                            system.emitter = Vector3.Zero();
                        }
                        return;
                    }

                    const uniqueIdText = next.replace("node:", "");
                    const uniqueId = Number(uniqueIdText);
                    const node = sceneNodes.find((candidate) => candidate.uniqueId === uniqueId);
                    if (node) {
                        system.emitter = node;
                    }
                }}
            />

            {emitterSelectionValue === "position" && emitterVector && (
                <Vector3PropertyLine
                    label="Position"
                    value={emitterVector}
                    onChange={(value) => {
                        if (system.emitter instanceof Vector3) {
                            system.emitter.copyFrom(value);
                        } else {
                            system.emitter = value;
                        }
                    }}
                />
            )}

            {emitterSelectionValue !== "none" && emitter && !(emitter instanceof Vector3) && (
                <LinkToEntityPropertyLine label="Entity" entity={emitter} selectionService={selectionService} />
            )}

            {!system.isNodeGenerated && (
                <StringDropdownPropertyLine
                    label="Type"
                    value={emitterTypeKey}
                    options={[
                        { label: "Box", value: "box" },
                        { label: "Cone", value: "cone" },
                        { label: "Cylinder", value: "cylinder" },
                        { label: "Hemispheric", value: "hemispheric" },
                        { label: "Point", value: "point" },
                        { label: "Mesh", value: "mesh" },
                        { label: "Sphere", value: "sphere" },
                    ]}
                    onChange={(value) => {
                        const next = value as EmitterTypeKey;
                        setEmitterTypeKey(next);

                        // Update the engine by swapping the particleEmitterType instance to match the selected key.
                        switch (next) {
                            case "box":
                                system.createBoxEmitter(new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));
                                break;
                            case "sphere":
                                system.createSphereEmitter(1, 1);
                                break;
                            case "cone":
                                system.createConeEmitter(1, Math.PI / 4);
                                break;
                            case "cylinder":
                                system.createCylinderEmitter(1, 1, 1, 0);
                                break;
                            case "hemispheric":
                                system.createHemisphericEmitter(1, 1);
                                break;
                            case "point":
                                system.createPointEmitter(new Vector3(0, 1, 0), new Vector3(0, 1, 0));
                                break;
                            case "mesh": {
                                // Default to the first mesh in the scene when available, then allow changes via "Source".
                                const defaultMesh = scene?.meshes?.[0] ?? null;
                                system.particleEmitterType = new MeshParticleEmitter(defaultMesh);
                                break;
                            }
                        }
                    }}
                />
            )}

            {!system.isNodeGenerated && particleEmitterType instanceof MeshParticleEmitter && (
                <>
                    {scene && scene.meshes.length > 0 ? (
                        <StringDropdownPropertyLine
                            label="Source"
                            value={particleEmitterType.mesh ? `mesh:${particleEmitterType.mesh.uniqueId}` : `mesh:${scene.meshes[0].uniqueId}`}
                            options={scene.meshes.map((mesh) => {
                                const uniqueId = mesh.uniqueId;
                                const name = mesh.name ?? "(unnamed)";
                                const label = `${name} (#${uniqueId})`;
                                return {
                                    label,
                                    value: `mesh:${uniqueId}`,
                                };
                            })}
                            onChange={(value) => {
                                const next = String(value);
                                const uniqueIdText = next.replace("mesh:", "");
                                const uniqueId = Number(uniqueIdText);
                                const mesh = scene.meshes.find((candidate) => candidate.uniqueId === uniqueId) ?? null;
                                particleEmitterType.mesh = mesh;
                            }}
                        />
                    ) : (
                        <TextPropertyLine label="Source" value="No meshes in scene." />
                    )}
                </>
            )}

            {!system.isNodeGenerated && particleEmitterType instanceof BoxParticleEmitter && (
                <>
                    <BoundProperty component={Vector3PropertyLine} label="Direction1" target={particleEmitterType} propertyKey="direction1" />
                    <BoundProperty component={Vector3PropertyLine} label="Direction2" target={particleEmitterType} propertyKey="direction2" />
                    <BoundProperty component={Vector3PropertyLine} label="Min emit box" target={particleEmitterType} propertyKey="minEmitBox" />
                    <BoundProperty component={Vector3PropertyLine} label="Max emit box" target={particleEmitterType} propertyKey="maxEmitBox" />
                </>
            )}

            {!system.isNodeGenerated && particleEmitterType instanceof ConeParticleEmitter && (
                <>
                    <BoundProperty component={NumberInputPropertyLine} label="Radius range" target={particleEmitterType} propertyKey="radiusRange" min={0} max={1} step={0.01} />
                    <BoundProperty component={NumberInputPropertyLine} label="Height range" target={particleEmitterType} propertyKey="heightRange" min={0} max={1} step={0.01} />
                    <BoundProperty component={SwitchPropertyLine} label="Emit from spawn point only" target={particleEmitterType} propertyKey="emitFromSpawnPointOnly" />
                    <BoundProperty
                        component={NumberInputPropertyLine}
                        label="Direction randomizer"
                        target={particleEmitterType}
                        propertyKey="directionRandomizer"
                        min={0}
                        max={1}
                        step={0.01}
                    />
                </>
            )}

            {!system.isNodeGenerated && particleEmitterType instanceof SphereParticleEmitter && (
                <>
                    <BoundProperty component={NumberInputPropertyLine} label="Radius" target={particleEmitterType} propertyKey="radius" min={0} step={0.1} />
                    <BoundProperty component={NumberInputPropertyLine} label="Radius range" target={particleEmitterType} propertyKey="radiusRange" min={0} max={1} step={0.01} />
                    <BoundProperty
                        component={NumberInputPropertyLine}
                        label="Direction randomizer"
                        target={particleEmitterType}
                        propertyKey="directionRandomizer"
                        min={0}
                        max={1}
                        step={0.01}
                    />
                </>
            )}

            {!system.isNodeGenerated && particleEmitterType instanceof CylinderParticleEmitter && (
                <>
                    <BoundProperty component={NumberInputPropertyLine} label="Radius" target={particleEmitterType} propertyKey="radius" min={0} step={0.1} />
                    <BoundProperty component={NumberInputPropertyLine} label="Height" target={particleEmitterType} propertyKey="height" min={0} step={0.1} />
                    <BoundProperty component={NumberInputPropertyLine} label="Radius range" target={particleEmitterType} propertyKey="radiusRange" min={0} max={1} step={0.01} />
                    <BoundProperty
                        component={NumberInputPropertyLine}
                        label="Direction randomizer"
                        target={particleEmitterType}
                        propertyKey="directionRandomizer"
                        min={0}
                        max={1}
                        step={0.01}
                    />
                </>
            )}

            {!system.isNodeGenerated && particleEmitterType instanceof HemisphericParticleEmitter && (
                <>
                    <BoundProperty component={NumberInputPropertyLine} label="Radius" target={particleEmitterType} propertyKey="radius" min={0} step={0.1} />
                    <BoundProperty component={NumberInputPropertyLine} label="Radius range" target={particleEmitterType} propertyKey="radiusRange" min={0} max={1} step={0.01} />
                    <BoundProperty
                        component={NumberInputPropertyLine}
                        label="Direction randomizer"
                        target={particleEmitterType}
                        propertyKey="directionRandomizer"
                        min={0}
                        max={1}
                        step={0.01}
                    />
                </>
            )}

            {!system.isNodeGenerated && particleEmitterType instanceof PointParticleEmitter && (
                <>
                    <BoundProperty component={Vector3PropertyLine} label="Direction1" target={particleEmitterType} propertyKey="direction1" />
                    <BoundProperty component={Vector3PropertyLine} label="Direction2" target={particleEmitterType} propertyKey="direction2" />
                </>
            )}

            {!system.isNodeGenerated && !scene && <TextPropertyLine label="Emitter" value="No scene available." />}
        </>
    );
};

/**
 * Display emission-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemEmissionProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const emitRateGradientsGetter = useCallback(() => system.getEmitRateGradients(), [system]);
    const emitRateGradients = useObservableArray<ParticleSystem, FactorGradient>(
        system,
        emitRateGradientsGetter,
        "addEmitRateGradient",
        "removeEmitRateGradient",
        "forceRefreshGradients"
    );

    const velocityGradientsGetter = useCallback(() => system.getVelocityGradients(), [system]);
    const velocityGradients = useObservableArray<ParticleSystem, FactorGradient>(
        system,
        velocityGradientsGetter,
        "addVelocityGradient",
        "removeVelocityGradient",
        "forceRefreshGradients"
    );

    const limitVelocityGradientsGetter = useCallback(() => system.getLimitVelocityGradients(), [system]);
    const limitVelocityGradients = useObservableArray<ParticleSystem, FactorGradient>(
        system,
        limitVelocityGradientsGetter,
        "addLimitVelocityGradient",
        "removeLimitVelocityGradient",
        "forceRefreshGradients"
    );

    const dragGradientsGetter = useCallback(() => system.getDragGradients(), [system]);
    const dragGradients = useObservableArray<ParticleSystem, FactorGradient>(system, dragGradientsGetter, "addDragGradient", "removeDragGradient", "forceRefreshGradients");

    const useEmitRateGradients = (emitRateGradients?.length ?? 0) > 0;
    const useVelocityGradients = (velocityGradients?.length ?? 0) > 0;
    const useLimitVelocityGradients = (limitVelocityGradients?.length ?? 0) > 0;
    const useDragGradients = (dragGradients?.length ?? 0) > 0;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Emit rate" target={system} propertyKey="emitRate" min={0} step={1} />

            {!system.isNodeGenerated && !useEmitRateGradients && (
                <ButtonLine
                    label="Use Emit rate gradients"
                    onClick={() => {
                        system.addEmitRateGradient(0, system.emitRate, system.emitRate);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {!system.isNodeGenerated && useEmitRateGradients && (
                <FactorGradientList
                    gradients={emitRateGradients}
                    label="Emit Rate Gradient"
                    removeGradient={(gradient: FactorGradient) => {
                        system.removeEmitRateGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: FactorGradient) => {
                        if (gradient) {
                            system.addEmitRateGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                        } else {
                            system.addEmitRateGradient(0, system.emitRate, system.emitRate);
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: FactorGradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {!system.isNodeGenerated && (
                <>
                    <BoundProperty component={NumberInputPropertyLine} label="Min Emit Power" target={system} propertyKey="minEmitPower" min={0} step={0.1} />
                    <BoundProperty component={NumberInputPropertyLine} label="Max Emit Power" target={system} propertyKey="maxEmitPower" min={0} step={0.1} />
                </>
            )}

            {!system.isNodeGenerated && !useVelocityGradients && (
                <ButtonLine
                    label="Use Velocity gradients"
                    onClick={() => {
                        system.addVelocityGradient(0, 1, 1);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {!system.isNodeGenerated && useVelocityGradients && (
                <FactorGradientList
                    gradients={velocityGradients}
                    label="Velocity Gradient"
                    removeGradient={(gradient: FactorGradient) => {
                        system.removeVelocityGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: FactorGradient) => {
                        if (gradient) {
                            system.addVelocityGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                        } else {
                            system.addVelocityGradient(0, 1, 1);
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: FactorGradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {!system.isNodeGenerated && !useLimitVelocityGradients && (
                <ButtonLine
                    label="Use Limit Velocity gradients"
                    onClick={() => {
                        system.addLimitVelocityGradient(0, 1, 1);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {!system.isNodeGenerated && useLimitVelocityGradients && (
                <FactorGradientList
                    gradients={limitVelocityGradients}
                    label="Limit Velocity Gradient"
                    removeGradient={(gradient: FactorGradient) => {
                        system.removeLimitVelocityGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: FactorGradient) => {
                        if (gradient) {
                            system.addLimitVelocityGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                        } else {
                            system.addLimitVelocityGradient(0, 1, 1);
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: FactorGradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {!system.isNodeGenerated && !useDragGradients && (
                <ButtonLine
                    label="Use Drag gradients"
                    onClick={() => {
                        system.addDragGradient(0, 1, 1);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {!system.isNodeGenerated && useDragGradients && (
                <FactorGradientList
                    gradients={dragGradients}
                    label="Drag Gradient"
                    removeGradient={(gradient: FactorGradient) => {
                        system.removeDragGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: FactorGradient) => {
                        if (gradient) {
                            system.addDragGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                        } else {
                            system.addDragGradient(0, 1, 1);
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: FactorGradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}
        </>
    );
};

/**
 * Display size-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemSizeProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;
    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Min size" target={system} propertyKey="minSize" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max size" target={system} propertyKey="maxSize" min={0} step={0.1} />

            <BoundProperty component={NumberInputPropertyLine} label="Min scale x" target={system} propertyKey="minScaleX" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max scale x" target={system} propertyKey="maxScaleX" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Min scale y" target={system} propertyKey="minScaleY" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max scale y" target={system} propertyKey="maxScaleY" min={0} step={0.1} />
        </>
    );
};

/**
 * Display lifetime-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemLifetimeProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    if (system.isNodeGenerated) {
        return <BoundProperty component={NumberInputPropertyLine} label="Target stop duration" target={system} propertyKey="targetStopDuration" min={0} step={0.1} />;
    }

    const lifeTimeGradientsGetter = useCallback(() => system.getLifeTimeGradients(), [system]);
    const lifeTimeGradients = useObservableArray<ParticleSystem, FactorGradient>(
        system,
        lifeTimeGradientsGetter,
        "addLifeTimeGradient",
        "removeLifeTimeGradient",
        "forceRefreshGradients"
    );
    const useLifeTimeGradients = (lifeTimeGradients?.length ?? 0) > 0;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Min lifetime" target={system} propertyKey="minLifeTime" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max lifetime" target={system} propertyKey="maxLifeTime" min={0} step={0.1} />

            {!useLifeTimeGradients && (
                <ButtonLine
                    label="Use Lifetime gradients"
                    onClick={() => {
                        system.addLifeTimeGradient(0, system.minLifeTime, system.maxLifeTime);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useLifeTimeGradients && (
                <FactorGradientList
                    gradients={lifeTimeGradients}
                    label="Lifetime Gradient"
                    removeGradient={(gradient: FactorGradient) => {
                        system.removeLifeTimeGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: FactorGradient) => {
                        if (gradient) {
                            system.addLifeTimeGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                        } else {
                            system.addLifeTimeGradient(0, system.minLifeTime, system.maxLifeTime);
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: FactorGradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}

            <BoundProperty component={NumberInputPropertyLine} label="Target stop duration" target={system} propertyKey="targetStopDuration" min={0} step={0.1} />
        </>
    );
};

/**
 * Display color-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemColorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const colorGradientsGetter = useCallback(() => system.getColorGradients(), [system]);
    const colorGradients = useObservableArray<ParticleSystem, ColorGradient>(system, colorGradientsGetter, "addColorGradient", "removeColorGradient", "forceRefreshGradients");

    const useRampGradients = useProperty(system, "useRampGradients");

    const rampGradientsGetter = useCallback(() => system.getRampGradients(), [system]);
    const rampGradients = useObservableArray<ParticleSystem, Color3Gradient>(system, rampGradientsGetter, "addRampGradient", "removeRampGradient", "forceRefreshGradients");

    const colorRemapGradientsGetter = useCallback(() => system.getColorRemapGradients(), [system]);
    const colorRemapGradients = useObservableArray<ParticleSystem, FactorGradient>(
        system,
        colorRemapGradientsGetter,
        "addColorRemapGradient",
        "removeColorRemapGradient",
        "forceRefreshGradients"
    );

    const alphaRemapGradientsGetter = useCallback(() => system.getAlphaRemapGradients(), [system]);
    const alphaRemapGradients = useObservableArray<ParticleSystem, FactorGradient>(
        system,
        alphaRemapGradientsGetter,
        "addAlphaRemapGradient",
        "removeAlphaRemapGradient",
        "forceRefreshGradients"
    );

    const hasColorGradients = (colorGradients?.length ?? 0) > 0;
    const hasRampGradients = (rampGradients?.length ?? 0) > 0;
    const hasColorRemapGradients = (colorRemapGradients?.length ?? 0) > 0;
    const hasAlphaRemapGradients = (alphaRemapGradients?.length ?? 0) > 0;

    return (
        <>
            <BoundProperty component={Color4PropertyLine} label="Color 1" target={system} propertyKey="color1" />
            <BoundProperty component={Color4PropertyLine} label="Color 2" target={system} propertyKey="color2" />
            <BoundProperty component={Color4PropertyLine} label="Color dead" target={system} propertyKey="colorDead" />

            {!hasColorGradients && (
                <ButtonLine
                    label="Use Color gradients"
                    onClick={() => {
                        system.addColorGradient(0, system.color1, system.color1);
                        system.addColorGradient(1, system.color2, system.color2);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {hasColorGradients && (
                <Color4GradientList
                    gradients={colorGradients}
                    label="Color Gradient"
                    removeGradient={(gradient: ColorGradient) => {
                        system.removeColorGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: ColorGradient) => {
                        if (gradient) {
                            system.addColorGradient(gradient.gradient, gradient.color1, gradient.color2);
                        } else {
                            system.addColorGradient(0, system.color1, system.color1);
                            system.addColorGradient(1, system.color2, system.color2);
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: ColorGradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}

            <BoundProperty component={SwitchPropertyLine} label="Enable Ramp gradients" target={system} propertyKey="useRampGradients" />

            {useRampGradients && (
                <>
                    {!hasRampGradients && (
                        <ButtonLine
                            label="Use Ramp gradients"
                            onClick={() => {
                                system.addRampGradient(0, Color3.Black());
                                system.addRampGradient(1, Color3.White());
                                system.forceRefreshGradients();
                            }}
                        />
                    )}

                    {hasRampGradients && (
                        <Color3GradientList
                            gradients={rampGradients}
                            label="Ramp Gradient"
                            removeGradient={(gradient) => {
                                system.removeRampGradient(gradient.gradient);
                                system.forceRefreshGradients();
                            }}
                            addGradient={(gradient) => {
                                if (gradient) {
                                    system.addRampGradient(gradient.gradient, gradient.color);
                                } else {
                                    system.addRampGradient(0, Color3.Black());
                                    system.addRampGradient(1, Color3.White());
                                }
                                system.forceRefreshGradients();
                            }}
                            onChange={() => {
                                system.forceRefreshGradients();
                            }}
                        />
                    )}

                    {!hasColorRemapGradients && (
                        <ButtonLine
                            label="Use Color remap gradients"
                            onClick={() => {
                                system.addColorRemapGradient(0, 0, 1);
                                system.addColorRemapGradient(1, 0, 1);
                                system.forceRefreshGradients();
                            }}
                        />
                    )}

                    {hasColorRemapGradients && (
                        <FactorGradientList
                            gradients={colorRemapGradients}
                            label="Color Remap Gradient"
                            removeGradient={(gradient: FactorGradient) => {
                                system.removeColorRemapGradient(gradient.gradient);
                                system.forceRefreshGradients();
                            }}
                            addGradient={(gradient?: FactorGradient) => {
                                if (gradient) {
                                    system.addColorRemapGradient(gradient.gradient, gradient.factor1 ?? 0, gradient.factor2 ?? 1);
                                } else {
                                    system.addColorRemapGradient(0, 0, 1);
                                    system.addColorRemapGradient(1, 0, 1);
                                }
                                system.forceRefreshGradients();
                            }}
                            onChange={(_gradient: FactorGradient) => {
                                system.forceRefreshGradients();
                            }}
                        />
                    )}

                    {!hasAlphaRemapGradients && (
                        <ButtonLine
                            label="Use Alpha remap gradients"
                            onClick={() => {
                                system.addAlphaRemapGradient(0, 0, 1);
                                system.addAlphaRemapGradient(1, 0, 1);
                                system.forceRefreshGradients();
                            }}
                        />
                    )}

                    {hasAlphaRemapGradients && (
                        <FactorGradientList
                            gradients={alphaRemapGradients}
                            label="Alpha Remap Gradient"
                            removeGradient={(gradient: FactorGradient) => {
                                system.removeAlphaRemapGradient(gradient.gradient);
                                system.forceRefreshGradients();
                            }}
                            addGradient={(gradient?: FactorGradient) => {
                                if (gradient) {
                                    system.addAlphaRemapGradient(gradient.gradient, gradient.factor1 ?? 0, gradient.factor2 ?? 1);
                                } else {
                                    system.addAlphaRemapGradient(0, 0, 1);
                                    system.addAlphaRemapGradient(1, 0, 1);
                                }
                                system.forceRefreshGradients();
                            }}
                            onChange={(_gradient: FactorGradient) => {
                                system.forceRefreshGradients();
                            }}
                        />
                    )}
                </>
            )}
        </>
    );
};

/**
 * Display rotation-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemRotationProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const angularSpeedGradientsGetter = useCallback(() => system.getAngularSpeedGradients(), [system]);
    const angularSpeedGradients = useObservableArray<ParticleSystem, FactorGradient>(
        system,
        angularSpeedGradientsGetter,
        "addAngularSpeedGradient",
        "removeAngularSpeedGradient",
        "forceRefreshGradients"
    );
    const useAngularSpeedGradients = (angularSpeedGradients?.length ?? 0) > 0;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Min Angular speed" target={system} propertyKey="minAngularSpeed" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Max Angular speed" target={system} propertyKey="maxAngularSpeed" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Min initial rotation" target={system} propertyKey="minInitialRotation" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Max initial rotation" target={system} propertyKey="maxInitialRotation" step={0.01} />

            {!useAngularSpeedGradients && (
                <ButtonLine
                    label="Use Angular speed gradients"
                    onClick={() => {
                        system.addAngularSpeedGradient(0, system.minAngularSpeed, system.maxAngularSpeed);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useAngularSpeedGradients && (
                <FactorGradientList
                    gradients={angularSpeedGradients}
                    label="Angular Speed Gradient"
                    removeGradient={(gradient: FactorGradient) => {
                        system.removeAngularSpeedGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: FactorGradient) => {
                        if (gradient) {
                            system.addAngularSpeedGradient(gradient.gradient, gradient.factor1 ?? 0, gradient.factor2);
                        } else {
                            system.addAngularSpeedGradient(0, system.minAngularSpeed, system.maxAngularSpeed);
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: FactorGradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}
        </>
    );
};

/**
 * Display spritesheet-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemSpritesheetProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Animation sheet enabled" target={system} propertyKey="isAnimationSheetEnabled" />
            <BoundProperty component={NumberInputPropertyLine} label="First sprite index" target={system} propertyKey="startSpriteCellID" min={0} step={1} />
            <BoundProperty component={NumberInputPropertyLine} label="Last sprite index" target={system} propertyKey="endSpriteCellID" min={0} step={1} />
            <BoundProperty component={SwitchPropertyLine} label="Animation loop" target={system} propertyKey="spriteCellLoop" />
            <BoundProperty component={SwitchPropertyLine} label="Random cell start index" target={system} propertyKey="spriteRandomStartCell" />
            <BoundProperty component={NumberInputPropertyLine} label="Cell width" target={system} propertyKey="spriteCellWidth" min={0} step={1} />
            <BoundProperty component={NumberInputPropertyLine} label="Cell height" target={system} propertyKey="spriteCellHeight" min={0} step={1} />
            <BoundProperty component={NumberInputPropertyLine} label="Cell change speed" target={system} propertyKey="spriteCellChangeSpeed" min={0} step={0.01} />
        </>
    );
};

// Return a copied array and re-render when array mutators run.
// Intercept add/remove/change functions because the underlying APIs update internal arrays in-place.
const useObservableArray = <TargetT extends object, ItemT>(
    target: TargetT,
    getItems: () => ReadonlyArray<ItemT> | null | undefined,
    addFn: keyof TargetT,
    removeFn: keyof TargetT,
    changeFn?: keyof TargetT
): ItemT[] => {
    return useObservableState(
        useCallback(() => {
            const value = getItems();
            return [...(value ?? [])] as ItemT[];
        }, [getItems]),
        useInterceptObservable("function", target, addFn),
        useInterceptObservable("function", target, removeFn),
        changeFn ? useInterceptObservable("function", target, changeFn) : undefined
    );
};
