var colorArray = ["none", "rgb(0,0,255)", "rgb(0,0,0)", "rgb(255,0,0)"];
var holdObjectArray = [{}];
var dbResponseText = [];
var loadedProblemsObjectArray = [{}];
var createMenuContainerEl = document.getElementById("createMenuContainer");
var mainMenuContainerEl = document.getElementById("mainMenuContainer");
var loadProblemMenuContainerEl = document.getElementById(
  "loadProblemMenuContainer"
);
var disableHoldSelection = false;
var createInstructionsEl = document.getElementById("createInstructions");
var triggerClimbInfoModalEl = document.getElementById("triggerClimbInfoModal");
var inputHoldInfoOverlayEl = document.querySelector(".inputHoldInfoOverlay");
var modalCancelButtonEl = document.getElementById("modalCancelButton");
var resetOverlayEl = document.querySelector(".resetOverlay");
var problemInfoProblemNameEl = document.getElementById(
  "problemInfoProblemName"
);
var problemInfoGradeEl = document.getElementById("problemInfoGrade");
var problemInfoAuthorNameEl = document.getElementById("problemInfoAuthorName");
var problemInfoSideBarEl = document.querySelector(".problem-info-sidebar");
var climbSavedModalEl = document.querySelector(".climb-saved-modal");
var instructionOkButton = document.getElementById("instructionOkButton");

//this overrides apples overriding of overriding viewport zoom - LOL
document.addEventListener(
  "touchmove",
  function(event) {
    if (event.scale !== 1) {
      event.preventDefault();
    }
  },
  false
);

//disable image dragging for desktop
document.querySelector(".boardImg").ondragstart = function() {
  return false;
};

/***********************************************************
 * HAMMERTIME
 *********************************************************/

var imageContainerEl = document.getElementById("imageContainer");
var containerEl = document.getElementById("container");

var hammer = new Hammer.Manager(imageContainerEl);
var pinch = new Hammer.Pinch();
var pan = new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 10 });
var origScaleNum = 1;
var newScaleNum = 1;
var lastPinchTime = Date.now();

// add a "PAN" recognizer to it (all directions)
hammer.add(pan);
hammer.add(pinch);

// pinch.recognizeWith(pan);
// pan.recognizeWith(pinch);

// tie in the handler that will be called
hammer.on("pan", handleDrag);

var lastPosX = 0;
var lastPosY = 0;
var isDragging = false;

function handleDrag(ev) {
  if (Date.now() - lastPinchTime > 300) {
    var elem = imageContainerEl;

    // DRAG STARTED
    // here, let's snag the current position
    // and keep track of the fact that we're dragging
    if (!isDragging) {
      isDragging = true;

      var propValueStringLeft = window
        .getComputedStyle(elem)
        .getPropertyValue("left");
      var propValueStringTop = window
        .getComputedStyle(elem)
        .getPropertyValue("top");

      //chop off the px at the end of the string
      propValueStringLeft = propValueStringLeft.slice(
        0,
        propValueStringLeft.length - 2
      );
      propValueStringTop = propValueStringTop.slice(
        0,
        propValueStringTop.length - 2
      );

      lastPosX = parseInt(propValueStringLeft);
      lastPosY = parseInt(propValueStringTop);
    }

    // we simply need to determine where the x,y of this
    // object is relative to where it's "last" known position is
    // NOTE:
    //    deltaX and deltaY are cumulative
    // Thus we need to always calculate 'real x and y' relative
    // to the "lastPosX/Y"
    var posX = ev.deltaX + lastPosX;
    var posY = ev.deltaY + lastPosY;

    // move our element to that position
    elem.style.left = posX + "px";
    elem.style.top = posY + "px";

    // DRAG ENDED
    // this is where we simply forget we are dragging
    if (ev.isFinal) {
      isDragging = false;
    }
  }
}

//set initial scale
document.addEventListener("DOMContentLoaded", function() {
  imageContainerEl.style.transform = "scale(1)";
});

var previousScaleNum = [];

