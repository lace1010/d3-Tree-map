const moviesURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json";

const videoGamesURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json";

const kickStarterURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json";

let width = 800;
let height = 450;
let colorIndex = 7; // Must be outside render as we want to change it each time we select different treemap option

// Added this datasets object after finishing project. This way it's easier to change title and desctiptions as well as the treemap when we change d3.json url
let datasets = {
  0: {
    url: moviesURL,
    title: "Movie Sales",
    description: "Top 100 Highest Grossing Movies Grouped By Genre",
  },
  1: {
    url: videoGamesURL,
    title: "Video Games Sales",
    description: "Top 100 Most Sold Video Games Grouped By Genre",
  },
  2: {
    url: kickStarterURL,
    title: "Kickstarter Pledges",
    description:
      "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category",
  },
};

let defaultDataset = 0; // First load
let trueDataset = datasets[defaultDataset]; // The dataset we will call on in function downloadData() at the bottom of the page.

// Got this array of random colors on: https://gist.github.com/mucar/3898821
/* set each color element a interpolate option. That way we will get random effect each time going through */
/*let colors = [
  "#FF6633",
  "#FFFF99",
  "#00B3E6",
  "#E6B333",
  "#3366E6",
  "#999966",
  "#B34D4D",
  "#80B300",
  "#809900",
  "#E6B3B3",
  "#6680B3",
  "#66991A",
  "#FF99E6",
  "#CCFF1A",
  "#FF1A66",
  "#E6331A",
  "#33FFCC",
  "#66994D",
  "#B366CC",
  "#4D8000",
  "#B33300",
  "#CC80CC",
  "#66664D",
  "#991AFF",
  "#E666FF",
  "#4DB3FF",
  "#1AB399",
  "#E666B3",
  "#33991A",
  "#CC9999",
  "#B3B31A",
  "#00E680",
  "#4D8066",
  "#809980",
  "#E6FF80",
  "#1AFF33",
  "#999933",
  "#FF3380",
  "#CCCC00",
  "#66E64D",
  "#4D80CC",
  "#9900B3",
  "#E64D66",
  "#4DB380",
  "#FF4D4D",
  "#99E6E6",
  "#6666FF",
];*/

/* Make an array with all kinds of interpolate options. This way the colors of treemap will change every time a different url is picked
by having colorIndex change when rendering reload at the bottom of the page in function getURL */
const colors = [
  "interpolateMagma",
  "interpolateViridis",
  "interpolateInferno",
  "interpolatePlasma",
  "interpolateWarm",
  "interpolateCool",
  "interpolateCubehelixDefault",
  "interpolateRainbow",
];

