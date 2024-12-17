/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { DraggableLineComponent } from "../../sharedComponents/draggableLineComponent";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { DraggableLineWithButtonComponent } from "../../sharedComponents/draggableLineWithButtonComponent";
import { LineWithFileButtonComponent } from "../../sharedComponents/lineWithFileButtonComponent";
import { Tools } from "core/Misc/tools";
import addButton from "../../imgs/add.svg";
import deleteButton from "../../imgs/delete.svg";
import { NodeLedger } from "shared-ui-components/nodeGraphSystem/nodeLedger";

import "./nodeList.scss";

interface INodeListComponentProps {
    globalState: GlobalState;
}

export class NodeListComponent extends React.Component<INodeListComponentProps, { filter: string }> {
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;

    private static _Tooltips: { [key: string]: string } = {
        TextureBlock: "Input block set to a texture value",
        TextureBackBufferBlock: "Input block corresponding to the back buffer color texture",
        TextureBackBufferDepthStencilBlock: "Input block corresponding to the back buffer depth/stencil texture",
        TextureDepthStencilBlock: "Input block corresponding to a depth/stencil texture",
        ElbowBlock: "Passthrough block mostly used to organize your graph",
        TeleportInBlock: "Passthrough block mostly used to organize your graph (but without visible lines). It works like a teleportation point for the graph.",
        TeleportOutBlock: "Endpoint for a TeleportInBlock.",
        OutputBlock: "Output block used to gather the final render graph",
        ClearBlock: "Clears a texture",
        CopyTextureBlock: "Copies a texture to another texture",
        GenerateMipmapsBlock: "Generates mipmaps for a texture",
        BlackAndWhiteBlock: "Applies a black and white post process",
        BloomBlock: "Applies a bloom post process",
        BlurBlock: "Applies a blur post process",
        CircleOfConfusionBlock: "Applies a circle of confusion post process",
        DepthOfFieldBlock: "Applies a depth of field post process",
        ExtractHighlightsBlock: "Applies an extract highlights post process",
        GUIBlock: "Used to render a GUI",
        ObjectRendererBlock: "Renders objects to a render target",
        TAAObjectRendererBlock: "Renders objects with Temporal Anti-Aliasing to a render target",
        GeometryRendererBlock: "Generates geometry buffers for a list of objects",
        ObjectListBlock: "List of objects (meshes, particle systems, sprites)",
        CullBlock: "Culls a list of objects",
        CameraBlock: "Camera",
        ResourceContainerBlock: "Container of resources (textures, buffers, shadow generators)",
        ShadowLightBlock: "Shadow light (used by the shadow generator block)",
        ShadowGeneratorBlock: "Generates shadows through a shadow generator",
        CascadedShadowGeneratorBlock: "Generates shadows through a cascaded shadow generator",
        ExecuteBlock: "Block used to execute a custom function",
    };

    private _customFrameList: { [key: string]: string };

