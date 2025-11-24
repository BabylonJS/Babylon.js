/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { DraggableLineComponent } from "shared-ui-components/lines/draggableLineComponent";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { DraggableLineWithButtonComponent } from "shared-ui-components/lines/draggableLineWithButtonComponent";
import { LineWithFileButtonComponent } from "shared-ui-components/lines/lineWithFileButtonComponent";
import { Tools } from "core/Misc/tools";
import addButton from "../../imgs/add.svg";
import deleteButton from "../../imgs/delete.svg";
import { NodeLedger } from "shared-ui-components/nodeGraphSystem/nodeLedger";
import { GetBlocksByMode, GetAllBlockNames, type IBlockDefinition } from "./blockDefinitions";

import "./nodeList.scss";

interface INodeListComponentProps {
    globalState: GlobalState;
}

export class NodeListComponent extends React.Component<INodeListComponentProps, { filter: string }> {
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;

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

        const mode = this.props.globalState.mode;
        const blocksByCategory = GetBlocksByMode(mode);
        const allBlocks: Record<string, string[] | IBlockDefinition[]> = {
            Custom_Frames: customFrameNames,
            ...blocksByCategory,
        };

        // Create node menu
        const blockMenu = [];
        for (const key in allBlocks) {
            const blocks = allBlocks[key];
            // Skip empty categories
            if (!blocks || blocks.length === 0) {
                continue;
            }

            const blockList = blocks
                .filter((block: string | IBlockDefinition) => {
                    const blockName = typeof block === "string" ? block : block.name;
                    return !this.state.filter || blockName.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1;
                })
                .sort((a: string | IBlockDefinition, b: string | IBlockDefinition) => {
                    const nameA = typeof a === "string" ? a : a.name;
                    const nameB = typeof b === "string" ? b : b.name;
                    return nameA.localeCompare(nameB);
                })
                .map((block: string | IBlockDefinition) => {
                    if (key === "Custom_Frames") {
                        const blockName = block as string;
                        return (
                            <DraggableLineWithButtonComponent
                                key={blockName}
                                format={"babylonjs-particle-node"}
                                data={blockName}
                                tooltip={this._customFrameList[blockName] || ""}
                                iconImage={deleteButton}
                                iconTitle="Delete"
                                onIconClick={(value) => this.removeItem(value)}
                            />
                        );
                    }
                    const blockDef = block as IBlockDefinition;
                    return <DraggableLineComponent key={blockDef.name} format={"babylonjs-particle-node"} data={blockDef.name} tooltip={blockDef.tooltip} />;
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
        }

        // Register all blocks (register all blocks regardless of mode, as they may exist in saved files)
        const ledger = NodeLedger.RegisteredNodeNames;
        const allBlockNames = GetAllBlockNames();
        for (const blockName of allBlockNames) {
            if (!ledger.includes(blockName)) {
                ledger.push(blockName);
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

        return (
            <div id="npeNodeList">
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
