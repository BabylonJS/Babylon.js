import type { FunctionComponent } from "react";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation } from "core/Animations/animationGroup";

import { makeStyles, tokens, Checkbox } from "@fluentui/react-components";
import { useCallback, useState } from "react";
import { Animation as AnimationClass } from "core/Animations/animation";
import { StringTools } from "shared-ui-components/stringTools";

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
    list: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        maxHeight: "200px",
        overflow: "auto",
        padding: tokens.spacingVerticalS,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
    },
    buttons: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
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

type SaveAnimationPanelProps = {
    onClose: () => void;
};

/**
 * Panel for saving animations to file or snippet server
 * @returns The save animation panel component
 */
export const SaveAnimationPanel: FunctionComponent<SaveAnimationPanelProps> = ({ onClose: _onClose }) => {
    const styles = useStyles();
    const { state } = useCurveEditor();

    const [selectedAnimations, setSelectedAnimations] = useState<Animation[]>(() => {
        if (!state.animations) {
            return [];
        }
        if (state.useTargetAnimations) {
            return (state.animations as TargetedAnimation[]).map((ta) => ta.animation);
        }
        return [...(state.animations as Animation[])];
    });
    const [snippetId, setSnippetId] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const getAnimation = useCallback(
        (anim: Animation | TargetedAnimation): Animation => {
            return state.useTargetAnimations ? (anim as TargetedAnimation).animation : (anim as Animation);
        },
        [state.useTargetAnimations]
    );

    const toggleAnimation = useCallback((animation: Animation, checked: boolean) => {
        setSelectedAnimations((prev) => {
            if (checked) {
                return [...prev, animation];
            }
            return prev.filter((a) => a !== animation);
        });
    }, []);

    const getJson = useCallback(() => {
        const json: { animations: unknown[] } = { animations: [] };
        for (const animation of selectedAnimations) {
            json.animations.push(animation.serialize());
        }
        return JSON.stringify(json);
    }, [selectedAnimations]);

    const saveToFile = useCallback(() => {
        StringTools.DownloadAsFile(document, getJson(), "animations.json");
    }, [getJson]);

    const saveToSnippetServer = useCallback(() => {
        const xmlHttp = new XMLHttpRequest();
        const json = getJson();

        setIsSaving(true);
        setSaveError(null);

        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4) {
                setIsSaving(false);
                if (xmlHttp.status === 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    let newSnippetId = snippet.id;
                    if (snippet.version && snippet.version !== "0") {
                        newSnippetId += "#" + snippet.version;
                    }
                    setSnippetId(newSnippetId);
                } else {
                    setSaveError("Unable to save your animations. Please try again.");
                }
            }
        };

        xmlHttp.open("POST", AnimationClass.SnippetUrl + (snippetId ? "/" + snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        const dataToSend = {
            payload: JSON.stringify({ animations: json }),
            name: "",
            description: "",
            tags: "",
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }, [getJson, snippetId]);

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <div className={styles.title}>Save Animations</div>
            </div>

            <div className={styles.list}>
                {state.animations?.map((anim, i) => {
                    const animation = getAnimation(anim);
                    const isChecked = selectedAnimations.includes(animation);
                    return <Checkbox key={i} label={animation.name} checked={isChecked} onChange={(_, data) => toggleAnimation(animation, !!data.checked)} />;
                })}
            </div>

            <div className={styles.buttons}>
                <Button
                    appearance="primary"
                    onClick={saveToSnippetServer}
                    disabled={selectedAnimations.length === 0 || isSaving}
                    label={isSaving ? "Saving..." : "Save to Snippet Server"}
                />
                <Button appearance="secondary" onClick={saveToFile} disabled={selectedAnimations.length === 0} label="Save to File" />
            </div>

            {saveError && <div className={styles.errorText}>{saveError}</div>}
            {snippetId && <div className={styles.snippetId}>Saved! Snippet ID: {snippetId}</div>}
        </div>
    );
};
