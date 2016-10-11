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
            vm.createSimpleDataBinding(BABYLON.CustomerViewModel.ageProperty, "age");

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
            vm.createSimpleDataBinding(BABYLON.CustomerViewModel.cityProperty, "mainAddress.city");

            // Setting a dataSource should update the targets
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
            vm.createSimpleDataBinding(BABYLON.CustomerViewModel.firstNameProperty, "firstName");

            // Setting a dataSource should update the targets
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

    it("binding Format", () => {
        let c = new BABYLON.Customer();
        c.firstName = "Loic Baumann";
        c.age = 40;

        // Create a View Model and a binding with an indirection
        let vm = new BABYLON.CustomerViewModel();

        // Setting a dataSource should setup vm.age with the binding source value
        vm.dataSource = c;

        // Create the binding and set it up
        let b = new BABYLON.Binding();
        b.propertyPathName = "firstName";
        b.stringFormat = v => `My Name is ${v}`;
        vm.createDataBinding(BABYLON.CustomerViewModel.firstNameProperty, b);

        // Check it's ok
        expect(vm.firstName).toBe("My Name is Loic Baumann", "binding string format doesn't work");

        // Bind age to city with "Age: $value" format
        b = new BABYLON.Binding();
        b.propertyPathName = "age";
        b.stringFormat = v => `Age: ${v}`;
        vm.createDataBinding(BABYLON.CustomerViewModel.cityProperty, b);

        // Check it's ok
        expect(vm.city).toBe("Age: 40", "binding string format doesn't work on non string source type");
    });

    it("binding custom source", () => {
        let c1 = new BABYLON.Customer();
        c1.firstName = "Loic Baumann";
        c1.age = 40;

        let c2 = new BABYLON.Customer();
        c2.firstName = "John Doe";
        c2.age = 20;

        // Create a View Model and a binding with an indirection
        let vm = new BABYLON.CustomerViewModel();

        // Setting a dataSource should setup vm.age with the binding source value
        vm.dataSource = c1;

        // Create the binding and set it up
        let b = new BABYLON.Binding();
        b.propertyPathName = "firstName";
        vm.createDataBinding(BABYLON.CustomerViewModel.firstNameProperty, b);

        // Bind age with a custom source
        b = new BABYLON.Binding();
        b.propertyPathName = "age";
        b.dataSource = c2;
        vm.createDataBinding(BABYLON.CustomerViewModel.ageProperty, b);


        // Check it's ok
        expect(vm.firstName).toBe("Loic Baumann", "binding string format doesn't work");


        // Check it's ok
        expect(vm.age).toBe(20, "binding string format doesn't work on non string source type");
    });

});

