import * as React from "react";
import { TextLineComponent } from "../lines/textLineComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";


export interface AnimatedProperty { 
    name: string, 
    animationType: string
}

export interface IPropertiesLineComponentProps {
    label: string;
    properties: AnimatedProperty[];
}

export class PropertiesLineComponent extends React.Component<IPropertiesLineComponentProps, { isExpanded: boolean, list: AnimatedProperty[], quantity: number }> {
    constructor(props: IPropertiesLineComponentProps) {
        super(props);
        this.state = { isExpanded: false, list: this.props.properties, quantity: this.props.properties.length };
    }

    switchExpandState() {
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    render() {

        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;

        return (
            <div className="color3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                    <div className="color3">
                        {this.state.quantity}                            
                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        {chevron}
                    </div>
                </div>
                {
                    this.state.isExpanded &&
                    <div className="secondLine">
                    { this.state.list.map(property =>  <TextLineComponent label={property.name} value={property.animationType} />)}
                    </div>
                }
            </div>
        );
    }
}
