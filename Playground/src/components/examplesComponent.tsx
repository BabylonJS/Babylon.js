import * as React from "react";
import { GlobalState } from '../globalState';

require("../scss/examples.scss");

interface IExamplesComponentProps {
    globalState: GlobalState;
}

export class ExamplesComponent extends React.Component<IExamplesComponentProps, {filter: string}> {  
    private _state = "";
    private _rootRef: React.RefObject<HTMLDivElement>;
    private _scripts: {
        title: string;
        samples: {
            title: string;
            doc: string;
            icon: string;
            PGID: string;
            description: string;
        }[];
    }[];  
  
    public constructor(props: IExamplesComponentProps) {
        super(props);
        this._loadScripts();

        this.state = {filter: ""};
        this._rootRef = React.createRef();

        this.props.globalState.onExamplesDisplayChangedObservable.add(() => {
            if (this._state === "") {
                this._rootRef.current!.classList.add("visible");
                this._state = "visible";
            } else {
                this._rootRef.current!.classList.remove("visible");
                this._state = "";
            }
        });
    }  

    private _loadScripts() {
        var xhr = new XMLHttpRequest();

        if (this.props.globalState.language === "JS") {
            xhr.open('GET', 'https://raw.githubusercontent.com/BabylonJS/Documentation/master/examples/list.json', true);
        } else {
            xhr.open('GET', 'https://raw.githubusercontent.com/BabylonJS/Documentation/master/examples/list_ts.json', true);
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    this._scripts = JSON.parse(xhr.response)["examples"];

                    this._scripts.sort((a, b) => {
                        if (a.title < b.title) {
                            return -1;
                        }
                        return 1;
                    });

                    this._scripts.forEach(s => {
                        s.samples.sort((a, b) => {
                            if (a.title < b.title) {
                                return -1;
                            }
                            return 1;
                        });
                    });

                    this.forceUpdate();
                }
            }
        }

        xhr.send(null);
    }


    private _onLoadPG(id: string) {
        this.props.globalState.onLoadRequiredObservable.notifyObservers(id);
    }

    public render() {
        if (!this._scripts) {
            return null;
        }

        return (
            <div id="examples" className={this._state} ref={this._rootRef}>
                <div id="examples-header">Examples</div>
                <div id="examples-filter">
                    <input id="examples-filter-text" type="text" placeholder="Filter examples" value={this.state.filter} onChange={evt => {
                        this.setState({filter: evt.target.value});
                    }}/>
                </div>
                <div id="examples-list">
                    {
                        this._scripts.map(s => {
                            let active = s.samples.filter(ss => {
                                return !this.state.filter 
                                    || ss.title.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1
                                    || ss.description.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1
                            });

                            if (active.length === 0) {
                                return null;
                            }

                            return(
                                <div key={s.title} className="example-category">
                                    <div className="example-category-title">
                                        {s.title}
                                    </div>
                                    {
                                        active.map(ss => {
                                            return (
                                                <div className="example" key={ss.title} onClick={() => this._onLoadPG(ss.PGID)}>
                                                    <img src={ss.icon.replace("icons", "https://doc.babylonjs.com/examples/icons")}/>
                                                    <div className="example-title">{ss.title}</div>
                                                    <div className="example-description">{ss.description}</div>
                                                    <a className="example-link" href={ss.doc} target="_blank">Documentation</a>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        )
    }
}