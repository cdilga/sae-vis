var dataset;

//It would be convenient to make a chart object, which has an svg,
// axes exposed
// something to update lines?
// Perhaps something to help with choosing data

function init() {
  //All inital parameters
  var w = 600;
  var h = 300;
  var chart;
  var xpadding = 60;
  var ypadding = 20;

  var overview_h = h/5;
  var overview_w = w;
  var overview_xpadding = xpadding;
  var overview_ypadding = ypadding;

  var lineWidth = 1;

  var yGraphPadding = 20;

  //svg holding the main visualisation
  var svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", "0 0 " + w + " " + h)
    .attr("width", w)
    .attr("height", h);
  //overview holding the brush selection
  var overview = d3.select("#overview")
    .append("svg")
    .attr("viewBox", "0 0 " + overview_w + " " + overview_h)
    .attr("width", overview_w)
    .attr("height", overview_h);

  //Parse data from the CSV
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

    chart = LineChart(data, function (d) { return d.accelerationDifference; });
    registerAllButtons();
  });

  //TODO see if there is an axis mid?

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
  //Perhaps include some method of selecting a subset of the dzata

  function LineChart(data, dataSelector) {
    xScale = d3.scaleLinear()
      .domain([
        d3.min(data, function(d) {return d.time}),
        d3.max(data, function(d) {return d.time})
      ])
      .range([xpadding, w]);

    xScaleOverview = d3.scaleLinear()
      .domain([
        d3.min(data, function (d) { return d.time }),
        d3.max(data, function (d) { return d.time })
      ])
      .range([overview_xpadding, overview_w]);

    yScale = d3.scaleLinear()
      .domain([d3.min(data, function(d) { return dataSelector(d) * 1.15}), d3.max(data, function(d) {return dataSelector(d) * 1.15})])
      .range([h - ypadding, 0]);

    yScaleOverview = d3.scaleLinear()
      .domain([d3.min(data, function (d) { return dataSelector(d) * 1.15 }), d3.max(data, function (d) { return dataSelector(d) * 1.15 })])
      .range([overview_h - overview_ypadding, 0]);
    
    var line = d3.line()
      .x(function (d) { return xScale(d.time); })
      .y(function (d) { return yScale(dataSelector(d)); });

    var overviewLine = d3.line()
      .x(function (d) { return xScaleOverview(d.time); })
      .y(function (d) { return yScaleOverview(dataSelector(d)); });

    svg.selectAll("path")
      .data([data])
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", line);

    overview.selectAll("path")
      .data([data])
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", overviewLine);

    //.tickValues(d3.range(d3.min(data, function(d) {return d.time}) - 1, d3.max(data, function(d) {return d.time}) -1, 60))
    var xAxis = d3.axisBottom()
      .ticks()
      .scale(xScale);

    var yAxis = d3.axisLeft()
      .scale(yScale);

    var xAxisOverview = d3.axisBottom()
      .ticks()
      .scale(xScaleOverview);

    var yAxisOverview = d3.axisBottom()
      .scale(yScaleOverview);

    //A brush is something that can be manipulated by the mouse
    var brush = d3.brushX()
      .extent([[0, 0], [w, overview_h]])
      .on("brush end", function() {
        //scale is the selection we just made, otherwise it's the xScale overview's range
        var s = d3.event.selection || xScaleOverview.range();
        
        xScale.domain(s.map(xScaleOverview.invert, xScaleOverview));
        svg.select(".line")
          .attr("d", line);
        svg.select(".chart-x-axis")
          .call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
          .scale(w / (s[1] - s[0]))
          .translate(-s[0], 0));
      });

    //A zoom helps us zoom content
    var zoom = d3.zoom()
      .scaleExtent([1, Infinity])
      .translateExtent([0, 0], [w, h])
      .extent([0, 0], [w, h])
      .on("zoom", function() {
        var t = d3.event.transform;
        xScale.domain(t.rescaleX(xScaleOverview).domain());
        svg.select(".line").attr("d", line);
        svg.select(".chart-x-axis").call(xScaleOverview);
        overview.select(".brush").call(brush.move, xScaleOverview.range().map(t.invertX, t));
      });
    svg.append("g")
      .attr("transform", "translate (0, " + (h - ypadding - yScale(0)) + ")")
      .attr("class", "axis") 
      .call(xAxis);

    overview.append("g")
      .attr("transform", "translate (0, " + (overview_h - ypadding) + ")")
      .attr("class", "axis")
      .call(xAxisOverview);

    svg.append("g")
      .attr("transform", "translate (" + xpadding + ", 0)")
      .attr("id", "chart-y-axis")
      .attr("class", "axis")
      .call(yAxis);

    svg.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", xpadding)
      .attr("y", lineWidth)
      .attr("width", w - xpadding)
      .attr("height", h - ypadding)
      
    svg.append("rect")
      .attr("class", "box")
      .attr("x", xpadding)
      .attr("y", lineWidth)
      .attr("width", w-xpadding)
      .attr("height", h-ypadding)
      .call(zoom);

    var xLabel = svg.append("text")
      .attr("transform", "rotate(-90, "+ xpadding/2 + ", " + (h - ypadding) + ")")
      .attr("x", xpadding/2)
      .attr("y", h - ypadding)
      .attr("class", "axis-label y-axis axis")
      .text("Motor 1 - Motor 2 Velocity (ms^-2)");

    var yLabel = svg.append("text")
      .attr("transform",
        "translate(" + (w / 2) + " ," +
        (h - 4) + ")")
      .attr("class", "axis-label axis")
      .text("Time (minutes)");

    overview.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, xScale.range());

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

      xScaleOverview = d3.scaleLinear()
        .domain([
          d3.min(data, function (d) { return d.time }),
          d3.max(data, function (d) { return d.time })
        ])
        .range([overview_xpadding, overview_w]);

      yScaleOverview = d3.scaleLinear()
        .domain([d3.min(data, function (d) { return dataSelector(d) * 1.15 }), d3.max(data, function (d) { return dataSelector(d) * 1.15 })])
        .range([overview_h - overview_ypadding, 0]);

      var line = d3.line()
        .x(function (d) { return xScale(d.time); })
        .y(function (d) { return yScale(dataSelector(d)); });

      var overviewLine = d3.line()
        .x(function (d) { return xScaleOverview(d.time); })
        .y(function (d) { return yScaleOverview(dataSelector(d)); });

      var paths = svg.selectAll("path")
        .data([data])
        .transition()
        .delay(250)
        .attr("d", line);

      var overviewPaths = overview.selectAll("path")
        .data([data])
        .transition()
        .delay(250)
        .attr("d", overviewLine);
      
      //Update the axes by creating new functions, and then transititioning to a new type of axis
      var xAxis = d3.axisBottom()
        .ticks()
        .scale(xScale);

      var yAxis = d3.axisLeft()
        .scale(yScale);

      var xAxisOverview = d3.axisBottom()
        .ticks()
        .scale(xScaleOverview);

      svg.select("#chart-x-axis")
        .transition()
        .delay(delay)
        .call(xAxis);
      
      svg.select("#chart-y-axis")
        .transition()
        .delay(delay)
        .call(yAxis);

      overview.select("#chart-x-axis")
        .transition()
        .delay(delay)
        .call(xAxisOverview);

      overview.select("#chart-y-axis")
        .transition()
        .delay(delay)
        .call(yAxisOverview);

      //Update the labels too
      xLabel.transition()
        .delay(delay)
        .text(xAxisText)
      yLabel.transition()
        .delay(delay)
        .text(yAxisText)

    }

    //For future use, a chart object which has some helpful items exposed
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

window.onload = init;
