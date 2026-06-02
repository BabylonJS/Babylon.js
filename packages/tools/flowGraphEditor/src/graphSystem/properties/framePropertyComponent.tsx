import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { type GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";

export interface IFramePropertyTabComponentProps {
    globalState: GlobalState;
    frame: GraphFrame;
}

export class FramePropertyTabComponent extends React.Component<IFramePropertyTabComponentProps> {
    private _onFrameExpandStateChangedObserver: Nullable<Observer<GraphFrame>>;

    constructor(props: IFramePropertyTabComponentProps) {
        super(props);
    }

    override componentDidMount() {
        this._onFrameExpandStateChangedObserver = this.props.frame.onExpandStateChanged.add(() => this.forceUpdate());
    }

    override componentWillUnmount() {
        if (this._onFrameExpandStateChangedObserver) {
            this.props.frame.onExpandStateChanged.remove(this._onFrameExpandStateChangedObserver);
            this._onFrameExpandStateChangedObserver = null;
        }
    }

    override render() {
        return (
            <Accordion uniqueId="FlowGraphFrameProperties">
                <AccordionSection title="General" collapseByDefault={false}>
                    <TextInputPropertyLine
                        label="Name"
                        value={this.props.frame.name}
                        onChange={(value) => {
                            this.props.frame.name = value;
                            this.forceUpdate();
                        }}
                    />
                    <Color3PropertyLine
                        label="Color"
                        value={this.props.frame.color}
                        onChange={(value) => {
                            this.props.frame.color = value.clone();
                            this.forceUpdate();
                        }}
                    />
                    <TextInputPropertyLine
                        label="Comments"
                        value={this.props.frame.comments ?? ""}
                        onChange={(value) => {
                            this.props.frame.comments = value;
                            this.forceUpdate();
                        }}
                    />
                    <Button
                        label={this.props.frame.isCollapsed ? "Expand" : "Collapse"}
                        title={this.props.frame.isCollapsed ? "Expand frame" : "Collapse frame"}
                        onClick={() => {
                            this.props.frame.isCollapsed = !this.props.frame.isCollapsed;
                        }}
                    />
                    <Button
                        label="Export"
                        title="Export frame"
                        onClick={() => {
                            this.props.frame.export();
                        }}
                    />
                </AccordionSection>
            </Accordion>
        );
    }
}
