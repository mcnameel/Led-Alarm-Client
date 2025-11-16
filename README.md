> **Note:** This project was created in 2018 as a class project to work with IOT technologies. It is no longer actively maintained.

# Led-Alarm-Client
The code for the RaspberryPi that will listen for messages through MQTT for when to wake me up in the morning

Known bugs:
  will occationally crash randomly with 
	"sigHandler: Unhandled signal 2, terminating"



Run: 
	npm init
	npm install mqtt --save
	npm install pigpio --save

  Just as with the webservice we must make a "mqtt_credentials.json"
  This file just needs a single json object:
 		{
		   "broker_url" : "insert url here"
		   "client_username" : "put your username here	
         	   "client_password" : "put your password here"
		}
  save the file in the working directory and then run with "node index.js"

	*note you may need to run with sudo (ie. "sudo node index.js")
	sudo node index.js

Enjoy!
