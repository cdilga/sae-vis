var dataset;

//It would be convenient to make a chart object, which has an svg,
// axes exposed
// something to update lines?
// Perhaps something to help with choosing data
function Chart(x, y, width, height) {
  return {
    width: width,
    height: height,
    axis: {x: xAxis, y: yAxis}
  }
}

function init() {
  var w = 600;
  var h = 300;
  //var dataset;
  var chart;
  var xpadding = 60;
  var ypadding = 20;

  var lineWidth = 1;

  var yGraphPadding = 20;

  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  var selectAccel = function(d) { return d.accelerationDifference; };

  var rowConverter = function(d) {
    /*
    ===============================
    CSV Header, for quick reference
    ===============================

    "", 
    "RMS1_D2_Motor_Speed", 
    "RMS2_D2_Motor_Speed", 
    "RMS1_D3_Motor_Temperature", 
    "RMS2_D3_Motor_Temperature", 
    "RMS1_D2_Torque_Feedback", 
    "RMS2_D2_Torque_Feedback", 
    "Potentiometer_1", 
    "Potentiometer_2", 
    "Brake_1", 
    "RMS1_D3_Motor_Temperature.1", 
    "RMS2_D3_Motor_Temperature.1", 
    "RMS1_D1_Control_Board_Temperature", 
    "RMS2_D1_Control_Board_Temperature", 
    "ID", 
    "Motor1_Velocity", 
    "Motor2_Velocity", 
    "Motor1_Velocity_Smooth", 
    "Motor2_Velocity_Smooth", 
    "Motor1_Acceleration", 
    "Motor2_Acceleration", 
    "Velocity", 
    "Acceleration", 
    "Motor_Velocity_Difference"
    */

    //Please fix efficency
    return {
      acceleration: parseFloat(d["Acceleration"]),
      accelerationDifference: parseFloat(d["Motor_Velocity_Difference"]),
      velocity: parseFloat(d["Velocity"]),
      motorTemperature: (parseFloat(d["RMS1_D3_Motor_Temperature"]) + parseFloat(d["RMS2_D3_Motor_Temperature"]))/2,
      efficency: Math.random() * 10,
      time: parseInt(d["ID"])/60
    };
  }

  d3.csv("data/1s_sample_clean.csv", rowConverter, function(data) {
    if (data === null) {
      d3.select("#chart").append("p")
        .text("Data failed to load");
    }
    dataset = data;
    //console.table(dataset);

    chart = LineChart(data, selectAccel);
    registerAllButtons();
    next();
  });

  var registerAllButtons = function() {
    //Defines how our charts will be setup
    d3.select("#acceleration").on("click", function (d) {
      chart.update(dataset, function (d) { return d.acceleration }, "Acceleration", "Time");     
    });

    d3.select("#diff").on("click", function (d) {
      chart.update(dataset, function (d) { return d.accelerationDifference; }, "Differential", "Time");
    });

    d3.select("#velocity").on("click", function (d) {
      chart.update(dataset, function (d) { return d.velocity; }, "Velocity", "Time");
    });

    d3.select("#temperature").on("click", function (d) {
      chart.update(dataset, function (d) { return d.motorTemperature; }, "Temperature *C", "Time");
    });

    d3.select("#efficency").on("click", function (d) {
      chart.update(dataset, function (d) { return d.efficency; }, "Efficency", "Time");
    });
  }

  //Create a function which perhaps takes an object and visualise it. It should transition between the previous and this set
  //Perhaps include some method of selecting a subset of the data

  function LineChart(data, dataSelector) {
    xScale = d3.scaleLinear()
      .domain([
        d3.min(data, function(d) {return d.time}),
        d3.max(data, function(d) {return d.time})
      ])
      .range([xpadding, w]);

    yScale = d3.scaleLinear()
      .domain([d3.min(data, function(d) { return dataSelector(d) * 1.15}), d3.max(data, function(d) {return dataSelector(d) * 1.15})])
      .range([h - ypadding, 0]);

    var line = d3.line()
      .x(function (d) { return xScale(d.time); })
      .y(function (d) { return yScale(dataSelector(d)); });

    svg.selectAll("path")
      .data([data])
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", line);

    //.tickValues(d3.range(d3.min(data, function(d) {return d.time}) - 1, d3.max(data, function(d) {return d.time}) -1, 60))
    var xAxis = d3.axisBottom()
      .ticks()
      .scale(xScale);

    var yAxis = d3.axisLeft()
      .scale(yScale);

    svg.append("g")
      .attr("transform", "translate (0, " + (h - ypadding - yScale(0)) + ")")
      .attr("id", "chart-x-axis")
      .call(xAxis);

    svg.append("g")
      .attr("transform", "translate (" + xpadding + ", 0)")
      .attr("id", "chart-y-axis")
      .call(yAxis);

    svg.append("rect")
      .attr("class", "box")
      .attr("x", xpadding)
      .attr("y", lineWidth)
      .attr("width", w-xpadding)
      .attr("height", h-ypadding);

    var xLabel = svg.append("text")
      .attr("transform", "rotate(-90, "+ xpadding/2 + ", " + (h - ypadding) + ")")
      .attr("x", xpadding/2)
      .attr("y", h - ypadding)
      .attr("class", "axis-label y-axis")
      .text("Motor 1 - Motor 2 Velocity (ms^-2)");

    var yLabel = svg.append("text")
      .attr("transform",
        "translate(" + (w / 2) + " ," +
        (h - 4) + ")")
      .attr("class", "axis-label")
      .text("Time (minutes)");
    var setXLabel = function(text) {
      xLabel.transition()
        .text(text);
    }

    var setYLabel = function(text) {
      xLabel.transition()
        .text(text);
    }

    var update = function (data, dataSelector, xAxisText, yAxisText) {
      var delay = 250;
      xScale = d3.scaleLinear()
        .domain([
          d3.min(data, function (d) { return d.time }),
          d3.max(data, function (d) { return d.time })
        ])
        .range([xpadding, w]);
      
      yScale = d3.scaleLinear()
        .domain([d3.min(data, function (d) { return dataSelector(d) * 1.15 }), d3.max(data, function (d) { return dataSelector(d) * 1.15 })])
        .range([h - ypadding, 0]);

      var line = d3.line()
        .x(function (d) { return xScale(d.time); })
        .y(function (d) { return yScale(dataSelector(d)); });

      
      var paths = svg.selectAll("path")
        .data([data])
        .transition()
        .delay(250)
        .attr("d", line);
      
      //Update the axes by creating new functions, and then transititioning to a new type of axis
      var xAxis = d3.axisBottom()
        .ticks()
        .scale(xScale);

      var yAxis = d3.axisLeft()
        .scale(yScale);

      svg.select("#chart-x-axis")
        .transition()
        .delay(delay)
        .call(xAxis);
      
      svg.select("#chart-y-axis")
        .transition()
        .delay(delay)
        .call(yAxis);

      //Update the labels too
      xLabel.transition()
        .delay(delay)
        .text(xAxisText)
      yLabel.transition()
        .delay(delay)
        .text(yAxisText)
    }
    return {
      width: w,
      height: h,
      axis: { x: xAxis, y: yAxis },
      svg: svg,
      scale: {x: xScale, y: yScale},
      line: line,
      update: update,
      label: {x: xLabel, y: yLabel}
    }
  }
}
//lets have an object which basically has all the text correct for making a chart out of some charts.

