
import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from 'babylonjs/Animations/animation';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { LockObject } from "../lockObject";

interface ISaveSnippetProps {
    animations: Animation[];
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    lockObject: LockObject;
}

interface SelectedAnimation {
    id: string;
    name: string;
    index: number;
    selected: boolean;
}

export class SaveSnippet extends React.Component<ISaveSnippetProps, { selectedAnimations: SelectedAnimation[] }>{
    private _serverAddress: string;
    constructor(props: ISaveSnippetProps) {
        super(props);
        this._serverAddress = "-";
        let animList = this.props.animations.map((animation, i) => {
            return { id: `${animation.name}_${animation.targetProperty}`, name: animation.name, index: i, selected: false }
        });
        this.state = { selectedAnimations: animList }
    }

    handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {

        e.preventDefault();

        let index = parseInt(e.target.id.replace('save_', ''));

        let updated = this.state.selectedAnimations.map(item => {

            if (item.index === index) {
                item.selected = true;
            }
            return item;
        });

        this.setState({ selectedAnimations: updated })

    }

    render() {
        return (
            <div className="load-container">
                <div>
                    <ul>
                        {this.props.animations.map((animation, i) => {
                            <li key={i}>
                                <div>
                                    <label>
                                        <input id={`save_${i}`} name={`save_${animation.name}`} type="checkbox" checked={this.state.selectedAnimations[i].selected} onChange={(e) => this.handleCheckboxChange(e)} />
                                        {animation.name}
                                    </label>
                                </div>
                            </li>
                        })}
                    </ul>
                </div>
                <div className="save-buttons">
                    <ButtonLineComponent label="Save Snippet" onClick={() => { }} />
                    <ButtonLineComponent label="Save File" onClick={() => { }} />
                </div>
                <div className="save-server">
                    <p>Snippet Server:</p>
                    <p>{this._serverAddress}</p>
                </div>

            </div>
        )
    }
} 