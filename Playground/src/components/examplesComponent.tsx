import * as React from "react";
import { GlobalState } from "../globalState";

require("../scss/examples.scss");

interface IExamplesComponentProps {
    globalState: GlobalState;
}

export class ExamplesComponent extends React.Component<IExamplesComponentProps, { filter: string }> {
    private _state = "removed";
    private _documentationRoot = "https://doc.babylonjs.com";
    private _searchUrl = "https://babylonjs-newdocs.search.windows.net/indexes/playgrounds/docs?api-version=2020-06-30&$top=1000&main=true&api-key=820DCA4087091C0386B0F0A266710390&search=";
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

    private async _fillScriptAsync(category: string) {
        const response = await fetch(this._searchUrl + category);
        if (!response.ok) {
            return;
        }

        let list = await response.json();
        let sampleArray: {
            title: string;
            doc: string;
            icon: string;
            PGID: string;
            description: string;
        }[] = [];

        let newScript = {
            title: category,
            samples: sampleArray
        }

        for(var value of list.value) {
            let newSample = {
                title: value.title,
                doc: this._documentationRoot + value.documentationPage,
                icon: this._documentationRoot + value.imageUrl,
                PGID: value.playgroundId,
                description: value.description
            }
            newScript.samples.push(newSample);
        }

        this._scripts.push(newScript);
    }

    private async _loadScriptsAsync() {

        this._scripts = [];

        await this._fillScriptAsync("Actions");
        await this._fillScriptAsync("Animations");
        await this._fillScriptAsync("Audio");
        await this._fillScriptAsync("Cameras");
        await this._fillScriptAsync("Collisions");
        await this._fillScriptAsync("GUI");
        await this._fillScriptAsync("Lights");
        await this._fillScriptAsync("Loaders");
        await this._fillScriptAsync("Materials");
        await this._fillScriptAsync("Meshes");
        await this._fillScriptAsync("Optimizations");
        await this._fillScriptAsync("Particles");
        await this._fillScriptAsync("Picking");
        await this._fillScriptAsync("Post-processes");
        await this._fillScriptAsync("Physics");
        await this._fillScriptAsync("Pointers");
        await this._fillScriptAsync("Shadows");
        await this._fillScriptAsync("Textures");
        await this._fillScriptAsync("XR");


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
