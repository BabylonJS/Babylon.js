import type { FunctionComponent } from "react";
import type { ISelectionService } from "../../../services/selectionService";

import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import type { ParticleSystem } from "core/Particles/particleSystem";
import type { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";

import { makeStyles, Subtitle2, tokens } from "@fluentui/react-components";
import { Fragment, useCallback } from "react";

import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Vector2PropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
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

// A modified ParticleInputBlock type where the value is `NonNullable<unknown>` instead of `any` so it works correctly with BoundProperty.
type SafeInputBlock = Omit<ParticleInputBlock, "value"> & { value: NonNullable<unknown> };

const InputBlockPropertyLine: FunctionComponent<{ block: SafeInputBlock }> = (props) => {
    const { block } = props;

    // We need to re-evaluate this outer component when type/min/max change since that determines what type of property line we render.
    const type = useProperty(block, "type");
    const min = useProperty(block, "min");
    const max = useProperty(block, "max");

    const commonProps = {
        label: block.name,
        target: block,
        propertyKey: "value",
    } as const;

    if (type === NodeParticleBlockConnectionPointTypes.Int) {
        const hasMinMax = !isNaN(min) && !isNaN(max) && min !== max;
        if (hasMinMax) {
            return <BoundProperty key={`${block.uniqueId} (Slider)`} component={SyncedSliderPropertyLine} {...commonProps} min={min} max={max} step={1} />;
        } else {
            return <BoundProperty key={`${block.uniqueId} (Number)`} component={NumberInputPropertyLine} {...commonProps} step={1} />;
        }
    } else if (type === NodeParticleBlockConnectionPointTypes.Float) {
        const hasMinMax = !isNaN(min) && !isNaN(max) && min !== max;
        if (hasMinMax) {
            return <BoundProperty key={`${block.uniqueId} (Slider)`} component={SyncedSliderPropertyLine} {...commonProps} min={min} max={max} step={(max - min) / 100.0} />;
        } else {
            return <BoundProperty key={`${block.uniqueId} (Number)`} component={NumberInputPropertyLine} {...commonProps} />;
        }
    } else if (type === NodeParticleBlockConnectionPointTypes.Color4) {
        return <BoundProperty key={`${block.uniqueId} (Color4)`} component={Color4PropertyLine} {...commonProps} />;
    } else if (type === NodeParticleBlockConnectionPointTypes.Vector2) {
        return <BoundProperty key={`${block.uniqueId} (Vector2)`} component={Vector2PropertyLine} {...commonProps} />;
    } else if (type === NodeParticleBlockConnectionPointTypes.Vector3) {
        return <BoundProperty key={`${block.uniqueId} (Vector3)`} component={Vector3PropertyLine} {...commonProps} />;
    } else {
        return null;
    }
};

/**
 * Display the NPE blocks that are marked as visible in the inspector.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemNodeEditorProperties: FunctionComponent<{ particleSystem: ParticleSystem; selectionService: ISelectionService }> = (props) => {
    const { particleSystem: system } = props;

    const classes = useStyles();
    const source = system.source as NodeParticleSystemSet | null;

    const inputBlocks = useObservableState(
        useCallback(() => {
            if (!source) {
                return [];
            }
            const inspectorVisibleInputBlocks = source.inputBlocks
                .filter((block) => block.displayInInspector && !block.isContextual && !block.isSystemSource && block.name)
                .map((block) => block as SafeInputBlock);
            const groupedInputBlocks = GroupBy(inspectorVisibleInputBlocks, (block) => block.groupInInspector);
            return groupedInputBlocks.sort((a, b) => a.key.localeCompare(b.key));
        }, [source]),
        source?.onBuildObservable
    );

    if (!source) {
        return null;
    }

    return (
        <>
            {inputBlocks.length === 0 ? (
                <MessageBar
                    key="no-visible-input-blocks"
                    intent="info"
                    title="No Visible Input Blocks"
                    message="To see input blocks, mark them as displayInInspector in the Node Particle Editor."
                    docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/node_particle"
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
                </>
            )}
        </>
    );
};
