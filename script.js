// VARIABLES: Video
const video = document.getElementById('video');
var interval;
var vidToggle = false;

// VARIABLES: face-api.js
var localStream;
var mouthMin = .33; //temporary hard coded value for Anand's mouth size
var mouthMax = .39; //temporary hard coded value for Anand's mouth size
var note = 0;
var prevNote = 0;
var runningAverageArray = [0,0,0,0,0,0,0,0,0,0,0,0];

// VARIABLES: Sound Creation
var synth = new Tone.Synth().toMaster();
var playing = false;

// VARIABLES: Notes
const notes = {"F#3":0,"G3":0,"Ab3":0,"A3":0,"Bb3":0,"B3":0,"C4":0,"C#4":0,"D4":0,"Eb4":0,"E4":0,"F4":0,"F#4":0,"G4":0,"Ab4":0,"A4":0,"Bb4":0,"B4":0,"C5":0,"C#5":0,"D5":0,"Eb5":0,"E5":0,"F5":0,"F#5":0,"G5":0};
const numNotes = 26;
const fingerPositions = {
"0":["C4", "G4", "C5", "E5", "G5"],
"1":["Bb3","F4","Bb4","D5", "F5"],
"2":["B3", "F#4", "B4","Eb5","F#5"],
"3":[],
"4":["G3","D4", "G4", "B4","G5"],
"5":["Ab3","Eb4","Ab4","Eb5"],
"6":["A3","E4","A4","C#5","E5"],
"7":["F#3","C#4","F#4", "B4", "D5", "G5"]};

// VARIABLES: Trumpet keys
var key1 = document.querySelector(".key#first");
var key2 = document.querySelector(".key#second");
var key3 = document.querySelector(".key#third");
var currPositionArray = fingerPositions["0"];
var currKeys = {"1": false, "2": false, "3": false};

// BUTTON LISTENER: Play button for sound
document.querySelector('.start-button')?.addEventListener('click', async () => {
    if(!playing){
        await Tone.start();
        console.log('audio is ready');
        synth.triggerAttack("C4");
        playing = true;
        document.querySelector('.start-button').innerHTML = "Stop playing";
    }else{
        synth.triggerRelease();
        playing = false;
        document.querySelector('.start-button').innerHTML = "Start playing";
    }
})

// BUTTON LISTENER: Play and pause button for video streaming
document.querySelector('.stop-button').addEventListener('click', () => {
    toggleVideo();
});

// INIT: Assign each note a position along a spectrum of mouth positions
var counter = 0;
for (var note in notes) {
    notes[note] = scale(counter, 0, numNotes, mouthMin, mouthMax);
    counter++;
}

// INIT: Trumpet key event lsteners
document.addEventListener('keydown', keyPress);
document.addEventListener('keyup', keyRelease);

// FUNCTION: Listen for key down
function keyPress(e) {
    if(e.code == "KeyI"){
        currKeys["1"] = true;
        key1.classList.add("down");
    }else if(e.code == "KeyO"){
        currKeys["2"] = true;
        key2.classList.add("down");
    }else if(e.code == "KeyP"){
        currKeys["3"] = true;
        key3.classList.add("down");
    }
    window.setTimeout(changeFingering,20); //timeout for jitteryness
}

// FUNCTION: Listen for key up
function keyRelease(e) {
    if(e.code == "KeyI"){
        currKeys["1"] = false;
        key1.classList.remove("down");
    }else if(e.code == "KeyO"){
        currKeys["2"] = false;
        key2.classList.remove("down");
    }else if(e.code == "KeyP"){
        currKeys["3"] = false;
        key3.classList.remove("down");
    }
    window.setTimeout(changeFingering,20);
}

