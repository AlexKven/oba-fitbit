import document from "document";
import * as messaging from "messaging";

// let background = document.getElementById("background");

console.log(document.getElementById("arrivalsPage").style.display);

var currentArrivals = [];

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

function setPageVisibility(page, pageName) {
  if (page.id == pageName)
    page.style.display = "inline";
  else
    page.style.display = "none";
}

function showPage(pageName) {
  setPageVisibility(document.getElementById("arrivalsPage"), pageName);
  setPageVisibility(document.getElementById("spinnerPage"), pageName);

  document.getElementById("spinner").state = (pageName === "spinnerPage") ? "enabled" : "disabled";
}

function setArrivalsView(arrivals)
{
  var listElement = document.getElementById("arrivalsList");
  var itemElements = listElement.getElementsByClassName("tile-list-item");
  for (var i = 0; i < 10; i++)
  {
    if (arrivals.length > i)
    {
      var textElement = itemElements[i + 1].getElementsByTagName("text")[0];
      textElement.text = `${arrivals[i].route}: ${arrivals[i].mins}`;
      itemElements[i + 1].style.display = "inline";
    }
    else
    itemElements[i + 1].style.display = "none";
  }
}

showPage("spinnerPage");

// Message is received
messaging.peerSocket.onmessage = evt => {
  console.log(`App received: ${JSON.stringify(evt)}`);
  if (evt.data.key === "color" && evt.data.newValue) {
    let color = JSON.parse(evt.data.newValue);
    console.log(`Setting background color: ${color}`);
    // background.style.fill = color;
  }
  else if (evt.data && evt.data.command == "getStopArrivals")
  {
    setArrivalsView(evt.data.data);
    showPage("arrivalsPage");
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