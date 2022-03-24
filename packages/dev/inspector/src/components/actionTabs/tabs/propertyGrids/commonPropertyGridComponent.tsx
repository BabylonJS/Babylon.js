import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../globalState";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { IndentedTextLineComponent } from "shared-ui-components/lines/indentedTextLineComponent";

interface ICommonPropertyGridComponentProps {
    globalState: GlobalState;
    host: { metadata: any };
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonPropertyGridComponent extends React.Component<ICommonPropertyGridComponentProps> {
    constructor(props: ICommonPropertyGridComponentProps) {
        super(props);
    }

    renderLevel(jsonObject: any) {
        const components = [];

        for (const data in jsonObject) {
            const value = jsonObject[data];
            const type = Object.prototype.toString.call(value);

            switch (type) {
                case "[object String]":
                    components.push(<TextLineComponent key={data} label={data} ignoreValue={true} />);
                    components.push(<IndentedTextLineComponent key={data + value} value={value} />);
                    break;
                case "[object Array]":
                    components.push(<TextLineComponent key={data} label={data} ignoreValue={true} />);
                    for (const entry of value) {
                        components.push(<IndentedTextLineComponent key={data + entry} value={entry} />);
                    }
                    break;
                case "[object Object]":
                    components.push(<TextLineComponent key={data} label={data} ignoreValue={true} />);
                    for (const entryKey in value) {
                        components.push(<TextLineComponent key={data + entryKey} label={entryKey} value={value[entryKey]} additionalClass="reduced-opacity" />);
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
                <LineContainerComponent title="XMP METADATA" selection={this.props.globalState}>
                    {this.renderLevel(this.props.host.metadata.xmp)}
                </LineContainerComponent>
            </div>
        );
    }
}
