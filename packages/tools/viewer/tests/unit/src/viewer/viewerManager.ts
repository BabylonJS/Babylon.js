import { Helper } from "../../../commons/helper";
import { assert, expect, should } from "../viewerReference";
import { DefaultViewer, AbstractViewer, Version, viewerManager } from "../../../../src";

export const name = "viewer manager tests";

describe("Viewer Manager", function () {
    it("should be defined when the library is loaded", (done) => {
        assert.isDefined(viewerManager, "viewerManager is not defined");
        done();
    });

    it("should add and remove a viewer when viewer constructed and disposed", (done) => {
        const element = document.createElement("div");
        const randomString = "" + Math.random();
        element.id = randomString;

        assert.isUndefined(viewerManager.getViewerByHTMLElement(element));
        assert.isUndefined(viewerManager.getViewerById(randomString));
        const viewer = Helper.getNewViewerInstance(element);
        assert.isDefined(viewerManager.getViewerByHTMLElement(element));
        assert.isDefined(viewerManager.getViewerById(randomString));
        viewer.dispose();
        assert.isUndefined(viewerManager.getViewerByHTMLElement(element));
        assert.isUndefined(viewerManager.getViewerById(randomString));
        done();
    });

    it("should trigger the promsie when viewer was added", (done) => {
        const element = document.createElement("div");
        const randomString = "" + Math.random();
        element.id = randomString;

        const viewer = Helper.getNewViewerInstance(element);
        viewerManager.getViewerPromiseById(randomString).then(
            () => {
                viewer.dispose();
                done();
            },
            (error) => {
                assert.fail();
            }
        );
    });

    it("should trigger observers when viewer constructed and disposed", (done) => {
        const element = document.createElement("div");
        const randomString = "" + Math.random();
        element.id = randomString;

        let addedFlag = false;

        viewerManager.onViewerAddedObservable.add((addedViewer) => {
            assert.equal(addedViewer.baseId, randomString);
            addedFlag = true;
        });

        viewerManager.onViewerRemovedObservable.add((viewerId) => {
            assert.equal(randomString, viewerId);
            if (addedFlag) {
                viewerManager.dispose();
                done();
            } else {
                assert.fail();
            }
        });

        const viewer = Helper.getNewViewerInstance(element);
        viewer.dispose();
    });

    it("should dispose viewer(s) when disposed", (done) => {
        const element = document.createElement("div");
        const randomString = "" + Math.random();
        element.id = randomString;

        const viewer = Helper.getNewViewerInstance(element);

        const dispose = viewer.dispose;

        viewer.dispose = () => {
            dispose.call(viewer);
            done();
        };

        viewerManager.dispose();
    });
});
