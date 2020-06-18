import * as React from 'react';
import { Observable } from 'babylonjs/Misc/observable';
import { PropertyChangedEvent } from '../../../../../components/propertyChangedEvent';
import { Animation } from 'babylonjs/Animations/animation';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { FileButtonLineComponent } from '../../../lines/fileButtonLineComponent';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { LockObject } from '../lockObject';
import { Tools } from 'babylonjs/Misc/tools';
import { GlobalState } from '../../../../globalState';
import { ReadFileError } from 'babylonjs/Misc/fileTools';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { TargetedAnimation } from 'babylonjs/Animations/animationGroup';

interface ILoadSnippetProps {
  animations: Animation[];
  onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
  lockObject: LockObject;
  globalState: GlobalState;
  snippetServer: string;
  setSnippetId: (id: string) => void;
  entity: IAnimatable | TargetedAnimation;
  setNotificationMessage: (message: string) => void;
}

export class LoadSnippet extends React.Component<
  ILoadSnippetProps,
  { snippetId: string }
> {
  private _serverAddress: string;
  constructor(props: ILoadSnippetProps) {
    super(props);
    this._serverAddress = this.props.snippetServer;
    this.state = { snippetId: '' };
  }

  change(value: string) {
    this.setState({ snippetId: value });
    this.props.setSnippetId(value);
  }

  loadFromFile(file: File) {
    Tools.ReadFile(
      file,
      (data) => {
        let decoder = new TextDecoder('utf-8');
        let jsonObject = JSON.parse(decoder.decode(data));
        var result = [];

        for (var i in jsonObject) {
          result.push(jsonObject[i]);
        }

        if (this.props.entity) {
          (this.props.entity as IAnimatable).animations = [];
          // Review how observable affects this

          result.forEach((anim) => {
            let newAnimation = Animation.Parse(anim);
            (this.props.entity as IAnimatable).animations?.push(newAnimation);
            // Review how observable affects this as well
          });
        }
      },
      undefined,
      true,
      (error: ReadFileError) => {
        console.log(error.message);
      }
    );
  }

  loadFromSnippet() {
    if (this.state.snippetId !== '') {
      //How to dispose() previous animations;
      //How to notify observers
      Animation.CreateFromSnippetAsync(this.state.snippetId)
        .then((newAnimations) => {
          // Explore how observers are notified from snippet
          if (newAnimations instanceof Array) {
            (this.props.entity as IAnimatable).animations = newAnimations;
          }

          if (newAnimations instanceof Animation) {
            (this.props.entity as IAnimatable).animations?.push(newAnimations);
          }
        })
        .catch((err) => {
          this.props.setNotificationMessage(
            `Unable to load your animations: ${err}`
          );
        });
    } else {
      this.props.setNotificationMessage(`You need to add an snippet id`);
    }
  }

  render() {
    return (
      <div className='load-container'>
        <TextInputLineComponent
          label='Snippet Id'
          lockObject={this.props.lockObject}
          value={this.state.snippetId}
          onChange={(value: string) => this.change(value)}
        />
        <ButtonLineComponent
          label='Load from snippet server'
          onClick={() => this.loadFromSnippet()}
        />
        <div className='load-browse'>
          <p>Local File</p>
          <FileButtonLineComponent
            label='Load'
            onClick={(file) => this.loadFromFile(file)}
            accept='.json'
          />
        </div>
        <div className='load-server'>
          <p>Snippet Server: </p>&nbsp;
          <p> {this._serverAddress ?? '-'}</p>
        </div>
      </div>
    );
  }
}
