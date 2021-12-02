/**
  * Tests value and unit state and behavior
  */
describe('ValueAndUnit', () => {
    it('Should default to Pixel units', () => {
        const subject = new BABYLON.GUI.ValueAndUnit(1);
        subject.value.should.be.equal(1);
        subject.isPixel.should.be.true;
        subject.isPercentage.should.be.false;
    });

    it('When "value" changes observers should be notified', () => {
        const subscription = sinon.spy(() => {});

        const subject = new BABYLON.GUI.ValueAndUnit(1);
        expect(subject.onChangedObservable.hasObservers(), "ValueAndUnit.onChangedObservable.hasObservers()").to.be.false;
        subject.value = 0.5;

        subject.onChangedObservable.add(subscription);
        expect(subject.onChangedObservable.hasObservers(), "ValueAndUnit.onChangedObservable.hasObservers()").to.be.true;
        expect(subscription.called).to.be.false;

        subject.value = 0.6;
        expect(subscription.called).to.be.true;
    })

    it('When "value" is set to same value observers should not be notified', () => {
        const subscription = sinon.spy(() => {});

        const subject = new BABYLON.GUI.ValueAndUnit(1);
        subject.onChangedObservable.add(subscription);
        expect(subject.onChangedObservable.hasObservers(), "ValueAndUnit.onChangedObservable.hasObservers()").to.be.true;
        expect(subscription.called).to.be.false;

        subject.value = 1;
        expect(subscription.called).to.be.false;
    })

    it('When "unit" changes observers should be notified', () => {
        const subscription = sinon.spy(() => {});

        // defaults to Pixel
        const subject = new BABYLON.GUI.ValueAndUnit(1);
        subject.onChangedObservable.add(subscription);
        expect(subject.onChangedObservable.hasObservers(), "ValueAndUnit.onChangedObservable.hasObservers()").to.be.true;
        expect(subscription.called).to.be.false;

        subject.unit = BABYLON.GUI.ValueAndUnit.UNITMODE_PERCENTAGE;
        expect(subscription.called).to.be.true;
    })

    it('When "unit" is set to same value observers should not be notified', () => {
        const subscription = sinon.spy(() => {});

        // defaults to Pixel
        const subject = new BABYLON.GUI.ValueAndUnit(1);
        subject.onChangedObservable.add(subscription);
        expect(subject.onChangedObservable.hasObservers(), "ValueAndUnit.onChangedObservable.hasObservers()").to.be.true;
        expect(subscription.called).to.be.false;

        subject.unit = BABYLON.GUI.ValueAndUnit.UNITMODE_PIXEL;
        expect(subscription.called).to.be.false;
    })

    it('"updateInPlace" should notify observers when underlying unit/value are changed', () => {
        const subscription = sinon.spy(() => {});

        const subject = new BABYLON.GUI.ValueAndUnit(1, BABYLON.GUI.ValueAndUnit.UNITMODE_PIXEL);
        subject.onChangedObservable.add(subscription);

        subject.updateInPlace(0.1, BABYLON.GUI.ValueAndUnit.UNITMODE_PERCENTAGE);
        expect(subscription.callCount).to.equal(1, 'Expecting a single call even though value and unit both changed.')
    })

    it('"updateInPlace" should not notify observers when underlying unit/value are unchanged', () => {
        const subscription = sinon.spy(() => {});

        const subject = new BABYLON.GUI.ValueAndUnit(1, BABYLON.GUI.ValueAndUnit.UNITMODE_PIXEL);
        subject.onChangedObservable.add(subscription);

        subject.updateInPlace(1, BABYLON.GUI.ValueAndUnit.UNITMODE_PIXEL);
        expect(subscription.called).to.be.false;
    })

    it('"fromString" should not notify observers when underlying value remain unchanged', () => {
        const subscription = sinon.spy(() => {});

        const subject = new BABYLON.GUI.ValueAndUnit(0.10, BABYLON.GUI.ValueAndUnit.UNITMODE_PERCENTAGE);
        subject.onChangedObservable.add(subscription);

        const changed = subject.fromString('10%');
        expect(changed).to.be.false;
        expect(subscription.called).to.be.false;
        expect(subject.isPercentage).to.be.true;
        expect(subject.value).to.equal(0.10, 'value should remain unchanged');
    })

    it('"fromString" should notify observers when underlying unit/value are changed', () => {
        const subscription = sinon.spy(() => {});

        const subject = new BABYLON.GUI.ValueAndUnit(20, BABYLON.GUI.ValueAndUnit.UNITMODE_PIXEL);
        subject.onChangedObservable.add(subscription);

        const changed = subject.fromString('22px');
        expect(changed).to.be.true;
        expect(subject.value).to.equal(22, '"22px" should have set value to 22');
        expect(subscription.callCount).to.equal(1, 'Expecting notification when values change.');
        expect(subject.isPixel).to.be.true;
        
    })
});