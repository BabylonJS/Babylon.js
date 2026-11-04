import * as React from "react";

import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";

import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { GetFlowGraphSoundAssetName } from "core/FlowGraph/flowGraphSoundAssets";
import { type Observer } from "core/Misc/observable";

import { type GlobalState } from "../../globalState";
import { RenderConstructorVariablesSection, RenderDataConnectionsSection, RenderGeneralSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";

interface ISoundInputPropertyState {
    soundAssetNames: string[];
}

/**
 * Property panel for blocks with a name-based sound input.
 */
export class SoundInputPropertyComponent extends React.Component<IPropertyComponentProps, ISoundInputPropertyState> {
    private _soundAssetsObserver: Observer<void> | null = null;

    public constructor(props: IPropertyComponentProps) {
        super(props);
        this.state = { soundAssetNames: this._getSoundAssetNames() };
    }

    public override componentDidMount(): void {
        const globalState = this.props.stateManager.data as GlobalState;
        this._soundAssetsObserver = globalState.onSoundAssetsChanged.add(() => {
            this.setState({ soundAssetNames: this._getSoundAssetNames() });
        });
    }

    public override componentWillUnmount(): void {
        this._soundAssetsObserver?.remove();
        this._soundAssetsObserver = null;
    }

    private _getBlock(): FlowGraphBlock {
        return this.props.nodeData.data as FlowGraphBlock;
    }

    private _getSoundAssetNames(): string[] {
        const globalState = this.props.stateManager.data as GlobalState;
        return (globalState.coordinator?.soundAssets ?? []).map((asset) => asset.name).sort();
    }

    private _setSoundAssetName(value: string): void {
        const block = this._getBlock();
        const input = block.getDataInput("sound");
        if (!input) {
            return;
        }
        const globalState = this.props.stateManager.data as GlobalState;
        globalState.setUnconnectedInputValue(input, value);
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    public override render(): React.ReactNode {
        const block = this._getBlock();
        const soundInput = block.getDataInput("sound");
        const value = GetFlowGraphSoundAssetName((soundInput as any)?._defaultValue) ?? "";
        const missingCurrentValue = value && !this.state.soundAssetNames.includes(value) ? [{ label: `${value} (missing)`, value }] : [];
        const options: DropdownOption<string>[] = [
            { label: "(none)", value: "" },
            ...missingCurrentValue,
            ...this.state.soundAssetNames.map((assetName) => ({ label: assetName, value: assetName })),
        ];

        return (
            <Accordion uniqueId="FlowGraphSoundInputProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}
                {RenderConstructorVariablesSection(this.props)}
                <AccordionSection title="Sound Asset" collapseByDefault={false}>
                    <StringDropdownPropertyLine label="Sound" options={options} value={value} onChange={(next: string) => this._setSoundAssetName(next)} />
                </AccordionSection>
                {RenderDataConnectionsSection(this.props)}
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}
