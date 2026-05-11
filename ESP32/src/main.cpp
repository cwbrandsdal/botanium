#include <Arduino.h>
#include <WiFiManager.h>	 // https://github.com/tzapu/WiFiManager
#include <SparkFun_RV8803.h> //Get the library here:http://librarymanager/All#SparkFun_RV-8803
#include <WiFi.h>
#include <ESPmDNS.h>
#include <WebSocketsServer.h>
#include <ESPAsyncWebServer.h>
#include "FS.h"
#include "SPIFFS.h"
#include <ArduinoJson.h>
#include "time.h"
#include <WebServer.h>

// Pin definitions and SPIFFS settings
#define FORMAT_SPIFFS_IF_FAILED true
#define PUMP_PIN 21
#define RTC_INT_PIN 17
// Uncomment the following line to enable ESP32 Debug Output to serial
//#define DEBUG

// Forward declerations
void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length);
void notFound(AsyncWebServerRequest *request);
void readSettings();
void writeSettings();
void sendSettingsToClient();
String processor(const String &var);
void SetRTCToCurrentTime();
void rtcInterrupt();

// Struct for holding settings
struct Config
{
	int interval;
	int duration;
};

Config config;

// RTC - Real Time Clock
RV8803 rtc;
const char *ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 3600;
struct tm currentTimeInfo;

// Interrupt flag
bool intFlag = false;
bool isPumpActive = false;

// Counters used for counting seconds
int intervalCounter = 0;
int durationCounter = 0;

// Holds the part and file name for the settings file stored in SPIFFS
const char *settingsFilePathAndName = "/settings.json";
const char *wifiPortalSsid = "mtnLab-Botanium";
const char *wifiPortalPassword = "change-me";

// Defining Async webserver for hosting the settings page on port 80
AsyncWebServer server(80);
// Defining websocket server for realtime communications on port 81
WebSocketsServer webSocket = WebSocketsServer(81);
// Defining webserver for hosting the firmware update page on port 82
WebServer updateServer(82);

// Char that holds the initial HTML markup for settings page
// Most of the code will come from the included scripts hosted on brandsdal.io
char webpage[] PROGMEM = R"=====(
<!DOCTYPE html>
<html>
<head>
  <title>mtnLab Botanium</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://brandsdal.io/botanium/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.15/c3.min.css" rel="stylesheet">
</head>

<body class="bg-light">
  <div class="container">
    <div class="py-5 text-center"><img class="d-block mx-auto mb-4" src="https://brandsdal.io/botanium/logo.png" alt=""
        width="150">
      <h2>Configure your garden</h2>
      <p class="lead">Below is the form where you set up your Botanium. The default settings will work, but feel free to
        play with it. :-)</p>
    </div>
    <div id="html-content"></div>
    <footer class="my-5 pt-5 text-muted text-center text-small">
      <p class="mb-1">mtnLab | Christopher Brandsdal</p>
    </footer>
  </div>
  <script>
  var interval = %INTERVAL%;
  var duration = %DURATION%;
  </script>
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
  <script src="https://brandsdal.io/botanium/js/bootstrap.bundle.min.js"></script>
  <script src="https://brandsdal.io/botanium/jquery.maskedinput.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js" charset="utf-8"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.15/c3.min.js"></script>
  <script src="https://brandsdal.io/botanium/script.js"></script>
</body>

</html>
)=====";

// Char that holds the HTML markup for firmware update page
const char *serverIndex =
	"<script src='https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js'></script>"
	"<form method='POST' action='#' enctype='multipart/form-data' id='upload_form'>"
	"<input type='file' name='update'>"
	"<input type='submit' value='Update'>"
	"</form>"
	"<div id='prg'>progress: 0%</div>"
	"<script>"
	"$('form').submit(function(e){"
	"e.preventDefault();"
	"var form = $('#upload_form')[0];"
	"var data = new FormData(form);"
	" $.ajax({"
	"url: '/update',"
	"type: 'POST',"
	"data: data,"
	"contentType: false,"
	"processData:false,"
	"xhr: function() {"
	"var xhr = new window.XMLHttpRequest();"
	"xhr.upload.addEventListener('progress', function(evt) {"
	"if (evt.lengthComputable) {"
	"var per = evt.loaded / evt.total;"
	"$('#prg').html('progress: ' + Math.round(per*100) + '%');"
	"}"
	"}, false);"
	"return xhr;"
	"},"
	"success:function(d, s) {"
	"console.log('success!')"
	"},"
	"error: function (a, b, c) {"
	"}"
	"});"
	"});"
	"</script>";

