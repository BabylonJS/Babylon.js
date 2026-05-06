import { type FunctionComponent, useCallback, useState } from "react";

import { Button, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Subtitle2, Text, makeStyles, tokens } from "@fluentui/react-components";
import { CheckmarkRegular, CopyRegular } from "@fluentui/react-icons";

import { type GlobalState } from "../../globalState";

interface IHowToUseDialogProps {
    globalState: GlobalState;
    onClose: () => void;
}

const useStyles = makeStyles({
    surface: {
        width: "700px",
        maxWidth: "90%",
        maxHeight: "80vh",
        // Mirror Fluent's pattern: DialogBody's baseline `max-height: calc(100dvh - 2*24px)`
        // accounts for the surface's 24px top/bottom padding. When we shrink the surface to
        // 80vh, do the same compensation so the body fits inside the surface's padding box.
        "& .fui-DialogBody": {
            maxHeight: "calc(80vh - 2 * 24px)",
            minHeight: 0,
        },
    },
    body: {
        overflowY: "auto",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalL,
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    codeBlock: {
        position: "relative",
        background: tokens.colorNeutralBackground3,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacingHorizontalM,
        fontFamily: tokens.fontFamilyMonospace,
        fontSize: tokens.fontSizeBase200,
        whiteSpace: "pre",
        overflowX: "auto",
        color: tokens.colorNeutralForeground1,
    },
    copyButton: {
        position: "absolute",
        top: tokens.spacingVerticalS,
        right: tokens.spacingHorizontalS,
    },
    inlineCode: {
        background: tokens.colorNeutralBackground3,
        padding: `1px ${tokens.spacingHorizontalXS}`,
        borderRadius: tokens.borderRadiusSmall,
        fontFamily: tokens.fontFamilyMonospace,
        fontSize: tokens.fontSizeBase200,
    },
});

const CodeBlock: FunctionComponent<{ code: string }> = ({ code }) => {
    const classes = useStyles();
    const [copied, setCopied] = useState(false);
    const onCopy = useCallback(() => {
        if (!navigator.clipboard) {
            return;
        }
        // eslint-disable-next-line github/no-then
        navigator.clipboard
            .writeText(code)
            // eslint-disable-next-line github/no-then
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            // eslint-disable-next-line github/no-then
            .catch(() => {
                /* clipboard not available */
            });
    }, [code]);

    return (
        <div className={classes.codeBlock}>
            <Button className={classes.copyButton} size="small" appearance="secondary" icon={copied ? <CheckmarkRegular /> : <CopyRegular />} onClick={onCopy}>
                {copied ? "Copied!" : "Copy"}
            </Button>
            {code}
        </div>
    );
};

/**
 * Dialog that shows code samples for integrating a saved flow graph into a user's project.
 * @returns The rendered "How to use" dialog.
 */
export const HowToUseDialogComponent: FunctionComponent<IHowToUseDialogProps> = ({ globalState, onClose }) => {
    const classes = useStyles();
    const snippetId = globalState.flowGraphSnippetId;

    const snippetCode = `import { FlowGraphCoordinator } from "@babylonjs/core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "@babylonjs/core/FlowGraph/flowGraphParser";

// After creating your scene:
const coordinator = new FlowGraphCoordinator({ scene });

// Fetch the snippet from the Babylon.js snippet server:
const response = await fetch(
    "https://snippet.babylonjs.com/${snippetId || "<your-snippet-id>"}"
);
const snippet = await response.json();
const data = JSON.parse(snippet.jsonPayload);

// Parse and start the flow graph:
const flowGraph = await ParseFlowGraphAsync(
    JSON.parse(data.flowGraph),
    { coordinator }
);
flowGraph.start();`;

    const fileCode = `import { FlowGraphCoordinator } from "@babylonjs/core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "@babylonjs/core/FlowGraph/flowGraphParser";

// Load the saved JSON file:
const response = await fetch("./flowGraph.json");
const data = await response.json();

// After creating your scene:
const coordinator = new FlowGraphCoordinator({ scene });
const flowGraph = await ParseFlowGraphAsync(
    data,
    { coordinator }
);
flowGraph.start();`;

    return (
        <Dialog open onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface className={classes.surface}>
                <DialogBody>
                    <DialogTitle>How to Use This Flow Graph</DialogTitle>
                    <DialogContent className={classes.body}>
                        <div className={classes.section}>
                            <Subtitle2>Method 1: From Snippet Server</Subtitle2>
                            <Text>
                                {snippetId
                                    ? `Your graph is saved with snippet ID: ${snippetId}. Use the following code to load it.`
                                    : "Save your graph to the snippet server first, then use the snippet ID in the code below."}
                            </Text>
                            <CodeBlock code={snippetCode} />
                        </div>

                        <div className={classes.section}>
                            <Subtitle2>Method 2: From JSON File</Subtitle2>
                            <Text>Download your graph as a JSON file (using the Save button in the property panel), then load it with this code.</Text>
                            <CodeBlock code={fileCode} />
                        </div>

                        <div className={classes.section}>
                            <Subtitle2>Notes</Subtitle2>
                            <Text>
                                Both methods create a <span className={classes.inlineCode}>FlowGraphCoordinator</span> that manages the execution context. Call{" "}
                                <span className={classes.inlineCode}>flowGraph.start()</span> after parsing to begin execution. The scene&apos;s objects (meshes, lights, cameras)
                                will be automatically available to the flow graph through the coordinator&apos;s context.
                            </Text>
                        </div>
                    </DialogContent>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};