//Function that renders the treemap and legend
function render(data) {
  // Change title and description based on trueDataset here
  document.getElementById("title").textContent = trueDataset.title;
  document.getElementById("description").textContent = trueDataset.description;

  // We set up tooltip and svgContainer in the render() as we want to recreate the whole thing again everytime a new url is selected from the dropdown menu
  let tooltip = d3
    .select("#tree-map")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", "0");

  svgContainer = d3
    .select("#tree-map")
    .append("svg")
    .attr("class", "graph")
    .attr("width", width)
    .attr("height", height);

  // Makes an array of all of the data's categories
  let categories = data.children.map((element) => element.name);

  // Set up scale for colors to fill in rectangles
  /* let colorScale = d3 // This scale would be used for basic colors array we have saved in comments up at beginning of page. Instead I decided to use interpolate colors as elements in array to help change colors each time url is reloaded.
    .scaleOrdinal()
    .domain([0, categories.length])
    .range(colors); */

  let colorScale = d3
    .scaleSequential()
    .domain([0, categories.length]) // Will vary on how many categories there are
    .interpolator(d3[colors[colorIndex]]); // Colors[] is an array with multiple interpolate options. The colorIndex will choose one for us. example if colorIndex = 7, d3[colors[colorIndex]()] will return interpolateRainbow.

  // Set up heirarchy and give data to the cluster layout. Data is the value for each item
  let root = d3.hierarchy(data).sum((d) => d.value); // .sort((a, b) => b.value - a.value);

  // This computes the position for each element in the hierarcht and gives a padding between each elemeny
  let treemap = d3.treemap().size([width, height]).paddingInner(3); // We have to comment out paddingInner in order to pass test for challenge.

  treemap(root); // Use treemap variable to set position for root(data)

  // Add the rectangle data. In order for text to stay inside each cell and not overflow to others we must first append a g container for each cell. Then add rect and text to each cell.
  let cellContainer = svgContainer
    // Simply append a g container for each cell with the date that is now the leaves that we got from treemap(root)
    .selectAll("g")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("class", "cell-containers")
    // This way each cell is placed properly based on xy coordinates and not on top of each other on topleft of page
    .attr("transform", (d) => "translate(" + d.x0 + ", " + d.y0 + ")")
    // d3 treemap has given each leaf an x position based of the size paramaters we gave
    // d3 treemap has given each leaf a y position based of the size paramaters we gave
    // Because we use x and y to translate each cells container here there is no need for x and y attributes when we append the rectangles
    .on("mouseover", function (d) {
      // on mouseover has to be in cellContainer or else when hovering over text in cell the tooltip will not show
      tooltip.style("opacity", "0.8");
      tooltip
        .style("left", d3.event.pageX + 15 + "px") // Places the tooltip 15 px to the right of mouse
        .style("top", d3.event.pageY - 70 + "px") // Places anchor point of tooltip 70px above the mouse
        .html(
          "Movie: " +
            d.data.name +
            "<br>Category: " +
            d.data.category +
            "<br>Value: " +
            d.data.value
        )
        .attr("data-value", d.value);
    })
    .on("mouseout", function () {
      tooltip.style("opacity", "0").style("top", -30000 + "px");
      // Add this top line to move tooltip off svg when mouseout so the tooltip is not covering another datapoint. Thus being able to use mouseover for points that would otherwise be behind the tooltip (needs to be negative)
    });

  cellContainer
    .append("rect") // Put rectangle inside the cell container.
    .attr("class", "tile") // Give each rectangle the class tile
    .attr("width", (d) => d.x1 - d.x0) // The right side position minus the left side position to get the length bewtween the two positions
    .attr("height", (d) => d.y1 - d.y0) // The top y position minus bottom y positon to get difference to return height
    .attr("fill", (d) => colorScale(categories.indexOf(d.data.category)))
    .style("stroke", "black")
    .attr("data-name", (d) => d.data.name)
    .attr("data-category", (d) => d.data.category)
    .attr("data-value", (d) => d.data.value);

  // Add text to each cell
  cellContainer
    .append("text")
    .attr("class", "tile-text")
    .selectAll("tspan")
    // The data for each cell is just one movie name. We turn into an array that splits the movie title every time there is a capitol letter
    .data((d) => d.data.name.split(/(?=[A-Z][^A-Z\.]{3})/g))
    .enter()
    .append("tspan")
    .attr("x", 5) // Because this is inside cell-container and it is already placed we just move text 5 px to the right so it has some padding
    .attr("y", (d, i) => 10 + i * 11) // 11 px down for first line then i * 10 after that so each time the title breaks into new word the next word goes down another 10 px
    .text((d) => d); // The d here is just one word of movie title. The next time it loops through it does the next word and so on.

  // Set up legend
  // This time I decided to create an entire new svg and place it to the side for this legend and control placing of it with HTML5 and css by wrapping legend and tree map in a container
  let squareDimensions = 15;
  let legend = d3
    .select("#legend-container")
    .append("svg")
    .attr("id", "legend")
    .attr("width", width)
    .attr("height", 100);

  /* In order for legend to be dynamic and work for all three URLs properly we need to add a 
   function that will add row if more than a certain amount and place the next legend there if it can't in the width 
   of the svg. */

  let xPosition = 0;
  let yPosition = 0;
  let yPositionText = 0;
  let yRowsText = 0;
  let yRows = 0;
  function getXForLegend(i) {
    if (i % 6 == 0) {
      xPosition = 10;
    }
    // Index must be times i % 6 to have them fit in rows or else it will keep going left past the width. e.g. i = 8 means 8 *squareDimension + 120 is too far. Must use mode to make it two to put in second column. The getY function will handle row.
    else xPosition = 10 + (i % 6) * (squareDimensions + 120);
    return xPosition;
  }

  function getYForLegend(i) {
    if (i >= 1 && i % 6 == 0) {
      yRows++;
      yPosition = (squareDimensions + 10) * yRows;
    }
    return yPosition;
  }

  /*Need to reset rows and yPosition for texts to work and can't do that without resetting every time.
    So I made same function for legend text to get y as rectangle except using different variables thus they are set at 0 */
  function getYForLegendText(i) {
    if (i >= 1 && i % 6 == 0) {
      yRowsText++;
      yPositionText = (squareDimensions + 10) * yRowsText;
    }
    return yPositionText;
  }

  legend
    .append("g")
    .selectAll("rect")
    .data(categories) // Array containing all of the categories.
    .enter()
    .append("rect")
    .attr("class", "legend-item")
    .attr("x", (d, i) => getXForLegend(i)) // i * squareDimensions takes care of rectangle sizes. The + 10 is padding between each legend
    .attr("y", (d, i) => getYForLegend(i))
    .attr("width", squareDimensions)
    .attr("height", squareDimensions)
    .attr("fill", (d, i) => colorScale(i)) // Fills rectangle based on same colorScale as when we filled each rectangle.
    .style("stroke", "black");

  legend
    .selectAll(".legend-text")
    .data(data.children) // data.children is an array of objects that seperate movies by name(category) and children(movies within the category name)
    .enter()
    .append("text")
    .attr(
      "x",
      (d, i) => squareDimensions + getXForLegend(i) + squareDimensions / 2
    )
    .attr("y", (d, i) => getYForLegendText(i) + squareDimensions / 2)
    .style("alignment-baseline", "middle") // Places the middle in text as anchor so it is perfectly centered and not the top of the line in the center
    .text((d) => d.name)
    .style("font-size", ".9rem")
    .attr("class", "legend-text");
}

// Create a function that retrieves the new dataset url when button is clicked
function getURLFromSelect(e) {
  // console.log(e.value); // Will work only if there is a this inside () in HTML5 file.

  d3.selectAll("svg").remove();
  // Remember that dataset keys are 0 (movies),1 (videogames), 2(kickstarter)
  let newDataSet = e.value;
  colorIndex = Math.floor(Math.random() * colors.length);
  console.log(colorIndex);
  trueDataset = datasets[newDataSet];
  downloadData(trueDataset.url);
}

// Use fetch to get data from url. (must have the then response before .then(data...))
function downloadData(url) {
  fetch(url)
    .then((response) => response.json())
    .then((data) => render(data));
}

// Call on the function that fetches data and renders the treemap. (Need this to work for the first time. After that the function getURL will call on it from there)
downloadData(trueDataset.url);
