/* eslint-disable @typescript-eslint/naming-convention */
import { type FunctionComponent, useEffect } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";

import { NodeLedger } from "shared-ui-components/nodeGraphSystem/nodeLedger";
import { Accordion, AccordionSection, AccordionSectionItem } from "shared-ui-components/fluent/primitives/accordion";

import { type GlobalState } from "../../globalState";
import { AllFlowGraphBlocks } from "../../allBlockNames";
import { GetBlockType, BlockTypeHeaderColor } from "../../graphSystem/blockTypeColors";
import { GetTemplatesByCategory, AllCompositeTemplates } from "../../compositeTemplates";
import { DraggableLine } from "../common/draggableLine";

interface INodeListComponentProps {
    globalState: GlobalState;
}

/**
 * Tooltip descriptions keyed by block class name.
 *
 * NOTE: This map is generated from the legacy implementation; new blocks should add their
 * tooltip here so the palette surfaces a useful description.
 */
const Tooltips: Record<string, string> = {
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

    // Physics Events
    FlowGraphPhysicsCollisionEventBlock: "Fires when a physics collision occurs on a body",

    // Physics Actions
    FlowGraphApplyForceBlock: "Applies a force to a physics body at a location",
    FlowGraphApplyImpulseBlock: "Applies an instantaneous impulse to a physics body",
    FlowGraphSetLinearVelocityBlock: "Sets the linear velocity of a physics body",
    FlowGraphSetAngularVelocityBlock: "Sets the angular velocity of a physics body",
    FlowGraphSetPhysicsMotionTypeBlock: "Sets the motion type (static/animated/dynamic)",

    // Physics Data
    FlowGraphGetLinearVelocityBlock: "Gets the linear velocity of a physics body",
    FlowGraphGetAngularVelocityBlock: "Gets the angular velocity of a physics body",
    FlowGraphGetPhysicsMassPropertiesBlock: "Gets mass, center of mass, and inertia",

    // Audio Actions
    FlowGraphPlaySoundBlock: "Plays an Audio V2 sound with volume, offset, and loop options",
    FlowGraphStopSoundBlock: "Stops an Audio V2 sound",
    FlowGraphPauseSoundBlock: "Pauses or resumes an Audio V2 sound",
    FlowGraphSetSoundVolumeBlock: "Sets the volume of an Audio V2 sound",

    // Audio Events
    FlowGraphSoundEndedEventBlock: "Fires when an Audio V2 sound stops or ends (including manual stop)",

    // Audio Data
    FlowGraphGetSoundVolumeBlock: "Gets the current volume of an Audio V2 sound",
    FlowGraphIsSoundPlayingBlock: "Checks whether an Audio V2 sound is currently playing",

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
    FlowGraphExpBlock: "Exponential function",
    FlowGraphLogBlock: "Natural logarithm",
    FlowGraphLog2Block: "Base-2 logarithm",
    FlowGraphLog10Block: "Base-10 logarithm",
    FlowGraphSqrtBlock: "Square root",
    FlowGraphCubeRootBlock: "Cube root",
    FlowGraphPowerBlock: "Power",

    // Math Trigonometry
    FlowGraphSinBlock: "Sine",
    FlowGraphCosBlock: "Cosine",
    FlowGraphTanBlock: "Tangent",
    FlowGraphAsinBlock: "Inverse sine",
    FlowGraphAcosBlock: "Inverse cosine",
    FlowGraphAtanBlock: "Inverse tangent",
    FlowGraphAtan2Block: "Inverse tangent of two values",
    FlowGraphSinhBlock: "Hyperbolic sine",
    FlowGraphCoshBlock: "Hyperbolic cosine",
    FlowGraphTanhBlock: "Hyperbolic tangent",
    FlowGraphAsinhBlock: "Inverse hyperbolic sine",
    FlowGraphAcoshBlock: "Inverse hyperbolic cosine",
    FlowGraphAtanhBlock: "Inverse hyperbolic tangent",

    // Math Comparison
    FlowGraphEqualityBlock: "Equality comparison",
    FlowGraphLessThanBlock: "Less than comparison",
    FlowGraphLessThanOrEqualBlock: "Less than or equal comparison",
    FlowGraphGreaterThanBlock: "Greater than comparison",
    FlowGraphGreaterThanOrEqualBlock: "Greater than or equal comparison",
    FlowGraphIsValidBlock: "Checks if a value is valid (not null/undefined/NaN/Infinity)",
    FlowGraphIsNaNBlock: "Checks if a value is NaN",
    FlowGraphIsInfBlock: "Checks if a value is Infinity",

    // Math Bitwise
    FlowGraphBitwiseAndBlock: "Bitwise AND",
    FlowGraphBitwiseOrBlock: "Bitwise OR",
    FlowGraphBitwiseXorBlock: "Bitwise XOR",
    FlowGraphBitwiseNotBlock: "Bitwise NOT",
    FlowGraphBitwiseLeftShiftBlock: "Bitwise left shift",
    FlowGraphBitwiseRightShiftBlock: "Bitwise right shift",
    FlowGraphCountLeadingZerosBlock: "Counts leading zeros",
    FlowGraphCountTrailingZerosBlock: "Counts trailing zeros",
    FlowGraphLeadingOnesBlock: "Counts leading ones",
    FlowGraphTrailingOnesBlock: "Counts trailing ones",

    // Math Rounding
    FlowGraphRoundBlock: "Rounds to nearest integer",
    FlowGraphFloorBlock: "Floor",
    FlowGraphCeilBlock: "Ceiling",
    FlowGraphTruncBlock: "Truncates fractional part",
    FlowGraphFractBlock: "Fractional part",
    FlowGraphSaturateBlock: "Clamps a value to [0, 1]",
    FlowGraphClampBlock: "Clamps a value between min and max",
    FlowGraphInterpolateBlock: "Linear interpolation",

    // Vector / Quaternion
    FlowGraphLengthBlock: "Vector length",
    FlowGraphLengthSquaredBlock: "Vector length squared",
    FlowGraphNormalizeBlock: "Normalizes a vector",
    FlowGraphDotBlock: "Dot product",
    FlowGraphCrossBlock: "Cross product",
    FlowGraphRotate2DBlock: "Rotates a 2D vector",
    FlowGraphRotate3DBlock: "Rotates a 3D vector",
    FlowGraphTransposeBlock: "Transposes a matrix",
    FlowGraphDeterminantBlock: "Matrix determinant",
    FlowGraphInverseBlock: "Inverts a matrix or quaternion",
    FlowGraphMatMulBlock: "Matrix multiplication",
    FlowGraphTransformBlock: "Transforms a vector by a matrix",
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

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: tokens.colorNeutralBackground1,
    },
});

