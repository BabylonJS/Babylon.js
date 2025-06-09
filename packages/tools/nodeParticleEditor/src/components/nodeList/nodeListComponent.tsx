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
        Color4: "Input block set to a Color4 value",
        Int: "Input block set to a integer value",
        TextureBlock: "Provide a texture",
        BoxEmitterBlock: "Emit particles from a box shape",
        SphereEmitterBlock: "Emit particles from a sphere shape",
        PointEmitterBlock: "Emit particles from a point",
        CustomEmitterBlock: "Emit particles from a custom position",
        RandomRangeBlock: "Generate a random value between two inputs",
        UpdateDirectionBlock: "Update the direction of a particle",
        UpdatePositionBlock: "Update the position of a particle",
        UpdateColorBlock: "Update the color of a particle",
        UpdateScaleBlock: "Update the scale of a particle",
        UpdateAngleBlock: "Update the angle of a particle",
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
        AngleBlock: "Contextual block to get the angle of a particle",
        LifetimeBlock: "Contextual block to get the lifetime of a particle",
        ScaleBlock: "Contextual block to get the scale of a particle",
        AgeGradientBlock: "Contextual block to get the age gradient of a particle ie. the age divided by the lifetime",
        LerpBlock: "Interpolate between two values",
        GradientEntryBlock: "A gradient entry block used to define a value at a specific age",
        GradientBlock: "A gradient block used to define a gradient of values over the lifetime of a particle",
        ConverterBlock: "Convert between different types of values, such as Color4, Vector2, Vector3, and Float",
        FractBlock: "Outputs only the fractional value of a floating point number",
        AbsBlock: "Trigonometry block set to Abs",
        ArcCosBlock: "Trigonometry block set to Arc cos (using radians)",
        ArcSinBlock: "Trigonometry block set to Arc sin (using radians)",
        ArcTanBlock: "Trigonometry block set to Arc tan (using radians)",
        ArcTan2Block: "Trigonometry block set to Arc tan2 (using radians)",
        CosBlock: "Trigonometry block set to Cos (using radians)",
        ExpBlock: "Trigonometry block set to Exp (using radians)",
        Exp2Block: "Trigonometry block set to Exp2 (using radians)",
        LogBlock: "Trigonometry block set to Log (using radians)",
        SinBlock: "Trigonometry block set to Sin (using radians)",
        TanBlock: "Trigonometry block set to Tan (using radians)",
        ToDegreesBlock: "Conversion block used to convert radians to degree",
        ToRadiansBlock: "Conversion block used to convert degrees to radians",
        NegateBlock: "Math block set to Negate",
        OneMinusBlock: "Trigonometry block set to One Minus",
        ReciprocalBlock: "Trigonometry block set to Reciprocal",
        SignBlock: "Trigonometry block set to Sign",
        SqrtBlock: "Trigonometry block set to Square Root",
        RoundBlock: "Trigonometry block set to Round",
        FloorBlock: "Trigonometry block set to Floor",
        CeilingBlock: "Trigonometry block set to Ceiling",
        RandomBlock: "Generate a random value",
        DebugBlock: "Debug block used to output values of connection ports",
        ElbowBlock: "Passthrough block mostly used to organize your graph",
        TeleportInBlock: "Passthrough block mostly used to organize your graph (but without visible lines). It works like a teleportation point for the graph.",
        TeleportOutBlock: "Endpoint for a TeleportInBlock.",
        TimeBlock: "Block used to get the current time in ms",
        DeltaBlock: "Block used to get the delta value for animations",
        BasicUpdateBlock: "Block used to update the position of a particle with a basic update (eg. direction * delta)",
        BasicConditionBlock: "Block used to compare two values and return a value based on the comparison (1 or 0)",
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
            Emitters: ["BoxEmitterBlock", "SphereEmitterBlock", "PointEmitterBlock", "CustomEmitterBlock"],
            Inputs: ["Float", "Vector2", "Vector3", "Int", "TextureBlock", "Color4"],
            Updates: ["UpdateDirectionBlock", "UpdatePositionBlock", "UpdateColorBlock", "UpdateScaleBlock", "UpdateAngleBlock", "BasicUpdateBlock"],
            Conditions: ["BasicConditionBlock"],
            Math__Standard: [
                "AddBlock",
                "DivideBlock",
                "MaxBlock",
                "MinBlock",
                "MultiplyBlock",
                "SubtractBlock",
                "NegateBlock",
                "OneMinusBlock",
                "ReciprocalBlock",
                "SignBlock",
                "SqrtBlock",
                "RoundBlock",
                "FloorBlock",
                "CeilingBlock",
            ],
            Math__Scientific: [
                "AbsBlock",
                "ArcCosBlock",
                "ArcSinBlock",
                "ArcTanBlock",
                // "ArcTan2Block",
                "CosBlock",
                "ExpBlock",
                "Exp2Block",
                "LogBlock",
                "SinBlock",
                "TanBlock",
                "ToDegreesBlock",
                "ToRadiansBlock",
                "FractBlock",
            ],
            Interpolation: ["LerpBlock", "GradientEntryBlock", "GradientBlock"],
            Misc: ["RandomRangeBlock", "ConverterBlock", "RandomBlock", "DebugBlock", "ElbowBlock", "TeleportInBlock", "TeleportOutBlock"],
            System_Nodes: ["SystemBlock", "TimeBlock", "DeltaBlock"],
            Contextual: ["PositionBlock", "DirectionBlock", "ScaledDirectionBlock", "ColorBlock", "AgeBlock", "LifetimeBlock", "ScaleBlock", "AgeGradientBlock", "AngleBlock"],
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
