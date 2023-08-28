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
        BoxBlock: "Create a box geometry",
        PlaneBlock: "Create a plane geometry",
        SphereBlock: "Create a sphere geometry",
        TorusBlock: "Create a torus geometry",
        CylinderBlock: "Create a cylinder geometry",
        CapsuleBlock: "Create a capsule geometry",
        DiscBlock: "Create a disc geometry",
        IcoSphereBlock: "Create an icosphere geometry",
        MeshBlock: "Generate a geometry from a mesh",
        GridBlock: "Generate a grid geometry",
        Float: "Input block set to a float value",
        Vector2: "Input block set to a Vector2 value",
        Vector3: "Input block set to a Vector3 value",
        Vector4: "Input block set to a Vector4 value",
        Int: "Input block set to a integer value",
        PositionsBlock: "Contextual value pointing at the positions array of the active geometry",
        NormalsBlock: "Contextual value pointing at the normals array of the active geometry",
        ColorsBlock: "Contextual value pointing at the colors array of the active geometry",
        TangentsBlock: "Contextual value pointing at the tangents array of the active geometry",
        UV1sBlock: "Contextual value pointing at the uvs array of the active geometry",
        UV2sBlock: "Contextual value pointing at the uvs2 array of the active geometry",
        UV3sBlock: "Contextual value pointing at the uvs3 array of the active geometry",
        UV4sBlock: "Contextual value pointing at the uvs4 array of the active geometry",
        UV5sBlock: "Contextual value pointing at the uvs5 array of the active geometry",
        UV6sBlock: "Contextual value pointing at the uvs6 array of the active geometry",
        VertexIDBlock: "Contextual value representing the vertex index of the current vertex of the active geometry",
        FaceIDBlock: "Contextual value representing the face index of the current face of the active geometry",
        LoopIDBlock: "Contextual value representing the current loop index (within a clone or an instantiate block)",
        GeometryIDBlock: "Contextual value representing the identifier of the current active geometry",
        CollectionIDBlock: "Contextual value representing the collection ID associated with the current active geometry",
        EqualBlock: "Conditional block set to Equal",
        NotEqualBlock: "Conditional block set to NotEqual",
        LessThanBlock: "Conditional block set to LessThan",
        LessOrEqualBlock: "Conditional block set to LessOrEqual",
        GreaterThanBlock: "Conditional block set to GreaterThan",
        GreaterOrEqualBlock: "Conditional block set to GreaterOrEqual",
        XorBlock: "Conditional block set to Xor",
        OrBlock: "Conditional block set to Or",
        AndBlock: "Conditional block set to And",
        AddBlock: "Math block set to Add",
        DivideBlock: "Math block set to Divide",
        MaxBlock: "Math block set to Max",
        MinBlock: "Math block set to Min",
        MultiplyBlock: "Math block set to Multiply",
        NegateBlock: "Math block set to Negate",
        OneMinusBlock: "Trigonometry block set to One Minus",
        ReciprocalBlock: "Trigonometry block set to Reciprocal",
        SignBlock: "Trigonometry block set to Sign",
        SqrtBlock: "Trigonometry block set to Square Root",
        SubtractBlock: "Math block set to Subtract",
        MapRangeBlock: "Map range block used to change the range of a value",
        RoundBlock: "Trigonometry block set to Round",
        FloorBlock: "Trigonometry block set to Floor",
        CeilingBlock: "Trigonometry block set to Ceiling",
        IntFloatConverterBlock: "Block used to convert from Int to Float or Float to Int",
        AbsBlock: "Trigonometry block set to Abs",
        ArcCosBlock: "Trigonometry block set to Arc cos",
        ArcSinBlock: "Trigonometry block set to Arc sin",
        ArcTanBlock: "Trigonometry block set to Arc tan",
        CosBlock: "Trigonometry block set to Cos",
        ExpBlock: "Trigonometry block set to Exp",
        LogBlock: "Trigonometry block set to Log",
        SinBlock: "Trigonometry block set to Sin",
        TanBlock: "Trigonometry block set to Tan",
        ToDegreesBlock: "Conversion block used to convert radians to degree",
        ToRadiansBlock: "Conversion block used to convert degrees to radians",
        TransformBlock: "Apply a transform to a geometry or a vector",
        VectorConverterBlock: "Convert to and from any type of value (scalar or vector)",
        NormalizeBlock: "Normalize a vector",
        RotationXBlock: "Create a rotation matrix around X axis",
        RotationYBlock: "Create a rotation matrix around Y axis",
        RotationZBlock: "Create a rotation matrix around Z axis",
        ScalingBlock: "Create a scaling matrix",
        TranslationBlock: "Create a translation matrix",
        AlignBlock: "Create a rotation matrix used to align two vectors",
        InstantiateOnVerticesBlock: "Instantiate a geometry on every vertex of a target geometry",
        InstantiateOnFacesBlock: "Instantiate a geometry on the faces of a target geometry",
        InstantiateOnVolumeBlock: "Instantiate a geometry inside a target geometry",
        InstantiateBlock: "Instantiate a geometry with a loop count",
        ElbowBlock: "Passthrough block mostly used to organize your graph",
        TeleportInBlock: "Passthrough block mostly used to organize your graph (but without visible lines). It works like a teleportation point for the graph.",
        TeleportOutBlock: "Endpoint for a TeleportInBlock.",
        DebugBlock: "Passthrough block used to capture values and display them for debugging purposes",
        SetColorsBlock: "Block used to update the colors attribute of a geometry",
        SetNormalsBlock: "Block used to update the normals attribute of a geometry",
        SetPositionsBlock: "Block used to update the positions attribute of a geometry",
        SetTangentsBlock: "Block used to update the tangents attribute of a geometry",
        SetUVsBlock: "Block used to update one of the uvs attribute of a geometry",
        SetMaterialIDBlock: "Block used to associate a material ID with a geometry",
        MergeBlock: "Block used to merge up to 5 geometries",
        computeNormalsBlock: "Block used to compute the normals of a geometry",
        RandomBlock: "Block used to generate a random value within a range",
        NoiseBlock: "Generate a value using Perlin noise algorithm",
        GeometryOutputBlock: "Output block used to gather the final geometry",
        NullBlock: "Generate an empty geometry",
        OptimizeBlock: "Eliminate vertices that share positions with another vertex",
        GeometryInfoBlock: "Provides information about a geometry",
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

    componentWillUnmount() {
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

    render() {
        const customFrameNames: string[] = [];
        for (const frame in this._customFrameList) {
            customFrameNames.push(frame);
        }

        // Block types used to create the menu from
        const allBlocks: any = {
            Custom_Frames: customFrameNames,
            Sources: ["BoxBlock", "PlaneBlock", "SphereBlock", "TorusBlock", "CylinderBlock", "CapsuleBlock", "DiscBlock", "IcoSphereBlock", "MeshBlock", "GridBlock", "NullBlock"],
            Inputs: ["Float", "Vector2", "Vector3", "Vector4", "Int"],
            Contextual: [
                "PositionsBlock",
                "NormalsBlock",
                "ColorsBlock",
                "TangentsBlock",
                "UV1sBlock",
                "UV2sBlock",
                "UV3sBlock",
                "UV4sBlock",
                "UV5sBlock",
                "UV6sBlock",
                "VertexIDBlock",
                "FaceIDBlock",
                "LoopIDBlock",
                "GeometryIDBlock",
                "CollectionIDBlock",
            ],
            Logical: ["EqualBlock", "NotEqualBlock", "LessThanBlock", "LessOrEqualBlock", "GreaterThanBlock", "GreaterOrEqualBlock", "XorBlock", "OrBlock", "AndBlock"],
            Math__Standard: [
                "AddBlock",
                "DivideBlock",
                "MaxBlock",
                "MinBlock",
                "MultiplyBlock",
                "NegateBlock",
                "OneMinusBlock",
                "ReciprocalBlock",
                "SignBlock",
                "SqrtBlock",
                "SubtractBlock",
                "MapRangeBlock",
                "RoundBlock",
                "FloorBlock",
                "CeilingBlock",
                "IntFloatConverterBlock",
            ],
            Math__Scientific: [
                "AbsBlock",
                "ArcCosBlock",
                "ArcSinBlock",
                "ArcTanBlock",
                "CosBlock",
                "ExpBlock",
                "LogBlock",
                "SinBlock",
                "TanBlock",
                "ToDegreesBlock",
                "ToRadiansBlock",
            ],
            Math__Vector: ["TransformBlock", "VectorConverterBlock", "NormalizeBlock"],
            Matrices: ["RotationXBlock", "RotationYBlock", "RotationZBlock", "ScalingBlock", "TranslationBlock", "AlignBlock"],
            Instances: ["InstantiateOnVerticesBlock", "InstantiateOnFacesBlock", "InstantiateOnVolumeBlock", "InstantiateBlock"],
            Misc: ["ElbowBlock", "DebugBlock", "TeleportInBlock", "TeleportOutBlock", "GeometryInfoBlock"],
            Updates: [
                "SetColorsBlock",
                "SetNormalsBlock",
                "SetPositionsBlock",
                "SetTangentsBlock",
                "SetUVsBlock",
                "SetMaterialIDBlock",
                "MergeBlock",
                "CollectionBlock",
                "ComputeNormalsBlock",
                "OptimizeBlock",
            ],
            Noises: ["RandomBlock", "NoiseBlock"],
            Output_Nodes: ["GeometryOutputBlock"],
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
                            ledger.push(...blocks);
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
            <div id="nodeList">
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
