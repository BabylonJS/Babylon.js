/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { DraggableLineComponent } from "../../sharedComponents/draggableLineComponent";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { NodeLedger } from "shared-ui-components/nodeGraphSystem/nodeLedger";
import { AllFlowGraphBlocks } from "../../allBlockNames";
import { GetBlockType, BlockTypeHeaderColor } from "../../graphSystem/blockTypeColors";

import "./nodeList.scss";

/** Props for the NodeListComponent. */
interface INodeListComponentProps {
    globalState: GlobalState;
}

/**
 * Left-panel block list with filter/search for the Flow Graph Editor.
 */
export class NodeListComponent extends React.Component<INodeListComponentProps, { filter: string }> {
    /** Observer for the reset event. */
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    /** Ref for the filter input element, used to restore focus after clearing. */
    private _inputRef = React.createRef<HTMLInputElement>();

    /** Tooltip descriptions keyed by block class name. */
    private static _Tooltips: { [key: string]: string } = {
        // Events
        FlowGraphSceneReadyEventBlock: "Triggered when the scene is ready",
        FlowGraphSceneTickEventBlock: "Triggered every frame",
        FlowGraphMeshPickEventBlock: "Triggered when a mesh is picked",
        FlowGraphPointerEventBlock: "Triggered on pointer events",
        FlowGraphPointerDownEventBlock: "Triggered on pointer down",
        FlowGraphPointerUpEventBlock: "Triggered on pointer up",
        FlowGraphPointerMoveEventBlock: "Triggered on pointer move",
        FlowGraphPointerOverEventBlock: "Triggered on pointer over",
        FlowGraphPointerOutEventBlock: "Triggered on pointer out",
        FlowGraphReceiveCustomEventBlock: "Triggered when a custom event is received",
        FlowGraphSendCustomEventBlock: "Sends a custom event",

        // Control Flow
        FlowGraphBranchBlock: "Branches execution based on a condition",
        FlowGraphForLoopBlock: "Loops over a range of values",
        FlowGraphWhileLoopBlock: "Loops while a condition is true",
        FlowGraphSwitchBlock: "Switches between outputs based on a value",
        FlowGraphSequenceBlock: "Executes outputs in sequence",
        FlowGraphMultiGateBlock: "Executes one of multiple outputs",
        FlowGraphFlipFlopBlock: "Alternates between two outputs",
        FlowGraphDoNBlock: "Executes N times then stops",
        FlowGraphWaitAllBlock: "Waits for all inputs to fire",
        FlowGraphSetDelayBlock: "Delays execution",
        FlowGraphCancelDelayBlock: "Cancels a pending delay",
        FlowGraphCallCounterBlock: "Counts how many times it was called",
        FlowGraphDebounceBlock: "Debounces execution",
        FlowGraphThrottleBlock: "Throttles execution",

        // Animation
        FlowGraphPlayAnimationBlock: "Plays an animation",
        FlowGraphStopAnimationBlock: "Stops an animation",
        FlowGraphPauseAnimationBlock: "Pauses an animation",
        FlowGraphInterpolationBlock: "Interpolates a value over time",

        // Math Constants
        FlowGraphEBlock: "Euler's number (e)",
        FlowGraphPIBlock: "Pi constant",
        FlowGraphInfBlock: "Infinity constant",
        FlowGraphNaNBlock: "NaN constant",
        FlowGraphRandomBlock: "Random number generator",

        // Math Arithmetic
        FlowGraphAddBlock: "Adds two values",
        FlowGraphSubtractBlock: "Subtracts two values",
        FlowGraphMultiplyBlock: "Multiplies two values",
        FlowGraphDivideBlock: "Divides two values",
        FlowGraphModuloBlock: "Modulo operation",
        FlowGraphNegationBlock: "Negates a value",
        FlowGraphAbsBlock: "Absolute value",
        FlowGraphSignBlock: "Sign of a value",
        FlowGraphMinBlock: "Minimum of two values",
        FlowGraphMaxBlock: "Maximum of two values",
        FlowGraphClampBlock: "Clamps a value between min and max",
        FlowGraphSaturateBlock: "Clamps a value between 0 and 1",
        FlowGraphMathInterpolationBlock: "Linearly interpolates between two values",
        FlowGraphPowerBlock: "Raises a value to a power",
        FlowGraphSquareRootBlock: "Square root",
        FlowGraphCubeRootBlock: "Cube root",

        // Math Rounding
        FlowGraphFloorBlock: "Rounds down",
        FlowGraphCeilBlock: "Rounds up",
        FlowGraphRoundBlock: "Rounds to nearest",
        FlowGraphTruncBlock: "Truncates to integer",
        FlowGraphFractBlock: "Fractional part",

        // Math Trigonometry
        FlowGraphSinBlock: "Sine",
        FlowGraphCosBlock: "Cosine",
        FlowGraphTanBlock: "Tangent",
        FlowGraphASinBlock: "Arc sine",
        FlowGraphACosBlock: "Arc cosine",
        FlowGraphATanBlock: "Arc tangent",
        FlowGraphATan2Block: "Arc tangent 2",
        FlowGraphSinhBlock: "Hyperbolic sine",
        FlowGraphCoshBlock: "Hyperbolic cosine",
        FlowGraphTanhBlock: "Hyperbolic tangent",
        FlowGraphASinhBlock: "Hyperbolic arc sine",
        FlowGraphACoshBlock: "Hyperbolic arc cosine",
        FlowGraphATanhBlock: "Hyperbolic arc tangent",
        FlowGraphDegToRadBlock: "Degrees to radians",
        FlowGraphRadToDegBlock: "Radians to degrees",

        // Math Logarithmic
        FlowGraphExponentialBlock: "Exponential (e^x)",
        FlowGraphLogBlock: "Natural logarithm",
        FlowGraphLog2Block: "Base-2 logarithm",
        FlowGraphLog10Block: "Base-10 logarithm",

        // Math Comparison
        FlowGraphEqualityBlock: "Tests equality",
        FlowGraphLessThanBlock: "Less than comparison",
        FlowGraphLessThanOrEqualBlock: "Less than or equal comparison",
        FlowGraphGreaterThanBlock: "Greater than comparison",
        FlowGraphGreaterThanOrEqualBlock: "Greater than or equal comparison",
        FlowGraphIsNaNBlock: "Tests if NaN",
        FlowGraphIsInfBlock: "Tests if Infinity",
        FlowGraphConditionalBlock: "Selects between two values based on a condition",

        // Vector Math
        FlowGraphLengthBlock: "Vector length",
        FlowGraphNormalizeBlock: "Normalizes a vector",
        FlowGraphDotBlock: "Dot product",
        FlowGraphCrossBlock: "Cross product",
        FlowGraphRotate2DBlock: "Rotates a 2D vector",
        FlowGraphRotate3DBlock: "Rotates a 3D vector",

        // Matrix Math
        FlowGraphTransposeBlock: "Transposes a matrix",
        FlowGraphDeterminantBlock: "Determinant of a matrix",
        FlowGraphInvertMatrixBlock: "Inverts a matrix",
        FlowGraphMatrixMultiplicationBlock: "Multiplies two matrices",

        // Bitwise
        FlowGraphBitwiseAndBlock: "Bitwise AND",
        FlowGraphBitwiseOrBlock: "Bitwise OR",
        FlowGraphBitwiseXorBlock: "Bitwise XOR",
        FlowGraphBitwiseNotBlock: "Bitwise NOT",
        FlowGraphBitwiseLeftShiftBlock: "Bitwise left shift",
        FlowGraphBitwiseRightShiftBlock: "Bitwise right shift",
        FlowGraphLeadingZerosBlock: "Count leading zeros",
        FlowGraphTrailingZerosBlock: "Count trailing zeros",
        FlowGraphOneBitsCounterBlock: "Count set bits",

        // Data Conversion
        FlowGraphCombineVector2Block: "Combines components into a Vector2",
        FlowGraphCombineVector3Block: "Combines components into a Vector3",
        FlowGraphCombineVector4Block: "Combines components into a Vector4",
        FlowGraphCombineMatrixBlock: "Combines components into a Matrix",
        FlowGraphCombineMatrix2DBlock: "Combines components into a 2D Matrix",
        FlowGraphCombineMatrix3DBlock: "Combines components into a 3D Matrix",
        FlowGraphExtractVector2Block: "Extracts components from a Vector2",
        FlowGraphExtractVector3Block: "Extracts components from a Vector3",
        FlowGraphExtractVector4Block: "Extracts components from a Vector4",
        FlowGraphExtractMatrixBlock: "Extracts components from a Matrix",
        FlowGraphExtractMatrix2DBlock: "Extracts components from a 2D Matrix",
        FlowGraphExtractMatrix3DBlock: "Extracts components from a 3D Matrix",
        FlowGraphTransformVectorBlock: "Transforms a vector by a matrix",
        FlowGraphTransformCoordinatesBlock: "Transforms coordinates by a matrix",
        FlowGraphTransformCoordinatesSystemBlock: "Transforms a coordinate system",
        FlowGraphConjugateBlock: "Conjugate of a quaternion",
        FlowGraphAngleBetweenBlock: "Angle between two vectors",
        FlowGraphQuaternionFromAxisAngleBlock: "Creates quaternion from axis/angle",
        FlowGraphAxisAngleFromQuaternionBlock: "Extracts axis/angle from quaternion",
        FlowGraphQuaternionFromDirectionsBlock: "Creates quaternion from directions",
        FlowGraphMatrixDecompose: "Decomposes a matrix into components",
        FlowGraphMatrixCompose: "Composes a matrix from components",

        // Type Conversion
        FlowGraphBooleanToFloat: "Converts boolean to float",
        FlowGraphBooleanToInt: "Converts boolean to integer",
        FlowGraphFloatToBoolean: "Converts float to boolean",
        FlowGraphIntToBoolean: "Converts integer to boolean",
        FlowGraphIntToFloat: "Converts integer to float",
        FlowGraphFloatToInt: "Converts float to integer",

        // Data Access
        FlowGraphConstantBlock: "A constant value",
        FlowGraphGetPropertyBlock: "Gets a property from an object",
        FlowGraphSetPropertyBlock: "Sets a property on an object",
        FlowGraphGetVariableBlock: "Gets a context variable",
        FlowGraphSetVariableBlock: "Sets a context variable",
        FlowGraphGetAssetBlock: "Gets an asset by name",
        FlowGraphJsonPointerParserBlock: "Parses a JSON pointer path",
        FlowGraphArrayIndexBlock: "Gets an element from an array",
        FlowGraphIndexOfBlock: "Finds the index of an element",
        FlowGraphDataSwitchBlock: "Selects data based on an index",

        // Utility
        FlowGraphConsoleLogBlock: "Logs a message to the console",
        FlowGraphEasingBlock: "Applies an easing function",
        FlowGraphBezierCurveEasing: "Applies a bezier curve easing",
        FlowGraphContextBlock: "Gets the flow graph context",
        FlowGraphCodeExecutionBlock: "Executes custom code",
        FlowGraphFunctionReference: "Reference to a function flow graph",
        FlowGraphDebugBlock: "Debug passthrough — shows the value flowing through a data connection",
    };

