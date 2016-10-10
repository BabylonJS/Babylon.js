/// <reference path="../../../src/canvas2d/babylon.smartpropertyprim.ts" />
/// <reference path="testclasses.ts" />

describe("GUI - Data Binding", () => {

    it("target update, no indirection",
        () => {

            // Create a customer, set its age
            let c = new BABYLON.Customer();
            c.age = 18;

            // Create a View Model and a binding
            let vm = new BABYLON.CustomerViewModel();
            vm.registerSimpleDataBinding(BABYLON.CustomerViewModel.ageProperty, "age");

            // Setting a dataSource should setup vm.age with the binding source value
            vm.dataSource = c;

            // Check it's ok
            expect(vm.age).toBe(18);

            // Change the source value, check the target is updated
            c.age = 19;
            expect(vm.age).toBe(19);
        }
    );

    it("target update, with indirection",
        () => {

            // Create a customer, set its city
            let c = new BABYLON.Customer();
            c.mainAddress.city = "Pontault Combault";

            // Create a View Model and a binding with an indirection
            let vm = new BABYLON.CustomerViewModel();
            vm.registerSimpleDataBinding(BABYLON.CustomerViewModel.cityProperty, "mainAddress.city");

            // Setting a dataSource should setup vm.age with the binding source value
            vm.dataSource = c;

            // Check it's ok
            expect(vm.city).toBe("Pontault Combault", "setting a new dataSource didn't immediately update the target");

            // Change the source value, check the target is updated
            c.mainAddress.city = "Paris";
            expect(vm.city).toBe("Paris", "changing source property didn't update the target property");

            // Change the address object, target should be updated
            let address = new BABYLON.Address();
            address.city = "Seattle";

            let oldAddress = c.mainAddress;
            c.mainAddress = address;
            expect(vm.city).toBe("Seattle", "changing intermediate object (the address) didn't update the target");

            // Check that if we change again inside Address, it still works
            c.mainAddress.city = "Redmond";
            expect(vm.city).toBe("Redmond", "changing final source property didn't change the target");

            // Now checks that changing the oldAddress city doesn't change the target
            oldAddress.city = "Berlin";
            expect(vm.city).not.toBe("Berlin", "Changed old address changed the target, which should not");
        }
    );

    it("target, one time update",
        () => {
            let c = new BABYLON.Customer();
            c.firstName = "Loic Baumann";

            // Create a View Model and a binding with an indirection
            let vm = new BABYLON.CustomerViewModel();
            vm.registerSimpleDataBinding(BABYLON.CustomerViewModel.firstNameProperty, "firstName");

            // Setting a dataSource should setup vm.age with the binding source value
            vm.dataSource = c;

            // Check it's ok
            expect(vm.firstName).toBe("Loic Baumann", "setting a new dataSource didn't immediately update the target with one time binding");

            // A change of the source shouldn't update the target
            c.firstName = "Nockawa";
            expect(vm.firstName).not.toBe("Nockawa", "Changing source property of a One Time binding updated the target, which should not");

            // A change of dataSource should update the target
            let c2 = new BABYLON.Customer();
            c2.firstName = "John";

            vm.dataSource = c2;
            expect(vm.firstName).toBe("John", "setting a new dataSource again didn't immediately update the target with one time binding");
        }
    );


});

