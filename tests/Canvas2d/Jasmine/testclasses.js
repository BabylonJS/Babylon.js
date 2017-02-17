var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Address = (function (_super) {
        __extends(Address, _super);
        function Address() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Address.prototype, "street", {
            get: function () {
                return this._street;
            },
            set: function (value) {
                if (value === this._street) {
                    return;
                }
                var old = this._street;
                this._street = value;
                this.onPropertyChanged("street", old, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Address.prototype, "city", {
            get: function () {
                return this._city;
            },
            set: function (value) {
                if (value === this._city) {
                    return;
                }
                var old = this._city;
                this._city = value;
                this.onPropertyChanged("city", old, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Address.prototype, "postalCode", {
            get: function () {
                return this._postalCode;
            },
            set: function (value) {
                if (value === this._postalCode) {
                    return;
                }
                var old = this._postalCode;
                this._postalCode = value;
                this.onPropertyChanged("postalCode", old, value);
            },
            enumerable: true,
            configurable: true
        });
        Address = __decorate([
            BABYLON.className("Address")
        ], Address);
        return Address;
    }(BABYLON.PropertyChangedBase));
    BABYLON.Address = Address;
    var Customer = (function (_super) {
        __extends(Customer, _super);
        function Customer() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Customer.prototype, "firstName", {
            /**
                * Customer First Name
            **/
            get: function () {
                return this._firstName;
            },
            set: function (value) {
                if (value === this._firstName) {
                    return;
                }
                var old = this._firstName;
                this._firstName = value;
                this.onPropertyChanged("firstName", old, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Customer.prototype, "lastName", {
            /**
                * Customer Last Name
            **/
            get: function () {
                return this._lastName;
            },
            set: function (value) {
                if (value === this._lastName) {
                    return;
                }
                var old = this._lastName;
                this._lastName = value;
                this.onPropertyChanged("lastName", old, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Customer.prototype, "mainAddress", {
            /**
                * Customer Main Address
            **/
            get: function () {
                if (!this._mainAddress) {
                    this._mainAddress = new Address();
                }
                return this._mainAddress;
            },
            set: function (value) {
                if (value === this._mainAddress) {
                    return;
                }
                var old = this._mainAddress;
                this._mainAddress = value;
                this.onPropertyChanged("mainAddress", old, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Customer.prototype, "age", {
            get: function () {
                return this._age;
            },
            set: function (value) {
                if (value === this._age) {
                    return;
                }
                var old = this._age;
                this._age = value;
                this.onPropertyChanged("age", old, value);
            },
            enumerable: true,
            configurable: true
        });
        Customer = __decorate([
            BABYLON.className("Customer")
        ], Customer);
        return Customer;
    }(BABYLON.PropertyChangedBase));
    BABYLON.Customer = Customer;
    var CustomerViewModel = (function (_super) {
        __extends(CustomerViewModel, _super);
        function CustomerViewModel() {
            _super.call(this);
        }
        Object.defineProperty(CustomerViewModel.prototype, "age", {
            get: function () {
                return this._age;
            },
            set: function (value) {
                this._age = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CustomerViewModel.prototype, "city", {
            get: function () {
                return this._city;
            },
            set: function (value) {
                this._city = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CustomerViewModel.prototype, "firstName", {
            get: function () {
                return this._firstName;
            },
            set: function (value) {
                this._firstName = value;
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.dependencyProperty(0, function (pi) { return CustomerViewModel.ageProperty = pi; })
        ], CustomerViewModel.prototype, "age", null);
        __decorate([
            BABYLON.dependencyProperty(1, function (pi) { return CustomerViewModel.cityProperty = pi; })
        ], CustomerViewModel.prototype, "city", null);
        __decorate([
            BABYLON.dependencyProperty(2, function (pi) { return CustomerViewModel.firstNameProperty = pi; }, BABYLON.Binding.MODE_ONETIME)
        ], CustomerViewModel.prototype, "firstName", null);
        CustomerViewModel = __decorate([
            BABYLON.className("CustomerViewModel")
        ], CustomerViewModel);
        return CustomerViewModel;
    }(BABYLON.SmartPropertyBase));
    BABYLON.CustomerViewModel = CustomerViewModel;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=testclasses.js.map