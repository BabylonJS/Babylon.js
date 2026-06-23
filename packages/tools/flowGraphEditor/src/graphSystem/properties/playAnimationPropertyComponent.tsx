import * as React from "react";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { Body1, makeStyles, tokens } from "@fluentui/react-components";

import { RenderGeneralSection, RenderDataConnectionsSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type GlobalState } from "../../globalState";
import { type SceneContext } from "../../sceneContext";
import { type Observer } from "core/Misc/observable";

interface IPlayAnimationPropertyState {
    sceneContext: SceneContext | null;
}

const useStyles = makeStyles({
    helpText: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        color: tokens.colorNeutralForeground3,
        fontStyle: "italic",
    },
});

const AnimationGroupContent: React.FunctionComponent<{
    sceneContext: SceneContext | null;
    blockId: string;
    currentAgId: number;
    onChange: (id: number) => void;
}> = ({ sceneContext, blockId, currentAgId, onChange }) => {
    const classes = useStyles();
    return (
        <>
            {sceneContext ? (
                <>
                    <NumberDropdownPropertyLine
                        key={`ag-${blockId}-${sceneContext?.scene?.uid ?? "no-scene"}`}
                        label="Animation Group"
                        options={
                            [
                                { label: "(none)", value: -1 },
                                ...sceneContext.animationGroups.map((a) => ({
                                    label: a.name || `(id ${a.uniqueId})`,
                                    value: a.uniqueId,
                                })),
                            ] as DropdownOption<number>[]
                        }
                        value={currentAgId}
                        onChange={onChange}
                    />
                    {sceneContext.animationGroups.length === 0 && <Body1 className={classes.helpText}>No animation groups found in the scene.</Body1>}
                </>
            ) : (
                <Body1 className={classes.helpText}>Load a scene snippet in the Preview panel to pick an animation.</Body1>
            )}
        </>
    );
};

const AnimationContent: React.FunctionComponent<{
    sceneContext: SceneContext | null;
    blockId: string;
    currentAnimId: number;
    onChange: (id: number) => void;
}> = ({ sceneContext, blockId, currentAnimId, onChange }) => {
    const classes = useStyles();
    return (
        <>
            {sceneContext ? (
                <>
                    <NumberDropdownPropertyLine
                        key={`anim-${blockId}-${sceneContext?.scene?.uid ?? "no-scene"}`}
                        label="Animation"
                        options={
                            [
                                { label: "(none)", value: -1 },
                                ...sceneContext.animations.map((a) => ({
                                    label: a.name || `(id ${a.uniqueId})`,
                                    value: a.uniqueId,
                                })),
                            ] as DropdownOption<number>[]
                        }
                        value={currentAnimId}
                        onChange={onChange}
                    />
                    {sceneContext.animations.length === 0 && <Body1 className={classes.helpText}>No animations found in the scene.</Body1>}
                </>
            ) : (
                <Body1 className={classes.helpText}>Load a scene snippet in the Preview panel to pick an animation.</Body1>
            )}
        </>
    );
};

/**
 * Property panel for FlowGraphPlayAnimationBlock.
 * Adds an AnimationGroup picker from the loaded scene context.
 */
export class PlayAnimationPropertyComponent extends React.Component<IPropertyComponentProps, IPlayAnimationPropertyState> {
    private _sceneContextObserver: Observer<SceneContext | null> | null = null;
    private _contextRefreshObserver: Observer<SceneContext> | null = null;

    constructor(props: IPropertyComponentProps) {
        super(props);
        const globalState = props.stateManager.data as GlobalState;
        this.state = { sceneContext: globalState.sceneContext };
    }

    override componentDidMount() {
        const globalState = this.props.stateManager.data as GlobalState;
        this._sceneContextObserver = globalState.onSceneContextChanged.add((ctx) => {
            this._contextRefreshObserver?.remove();
            this._contextRefreshObserver = ctx?.onContextRefreshed.add(() => this.forceUpdate()) ?? null;
            this.setState({ sceneContext: ctx });
        });
        // Subscribe to the current context if it already exists
        if (globalState.sceneContext) {
            this._contextRefreshObserver = globalState.sceneContext.onContextRefreshed.add(() => this.forceUpdate());
        }
    }

    override componentWillUnmount() {
        const globalState = this.props.stateManager.data as GlobalState;
        if (this._sceneContextObserver) {
            globalState.onSceneContextChanged.remove(this._sceneContextObserver);
            this._sceneContextObserver = null;
        }
        this._contextRefreshObserver?.remove();
        this._contextRefreshObserver = null;
    }

