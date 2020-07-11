import { GlobalState } from '../globalState';
import { Utilities } from './utilities';

export class SaveManager {
    public constructor(public globalState: GlobalState) {
        globalState.onSaveRequiredObservable.add(() => {
            if (!this.globalState.currentSnippetTitle || !this.globalState.currentSnippetDescription || !this.globalState.currentSnippetTags) {
                this.globalState.onMetadataWindowHiddenObservable.addOnce(status => {
                    if (status) {
                        this._saveSnippet();
                    }
                })
                this.globalState.onDisplayMetadataObservable.notifyObservers(true);
                return;
            }
            this._saveSnippet();
        });
    }

    private _saveSnippet() {        
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                    var snippet = JSON.parse(xmlHttp.responseText);
                    if (location.pathname && location.pathname.indexOf('pg/') !== -1) {
                        // full path with /pg/??????
                        if (location.pathname.indexOf('revision') !== -1) {
                            location.href = location.href.replace(/revision\/(\d+)/, "revision/" + snippet.version);
                        } else {
                            location.href = location.href + '/revision/' + snippet.version;
                        }
                    } else if (location.search && location.search.indexOf('pg=') !== -1) {
                        // query string with ?pg=??????
                        const currentQuery = Utilities.ParseQuery();
                        if (currentQuery.revision) {
                            location.href = location.href.replace(/revision=(\d+)/, "revision=" + snippet.version);
                        } else {
                            location.href = location.href + '&revision=' + snippet.version;
                        }
                    } else {
                        // default behavior!
                        var baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                        var newUrl = baseUrl + "#" + snippet.id;
                        newUrl = newUrl.replace('##', '#');
                        this.globalState.currentSnippetToken = snippet.id;
                        if (snippet.version && snippet.version !== "0") {
                            newUrl += "#" + snippet.version;
                        }
                        location.href = newUrl;     
                        this.globalState.onRunRequiredObservable.notifyObservers();               
                    }
                } else {
                    this.globalState.onErrorObservable.notifyObservers("Unable to save your code. It may be too long.");
                }
            }
        };

        xmlHttp.open("POST", this.globalState.SnippetServerUrl + (this.globalState.currentSnippetToken ? "/" + this.globalState.currentSnippetToken : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        var dataToSend = {
            payload: JSON.stringify({
                code: this.globalState.currentCode
            }),
            name: this.globalState.currentSnippetTitle,
            description: this.globalState.currentSnippetDescription,
            tags: this.globalState.currentSnippetTags
        };

        xmlHttp.send(JSON.stringify(dataToSend));   
    }
}