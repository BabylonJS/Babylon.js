import type { IDisposable } from "core/index";
import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../../services/shellService";
import { ShellServiceIdentity } from "../../services/shellService";

import { Observable } from "core/Misc/observable";
import { PersonRunning20Regular } from "@fluentui/react-icons";
import { Body1 } from "@fluentui/react-components";

import { AnimationRetargetingViewport } from "./animationRetargetingViewport";
import { AnimationRetargetingPanel, DefaultPanelState } from "./animationRetargetingPanel";
import type { PanelStateStore } from "./animationRetargetingPanel";
import type { RetargetingSceneManager } from "./retargetingSceneManager";
import { NamingSchemeManager } from "./namingSchemeManager";
import { AvatarManager } from "./avatarManager";
import { AnimationManager } from "./animationManager";
import { Link } from "shared-ui-components/fluent/primitives/link";

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

        const panelReg = shellService.addSidePane({
            key: "AnimationRetargetingPanel",
            title: "Animation Retargeting",
            description: (
                <Body1>
                    Learn more in the <Link url="https://doc.babylonjs.com/features/featuresDeepDive/animation/animationRetargeting/" value="docs" />.
                </Body1>
            ),
            icon: PersonRunning20Regular,
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
                    onSetEnabled={setEnabled}
                    onToggleConsole={() => currentManager?.htmlConsole.toggle()}
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
