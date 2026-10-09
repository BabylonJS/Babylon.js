import { pauseAnimation, playAnimation, type AnimationGroup } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { FilmstripRegular, PauseFilled, PlayFilled, StackRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { Observable } from "core/Misc/observable";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { GetEntityId } from "../../../../components/explorer/explorerModel";
import { type IExplorerService, ExplorerServiceIdentity } from "../../../../services/panes/explorer/explorerService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { GetSceneAnimationGroups, GetTargetedAnimationDisplayName, IsAnimationGroup } from "../../../animationUtils";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateWatchedNameDisplayInfo } from "../../../explorerDisplayInfo";
import { IsSceneContext } from "./sceneExplorerSection";

const AnimationGroupIcon: FunctionComponent = () => <StackRegular color={tokens.colorPaletteBlueForeground2} />;
const TargetedAnimationIcon: FunctionComponent = () => <FilmstripRegular color={tokens.colorPaletteBlueForeground2} />;

export const AnimationGroupExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IExplorerService, IWatcherService, IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Animation Group Explorer",
    consumes: [EngineExplorerServiceIdentity, ExplorerServiceIdentity, WatcherServiceIdentity, EngineContextIdentity, SelectionServiceIdentity],
    factory: (engineExplorerService, explorerService, watcherService, engineContext, selectionService) => {
        const engine = engineContext.engine;
        const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 300,
            predicate: IsSceneContext,
            getNodes: (scene) => [
                {
                    id: "animation-groups",
                    kind: "group",
                    getDisplayInfo: () => ({ name: "Animation Groups" }),
                    getChildren: () =>
                        scene.animationGroups.map((group) => ({
                            id: GetEntityId(group).toString(),
                            kind: "item",
                            entity: group,
                            icon: AnimationGroupIcon,
                            getDisplayInfo: () => CreateWatchedNameDisplayInfo(watcherService, group, () => group.name || "Unnamed Animation Group"),
                            getChildren: () =>
                                group.targetedAnimations.map((animation) => ({
                                    id: GetEntityId(animation).toString(),
                                    kind: "item",
                                    entity: animation,
                                    icon: TargetedAnimationIcon,
                                    getDisplayInfo: () => {
                                        const onChange = new Observable<void>();
                                        const watcher = watcherService.watchValue(
                                            () => GetTargetedAnimationDisplayName(animation),
                                            () => onChange.notifyObservers()
                                        );
                                        return {
                                            get name() {
                                                return GetTargetedAnimationDisplayName(animation);
                                            },
                                            onChange,
                                            dispose: () => {
                                                watcher.dispose();
                                                onChange.clear();
                                            },
                                        };
                                    },
                                })),
                        })),
                },
            ],
            getSnapshot: (scene) => scene.animationGroups.flatMap((group) => [group, ...group.targetedAnimations]),
        });

        const playPauseRegistration = explorerService.addItemCommand({
            predicate: (entity): entity is AnimationGroup => IsAnimationGroup(engine, entity),
            order: 1100,
            getCommand: (group) => {
                const onChange = new Observable<void>();
                const watcher = watcherService.watchProperty(group, "isPlaying", () => onChange.notifyObservers());
                return {
                    type: "toggle",
                    get displayName() {
                        return `${group.isPlaying ? "Pause" : "Play"} Animation`;
                    },
                    icon: () => (group.isPlaying ? <PauseFilled /> : <PlayFilled />),
                    hotKey: { keyCode: "Space", control: true },
                    get isEnabled() {
                        return group.isPlaying;
                    },
                    set isEnabled(enabled: boolean) {
                        if (enabled) {
                            playAnimation(group);
                        } else {
                            pauseAnimation(group);
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

        const getAnimationEntities = (): readonly object[] => GetSceneAnimationGroups(engine).flatMap((group) => [group, ...group.targetedAnimations]);
        let previousEntities = getAnimationEntities();
        const selectionWatcher = watcherService.watchValue(
            getAnimationEntities,
            (entities) => {
                if (selectionService.selectedEntity && previousEntities.includes(selectionService.selectedEntity) && !entities.includes(selectionService.selectedEntity)) {
                    selectionService.selectedEntity = null;
                }
                previousEntities = entities;
            },
            (left, right) => left.length === right.length && left.every((entity, index) => entity === right[index])
        );

        return {
            dispose: () => {
                selectionWatcher.dispose();
                playPauseRegistration.dispose();
                providerRegistration.dispose();
            },
        };
    },
};
