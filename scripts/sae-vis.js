var dataset;
function init() {
  var w = 600;
  var h = 300;
  //var dataset;

  var xpadding = 60;
  var ypadding = 20;

  var lineWidth = 1;

  var yGraphPadding = 20;

  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  var selectAccel = function(d) { return d.accelerationDifference; };
  var xScale, yScale;
  var update = function(data, dataSelector) {
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
    paths.transition()
      .attr("d", line);
  }
  d3.select("#acceleration").on("click", function(d) {
    update(dataset, function (d) { return d.acceleration });
    console.log("update");
    //lineChart(dataset, function(d) {return d.acceleration;});
  });

  d3.select("#diff").on("click", function(d) {
    update(dataset, function(d) {return d.accelerationDifference; });
  });

  var rowConverter = function(d) {
    return {
      acceleration: parseFloat(d["Acceleration"]),
      accelerationDifference: parseFloat(d["Motor_Velocity_Difference"]),
      velocity: parseFloat(d["Velocity"]),
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

    lineChart(data, selectAccel);
    next();
  });

  //Create a function which perhaps takes an object and visualise it. It should transition between the previous and this set
  //Perhaps include some method of selecting a subset of the data

  function lineChart(data, dataSelector) {
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
      .attr("y1", lineWidth)
      .attr("x2", w)
      .attr("y2", lineWidth);

    svg.append("line")
      .attr("class", "box")
      .attr("x1", w - lineWidth)
      .attr("y1", 0)
      .attr("x2", w - lineWidth)
      .attr("y2", h - ypadding);

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

window.onload = init;
