import type { IDisposable } from "core/index";
import type { FunctionComponent } from "react";
import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../../services/shellService";
import { ShellServiceIdentity } from "../../services/shellService";

import { useState, useEffect } from "react";
import { Observable } from "core/Misc/observable";
import { Eye20Regular, EyeOff20Regular, WindowConsole20Regular, Database20Regular, PersonRunning20Regular, QuestionCircle20Regular } from "@fluentui/react-icons";
import { Button } from "@fluentui/react-components";

import { AnimationRetargetingViewport } from "./animationRetargetingViewport";
import { AnimationRetargetingPanel, DefaultPanelState } from "./animationRetargetingPanel";
import type { PanelStateStore } from "./animationRetargetingPanel";
import type { RetargetingSceneManager } from "./retargetingSceneManager";
import { NamingSchemeManager } from "./namingSchemeManager";
import { AvatarManager } from "./avatarManager";
import { AnimationManager } from "./animationManager";
import { RetargetingConfigDialog } from "./retargetingConfigDialog";

/**
 * Service definition for the Animation Retargeting extension.
 * - Registers a dedicated 3D viewport (central content, left+right cameras).
 * - Registers a controls side pane with Avatar / Animation / Retarget sections.
 * - Exposes an Enable / Disable toggle to restore the original inspector scene.
 */
export const AnimationRetargetingServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "Animation Retargeting",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        // Observable that fires whenever a new scene manager is ready (on each enable)
        const onManagerReadyObs = new Observable<RetargetingSceneManager>();
        // Observable that broadcasts enable/disable state changes to the panel
        const isEnabledObs = new Observable<boolean>();
        // Observable that fires when the config dialog closes — panel refreshes dropdowns
        const onConfigChangedObs = new Observable<void>();

        // Naming scheme manager — persists across extension lifetime via localStorage
        const namingSchemeManager = new NamingSchemeManager();

        // Avatar manager — persists across extension lifetime via localStorage + IndexedDB
        const avatarManager = new AvatarManager();

        // Animation manager — persists across extension lifetime via localStorage + IndexedDB
        const animationManager = new AnimationManager();

        // Create default entries if both lists are empty (first-time use)
        if (avatarManager.getAllAvatars().length === 0 && animationManager.getAllDisplayNames().length === 0) {
            avatarManager.createDefaults();
            animationManager.createDefaults();
        }

        let isEnabled = false;
        let viewportReg: IDisposable | null = null;
        let currentManager: RetargetingSceneManager | null = null;
        // Persists all panel UI state across remounts (e.g. when the panel is docked elsewhere)
        const allAvatars = avatarManager.getAllAvatars();
        const allDisplayNames = animationManager.getAllDisplayNames();
        const persistedPanelState: PanelStateStore = {
            ...DefaultPanelState,
            avatarName: allAvatars.length > 0 ? allAvatars[0].name : "",
            animationName: allDisplayNames.length > 0 ? allDisplayNames[0] : "",
        };

        function setEnabled(enabled: boolean): void {
            if (enabled === isEnabled) {
                return;
            }
            isEnabled = enabled;

            if (enabled) {
                // Register the central-content viewport; the component creates the Engine+Scene
                viewportReg = shellService.addCentralContent({
                    key: "AnimationRetargetingViewport",
                    order: 10,
                    component: () => (
                        <AnimationRetargetingViewport
                            onManagerReady={(manager) => {
                                currentManager = manager;
                                onManagerReadyObs.notifyObservers(manager);
                            }}
                        />
                    ),
                });
            } else {
                // Dispose viewport — the component's useEffect cleanup will dispose Engine+Scene
                viewportReg?.dispose();
                viewportReg = null;
                currentManager = null;
            }

            isEnabledObs.notifyObservers(enabled);
        }

        // Start disabled so the user opts-in to the viewport
        setEnabled(false);

        // Header icon buttons: enable/disable toggle and console toggle.
        const headerActions: FunctionComponent = () => {
            const [localIsEnabled, setLocalIsEnabled] = useState(isEnabled);
            const [isConsoleVisible, setIsConsoleVisible] = useState(false);
            const [isDialogOpen, setIsDialogOpen] = useState(false);

            useEffect(() => {
                const obs = isEnabledObs.add((v) => setLocalIsEnabled(v));
                return () => {
                    isEnabledObs.remove(obs);
                };
            }, []);

            useEffect(() => {
                const manager = currentManager;
                if (!manager) {
                    return;
                }
                setIsConsoleVisible(manager.htmlConsole.isVisible);
                const obs = manager.htmlConsole.onVisibilityChangedObservable.add((v) => setIsConsoleVisible(v));
                return () => {
                    manager.htmlConsole.onVisibilityChangedObservable.remove(obs);
                };
            }, []);

            // Re-subscribe to the console observable whenever a new manager becomes ready.
            useEffect(() => {
                const managerObs = onManagerReadyObs.add((manager) => {
                    setIsConsoleVisible(manager.htmlConsole.isVisible);
                    manager.htmlConsole.onVisibilityChangedObservable.add((v) => setIsConsoleVisible(v));
                });
                return () => {
                    onManagerReadyObs.remove(managerObs);
                };
            }, []);

            return (
                <>
                    <Button
                        appearance="transparent"
                        size="small"
                        icon={localIsEnabled ? <EyeOff20Regular /> : <Eye20Regular />}
                        title={localIsEnabled ? "Disable viewport" : "Enable viewport"}
                        onClick={() => setEnabled(!localIsEnabled)}
                    />
                    <Button
                        appearance={isConsoleVisible ? "primary" : "transparent"}
                        size="small"
                        icon={<WindowConsole20Regular />}
                        title="Toggle console"
                        disabled={!localIsEnabled}
                        onClick={() => currentManager?.htmlConsole.toggle()}
                    />
                    <Button appearance="transparent" size="small" icon={<Database20Regular />} title="Retargeting configuration" onClick={() => setIsDialogOpen(true)} />
                    <Button
                        appearance="transparent"
                        size="small"
                        icon={<QuestionCircle20Regular />}
                        title="Documentation"
                        onClick={() => window.open("https://doc.babylonjs.com/features/featuresDeepDive/animation/animationRetargeting/", "_blank")}
                    />
                    <RetargetingConfigDialog
                        manager={namingSchemeManager}
                        avatarManager={avatarManager}
                        animationManager={animationManager}
                        open={isDialogOpen}
                        onClose={() => {
                            setIsDialogOpen(false);
                            onConfigChangedObs.notifyObservers();
                        }}
                    />
                </>
            );
        };

        const panelReg = shellService.addSidePane({
            key: "AnimationRetargetingPanel",
            title: "Animation Retargeting",
            icon: PersonRunning20Regular,
            headerExtra: headerActions,
            horizontalLocation: "left",
            verticalLocation: "top",
            content: () => (
                <AnimationRetargetingPanel
                    initialIsEnabled={isEnabled}
                    isEnabledObs={isEnabledObs}
                    onConfigChangedObs={onConfigChangedObs}
                    onManagerReadyObs={onManagerReadyObs}
                    getCurrentManager={() => currentManager}
                    namingSchemeManager={namingSchemeManager}
                    avatarManager={avatarManager}
                    animationManager={animationManager}
                    stateStore={persistedPanelState}
                />
            ),
        });

        return {
            dispose: () => {
                setEnabled(false);
                panelReg.dispose();
                onManagerReadyObs.clear();
                isEnabledObs.clear();
                onConfigChangedObs.clear();
            },
        };
    },
};

export default {
    serviceDefinitions: [AnimationRetargetingServiceDefinition],
} as const;
