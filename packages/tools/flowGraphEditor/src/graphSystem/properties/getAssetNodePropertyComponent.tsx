import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import { type FlowGraphGetAssetBlock, type IFlowGraphGetAssetBlockConfiguration } from "core/FlowGraph/Blocks/Data/flowGraphGetAssetBlock";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { type GlobalState } from "../../globalState";
import { type SceneContext } from "../../sceneContext";
import { type Observer } from "core/Misc/observable";

// FlowGraphAssetType is a const enum — mirror string values here so webpack doesn't inline stale values.
const AssetTypeOptions = [
    { label: "Mesh", value: "Mesh" },
    { label: "Light", value: "Light" },
    { label: "Camera", value: "Camera" },
    { label: "Material", value: "Material" },
    { label: "AnimationGroup", value: "AnimationGroup" },
    { label: "Animation", value: "Animation" },
];

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
        const { stateManager, nodeData } = this.props;
        const block = this._getBlock();
        const config = this._getConfig();
        const blockId = block.uniqueId;
        const currentType: string = (config.type as string) ?? "Mesh";
        const useUniqueId = config.useIndexAsUniqueId ?? false;
        const { sceneContext } = this.state;

        const sceneAssets = sceneContext ? GetSceneListForType(sceneContext, currentType) : null;
        const resolvedAssetId = this._resolveCurrentAssetId(sceneAssets);

        return (
            <>
                <GeneralPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                <LineContainerComponent title="ASSET CONFIGURATION">
                    {/* Asset type selector */}
                    <OptionsLine
                        key={`type-${blockId}`}
                        label="Asset Type"
                        options={AssetTypeOptions}
                        target={config}
                        propertyName="type"
                        valuesAreStrings={true}
                        onSelect={(value) => this._onTypeChange(value as string)}
                    />

                    {sceneAssets ? (
                        /* Scene-aware picker: dropdown of real scene objects */
                        <>
                            <OptionsLine
                                key={`asset-${blockId}-${sceneContext?.scene?.uid ?? "no-scene"}`}
                                label="Asset"
                                options={[
                                    { label: "(none)", value: -1 },
                                    ...sceneAssets.map((a) => ({
                                        label: a.name || `(id ${a.uniqueId})`,
                                        value: a.uniqueId,
                                    })),
                                ]}
                                target={config}
                                propertyName="index"
                                extractValue={() => resolvedAssetId}
                                noDirectUpdate={true}
                                onSelect={(value) => {
                                    const uid = value as number;
                                    this._onIndexChange(uid, uid !== -1);
                                }}
                            />
                            {sceneAssets.length === 0 && (
                                <div style={{ padding: "4px 8px", color: "#aaa", fontSize: "11px" }}>No {currentType.toLowerCase()}s found in the scene.</div>
                            )}
                        </>
                    ) : (
                        /* No scene loaded: raw index input */
                        <>
                            <FloatLineComponent
                                label="Index"
                                lockObject={stateManager.lockObject}
                                digits={0}
                                step={"1"}
                                isInteger={true}
                                target={{ _idx: GetIndexValue(config.index) }}
                                propertyName="_idx"
                                onChange={(v) => this._onIndexChange(v, false)}
                            />
                            <CheckBoxLineComponent
                                label="Use Unique ID"
                                isSelected={() => useUniqueId}
                                onSelect={(v) => {
                                    config.useIndexAsUniqueId = v;
                                    this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this._getBlock());
                                    this.forceUpdate();
                                }}
                            />
                            <div style={{ padding: "4px 8px", color: "#888", fontSize: "11px" }}>Load a scene snippet in the Preview panel to pick assets by name.</div>
                        </>
                    )}
                </LineContainerComponent>
            </>
        );
    }
}
