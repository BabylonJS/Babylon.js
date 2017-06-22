/// <reference path="../../../src/tools/babylon.observable.ts" />

module JasmineTest {
    import ObservableArray = BABYLON.ObservableArray;
    import ArrayChanged = BABYLON.ArrayChanged;
    import PropertyChangedBase = BABYLON.PropertyChangedBase;

    class Customer extends PropertyChangedBase {

        constructor(firstName: string, lastName: string) {
            super();
            this._firstName = firstName;
            this._lastName = lastName;
        }

        public get firstName(): string {
            return this._firstName;
        }

        public set firstName(value: string) {
            if (this._firstName === value) {
                return;
            }

            let old = this._firstName;
            let oldDN = this.displayName;
            this._firstName = value;

            this.onPropertyChanged("firstName", old, value);
            this.onPropertyChanged("displayName", oldDN, this.displayName);
        }

        public get lastName(): string {
            return this._lastName;
        }

        public set lastName(value: string) {
            if (this._lastName === value) {
                return;
            }

            let old = this._lastName;
            let oldDN = this.displayName;
            this._lastName = value;

            this.onPropertyChanged("lastName", old, value);
            this.onPropertyChanged("displayName", oldDN, this.displayName);
        }

        public get displayName(): string {
            return this.firstName + " " + this.lastName;
        }

        private _firstName: string;
        private _lastName: string;

    }