void setup()
{
	// Setting up serial communtication
	Serial.begin(115200);

#ifdef DEBUG
	Serial.setDebugOutput(true);
#endif

	// Defines pin modes
	pinMode(LED_BUILTIN, OUTPUT);
	pinMode(PUMP_PIN, OUTPUT);
	pinMode(RTC_INT_PIN, INPUT_PULLUP);

	// Sets pump off initially
	digitalWrite(PUMP_PIN, LOW);

	// Starts up Wire for i2c communication
	Wire.begin();

	// WiFiManager, Local intialization. Once its business is done, there is no need to keep it around
	WiFiManager wm;

	bool res;
	res = wm.autoConnect(wifiPortalSsid, wifiPortalPassword); // password protected ap

	Serial.println("");

	// Starts SPIFFS for settings storage
	if (!SPIFFS.begin(FORMAT_SPIFFS_IF_FAILED))
	{
		Serial.println("SPIFFS Mount Failed");
		return;
	}
	
	// Starts RTC - Real Time Clock
	if (rtc.begin() == false)
	{
		Serial.println("Something went wrong, check wiring");
	}
	else
	{
		Serial.println("RTC online!");
	}
	Serial.println("");

	if (!res)
	{
		Serial.println("Failed to connect");
		digitalWrite(LED_BUILTIN, LOW);
	}
	else
	{
		// if you get here you have connected to the WiFi
		Serial.println("Connected to WIFI. Woho! :)");
		digitalWrite(LED_BUILTIN, HIGH);
	}

	Serial.println("");
	Serial.println("Starting mtnLab Botanium <3");
	Serial.println("");
	Serial.print("IP address: ");

	// Prints LAN IP address
	IPAddress ip = WiFi.localIP();
	Serial.println(ip);
	Serial.println("");
	WiFi.mode(WIFI_STA);

	// Sets up Multicast DNS for the url http://mtnlab-botanium.local
	if (!MDNS.begin("mtnlab-botanium"))
	{
		Serial.println("Error setting up MDNS responder!");
	}
	else
	{
		Serial.println("mDNS responder started");
	}
	Serial.println("");

	// Init and get the time from web
	configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
	SetRTCToCurrentTime();
	Serial.println("");

	// Setting up endpoints for settings website
	server.on("/", [](AsyncWebServerRequest *request)
			  { request->send_P(200, "text/html", webpage, processor); });

	server.onNotFound(notFound);

	// Starting settings webserver
	server.begin();

	// Starting websocket server and attaches onEvent handler
	webSocket.begin();
	webSocket.onEvent(webSocketEvent);

	// Setting up endpoints for firmware update website
	updateServer.on("/", HTTP_GET, []()
					{
    updateServer.sendHeader("Connection", "close");
    updateServer.send(200, "text/html", serverIndex); });
	/*handling uploading firmware file */
	updateServer.on(
		"/update", HTTP_POST, []()
		{
			updateServer.sendHeader("Connection", "close");
			updateServer.send(200, "text/plain", (Update.hasError()) ? "FAIL" : "OK");
			ESP.restart(); 
		},
		[]()
		{
			HTTPUpload &upload = updateServer.upload();
			if (upload.status == UPLOAD_FILE_START)
			{
				Serial.printf("Update: %s\n", upload.filename.c_str());
				if (!Update.begin(UPDATE_SIZE_UNKNOWN))
				{ // start with max available size
					Update.printError(Serial);
				}
			}
			else if (upload.status == UPLOAD_FILE_WRITE)
			{
				/* flashing firmware to ESP*/
				if (Update.write(upload.buf, upload.currentSize) != upload.currentSize)
				{
					Update.printError(Serial);
				}
			}
			else if (upload.status == UPLOAD_FILE_END)
			{
				if (Update.end(true))
				{ // true to set the size to the current progress
					Serial.printf("Update Success: %u\nRebooting...\n", upload.totalSize);
				}
				else
				{
					Update.printError(Serial);
				}
			}
		});

	// Starting firmware update webserver
	updateServer.begin();

	// Reads settings from storage before we do anything
	readSettings();

	// Attach interrupt for RTC - Real Time Clock
	attachInterrupt(digitalPinToInterrupt(RTC_INT_PIN), rtcInterrupt, FALLING);

	// CLears RTC and configures a 1 sec interrupt timer
	rtc.disableAllInterrupts();
	rtc.clearAllInterruptFlags();							  // Clear all flags in case any interrupts have occurred.
	rtc.setPeriodicTimeUpdateFrequency(TIME_UPDATE_1_SECOND); // Can also use TIME_UPDATE_1_MINUTE (TIME_UPDATE_1_SECOND = false, TIME_UPDATE_1_MINUTE = true)
	rtc.enableHardwareInterrupt(UPDATE_INTERRUPT);			  // The update interrupt needs to have the hardware interrupt enabled to function
	Serial.println("Started RTC timer");

	// Starts initial watering cycle
	isPumpActive = true;
	digitalWrite(PUMP_PIN, HIGH);
	Serial.printf("Starting pump for %d seconds\r\n", config.duration);
}

void loop()
{
	// Keeps websocket and firmware update server alive
	webSocket.loop();
	updateServer.handleClient();

	// Checks seconds counters and triggers pump if criteria is met
	if (intervalCounter >= (config.interval * 60) && !isPumpActive)
	{
		// Starting up the pump
		isPumpActive = true;
		digitalWrite(PUMP_PIN, HIGH);

		Serial.printf("Starting pump for %d seconds\r\n", config.duration);

		// Resets counters
		intervalCounter = 0;
		durationCounter = 0;
	}

	if (durationCounter == config.duration && isPumpActive)
	{
		// Stopping the pump
		isPumpActive = false;
		digitalWrite(PUMP_PIN, LOW);

		Serial.printf("Stopping pump and waiting for %d minutes\r\n", config.interval);

		// Resets counters
		intervalCounter = 0;
		durationCounter = 0;
	}
}

