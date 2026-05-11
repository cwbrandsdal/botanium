$(document).ready(function () {
    var connection = new WebSocket('ws://'+location.hostname+':81/');
    var button_1_status = 0;
    var button_2_status = 0;
    var temp_data = 0;
    var hum_data = 0;
    connection.onmessage = function(event){
      var full_data = event.data;
      console.log(full_data);
      var data = JSON.parse(full_data);
      temp_data = data.temp;
      hum_data = data.hum;
      document.getElementById("temp_meter").value = temp_data;
      document.getElementById("temp_value").innerHTML = temp_data;
      document.getElementById("hum_meter").value = hum_data;
      document.getElementById("hum_value").innerHTML = hum_data;
    }
    function button_1_on()
    {
       button_1_status = 1; 
      console.log("LED 1 is ON");
      send_data();
    }
    function button_1_off()
    {
      button_1_status = 0;
    console.log("LED 1 is OFF");
    send_data();
    }
    function button_2_on()
    {
       button_2_status = 1; 
      console.log("LED 2 is ON");
      send_data();
    }
    function button_2_off()
    {
      button_2_status = 0;
    console.log("LED 2 is OFF");
    send_data();
    }
    function send_data()
    {
      var full_data = '{"LED1" :'+button_1_status+',"LED2":'+button_2_status+'}';
      connection.send(full_data);
    }
  
    let html_text = `
    <div class="row"><div class="col-md-3"><div id="chartTemp1"></div></div><div class="col-md-3"><div id="chartTemp2"></div></div><div class="col-md-3"><div id="chartBrightness"></div></div><div class="col-md-3"><div id="chartFanSpeed"></div></div></div>
    <div class="row">
      <div class="col-md-12">
        <h4 class="mb-3">Time</h4>
        <form action="/toggleairpump" method="GET">
        <div class="form-group">
       <label class="mb-1">Air pump</label>
       <small class="form-text text-muted"> - It is recommended that you keep the pump running at all time if you are using water as your grow medium. By the way, the time is now <span id="time-string">timeString</span>.</small>
       <div class="row">
           <div class="col-auto">
           <div class="custom-control custom-switch">
               <input type="checkbox" class="custom-control-input" ((airpumpStatus = 1) name="pumpStatus" id="pumpStatus">
               <label class="custom-control-label" for="pumpStatus"></label>
           </div>
           </div>
       </div>
       </div>
        </form>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <h4 class="mb-3">Time</h4>
        <form action="/setonofftimes" method="POST">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="firstName">Start time (HH:mm)</label>
              <input type="text" class="form-control timemask" name="start" value="startTimeFormatted">
            </div>
            <div class="col-md-6 mb-3">
              <label for="lastName">Stop time (HH:mm)</label>
              <input type="text" class="form-control timemask" name="stop" value="stopTimeFormatted">
            </div>
           <div class="col-md-12 mb-3">
                <label for="lastName">Time Zone</label>
              <select name="timezone" id="timezone" class="form-control"></select>
            </div>
          </div>
          <hr class="mb-4">
          <button class="btn btn-primary btn-lg btn-block" type="submit">Store start/stop times</button>
        </form>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <h4 class="mb-3">Settings</h4>
        <form action="/savesettings" method="POST">
           <div class="row">
             <div class="col-md-6 mb-3">
               <label for="firstName">LED MAX brightness (0 - 100)</label>
               <input type="text" class="form-control" name="ledPwmMax" value="ledPwmMax">
             </div>
             <div class="col-md-6 mb-3">
               <label for="firstName">Refresh interval (default: 1000)</label>
               <input type="text" class="form-control" name="refreshInterval" value="refreshInterval">
             </div>
           </div>
           <div class="row">
             <div class="col-md-6 mb-3">
               <label for="firstName">Clock tick timer (Should not be changed from 1000!)</label>
               <input type="text" class="form-control" name="ledPwmChangeInterval" value="ledPwmChangeInterval">
             </div>
             <div class="col-md-6 mb-3">
               <label for="firstName">LED brightness change steps (default: 10)</label>
               <input type="text" class="form-control" name="ledRampUpDownSteps" value="ledRampUpDownSteps">
             </div>
           </div>
           <div class="row">
             <div class="col-md-6 mb-3">
               <label for="firstName">LED fan temp upper limit in celcius (default: 30)</label>
               <input type="text" class="form-control" name="maxLedTemp" value="maxLedTemp">
             </div>
             <div class="col-md-6 mb-3">
               <label for="firstName">LED fan temp lower limit in celcius (default: 28)</label>
               <input type="text" class="form-control" name="minLedTemp" value="minLedTemp">
             </div>
           </div>
          <hr class="mb-4">
          <button class="btn btn-primary btn-lg btn-block" type="submit">Save settings</button>
        </form>
      </div>
    </div>`;


    $('#html-content').html(html_text);

    $.mask.definitions['H'] = "[0-2]";
    $.mask.definitions['h'] = "[0-9]";
    $.mask.definitions['M'] = "[0-5]";
    $.mask.definitions['m'] = "[0-9]";

    $(".timemask").mask("Hh:Mm");

    var zones = ["-12:00", "-11:00", "-10:00", "-09:50", "-09:00", "-08:00", "-07:00", "-06:00", "-05:00", "-04:50", "-04:00", "-03:50", "-03:00", "-02:00", "-01:00", "+00:00", "+01:00", "+02:00", "+03:00", "+03:50", "+04:00", "+04:50", "+05:00", "+05:50", "+05:75", "+06:00", "+06:50", "+07:00", "+08:00", "+08:75", "+09:00", "+09:50", "+10:00", "+10:50", "+11:00", "+11:50", "+12:00", "+12:75", "+13:00", "+14:00"];
    var names = ["(GMT -12:00) Eniwetok, Kwajalein", "(GMT -11:00) Midway Island, Samoa", "(GMT -10:00) Hawaii", "(GMT -9:30) Taiohae", "(GMT -9:00) Alaska", "(GMT -8:00) Pacific Time (US &amp; Canada)", "(GMT -7:00) Mountain Time (US &amp; Canada)", "(GMT -6:00) Central Time (US &amp; Canada), Mexico City", "(GMT -5:00) Eastern Time (US &amp; Canada), Bogota, Lima", "(GMT -4:30) Caracas", "(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz", "(GMT -3:30) Newfoundland", "(GMT -3:00) Brazil, Buenos Aires, Georgetown", "(GMT -2:00) Mid-Atlantic", "(GMT -1:00) Azores, Cape Verde Islands", "(GMT) Western Europe Time, London, Lisbon, Casablanca", "(GMT +1:00) Brussels, Copenhagen, Madrid, Paris, Ulnes <3", "(GMT +2:00) Kaliningrad, South Africa", "(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg", "(GMT +3:30) Tehran", "(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi", "(GMT +4:30) Kabul", "(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent", "(GMT +5:30) Bombay, Calcutta, Madras, New Delhi", "(GMT +5:45) Kathmandu, Pokhara", "(GMT +6:00) Almaty, Dhaka, Colombo", "(GMT +6:30) Yangon, Mandalay", "(GMT +7:00) Bangkok, Hanoi, Jakarta", "(GMT +8:00) Beijing, Perth, Singapore, Hong Kong", "(GMT +8:45) Eucla", "(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk", "(GMT +9:30) Adelaide, Darwin", "(GMT +10:00) Eastern Australia, Guam, Vladivostok", "(GMT +10:30) Lord Howe Island", "(GMT +11:00) Magadan, Solomon Islands, New Caledonia", "(GMT +11:30) Norfolk Island", "(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka", "(GMT +12:45) Chatham Islands", "(GMT +13:00) Apia, Nukualofa", "(GMT +14:00) Line Islands, Tokelau"];

    for (var i = 0; i < zones.length; i++) {
        $('<option/>').val(zones[i]).text(names[i]).appendTo('#timezone');
    }
    $('#timezone').val(setZone);

    $(document).on("click", "#pumpStatus", function () {
        $(this).closest("form").submit();
    });

    var chartTemp1 = c3.generate({
        bindto: '#chartTemp1',
        data: {
            columns: [
                ['Base temp (celcius)', currentTemp1]
            ],
            type: 'gauge'
        },
        gauge: {
                    label: {
            format: function(value, ratio) {
                return value;
            },
            show: false // to turn off the min/max labels.
        },
    min: 20, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
    max: 50, // 100 is default
   units: ' �',
    width: 39 // for adjusting arc thickness
        },
        color: {
            pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
            threshold: {
                            unit: 'value', // percentage is default
                max: 50, // 100 is default
                values: [30, 35, 40, 45]
            }
        },
        size: {
            height: 180
        }
    });
    var chartTemp2 = c3.generate({
        bindto: '#chartTemp2',
        data: {
            columns: [
                ['LED temp (celcius)', currentTemp2]
            ],
            type: 'gauge'
        },
        gauge: {
            label: {
                format: function (value, ratio) {
                    return value;
                },
                show: false // to turn off the min/max labels.
            },
            min: 20, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
            max: 50, // 100 is default
            units: ' �',
            width: 39 // for adjusting arc thickness
        },
        color: {
            pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
            threshold: {
                unit: 'value', // percentage is default
                max: 50, // 100 is default
                values: [35, 40, 45, 50]
            }
        },
        size: {
            height: 180
        }
    });

    var chartBrightness = c3.generate({
        bindto: '#chartBrightness',
        data: {
            columns: [
                ['LED Brightness', ledPwmValue]
            ],
            type: 'gauge'
        },
        gauge: {
            label: {
                format: function (value, ratio) {
                    return value;
                },
                show: false // to turn off the min/max labels.
            },
            min: 0, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
            max: 100, // 100 is default
            units: ' %',
            width: 39 // for adjusting arc thickness
        },
        color: {
            pattern: ['#007bff', '#007bff', '#007bff', '#007bff'], // the three color levels for the percentage values.
            threshold: {
                //unit: 'value', // percentage is default
               // max: 100, // 100 is default
                values: [30, 35, 40, 45]
            }
        },
        size: {
            height: 180
        }
    });

    var chartFanSpeed = c3.generate({
        bindto: '#chartFanSpeed',
        data: {
            columns: [
                ['LED fan speed', currentFanSpeed]
            ],
            type: 'gauge'
        },
        gauge: {
            label: {
                format: function (value, ratio) {
                    return value;
                },
                show: false // to turn off the min/max labels.
            },
            min: 0, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
            max: 100, // 100 is default
            units: ' %',
            width: 39 // for adjusting arc thickness
        },
        color: {
            pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
            threshold: {
                //unit: 'value', // percentage is default
                // max: 100, // 100 is default
                values: [70, 80, 90, 95]
            }
        },
        size: {
            height: 180
        }
    });

    var led_brightness = 0;

    setInterval(function () {
        $.get("/getstatus", function (data) {

            var data_temp1 = Math.round((data.TEMP1 + Number.EPSILON) * 100) / 100;
            if (currentTemp1 !== data_temp1) {
                chartTemp1.load({
                    columns: [['Base temp (celcius)', data_temp1]]
                });
            }
            currentTemp1 = data_temp1;

            var data_temp2 = Math.round((data.TEMP2 + Number.EPSILON) * 100) / 100;
            if (currentTemp2 !== data_temp2) {
                chartTemp2.load({
                    columns: [['LED temp (celcius)', data_temp2]]
                });
            }
            currentTemp2 = data_temp2;

            if (led_brightness !== data.LED_BRIGHTNESS) {
                chartBrightness.load({
                    columns: [['LED Brightness', data.LED_BRIGHTNESS]]
                });
            }
            led_brightness = data.LED_BRIGHTNESS;

            if (currentFanSpeed !== data.FAN_SPEED) {
                chartFanSpeed.load({
                    columns: [['LED fan speed', data.FAN_SPEED]]
                });
            }
            currentFanSpeed = data.FAN_SPEED;

            $("#time-string").text(data.TIME);

        });

    }, 1000);
});