// FUNCTION: Update current fingering type
function changeFingering(){
    if(!currKeys["1"] && !currKeys["2"] && !currKeys["3"]){ // open
        currPositionArray = fingerPositions["0"]
    }else if(currKeys["1"] && !currKeys["2"] && !currKeys["3"]){ // 1
        currPositionArray = fingerPositions["1"]
    }else if(!currKeys["1"] && currKeys["2"] && !currKeys["3"]){ // 2
        currPositionArray = fingerPositions["2"]
    }else if(!currKeys["1"] && !currKeys["2"] && currKeys["3"]){ // 3
        currPositionArray = fingerPositions["3"]
    }else if(currKeys["1"] && !currKeys["2"] && currKeys["3"]){ // 1 & 3
        currPositionArray = fingerPositions["4"]
    }else if(!currKeys["1"] && currKeys["2"] && currKeys["3"]){ // 2 & 3
        currPositionArray = fingerPositions["5"]
    }else if(currKeys["1"] && currKeys["2"] && !currKeys["3"]){ // 1 & 2
        currPositionArray = fingerPositions["6"]
    }else if(currKeys["1"] && currKeys["2"] && currKeys["3"]){ // 1 & 2 & 3
        currPositionArray = fingerPositions["7"]
    }else{
        currPositionArray = fingerPositions["0"]
    }

    // change note visually and play
    if(note != undefined){
        document.querySelector("#note").innerHTML = note;
        synth.setNote(note);
    }

}

// FUNCTION: Toggle video stream on and off
function toggleVideo() {
    if(vidToggle){
        video.pause();
        video.src = "";
        localStream.getTracks()[0].stop();
        clearInterval(interval);
        vidToggle = false;
        document.querySelector('.stop-button').innerHTML = "Turn camera on";
    }else{
        startVideo();
        vidToggle = true;
        document.querySelector('.stop-button').innerHTML = "Turn camera off";
    }
  }

// MATH FUNCTION: map values between two ranges
function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// MATH FUNCTION: find absolute value difference between two values
function difference(a, b) {
    return Math.abs(a - b);
}

// MATH FUNCTION: Find average value of array
function average(nums) {
    return nums.reduce((a, b) => (a + b)) / nums.length;
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => {
        video.srcObject = stream;
        localStream = stream;
        vidToggle = true;
    },
    err => console.error(err)
  )
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.querySelector("#videoContainer").append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  interval = setInterval(async () => {
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    if(detections!= undefined){

        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        // Problem: this gets distance between corners of mouth BUT as you move closer to or 
        // further from the camera, those values change. You have to compare it to the face!
        const mouth = resizedDetections.landmarks.getMouth();
        const mouthWidth = faceapi.euclideanDistance([mouth[0].x,mouth[0].y], [mouth[6].x,mouth[6].y]) // Corners of mouth are 0 and 6

        // Get width of face
        const outline = resizedDetections.alignedRect;
        const faceWidth = outline.box._width; 
        
        const mouthSizeRelativeToFace = mouthWidth / faceWidth;// values vary from .33 to .38 based on lips

        // Problem: values from the facial recognizer are too jittery. Take running average to smooth
        // Solution: running average to smooth results
        runningAverageArray.push(mouthSizeRelativeToFace);
        runningAverageArray.shift();
        var currAverage = average(runningAverageArray);

        // find closest note with current fingering
        var closestNote;
        var lowestDistance = 100;
        for(var i = 0; i < currPositionArray.length;i++){
            var diff = difference(currAverage,notes[currPositionArray[i]]);
            if(diff < lowestDistance){
                lowestDistance = diff;
                closestNote = currPositionArray[i];
            }
        }
        note = closestNote;

        var percentageEmbouchure = (currAverage - mouthMin)/(mouthMax - mouthMin)*100;
        if(percentageEmbouchure < 0){
            percentageEmbouchure = 0;
        }
        document.querySelector("#sliderInside").style.height = percentageEmbouchure + "%";


        // Change note visually and play
        if(note !== prevNote && note != undefined){
            document.querySelector("#note").innerHTML = note;
            synth.setNote(note);
        }
        prevNote = note;

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        resizedDetections.landmarks._positions = resizedDetections.landmarks._positions.slice(48,68); // only plot mouth
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    }

  }, 30)
})