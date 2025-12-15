import type { FunctionComponent } from "react";
import type { FactorGradient, ColorGradient as Color4Gradient, IValueGradient, ParticleSystem } from "core/index";
import type { ISelectionService } from "../../../services/selectionService";

import { Color3, Color4 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { BoxParticleEmitter } from "core/Particles/EmitterTypes/boxParticleEmitter";
import { ConeParticleEmitter } from "core/Particles/EmitterTypes/coneParticleEmitter";
import { CylinderParticleEmitter } from "core/Particles/EmitterTypes/cylinderParticleEmitter";
import { HemisphericParticleEmitter } from "core/Particles/EmitterTypes/hemisphericParticleEmitter";
import { MeshParticleEmitter } from "core/Particles/EmitterTypes/meshParticleEmitter";
import { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
import { SphereParticleEmitter } from "core/Particles/EmitterTypes/sphereParticleEmitter";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { Color4GradientList, FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";
import { AttractorList } from "./attractorList";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { BoundProperty } from "../boundProperty";
import { BlendModeOptions, ParticleBillboardModeOptions } from "shared-ui-components/constToOptionsMaps";
import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

/**
 * Displays general (high-level) information about a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemGeneralProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const scene = system.getScene();

    const isBillboardBased = useProperty(system, "isBillboardBased");

    const capacity = useObservableState(() => system.getCapacity());
    const activeCount = useObservableState(() => system.getActiveCount(), scene?.onBeforeRenderObservable);

    const isAlive = useObservableState(() => system.isAlive(), scene?.onBeforeRenderObservable);
    const isStopping = useObservableState(() => system.isStopping(), scene?.onBeforeRenderObservable);

    const [stopRequested, setStopRequested] = useState(false);

    useEffect(() => {
        if (!stopRequested) {
            return;
        }

        // Clear the local stop flag once the system is no longer alive (fully stopped).
        if (!isAlive && !isStopping) {
            setStopRequested(false);
        }
    }, [stopRequested, isAlive, isStopping]);

    return (
        <>
            <StringifiedPropertyLine label="Capacity" description="Maximum number of particles in the system." value={capacity} />
            <StringifiedPropertyLine label="Active Particles" description="Current number of active particles." value={activeCount} />

            <BoundProperty component={NumberDropdownPropertyLine} label="Blend Mode" target={system} propertyKey="blendMode" options={BlendModeOptions} />
            <BoundProperty component={Vector3PropertyLine} label="World Offset" target={system} propertyKey="worldOffset" />
            <BoundProperty component={Vector3PropertyLine} label="Gravity" target={system} propertyKey="gravity" />
            <BoundProperty component={SwitchPropertyLine} label="Is Billboard" target={system} propertyKey="isBillboardBased" />
            {isBillboardBased && (
                <BoundProperty component={NumberDropdownPropertyLine} label="Billboard Mode" target={system} propertyKey="billboardMode" options={ParticleBillboardModeOptions} />
            )}
            <BoundProperty component={SwitchPropertyLine} label="Is Local" target={system} propertyKey="isLocal" />
            <BoundProperty component={SwitchPropertyLine} label="Force Depth Write" target={system} propertyKey="forceDepthWrite" />
            <BoundProperty component={NumberInputPropertyLine} label="Update Speed" target={system} propertyKey="updateSpeed" min={0} step={0.01} />

            <ButtonLine
                label="View in Node Particle Editor (coming soon)"
                disabled={true}
                onClick={() => {
                    // TODO: waiting for node editors styling
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
        </>
    );
};

/**
 * Displays attractor-related properties for a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemAttractorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const attractors = useParticleSystemProperty(system, "attractors", "property", "addAttractor", "removeAttractor");
    const scene = system.getScene();

    return (
        <>
            {scene ? (
                <AttractorList attractors={attractors} scene={scene} system={system} />
            ) : (
                // Should never get here since sceneExplorer only displays if there is a scene, but adding UX in case that assumption changes in future
                <MessageBar intent="info" title="No Scene Available" message="Cannot display attractors without a scene" />
            )}
        </>
    );
};

/**
 * Displays emitter-related properties for a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemEmitterProperties: FunctionComponent<{ particleSystem: ParticleSystem; selectionService: ISelectionService }> = (props) => {
    const { particleSystem: system, selectionService } = props;

    const scene = system.getScene();

    type EmitterSelectionValue = "none" | "position" | `node:${number}`;

    const emitter = useProperty(system, "emitter");
    const emitterObject = emitter && !(emitter instanceof Vector3) ? (emitter as any) : undefined;

    const [sceneNodesVersion, setSceneNodesVersion] = useState(0);
    useEffect(() => {
        if (!scene) {
            return;
        }

        // Bump a local version counter whenever nodes are added/removed so our emitter dropdown stays up-to-date.
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
            return [] as any[];
        }

        // Combine meshes + transform nodes into a single list for the emitter dropdown.
        const combined = [...scene.meshes, ...scene.transformNodes];
        const seenUniqueIds = new Set<number>();
        const unique: any[] = [];

        for (const node of combined) {
            const uniqueId = (node as any)?.uniqueId;
            if (typeof uniqueId === "number") {
                if (seenUniqueIds.has(uniqueId)) {
                    continue;
                }
                seenUniqueIds.add(uniqueId);
            }
            unique.push(node);
        }

        const emitterUniqueId = (emitterObject as any)?.uniqueId;
        if (emitterObject && typeof emitterUniqueId === "number" && !seenUniqueIds.has(emitterUniqueId)) {
            // Keep the current emitter visible even if it isn't present in the scene arrays for any reason.
            unique.unshift(emitterObject);
        }

        return unique;
    }, [scene, sceneNodesVersion, emitterObject]);

    const emitterSelectionValue: EmitterSelectionValue = !emitter
        ? "none"
        : emitter instanceof Vector3
          ? "position"
          : typeof (emitter as any)?.uniqueId === "number"
            ? (`node:${(emitter as any).uniqueId}` as const)
            : "none";

    const emitterVector = emitter instanceof Vector3 ? emitter : undefined;

    // Subscribe to Vector3 internal components so we re-render when the Vector3 is mutated in-place.
    useProperty(emitterVector as Vector3 | null | undefined, "_x");
    useProperty(emitterVector as Vector3 | null | undefined, "_y");
    useProperty(emitterVector as Vector3 | null | undefined, "_z");

    const particleEmitterType = useProperty(system, "particleEmitterType");

    // Use a simple string key for the dropdown, but the engine stores an actual emitter-type instance
    type EmitterTypeKey = "box" | "sphere" | "cone" | "cylinder" | "hemispheric" | "point" | "mesh";

    // Derive the current dropdown value from the current instance so it stays in sync even if something
    // else (script/other UI/loading) changes the particleEmitterType
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
        // Fall back to "box" for unknown/unhandled emitter types so the dropdown always has a valid value.
        return "box";
    })();

    const [emitterTypeKey, setEmitterTypeKey] = useState<EmitterTypeKey>(derivedEmitterTypeKey);

    useEffect(() => {
        // Keep our local dropdown state aligned with the derived key when the engine changes underneath us.
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
                    ...(sceneNodes.map((node) => {
                        const uniqueId = (node as any)?.uniqueId;
                        const name = (node as any)?.name ?? "(unnamed)";
                        const label = typeof uniqueId === "number" ? `${name} (#${uniqueId})` : `${name}`;

                        return {
                            label,
                            value: `node:${uniqueId}`,
                        };
                    }) as any),
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
                    const node = sceneNodes.find((candidate) => (candidate as any)?.uniqueId === uniqueId);
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
                <LinkToEntityPropertyLine label="Entity" entity={emitter as any} selectionService={selectionService} />
            )}

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

                    // We update the engine by swapping the particleEmitterType instance to match the selected key.
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
                            // We default to the first mesh in the scene when available, and let the user change it via "Source".
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
                        <StringDropdownPropertyLine
                            label="Source"
                            value={particleEmitterType.mesh ? `mesh:${particleEmitterType.mesh.uniqueId}` : `mesh:${scene.meshes[0].uniqueId}`}
                            options={scene.meshes.map((mesh) => {
                                const uniqueId = (mesh as any)?.uniqueId;
                                const name = (mesh as any)?.name ?? "(unnamed)";
                                const label = typeof uniqueId === "number" ? `${name} (#${uniqueId})` : `${name}`;
                                return {
                                    label,
                                    value: `mesh:${uniqueId}`,
                                };
                            })}
                            onChange={(value) => {
                                const next = String(value);
                                const uniqueIdText = next.replace("mesh:", "");
                                const uniqueId = Number(uniqueIdText);
                                const mesh = scene.meshes.find((candidate) => (candidate as any)?.uniqueId === uniqueId) ?? null;
                                particleEmitterType.mesh = mesh;
                            }}
                        />
                    ) : (
                        <TextPropertyLine label="Source" value="No meshes in scene." />
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

            {particleEmitterType instanceof SphereParticleEmitter && (
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

            {particleEmitterType instanceof CylinderParticleEmitter && (
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

            {particleEmitterType instanceof HemisphericParticleEmitter && (
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

            {particleEmitterType instanceof PointParticleEmitter && (
                <>
                    <BoundProperty component={Vector3PropertyLine} label="Direction1" target={particleEmitterType} propertyKey="direction1" />
                    <BoundProperty component={Vector3PropertyLine} label="Direction2" target={particleEmitterType} propertyKey="direction2" />
                </>
            )}

            {!scene && <TextPropertyLine label="Emitter" value="No scene available." />}
        </>
    );
};

/**
 * Displays emission-related properties for a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemEmissionProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const emitRateGradients = useParticleSystemProperty(system, "getEmitRateGradients", "function", "addEmitRateGradient", "removeEmitRateGradient", "forceRefreshGradients");
    const velocityGradients = useParticleSystemProperty(system, "getVelocityGradients", "function", "addVelocityGradient", "removeVelocityGradient", "forceRefreshGradients");
    const limitVelocityGradients = useParticleSystemProperty(
        system,
        "getLimitVelocityGradients",
        "function",
        "addLimitVelocityGradient",
        "removeLimitVelocityGradient",
        "forceRefreshGradients"
    );
    const dragGradients = useParticleSystemProperty(system, "getDragGradients", "function", "addDragGradient", "removeDragGradient", "forceRefreshGradients");

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

            <BoundProperty component={NumberInputPropertyLine} label="Min Emit Power" target={system} propertyKey="minEmitPower" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max Emit Power" target={system} propertyKey="maxEmitPower" min={0} step={0.1} />

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
 * Displays color-related properties for a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemColorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const colorGradients = useParticleSystemProperty(system, "getColorGradients", "function", "addColorGradient", "removeColorGradient", "forceRefreshGradients");
    return (
        <>
            {!system.isNodeGenerated && (
                <Color4GradientList
                    gradients={colorGradients}
                    label="Color Gradient"
                    removeGradient={(gradient: IValueGradient) => {
                        system.removeColorGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: Color4Gradient) => {
                        if (gradient) {
                            system.addColorGradient(gradient.gradient, gradient.color1, gradient.color2);
                        } else {
                            system.addColorGradient(0, Color4.FromColor3(Color3.Black()), Color4.FromColor3(Color3.Black()));
                            system.addColorGradient(1, Color4.FromColor3(Color3.White()), Color4.FromColor3(Color3.White()));
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: Color4Gradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}
        </>
    );
};

// TODO-iv2: This can be more generic to work for not just particleSystems
const useParticleSystemProperty = (
    system: ParticleSystem,
    propertyKey: keyof ParticleSystem,
    observableType: "function" | "property",
    addFn: keyof ParticleSystem,
    removeFn: keyof ParticleSystem,
    changeFn?: keyof ParticleSystem
) => {
    return useObservableState(
        useCallback(() => {
            const value = observableType === "function" ? system[propertyKey]() : system[propertyKey];
            return [...(value ?? [])];
        }, [system, propertyKey]),
        useInterceptObservable("function", system, addFn),
        useInterceptObservable("function", system, removeFn),
        changeFn ? useInterceptObservable("function", system, changeFn) : undefined
    );
};