    constructor(props: INodeListComponentProps) {
        super(props);

        this.state = { filter: "" };

        const frameJson = localStorage.getItem("Custom-Frame-List");
        if (frameJson) {
            this._customFrameList = JSON.parse(frameJson);
        }

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    filterContent(filter: string) {
        this.setState({ filter: filter });
    }

    loadCustomFrame(file: File) {
        Tools.ReadFile(
            file,
            async (data) => {
                // get Frame Data from file
                const decoder = new TextDecoder("utf-8");
                const frameData = JSON.parse(decoder.decode(data));
                const frameName = frameData.editorData.frames[0].name + "Custom";
                const frameToolTip = frameData.editorData.frames[0].comments || "";

                try {
                    localStorage.setItem(frameName, JSON.stringify(frameData));
                } catch (error) {
                    this.props.globalState.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers("Error Saving Frame");
                    return;
                }

                const frameJson = localStorage.getItem("Custom-Frame-List");
                let frameList: { [key: string]: string } = {};
                if (frameJson) {
                    frameList = JSON.parse(frameJson);
                }
                frameList[frameName] = frameToolTip;
                localStorage.setItem("Custom-Frame-List", JSON.stringify(frameList));
                this._customFrameList = frameList;
                this.forceUpdate();
            },
            undefined,
            true
        );
    }

    removeItem(value: string): void {
        const frameJson = localStorage.getItem("Custom-Frame-List");
        if (frameJson) {
            const registeredIdx = NodeLedger.RegisteredNodeNames.indexOf(value);
            if (registeredIdx !== -1) {
                NodeLedger.RegisteredNodeNames.splice(registeredIdx, 1);
            }
            const frameList = JSON.parse(frameJson);
            delete frameList[value];
            localStorage.removeItem(value);
            localStorage.setItem("Custom-Frame-List", JSON.stringify(frameList));
            this._customFrameList = frameList;
            this.forceUpdate();
        }
    }

    override render() {
        const customFrameNames: string[] = [];
        for (const frame in this._customFrameList) {
            customFrameNames.push(frame);
        }

        // Block types used to create the menu from
        const allBlocks: any = {
            Custom_Frames: customFrameNames,
            Inputs: [
                "TextureBlock",
                "TextureBackBufferBlock",
                "TextureBackBufferDepthStencilBlock",
                "TextureDepthStencilBlock",
                "ObjectListBlock",
                "CameraBlock",
                "ShadowLightBlock",
            ],
            Post_Processes: ["BlackAndWhiteBlock", "BloomBlock", "BlurBlock", "CircleOfConfusionBlock", "DepthOfFieldBlock", "ExtractHighlightsBlock"],
            Misc: ["ElbowBlock", "TeleportInBlock", "TeleportOutBlock", "GUIBlock", "ResourceContainerBlock", "CullBlock", "ExecuteBlock"],
            Textures: ["ClearBlock", "CopyTextureBlock", "GenerateMipmapsBlock"],
            Output_Nodes: ["OutputBlock"],
            Rendering: ["ObjectRendererBlock", "GeometryRendererBlock", "TAAObjectRendererBlock", "ShadowGeneratorBlock", "CascadedShadowGeneratorBlock"],
        };

        // Create node menu
        const blockMenu = [];
        for (const key in allBlocks) {
            const blockList = (allBlocks as any)[key]
                .filter((b: string) => !this.state.filter || b.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1)
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((block: any) => {
                    if (key === "Custom_Frames") {
                        return (
                            <DraggableLineWithButtonComponent
                                key={block}
                                data={block}
                                tooltip={this._customFrameList[block] || ""}
                                iconImage={deleteButton}
                                iconTitle="Delete"
                                onIconClick={(value) => this.removeItem(value)}
                            />
                        );
                    }
                    return <DraggableLineComponent key={block} data={block} tooltip={NodeListComponent._Tooltips[block] || ""} />;
                });

            if (key === "Custom_Frames") {
                const line = (
                    <LineWithFileButtonComponent
                        key="add..."
                        title={"Add Custom Frame"}
                        closed={false}
                        label="Add..."
                        uploadName={"custom-frame-upload"}
                        iconImage={addButton}
                        accept=".json"
                        onIconClick={(file) => {
                            this.loadCustomFrame(file);
                        }}
                    />
                );
                blockList.push(line);
            }
            if (blockList.length) {
                blockMenu.push(
                    <LineContainerComponent key={key + " blocks"} title={key.replace("__", ": ").replace("_", " ")} closed={false}>
                        {blockList}
                    </LineContainerComponent>
                );
            }

            // Register blocks
            const ledger = NodeLedger.RegisteredNodeNames;
            for (const key in allBlocks) {
                const blocks = allBlocks[key] as string[];
                if (blocks.length) {
                    for (const block of blocks) {
                        if (!ledger.includes(block)) {
                            ledger.push(block);
                        }
                    }
                }
            }
            NodeLedger.NameFormatter = (name) => {
                let finalName = name;
                // custom frame
                if (name.endsWith("Custom")) {
                    const nameIndex = name.lastIndexOf("Custom");
                    finalName = name.substring(0, nameIndex);
                    finalName += " [custom]";
                } else {
                    finalName = name.replace("Block", "");
                }
                return finalName;
            };
        }

        return (
            <div id="nrgeNodeList">
                <div className="panes">
                    <div className="pane">
                        <div className="filter">
                            <input
                                type="text"
                                placeholder="Filter"
                                onFocus={() => (this.props.globalState.lockObject.lock = true)}
                                onBlur={() => {
                                    this.props.globalState.lockObject.lock = false;
                                }}
                                onChange={(evt) => this.filterContent(evt.target.value)}
                            />
                        </div>
                        <div className="list-container">{blockMenu}</div>
                    </div>
                </div>
            </div>
        );
    }
}