    private _getBlock(): FlowGraphBlock {
        return this.props.nodeData.data as FlowGraphBlock;
    }

    private _onAnimationGroupChange(uniqueId: number) {
        const block = this._getBlock();
        const agInput = block.getDataInput("animationGroup");
        if (!agInput) {
            return;
        }

        const { sceneContext } = this.state;
        if (!sceneContext) {
            return;
        }

        const ag = uniqueId === -1 ? undefined : sceneContext.animationGroups.find((a) => a.uniqueId === uniqueId);

        if (!block.config) {
            (block as any).config = {};
        }
        (block.config as any).animationGroup = ag;
        (block.config as any)._animationGroupName = ag?.name;
        (agInput as any)._defaultValue = ag;

        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    private _onAnimationChange(uniqueId: number) {
        const block = this._getBlock();
        const animInput = block.getDataInput("animation");
        if (!animInput) {
            return;
        }

        const { sceneContext } = this.state;
        if (!sceneContext) {
            return;
        }

        const anim = uniqueId === -1 ? undefined : sceneContext.animations.find((a) => a.uniqueId === uniqueId);

        if (!block.config) {
            (block as any).config = {};
        }
        (block.config as any)._animationName = anim?.name;
        (animInput as any)._defaultValue = anim;

        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    /**
     * Resolve the current animation group uniqueId, rebinding by saved name
     * when the stored reference is stale (e.g. after a scene reset).
     * @param sceneContext - The current scene context, or null if unavailable.
     * @returns The uniqueId of the current animation group, or -1 if none.
     */
    private _resolveCurrentAgId(sceneContext: SceneContext | null): number {
        const block = this._getBlock();
        const agInput = block.getDataInput("animationGroup");
        const currentAg = agInput ? (agInput as any)._defaultValue : undefined;
        if (!sceneContext) {
            return currentAg?.uniqueId ?? -1;
        }

        if (currentAg && typeof currentAg === "object") {
            const uid = currentAg.uniqueId;
            if (sceneContext.animationGroups.some((a) => a.uniqueId === uid)) {
                return uid;
            }
        }

        const savedName: string | undefined = (block.config as any)?._animationGroupName ?? (currentAg && typeof currentAg === "object" ? currentAg.name : undefined);
        if (savedName) {
            const match = sceneContext.animationGroups.find((a) => a.name === savedName);
            if (match) {
                if (!block.config) {
                    (block as any).config = {};
                }
                (block.config as any).animationGroup = match;
                (agInput as any)._defaultValue = match;
                return match.uniqueId;
            }
        }

        return -1;
    }

    /**
     * Resolve the current animation uniqueId, rebinding by saved name
     * when the stored reference is stale (e.g. after a scene reset).
     * @param sceneContext - The current scene context, or null if unavailable.
     * @returns The uniqueId of the current animation, or -1 if none.
     */
    private _resolveCurrentAnimId(sceneContext: SceneContext | null): number {
        const block = this._getBlock();
        const animInput = block.getDataInput("animation");
        const currentAnim = animInput ? (animInput as any)._defaultValue : undefined;
        if (!sceneContext) {
            return currentAnim?.uniqueId ?? -1;
        }

        if (currentAnim && typeof currentAnim === "object") {
            const uid = currentAnim.uniqueId;
            if (sceneContext.animations.some((a) => a.uniqueId === uid)) {
                return uid;
            }
        }

        const savedName: string | undefined = (block.config as any)?._animationName ?? (currentAnim && typeof currentAnim === "object" ? currentAnim.name : undefined);
        if (savedName) {
            const match = sceneContext.animations.find((a) => a.name === savedName);
            if (match) {
                (animInput as any)._defaultValue = match;
                return match.uniqueId;
            }
        }

        return -1;
    }

    override render() {
        const { sceneContext } = this.state;
        const block = this._getBlock();
        const currentAgId = this._resolveCurrentAgId(sceneContext);
        const currentAnimId = this._resolveCurrentAnimId(sceneContext);

        return (
            <Accordion uniqueId="FlowGraphPlayAnimationProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}

                <AccordionSection title="Animation Group" collapseByDefault={false}>
                    <AnimationGroupContent sceneContext={sceneContext} blockId={block.uniqueId} currentAgId={currentAgId} onChange={(id) => this._onAnimationGroupChange(id)} />
                </AccordionSection>

                <AccordionSection title="Animation" collapseByDefault={false}>
                    <AnimationContent sceneContext={sceneContext} blockId={block.uniqueId} currentAnimId={currentAnimId} onChange={(id) => this._onAnimationChange(id)} />
                </AccordionSection>

                {RenderDataConnectionsSection(this.props)}
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}