    /**
     * Creates a new NodeListComponent.
     * @param props - component props
     */
    constructor(props: INodeListComponentProps) {
        super(props);

        this.state = { filter: "" };

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    /** Removes the reset observer when the component is unmounted. */
    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    /**
     * Updates the block list filter.
     * @param filter - the new filter string
     */
    filterContent(filter: string) {
        this.setState({ filter: filter });
    }

    /** Clears the current filter and returns focus to the input. */
    clearFilter() {
        this.setState({ filter: "" }, () => this._inputRef.current?.focus());
    }

    /**
     * Renders the node list panel.
     * @returns the rendered JSX
     */
    override render() {
        const allBlocks = AllFlowGraphBlocks;

        // Create node menu
        const blockMenu = [];
        for (const key in allBlocks) {
            const blockList = allBlocks[key]
                .filter((b: string) => !this.state.filter || b.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1)
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((blockName: string) => {
                    const blockType = GetBlockType(blockName);
                    const color = BlockTypeHeaderColor[blockType];
                    return <DraggableLineComponent key={blockName} data={blockName} tooltip={NodeListComponent._Tooltips[blockName] || ""} color={color} />;
                });

            if (blockList.length) {
                blockMenu.push(
                    <LineContainerComponent key={key + " blocks"} title={key.replace("__", ": ").replace("_", " ")} closed={false}>
                        {blockList}
                    </LineContainerComponent>
                );
            }

            // Register blocks
            const ledger = NodeLedger.RegisteredNodeNames;
            for (const cat in allBlocks) {
                const blocks = allBlocks[cat] as string[];
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
                // Remove "FlowGraph" prefix and "Block" suffix for display
                if (finalName.startsWith("FlowGraph")) {
                    finalName = finalName.substring(9);
                }
                if (finalName.endsWith("Block")) {
                    finalName = finalName.substring(0, finalName.length - 5);
                }
                return finalName;
            };
        }

        return (
            <div id="fgeNodeList">
                <div className="panes">
                    <div className="pane">
                        <div className="filter">
                            <input
                                ref={this._inputRef}
                                type="text"
                                placeholder="Filter"
                                value={this.state.filter}
                                onFocus={() => (this.props.globalState.lockObject.lock = true)}
                                onBlur={() => {
                                    this.props.globalState.lockObject.lock = false;
                                }}
                                onChange={(evt) => this.filterContent(evt.target.value)}
                            />
                            <button className={"filter-clear" + (this.state.filter ? " visible" : "")} onClick={() => this.clearFilter()} title="Clear filter">
                                ✕
                            </button>
                        </div>
                        <div className="list-container">{blockMenu}</div>
                    </div>
                </div>
            </div>
        );
    }
}
