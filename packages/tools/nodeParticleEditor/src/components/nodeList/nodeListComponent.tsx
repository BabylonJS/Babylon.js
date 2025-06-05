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

import "./nodeList.scss";

interface INodeListComponentProps {
    globalState: GlobalState;
}

export class NodeListComponent extends React.Component<INodeListComponentProps, { filter: string }> {
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;

    private static _Tooltips: { [key: string]: string } = {
        SystemBlock: "Generate a particle system",
        Float: "Input block set to a float value",
        Vector2: "Input block set to a Vector2 value",
        Vector3: "Input block set to a Vector3 value",
        Vector4: "Input block set to a Vector4 value",
        Color3: "Input block set to a Color3 value",
        Color4: "Input block set to a Color4 value",
        Int: "Input block set to a integer value",
        TextureBlock: "Provide a texture",
        BoxEmitterBlock: "Emit particles from a box shape",
        SphereEmitterBlock: "Emit particles from a sphere shape",
        PointEmitterBlock: "Emit particles from a point",
        RandomRangeBlock: "Generate a random value between two inputs",
        UpdateDirectionBlock: "Update the direction of a particle",
        UpdatePositionBlock: "Update the position of a particle",
        UpdateColorBlock: "Update the color of a particle",
        UpdateScaleBlock: "Update the scale of a particle",
        AddBlock: "Math block set to Add",
        DivideBlock: "Math block set to Divide",
        MaxBlock: "Math block set to Max",
        MinBlock: "Math block set to Min",
        MultiplyBlock: "Math block set to Multiply",
        SubtractBlock: "Math block set to Subtract",
        PositionBlock: "Contextual block to get the position of a particle",
        DirectionBlock: "Contextual block to get the direction of a particle",
        ScaledDirectionBlock: "Contextual block to get the scaled direction of a particle",
        ColorBlock: "Contextual block to get the color of a particle",
        AgeBlock: "Contextual block to get the age of a particle",
        LifetimeBlock: "Contextual block to get the lifetime of a particle",
        ScaleBlock: "Contextual block to get the scale of a particle",
        AgeGradientBlock: "Contextual block to get the age gradient of a particle ie. the age divided by the lifetime",
        LerpBlock: "Interpolate between two values",
        GradientEntryBlock: "A gradient entry block used to define a value at a specific age",
        GradientBlock: "A gradient block used to define a gradient of values over the lifetime of a particle",
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
            Emitters: ["BoxEmitterBlock", "SphereEmitterBlock", "PointEmitterBlock"],
            Inputs: ["Float", "Vector2", "Vector3", "Vector4", "Int", "TextureBlock", "Color3", "Color4"],
            Updates: ["UpdateDirectionBlock", "UpdatePositionBlock", "UpdateColorBlock", "UpdateScaleBlock"],
            Math__Standard: ["AddBlock", "DivideBlock", "MaxBlock", "MinBlock", "MultiplyBlock", "SubtractBlock"],
            Interpolation: ["LerpBlock", "GradientEntryBlock", "GradientBlock"],
            Misc: ["RandomRangeBlock"],
            System_Nodes: ["SystemBlock"],
            Contextual: ["PositionBlock", "DirectionBlock", "ScaledDirectionBlock", "ColorBlock", "AgeBlock", "LifetimeBlock", "ScaleBlock", "AgeGradientBlock"],
        };

        // Create node menu
        const blockMenu = [];
        for (const key in allBlocks) {
            const blockList = allBlocks[key]
                .filter((b: string) => !this.state.filter || b.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1)
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((block: any) => {
                    if (key === "Custom_Frames") {
                        return (
                            <DraggableLineWithButtonComponent
                                key={block}
                                format={"babylonjs-particle-node"}
                                data={block}
                                tooltip={this._customFrameList[block] || ""}
                                iconImage={deleteButton}
                                iconTitle="Delete"
                                onIconClick={(value) => this.removeItem(value)}
                            />
                        );
                    }
                    return <DraggableLineComponent key={block} format={"babylonjs-particle-node"} data={block} tooltip={NodeListComponent._Tooltips[block] || ""} />;
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
