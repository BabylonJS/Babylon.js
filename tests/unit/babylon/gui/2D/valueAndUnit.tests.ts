/**
  * Tests value and unit state and behavior
  */
describe('ValueAndUnit', () => {
    it('Should set unit to Pixel', () => {
        const subject = new BABYLON.GUI.ValueAndUnit(1);
        subject.internalValue.should.be.equal(1);
        subject.isPixel.should.be.true;
        subject.isPercentage.should.be.false;
    });

    it('Should notify observers when Value changed', (done: (err?: any) => void) => {
        const callback = (eventData: void) => {};
        const callbackSpy = sinon.spy(callback);

        const subject = new BABYLON.GUI.ValueAndUnit(1);
        expect(subject.onChangedObservable.hasObservers(), "ValueAndUnit.onChangedObservable.hasObservers()").to.be.false;
        subject.internalValue = 0.5;

        subject.onChangedObservable.add(callbackSpy);
        expect(subject.onChangedObservable.hasObservers(), "ValueAndUnit.onChangedObservable.hasObservers()").to.be.true;
        subject.internalValue = 0.6;
        expect(callbackSpy.called).to.be.true;
        done();
    })
});