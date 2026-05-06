import { type ChangeEvent, type FunctionComponent, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";

import { CreateSmartAssetManager, GetSmartAssetManagerFromScene, type SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { type Scene } from "core/scene";

import { Body1, Caption1, makeStyles } from "@fluentui/react-components";
import { Dialog } from "shared-ui-components/fluent/primitives/dialog";

type MissingSmartAssetDialogProps = {
    keyName: string;
    expectedUrl: string;
    onResolve: (value: string | File | null) => void;
};

const useStyles = makeStyles({
    hiddenInput: {
        display: "none",
    },
});

const MissingSmartAssetDialog: FunctionComponent<MissingSmartAssetDialogProps> = (props) => {
    const { keyName, expectedUrl, onResolve } = props;
    const inputRef = useRef<HTMLInputElement>(null);
    const classes = useStyles();
    const shortUrl = expectedUrl.length > 60 ? "..." + expectedUrl.slice(-50) : expectedUrl;

    const onSkip = useCallback(() => {
        onResolve(null);
    }, [onResolve]);

    const onLocate = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const onFileSelected = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onResolve(event.target.files?.[0] ?? null);
        },
        [onResolve]
    );

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
            <Body1>Key: {keyName}</Body1>
            <Caption1>{shortUrl}</Caption1>
            <Body1>Locate the file or click Skip to continue without it.</Body1>
            <input
                ref={inputRef}
                type="file"
                accept=".glb,.gltf,.babylon,.obj,.png,.jpg,.jpeg,.env,.hdr,.dds,.ktx,.ktx2"
                className={classes.hiddenInput}
                onChange={onFileSelected}
            />
        </Dialog>
    );
};

/**
 * Default handler for missing assets — shows a shared Fluent dialog with
 * "Locate File" and "Skip" buttons.
 * @param key - The smart asset key that was not found.
 * @param expectedUrl - The URL that failed to load.
 * @returns A promise resolving to a new URL, File, or null to skip.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function inspectorAssetNotFoundHandler(key: string, expectedUrl: string): Promise<string | File | null> {
    return await new Promise<string | File | null>((resolve) => {
        const container = document.createElement("div");
        document.body.appendChild(container);

        const root = createRoot(container);
        let didResolve = false;

        const onResolve = (value: string | File | null) => {
            if (didResolve) {
                return;
            }
            didResolve = true;
            root.unmount();
            container.remove();
            resolve(value);
        };

        root.render(<MissingSmartAssetDialog keyName={key} expectedUrl={expectedUrl} onResolve={onResolve} />);
    });
}

/**
 * Installs the default `onAssetNotFound` handler on a SmartAssetManager
 * if no handler is already set.
 * @param sam - The SmartAssetManager to install the handler on.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function installAssetNotFoundHandler(sam: SmartAssetManager): void {
    if (!sam.onAssetNotFound) {
        sam.onAssetNotFound = inspectorAssetNotFoundHandler;
    }
}

/**
 * Gets or lazily creates the SmartAssetManager for a scene.
 * @param scene - The scene to get/create managers for.
 * @returns The SmartAssetManager for the scene.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getOrCreateSmartAssetManager(scene: Scene): SmartAssetManager {
    let sam = GetSmartAssetManagerFromScene(scene);
    if (!sam) {
        sam = CreateSmartAssetManager(scene);
    }

    installAssetNotFoundHandler(sam);
    return sam;
}
