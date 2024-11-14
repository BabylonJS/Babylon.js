import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../globalState";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { IndentedTextLineComponent } from "shared-ui-components/lines/indentedTextLineComponent";
import { Tags } from "core/Misc";

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

    renderTags() {
        const tags = Object.keys(Tags.GetTags(this.props.host, false));

        return tags.map((tag: string, i: number) => {
            return (
                <div className="tag" key={"tag" + i}>
                    {tag}
                </div>
            );
        });
    }

    override render() {
        return (
            <div>
                {this.props.host.metadata && this.props.host.metadata.xmp && (
                    <LineContainerComponent title="XMP METADATA" selection={this.props.globalState}>
                        {this.renderLevel(this.props.host.metadata.xmp)}
                    </LineContainerComponent>
                )}
                {Tags.HasTags(this.props.host) && (
                    <LineContainerComponent title="TAGS" selection={this.props.globalState}>
                        <div className="tagContainer">{this.renderTags()}</div>
                    </LineContainerComponent>
                )}
            </div>
        );
    }
}
