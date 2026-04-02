import { useState, useEffect, useRef, type FC, type ChangeEvent } from "react";
import { type GlobalState } from "../globalState";
import { Input, Text, makeStyles, tokens } from "@fluentui/react-components";
import { Dialog, type DialogActionProps } from "shared-ui-components/fluent/primitives/dialog";

/**
 * Request to prompt the user for a missing smart asset.
 */
export interface IAssetPromptRequest {
    /** The smart asset key that is missing. */
    key: string;
    /** The URL that was expected. */
    expectedUrl: string;
    /** Resolve with a new URL, File, or null to skip. */
    resolve: (result: string | File | null) => void;
}

interface IAssetPromptDialogProps {
    globalState: GlobalState;
    request: IAssetPromptRequest | null;
    onCancel: () => void;
    onSubmit: (result: string | File) => void;
}

const useStyles = makeStyles({
    expectedUrl: {
        wordBreak: "break-all",
        opacity: 0.7,
        fontSize: "0.85em",
    },
    urlRow: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalS,
    },
    urlInput: {
        flexGrow: 1,
    },
});

export const AssetPromptDialog: FC<IAssetPromptDialogProps> = (props) => {
    const { request, onCancel, onSubmit } = props;
    const classes = useStyles();
    const [urlInput, setUrlInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (request) {
            setUrlInput("");
        }
    }, [request]);

    if (!request) {
        return null;
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onSubmit(file);
        }
    };

    const handleUrlSubmit = () => {
        if (urlInput.trim()) {
            onSubmit(urlInput.trim());
        }
    };

    const actions: DialogActionProps[] = [
        { label: "Skip", onClick: onCancel },
        { label: "Pick File", onClick: () => fileInputRef.current?.click() },
        { label: "Use URL", onClick: handleUrlSubmit, appearance: "primary", disabled: !urlInput.trim() },
    ];

    return (
        <Dialog open={true} title={`Missing Asset: \u201C${request.key}\u201D`} onDismiss={onCancel} actions={actions} modalType="alert">
            <Text block>
                The asset <strong>&ldquo;{request.key}&rdquo;</strong> could not be loaded from:
            </Text>
            <Text block className={classes.expectedUrl}>
                {request.expectedUrl}
            </Text>
            <Text block>Provide a new URL or pick a local file:</Text>
            <div className={classes.urlRow}>
                <Input
                    className={classes.urlInput}
                    placeholder="https://example.com/asset.glb"
                    value={urlInput}
                    onChange={(_e, data) => setUrlInput(data.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleUrlSubmit();
                        }
                    }}
                />
            </div>
            <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        </Dialog>
    );
};
