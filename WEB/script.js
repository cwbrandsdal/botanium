var connection = new WebSocket('ws://' + location.hostname + ':81/');

connection.onopen = (event) => {
  connection.send("GET_SETTINGS");
};

connection.onmessage = function (event) {
  var full_data = event.data;
  console.log(full_data);

  if (isJsonString(full_data)) {
    var data = JSON.parse(full_data);
    interval = data.interval;
    duration = data.duration;
    document.getElementById("interval").value = interval;
    document.getElementById("duration").value = duration;
  }
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function send_data() {
  var full_data = '{"interval" :' + document.getElementById("interval").value + ',"duration":' + document.getElementById("duration").value + '}';
  connection.send(full_data);
}

$(document).ready(function () {
  let html_text = `
  <div class="row"><div class="col-md-3"><div id="chartTemp1"></div></div><div class="col-md-3"><div id="chartTemp2"></div></div><div class="col-md-3"><div id="chartBrightness"></div></div><div class="col-md-3"><div id="chartFanSpeed"></div></div></div>
  <div class="row">
    <div class="col-md-12">
      <h4 class="mb-3">Settings</h4>
         <div class="row">
           <div class="col-md-6 mb-3">
             <label for="firstName">Interval i minutes (default: 60)</label>
             <input type="text" class="form-control" id="interval" name="interval" value="">
           </div>
           <div class="col-md-6 mb-3">
             <label for="firstName">Duration in seconds (default: 10)</label>
             <input type="text" class="form-control" id="duration" name="duration" value="">
           </div>
         </div>
        <hr class="mb-4">
        <button class="btn btn-primary btn-lg btn-block" type="button" onclick="send_data()">Save settings</button>
    </div>
  </div>`;

  $('#html-content').html(html_text);

  // var chartTemp1 = c3.generate({
  //   bindto: '#chartTemp1',
  //   data: {
  //     columns: [
  //       ['Base temp (celcius)', currentTemp1]
  //     ],
  //     type: 'gauge'
  //   },
  //   gauge: {
  //     label: {
  //       format: function (value, ratio) {
  //         return value;
  //       },
  //       show: false // to turn off the min/max labels.
  //     },
  //     min: 20, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  //     max: 50, // 100 is default
  //     units: ' �',
  //     width: 39 // for adjusting arc thickness
  //   },
  //   color: {
  //     pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
  //     threshold: {
  //       unit: 'value', // percentage is default
  //       max: 50, // 100 is default
  //       values: [30, 35, 40, 45]
  //     }
  //   },
  //   size: {
  //     height: 180
  //   }
  // });
  // var chartTemp2 = c3.generate({
  //   bindto: '#chartTemp2',
  //   data: {
  //     columns: [
  //       ['LED temp (celcius)', currentTemp2]
  //     ],
  //     type: 'gauge'
  //   },
  //   gauge: {
  //     label: {
  //       format: function (value, ratio) {
  //         return value;
  //       },
  //       show: false // to turn off the min/max labels.
  //     },
  //     min: 20, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  //     max: 50, // 100 is default
  //     units: ' �',
  //     width: 39 // for adjusting arc thickness
  //   },
  //   color: {
  //     pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
  //     threshold: {
  //       unit: 'value', // percentage is default
  //       max: 50, // 100 is default
  //       values: [35, 40, 45, 50]
  //     }
  //   },
  //   size: {
  //     height: 180
  //   }
  // });

  // var chartBrightness = c3.generate({
  //   bindto: '#chartBrightness',
  //   data: {
  //     columns: [
  //       ['LED Brightness', ledPwmValue]
  //     ],
  //     type: 'gauge'
  //   },
  //   gauge: {
  //     label: {
  //       format: function (value, ratio) {
  //         return value;
  //       },
  //       show: false // to turn off the min/max labels.
  //     },
  //     min: 0, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  //     max: 100, // 100 is default
  //     units: ' %',
  //     width: 39 // for adjusting arc thickness
  //   },
  //   color: {
  //     pattern: ['#007bff', '#007bff', '#007bff', '#007bff'], // the three color levels for the percentage values.
  //     threshold: {
  //       //unit: 'value', // percentage is default
  //       // max: 100, // 100 is default
  //       values: [30, 35, 40, 45]
  //     }
  //   },
  //   size: {
  //     height: 180
  //   }
  // });

  // var chartFanSpeed = c3.generate({
  //   bindto: '#chartFanSpeed',
  //   data: {
  //     columns: [
  //       ['LED fan speed', currentFanSpeed]
  //     ],
  //     type: 'gauge'
  //   },
  //   gauge: {
  //     label: {
  //       format: function (value, ratio) {
  //         return value;
  //       },
  //       show: false // to turn off the min/max labels.
  //     },
  //     min: 0, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  //     max: 100, // 100 is default
  //     units: ' %',
  //     width: 39 // for adjusting arc thickness
  //   },
  //   color: {
  //     pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
  //     threshold: {
  //       //unit: 'value', // percentage is default
  //       // max: 100, // 100 is default
  //       values: [70, 80, 90, 95]
  //     }
  //   },
  //   size: {
  //     height: 180
  //   }
  // });

  // var led_brightness = 0;

  // setInterval(function () {
  //   $.get("/getstatus", function (data) {

  //     var data_temp1 = Math.round((data.TEMP1 + Number.EPSILON) * 100) / 100;
  //     if (currentTemp1 !== data_temp1) {
  //       chartTemp1.load({
  //         columns: [['Base temp (celcius)', data_temp1]]
  //       });
  //     }
  //     currentTemp1 = data_temp1;

  //     var data_temp2 = Math.round((data.TEMP2 + Number.EPSILON) * 100) / 100;
  //     if (currentTemp2 !== data_temp2) {
  //       chartTemp2.load({
  //         columns: [['LED temp (celcius)', data_temp2]]
  //       });
  //     }
  //     currentTemp2 = data_temp2;

  //     if (led_brightness !== data.LED_BRIGHTNESS) {
  //       chartBrightness.load({
  //         columns: [['LED Brightness', data.LED_BRIGHTNESS]]
  //       });
  //     }
  //     led_brightness = data.LED_BRIGHTNESS;

  //     if (currentFanSpeed !== data.FAN_SPEED) {
  //       chartFanSpeed.load({
  //         columns: [['LED fan speed', data.FAN_SPEED]]
  //       });
  //     }
  //     currentFanSpeed = data.FAN_SPEED;

  //     $("#time-string").text(data.TIME);

  //   });

  // }, 1000);
});