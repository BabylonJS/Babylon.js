var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var JasmineTest;
(function (JasmineTest) {
    var ObservableStringDictionary = BABYLON.ObservableStringDictionary;
    var PropertyChangedBase = BABYLON.PropertyChangedBase;
    var DictionaryChanged = BABYLON.DictionaryChanged;
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
    describe("Tools - ObservableDictionary", function () {
        it("Add", function () {
            var oa = new ObservableStringDictionary(true);
            oa.add("cust0", new Customer("loic", "baumann"));
            oa.propertyChanged.add(function (e, c) {
                expect(e.oldValue).toBe(1, "PropChanged length is bad");
                expect(e.newValue).toBe(2, "PropChanged length is bad");
            });
            oa.dictionaryChanged.add(function (e, c) {
                expect(e.action).toEqual(DictionaryChanged.newItemAction);
                var item = e.newItem;
                expect(item.key).toEqual("cust1");
                expect(item.value.firstName).toEqual("david");
                expect(item.value.lastName).toEqual("catuhe");
            });
            oa.add("cust1", new Customer("david", "catuhe"));
            expect(oa.count).toBe(2);
            var cust = oa.get("cust1");
            expect(cust).toBeDefined();
            expect(cust.firstName).toEqual("david");
            expect(cust.lastName).toEqual("catuhe");
        });
        it("Remove", function () {
            var oa = new ObservableStringDictionary(true);
            var cust0 = new Customer("loic", "baumann");
            var cust1 = new Customer("david", "catuhe");
            oa.add("cust0", cust0);
            oa.add("cust1", cust1);
            oa.propertyChanged.add(function (e, c) {
                expect(e.oldValue).toBe(2, "PropChanged length is bad");
                expect(e.newValue).toBe(1, "PropChanged length is bad");
            });
            oa.dictionaryChanged.add(function (e, c) {
                expect(e.action).toEqual(DictionaryChanged.removedItemAction);
                var key = e.removedKey;
                expect(key).toEqual("cust0");
            });
            oa.watchedObjectChanged.add(function (e, c) {
                fail("watchedObject shouldn't be called as only a removed object had a property changed");
            });
            expect(oa.count).toBe(2);
            var cust = oa.get("cust1");
            expect(cust).toBeDefined();
            expect(cust.firstName).toEqual("david");
            expect(cust.lastName).toEqual("catuhe");
            oa.remove("cust0");
            cust = oa.get("cust0");
            expect(cust).toBeUndefined();
            cust0.firstName = "nockawa";
        });
        it("Watched Element", function () {
            var oa = new ObservableStringDictionary(true);
            oa.add("cust0", new Customer("loic", "baumann"));
            oa.add("cust1", new Customer("david", "catuhe"));
            var triggerCounter = 0;
            oa.watchedObjectChanged.add(function (e, c) {
                if (triggerCounter === 0) {
                    expect(e.key).toBe("cust1");
                    expect(e.propertyChanged.propertyName).toBe("firstName");
                    expect(e.propertyChanged.oldValue).toBe("david");
                    expect(e.propertyChanged.newValue).toBe("delta");
                    ++triggerCounter;
                }
                else {
                    expect(e.key).toBe("cust1");
                    expect(e.propertyChanged.propertyName).toBe("displayName");
                    expect(e.propertyChanged.oldValue).toBe("david catuhe");
                    expect(e.propertyChanged.newValue).toBe("delta catuhe");
                    ++triggerCounter;
                }
            });
            var cust = oa.get("cust1");
            cust.firstName = "delta";
        });
    });
})(JasmineTest || (JasmineTest = {}));
//# sourceMappingURL=ObservableDictionaryTest.js.map