hammer.on("pinch", function(ev) {
  newScaleNum = origScaleNum * ev.scale;

  imageContainerEl.style.transform = "scale(" + newScaleNum + ")";

  //there was a bug with pinchcancel firing instead of pinchend.  the scale would reset on ios
  //this is fixed by keeping a small array of the scale numbers and if pinchcancel was fired, settin the scale to the next to last scale value

  previousScaleNum.push(newScaleNum);
  if (previousScaleNum.length > 3) {
    previousScaleNum.shift();
  }
});

hammer.on("pinchend", function(ev) {
  origScaleNum = returnScaleNumber(imageContainerEl.style.transform);

  lastPinchTime = Date.now();
});

hammer.on("pinchcancel", function(ev) {
  imageContainerEl.style.transform = "scale(" + previousScaleNum[1] + ")";

  origScaleNum = previousScaleNum[1];

  lastPinchTime = Date.now();
});

function returnScaleNumber(str) {
  str = str.slice(str.indexOf("(") + 1, str.length - 1);
  return parseFloat(str);
}

/***********************************************************
 * END HAMMERTIME
 *********************************************************/

//this function scrolls through colors on each click using the colorArray
function changeColor(clickedElem) {
  //get current color as string
  var colorString = window
    .getComputedStyle(clickedElem, null)
    .getPropertyValue("border");

  //needed this if chunk because none is set instead of "solid" - perhaps browser does this?
  if (colorString.indexOf("none") != -1) {
    colorString = "none";
  } else {
    colorString = colorString.substring(
      colorString.lastIndexOf("rgb"),
      colorString.length
    );
    colorString = colorString.replace(/ /g, "");
  }

  if (colorString == "0" || colorString == "" || colorString == "none") {
    colorString = colorArray[1];
  } else if (colorString == "rgb(0,0,255)") {
    colorString = colorArray[2];
  } else if (colorString == "rgb(0,0,0)") {
    colorString = colorArray[3];
  } else if (colorString == "rgb(255,0,0)") {
    colorString = colorArray[0];
  }

  //re-set border style with new color
  if (colorString == "none") {
    clickedElem.style.border = "none";
  } else {
    clickedElem.style.border = "0.5vw solid " + colorString;
  }
}

function convertBorderStringToVw(str) {
  var tempArr = str.split(" ");

  if (str.indexOf("none") != -1) {
    //dont need to do anything since the hold does not have a border
    return str;
  } else {
    tempArr[0] = tempArr[0].slice(0, tempArr[0].length - 2);

    var tempNum = parseFloat(tempArr[0]);

    //convert px number to vw number
    //(pixel number * 100) / clientWidth = vw number
    var vwNum = tempNum * 100 / document.documentElement.clientWidth;
    //round it to the nearest tenth
    vwNum = Math.max(Math.round(vwNum * 10) / 10).toFixed(2);
    //convert back to string and put in the array
    tempArr[0] = vwNum.toString() + "vw";
    str = tempArr[0] + str.slice(str.indexOf(" "), str.length);

    return str;
  }
}

