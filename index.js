var Alexa = require("alexa-sdk");
var RapidAPI = require('rapidapi-connect');
var rapid = new RapidAPI("Demo", "###########################");
var ICAO = require('./airlineICAO.js');
var IATA = require('./airlineIATA.js');
var dateFormat = require('dateformat');

var handlers = {
  'LaunchRequest': function() {
    this.emit(':ask', "Welcome to the Departure Time skill. Ask something like 'what is the estimated departure time for Emirates flight EK204?'");
  },

  'FlightStatus': function() {
    var airline = this.event.request.intent.slots.Airline.value;
        airline = airline.charAt(0).toUpperCase() + airline.slice(1);
    var flightNumber = IATA[airline] + this.event.request.intent.slots.FlightNumber.value;

    rapid.call('LaminarFlightData', 'getFlightsByAirline', {
    	'userKey': '###########################',
    	'airlinePrefix': ICAO[airline]

    }).on('success', (payload) => {
      var flightList = payload["message:flightMessage"]["fx:Flight"];
      var nextFlight = "";

      for (var i = 0; i < flightList.length; i++) {
        if (flightList[i]["fx:flightIdentification"][0].$.iataFlightNumber === flightNumber) {
          var testTime = flightList[i]["fx:departure"][0]["fx:departureFixTime"][0]["fb:estimated"][0].$.timestamp;
          if (nextFlight === "" || testTime > nextFlight) {
            nextFlight = flightList[i];
          }
        }
      }

      var estimatedTime = nextFlight["fx:departure"][0]["fx:departureFixTime"][0]["fb:estimated"][0].$.timestamp;
      var initialTime = nextFlight["fx:departure"][0]["fx:departureFixTime"][0]["fb:initial"][0].$.timestamp;
      var time = new Date(initialTime).getMinutes() - new Date(estimatedTime).getMinutes();

      this.emit(":tell", airline + " flight " + flightNumber + " is estimated to depart at " + dateFormat(estimatedTime, "dddd, mmmm dS, yyyy, h:MM:ss TT") + ", " + time + " minutes later then the original departure time.");
    }).on('error', (payload) => {
    	 this.emit(":tell", "Sorry, there was an error finding that flight.");
    });
  }
};

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = "##########################";
    alexa.registerHandlers(handlers);
    alexa.execute();
};
