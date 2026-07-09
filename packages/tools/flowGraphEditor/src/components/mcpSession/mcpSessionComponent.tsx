import { type FunctionComponent, useCallback, useEffect, useState } from "react";
import { type GlobalState } from "../../globalState";
import { SerializationTools } from "../../serializationTools";
import { LogEntry } from "../log/logComponent";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import {
    CloseMcpEditorSessionEventSource,
    NormalizeMcpEditorSessionUrl,
    OpenMcpEditorSessionEventSource,
    PostMcpEditorSessionDocumentAsync,
} from "shared-ui-components/mcp/mcpEditorSessionConnection";
import { makeStyles, tokens } from "@fluentui/react-components";

interface IMcpSessionComponentProps {
    globalState: GlobalState;
}

const useStyles = makeStyles({
    buttonStack: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        alignItems: "stretch",
        padding: `${tokens.spacingVerticalXS} 0`,
    },
});

async function LoadFlowGraphFromJsonAsync(globalState: GlobalState, json: unknown): Promise<void> {
    await SerializationTools.DeserializeAsync(json, globalState);
    globalState.onResetRequiredObservable.notifyObservers(false);
    globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
    globalState.onClearUndoStack.notifyObservers();
    globalState.onBuiltObservable.notifyObservers();
    globalState.onZoomToFitRequiredObservable.notifyObservers();

    // MCP documents carry runtime data only — no editor layout (block positions). When the
    // incoming graph has no saved layout, auto-arrange it. build()'s own deferred auto-sort is
    // cancelled here by the build-version guard (several rebuild-triggering observables fire during
    // load), so request the sort explicitly, deferred past the current build. Graphs that already
    // carry layout (_editorData) are left as-is so a user's manual arrangement is preserved.
    if (!(globalState.flowGraph as any)?._editorData) {
        setTimeout(() => globalState.onSortGraphRequiredObservable.notifyObservers(), 0);
    }
}

/**
 * Panel that connects to a live MCP session for bidirectional flow-graph sync.
 * @param props - Component props.
 * @returns The React element.
 */
export const McpSessionComponent: FunctionComponent<IMcpSessionComponentProps> = (props) => {
    const { globalState } = props;
    const classes = useStyles();
    const [url, setUrl] = useState<string>(globalState.mcpSessionUrl ?? "");
    const [connected, setConnected] = useState<boolean>(globalState.mcpSessionConnected);

    useEffect(() => {
        const observer = globalState.onMcpSessionStateChangedObservable.add((state) => {
            setConnected(state);
        });
        setConnected(globalState.mcpSessionConnected);
        if (globalState.mcpSessionUrl) {
            setUrl(globalState.mcpSessionUrl);
        }
        return () => {
            globalState.onMcpSessionStateChangedObservable.remove(observer);
        };
    }, [globalState]);

    const loadFlowGraphFromJson = useCallback(
        (json: unknown) => {
            void (async () => {
                try {
                    await LoadFlowGraphFromJsonAsync(globalState, json);
                } catch (err) {
                    globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Load failed - ${err}`, true));
                }
            })();
        },
        [globalState]
    );

    const handleConnect = useCallback(
        async (pushOnConnect: boolean = false) => {
            const sessionUrl = NormalizeMcpEditorSessionUrl(url);
            if (!sessionUrl) {
                return;
            }

            try {
                if (pushOnConnect && globalState.flowGraph) {
                    await PostMcpEditorSessionDocumentAsync(sessionUrl, SerializationTools.Serialize(globalState.flowGraph, globalState));
                }

                CloseMcpEditorSessionEventSource(globalState.mcpEventSource);
                globalState.mcpEventSource = null;

                const eventSource = OpenMcpEditorSessionEventSource({
                    sessionUrl,
                    onDocument: loadFlowGraphFromJson,
                    onSessionClosed: (reason) => {
                        globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session ended: ${reason}`, false));
                        globalState.mcpSessionConnected = false;
                        globalState.mcpEventSource = null;
                        globalState.onMcpSessionStateChangedObservable.notifyObservers(false);
                    },
                    onConnectionError: () => {
                        globalState.mcpSessionConnected = false;
                        globalState.mcpEventSource = null;
                        globalState.onMcpSessionStateChangedObservable.notifyObservers(false);
                    },
                });
                globalState.mcpEventSource = eventSource;

                globalState.mcpSessionUrl = sessionUrl;
                globalState.mcpSessionConnected = true;
                globalState.onMcpSessionStateChangedObservable.notifyObservers(true);
            } catch (err) {
                globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Connection failed - ${err}`, true));
            }
        },
        [url, globalState, loadFlowGraphFromJson]
    );

    const handleDisconnect = useCallback(() => {
        CloseMcpEditorSessionEventSource(globalState.mcpEventSource);
        globalState.mcpEventSource = null;
        globalState.mcpSessionConnected = false;
        globalState.mcpSessionUrl = null;
        globalState.onMcpSessionStateChangedObservable.notifyObservers(false);
    }, [globalState]);

    const handlePush = useCallback(async () => {
        if (!globalState.mcpSessionUrl || !globalState.flowGraph) {
            return;
        }
        try {
            const res = await PostMcpEditorSessionDocumentAsync(globalState.mcpSessionUrl, SerializationTools.Serialize(globalState.flowGraph, globalState));
            if (!res.ok) {
                globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Push failed (${res.status})`, true));
            }
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Push failed - ${err}`, true));
        }
    }, [globalState]);

    return (
        <>
            <TextInputPropertyLine label="Session URL" value={url} onChange={(value) => setUrl(value)} disabled={connected} />
            <TextPropertyLine label="Status" value={connected ? "Connected" : "Disconnected"} />
            {!connected ? (
                <div className={classes.buttonStack}>
                    <Button
                        label="Connect"
                        title="Connect"
                        onClick={() => {
                            void handleConnect(false);
                        }}
                    />
                    <Button
                        label="Connect & Push"
                        title="Connect & Push"
                        onClick={() => {
                            void handleConnect(true);
                        }}
                    />
                </div>
            ) : (
                <div className={classes.buttonStack}>
                    <Button label="Disconnect" title="Disconnect" onClick={handleDisconnect} />
                    <Button
                        label="Push to MCP"
                        title="Push to MCP"
                        onClick={() => {
                            void handlePush();
                        }}
                    />
                </div>
            )}
        </>
    );
};
