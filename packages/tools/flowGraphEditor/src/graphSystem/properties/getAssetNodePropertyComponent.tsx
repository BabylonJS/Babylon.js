import * as React from "react";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { Body1, makeStyles, tokens } from "@fluentui/react-components";

import { RenderGeneralSection } from "./genericNodePropertyComponent";
import { type FlowGraphGetAssetBlock, type IFlowGraphGetAssetBlockConfiguration } from "core/FlowGraph/Blocks/Data/flowGraphGetAssetBlock";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { type GlobalState } from "../../globalState";
import { type SceneContext } from "../../sceneContext";
import { type Observer } from "core/Misc/observable";

// FlowGraphAssetType is a const enum; mirror string values here so bundlers do not inline stale values.
const AssetTypeOptions: DropdownOption<string>[] = [
    { label: "Mesh", value: "Mesh" },
    { label: "Light", value: "Light" },
    { label: "Camera", value: "Camera" },
    { label: "Material", value: "Material" },
    { label: "AnimationGroup", value: "AnimationGroup" },
    { label: "Animation", value: "Animation" },
];

const useStyles = makeStyles({
    helpText: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        color: tokens.colorNeutralForeground3,
        fontStyle: "italic",
    },
});

/**
 * Returns the named scene objects for a given FlowGraphAssetType string.
 * @param ctx The SceneContext holding scene objects catalogued by category.
 * @param assetType The FlowGraphAssetType string value (e.g. "Mesh").
 * @returns Array of objects with uniqueId and name.
 */
function GetSceneListForType(ctx: SceneContext, assetType: string): Array<{ uniqueId: number; name: string }> {
    switch (assetType) {
        case "Mesh":
            return ctx.meshes;
        case "Light":
            return ctx.lights;
        case "Camera":
            return ctx.cameras;
        case "Material":
            return ctx.materials;
        case "Animation":
            return ctx.animations;
        case "AnimationGroup":
            return ctx.animationGroups;
        default:
            return [];
    }
}

/**
 * Returns the numeric value stored in a FlowGraphInteger-or-number config index field.
 * @param idx The raw config index value (number, FlowGraphInteger, or undefined).
 * @returns The integer value, or -1 if absent.
 */
function GetIndexValue(idx: number | FlowGraphInteger | undefined): number {
    if (idx == null) {
        return -1;
    }
    if (typeof idx === "number") {
        return idx;
    }
    return (idx as FlowGraphInteger).value ?? -1;
}

interface IGetAssetPropertyState {
    sceneContext: SceneContext | null;
}

const AssetConfigurationContent: React.FunctionComponent<{
    stateManager: IPropertyComponentProps["stateManager"];
    blockId: string;
    currentType: string;
    config: IFlowGraphGetAssetBlockConfiguration<any>;
    sceneContext: SceneContext | null;
    sceneAssets: Array<{ uniqueId: number; name: string }> | null;
    resolvedAssetId: number;
    useUniqueId: boolean;
    onTypeChange: (newType: string) => void;
    onIndexChange: (newIndex: number, useUniqueId: boolean) => void;
    onUseUniqueIdChange: (v: boolean) => void;
}> = ({ blockId, currentType, config, sceneContext, sceneAssets, resolvedAssetId, useUniqueId, onTypeChange, onIndexChange, onUseUniqueIdChange }) => {
    const classes = useStyles();
    return (
        <>
            <StringDropdownPropertyLine key={`type-${blockId}`} label="Asset Type" options={AssetTypeOptions} value={currentType} onChange={onTypeChange} />

            {sceneAssets ? (
                <>
                    <NumberDropdownPropertyLine
                        key={`asset-${blockId}-${sceneContext?.scene?.uid ?? "no-scene"}`}
                        label="Asset"
                        options={
                            [
                                { label: "(none)", value: -1 },
                                ...sceneAssets.map((a) => ({
                                    label: a.name || `(id ${a.uniqueId})`,
                                    value: a.uniqueId,
                                })),
                            ] as DropdownOption<number>[]
                        }
                        value={resolvedAssetId}
                        onChange={(uid) => onIndexChange(uid, uid !== -1)}
                    />
                    {sceneAssets.length === 0 && <Body1 className={classes.helpText}>No {currentType.toLowerCase()}s found in the scene.</Body1>}
                </>
            ) : (
                <>
                    <NumberInputPropertyLine label="Index" value={GetIndexValue(config.index)} step={1} onChange={(v) => onIndexChange(Math.trunc(v), false)} />
                    <SwitchPropertyLine label="Use Unique ID" value={useUniqueId} onChange={onUseUniqueIdChange} />
                    <Body1 className={classes.helpText}>Load a scene snippet in the Preview panel to pick assets by name.</Body1>
                </>
            )}
        </>
    );
};