    describe("Tools - ObservableArray",
        () => {

            it("Push",
                () => {

                    let oa = new ObservableArray<Customer>(true);
                    oa.push(new Customer("loic", "baumann"));

                    oa.propertyChanged.add((e, c) => {
                        expect(e.oldValue).toBe(1, "PropChanged length is bad");
                        expect(e.newValue).toBe(2, "PropChanged length is bad");
                    });
                    oa.arrayChanged.add((e, c) => {
                        expect(e.action).toBe(ArrayChanged.newItemsAction, "Wrong ArrayChanged action");
                        expect(e.newItems.length).toBe(1);
                        let item = e.newItems[0];
                        expect(item.index).toEqual(1);
                        expect(item.value.firstName).toBe("david");

                        expect(e.newStartingIndex).toBe(1);
                    });

                    oa.push(new Customer("david", "catuhe"));

                    expect(oa.length).toBe(2);
                    let item = oa.getAt(1);
                    expect(item).toBeDefined();
                    expect(item.firstName).toBe("david");

                    let triggerCounter = 0;
                    oa.watchedObjectChanged.add((e, c) => {
                        if (triggerCounter === 0) {
                            expect(e.propertyChanged.propertyName).toBe("firstName");
                            expect(e.propertyChanged.oldValue).toBe("david");
                            expect(e.propertyChanged.newValue).toBe("delta");
                            ++triggerCounter;
                        } else {
                            expect(e.propertyChanged.propertyName).toBe("displayName");
                            expect(e.propertyChanged.oldValue).toBe("david catuhe");
                            expect(e.propertyChanged.newValue).toBe("delta catuhe");
                            ++triggerCounter;
                        }
                    });
                }
            );


            it("SetAt/GetAt",
                () => {

                    let oa = new ObservableArray<Customer>(true);

                    let propChangedCount = 0;
                    let co = oa.propertyChanged.add((e, c) => {
                        if (e.propertyName !== "length") {
                            return;
                        }
                        expect(e.oldValue).toBe(e.newValue - ((e.oldValue===3) ? 2 : 1), "bad length value reported in PropChanged");
                        ++propChangedCount;

                        expect(propChangedCount).toBeLessThan(5, "PropChanged notif sent during illegal item insertion");
                    });

                    let triggerCount = 0;
                    let aco = oa.arrayChanged.add((e, c) => {
                        expect(e.action).toBe(ArrayChanged.newItemsAction, "Wrong ArrayChanged action");

                        switch (triggerCount) {
                            case 0:
                                expect(e.newItems.length).toBe(1);
                                expect(e.newItems[0].index).toEqual(0);
                                expect(e.newItems[0].value.firstName).toEqual("Mike");
                                expect(e.newStartingIndex).toBe(0);
                                break;

                            case 1:
                                expect(e.newItems.length).toBe(1);
                                expect(e.newItems[0].index).toEqual(1);
                                expect(e.newItems[0].value.firstName).toEqual("Steven");
                                expect(e.newStartingIndex).toBe(1);
                                break;

                            case 2:
                                expect(e.newItems.length).toBe(1);
                                expect(e.newItems[0].index).toEqual(2);
                                expect(e.newItems[0].value.firstName).toEqual("John");
                                expect(e.newStartingIndex).toBe(2);
                                break;

                            case 3:
                                expect(e.newItems.length).toBe(1);
                                expect(e.newItems[0].index).toEqual(4);
                                expect(e.newItems[0].value.firstName).toEqual("Matthew");
                                expect(e.newStartingIndex).toBe(4);
                                break;
                            default:
                                fail("arrayChanged called abnormally");
                        }

                        ++triggerCount;
                    });

                    oa.setAt(0, new Customer("Mike", "Portnoy"));
                    oa.setAt(1, new Customer("Steven", "Wilson"));
                    oa.setAt(2, new Customer("John", "Petrucci"));
                    oa.setAt(4, new Customer("Matthew", "Bellamy"));
                    oa.setAt(-10, new Customer("Hilary", "Hahn"));

                    oa.propertyChanged.remove(co);
                    oa.arrayChanged.remove(aco);

                    expect(oa.length).toBe(5);
                    expect(oa.getAt(0).firstName).toBe("Mike");
                    expect(oa.getAt(1).firstName).toBe("Steven");
                    expect(oa.getAt(2).firstName).toBe("John");
                    expect(oa.getAt(4).firstName).toBe("Matthew");

                    triggerCount = 0;
                    oa.arrayChanged.add((e, c) => {
                        expect(e.action).toBe((triggerCount < 2) ? ArrayChanged.changedItemAction : ArrayChanged.newItemsAction, "Wrong ArrayChanged action");

                        switch (triggerCount) {
                            case 0:
                                expect(e.changedItems.length).toBe(1);
                                expect(e.changedItems[0].index).toEqual(0);
                                expect(e.changedItems[0].value.firstName).toEqual("MP");
                                expect(e.changedStartingIndex).toBe(0);
                                break;

                            case 1:
                                expect(e.changedItems.length).toBe(1);
                                expect(e.changedItems[0].index).toEqual(1);
                                expect(e.changedItems[0].value.firstName).toEqual("SW");
                                expect(e.changedStartingIndex).toBe(1);
                                break;

                            case 2:
                                expect(e.newItems.length).toBe(1);
                                expect(e.newItems[0].index).toEqual(3);
                                expect(e.newItems[0].value.firstName).toEqual("JP");
                                expect(e.newStartingIndex).toBe(3);
                                break;
                        }

                        ++triggerCount;
                    });


                    let cust0 = new Customer("MP", "Portnoy");
                    let cust1 = new Customer("SW", "Wilson");
                    let cust3 = new Customer("JP", "Petrucci");

                    oa.setAt(0, cust0);
                    oa.setAt(1, cust1);
                    oa.setAt(3, cust3);

                    let triggerCounter = 0;
                    let propTriggered = false;
                    oa.watchedObjectChanged.add((e, c) => {
                        propTriggered = true;
                        if (e.propertyChanged.propertyName === "firstName") {
                            expect(e.propertyChanged.newValue).not.toBe("MP");
                            expect(e.propertyChanged.newValue).not.toBe("SW");
                            expect(e.propertyChanged.newValue).not.toBe("JP");
                        }

                        if (triggerCounter === 0) {
                            expect(e.propertyChanged.propertyName).toBe("firstName");
                            expect(e.propertyChanged.oldValue).toBe("MP");
                            expect(e.propertyChanged.newValue).toBe("BestDrummerInDaWorld");
                            ++triggerCounter;
                        } else {
                            expect(e.propertyChanged.propertyName).toBe("displayName");
                            expect(e.propertyChanged.oldValue).toBe("MP Portnoy");
                            expect(e.propertyChanged.newValue).toBe("BestDrummerInDaWorld Portnoy");
                            ++triggerCounter;
                        }
                    });
                    cust0.firstName = "BestDrummerInDaWorld";
                    expect(propTriggered).toBe(true, "no WatchedObjectChanged was called, not ok!");
                }
            );

            it("Pop",
                () => {

                    let oa = new ObservableArray<Customer>(true);

                    oa.push(new Customer("Myles", "Kennedy"));

                    oa.propertyChanged.add((e, c) => {
                        expect(e.oldValue).toBe(1);
                        expect(e.newValue).toBe(0);
                    });
                    oa.arrayChanged.add((e, c) => {
                        expect(e.action).toBe(ArrayChanged.removedItemsAction);
                        expect(e.removedItems.length).toBe(1);
                        expect(e.removedItems[0].index).toEqual(0);
                        expect(e.removedItems[0].value.firstName).toEqual("Myles");
                        expect(e.removedStartingIndex).toBe(0);
                    });

                    let pop = oa.pop();
                    expect(pop.firstName).toBe("Myles");

                    oa.watchedObjectChanged.add((e, c) => {
                        fail("watchedObject shouldn't be called as only a removed object had a property changed");
                    });

                    pop.firstName = "MK";
                }
            );

            it("Concat",
                () => {

                    let oa = new ObservableArray<string>(false);

                    oa.push("item0", "item1", "item2");
                    oa.setAt(4, "item4");

                    let noa = oa.concat("pipo0", "pipo1", "pipo2");

                    let res = ["item0", "item1", "item2", "item4", "pipo0", "pipo1", "pipo2"];
                    let i = 0;

                    noa.forEach((v) => {
                        expect(v).toBe(res[i++]);

                    });
                    expect(noa.length).toBe(8);

                }
            );

            it("Shift",
                () => {

                    let oa = new ObservableArray<string>(false);

                    oa.push("item0", "item1", "item2");

                    oa.propertyChanged.add((e, c) => {
                        expect(e.oldValue).toBe(3);
                        expect(e.newValue).toBe(2);
                    });
                    oa.arrayChanged.add((e, c) => {
                        expect(e.action).toBe(ArrayChanged.replacedArrayAction);
                        expect(e.removedItems.length).toBe(1);
                        expect(e.removedItems[0]).toEqual({ index: 0, value: "item0" });
                        expect(oa.getAt(0)).toEqual("item1");
                        expect(oa.getAt(1)).toEqual("item2");
                        expect(e.removedStartingIndex).toBe(0);
                    });

                    oa.shift();

                }
            );


            it("Sort",
                () => {

                    let oa = new ObservableArray<number>(false);

                    oa.push(3, 2, 4, 1);

                    oa.propertyChanged.add((e, c) => {
                        fail("no propertyChanged should be fired");
                    });
                    oa.arrayChanged.add((e, c) => {
                        expect(e.action).toBe(ArrayChanged.replacedArrayAction);
                        expect(oa.getAt(0)).toEqual(1);
                        expect(oa.getAt(1)).toEqual(2);
                        expect(oa.getAt(2)).toEqual(3);
                        expect(oa.getAt(3)).toEqual(4);
                    });

                    oa.sort((a, b) => a - b);
                }
            );
    });

}