/*
function next() {
  var w=600,
      h=100,
      xpadding=ypadding=10;

  var dataSelector = function(d) { return d.acceleration };

  var overview = d3.select("#overview").append("svg")
    .attr("width", w)
    .attr("height", h);

  xScale = d3.scaleLinear()
    .domain([
      d3.min(dataset, function (d) { return d.time }),
      d3.max(dataset, function (d) { return d.time })
    ])
    .range([xpadding, w]);

  yScale = d3.scaleLinear()
    .domain([d3.min(dataset, function (d) { return dataSelector(d) * 1.15 }), d3.max(dataset, function (d) { return dataSelector(d) * 1.15 })])
    .range([h - ypadding, 0]);
  
  var line = d3.line()
    .x(function (d) { return xScale(d.time); })
    .y(function (d) { return yScale(dataSelector(d)); });

  overview.selectAll("path")
    .data([dataset])
    .enter()
    .append("path");

  overview.selectAll("path")
    .attr("d", line)
    .attr("stroke", "grey");

  var registerMouseovers = function () {
    overview.selectAll("rect")
      .on("mouseover", function (d) {

        d3.select(this)
          .attr("fill", "rgb(237, 172, 0)");

        overview.append("text")
          .text(d)
          .attr("id", "tooltip")
          .attr("x", parseFloat(d3.select(this).attr("x")) + parseFloat(d3.select(this).attr("width")) / 2 - 10)
          .attr("y", parseFloat(d3.select(this).attr("y")) + 20)
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("fill", "red")

        d3.select("#tooltip")
          .remove()
      })
  }
  //registerMouseovers();

  d3.select("#velocity")
    .on("click", function () {
      console.log("update")
      dataSelector = function(d) { return d.velocity };

      var paths = overview.selectAll("path").data([dataset]);

      paths.attr("d", line)
        .merge(paths)
        .transition()
        .delay(500)
    });

  d3.select("#remove")
    .on("click", function () {
      dataset.shift();
      var bars = overview.selectAll("rect").data(dataset);
      xScale.domain(d3.range(dataset.length));
      bars.exit()
        .transition()
        .duration(500)
        .attr("x", w)
        .remove()

      bars.transition()
        .delay(500)
        .attr("x", function (d, i) {
          return xScale(i);
        })
        .attr("y", function (d) {
          return h - yScale(d);
        })
        .attr("width", xScale.bandwidth())
        .attr("height", function (d) {
          return yScale(d);
        })
    });

}
*/
window.onload = init;
