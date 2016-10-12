module BABYLON {

    @className("Address")
    export class Address extends PropertyChangedBase {

        public get street(): string {
            return this._street;
        }

        public set street(value: string) {
            if (value === this._street) {
                return;
            }

            let old = this._street;
            this._street = value;
            this.onPropertyChanged("street", old, value);
        }

        public get city(): string {
            return this._city;
        }

        public set city(value: string) {
            if (value === this._city) {
                return;
            }

            let old = this._city;
            this._city = value;
            this.onPropertyChanged("city", old, value);
        }


        public get postalCode(): string {
            return this._postalCode;
        }

        public set postalCode(value: string) {
            if (value === this._postalCode) {
                return;
            }

            let old = this._postalCode;
            this._postalCode = value;
            this.onPropertyChanged("postalCode", old, value);
        }

        private _street: string;
        private _city: string;
        private _postalCode: string;
    }

    @className("Customer")
    export class Customer extends PropertyChangedBase {

        /**
            * Customer First Name
        **/
        public get firstName(): string {
            return this._firstName;
        }

        public set firstName(value: string) {
            if (value === this._firstName) {
                return;
            }

            let old = this._firstName;
            this._firstName = value;
            this.onPropertyChanged("firstName", old, value);
        }

        /**
            * Customer Last Name
        **/
        public get lastName(): string {
            return this._lastName;
        }

        public set lastName(value: string) {
            if (value === this._lastName) {
                return;
            }

            let old = this._lastName;
            this._lastName = value;
            this.onPropertyChanged("lastName", old, value);
        }

        /**
            * Customer Main Address
        **/
        public get mainAddress(): Address {
            if (!this._mainAddress) {
                this._mainAddress = new Address();
            }
            return this._mainAddress;
        }

        public set mainAddress(value: Address) {
            if (value === this._mainAddress) {
                return;
            }

            let old = this._mainAddress;
            this._mainAddress = value;
            this.onPropertyChanged("mainAddress", old, value);
        }

        public get age(): number {
            return this._age;
        }

        public set age(value: number) {
            if (value === this._age) {
                return;
            }

            let old = this._age;
            this._age = value;
            this.onPropertyChanged("age", old, value);
        }

        private _firstName: string;
        private _lastName: string;
        private _mainAddress: Address;
        private _age: number;
    }

    @className("CustomerViewModel")
    export class CustomerViewModel extends SmartPropertyBase {
        public static firstNameProperty: Prim2DPropInfo;
        public static ageProperty: Prim2DPropInfo;
        public static cityProperty: Prim2DPropInfo;

        constructor() {
            super();
        }

        @BABYLON.dependencyProperty(0, pi => CustomerViewModel.ageProperty = pi)
        public get age(): number {
            return this._age;
        }

        public set age(value: number) {
            this._age = value;
        }

        @BABYLON.dependencyProperty(1, pi => CustomerViewModel.cityProperty = pi)
        public get city(): string {
            return this._city;
        }

        public set city(value: string) {
            this._city = value;
        }

        @BABYLON.dependencyProperty(2, pi => CustomerViewModel.firstNameProperty = pi, DataBinding.MODE_ONETIME)
        public get firstName(): string {
            return this._firstName;
        }

        public set firstName(value: string) {
            this._firstName = value;
        }

        private _age: number;
        private _city: string;
        private _firstName: string;
    }

}
