import type { FunctionComponent } from "react";
import type { AbstractMesh } from "core/index";
import type { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import type { ISelectionService } from "../../../services/selectionService";

import { useEffect, useMemo, useState } from "react";

import { Vector3 } from "core/Maths/math.vector";
import { ParticleSystem } from "core/Particles/particleSystem";
import { BoxParticleEmitter } from "core/Particles/EmitterTypes/boxParticleEmitter";
import { ConeParticleEmitter } from "core/Particles/EmitterTypes/coneParticleEmitter";
import { CylinderParticleEmitter } from "core/Particles/EmitterTypes/cylinderParticleEmitter";
import { HemisphericParticleEmitter } from "core/Particles/EmitterTypes/hemisphericParticleEmitter";
import { MeshParticleEmitter } from "core/Particles/EmitterTypes/meshParticleEmitter";
import { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
import { SphereParticleEmitter } from "core/Particles/EmitterTypes/sphereParticleEmitter";

import { StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty, Property } from "../boundProperty";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

/**
 * Display emitter-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemEmitterProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem; selectionService: ISelectionService }> = (props) => {
    const { particleSystem: system, selectionService } = props;

    const scene = system.getScene();

    // Node-generated particle systems don't expose emitter type configuration
    const isNodeGenerated = system instanceof ParticleSystem && system.isNodeGenerated;

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

            {!isNodeGenerated && (
                <>
                    <Property
                        component={StringDropdownPropertyLine}
                        label="Type"
                        propertyPath="emitterType"
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

                    {particleEmitterType instanceof MeshParticleEmitter && (
                        <>
                            {scene && scene.meshes.length > 0 ? (
                                <Property
                                    component={StringDropdownPropertyLine}
                                    propertyPath="source"
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
                                <Property component={TextPropertyLine} propertyPath="source" label="Source" value="No meshes in scene." />
                            )}
                        </>
                    )}

                    {particleEmitterType instanceof BoxParticleEmitter && (
                        <>
                            <BoundProperty component={Vector3PropertyLine} label="Direction1" target={particleEmitterType} propertyKey="direction1" />
                            <BoundProperty component={Vector3PropertyLine} label="Direction2" target={particleEmitterType} propertyKey="direction2" />
                            <BoundProperty component={Vector3PropertyLine} label="Min emit box" target={particleEmitterType} propertyKey="minEmitBox" />
                            <BoundProperty component={Vector3PropertyLine} label="Max emit box" target={particleEmitterType} propertyKey="maxEmitBox" />
                        </>
                    )}

                    {particleEmitterType instanceof ConeParticleEmitter && (
                        <>
                            <BoundProperty
                                component={NumberInputPropertyLine}
                                label="Radius range"
                                target={particleEmitterType}
                                propertyKey="radiusRange"
                                min={0}
                                max={1}
                                step={0.01}
                            />
                            <BoundProperty
                                component={NumberInputPropertyLine}
                                label="Height range"
                                target={particleEmitterType}
                                propertyKey="heightRange"
                                min={0}
                                max={1}
                                step={0.01}
                            />
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

                    {particleEmitterType instanceof SphereParticleEmitter && (
                        <>
                            <BoundProperty component={NumberInputPropertyLine} label="Radius" target={particleEmitterType} propertyKey="radius" min={0} step={0.1} />
                            <BoundProperty
                                component={NumberInputPropertyLine}
                                label="Radius range"
                                target={particleEmitterType}
                                propertyKey="radiusRange"
                                min={0}
                                max={1}
                                step={0.01}
                            />
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

                    {particleEmitterType instanceof CylinderParticleEmitter && (
                        <>
                            <BoundProperty component={NumberInputPropertyLine} label="Radius" target={particleEmitterType} propertyKey="radius" min={0} step={0.1} />
                            <BoundProperty component={NumberInputPropertyLine} label="Height" target={particleEmitterType} propertyKey="height" min={0} step={0.1} />
                            <BoundProperty
                                component={NumberInputPropertyLine}
                                label="Radius range"
                                target={particleEmitterType}
                                propertyKey="radiusRange"
                                min={0}
                                max={1}
                                step={0.01}
                            />
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

                    {particleEmitterType instanceof HemisphericParticleEmitter && (
                        <>
                            <BoundProperty component={NumberInputPropertyLine} label="Radius" target={particleEmitterType} propertyKey="radius" min={0} step={0.1} />
                            <BoundProperty
                                component={NumberInputPropertyLine}
                                label="Radius range"
                                target={particleEmitterType}
                                propertyKey="radiusRange"
                                min={0}
                                max={1}
                                step={0.01}
                            />
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

                    {particleEmitterType instanceof PointParticleEmitter && (
                        <>
                            <BoundProperty component={Vector3PropertyLine} label="Direction1" target={particleEmitterType} propertyKey="direction1" />
                            <BoundProperty component={Vector3PropertyLine} label="Direction2" target={particleEmitterType} propertyKey="direction2" />
                        </>
                    )}
                </>
            )}

            {!scene && <TextPropertyLine label="Emitter" value="No scene available." />}
        </>
    );
};
