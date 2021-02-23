import * as React from "react";
import { GlobalState } from "../globalState";

require("../scss/examples.scss");

interface IExamplesComponentProps {
    globalState: GlobalState;
}

interface ISample {
    title: string;
    doc: string;
    icon: string;
    PGID: string;
    description: string;
}

interface IScript {
    title: string;
    samples: ISample[];
}

export class ExamplesComponent extends React.Component<IExamplesComponentProps, { filter: string }> {
    private _state = "removed";
    private _documentationRoot = "https://doc.babylonjs.com";
    private _searchUrl = "https://babylonjs-newdocs.search.windows.net/indexes/playgrounds/docs?api-version=2020-06-30&$top=1000&api-key=820DCA4087091C0386B0F0A266710390&$filter=isMain%20eq%20true";
    private _rootRef: React.RefObject<HTMLDivElement>;
    private _scripts: IScript[];

    public constructor(props: IExamplesComponentProps) {
        super(props);
        this._loadScriptsAsync();

        this.state = { filter: "" };
        this._rootRef = React.createRef();

        this.props.globalState.onExamplesDisplayChangedObservable.add(() => {
            if (this._state !== "visible") {
                this._rootRef.current!.classList.remove("removed");
                setTimeout(() => {
                    this._rootRef.current!.classList.add("visible");
                    this._state = "visible";
                }, 16);
            } else {
                this._rootRef.current!.classList.remove("visible");
                this._state = "";
                setTimeout(() => {
                    this._rootRef.current!.classList.add("removed");
                }, 200);
            }
        });
    }

    private async _fillScriptAsync() {
        const response = await fetch(this._searchUrl);
        if (!response.ok) {
            return;
        }

        let list = await response.json();

        for(var value of list.value) {
            let newSample = {
                title: value.title,
                doc: this._documentationRoot + value.documentationPage,
                icon: this._documentationRoot + value.imageUrl,
                PGID: value.playgroundId,
                description: value.description
            }

            let filter = this._scripts.filter(s => s.title === value.category);
            let script: IScript;

            if (filter && filter.length) {
                script = filter[0];
            } else {
                script = {
                    title: value.category,
                    samples: []
                };
                this._scripts.push(script);
            }

            script.samples.push(newSample);
        }
    }

    private async _loadScriptsAsync() {

        this._scripts = [];

        await this._fillScriptAsync();

        // Sorting
        this._scripts.sort((a, b) => {
            if (a.title < b.title) {
                return -1;
            }
            return 1;
        });

        this._scripts.forEach((s) => {
            s.samples.sort((a, b) => {
                if (a.title < b.title) {
                    return -1;
                }
                return 1;
            });
        });

        // Update
        this.forceUpdate();
    }

    private _onLoadPG(id: string) {
        this.props.globalState.onLoadRequiredObservable.notifyObservers(id);

        if (window.innerWidth < this.props.globalState.MobileSizeTrigger) {
            this.props.globalState.onExamplesDisplayChangedObservable.notifyObservers();
        }
    }

    public render() {
        if (!this._scripts) {
            return null;
        }

        return (
            <div id="examples" className={this._state} ref={this._rootRef}>
                <div id="examples-header">Examples</div>
                <div id="examples-filter">
                    <input
                        id="examples-filter-text"
                        type="text"
                        placeholder="Filter examples"
                        value={this.state.filter}
                        onChange={(evt) => {
                            this.setState({ filter: evt.target.value });
                        }}
                    />
                </div>
                <div id="examples-list">
                    {this._scripts.map((s) => {
                        let active = s.samples.filter((ss) => {
                            return !this.state.filter || ss.title.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1 || ss.description.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1;
                        });

                        if (active.length === 0) {
                            return null;
                        }

                        return (
                            <div key={s.title} className="example-category">
                                <div className="example-category-title">{s.title}</div>
                                {active.map((ss, i) => {
                                    return (
                                        <div className="example" key={ss.title + i} onClick={() => this._onLoadPG(ss.PGID)}>
                                            <img src={ss.icon.replace("icons", "https://doc.babylonjs.com/examples/icons")} />
                                            <div className="example-title">{ss.title}</div>
                                            <div className="example-description">{ss.description}</div>
                                            <a className="example-link" href={ss.doc} target="_blank">
                                                Documentation
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}