function saveHoldObjectArray() {
  //reset holdObjectArray
  holdObjectArray = [{}];

  //find all click boxes, create an object for the click box, and add it to the holdObjectArray
  var elements = document.getElementsByClassName("clickBox");

  for (var i = 0; i < elements.length; i++) {
    //create new object and add it to the holdObjectArray

    var newBorderString = convertBorderStringToVw(
      window.getComputedStyle(elements[i], null).getPropertyValue("border")
    );

    // var tempObject = { "id": elements[i].id,
    //     "border": window.getComputedStyle(elements[i],null).getPropertyValue("border")
    // };

    var tempObject = {
      id: elements[i].id,
      border: newBorderString
    };

    holdObjectArray.push(tempObject);
  }

  //create references to form elements
  var problemNameInputEl = document.getElementById("problemNameInput");
  var gradeSelectEl = document.getElementById("gradeSelect");
  var authorNameEl = document.getElementById("authorNameInput");

  if (
    problemNameInputEl.value != "" &&
    authorNameEl.value != "" &&
    gradeSelectEl.value != ""
  ) {
    //create form data
    var formData = new FormData();

    formData.append("problemName", problemNameInputEl.value);
    formData.append("grade", gradeSelectEl.value);
    formData.append("authorName", authorNameEl.value);
    formData.append("holdData", JSON.stringify(holdObjectArray));

    //post form data
    var request = new XMLHttpRequest();
    request.open(
      "POST",
      "http://paulfreeman.design/riverside/saveProblemToDB.php"
    );
    request.send(formData);

    //clear out form html
    problemNameInputEl.value = "";
    gradeSelectEl.value = "";
    authorNameEl.value = "";

    clearSelectedHolds();
  }

  //hide modal and bring main menu container back in
  inputHoldInfoOverlayEl.classList.remove("inputHoldInfoOverlay--show");
  inputHoldInfoOverlayEl.style.pointerEvents = "none";
  mainMenuContainerEl.style.display = "flex";
  mainMenuContainerEl.classList.remove("fadeOutDown");
  mainMenuContainerEl.classList.add("fadeInUp");

  climbSavedModalEl.classList.add("climb-saved-modal--show");
  setTimeout(function() {
    climbSavedModalEl.classList.remove("climb-saved-modal--show");
  }, 2000);
}

function clearSelectedHolds() {
  var elements = document.getElementsByClassName("clickBox");

  for (var i = 0; i < elements.length; i++) {
    elements[i].style.border = "none";
  }
}

//listener for save holds button
document
  .getElementById("saveHoldStatus")
  .addEventListener("click", saveHoldObjectArray);

//listener for when user trigger save climb info modal
triggerClimbInfoModalEl.addEventListener("click", showSaveClimbInfoModal);

function showSaveClimbInfoModal() {
  inputHoldInfoOverlayEl.classList.add("inputHoldInfoOverlay--show");

  inputHoldInfoOverlayEl.style.pointerEvents = "auto";

  //hide the createMenuContainer
  createMenuContainerEl.classList.add("fadeOutDown");
}

//if user clicks reset button, clear the holds
document
  .querySelector(".resetButtonContainer")
  .addEventListener("click", function() {
    //add and remove resetOverlay to replay animation (white fade in/out)
    //have to remove and add the actual element for this to work
    var resetOverlayElClone = resetOverlayEl.cloneNode(true);
    resetOverlayEl.parentNode.replaceChild(resetOverlayElClone, resetOverlayEl);
    resetOverlayEl = resetOverlayElClone;

    clearSelectedHolds();
  });

modalCancelButtonEl.addEventListener("click", function() {
  inputHoldInfoOverlayEl.classList.remove("inputHoldInfoOverlay--show");
  inputHoldInfoOverlayEl.style.pointerEvents = "none";

  createMenuContainerEl.classList.remove("fadeOutDown");
  createMenuContainerEl.classList.add("fadeInUp");
});

//awesome way to avoid having to have event listeners on each clickbox!
//add event listener to the parent of all the click boxes
document.getElementById("clickParent").addEventListener("click", targetHandler);
//when a child of the event listen is clicked
function targetHandler(e) {
  if (e.target !== e.currentTarget && !disableHoldSelection) {
    //e.currentTarget is where the actual event listener is attached to
    changeColor(e.target);

    e.target.classList.add("animated");
    e.target.classList.add("bounceIn");
    //have to remove the animation to be able to retrigger!
    setTimeout(function() {
      e.target.classList.remove("animated");
      e.target.classList.remove("bounceIn");
    }, 500);
  }
  //this keeps the event from traversing up the DOM
  e.stopPropagation();
}

//on DOM loaded
document.addEventListener("DOMContentLoaded", function() {
  initHoldObjectArray();
  loadAllProblems(); //calls createLoadedProblemsArray, which calls populateProblemSelectDropdown
});

