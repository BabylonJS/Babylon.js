import * as React from "react";
import { RenderGeneralSection } from "./genericNodePropertyComponent";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { type Observer } from "core/Misc/observable";
import { type Nullable } from "core/types";
import { type FlowGraphDebugBlock } from "core/FlowGraph/Blocks/Data/flowGraphDebugBlock";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";

export class DebugPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onUpdateRequiredObserver: Nullable<Observer<any>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        this._onUpdateRequiredObserver = this.props.stateManager.onUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
    }

    override render() {
        const debugBlock = this.props.nodeData.data as FlowGraphDebugBlock;

        return (
            <Accordion uniqueId="FlowGraphDebugProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}
                <AccordionSection title="Debug Values" collapseByDefault={false}>
                    {debugBlock.log.map((entry, i) => {
                        return <TextPropertyLine key={i} label={`${i} >`} value={entry[0]} description={entry[1]} />;
                    })}
                    {debugBlock.log.length === 0 && <TextPropertyLine label="" value="No values recorded yet" />}
                </AccordionSection>
            </Accordion>
        );
    }
}