/**
 * Specialized property panel for FlowGraphGetAssetBlock.
 * Shows a type dropdown and — when a scene is loaded — a named asset picker.
 */
export class GetAssetPropertyComponent extends React.Component<IPropertyComponentProps, IGetAssetPropertyState> {
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
        // If no type has been set yet, initialise to "Mesh" so the DataConnection
        // default value is never undefined when the graph runs.
        const config = this._getConfig();
        if (config.type == null) {
            this._onTypeChange("Mesh");
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

    private _getBlock(): FlowGraphGetAssetBlock<any> {
        return this.props.nodeData.data as FlowGraphGetAssetBlock<any>;
    }

    private _getConfig(): IFlowGraphGetAssetBlockConfiguration<any> {
        return this._getBlock().config;
    }

    private _onTypeChange(newType: string) {
        const block = this._getBlock();
        const config = this._getConfig();

        config.type = newType as any;

        // Sync DataConnection default value so in-session execution reflects the change.
        const typeDC = (block as any).type;
        if (typeDC && "_defaultValue" in typeDC) {
            typeDC._defaultValue = newType;
        }

        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    private _onIndexChange(newIndex: number, useUniqueId: boolean) {
        const block = this._getBlock();
        const config = this._getConfig();

        config.index = new FlowGraphInteger(newIndex);
        config.useIndexAsUniqueId = useUniqueId;

        // Store the selected asset name for rebinding after scene resets.
        if (useUniqueId && this.state.sceneContext) {
            const assets = GetSceneListForType(this.state.sceneContext, (config.type as string) ?? "Mesh");
            const asset = assets.find((a) => a.uniqueId === newIndex);
            (config as any)._assetName = asset?.name;
        } else {
            (config as any)._assetName = undefined;
        }

        const indexDC = (block as any).index;
        if (indexDC && "_defaultValue" in indexDC) {
            indexDC._defaultValue = new FlowGraphInteger(newIndex);
        }

        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    /**
     * Resolve the current asset uniqueId for the picker, rebinding by saved
     * name when the stored uniqueId is stale (e.g. after a scene reset).
     * @param sceneAssets - The list of assets from the current scene context, or null.
     * @returns The uniqueId of the current asset, or -1 if none is selected.
     */
    private _resolveCurrentAssetId(sceneAssets: Array<{ uniqueId: number; name: string }> | null): number {
        const config = this._getConfig();
        const currentIndexVal = GetIndexValue(config.index);
        const useUniqueId = config.useIndexAsUniqueId ?? false;

        if (!useUniqueId || currentIndexVal === -1 || !sceneAssets) {
            return useUniqueId ? currentIndexVal : -1;
        }

        // If the stored uniqueId still matches an asset in the scene, use it
        if (sceneAssets.some((a) => a.uniqueId === currentIndexVal)) {
            return currentIndexVal;
        }

        // Stale reference — try to rebind by the saved name
        const savedName: string | undefined = (config as any)._assetName;
        if (savedName) {
            const match = sceneAssets.find((a) => a.name === savedName);
            if (match) {
                // Update the config so runtime also picks up the new id
                config.index = new FlowGraphInteger(match.uniqueId);
                const block = this._getBlock();
                const indexDC = (block as any).index;
                if (indexDC && "_defaultValue" in indexDC) {
                    indexDC._defaultValue = new FlowGraphInteger(match.uniqueId);
                }
                return match.uniqueId;
            }
        }

        return -1;
    }

    override render() {
        const { stateManager } = this.props;
        const block = this._getBlock();
        const config = this._getConfig();
        const blockId = block.uniqueId;
        const currentType: string = (config.type as string) ?? "Mesh";
        const useUniqueId = config.useIndexAsUniqueId ?? false;
        const { sceneContext } = this.state;

        const sceneAssets = sceneContext ? GetSceneListForType(sceneContext, currentType) : null;
        const resolvedAssetId = this._resolveCurrentAssetId(sceneAssets);

        return (
            <Accordion uniqueId="FlowGraphGetAssetProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}

                <AccordionSection title="Asset Configuration" collapseByDefault={false}>
                    <AssetConfigurationContent
                        stateManager={stateManager}
                        blockId={blockId}
                        currentType={currentType}
                        config={config}
                        sceneContext={sceneContext}
                        sceneAssets={sceneAssets}
                        resolvedAssetId={resolvedAssetId}
                        useUniqueId={useUniqueId}
                        onTypeChange={(t) => this._onTypeChange(t)}
                        onIndexChange={(idx, useUid) => this._onIndexChange(idx, useUid)}
                        onUseUniqueIdChange={(v) => {
                            config.useIndexAsUniqueId = v;
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this._getBlock());
                            this.forceUpdate();
                        }}
                    />
                </AccordionSection>
            </Accordion>
        );
    }
}
