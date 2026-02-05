import type { FunctionComponent } from "react";

import type { GradientBlock, InputBlock, NodeMaterial } from "core/index";

import { makeStyles, Subtitle2, tokens } from "@fluentui/react-components";
import { EditRegular } from "@fluentui/react-icons";
import { Fragment, useCallback } from "react";

import { GradientBlockColorStep } from "core/Materials/Node/Blocks/gradientBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { Color3 } from "core/Maths/math.color";
import { Color3Gradient } from "core/Misc/gradients";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Color3GradientList } from "shared-ui-components/fluent/hoc/gradientList";
import { Color3PropertyLine, Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Vector2PropertyLine, Vector3PropertyLine, Vector4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { GroupBy } from "../../../misc/arrayUtils";
import { BoundProperty } from "../boundProperty";

const useStyles = makeStyles({
    subsection: {
        marginTop: tokens.spacingVerticalM,
    },
});

export const NodeMaterialGeneralProperties: FunctionComponent<{ material: NodeMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Ignore Alpha" target={material} propertyKey="ignoreAlpha" />
            <ButtonLine
                label="Edit"
                icon={EditRegular}
                onClick={async () => {
                    // TODO: Figure out how to get all the various build steps to work with this.
                    //       See the initial attempt here: https://github.com/BabylonJS/Babylon.js/pull/17646
                    // const { NodeEditor } = await import("node-editor/nodeEditor");
                    // NodeEditor.Show({ nodeMaterial: material });
                    await material.edit({ nodeEditorConfig: { backgroundColor: material.getScene().clearColor } });
                }}
            ></ButtonLine>
        </>
    );
};

// A modified InputBlock type where the value is `NonNullable<unknown>` instead of `any` so it works correctly with BoundProperty.
type SafeInputBlock = Omit<InputBlock, "value"> & { value: NonNullable<unknown> };

const InputBlockPropertyLine: FunctionComponent<{ block: SafeInputBlock }> = (props) => {
    const { block } = props;

    // We need to re-evaluate this outer component when type/isBoolean/min/max change since that determines what type of property line we render.
    const type = useProperty(block, "type");
    const isBoolean = useProperty(block, "isBoolean");
    const min = useProperty(block, "min");
    const max = useProperty(block, "max");

    const commonProps = {
        label: block.name,
        target: block,
        propertyKey: "value",
    } as const;

    if (type === NodeMaterialBlockConnectionPointTypes.Float) {
        if (isBoolean) {
            return <BoundProperty key={`${block.uniqueId} (Switch)`} component={SwitchPropertyLine} {...commonProps} />;
        } else {
            const hasMinMax = !isNaN(min) && !isNaN(max) && min !== max;
            if (hasMinMax) {
                return <BoundProperty key={`${block.uniqueId} (Slider)`} component={SyncedSliderPropertyLine} {...commonProps} min={min} max={max} step={(max - min) / 100.0} />;
            } else {
                return <BoundProperty key={`${block.uniqueId} (Number)`} component={NumberInputPropertyLine} {...commonProps} />;
            }
        }
    } else if (type === NodeMaterialBlockConnectionPointTypes.Color3) {
        return <BoundProperty key={`${block.uniqueId} (Color3)`} component={Color3PropertyLine} {...commonProps} />;
    } else if (type === NodeMaterialBlockConnectionPointTypes.Color4) {
        return <BoundProperty key={`${block.uniqueId} (Color4)`} component={Color4PropertyLine} {...commonProps} />;
    } else if (type === NodeMaterialBlockConnectionPointTypes.Vector2) {
        return <BoundProperty key={`${block.uniqueId} (Vector2)`} component={Vector2PropertyLine} {...commonProps} />;
    } else if (type === NodeMaterialBlockConnectionPointTypes.Vector3) {
        return <BoundProperty key={`${block.uniqueId} (Vector3)`} component={Vector3PropertyLine} {...commonProps} />;
    } else if (type === NodeMaterialBlockConnectionPointTypes.Vector4) {
        return <BoundProperty key={`${block.uniqueId} (Vector4)`} component={Vector4PropertyLine} {...commonProps} />;
    } else {
        return null;
    }
};

const GradientBlockPropertyLine: FunctionComponent<{ material: NodeMaterial; block: GradientBlock }> = (props) => {
    const { material, block } = props;

    const gradients = useObservableState(
        useCallback(() => block.colorSteps.map((step) => new Color3Gradient(step.step, step.color)), [block.colorSteps]),
        block.onValueChangedObservable
    );

    return (
        <Color3GradientList
            label="step"
            gradients={gradients}
            addGradient={(gradient) => {
                block.colorSteps.push(gradient ? new GradientBlockColorStep(gradient.gradient, gradient.color) : new GradientBlockColorStep(1.0, Color3.White()));
                block.colorStepsUpdated();
                material.build();
            }}
            removeGradient={(_, index) => {
                block.colorSteps.splice(index, 1);
                block.colorStepsUpdated();
                material.build();
            }}
            onChange={(gradient, index) => {
                block.colorSteps[index].step = gradient.gradient;
                block.colorSteps[index].color = gradient.color;
                block.colorStepsUpdated();
                material.build();
            }}
        />
    );
};

export const NodeMaterialInputProperties: FunctionComponent<{ material: NodeMaterial }> = (props) => {
    const { material } = props;

    const classes = useStyles();

    const inputBlocks = useObservableState(
        useCallback(() => {
            const inspectorVisibleInputBlocks = material
                .getInputBlocks()
                .filter((block) => block.visibleInInspector)
                .map((block) => block as SafeInputBlock);
            const groupedInputBlocks = GroupBy(inspectorVisibleInputBlocks, (block) => block.groupInInspector);
            return groupedInputBlocks.sort((a, b) => a.key.localeCompare(b.key));
        }, [material]),
        material.onBuildObservable,
        material.onBuildErrorObservable
    );

    const gradientBlocks = useObservableState(
        useCallback(
            () => material.attachedBlocks.filter((block) => block.visibleInInspector && block.getClassName() === "GradientBlock").map((block) => block as GradientBlock),
            [material]
        ),
        material.onBuildObservable,
        material.onBuildErrorObservable
    );

    return (
        <>
            {inputBlocks.length === 0 && gradientBlocks.length === 0 ? (
                <MessageBar
                    key="no-visible-input-blocks"
                    intent="info"
                    title="No Visible Input Blocks"
                    message="To see input blocks, mark them as visibleInInspector."
                    docLink="https://doc.babylonjs.com/features/featuresDeepDive/materials/node_material/nodeMaterial/#adding-blocks"
                />
            ) : (
                <>
                    {inputBlocks.map((group) => (
                        <Fragment key={`${group.key || "default"} (Group)`}>
                            {group.key && <Subtitle2 className={classes.subsection}>{group.key}</Subtitle2>}
                            {group.items.map((block) => (
                                <InputBlockPropertyLine key={block.uniqueId} block={block} />
                            ))}
                        </Fragment>
                    ))}
                    {gradientBlocks.map((block) => (
                        <Fragment key={`${block.uniqueId} (Gradient)`}>
                            <Subtitle2 className={classes.subsection}>{block.name}</Subtitle2>
                            <GradientBlockPropertyLine material={material} block={block} />
                        </Fragment>
                    ))}
                </>
            )}
        </>
    );
};
