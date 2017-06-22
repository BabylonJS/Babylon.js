/// <reference path="../../../src/tools/babylon.observable.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var JasmineTest;
(function (JasmineTest) {
    var ObservableArray = BABYLON.ObservableArray;
    var ArrayChanged = BABYLON.ArrayChanged;
    var PropertyChangedBase = BABYLON.PropertyChangedBase;
    var Customer = (function (_super) {
        __extends(Customer, _super);
        function Customer(firstName, lastName) {
            _super.call(this);
            this._firstName = firstName;
            this._lastName = lastName;
        }
        Object.defineProperty(Customer.prototype, "firstName", {
            get: function () {
                return this._firstName;
            },
            set: function (value) {
                if (this._firstName === value) {
                    return;
                }
                var old = this._firstName;
                var oldDN = this.displayName;
                this._firstName = value;
                this.onPropertyChanged("firstName", old, value);
                this.onPropertyChanged("displayName", oldDN, this.displayName);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Customer.prototype, "lastName", {
            get: function () {
                return this._lastName;
            },
            set: function (value) {
                if (this._lastName === value) {
                    return;
                }
                var old = this._lastName;
                var oldDN = this.displayName;
                this._lastName = value;
                this.onPropertyChanged("lastName", old, value);
                this.onPropertyChanged("displayName", oldDN, this.displayName);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Customer.prototype, "displayName", {
            get: function () {
                return this.firstName + " " + this.lastName;
            },
            enumerable: true,
            configurable: true
        });
        return Customer;
    }(PropertyChangedBase));
    describe("Tools - ObservableArray", function () {
        it("Push", function () {
            var oa = new ObservableArray(true);
            oa.push(new Customer("loic", "baumann"));
            oa.propertyChanged.add(function (e, c) {
                expect(e.oldValue).toBe(1, "PropChanged length is bad");
                expect(e.newValue).toBe(2, "PropChanged length is bad");
            });
            oa.arrayChanged.add(function (e, c) {
                expect(e.action).toBe(ArrayChanged.newItemsAction, "Wrong ArrayChanged action");
                expect(e.newItems.length).toBe(1);
                var item = e.newItems[0];
                expect(item.index).toEqual(1);
                expect(item.value.firstName).toBe("david");
                expect(e.newStartingIndex).toBe(1);
            });
            oa.push(new Customer("david", "catuhe"));
            expect(oa.length).toBe(2);
            var item = oa.getAt(1);
            expect(item).toBeDefined();
            expect(item.firstName).toBe("david");
            var triggerCounter = 0;
            oa.watchedObjectChanged.add(function (e, c) {
                if (triggerCounter === 0) {
                    expect(e.propertyChanged.propertyName).toBe("firstName");
                    expect(e.propertyChanged.oldValue).toBe("david");
                    expect(e.propertyChanged.newValue).toBe("delta");
                    ++triggerCounter;
                }
                else {
                    expect(e.propertyChanged.propertyName).toBe("displayName");
                    expect(e.propertyChanged.oldValue).toBe("david catuhe");
                    expect(e.propertyChanged.newValue).toBe("delta catuhe");
                    ++triggerCounter;
                }
            });
        });
        it("SetAt/GetAt", function () {
            var oa = new ObservableArray(true);
            var propChangedCount = 0;
            var co = oa.propertyChanged.add(function (e, c) {
                if (e.propertyName !== "length") {
                    return;
                }
                expect(e.oldValue).toBe(e.newValue - ((e.oldValue === 3) ? 2 : 1), "bad length value reported in PropChanged");
                ++propChangedCount;
                expect(propChangedCount).toBeLessThan(5, "PropChanged notif sent during illegal item insertion");
            });
            var triggerCount = 0;
            var aco = oa.arrayChanged.add(function (e, c) {
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
            oa.arrayChanged.add(function (e, c) {
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
            var cust0 = new Customer("MP", "Portnoy");
            var cust1 = new Customer("SW", "Wilson");
            var cust3 = new Customer("JP", "Petrucci");
            oa.setAt(0, cust0);
            oa.setAt(1, cust1);
            oa.setAt(3, cust3);
            var triggerCounter = 0;
            var propTriggered = false;
            oa.watchedObjectChanged.add(function (e, c) {
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
                }
                else {
                    expect(e.propertyChanged.propertyName).toBe("displayName");
                    expect(e.propertyChanged.oldValue).toBe("MP Portnoy");
                    expect(e.propertyChanged.newValue).toBe("BestDrummerInDaWorld Portnoy");
                    ++triggerCounter;
                }
            });
            cust0.firstName = "BestDrummerInDaWorld";
            expect(propTriggered).toBe(true, "no WatchedObjectChanged was called, not ok!");
        });
        it("Pop", function () {
            var oa = new ObservableArray(true);
            oa.push(new Customer("Myles", "Kennedy"));
            oa.propertyChanged.add(function (e, c) {
                expect(e.oldValue).toBe(1);
                expect(e.newValue).toBe(0);
            });
            oa.arrayChanged.add(function (e, c) {
                expect(e.action).toBe(ArrayChanged.removedItemsAction);
                expect(e.removedItems.length).toBe(1);
                expect(e.removedItems[0].index).toEqual(0);
                expect(e.removedItems[0].value.firstName).toEqual("Myles");
                expect(e.removedStartingIndex).toBe(0);
            });
            var pop = oa.pop();
            expect(pop.firstName).toBe("Myles");
            oa.watchedObjectChanged.add(function (e, c) {
                fail("watchedObject shouldn't be called as only a removed object had a property changed");
            });
            pop.firstName = "MK";
        });
        it("Concat", function () {
            var oa = new ObservableArray(false);
            oa.push("item0", "item1", "item2");
            oa.setAt(4, "item4");
            var noa = oa.concat("pipo0", "pipo1", "pipo2");
            var res = ["item0", "item1", "item2", "item4", "pipo0", "pipo1", "pipo2"];
            var i = 0;
            noa.forEach(function (v) {
                expect(v).toBe(res[i++]);
            });
            expect(noa.length).toBe(8);
        });
        it("Shift", function () {
            var oa = new ObservableArray(false);
            oa.push("item0", "item1", "item2");
            oa.propertyChanged.add(function (e, c) {
                expect(e.oldValue).toBe(3);
                expect(e.newValue).toBe(2);
            });
            oa.arrayChanged.add(function (e, c) {
                expect(e.action).toBe(ArrayChanged.replacedArrayAction);
                expect(e.removedItems.length).toBe(1);
                expect(e.removedItems[0]).toEqual({ index: 0, value: "item0" });
                expect(oa.getAt(0)).toEqual("item1");
                expect(oa.getAt(1)).toEqual("item2");
                expect(e.removedStartingIndex).toBe(0);
            });
            oa.shift();
        });
        it("Sort", function () {
            var oa = new ObservableArray(false);
            oa.push(3, 2, 4, 1);
            oa.propertyChanged.add(function (e, c) {
                fail("no propertyChanged should be fired");
            });
            oa.arrayChanged.add(function (e, c) {
                expect(e.action).toBe(ArrayChanged.replacedArrayAction);
                expect(oa.getAt(0)).toEqual(1);
                expect(oa.getAt(1)).toEqual(2);
                expect(oa.getAt(2)).toEqual(3);
                expect(oa.getAt(3)).toEqual(4);
            });
            oa.sort(function (a, b) { return a - b; });
        });
    });
})(JasmineTest || (JasmineTest = {}));
//# sourceMappingURL=ObservableArrayTest.js.map