import type { FunctionComponent } from "react";
import type { AbstractMesh } from "core/index";
import type { ParticleSystem } from "core/Particles/particleSystem";
import type { ISelectionService } from "../../../services/selectionService";

import { useEffect, useMemo, useState } from "react";

import { Vector3 } from "core/Maths/math.vector";

import { StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { Property } from "../boundProperty";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

/**
 * Display emitter-related properties for a node particle system.
 * This is a simplified version that only includes emitter selection (none/position/node).
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemNodeEmitterProperties: FunctionComponent<{ particleSystem: ParticleSystem; selectionService: ISelectionService }> = (props) => {
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

    return (
        <>
            <Property
                component={StringDropdownPropertyLine}
                label="Emitter"
                propertyPath="emitter"
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
                <Property
                    component={Vector3PropertyLine}
                    label="Position"
                    propertyPath="emitter"
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
                <Property component={LinkToEntityPropertyLine} label="Entity" propertyPath="emitter" entity={emitter} selectionService={selectionService} />
            )}
        </>
    );
};
