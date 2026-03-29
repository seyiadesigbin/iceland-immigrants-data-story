import { chartConfig, palette, educationOrder, ageOrder, showTooltip, hideTooltip } from "./utils.js";

export default class HeatmapChart {
  width; height; margins;
  svg; chart; axisX; axisY;
  data; state;
  xScale; yScale; colorScale;
  tooltip;

  constructor(container, width, height, margins, tooltip) {
    this.width = width;
    this.height = height;
    this.margins = margins;
    this.tooltip = tooltip;

    this.svg = d3.select(container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.chart = this.svg.append("g")
      .attr("transform", `translate(${this.margins.left},${this.margins.top})`);

    this.axisX = this.chart.append("g").attr("class", "axis");
    this.axisY = this.chart.append("g").attr("class", "axis");

    this.scaleGroup = this.svg.append("g").attr("class", "mini-scale");
  }

  updateScales() {
    const innerWidth = this.width - this.margins.left - this.margins.right;
    const innerHeight = this.height - this.margins.top - this.margins.bottom;

    this.xScale = d3.scaleBand()
      .domain(ageOrder)
      .range([0, innerWidth])
      .padding(0.04);

    this.yScale = d3.scaleBand()
      .domain(educationOrder)
      .range([0, innerHeight])
      .padding(0.06);

    this.colorScale = d3.scaleLinear()
      .domain([-25, 0, 8])
      .range([palette.behind, palette.neutral, palette.ahead]);
  }

  updateAxes() {
    this.axisX
      .attr("transform", "translate(0,0)")
      .call(d3.axisTop(this.xScale).tickSize(0));

    this.axisY
      .call(d3.axisLeft(this.yScale).tickSize(0));

    this.axisY.selectAll("text")
      .attr("font-weight", d => d === "Tertiary" ? 800 : 600)
      .attr("fill", d => d === "Tertiary" ? "#b22f2c" : "#6b665f");
  }

  updateMarks() {
    const innerWidth = this.width - this.margins.left - this.margins.right;

    const cells = this.chart.selectAll(".cell")
      .data(this.data, d => `${d.education}-${d.age}`);

    const cellsEnter = cells.enter()
      .append("g")
      .attr("class", "cell");

    cellsEnter.append("rect");
    cellsEnter.append("text").attr("class", "cell-label");

    const allCells = cellsEnter.merge(cells)
      .attr("transform", d => `translate(${this.xScale(d.age)},${this.yScale(d.education)})`);

    allCells.select("rect")
      .attr("width", this.xScale.bandwidth())
      .attr("height", this.yScale.bandwidth())
      .attr("rx", 2)
      .attr("fill", d => this.colorScale(d.gap))
      .attr("stroke", "#f8f5ef")
      .attr("stroke-width", 1.5)
      .on("mouseover", (event, d) => {
        showTooltip(this.tooltip, event, `
          <strong>${d.education} · ${d.age}</strong><br>
          Year: ${d.year}<br>
          Immigrant rate: ${d.immigrant}%<br>
          Native rate: ${d.native}%<br>
          Gap: ${d.gap > 0 ? "+" : ""}${d.gap}pp
        `);
      })
      .on("mousemove", event => {
        this.tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", () => hideTooltip(this.tooltip));

    allCells.select("text")
      .attr("x", this.xScale.bandwidth() / 2)
      .attr("y", this.yScale.bandwidth() / 2)
      .attr("fill", d => Math.abs(d.gap) > 10 ? "#fff" : "#4f4a43")
      .text(d => `${d.gap > 0 ? "+" : ""}${d.gap}pp`);

    cells.exit().remove();

    this.chart.selectAll(".row-highlight").remove();
    this.chart.selectAll(".annotation").remove();

    const tertiaryY = this.yScale("Tertiary");

    this.chart.append("rect")
      .attr("class", "row-highlight")
      .attr("x", -4)
      .attr("y", tertiaryY - 4)
      .attr("width", innerWidth + 8)
      .attr("height", this.yScale.bandwidth() + 8);

    this.chart.append("text")
      .attr("class", "annotation")
      .attr("x", innerWidth / 2)
      .attr("y", tertiaryY - 10)
      .attr("text-anchor", "middle")
      .text("gap present in every working-age group for tertiary-educated immigrants");

    

    allCells
      .filter(d => Math.abs(d.gap) > 20)
      .append("text")
      .attr("class", "flag")
      .attr("x", this.xScale.bandwidth() - 8)
      .attr("y", 14)
      .attr("text-anchor", "end")
      .attr("font-size", 11)
      .attr("fill", "#fff")
      .attr("font-weight", 800)
      .text("⚑");
  }

  updateScaleLegend() {
    this.scaleGroup.selectAll("*").remove();

    const x = this.width - 40;
    const y = this.margins.top + 20;
    const legendHeight = 300;
    const legendWidth = 12;
    const maxVal = 10;     
    const minVal = -25;

    const scale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([legendHeight, 0]);

    const defs = this.svg.select("defs").empty()
      ? this.svg.append("defs")
      : this.svg.select("defs");

    defs.selectAll("#gap-gradient").remove();

    const lg = defs.append("linearGradient")
      .attr("id", "gap-gradient")
      .attr("x1", "0%").attr("x2", "0%")
      .attr("y1", "100%").attr("y2", "0%");

    lg.append("stop").attr("offset", "0%").attr("stop-color", palette.behind);
    lg.append("stop").attr("offset", "50%").attr("stop-color", palette.neutral);
    lg.append("stop").attr("offset", "100%").attr("stop-color", palette.ahead);

    this.scaleGroup.attr("transform", `translate(${x},${y})`);

    this.scaleGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "url(#gap-gradient)")
      .attr("stroke", "#ddd6cb");

    this.scaleGroup.append("text").attr("x", legendWidth + 2).attr("y", scale(maxVal) - 4).attr("text-anchor", "end").text("+pp");
    this.scaleGroup.append("text").attr("x", legendWidth + 2).attr("y", scale(minVal) + 8).attr("text-anchor", "end").text("-pp");
  }

  render(data = [], state = {}) {
    this.data = data;
    this.state = state;

    this.updateScales();
    this.updateAxes();
    this.updateMarks();
    this.updateScaleLegend();

    return this;
  }
}