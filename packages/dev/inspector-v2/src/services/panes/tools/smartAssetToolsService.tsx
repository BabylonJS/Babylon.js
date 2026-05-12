import { useCallback, useState, type FunctionComponent } from "react";

import { type Scene } from "core/scene";
import { GetAllSmartAssets, LoadSmartAssetMapAsync, RemoveSmartAssetAsync, SerializeSmartAssetManagerMap } from "core/SmartAssets/smartAssetManager";
import { Tools } from "core/Misc/tools";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { Caption1, makeStyles, Spinner, tokens } from "@fluentui/react-components";
import { ArrowDownloadRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
    statusMessage: {
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
        opacity: 0.7,
    },
    busyMessage: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    },
});

/**
 * Save/load controls for a scene's Smart Asset map.
 * @param props - Component props.
 * @returns The Smart Asset map controls.
 */
export const SmartAssetProjectTools: FunctionComponent<{ scene: Scene }> = (props) => {
    const { scene } = props;
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [busyMessage, setBusyMessage] = useState<string>("");
    const styles = useStyles();
    const isBusy = busyMessage !== "";

    const onSaveAssetMap = useCallback(async () => {
        if (isBusy) {
            return;
        }

        setBusyMessage("Saving assets...");
        setStatusMessage("");
        try {
            const assetMap = SerializeSmartAssetManagerMap(scene);
            const jsonBlob = new Blob([JSON.stringify(assetMap, null, 2)], { type: "application/json" });
            Tools.Download(jsonBlob, "smart-assets.json");

            setStatusMessage(`Saved: ${Object.keys(assetMap.assets).length} assets`);
        } catch (err) {
            setStatusMessage(`Save error: ${err}`);
        } finally {
            setBusyMessage("");
        }
    }, [scene, isBusy]);

    const onLoadAssetMap = useCallback(
        async (files: FileList) => {
            const file = files[0];
            if (!file) {
                return;
            }

            if (isBusy) {
                return;
            }

            setBusyMessage("Loading assets...");
            setStatusMessage("");
            try {
                await Promise.all(Array.from(GetAllSmartAssets(scene).keys()).map(async (key) => await RemoveSmartAssetAsync(scene, key)));
                await LoadSmartAssetMapAsync(scene, file);
                setStatusMessage(`Loaded: ${GetAllSmartAssets(scene).size} assets`);
            } catch (err) {
                setStatusMessage(`Load error: ${err}`);
            } finally {
                setBusyMessage("");
            }
        },
        [scene, isBusy]
    );

    return (
        <>
            <ButtonLine label="Save Smart Assets" icon={ArrowDownloadRegular} onClick={onSaveAssetMap} disabled={isBusy} />
            <FileUploadLine label="Load Smart Assets" accept=".json" onClick={onLoadAssetMap} disabled={isBusy} />
            <Collapse visible={isBusy}>
                <div className={styles.busyMessage}>
                    <Spinner size="extra-small" />
                    <Caption1>{busyMessage}</Caption1>
                </div>
            </Collapse>
            <Collapse visible={statusMessage !== ""}>
                <Caption1 className={styles.statusMessage}>{statusMessage}</Caption1>
            </Collapse>
        </>
    );
};
