import { getParticleSystems, isParticleSystemStarted, startParticleSystem, stopParticleSystem, type ParticleSystem } from "@babylonjs/lite";
import { DropRegular, PlayFilled, StopFilled } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { Observable } from "core/Misc/observable";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IExplorerService, ExplorerServiceIdentity } from "../../../../services/panes/explorer/explorerService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateWatchedNameDisplayInfo } from "../../../explorerDisplayInfo";
import { GetParticleSystemDisplayName, GetEngineParticleSystems, IsParticleSystem } from "../../../particleUtils";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";

const ParticleSystemIcon: FunctionComponent = () => <DropRegular />;

/** Contributes registered CPU particle systems and an emission start/stop command. */
export const ParticleSystemExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IExplorerService, IWatcherService, IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Particle System Explorer",
    consumes: [EngineExplorerServiceIdentity, ExplorerServiceIdentity, WatcherServiceIdentity, EngineContextIdentity, SelectionServiceIdentity],
    factory: (engineExplorerService, explorerService, watcherService, engineContext, selectionService) => {
        const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 340,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                const systems = [...getParticleSystems(scene)];
                return systems.length
                    ? [
                          CreateSceneExplorerSectionNode(
                              "particle-systems",
                              "Particle Systems",
                              systems,
                              (system, index) => CreateWatchedNameDisplayInfo(watcherService, system, () => GetParticleSystemDisplayName(system, index)),
                              ParticleSystemIcon
                          ),
                      ]
                    : [];
            },
            getSnapshot: (scene) => getParticleSystems(scene),
        });
        const commandRegistration = explorerService.addItemCommand({
            predicate: (entity): entity is ParticleSystem => IsParticleSystem(engineContext.engine, entity),
            order: 1100,
            getCommand: (system) => {
                const onChange = new Observable<void>();
                const watcher = watcherService.watchValue(
                    () => isParticleSystemStarted(system),
                    () => onChange.notifyObservers()
                );
                return {
                    type: "toggle",
                    displayName: "Start/Stop Particle System",
                    icon: () => (isParticleSystemStarted(system) ? <StopFilled /> : <PlayFilled />),
                    get isEnabled() {
                        return isParticleSystemStarted(system);
                    },
                    set isEnabled(enabled: boolean) {
                        if (enabled) {
                            startParticleSystem(system);
                        } else {
                            stopParticleSystem(system);
                        }
                        watcherService.refresh();
                    },
                    onChange,
                    dispose: () => {
                        watcher.dispose();
                        onChange.clear();
                    },
                };
            },
        });
        const getEntities = () => GetEngineParticleSystems(engineContext.engine);
        let previousEntities = getEntities();
        const selectionWatcher = watcherService.watchValue(
            getEntities,
            (entities) => {
                const selected = selectionService.selectedEntity;
                if (selected && previousEntities.some((system) => system === selected) && !entities.some((system) => system === selected)) {
                    selectionService.selectedEntity = null;
                }
                previousEntities = entities;
            },
            (left, right) => left.length === right.length && left.every((system, index) => system === right[index])
        );
        return {
            dispose: () => {
                selectionWatcher.dispose();
                commandRegistration.dispose();
                providerRegistration.dispose();
            },
        };
    },
};
