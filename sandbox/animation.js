// Animations
var animationBar = document.getElementById("animationBar");
var dropdownBtn = document.getElementById("dropdownBtn");
var chevronUp = document.getElementById("chevronUp");
var chevronDown = document.getElementById("chevronDown");
var dropdownLabel = document.getElementById("dropdownLabel");
var dropdownContent = document.getElementById("dropdownContent");
var playBtn = document.getElementById("playBtn");
var slider = document.getElementById("slider");
var clickInterceptor = document.getElementById("click-interceptor");

clickInterceptor.addEventListener("mousedown", function() {
    displayDropdownContent(false);
    displayDropdownContentEnv(false);
});

// event on the dropdown
function formatId(name) {
    return "data-" + name.replace(/\s/g, '');
}

function displayDropdownContent(display) {
    if (display) {
        dropdownContent.style.display = "block";
        chevronDown.style.display = "inline";
        chevronUp.style.display = "none";
        dropdownBtn.classList.add("open");
        clickInterceptor.classList.remove("hidden");
    }
    else {
        dropdownContent.style.display = "none";
        chevronDown.style.display = "none";
        chevronUp.style.display = "inline";
        dropdownBtn.classList.remove("open");
        clickInterceptor.classList.add("hidden");
    }
}
dropdownBtn.addEventListener("click", function() {
    if (dropdownContent.style.display === "block") {
        displayDropdownContent(false);
    }
    else {
        displayDropdownContent(true);
    }
});

function selectCurrentGroup(group, index, animation) {
    if (currentGroupIndex !== undefined) {
        document.getElementById(formatId(currentGroup.name + "-" + currentGroupIndex)).classList.remove("active");
    }
    playBtn.classList.remove("play");
    playBtn.classList.add("pause");

    // start the new animation group
    currentGroup = group;
    currentGroupIndex = index;
    animation.classList.add("active");
    dropdownLabel.innerHTML = currentGroup.name;
    dropdownLabel.title = currentGroup.name;

    // set the slider
    slider.setAttribute("min", currentGroup.from);
    slider.setAttribute("max", currentGroup.to);
    currentSliderValue = currentGroup.from;
    slider.value = currentGroup.from;
}

function createDropdownLink(group, index) {
    var animation = document.createElement("a");
    animation.innerHTML = group.name;
    animation.title = group.name;
    animation.setAttribute("id", formatId(group.name + "-" + index));
    animation.addEventListener("click", function() {
        // stop the current animation group
        currentGroup.reset();
        currentGroup.stop();

        group.play(true);

        // hide the content of the dropdown
        displayDropdownContent(false);
    });
    dropdownContent.appendChild(animation);

    group.onAnimationGroupPlayObservable.add(function(grp) {
        selectCurrentGroup(grp, index, animation);
    });

    group.onAnimationGroupPauseObservable.add(function(grp) {
        playBtn.classList.add("play");
        playBtn.classList.remove("pause");
    });
}

// event on the play/pause button
playBtn.addEventListener("click", function() {
    // click on the button to run the animation
    if (this.classList.contains("play")) {
        currentGroup.play(true);
    }
    // click on the button to pause the animation
    else {
        currentGroup.pause();
    }
});

// event on the slider
slider.addEventListener("input", function() {
    var value = parseFloat(this.value);

    if (playBtn.classList.contains("play")) {
        currentGroup.play(true);
        currentGroup.goToFrame(value);
        currentGroup.pause();
    } else {
        currentGroup.goToFrame(value);
    }
});

var sliderPause = false;
slider.addEventListener("mousedown", function() {
    if (playBtn.classList.contains("pause")) {
        sliderPause = true;
        playBtn.click();
    }
});

slider.addEventListener("mouseup", function() {
    if (sliderPause) {
        sliderPause = false;
        playBtn.click();
    }
});