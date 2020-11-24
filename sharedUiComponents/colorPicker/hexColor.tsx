import * as React from "react";

export interface IHexColorProps {
    value: string,
    expectedLength: number,
    onChange: (value: string) => void
}

export class HexColor extends React.Component<IHexColorProps, {hex: string}> {
    constructor(props: IHexColorProps) {
        super(props);

        this.state = {hex: this.props.value.replace("#", "")}
    }

    shouldComponentUpdate(nextProps: IHexColorProps, nextState: {hex: string}) {
        if (nextProps.value!== this.props.value) {
            nextState.hex = nextProps.value.replace("#", "");
        }

        return true;
    }

    updateHexValue(valueString: string) {
        if (valueString != "" && /^[0-9A-Fa-f]+$/g.test(valueString) == false) {
            return;
        }
    
        this.setState({hex: valueString});

        if(valueString.length !== this.props.expectedLength) {
            return;
        }
       
        this.props.onChange("#" + valueString);
    }

    public render() {
        return (
            <input type="string" className="hex-input" value={this.state.hex} 
                onChange={evt => this.updateHexValue(evt.target.value)}/>   
        )
    }

}