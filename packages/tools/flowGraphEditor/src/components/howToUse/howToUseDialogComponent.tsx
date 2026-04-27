import * as React from "react";
import { type GlobalState } from "../../globalState";
import "./howToUse.scss";

interface IHowToUseDialogProps {
    globalState: GlobalState;
    onClose: () => void;
}

interface IHowToUseDialogState {
    copiedIndex: number | null;
}

/**
 * Dialog that shows code samples for integrating a saved flow graph into a user's project.
 */
export class HowToUseDialogComponent extends React.Component<IHowToUseDialogProps, IHowToUseDialogState> {
    /** @internal */
    constructor(props: IHowToUseDialogProps) {
        super(props);
        this.state = { copiedIndex: null };
    }

    private _copyToClipboard(text: string, index: number) {
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(text)
                // eslint-disable-next-line github/no-then
                .then(() => {
                    this.setState({ copiedIndex: index });
                    setTimeout(() => this.setState({ copiedIndex: null }), 2000);
                })
                // eslint-disable-next-line github/no-then
                .catch(() => {
                    /* clipboard not available */
                });
        }
    }

    private _renderCodeBlock(code: string, index: number) {
        const isCopied = this.state.copiedIndex === index;
        return (
            <div className="fge-howto-code-block">
                <button className={`fge-howto-copy-btn${isCopied ? " copied" : ""}`} onClick={() => this._copyToClipboard(code, index)}>
                    {isCopied ? "Copied!" : "Copy"}
                </button>
                {code}
            </div>
        );
    }

    /** @internal */
    override render() {
        const snippetId = this.props.globalState.flowGraphSnippetId;

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
            <div className="fge-howto-overlay" onPointerDown={() => this.props.onClose()}>
                <div className="fge-howto-dialog" onPointerDown={(e) => e.stopPropagation()}>
                    <div className="fge-howto-header">
                        <h2>How to Use This Flow Graph</h2>
                        <button className="fge-howto-close" aria-label="Close" onClick={this.props.onClose}>
                            ✕
                        </button>
                    </div>
                    <div className="fge-howto-body">
                        <div className="fge-howto-section">
                            <h3>Method 1: From Snippet Server</h3>
                            <p>
                                {snippetId
                                    ? `Your graph is saved with snippet ID: ${snippetId}. Use the following code to load it.`
                                    : "Save your graph to the snippet server first, then use the snippet ID in the code below."}
                            </p>
                            {this._renderCodeBlock(snippetCode, 0)}
                        </div>

                        <div className="fge-howto-section">
                            <h3>Method 2: From JSON File</h3>
                            <p>Download your graph as a JSON file (using the Save button in the property panel), then load it with this code.</p>
                            {this._renderCodeBlock(fileCode, 1)}
                        </div>

                        <div className="fge-howto-section">
                            <h3>Notes</h3>
                            <p>
                                Both methods create a <code>FlowGraphCoordinator</code> that manages the execution context. Call <code>flowGraph.start()</code> after parsing to
                                begin execution. The scene&apos;s objects (meshes, lights, cameras) will be automatically available to the flow graph through the coordinator&apos;s
                                context.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
