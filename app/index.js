import document from "document";
import * as messaging from "messaging";

let background = document.getElementById("background");

let VTList = document.getElementById("my-list");

let NUM_ELEMS = 100;

VTList.delegate = {
  getTileInfo: function(index) {
    return {
      type: "my-pool",
      value: "Menu item",
      index: index
    };
  },
  configureTile: function(tile, info) {
    if (info.type == "my-pool") {
      tile.getElementById("text").text = `${info.value} ${info.index}`;
      let touch = tile.getElementById("touch-me");
      touch.onclick = evt => {
        console.log(`touched: ${info.index}`);
      };
    }
  }
};

function sendCommand(command,data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
    messaging.peerSocket.send({
      command: command,
      data:data
    });
  }else{
    console.log("Peer socket not open");
  }
}


// VTList.length must be set AFTER VTList.delegate
VTList.length = NUM_ELEMS;

// Message is received
messaging.peerSocket.onmessage = evt => {
  console.log(`App received: ${JSON.stringify(evt)}`);
  if (evt.data.key === "color" && evt.data.newValue) {
    let color = JSON.parse(evt.data.newValue);
    console.log(`Setting background color: ${color}`);
    background.style.fill = color;
  }
};

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("App Socket Open");
  sendCommand("getStopArrivals", "");
};

// Message socket closes
messaging.peerSocket.onclose = () => {
  console.log("App Socket Closed");
};