import { type ChangeEvent, type FunctionComponent, useCallback, useEffect, useRef, useState } from "react";

import { Body1, Caption1, makeStyles, tokens } from "@fluentui/react-components";
import {
    GetSmartAssetManagerCreatedCallback,
    GetSmartAssetManagerFromScene,
    SetSmartAssetManagerCreatedCallback,
    type SmartAssetManager,
} from "core/SmartAssets/smartAssetManager";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { Dialog } from "shared-ui-components/fluent/primitives/dialog";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";
import { type ISceneContext, SceneContextIdentity } from "./sceneContext";

import { installInspectorAssetNotFoundHandler, SetInspectorAssetNotFoundPromptHandler } from "./smartAssetHandler";

type PendingMissingAsset = {
    keyName: string;
    expectedUrl: string;
    resolve: (value: string | File | null) => void;
};

const useStyles = makeStyles({
    hiddenInput: {
        display: "none",
    },
    body: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    keyRow: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
    },
    keyLabel: {
        fontWeight: tokens.fontWeightSemibold,
    },
    url: {
        fontFamily: tokens.fontFamilyMonospace,
        wordBreak: "break-all",
        opacity: 0.8,
    },
});

const SmartAssetMissingPromptHost: FunctionComponent = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingMissingAssetRef = useRef<PendingMissingAsset | null>(null);
    const [pendingMissingAsset, setPendingMissingAsset] = useState<PendingMissingAsset | null>(null);
    const classes = useStyles();

    const resolvePendingMissingAsset = useCallback((value: string | File | null) => {
        pendingMissingAssetRef.current?.resolve(value);
        pendingMissingAssetRef.current = null;
        setPendingMissingAsset(null);
    }, []);

    useEffect(() => {
        SetInspectorAssetNotFoundPromptHandler(
            async (keyName, expectedUrl) =>
                await new Promise<string | File | null>((resolve) => {
                    const request = { keyName, expectedUrl, resolve };
                    pendingMissingAssetRef.current = request;
                    setPendingMissingAsset(request);
                })
        );

        return () => {
            SetInspectorAssetNotFoundPromptHandler(null);
            pendingMissingAssetRef.current?.resolve(null);
            pendingMissingAssetRef.current = null;
        };
    }, []);

    const onSkip = useCallback(() => {
        resolvePendingMissingAsset(null);
    }, [resolvePendingMissingAsset]);

    const onLocate = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const onFileSelected = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            resolvePendingMissingAsset(event.target.files?.[0] ?? null);
            event.target.value = "";
        },
        [resolvePendingMissingAsset]
    );

    if (!pendingMissingAsset) {
        return null;
    }

    const shortUrl = pendingMissingAsset.expectedUrl.length > 60 ? "..." + pendingMissingAsset.expectedUrl.slice(-50) : pendingMissingAsset.expectedUrl;

    return (
        <Dialog
            open
            title="Asset not found"
            onDismiss={onSkip}
            actions={[
                { label: "Skip", onClick: onSkip },
                { label: "Locate File...", appearance: "primary", onClick: onLocate },
            ]}
        >
            <div className={classes.body}>
                <div className={classes.keyRow}>
                    <Body1 className={classes.keyLabel}>Key:</Body1>
                    <Body1>{pendingMissingAsset.keyName}</Body1>
                </div>
                <Caption1 className={classes.url} title={pendingMissingAsset.expectedUrl}>
                    {shortUrl}
                </Caption1>
                <Body1>Locate the file or click Skip to continue without it.</Body1>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".glb,.gltf,.babylon,.obj,.png,.jpg,.jpeg,.env,.hdr,.dds,.ktx,.ktx2"
                    className={classes.hiddenInput}
                    onChange={onFileSelected}
                />
            </div>
        </Dialog>
    );
};

/**
 * Registers the Inspector Smart Asset missing-file prompt host.
 */
export const SmartAssetPromptServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext]> = {
    friendlyName: "Smart Asset Prompt Service",
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const registration = shellService.addCentralContent({
            key: "Smart Asset Missing Prompt",
            component: SmartAssetMissingPromptHost,
            order: 1000,
        });
        const managerHandlerDisposers = new Map<SmartAssetManager, () => void>();

        const installForManager = (manager: SmartAssetManager) => {
            if (manager.scene !== sceneContext.currentScene || managerHandlerDisposers.has(manager)) {
                return;
            }
            managerHandlerDisposers.set(manager, installInspectorAssetNotFoundHandler(manager));
        };

        const installForCurrentScene = () => {
            const currentScene = sceneContext.currentScene;
            if (!currentScene) {
                return;
            }

            const smartAssetManager = GetSmartAssetManagerFromScene(currentScene);
            if (smartAssetManager) {
                installForManager(smartAssetManager);
            }
        };

        installForCurrentScene();

        const sceneObserver = sceneContext.currentSceneObservable.add(installForCurrentScene);
        const previousSmartAssetManagerCreatedCallback = GetSmartAssetManagerCreatedCallback();
        const smartAssetManagerCreatedCallback = (manager: SmartAssetManager) => {
            previousSmartAssetManagerCreatedCallback?.(manager);
            installForManager(manager);
        };
        SetSmartAssetManagerCreatedCallback(smartAssetManagerCreatedCallback);

        return {
            dispose: () => {
                registration.dispose();
                sceneObserver.remove();
                if (GetSmartAssetManagerCreatedCallback() === smartAssetManagerCreatedCallback) {
                    SetSmartAssetManagerCreatedCallback(previousSmartAssetManagerCreatedCallback);
                }
                for (const disposeHandler of Array.from(managerHandlerDisposers.values()).reverse()) {
                    disposeHandler();
                }
                managerHandlerDisposers.clear();
            },
        };
    },
};
