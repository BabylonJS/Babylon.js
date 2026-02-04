import type { FunctionComponent } from "react";

import { makeStyles, tokens, Input, Label } from "@fluentui/react-components";
import { useCallback, useState } from "react";
import { Animation } from "core/Animations/animation";
import { Tools } from "core/Misc/tools";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { UploadButton } from "shared-ui-components/fluent/primitives/uploadButton";
import { useCurveEditor } from "../curveEditorContext";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    title: {
        fontSize: tokens.fontSizeBase400,
        fontWeight: tokens.fontWeightSemibold,
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    row: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    input: {
        flex: 1,
    },
    snippetId: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        marginTop: tokens.spacingVerticalS,
    },
    errorText: {
        color: tokens.colorPaletteRedForeground1,
        fontSize: tokens.fontSizeBase200,
    },
});

type LoadAnimationPanelProps = {
    onClose: () => void;
};

/**
 * Panel for loading animations from file or snippet server
 * @returns The load animation panel component
 */
export const LoadAnimationPanel: FunctionComponent<LoadAnimationPanelProps> = ({ onClose }) => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();

    const [snippetIdInput, setSnippetIdInput] = useState("");
    const [loadedSnippetId, setLoadedSnippetId] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const loadAnimations = useCallback(
        (animations: Animation[]) => {
            // Update target
            if (state.target) {
                state.target.animations = animations;
            }

            // Update active animations
            actions.setActiveAnimations(animations.length ? animations : []);

            // Close first so AnimationList mounts, then notify
            onClose();
            observables.onAnimationsLoaded.notifyObservers();
            observables.onActiveAnimationChanged.notifyObservers({});
        },
        [state.target, actions, observables, onClose]
    );

    const loadFromFile = useCallback(
        (files: FileList) => {
            if (!files.length) {
                return;
            }

            const file = files[0];
            Tools.ReadFile(
                file,
                (data) => {
                    const decoder = new TextDecoder("utf-8");
                    const parsedAnimations = JSON.parse(decoder.decode(data)).animations;
                    const animations: Animation[] = [];

                    for (const parsedAnimation of parsedAnimations) {
                        animations.push(Animation.Parse(parsedAnimation));
                    }

                    loadAnimations(animations);
                },
                undefined,
                true
            );
        },
        [loadAnimations]
    );

    const loadFromSnippetServer = useCallback(async () => {
        if (!snippetIdInput) {
            return;
        }

        setLoadError(null);

        try {
            const result = await Animation.ParseFromSnippetAsync(snippetIdInput);
            const animations = Array.isArray(result) ? (result as Animation[]) : [result as Animation];

            setLoadedSnippetId(snippetIdInput);
            loadAnimations(animations);
        } catch (err) {
            setLoadError("Unable to load animations: " + err);
        }
    }, [snippetIdInput, loadAnimations]);

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <div className={styles.title}>Load Animations</div>
            </div>

            <div className={styles.section}>
                <Label>From Snippet Server</Label>
                <div className={styles.row}>
                    <Input className={styles.input} placeholder="Snippet ID" value={snippetIdInput} onChange={(_, data) => setSnippetIdInput(data.value)} />
                    <Button appearance="primary" onClick={loadFromSnippetServer} disabled={!snippetIdInput.trim()} label="Load" />
                </div>
                {loadError && <div className={styles.errorText}>{loadError}</div>}
            </div>

            <div className={styles.section}>
                <Label>From File</Label>
                <UploadButton appearance="subtle" onUpload={loadFromFile} accept=".json" label="Browse..." />
            </div>

            {loadedSnippetId && <div className={styles.snippetId}>Loaded Snippet ID: {loadedSnippetId}</div>}
        </div>
    );
};
