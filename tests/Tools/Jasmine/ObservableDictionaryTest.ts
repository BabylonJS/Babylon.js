module JasmineTest {
    import ObservableStringDictionary = BABYLON.ObservableStringDictionary;
    import PropertyChangedBase = BABYLON.PropertyChangedBase;
    import DictionaryChanged = BABYLON.DictionaryChanged;

    class Customer extends  PropertyChangedBase {

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

    describe("Tools - ObservableDictionary",
        () => {

            it("Add",
                () => {

                    let oa = new ObservableStringDictionary<Customer>(true);
                    oa.add("cust0", new Customer("loic", "baumann"));

                    oa.propertyChanged.add((e, c) => {
                        expect(e.oldValue).toBe(1, "PropChanged length is bad");
                        expect(e.newValue).toBe(2, "PropChanged length is bad");
                    });
                    oa.dictionaryChanged.add((e, c) => {
                        expect(e.action).toEqual(DictionaryChanged.newItemAction);
                        let item = e.newItem;
                        expect(item.key).toEqual("cust1");

                        expect(item.value.firstName).toEqual("david");
                        expect(item.value.lastName).toEqual("catuhe");
                    });

                    oa.add("cust1", new Customer("david", "catuhe"));

                    expect(oa.count).toBe(2);
                    let cust = oa.get("cust1");

                    expect(cust).toBeDefined();
                    expect(cust.firstName).toEqual("david");
                    expect(cust.lastName).toEqual("catuhe");
                }
            );

            it("Remove",
                () => {

                    let oa = new ObservableStringDictionary<Customer>(true);
                    let cust0 = new Customer("loic", "baumann");
                    let cust1 = new Customer("david", "catuhe");

                    oa.add("cust0", cust0);
                    oa.add("cust1", cust1);

                    oa.propertyChanged.add((e, c) => {
                        expect(e.oldValue).toBe(2, "PropChanged length is bad");
                        expect(e.newValue).toBe(1, "PropChanged length is bad");
                    });

                    oa.dictionaryChanged.add((e, c) => {
                        expect(e.action).toEqual(DictionaryChanged.removedItemAction);
                        let key = e.removedKey;
                        expect(key).toEqual("cust0");
                    });

                    oa.watchedObjectChanged.add((e, c) => {
                        fail("watchedObject shouldn't be called as only a removed object had a property changed");
                    });

                    expect(oa.count).toBe(2);
                    let cust = oa.get("cust1");

                    expect(cust).toBeDefined();
                    expect(cust.firstName).toEqual("david");
                    expect(cust.lastName).toEqual("catuhe");

                    oa.remove("cust0");

                    cust = oa.get("cust0");
                    expect(cust).toBeUndefined();

                    cust0.firstName = "nockawa";

                }
            );

            it("Watched Element",
                () => {

                    let oa = new ObservableStringDictionary<Customer>(true);
                    oa.add("cust0", new Customer("loic", "baumann"));
                    oa.add("cust1", new Customer("david", "catuhe"));

                    let triggerCounter = 0;
                    oa.watchedObjectChanged.add((e, c) => {
                        if (triggerCounter === 0) {
                            expect(e.key).toBe("cust1");
                            expect(e.propertyChanged.propertyName).toBe("firstName");
                            expect(e.propertyChanged.oldValue).toBe("david");
                            expect(e.propertyChanged.newValue).toBe("delta");
                            ++triggerCounter;
                        } else {
                            expect(e.key).toBe("cust1");
                            expect(e.propertyChanged.propertyName).toBe("displayName");
                            expect(e.propertyChanged.oldValue).toBe("david catuhe");
                            expect(e.propertyChanged.newValue).toBe("delta catuhe");
                            ++triggerCounter;
                        }
                    });

                    let cust = oa.get("cust1");

                    cust.firstName = "delta";
                }
            );
        }
    );
}
