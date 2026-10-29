import { type PhysicsWorld, type PhysicsBody, type PhysicsConstraint, type SceneNode } from "@babylonjs/lite";

import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { GetSceneContexts, GetSceneNodes, IsSceneNode } from "../../../sceneEntityUtils";
import { GetScenePhysicsSnapshot } from "../../../physicsUtils";

const WorldGeneral = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsWorldGeneralProperties);
const WorldSimulation = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsWorldSimulationProperties);
const BodyGeneral = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsBodyGeneralProperties);
const BodyShape = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsBodyShapeProperties);
const BodyDamping = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsBodyDampingProperties);
const BodyVelocity = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsBodyVelocityProperties);
const BodyMass = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsBodyMassProperties);
const BodyConstraints = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsBodyConstraintProperties);
const ConstraintGeneral = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsConstraintGeneralProperties);
const ConstraintFrames = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsConstraintFrameProperties);
const ConstraintLimits = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).PhysicsConstraintLimitProperties);
const NodePhysics = MakeLazyComponent(async () => (await import("../../../components/properties/physicsProperties")).NodePhysicsProperties);

/** Registers live, lazy Lite-only physics property sections. */
export const PhysicsPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Physics Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity, SelectionServiceIdentity],
    factory: (properties, engineContext, selectionService) => {
        const getLocation = (entity: unknown) => {
            for (const scene of GetSceneContexts(engineContext.engine)) {
                for (const entry of GetScenePhysicsSnapshot(scene).worlds) {
                    if (entry.world === entity || entry.bodies.some((body) => body === entity) || entry.constraints.some((constraint) => constraint === entity)) {
                        return { scene, world: entry.world, selectionService };
                    }
                }
            }
            return undefined;
        };
        const entries = () => GetSceneContexts(engineContext.engine).flatMap((scene) => GetScenePhysicsSnapshot(scene).worlds);
        const registrations = [
            properties.addSectionContent({
                key: "Babylon Lite Physics World Properties",
                predicate: (entity): entity is PhysicsWorld => entries().some(({ world }) => world === entity),
                content: [
                    {
                        section: "General",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <WorldGeneral {...location} /> : null;
                        },
                    },
                    {
                        section: "Simulation",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <WorldSimulation {...location} /> : null;
                        },
                    },
                ],
            }),
            properties.addSectionContent({
                key: "Babylon Lite Physics Body Properties",
                predicate: (entity): entity is PhysicsBody => entries().some(({ bodies }) => bodies.some((body) => body === entity)),
                content: [
                    {
                        section: "General",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <BodyGeneral {...location} body={context} /> : null;
                        },
                    },
                    {
                        section: "Shape",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <BodyShape {...location} body={context} /> : null;
                        },
                    },
                    {
                        section: "Damping",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <BodyDamping {...location} body={context} /> : null;
                        },
                    },
                    {
                        section: "Velocity",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <BodyVelocity {...location} body={context} /> : null;
                        },
                    },
                    {
                        section: "Mass",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <BodyMass {...location} body={context} /> : null;
                        },
                    },
                    {
                        section: "Constraints",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <BodyConstraints {...location} body={context} /> : null;
                        },
                    },
                ],
            }),
            properties.addSectionContent({
                key: "Babylon Lite Physics Constraint Properties",
                predicate: (entity): entity is PhysicsConstraint => entries().some(({ constraints }) => constraints.some((constraint) => constraint === entity)),
                content: [
                    {
                        section: "General",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <ConstraintGeneral {...location} constraint={context} /> : null;
                        },
                    },
                    {
                        section: "Frames",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <ConstraintFrames {...location} constraint={context} /> : null;
                        },
                    },
                    {
                        section: "Limits",
                        component: ({ context }) => {
                            const location = getLocation(context);
                            return location ? <ConstraintLimits {...location} constraint={context} /> : null;
                        },
                    },
                ],
            }),
            properties.addSectionContent({
                key: "Babylon Lite Node Physics Properties",
                predicate: (entity): entity is SceneNode => IsSceneNode(entity) && GetSceneContexts(engineContext.engine).some((scene) => GetSceneNodes(scene).includes(entity)),
                content: [
                    {
                        section: "Physics",
                        component: ({ context }) => {
                            const scene = GetSceneContexts(engineContext.engine).find((candidate) => GetSceneNodes(candidate).includes(context));
                            return scene ? <NodePhysics scene={scene} node={context} selectionService={selectionService} /> : null;
                        },
                    },
                ],
            }),
        ];
        return { dispose: () => registrations.forEach((registration) => registration.dispose()) };
    },
};
