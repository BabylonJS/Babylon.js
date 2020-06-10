// Animations
var variantBar = document.getElementById("variantBar");
var variantDropdownBtn = document.getElementById("dropdownBtn-variants");
var variantChevronUp = document.getElementById("chevronUp-variants");
var variantChevronDown = document.getElementById("chevronDown-variants");
var variantDropdownLabel = document.getElementById("dropdownLabel-variants");
var variantDropdownContent = document.getElementById("dropdownContent-variants");
var clickInterceptor = document.getElementById("click-interceptor");

function displayVariantDropdownContent(display) {
    if (display) {
        variantDropdownContent.style.display = "block";
        variantChevronDown.style.display = "inline";
        variantChevronUp.style.display = "none";
        variantDropdownBtn.classList.add("open");
        clickInterceptor.classList.remove("hidden");
    }
    else {
        variantDropdownContent.style.display = "none";
        variantChevronDown.style.display = "none";
        variantChevronUp.style.display = "inline";
        variantDropdownBtn.classList.remove("open");
        clickInterceptor.classList.add("hidden");
    }
}
variantDropdownBtn.addEventListener("click", function() {
    if (variantDropdownContent.style.display === "block") {
        displayVariantDropdownContent(false);
    }
    else {
        displayVariantDropdownContent(true);
    }
});

function createVariantDropdownLink(variantName, target) {
    var variant = document.createElement("a");
    var displayName = variantName;

    if (displayName === BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.DEFAULT) {
        displayName = "Default";
    }

    variant.innerHTML = displayName;
    variant.title = displayName;
    variant.addEventListener("click", function() {
        BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.SelectVariant(target, variantName);

        variantDropdownLabel.innerHTML = displayName;
        variantDropdownLabel.title = displayName;
    });
    variantDropdownContent.appendChild(variant);
}