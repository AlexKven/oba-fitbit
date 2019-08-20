import * as messaging from "messaging";
import { settingsStorage } from "settings";

var pendingRequests = [];

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

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("Companion Socket Open");
  restoreSettings();
  for (var i = 0; i < pendingRequests.length; i++)
  {
    var next = pendingRequests[i];
    sendCommand(next.command, next.data);
  }
  pendingRequests = [];
};

// Message socket closes
messaging.peerSocket.onclose = () => {
  console.log("Companion Socket Closed");
};

messaging.peerSocket.onmessage = evt => {
  if (evt.data && evt.data.command == "getStopArrivals")
  {
    getStopArrivals();
  }
}

// A user changes settings
settingsStorage.onchange = evt => {
  let data = {
    key: evt.key,
    newValue: evt.newValue
  };
  sendVal(data);
};

// Restore any previously saved settings and send to the device
function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    let key = settingsStorage.key(index);
    if (key) {
      let data = {
        key: key,
        newValue: settingsStorage.getItem(key)
      };
      sendVal(data);
    }
  }
}

// Send data to device using Messaging API
function sendVal(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  }
}

function getStopArrivals()
{
  var url = "https://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/1_490.xml?key=TEST";
  fetch(url).then(res => res.text()).then(txt => 
    {
      var parser = new DOMParser();
      var doc = parser.parseFromString(txt, "text/xml");
      doc = doc.getElementsByTagName("response")[0];
      var curTime = doc.getElementsByTagName("currentTime")[0].childNodes[0].nodeValue;
      doc = doc.getElementsByTagName("data")[0].getElementsByTagName("entry")[0];
      var arrivals = doc.getElementsByTagName("arrivalsAndDepartures")[0].getElementsByTagName("arrivalAndDeparture");
      var result = [];

      for (var i = 0; i < arrivals.length; i++)
      {
        if (result.length < 10)
        {
          var arrivalDoc = arrivals[i];
          var arrTime = arrivalDoc.getElementsByTagName("predictedArrivalTime")[0].childNodes[0].nodeValue;
          var schedTime = arrivalDoc.getElementsByTagName("scheduledArrivalTime")[0].childNodes[0].nodeValue;
          var arrival = {
            route: arrivalDoc.getElementsByTagName("routeShortName")[0].childNodes[0].nodeValue,
            destination: arrivalDoc.getElementsByTagName("tripHeadsign")[0].childNodes[0].nodeValue,
            predicted: (arrTime == 0) ? false : true,
            mins: Math.round((((arrTime == 0) ? schedTime : arrTime) - curTime) / 60000)
          }
          result.push(arrival);
        }
      }
      
      sendCommand("getStopArrivals", result);
    });
  }