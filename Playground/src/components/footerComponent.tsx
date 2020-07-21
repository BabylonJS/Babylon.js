import * as React from "react";
import { GlobalState, EditionMode, RuntimeMode } from '../globalState';
import DocumentationIcon from "../imgs/documentation.svg";
import ForumIcon from "../imgs/forum.svg";
import SearchIcon from "../imgs/search.svg";
import CodeOnlyIcon from "../imgs/codeOnly.svg";
import RenderingOnlyIcon from "../imgs/renderingOnly.svg";
import RefreshIcon from "../imgs/refresh.svg";
import EditIcon from "../imgs/edit.svg";

require("../scss/footer.scss");

interface IFooterComponentProps {
    globalState: GlobalState;
}

export class FooterComponent extends React.Component<IFooterComponentProps> {    
    private _fpsRef: React.RefObject<HTMLDivElement>;
    
    public constructor(props: IFooterComponentProps) {
        super(props);
        this._fpsRef = React.createRef();

        this.props.globalState.onLanguageChangedObservable.add(() => {
            this.forceUpdate();
        });
    }
    
    componentDidMount() {       
        this.props.globalState.fpsElement = this._fpsRef.current!; 
    }

    switchMobileDefaultMode() {
        if (this.props.globalState.mobileDefaultMode === EditionMode.CodeOnly) {
            this.props.globalState.mobileDefaultMode = EditionMode.RenderingOnly;
        } else {
            this.props.globalState.mobileDefaultMode = EditionMode.CodeOnly;
        }

        this.props.globalState.onMobileDefaultModeChangedObservable.notifyObservers();
    }

    public render() {
        if (this.props.globalState.runtimeMode === RuntimeMode.Frame) {
            return (
                <div id="footer" className={(this.props.globalState.language === "JS" ? "background-js" : "background-ts")}>   
                    <div className="links">
                    <div className='link'>
                            <a href="#" onClick={() => location.reload()} title="Reload"><RefreshIcon/></a>
                        </div>
                        <div className='link'>
                            <a target='_new' href={"https://playground.babylonjs.com/" + location.hash} title="Edit"><EditIcon/></a>
                        </div>
                    </div>  
                    <div className="fps" ref={this._fpsRef}></div>          
                </div>   
            );
        }

        return (
            <div id="footer" className={(this.props.globalState.language === "JS" ? "background-js" : "background-ts")}>   
                {
                    window.innerWidth < this.props.globalState.MobileSizeTrigger &&
                    <div className="modeBar">
                        <div className='link'>
                            {
                                this.props.globalState.mobileDefaultMode === EditionMode.CodeOnly &&
                                <a onClick={() => this.switchMobileDefaultMode()} title="Switch to rendering"><RenderingOnlyIcon/></a>
                            }
                            {
                                this.props.globalState.mobileDefaultMode === EditionMode.RenderingOnly &&
                                <a onClick={() => this.switchMobileDefaultMode()} title="Switch to code"><CodeOnlyIcon/></a>
                            }
                        </div>
                    </div>
                }
                <div id="statusBar"></div>
                <div className="links">
                    <div className='link'>
                        <a target='_new' href="https://forum.babylonjs.com/" title="Forum"><ForumIcon/></a>
                    </div>
                    <div className='link'>
                        <a target='_new' href="https://doc.babylonjs.com" title="Documentation"><DocumentationIcon/></a>
                    </div>
                    <div className='link'>
                        <a target='_new' href="https://doc.babylonjs.com/playground" title="Search"><SearchIcon /></a>
                    </div>
                </div>  
                <div className="fps" ref={this._fpsRef}></div>          
            </div>   
        );
    }
}