import { type FunctionComponent, useEffect, useState } from "react";

import { Body1, Caption1, makeStyles, tokens } from "@fluentui/react-components";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";

import { type GlobalState } from "../../globalState";
import { LogEntry } from "../log/logComponent";

interface ISoundAssetsPanelComponentProps {
    globalState: GlobalState;
}

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
        try {
            const url = await ReadAsDataUrlAsync(file);
            await globalState.addSoundAssetAsync({ name: assetName, url });
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