const FormatCategoryName = (raw: string): string => raw.replace("__", ": ").replace(/_/g, " ");

const TemplateCategoryColor = "#8854d0";

/**
 * Left-panel block list with built-in filtering and pinning, powered by `Accordion`.
 *
 * Rebuilt on top of `shared-ui-components/fluent/primitives/accordion`. Each block category
 * is an `AccordionSection`; each block (or composite template) is registered as an
 * `AccordionSectionItem` so the accordion's search box filters across all categories at once
 * and individual blocks can be pinned to the top via the built-in pin UI.
 * @returns The rendered node list panel.
 */
export const NodeListComponent: FunctionComponent<INodeListComponentProps> = ({ globalState }) => {
    const classes = useStyles();

    // Register every block name with the NodeLedger so the canvas can format display names
    // consistently. (This was previously done inline inside the legacy render method.)
    useEffect(() => {
        const ledger = NodeLedger.RegisteredNodeNames;
        for (const cat in AllFlowGraphBlocks) {
            const blocks = AllFlowGraphBlocks[cat] as string[];
            for (const block of blocks) {
                if (!ledger.includes(block)) {
                    ledger.push(block);
                }
            }
        }
        NodeLedger.NameFormatter = (name) => {
            let finalName = name;
            if (finalName.startsWith("FlowGraph")) {
                finalName = finalName.substring(9);
            }
            if (finalName.endsWith("Block")) {
                finalName = finalName.substring(0, finalName.length - 5);
            }
            return finalName;
        };
    }, []);

    // The Accordion does not currently expose a re-render trigger, but the editor fires
    // `onResetRequiredObservable` to nudge the panel in case future block additions need
    // a refresh.  Keep the subscription so the palette re-renders if the observable fires.
    useEffect(() => {
        const obs = globalState.onResetRequiredObservable.add(() => {
            // No-op: AllFlowGraphBlocks is module-level and stable; reset just refreshes derived state.
        });
        return () => {
            obs?.remove();
        };
    }, [globalState]);

    const blockSections: { title: string; items: { name: string; tooltip: string; color: string }[] }[] = [];
    for (const category of Object.keys(AllFlowGraphBlocks)) {
        const items = (AllFlowGraphBlocks[category] as string[])
            .slice()
            .sort((a, b) => a.localeCompare(b))
            .map((blockName) => {
                const blockType = GetBlockType(blockName);
                return {
                    name: blockName,
                    tooltip: Tooltips[blockName] ?? "",
                    color: BlockTypeHeaderColor[blockType],
                };
            });
        if (items.length > 0) {
            blockSections.push({ title: FormatCategoryName(category), items });
        }
    }

    const templateCategories = GetTemplatesByCategory();
    const templateSections: { title: string; items: { name: string; tooltip: string; color: string }[] }[] = [];
    for (const categoryName of Object.keys(templateCategories)) {
        const items = templateCategories[categoryName].map((name: string) => {
            const template = AllCompositeTemplates[name];
            return { name, tooltip: template.description, color: TemplateCategoryColor };
        });
        if (items.length > 0) {
            templateSections.push({ title: `Templates: ${categoryName}`, items });
        }
    }

    return (
        <div className={classes.root}>
            <Accordion uniqueId="FlowGraphNodeList" enableSearchItems enablePinnedItems>
                {[...blockSections, ...templateSections].map((section) => (
                    <AccordionSection key={section.title} title={section.title} collapseByDefault={false}>
                        {section.items.map((item) => (
                            <AccordionSectionItem key={item.name} uniqueId={item.name} label={item.name}>
                                <DraggableLine data={item.name} tooltip={item.tooltip} color={item.color} />
                            </AccordionSectionItem>
                        ))}
                    </AccordionSection>
                ))}
            </Accordion>
        </div>
    );
};
