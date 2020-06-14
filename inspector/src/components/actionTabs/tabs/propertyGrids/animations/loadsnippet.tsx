import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from "babylonjs/Animations/animation";
import { ButtonLineComponent } from "../../../lines/buttonLineComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import { LockObject } from "../lockObject";

interface ILoadSnippetProps {
  animations: Animation[];
  onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
  lockObject: LockObject;
}

export class LoadSnippet extends React.Component<
  ILoadSnippetProps,
  { server: string }
> {
  private _serverAddress: string;
  constructor(props: ILoadSnippetProps) {
    super(props);
    this._serverAddress = "-";
    this.state = { server: "" };
  }

  change(value: string) {
    this.setState({ server: value });
  }

  render() {
    return (
      <div className="load-container">
        <TextInputLineComponent
          label="Snippet Server"
          lockObject={this.props.lockObject}
          value={this.state.server}
          onChange={(value: string) => this.change(value)}
        />
        <ButtonLineComponent label="Load" onClick={() => {}} />
        <div className="load-browse">
          <p>Local File</p>
          <ButtonLineComponent label="Browse" onClick={() => {}} />
        </div>
        <div className="load-server">
          <p>Snippet Server : </p>
          <p>{this._serverAddress}</p>
        </div>
      </div>
    );
  }
}
