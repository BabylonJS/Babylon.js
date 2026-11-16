import { type PhysicsBody, type PhysicsConstraint } from "@babylonjs/lite";
import { CubeRegular, GlobeRegular, LinkRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type ExplorerNodeDescription, GetEntityId } from "../../../../components/explorer/explorerModel";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateWatchedDisplayInfo } from "../../../explorerDisplayInfo";
import { GetPhysicsBodyDisplayName, GetPhysicsConstraintDisplayName, GetPhysicsWorldDisplayName, GetScenePhysicsSnapshot } from "../../../physicsUtils";
import { GetSceneContexts } from "../../../sceneEntityUtils";
import { IsSceneContext } from "./sceneExplorerSection";

const WorldIcon: FunctionComponent = () => <GlobeRegular />;
const BodyIcon: FunctionComponent = () => <CubeRegular />;
const ConstraintIcon: FunctionComponent = () => <LinkRegular />;

/** Contributes physics worlds, bodies and live constraints without native discovery reads. */
export const PhysicsExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IWatcherService, IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Physics Explorer",
    consumes: [EngineExplorerServiceIdentity, WatcherServiceIdentity, EngineContextIdentity, SelectionServiceIdentity],
    factory: (explorer, watcher, engineContext, selection) => {
        const getItem = (entity: PhysicsBody | PhysicsConstraint): ExplorerNodeDescription => ({
            id: GetEntityId(entity).toString(),
            kind: "item",
            entity,
            icon: "bodyA" in entity ? ConstraintIcon : BodyIcon,
            getDisplayInfo: () => CreateWatchedDisplayInfo(watcher, () => ("bodyA" in entity ? GetPhysicsConstraintDisplayName(entity) : GetPhysicsBodyDisplayName(entity))),
        });
        const registration = explorer.addRenderingContextNodeProvider({
            order: 350,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                const { worlds } = GetScenePhysicsSnapshot(scene);
                return worlds.length
                    ? [
                          {
                              id: "physics",
                              kind: "group",
                              getDisplayInfo: () => ({ name: "Physics" }),
                              getChildren: () =>
                                  worlds.map(({ world, bodies, constraints }) => ({
                                      id: GetEntityId(world).toString(),
                                      kind: "item",
                                      entity: world,
                                      icon: WorldIcon,
                                      getDisplayInfo: () => CreateWatchedDisplayInfo(watcher, () => GetPhysicsWorldDisplayName(scene, world)),
                                      getChildren: () =>
                                          [
                                              { id: "bodies", name: "Bodies", entities: bodies },
                                              { id: "constraints", name: "Constraints", entities: constraints },
                                          ]
                                              .filter(({ entities }) => entities.length)
                                              .map(({ id, name, entities }) => ({
                                                  id: `${GetEntityId(world)}-${id}`,
                                                  kind: "group" as const,
                                                  getDisplayInfo: () => ({ name }),
                                                  getChildren: () => entities.map(getItem),
                                              })),
                                  })),
                          },
                      ]
                    : [];
            },
            getSnapshot: (scene) => GetScenePhysicsSnapshot(scene).worlds.flatMap(({ world, bodies, constraints }) => [world, ...bodies, ...constraints]),
        });
        const getEntities = () =>
            GetSceneContexts(engineContext.engine).flatMap((scene) =>
                GetScenePhysicsSnapshot(scene).worlds.flatMap(({ world, bodies, constraints }) => [world, ...bodies, ...constraints])
            );
        let previous = getEntities();
        const selectionWatcher = watcher.watchValue(
            getEntities,
            (entities) => {
                const selected = selection.selectedEntity;
                if (selected && previous.some((entity) => entity === selected) && !entities.some((entity) => entity === selected)) {
                    selection.selectedEntity = null;
                }
                previous = entities;
            },
            (left, right) => left.length === right.length && left.every((entity, index) => entity === right[index])
        );
        return {
            dispose: () => {
                selectionWatcher.dispose();
                registration.dispose();
            },
        };
    },
};
