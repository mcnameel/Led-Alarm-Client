/* This file contains the code to be run by my RaspberryPi */

// Message Queuing Telemetry Transport Protocol (MQTT) is the standard 
// alternative to HTTP for IOT devices. We will use it to communicate our
// alarm data from our server to our microcontroller or 
var mqtt = require('mqtt')
var Gpio = require('pigpio').Gpio
var fs   = require('fs')

const TOPIC = 'alarm' // All messages for communicating alarms
const DEBUG_TOPIC = 'debug' // All messages printed for debugging purposes
const REQUEST_TOPIC = 'request' // All messages for requesting events
const DEVICE = 'RaspberryPi' // Which device is this?

// Create a set to store all the timestamp of when to activate
var comingEvents = new Set()

// For each color you need to specify on what GPIO pin is connected and that we
//   will use in mode OUTPUT
var ledRed = new Gpio(22, {mode: Gpio.OUTPUT}); // set the red led to pin #22
var ledGreen = new Gpio(17, {mode: Gpio.OUTPUT});// set the green led to pin #17
var ledBlue = new Gpio(24, {mode: Gpio.OUTPUT});// set the blue led to pin #24

/* On Start */
testLEDs(); // Make quick test for the leds
 
// Load client secrets from a local file.
fs.readFile('mqtt_credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials
  var mqtt_cred = JSON.parse(content)
  const {broker_url, client_username, client_password} = mqtt_cred
    
  client = mqtt.connect(broker_url, {
    username: client_username,
    password: client_password
  })
     
  // When we connect to the server subscribe to the topic for debug and main topics
  client.on('connect', function () {
    console.log(DEVICE + ' is connected to MQTT')

     // Connect to debug topic
    client.subscribe(DEBUG_TOPIC)
    client.publish(DEBUG_TOPIC, DEVICE + ' began listening to topic: ' + 
      TOPIC + ' at ' + new Date().toString())

    // Connect to alarm topic
    client.subscribe(TOPIC)

    client.publish(REQUEST_TOPIC, 'RequestEvents')

    // Request upcoming events 
    setInterval(() => client.publish(REQUEST_TOPIC, 'RequestEvents'), 30000)
    // Check if the alarms have past their date 
    setInterval(checkAlarm, 7000)
  })

  client.on('message', function(topic, message) { 
    if(topic == TOPIC) {// if topic is alarm, wait for alarm
      if(!(message == 'RequestEvents')) {
        console.log(`\nReceived: ${message.toString()}`) 
        addToEvents(new Date(message))
      }
    }
   // else if(topic == DEBUG_TOPIC) // if topic is debug print debug message
   //console.log(message)
  })
}); 
/* On Start Finish */

/**
* calculates how long the Pi needs to wait before activating the Leds
* @param {Date} startDate The starting time of the event
*/
function addToEvents(startDate) {
console.log(`look here ${startDate}`)
var startTime = startDate.getTime(); 
if(!comingEvents.has(startTime)) {
comingEvents.add(startTime)
console.log(`\nAdded ${startTime} alarms`)
}
}

/**
 * recursivelty calls iteself to activate the leds slowly
 * @param {int} r - The desired red value | default: 0
 * @param {int} g - The desired green value | default: 0
 * @param {int} b - The desired blue value | default: 0
 * @param {int} speed - The delay between increasing value | default: 50
 */
function increaseLEDs(r = 0, g = 0, b = 0, speed = 50) {
  if (r === 0 && g === 0 && b === 0)
	console.log('pew pew lights')
	
  ledRed.pwmWrite(r)
  ledGreen.pwmWrite(g)
  ledBlue.pwmWrite(b)
  
  if(r < 255) // first incremement the red value until at max then same for b, g
	setTimeout(() => increaseLEDs(r + 5, g, b, speed), speed);
  else if(b < 255)
	setTimeout(() => increaseLEDs(r, g, b + 5, speed), speed);
  else if(g < 255)
	setTimeout(() => increaseLEDs(r, g + 5, b, speed), speed);
  else { 
	//time to go back to black
	setTimeout(() => setLEDs(), 3000)
	return;
  }
}

/**
* Checks if the alarms are past their date then activates the alarms if they 
* are past their time to activate it sets them off
*/
function checkAlarm() {
  setLEDs() // set leds to 0 for convienience
  console.log('\nChecking Alarms')
  var dateNow = new Date()        // get current dateTime
  var timeNow = dateNow.getTime() // get current date in the form of a timestamp
  
  // holds the alarms that we will remove after they have been activated
  var removeUs = [] 
  
  // For each time in our set of timestamps see if it is time to activate 
  comingEvents.forEach(function(element) {
    // if the current time is greater than the time of the alarm then it is 
    //    time to activate the alarm
    if(timeNow > element) {  
      console.log('Activating Alarm')
      increaseLEDs();
       // push to list to signify the alarm has been handled
      removeUs.push(element);    
    } else { // calculate time until alarm sounds
	  const timeLeft = element - timeNow
	  console.log(`${timeLeft}ms until alarm activation`)
    }
  });
  removeUs.forEach(function(element) { // remove all activated alarms
	console.log(`removing ${element} from comingEvents`)
	comingEvents.delete(element)
  })
}

/**
 * set the LEDs to the given values
 * @param {int} r - The desired red value | default: 0
 * @param {int} g - The desired green value | default: 0
 * @param {int} b - The desired blue value | default: 0
 */
function setLEDs(r = 0, g = 0, b = 0) {
  ledRed.pwmWrite(r)
  ledBlue.pwmWrite(g)
  ledGreen.pwmWrite(b)
}
 
/**
 * Sends GPIO signals to light up the leds to test their functionality
 */
function testLEDs() {
  // Set all LEDs to 0 (off)
  setLEDs()

  console.log('Test red');
  // Turn on red led then wait 500ms before setting to off
  ledRed.pwmWrite(255);
  setTimeout(function() { 
    ledRed.pwmWrite(0)
    console.log('Test green');
    // Turn on green led then wait 500ms before setting to off
    ledGreen.pwmWrite(255);
    setTimeout(function() { 
      ledBlue.pwmWrite(0), 500
      console.log('Test blue');
      // Turn on blue led then wait 500ms before setting to off
      ledBlue.pwmWrite(255);
      setTimeout(() => ledGreen.pwmWrite(0), 500)
    }, 500)
  }, 500)
  
  // After the test turn them off
  setTimeout(() => increaseLEDs(), 1000);
}
