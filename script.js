const constructorColorMap = {
    'Toro Rosso': '#3366cc', 'Mercedes': '#6CD3BF', 'Red Bull': '#1E5BC6', 'Ferrari': '#d62728', 'Williams': '#37BEDD',
    'Force India': '#ff80c7', 'Virgin': '#c82e37', 'Renault': '#FFD800', 'McLaren': '#FF8C1A', 'Sauber': '#006EFF',
    'Lotus': '#FFB800', 'HRT': '#b2945e', 'Caterham': '#0b361f', 'Lotus F1': '#FFB800', 'Marussia': '#8B0000',
    'Manor Marussia': '#8B0000', 'Haas F1 Team': '#B6BABD', 'Racing Point': '#F596C8', 'Aston Martin': '#2D826D',
    'Alfa Romeo': '#AA3939', 'AlphaTauri': '#4E7C9B', 'Alpine F1 Team': '#2293D1',
};

d3.csv("./driver_positions_per_lap.csv").then(data => {
    // Populate year and Grand Prix options
    const currentYear = 2023;
    const years = [...new Set(data.map(d => d.year))].filter(year => (currentYear - year) <= 3).sort();
    const grandPrixNames = [...new Set(data.map(d => d.grandprixName))].sort();

    const yearSelect = d3.select("#year");
        yearSelect.selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        yearSelect.on("change", function () {
            const selectedYear = this.value;
            populateGrandPrixOptions(selectedYear);
        });

    const grandPrixSelect = d3.select("#grandprix");
        grandPrixSelect.selectAll("option")
            .data(grandPrixNames)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);
    
    function getDriverConstructor(driverName, selectedYear) {
        const driverData = data.find(d => d.driverName === driverName && +d.year === selectedYear);
        return driverData ? driverData.constructorName : null;
    }
    function getConstructorNameByDriverName(driverName, nestedData, selectedYear) {
        for (const key in nestedData) {
            if (key === driverName) {return getDriverConstructor(driverName, selectedYear);}
        }
        return null;
    }
    function getDriverNameAtPositionLap1(position, nestedData) {
        for (const driverName in nestedData) {
            if (nestedData[driverName][0].position === position) {
                return driverName;
            }
        }
        return null;
    }
    
    function createChart(nestedData, selectedYear, filteredConstructors) {
    
        const margin = { top: 25, right: 200, bottom: 30, left: 200 };
        const width = 1600 - margin.left - margin.right;
        const height = 800 - margin.top - margin.bottom; 
        const maxLap = d3.max(Object.values(nestedData), d => d3.max(d, e => e.lap));
        const maxPosition = d3.max(Object.values(nestedData), d => d3.max(d, e => e.position));
        const x = d3.scaleLinear().domain([1, maxLap]).range([0, width]);
        const y = d3.scaleLinear().domain([1, maxPosition]).range([margin.top, height - margin.bottom ]);
        const xAxis = d3.axisBottom(x).ticks(maxLap);
        const yAxis = d3.axisLeft(y)
            .tickValues(d3.range(1, maxPosition + 1))
            .tickFormat((d) => {
                const driverName = getDriverNameAtPositionLap1(d, nestedData);
                return driverName ? `${d}. ${driverName}` : d;
            });

        const line = d3.line()
            .x(d => x(d.lap))
            .y(d => y(d.position));

        const svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
            .style("overflow", "auto")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .style("font-size", "14px");

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .selectAll("text") // Add this line to select all the tick labels
                .style("font-size", "18px");
        
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width-50 + margin.right / 2}, ${margin.top - 10})`);

            legend.selectAll("rect")
                .data(filteredConstructors)
                .enter()
                .append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => i * 20)
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", d => constructorColorMap[d] || "#000000")
                .style("cursor", "pointer");

            legend.selectAll("text")
                .data(filteredConstructors)
                .enter()
                .append("text")
                .attr("x", 20)
                .attr("y", (d, i) => i * 20 + 12)
                .text(d => d)
                .style("font-size", "20px")
                .style("cursor", "pointer");

        // Add this function to create the circle and number at the end of each line
        function addEndLabel(d, color) {
            const lastDataPoint = d[d.length - 1];
            const xPos = x(lastDataPoint.lap);
            const yPos = y(lastDataPoint.position);

            svg.append("circle")
                .attr("cx", xPos)
                .attr("cy", yPos)
                .attr("r", 12)
                .attr("fill", "#F79B0E");

            svg.append("text")
                .attr("x", xPos)
                .attr("y", yPos)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", "18px")
                .attr("fill", "white")
                .text(lastDataPoint.position);
        }

        const uniqueDriverNames = Array.from(new Set(Object.keys(nestedData)));
        for (const driverName of uniqueDriverNames) {
            const constructorName = getDriverConstructor(driverName, selectedYear);
            const color = constructorColorMap[constructorName] || '#000000'; // Default to black if constructorName is not in the map
            const currentDriverData = nestedData[driverName];
            let clickedLine = null; // Add this line to store the clicked state

            // Draw the line
            svg.append("path")
                .datum(currentDriverData)
                .attr("class", "line multiline") // Add the 'multiline' class
                .attr("d", line)
                .attr("stroke", color)
                .on("mouseover", function () {
                    if (clickedLine || animationInProgress) return;
                    legend.selectAll("text")
                    .transition()
                    .duration(200)
                    .style("opacity", (d) => {
                        if (d === getConstructorNameByDriverName(driverName, nestedData, selectedYear)) {
                            return 1;
                        } else {
                            return 0.2;
                        }
                    });

                    legend.selectAll("rect")
                        .transition()
                        .duration(200)
                        .style("opacity", (d) => {
                            if (d === getConstructorNameByDriverName(driverName, nestedData, selectedYear)) {
                                return 1;
                            } else {
                                return 0.2;
                            }
                        })
                    // Reduce the opacity of all lines except the current one to 0.2
                    d3.selectAll(".multiline")
                        .transition()
                        .duration(200)
                        .style("opacity", 0.2);
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .style("opacity", 1);
                })
                .on("mouseout", function () {
                    if (clickedLine || animationInProgress) return; // If a line is clicked, don't change anything on mouseout
                    else{
                        // Restore the opacity of all legend items
                        legend.selectAll("text")
                            .transition()
                            .duration(200)
                            .style("opacity", 1);

                        legend.selectAll("rect")
                            .transition()
                            .duration(200)
                            .style("opacity", 1);
                        // Restore the opacity of all lines to 1
                        d3.selectAll(".multiline")
                            .transition()
                            .duration(200)
                            .style("opacity", 1);
                    }
                })
                .on("click", function () {
                    if (clickedLine === this) {
                        // If the line is already clicked, reset the clicked state and restore all lines and dots
                        clickedLine = null;
                        d3.selectAll(".multiline")
                            .transition()
                            .duration(200)
                            .style("opacity", 1);
                        svg.selectAll(".dot")
                            .remove();
                    } else {
                        // If the line is not clicked, update the clicked state and apply the hover effect
                        clickedLine = this;
                        d3.selectAll(".multiline")
                            .transition()
                            .duration(200)
                            .style("opacity", 0.2);
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .style("opacity", 1);

                        svg.selectAll(".dot")
                            .remove(); // Remove existing dots first

                        // Create circles for each data point of the clicked line
                        svg.selectAll(".dot")
                            .data(currentDriverData)
                            .enter().append("circle")
                            .attr("class", "dot")
                            .attr("cx", d => x(d.lap))
                            .attr("cy", d => y(d.position))
                            .attr("r", 5)
                            .style("fill", (d, i, arr) => {
                                    return "black";
                            });
                    }
                });
            addEndLabel(currentDriverData, color);
        }
    }

    function populateGrandPrixOptions(selectedYear) {
        const grandPrixNames = [...new Set(data.filter(d => d.year === selectedYear).map(d => d.grandprixName))].sort();
        const grandPrixSelect = d3.select("#grandprix");

        grandPrixSelect.html(""); // Clear previous options

        grandPrixSelect.selectAll("option")
            .data(grandPrixNames)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);
    }

    let animationInProgress = false;
    function animateLines() {
        animationInProgress = true; // Set animationInProgress to true at the beginning
        d3.selectAll(".multiline")
            .style("opacity", "1");

        const transitions = []; // Add an array to store transition Promises

        d3.selectAll(".multiline").each(function (d, i) {
            const totalLength = this.getTotalLength();

            const transitionPromise = d3.select(this)
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(400 * (i + 1))
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", "0")
                .end(); // Add .end() to return a Promise when the transition ends

            transitions.push(transitionPromise); // Add the transition Promise to the transitions array
        });

        // Wait for all transitions to complete before setting animationInProgress to false
        Promise.all(transitions).then(() => {
            animationInProgress = false;
        });
    }


    // Function to update the chart based on selected values
    let lastLap;
    function updateChart() {

        const selectedYear = +yearSelect.node().value;
        const selectedGrandPrix = grandPrixSelect.node().value;
        const filteredData = data.filter(d => +d.year === selectedYear && d.grandprixName === selectedGrandPrix);
        // Filter constructors based on the selected year and Grand Prix
        const filteredConstructors = [...new Set(filteredData.map(d => d.constructorName))].sort();
        lastLap = d3.max(filteredData, d => +d.lap);
        // Process and create the chart with the filtered data
        let nestedData = {};
        filteredData.forEach(d => {
            if (!nestedData[d.driverName]) {
                nestedData[d.driverName] = [];
            }
            nestedData[d.driverName].push({ lap: +d.lap, position: +d.position });
        });
        // Clear the current chart before creating a new one
        d3.select("#chart").html("");
        createChart(nestedData, selectedYear, filteredConstructors);
        animateLines();
    }

    // Initialize the chart with default values
    const defaultYear = years[0];
    populateGrandPrixOptions(defaultYear);
    // Add click event listener to the update button
    d3.select("#update").on("click", updateChart);
});