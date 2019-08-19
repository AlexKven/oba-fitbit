import document from "document";
import * as messaging from "messaging";

let background = document.getElementById("background");

let VTList = document.getElementById("my-list");

let NUM_ELEMS = 100;

var currentArrivals = [];

VTList.delegate = {
  getTileInfo: function(index) {
    return currentArrivals[index];
  },
  configureTile: function(tile, info) {
    console.log(JSON.stringify(tile));
    tile.getElementById("text").text = `${tile.route}: ${tile.mins}`;
    let touch = tile.getElementById("touch-me");
    touch.onclick = evt => {
      console.log(`touched: ${tile.destination}`);
    };
  }
};

var pendingRequests = [];

sendCommand("getStopArrivals", "");

function sendCommand(command,data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
    messaging.peerSocket.send({
      command: command,
      data:data
    });
  }else{
    pendingRequests.push({command: command, data: data});
  }
}

// Message is received
messaging.peerSocket.onmessage = evt => {
  console.log(`App received: ${JSON.stringify(evt)}`);
  if (evt.data.key === "color" && evt.data.newValue) {
    let color = JSON.parse(evt.data.newValue);
    console.log(`Setting background color: ${color}`);
    background.style.fill = color;
  }
  else if (evt.data && evt.data.command == "getStopArrivals")
  {
    currentArrivals = evt.data.data;
    console.log(currentArrivals.length);
    VTList.length = currentArrivals.length;
  }
};

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("App Socket Open");
  for (var i = 0; i < pendingRequests.length; i++)
  {
    var next = pendingRequests[i];
    sendCommand(next.command, next.data);
  }
  pendingRequests = [];
};

// Message socket closes
messaging.peerSocket.onclose = () => {
  console.log("App Socket Closed");
};