// Websocket event for saving settings and basic communication
void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length)
{
	switch (type)
	{
	case WStype_DISCONNECTED:
		Serial.printf("[%u] Disconnected!\n", num);
		break;
	case WStype_CONNECTED:
	{
		IPAddress ip = webSocket.remoteIP(num);
		Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);

		// send message to client
		webSocket.sendTXT(num, "Connected");
	}
	break;
	case WStype_TEXT:
	{
		Serial.printf("[%u] get Text: %s\n", num, payload);
		String message = String((char *)(payload));
		if (message == "GET_SETTINGS")
		{
			sendSettingsToClient();
		}
		else
		{
			StaticJsonDocument<200> doc;

			// Deserialize the JSON document
			DeserializationError error = deserializeJson(doc, payload);
			if (error)
				Serial.println(F("Failed to read file, using default configuration"));

			// Copy values from the JsonDocument to the Config
			config.interval = doc["interval"] | 60;
			config.duration = doc["duration"] | 10;

			writeSettings();

			durationCounter = 0;
			intervalCounter = 0;
			isPumpActive = false;
			digitalWrite(PUMP_PIN, LOW);

			Serial.printf("Starting pump for from %d seconds\r\n", config.duration);
		}
		break;
	}
	case WStype_BIN:
		Serial.printf("[%u] get binary length: %u\n", num, length);
		break;
	case WStype_ERROR:
	case WStype_FRAGMENT_TEXT_START:
	case WStype_FRAGMENT_BIN_START:
	case WStype_FRAGMENT:
	case WStype_FRAGMENT_FIN:
		break;
	}
}

// Not found handler
void notFound(AsyncWebServerRequest *request)
{
	request->send(404, "text/plain", "Page Not found");
}

// Replaces placeholder with values in HTML markup. A simple way to inject variables into the template
String processor(const String &var)
{
	if (var == "INTERVAL")
	{
		return String(config.interval);
	}
	else if (var == "DURATION")
	{
		return String(config.duration);
	}
	return String();
}

// Reads settings from SPIFFS
void readSettings()
{
	Serial.printf("Reading file: %s\r\n", settingsFilePathAndName);

	File file = SPIFFS.open(settingsFilePathAndName);
	if (!file || file.isDirectory())
	{
		Serial.println("− failed to open file for reading");
		return;
	}

	// Allocate a temporary JsonDocument
	// Don't forget to change the capacity to match your requirements.
	// Use arduinojson.org/v6/assistant to compute the capacity.
	StaticJsonDocument<200> doc;

	// Deserialize the JSON document
	DeserializationError error = deserializeJson(doc, file);
	if (error)
		Serial.println(F("Failed to read file, using default configuration"));

	// Copy values from the JsonDocument to the Config
	config.interval = doc["interval"] | 60;
	config.duration = doc["duration"] | 10;

	// Close the file (Curiously, File's destructor doesn't close the file)
	file.close();
}

// Writes settings to SPIFFS
void writeSettings()
{
	Serial.printf("Writing file: %s\r\n", settingsFilePathAndName);

	// Allocate a temporary JsonDocument
	// Don't forget to change the capacity to match your requirements.
	// Use arduinojson.org/v6/assistant to compute the capacity.
	StaticJsonDocument<200> doc;
	doc["interval"] = config.interval;
	doc["duration"] = config.duration;
	serializeJson(doc, Serial);

	// Opens file from SPIFFS
	File file = SPIFFS.open(settingsFilePathAndName, FILE_WRITE);
	if (!file)
	{
		Serial.println("− failed to open file for writing");
		return;
	}

	// Serialize JSON to file
	if (serializeJson(doc, file) == 0)
	{
		Serial.println(F("Failed to write to file"));
	}

	// Close the file
	file.close();
}

// Sends settings as JSON to the website via websocket
void sendSettingsToClient()
{
	String jsonToClient;
	StaticJsonDocument<200> doc;
	doc["interval"] = config.interval;
	doc["duration"] = config.duration;
	serializeJson(doc, jsonToClient);

	webSocket.broadcastTXT(jsonToClient);
}

// Function to update the RTC to the current time from
void SetRTCToCurrentTime()
{
	time_t now;

	if (!getLocalTime(&currentTimeInfo))
	{
		Serial.println("Failed to obtain time");
		return;
	}

	Serial.println(&currentTimeInfo, "Current time: %A, %B %d %Y %H:%M:%S");

	time(&now);
	rtc.setEpoch(now);
}

// The function called from the hardware interrupt RTC timer
void rtcInterrupt()
{
	intFlag = true;
	durationCounter++;
	intervalCounter++;
}
