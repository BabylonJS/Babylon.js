/**
  * Tests grid state and behavior
  */
describe('Grid', function () {
    var getFakeContext = function () {
        var fakeContext = sinon.stub();
        fakeContext.save = sinon.stub();
        fakeContext.globalAlpha = sinon.stub();
        fakeContext.translate = sinon.stub();
        fakeContext.rotate = sinon.stub();
        fakeContext.scale = sinon.stub();
        fakeContext.beginPath = sinon.stub();
        fakeContext.rect = sinon.stub();
        fakeContext.clip = sinon.stub();
        fakeContext.restore = function () { };
        return fakeContext;
    };
    var getFakeAdvancedDynamicTexture = function () {
        var fakeADT = sinon.stub();
        fakeADT.markAsDirty = sinon.stub();
        return fakeADT;
    };
    beforeEach(function () {
        sinon.restore();
    });
    it('When grid row definition changes, grid should mark itself as dirty', function () {
        var subject = new BABYLON.GUI.Grid();
        subject._host = getFakeAdvancedDynamicTexture();
        subject.addRowDefinition(0.5);
        var valueAndUnit = subject.getRowDefinition(subject.rowCount - 1);
        expect(subject.isDirty).to.be.true;
        subject._layout(new BABYLON.GUI.Measure(0, 0, 10, 10), getFakeContext());
        expect(subject.isDirty).to.be.false;
        // when changing a row definition the grid will mark itself as dirty
        valueAndUnit.value = 0.7;
        expect(subject.isDirty).to.be.true;
    });
    it('When grid is disposed it should clear rows/columns', function () {
        var subject = new BABYLON.GUI.Grid();
        subject.addRowDefinition(0.5);
        subject.addColumnDefinition(0.5);
        expect(subject.rowCount).equals(1);
        expect(subject.columnCount).equal(1);
        subject.dispose();
        expect(subject.rowCount).equals(0, 'should have no rows after dispose');
        expect(subject.columnCount).equals(0, 'should have no columns after dispose');
    });
});
