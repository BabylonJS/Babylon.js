import { type FunctionComponent, useEffect, useState } from "react";

import { Body1, Caption1, makeStyles, tokens } from "@fluentui/react-components";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { type FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";

import { type GlobalState } from "../../globalState";
import { LogEntry } from "../log/logComponent";

interface ISoundAssetsPanelComponentProps {
    globalState: GlobalState;
}

const MaxEmbeddedAudioFileSize = 25 * 1024 * 1024;

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    importRow: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    asset: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        padding: tokens.spacingVerticalS,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
    },
    actions: {
        display: "flex",
        flexWrap: "wrap",
        gap: tokens.spacingHorizontalXS,
    },
    url: {
        color: tokens.colorNeutralForeground3,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
});

async function ReadAsDataUrlAsync(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error(`Unable to read "${file.name}".`));
        reader.readAsDataURL(file);
    });
}

/**
 * Reads and imports an audio file only if the initiating coordinator is still active.
 * @param globalState editor state
 * @param coordinator coordinator active when the import started
 * @param file audio file to read
 * @param assetName declaration name
 * @param readAsDataUrlAsync file reader used by the import
 * @returns true when imported, false when cancelled because the coordinator changed
 */
export async function ImportSoundAssetFileAsync(
    globalState: GlobalState,
    coordinator: FlowGraphCoordinator,
    file: File,
    assetName: string,
    readAsDataUrlAsync: (file: File) => Promise<string> = ReadAsDataUrlAsync
): Promise<boolean> {
    if (file.size > MaxEmbeddedAudioFileSize) {
        throw new Error(`Audio files must be ${MaxEmbeddedAudioFileSize / (1024 * 1024)} MB or smaller.`);
    }
    const lifetimeGeneration = globalState.lifetimeGeneration;
    const operationToken = globalState.beginSoundAssetOperation(assetName);
    const coordinatorGraphs = [...coordinator.flowGraphs];
    const previousAsset = globalState.getSoundAssetRollback(coordinator, assetName);
    const url = await readAsDataUrlAsync(file);
    if (
        !globalState.isLifetimeCurrent(coordinator, lifetimeGeneration) ||
        !globalState.isSoundAssetOperationCurrent(assetName, operationToken) ||
        coordinatorGraphs.some((graph) => !coordinator.flowGraphs.includes(graph))
    ) {
        return false;
    }
    try {
        await coordinator.addSoundAssetAsync({ name: assetName, url });
        if (
            globalState.isLifetimeCurrent(coordinator, lifetimeGeneration) &&
            globalState.isSoundAssetOperationCurrent(assetName, operationToken) &&
            coordinatorGraphs.every((graph) => coordinator.flowGraphs.includes(graph))
        ) {
            globalState.markSoundAssetLoaded({ name: assetName, url });
        }
    } catch (error) {
        if (
            previousAsset &&
            globalState.isLifetimeCurrent(coordinator, lifetimeGeneration) &&
            globalState.isSoundAssetOperationCurrent(assetName, operationToken) &&
            coordinatorGraphs.every((graph) => coordinator.flowGraphs.includes(graph))
        ) {
            try {
                await coordinator.addSoundAssetAsync(previousAsset);
            } catch (restoreError) {
                throw new Error(`Unable to replace sound asset "${assetName}" (${String(error)}) or restore its previous audio.`, { cause: restoreError });
            }
        }
        globalState.onSoundAssetsChanged.notifyObservers();
        throw error;
    }
    const isCurrent =
        globalState.isLifetimeCurrent(coordinator, lifetimeGeneration) &&
        globalState.isSoundAssetOperationCurrent(assetName, operationToken) &&
        coordinatorGraphs.every((graph) => coordinator.flowGraphs.includes(graph));
    if (!isCurrent && globalState.wasSoundAssetRemovedAfter(assetName, operationToken)) {
        coordinator.removeSoundAsset(assetName);
    }
    return isCurrent;
}

/**
 * Coordinator-level sound asset management panel.
 * @param props component props
 * @returns sound asset panel
 */
export const SoundAssetsPanelComponent: FunctionComponent<ISoundAssetsPanelComponentProps> = (props) => {
    const { globalState } = props;
    const classes = useStyles();
    const [name, setName] = useState("");
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const observer = globalState.onSoundAssetsChanged.add(() => forceUpdate({}));
        return () => observer?.remove();
    }, [globalState]);

    const importFileAsync = async (file: File, existingName?: string) => {
        const assetName = existingName ?? (name.trim() || file.name.replace(/\.[^.]+$/, ""));
        if (!assetName) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry("A sound asset name is required.", true));
            return;
        }
        const coordinator = globalState.coordinator;
        if (!coordinator) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry("No flow graph coordinator is available.", true));
            return;
        }
        try {
            const imported = await ImportSoundAssetFileAsync(globalState, coordinator, file, assetName);
            if (!imported) {
                globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Cancelled sound asset "${assetName}" because the active graph changed.`, true));
                return;
            }
            setName("");
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`${existingName ? "Replaced" : "Imported"} sound asset "${assetName}".`, false));
        } catch (error) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Unable to import sound asset "${assetName}": ${String(error)}`, true));
        }
    };

    const assets = globalState.coordinator?.soundAssets ?? [];
    return (
        <div className={classes.root}>
            <div className={classes.importRow}>
                <TextInputPropertyLine label="Asset name" value={name} onChange={setName} />
                <FileUploadLine
                    label="Import audio"
                    accept=".mp3,.ogg,.m4a,.wav,audio/*"
                    onClick={(files) => {
                        if (files[0]) {
                            void importFileAsync(files[0]);
                        }
                    }}
                />
            </div>
            {assets.length === 0 && <Body1>No sound assets declared.</Body1>}
            {assets.map((asset) => (
                <div className={classes.asset} key={asset.name}>
                    <Body1>{asset.name}</Body1>
                    <Caption1 className={classes.url}>{asset.url.startsWith("data:") ? "Embedded audio data" : asset.url}</Caption1>
                    <div className={classes.actions}>
                        <Button
                            label="Preview"
                            title={`Preview ${asset.name}`}
                            onClick={() => {
                                globalState.coordinator?.getSoundAsset(asset.name)?.play();
                            }}
                        />
                        <Button
                            label="Stop"
                            title={`Stop ${asset.name}`}
                            onClick={() => {
                                globalState.coordinator?.getSoundAsset(asset.name)?.stop();
                            }}
                        />
                        <FileUploadLine
                            label="Replace"
                            accept=".mp3,.ogg,.m4a,.wav,audio/*"
                            onClick={(files) => {
                                if (files[0]) {
                                    void importFileAsync(files[0], asset.name);
                                }
                            }}
                        />
                        <Button label="Remove" title={`Remove ${asset.name}`} onClick={() => globalState.removeSoundAsset(asset.name)} />
                    </div>
                </div>
            ))}
        </div>
    );
};
