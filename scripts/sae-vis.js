function init() {
  var w = 600;
  var h = 300;
  var dataset;

  var xpadding = 60;
  var ypadding = 20;

  var yGraphPadding = 20;

  var rowConverter = function(d) {
    return {
      acceleration: parseFloat(d["Acceleration"]),
      accelerationDifference: parseFloat(d["Motor_Velocity_Difference"]),
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

    lineChart(data);
  });

  function lineChart(data) {
    var xScale = d3.scaleLinear()
      .domain([
        d3.min(data, function(d) {return d.time}),
        d3.max(data, function(d) {return d.time})
      ])
      .range([xpadding, w]);

    var yScale = d3.scaleLinear()
      .domain([d3.min(data, function(d) { return d.accelerationDifference * 1.15}), d3.max(data, function(d) {return d.accelerationDifference * 1.15})])
      .range([h - ypadding, 0]);

    var line = d3.line()
      .x(function (d) { return xScale(d.time); })
      .y(function (d) { return yScale(d.accelerationDifference); });

    var svg = d3.select("#chart")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    svg.append("path")
      .datum(data)
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
      .attr("class", "axis")
      .call(xAxis);
    svg.append("g")
      .attr("transform", "translate (" + xpadding + ", 0)")
      .attr("class", "axis")
      .call(yAxis);

    svg.append("line")
      .attr("class", "box")
      .attr("x1", xpadding)
      .attr("y1", h - ypadding)
      .attr("x2", w)
      .attr("y2", h - ypadding);

    svg.append("line")
      .attr("class", "box")
      .attr("x1", xpadding)
      .attr("y1", 0)
      .attr("x2", w)
      .attr("y2", 0);

    svg.append("line")
      .attr("class", "box")
      .attr("x1", w-1)
      .attr("y1", 0)
      .attr("x2", w-1)
      .attr("y2", h - ypadding);

    // svg.append("text")
    //   .attr("transform", "rotate(-90)")
    //   .attr("y", 0 - margin.left)
    //   .attr("x", 0 - (height / 2))
    //   .attr("dy", "1em")
    //   .style("text-anchor", "middle")
    //   .text("Value"); 
    //   

    svg.append("text")
      .attr("transform", "rotate(-90, "+ xpadding/2 + ", " + (h - ypadding) + ")")
      .attr("x", xpadding/2)
      .attr("y", h - ypadding)
      .attr("class", "axis-label y-axis")
      .text("Motor 1 - Motor 2 Velocity (ms^-2)");

    svg.append("text")
      .attr("transform",
        "translate(" + (w / 2) + " ," +
        (h - 4) + ")")
      .attr("class", "axis-label x-axis")
      .text("Time (minutes)");
  }
}

window.onload = init;
