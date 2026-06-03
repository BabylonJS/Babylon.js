import { type FunctionComponent, useCallback, useEffect, useState } from "react";
import { type GlobalState } from "../../globalState";
import { SerializationTools } from "../../serializationTools";
import { LogEntry } from "../log/logComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import {
    CloseMcpEditorSessionEventSource,
    NormalizeMcpEditorSessionUrl,
    OpenMcpEditorSessionEventSource,
    PostMcpEditorSessionDocumentAsync,
} from "shared-ui-components/mcp/mcpEditorSessionConnection";

interface IMcpSessionComponentProps {
    globalState: GlobalState;
}

/**
 * Panel that connects to a live MCP session for bidirectional geometry sync.
 * @param props - Component props.
 * @returns The React element.
 */
export const McpSessionComponent: FunctionComponent<IMcpSessionComponentProps> = (props) => {
    const { globalState } = props;
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

    const loadGeometryFromJson = useCallback(
        (json: unknown) => {
            SerializationTools.Deserialize(json, globalState);
            globalState.onResetRequiredObservable.notifyObservers(false);
            globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
            globalState.onFrame.notifyObservers();
            globalState.onClearUndoStack.notifyObservers();
            globalState.onZoomToFitRequiredObservable.notifyObservers();
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
                if (pushOnConnect && globalState.nodeGeometry) {
                    const json = SerializationTools.Serialize(globalState.nodeGeometry, globalState);
                    await PostMcpEditorSessionDocumentAsync(sessionUrl, json);
                }

                CloseMcpEditorSessionEventSource(globalState.mcpEventSource);
                globalState.mcpEventSource = null;

                const eventSource = OpenMcpEditorSessionEventSource({
                    sessionUrl,
                    onDocument: loadGeometryFromJson,
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
        [url, globalState, loadGeometryFromJson]
    );

    const handleDisconnect = useCallback(() => {
        CloseMcpEditorSessionEventSource(globalState.mcpEventSource);
        globalState.mcpEventSource = null;
        globalState.mcpSessionConnected = false;
        globalState.mcpSessionUrl = null;
        globalState.onMcpSessionStateChangedObservable.notifyObservers(false);
    }, [globalState]);

    const handlePush = useCallback(async () => {
        if (!globalState.mcpSessionUrl || !globalState.nodeGeometry) {
            return;
        }
        const json = SerializationTools.Serialize(globalState.nodeGeometry, globalState);
        try {
            const res = await PostMcpEditorSessionDocumentAsync(globalState.mcpSessionUrl, json);
            if (!res.ok) {
                globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Push failed (${res.status})`, true));
            }
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Push failed - ${err}`, true));
        }
    }, [globalState]);

    return (
        <LineContainerComponent title="MCP SESSION" closed={true}>
            <TextInputLineComponent
                label="Session URL"
                value={url}
                onChange={(value) => setUrl(value)}
                placeholder="http://localhost:3001/session/..."
                disabled={connected}
                lockObject={globalState.lockObject}
            />
            <TextLineComponent label="Status" value={connected ? "Connected" : "Disconnected"} color={connected ? "#4caf50" : "#888"} />
            {!connected ? (
                <>
                    <ButtonLineComponent
                        label="Connect"
                        onClick={() => {
                            void handleConnect(false);
                        }}
                    />
                    <ButtonLineComponent
                        label="Connect & Push"
                        onClick={() => {
                            void handleConnect(true);
                        }}
                    />
                </>
            ) : (
                <>
                    <ButtonLineComponent label="Disconnect" onClick={handleDisconnect} />
                    <ButtonLineComponent
                        label="Push to MCP"
                        onClick={() => {
                            void handlePush();
                        }}
                    />
                </>
            )}
        </LineContainerComponent>
    );
};
