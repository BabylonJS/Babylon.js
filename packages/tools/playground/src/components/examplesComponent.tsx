import * as React from "react";
import type { GlobalState } from "../globalState";

import "../scss/examples.scss";

interface IExamplesComponentProps {
    globalState: GlobalState;
}

interface ISample {
    title: string;
    doc: string;
    icon: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    PGID: string;
    description: string;
}

interface IScript {
    title: string;
    samples: ISample[];
}

export class ExamplesComponent extends React.Component<IExamplesComponentProps, { filter: string; className: string; openedOnce: boolean }> {
    private _documentationRoot = "https://doc.babylonjs.com";
    private _searchUrl =
        "https://babylonjs-newdocs.search.windows.net/indexes/playgrounds/docs?api-version=2020-06-30&$top=1000&api-key=820DCA4087091C0386B0F0A266710390&$filter=isMain%20eq%20true";
    private _rootRef: React.RefObject<HTMLDivElement>;
    private _searchBoxRef: React.RefObject<HTMLInputElement>;
    private _scripts: IScript[];

    public constructor(props: IExamplesComponentProps) {
        super(props);
        this._loadScriptsAsync();

        this.state = { filter: "", className: "removed", openedOnce: false };
        this._rootRef = React.createRef();
        this._searchBoxRef = React.createRef();

        this.props.globalState.onExamplesDisplayChangedObservable.add(() => {
            if (this.state.className !== "visible") {
                this.setState({
                    ...this.state,
                    className: "visible",
                    openedOnce: true,
                });
                setTimeout(() => {
                    this._searchBoxRef.current!.focus();
                }, 250);
            } else {
                this.setState({
                    ...this.state,
                    className: "removed",
                });
            }
        });
    }

    private async _fillScriptAsync() {
        const response = await fetch(this._searchUrl);
        if (!response.ok) {
            return;
        }

        const list = await response.json();

        for (const value of list.value) {
            const newSample = {
                title: value.title,
                doc: this._documentationRoot + value.documentationPage,
                icon: this._documentationRoot + value.imageUrl,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                PGID: value.playgroundId,
                description: value.description,
            };

            const filter = this._scripts.filter((s) => s.title === value.category);
            let script: IScript;

            if (filter && filter.length) {
                script = filter[0];
            } else {
                script = {
                    title: value.category,
                    samples: [],
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

        for (const s of this._scripts) {
            s.samples.sort((a, b) => {
                if (a.title < b.title) {
                    return -1;
                }
                return 1;
            });
        }

        // Update
        this.forceUpdate();
    }

    private _onLoadPG(id: string) {
        this.props.globalState.onLoadRequiredObservable.notifyObservers(id);

        if (window.innerWidth < this.props.globalState.MobileSizeTrigger) {
            this.props.globalState.onExamplesDisplayChangedObservable.notifyObservers();
        }

        this.props.globalState.onExamplesDisplayChangedObservable.notifyObservers();
    }

    public override render() {
        if (!this._scripts) {
            return null;
        }

        return (
            <div id="examples" className={this.state.className} ref={this._rootRef}>
                <div id="examples-header">Examples</div>
                <div id="examples-filter">
                    <input
                        id="examples-filter-text"
                        type="text"
                        placeholder="Filter examples"
                        value={this.state.filter}
                        tabIndex={0}
                        ref={this._searchBoxRef}
                        onChange={(evt) => {
                            this.setState({ filter: evt.target.value });
                        }}
                    />
                </div>
                <div id="examples-list">
                    {this._scripts.map((s) => {
                        const active = s.samples.filter((ss) => {
                            return (
                                !this.state.filter ||
                                ss.title.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1 ||
                                ss.description.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1
                            );
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
                                            <img src={this.state.openedOnce ? ss.icon.replace("icons", "https://doc.babylonjs.com/examples/icons") : ""} alt={ss.title} />
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