function loadAllProblems() {
  var request = new XMLHttpRequest();

  request.open(
    "GET",
    "http://paulfreeman.design/riverside/retrieveProblemsFromDB.php",
    true
  );

  request.send();

  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
      //if request was successful and finished
      dbResponseText = request.responseText;
      createLoadedProblemsArray();
    }
  };

  //reset problem info to blank
  // var problemInfoContainer = document.getElementById("problemInfo");
  // problemInfoContainer.innerHTML = "";
}

//after problems are loaded, this function creates/populates the loadedProblemsObjectArray
function createLoadedProblemsArray() {
  //here so we dont keep adding to the already loaded array
  loadedProblemsObjectArray = [];

  //seperate string on ;
  dbResponseText = dbResponseText.split(";");

  for (var i = 0; i < dbResponseText.length; i++) {
    //get individual parts out and create an object
    var tempProblemArray = dbResponseText[i].split("|");
    for (var j = 0; j < tempProblemArray.length; j++) {
      //take out the beginning of the string so only the value is left ("ID:14" turns into "14")
      tempProblemArray[j] = tempProblemArray[j].substr(
        tempProblemArray[j].indexOf(":") + 1,
        tempProblemArray[j].length
      );
    }

    //create temporary object
    var tempObject = {
      databaseID: tempProblemArray[0],
      problemName: tempProblemArray[1],
      grade: tempProblemArray[2],
      authorName: tempProblemArray[3],
      holdData: tempProblemArray[4]
    };

    //add temp object to loadedProblemsObjectArray
    loadedProblemsObjectArray.push(tempObject);
  }

  //take off the empty first object
  //loadedProblemsObjectArray.shift();

  populateProblemSelectDropdown();
}

//runs after formatDbResponseText() - (after the loadedProblemsObjectArray is set up)
function populateProblemSelectDropdown() {
  //insert <option>'s  into problem select dropdown

  var selectElement = document.getElementById("loadProblemSelect");

  //this is here so the list doesn't get added to itself everytime load is clicked
  selectElement.innerHTML = "";

  //insert blank option as first option
  selectElement.innerHTML += '<option value="none">PRESS TO SELECT</option>';

  for (var i = 0; i < loadedProblemsObjectArray.length; i++) {
    // console.log(typeof loadedProblemsObjectArray[i].databaseID);
    if (loadedProblemsObjectArray[i].grade != undefined) {
      selectElement.innerHTML +=
        '<option value="' +
        loadedProblemsObjectArray[i].databaseID +
        '">' +
        loadedProblemsObjectArray[i].grade +
        " // " +
        loadedProblemsObjectArray[i].problemName +
        "</option>";
    }
  }
}

function initHoldObjectArray() {
  var elements = document.getElementsByClassName("clickBox");

  for (var i = 0; i < elements.length; i++) {
    //create new object and add it to the holdObjectArray
    var tempObject = {
      id: elements[i].id,
      border: window
        .getComputedStyle(elements[i], null)
        .getPropertyValue("border")
    };

    holdObjectArray.push(tempObject);
  }
}

