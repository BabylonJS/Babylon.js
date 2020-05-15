import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "../../lineContainerComponent";
import { LockObject } from "./lockObject";
import { GlobalState } from "../../../globalState";
import { TextLineComponent } from '../../lines/textLineComponent';
import { IndentedTextLineComponent } from '../../lines/indentedtextLineComponent';

interface ICommonPropertyGridComponentProps {
    globalState: GlobalState;
    host: { metadata: any};
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonPropertyGridComponent extends React.Component<ICommonPropertyGridComponentProps> {
    constructor(props: ICommonPropertyGridComponentProps) {
        super(props);
    }

    renderLevel(jsonObject: any) {
        let components = [];

        for (var data in jsonObject) {
            let value = jsonObject[data];
            let type = Object.prototype.toString.call(value);

            switch(type) {
                case '[object String]':
                    components.push(
                        <TextLineComponent key={data} label={data} ignoreValue={true}/>
                    );
                    components.push(
                        <IndentedTextLineComponent key={data + value} value={value}/>
                    );
                    break;
                case '[object Array]':
                    components.push(
                        <TextLineComponent key={data}  label={data} ignoreValue={true}/>
                    );
                    for (var entry of value) {
                        components.push(
                            <IndentedTextLineComponent key={data + entry} value={entry}/>
                        );    
                    }
                    break;
                case '[object Object]':
                        components.push(
                            <TextLineComponent key={data}  label={data} ignoreValue={true}/>
                        );
                        for (var entryKey in value) {
                            components.push(
                                <TextLineComponent key={data + entry} label={entryKey} value={value[entryKey]} additionalClass="reduced-opacity"/>
                            );    
                        }
                        break;                    
            }
        }

        return components;
    }

    render() {
        if (!this.props.host.metadata) {
            return null;
        }

        if (!this.props.host.metadata.xmp) {
            return null;
        }

        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="XMP METADA">
                    {
                        this.renderLevel(this.props.host.metadata.xmp)                        
                    }
                </LineContainerComponent>
            </div>
        );
    }
}