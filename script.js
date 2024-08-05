let tapTimes = [];
const bpmDisplay = document.getElementById("bpmDisplay");
let midiAccess = null;
let outputDevice = null;

document.body.onkeyup = function (e) {
  if (e.keyCode == 32) {
    // Spacebar key code
    const currentTime = Date.now();
    tapTimes.push(currentTime);

    // Limit the number of tap times stored to avoid memory overflow
    if (tapTimes.length > 10) {
      tapTimes.shift();
    }

    if (tapTimes.length > 4) {
      // Minimum 4 presses to display BPM
      calculateBPM();
    } else {
      bpmDisplay.textContent = "..."; // Indicate that more presses are needed
    }
  }
};

function calculateBPM() {
  const timeIntervals = tapTimes
    .slice(1)
    .map((time, index) => time - tapTimes[index]);
  const averageInterval =
    timeIntervals.reduce((acc, curr) => acc + curr) / timeIntervals.length;
  const bpm = (60000 / averageInterval).toFixed(2); // Calculate BPM and format to 2 decimal places

  bpmDisplay.textContent = bpm;
  sendMIDITempo(bpm);
}

// Initialize MIDI
function initMIDI() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  } else {
    console.warn("Web MIDI API not supported in this browser.");
  }
}

function onMIDISuccess(midi) {
  midiAccess = midi;
  const outputs = midiAccess.outputs.values();
  for (let output of outputs) {
    outputDevice = output;
    break; // Use the first available output device
  }
  console.log("MIDI initialized successfully.");
}

function onMIDIFailure() {
  console.warn("Could not access your MIDI devices.");
}

function sendMIDITempo(bpm) {
  if (outputDevice) {
    const tempo = Math.round(60000000 / bpm); // Convert BPM to microseconds per quarter note
    const tempoBytes = [
      (tempo >> 16) & 0xff,
      (tempo >> 8) & 0xff,
      tempo & 0xff,
    ];
    const midiMessage = [
      0xf0, // SysEx start
      0x7f, // Real-Time
      0x7f, // Device ID (All devices)
      0x03, // Sub-ID #1 (MIDI Time Code)
      0x02, // Sub-ID #2 (Set Tempo)
      ...tempoBytes,
      0xf7, // SysEx end
    ];
    console.log("Sending MIDI message:", midiMessage);
    outputDevice.send(midiMessage);
  }
}

initMIDI();
