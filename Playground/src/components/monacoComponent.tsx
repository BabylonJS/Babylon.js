import * as React from "react";
import { MonacoManager } from '../tools/monacoManager';
import { GlobalState } from '../globalState';

require("../scss/monaco.scss");

interface IMonacoComponentProps {
    className: string;
    refObject: React.RefObject<HTMLDivElement>;
    globalState: GlobalState;
}
export class MonacoComponent extends React.Component<IMonacoComponentProps> {
    private _monacoManager: MonacoManager;
    
    public constructor(props: IMonacoComponentProps) {
        super(props);

        this._monacoManager = new MonacoManager(this.props.globalState);

        this.props.globalState.onEditorFullcreenRequiredObservable.add(() => {
            let editorDiv = this.props.refObject.current! as any;
            if (editorDiv.requestFullscreen) {
                editorDiv.requestFullscreen();
            } else if (editorDiv.mozRequestFullScreen) {
                editorDiv.mozRequestFullScreen();
            } else if (editorDiv.webkitRequestFullscreen) {
                editorDiv.webkitRequestFullscreen();
            }
        });
    }
    
    componentDidMount() {        
        let hostElement = this.props.refObject.current!;  
        this._monacoManager.setupMonacoAsync(hostElement);
    }

    public render() {

        return (
            <div id="monacoHost" ref={this.props.refObject} className={this.props.className}>               
            </div>   
        )
    }
}