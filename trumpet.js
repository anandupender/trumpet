const video = document.getElementById('video')


var trumpet = SampleLibrary.load({
    instruments: "trumpet"
});

trumpet.toMaster();

var playing = false;

//attach a click listener to a play button
document.querySelector('.start-button')?.addEventListener('click', async () => {
    if(!playing){
        await Tone.start();
        console.log('audio is ready');
        trumpet.triggerAttack("C4");
        playing = true;
        document.querySelector('.start-button').innerHTML = "Stop playing";
    }else{
        trumpet.triggerRelease();
        playing = false;
        document.querySelector('.start-button').innerHTML = "Start playing";
    }

})

const fingerPositions = {
"0":["C3", "G3", "C4", "E4", "G4"],
"1":["Bb2","F3","Bb3","D4", "F4"],
"2":["B2", "F#3", "B3","D#4","F#4"],
"3":[],
"4":["D3", "G3"],
"5":["Eb3","Ab3","Eb4"],
"6":["E3","A3","C#4","E4"],
"7":["C#3"]};

var key1 = document.querySelector(".key#first");
var key2 = document.querySelector(".key#second");
var key3 = document.querySelector(".key#third");

var currPositionArray = fingerPositions["0"];

var currKeys = {"1": false, "2": false, "3": false};

// figure out key mappings
document.addEventListener('keydown', keyPress);

document.addEventListener('keyup', keyRelease);

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
    window.setTimeout(changeFingering,25);
}

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
    window.setTimeout(changeFingering,25);
}

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
    trumpet.triggerRelease();
    trumpet.triggerAttack(currPositionArray[note]);
}


Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.querySelector(".video").append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    // corners of mouth are 0 and 6
    // Problem: this gets distance between corners of mouth BUT as you move closer to or 
    // further from the camera, those values change. You have to compare it to the face!
    const mouth = resizedDetections.landmarks.getMouth();
    const mouthWidth = faceapi.euclideanDistance([mouth[0].x,mouth[0].y], [mouth[6].x,mouth[6].y])

    // get width of face
    const outline = resizedDetections.alignedRect;
    const faceWidth = outline.box._width; 
    
    const mouthSizeRelativeToFace = mouthWidth / faceWidth;// values vary from .33 to .38 based on lips

    // ToDo: Calibrate based on face

    // map mouth width to notes in array
    var note = Math.round(scale(mouthSizeRelativeToFace, .32, .39, 0, currPositionArray.length - 1));

    // change note visually and play
    if(currPositionArray[note] != undefined){
        document.querySelector("#note").innerHTML = currPositionArray[note];
        if(playing){
            trumpet.triggerRelease();
            trumpet.triggerAttack(currPositionArray[note]);
        }
    }

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    // faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  }, 100)
})