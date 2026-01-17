import type { FunctionComponent } from "react";

import { makeStyles, tokens, Input, Label } from "@fluentui/react-components";
import { useCallback, useRef, useState } from "react";
import { ArrowLeftRegular } from "@fluentui/react-icons";
import { Animation } from "core/Animations/animation";
import { Tools } from "core/Misc/tools";

import { Button } from "shared-ui-components/fluent/primitives/button";
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
    fileInput: {
        display: "none",
    },
    snippetId: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        marginTop: tokens.spacingVerticalS,
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFromFile = useCallback(
        (evt: React.ChangeEvent<HTMLInputElement>) => {
            const files = evt.target.files;
            if (!files || !files.length) {
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
                undefined,
                true
            );

            evt.target.value = "";
        },
        [state.target, actions, observables, onClose]
    );

    const loadFromSnippetServer = useCallback(async () => {
        if (!snippetIdInput) {
            window.alert("Please enter a snippet ID");
            return;
        }

        try {
            const result = await Animation.ParseFromSnippetAsync(snippetIdInput);
            const animations = Array.isArray(result) ? (result as Animation[]) : [result as Animation];

            setLoadedSnippetId(snippetIdInput);

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
        } catch (err) {
            window.alert("Unable to load animations: " + err);
        }
    }, [snippetIdInput, state.target, actions, observables, onClose]);

    const handleBrowseClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <Button icon={ArrowLeftRegular} appearance="subtle" onClick={onClose} />
                <span className={styles.title}>Load Animations</span>
            </div>

            <div className={styles.section}>
                <Label>From Snippet Server</Label>
                <div className={styles.row}>
                    <Input className={styles.input} placeholder="Snippet ID" value={snippetIdInput} onChange={(_, data) => setSnippetIdInput(data.value)} />
                    <Button appearance="primary" onClick={loadFromSnippetServer} label="Load" />
                </div>
            </div>

            <div className={styles.section}>
                <Label>From File</Label>
                <input ref={fileInputRef} type="file" accept=".json" className={styles.fileInput} onChange={loadFromFile} />
                <Button appearance="subtle" onClick={handleBrowseClick} label="Browse..." />
            </div>

            {loadedSnippetId && <div className={styles.snippetId}>Loaded Snippet ID: {loadedSnippetId}</div>}
        </div>
    );
};