//this is called FROM HTML (onchange attribute) when user selects problem from dropdown
function loadSelectedProblem() {
  var dropDownElement = document.getElementById("loadProblemSelect");

  for (var i = 0; i < loadedProblemsObjectArray.length; i++) {
    if (loadedProblemsObjectArray[i].databaseID == dropDownElement.value) {
      var tempObject = loadedProblemsObjectArray[i];
    }
  }

  var tempHoldDataArray = tempObject.holdData;

  tempHoldDataArray = JSON.parse(tempHoldDataArray);
  tempHoldDataArray.shift(); //take out the empty first array

  //go through each hold in the selected problem and set the clickbox's accordingly
  for (var key in tempHoldDataArray) {
    var tempString = JSON.stringify(tempHoldDataArray[key]);
    //get idString
    var idString = tempString.substring(
      tempString.indexOf("click"),
      tempString.indexOf(",") - 1
    );
    //get the border string
    var borderString = tempString.substring(
      tempString.indexOf("border"),
      tempString.length - 2
    );
    borderString = borderString.replace(/"/g, "");
    borderString = borderString.replace("border:", "");
    //set element with clickbox to proper color
    document.getElementById(idString).style.border = borderString;

    //if the borderString actually has a border, animate the border
    if (borderString.indexOf("0.") != -1) {
      var tempEl = document.getElementById(idString);
      tempEl.classList.add("animated", "zoomIn");
      removeAnims(tempEl);
    }
  }

  //set text
  problemInfoProblemNameEl.innerHTML = '"' + tempObject.problemName + '"';
  problemInfoGradeEl.innerHTML = tempObject.grade;
  problemInfoAuthorNameEl.innerHTML = tempObject.authorName;

  //display problem data
  //slide out problem info sidebar
  problemInfoSideBarEl.style.display = "flex";
  problemInfoSideBarEl.classList.remove("fadeInLeft", "fadeOutLeft");
  problemInfoSideBarEl.classList.add("animated");
  problemInfoSideBarEl.classList.add("fadeInLeft");
}

function removeAnims(el) {
  setTimeout(function() {
    el.classList.remove("animated", "zoomIn");
  }, 800);
}

instructionOkButton.addEventListener("click", function() {
  createInstructionsEl.classList.add("fadeOutDown");
  createInstructionsEl.classList.remove("fadeInUp");
  this.style.pointerEvents = "none";
});

/*
*
*   Animations for menu's
* 
*/

//create button clicked
document.getElementById("createButton").addEventListener("click", function() {
  mainMenuContainerEl.classList.add("animated");
  mainMenuContainerEl.classList.add("fadeOutDown");
  createMenuContainerEl.style.display = "flex";
  createMenuContainerEl.classList.add("animated");
  createMenuContainerEl.classList.remove("fadeOutDown");
  createMenuContainerEl.classList.add("fadeInUp");

  //fade in and out instructions
  createInstructionsEl.style.visibility = "visible";
  createInstructionsEl.classList.remove("fadeOutDown");
  createInstructionsEl.classList.remove("fadeInUp");
  createInstructionsEl.classList.add("fadeInUp");
  instructionOkButton.style.pointerEvents = "auto";

  disableHoldSelection = false;
});

//load button clicked
document.getElementById("loadButton").addEventListener("click", function() {
  mainMenuContainerEl.classList.add("animated");
  mainMenuContainerEl.classList.add("fadeOutDown");
  loadProblemMenuContainerEl.style.display = "flex";
  loadProblemMenuContainerEl.classList.remove("fadeOutDown");
  loadProblemMenuContainerEl.classList.add("animated");
  loadProblemMenuContainerEl.classList.add("fadeInUp");
  disableHoldSelection = true;

  loadAllProblems();
});

//back button on create menu clicked
document
  .getElementById("backButton_Create")
  .addEventListener("click", function() {
    createMenuContainerEl.classList.add("animated");
    createMenuContainerEl.classList.add("fadeOutDown");
    mainMenuContainerEl.style.display = "flex";
    mainMenuContainerEl.classList.remove("fadeOutDown");
    mainMenuContainerEl.classList.add("animated");
    mainMenuContainerEl.classList.add("fadeInUp");
    inputHoldInfoOverlayEl.classList.remove("inputHoldInfoOverlay--show");
    inputHoldInfoOverlayEl.style.pointerEvents = "none";
    createInstructionsEl.classList.add("fadeOutDown");
    createInstructionsEl.classList.remove("fadeInUp");
    instructionOkButton.style.pointerEvents = "none";
    clearSelectedHolds();
    disableHoldSelection = false;
  });

//back button on load menu clicked
document
  .getElementById("backButton_Load")
  .addEventListener("click", function() {
    loadProblemMenuContainerEl.classList.add("animated");
    loadProblemMenuContainerEl.classList.add("fadeOutDown");
    mainMenuContainerEl.style.display = "flex";
    mainMenuContainerEl.classList.add("animated");
    mainMenuContainerEl.classList.remove("fadeOutDown");
    mainMenuContainerEl.classList.add("fadeInUp");
    problemInfoSideBarEl.classList.add("fadeOutLeft");
    clearSelectedHolds();
    disableHoldSelection = false;
  });
