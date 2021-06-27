// VARIABLES: Trumpet keys
var key1 = document.querySelector(".key#first");
var key2 = document.querySelector(".key#second");
var key3 = document.querySelector(".key#third");

// INIT: Trumpet key event lsteners
document.addEventListener('keydown', keyPress);
document.addEventListener('keyup', keyRelease);

// FUNCTION: Listen for key down
function keyPress(e) {
    if(e.code == "KeyI"){
        key1.classList.add("down");
    }else if(e.code == "KeyO"){
        key2.classList.add("down");
    }else if(e.code == "KeyP"){
        key3.classList.add("down");
    }
}

// FUNCTION: Listen for key up
function keyRelease(e) {
    if(e.code == "KeyI"){
        key1.classList.remove("down");
    }else if(e.code == "KeyO"){
        key2.classList.remove("down");
    }else if(e.code == "KeyP"){
        key3.classList.remove("down");
    }
}