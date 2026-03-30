'use strict';

/*
 This file implements the Heatmap.
*/

import { palette, values, heatmapOrder } from './utils.js';

export default class HeatmapChart {

    // Attributes
    width; height; margin;
    svg; chart; axisX; axisY;
    cellsLayer; annotationLayer;
    legendContainer;
    data; state;
    xScale; yScale; colorScale;
    tooltip;

    constructor(container, legendContainer, width, height, margin, tooltip) {

        this.width = width;
        this.height = height;
        this.margin = margin;
        this.tooltip = tooltip;

        // Set up selection
        this.svg = d3.select(container).append("svg")
            .classed("viz heatmap", true)
            .attr("width", this.width)
            .attr("height", this.height);

        this.chart = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.axisX = this.chart.append("g")
            .classed("axis axis-x", true);

        this.axisY = this.chart.append("g")
            .classed("axis axis-y", true);

        this.cellsLayer = this.chart.append("g")
            .classed("cells-layer", true);

        this.annotationLayer = this.chart.append("g")
            .classed("annotation-layer", true);

        this.legendContainer = d3.select(legendContainer);
    }

    #getEducationLabel(value) {
        if (value === values.education.basic) return "Basic";
        if (value === values.education.upperSecondary) return "Upper secondary";
        if (value === values.education.tertiary) return "Tertiary";
        return value;
    }

    #moveTooltip(event) {
        this.tooltip
            .style('left', `${event.pageX + 12}px`)
            .style('top', `${event.pageY - 28}px`);
    }

    #showTooltip(event, d) {
        this.tooltip
            .style('opacity', 1)
            .html(`
                <strong>${this.#getEducationLabel(d.education)} · ${d.ageGroup}</strong>
                <span>Year: ${d.year}</span>
                <span>Immigrant rate: ${d.immigrantRate.toFixed(1)}%</span>
                <span>Native rate: ${d.nativeRate.toFixed(1)}%</span>
                <span>Gap: ${d.gap > 0 ? '+' : ''}${d.gap.toFixed(1)}pp</span>
            `);

        this.#moveTooltip(event);
    }

    #hideTooltip() {
        this.tooltip.style('opacity', 0);
    }

    #updateScales() {
        const innerWidth = this.width - this.margin.left - this.margin.right;
        const innerHeight = this.height - this.margin.top - this.margin.bottom;

        this.xScale = d3.scaleBand()
            .domain(heatmapOrder.ageGroup)
            .range([0, innerWidth])
            .padding(0.04);

        this.yScale = d3.scaleBand()
            .domain(heatmapOrder.education)
            .range([0, innerHeight])
            .padding(0.06);

        this.colorScale = d3.scaleLinear()
            .domain([-25, 0, 10])
            .range([
                palette.heatmap.negative,
                palette.heatmap.neutral,
                palette.heatmap.positive
            ]);
    }

    #updateAxes() {
        this.axisX
            .attr("transform", "translate(0,0)")
            .call(d3.axisTop(this.xScale).tickSize(0));

        this.axisY
            .call(d3.axisLeft(this.yScale).tickSize(0));

        this.axisX.selectAll("text")
            .attr("fill", palette.muted)
            .attr("font-size", 12);

        this.axisY.selectAll("text")
            .text(d => this.#getEducationLabel(d))
            .attr("fill", d => d === values.education.tertiary ? "#b22f2c" : palette.muted)
            .attr("font-weight", d => d === values.education.tertiary ? 800 : 600)
            .attr("font-size", 12);
    }

    #updateCells() {
        const cells = this.cellsLayer.selectAll(".cell")
            .data(this.filteredData, d => `${d.education}-${d.ageGroup}`);

        const cellsEnter = cells.enter()
            .append("g")
            .classed("cell", true);

        cellsEnter.append("rect");
        cellsEnter.append("text").classed("cell-label", true);

        const allCells = cellsEnter.merge(cells)
            .attr("transform", d => `translate(${this.xScale(d.ageGroup)},${this.yScale(d.education)})`);

        allCells.select("rect")
            .transition()
            .duration(350)
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("rx", 2)
            .attr("fill", d => this.colorScale(d.gap))
            .attr("stroke", "#f8f5ef")
            .attr("stroke-width", 1.5);

        allCells.select("rect")
            .on("mouseover", (event, d) => this.#showTooltip(event, d))
            .on("mousemove", (event) => this.#moveTooltip(event))
            .on("mouseout", () => this.#hideTooltip());

        allCells.select(".cell-label")
            .transition()
            .duration(350)
            .attr("x", this.xScale.bandwidth() / 2)
            .attr("y", this.yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", d => Math.abs(d.gap) > 10 ? "#fff" : "#4f4a43")
            .attr("font-size", 12)
            .attr("font-weight", 700)
            .text(d => `${d.gap > 0 ? '+' : ''}${d.gap.toFixed(1)}pp`);

        // Clear old flags before re-adding
        allCells.selectAll(".flag").remove();

        allCells
            .filter(d => Math.abs(d.gap) > 20)
            .append("text")
            .classed("flag", true)
            .attr("x", this.xScale.bandwidth() - 8)
            .attr("y", 14)
            .attr("text-anchor", "end")
            .attr("font-size", 11)
            .attr("fill", "#fff")
            .attr("font-weight", 800)
            .text("⚑");

        cells.exit().remove();
    }

    #updateAnnotation() {
        this.annotationLayer.selectAll("*").remove();

        const tertiaryY = this.yScale(values.education.tertiary);
        const innerWidth = this.width - this.margin.left - this.margin.right;

       this.annotationLayer.append("rect")
            .attr("x", -4)
            .attr("y", tertiaryY - 4)
            .attr("width", innerWidth + 8)
            .attr("height", this.yScale.bandwidth() + 8)
            .attr("fill", "none")
            .attr("stroke", "#d9534f")
            .attr("stroke-width", 2.5)
            .attr("stroke-dasharray", "6 4")
            .attr("pointer-events", "none");
    }

    #renderLegend() {
       
        const legend = this.legendContainer;
        legend.html("");   // clear everything first

        const innerHeight = this.height - this.margin.top - this.margin.bottom;

        const scaleWrap = this.legendContainer.append("div")
            .classed("heatmap-scale", true)
            .style("display", "flex")
            .style("align-items", "center")
            .style("height", `${innerHeight}px`);

        const scaleSvg = scaleWrap.append("svg")
            .attr("width", 70)
            .attr("height", innerHeight);

        const defs = scaleSvg.append("defs");

        const lg = defs.append("linearGradient")
            .attr("id", "heatmap-gradient")
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "100%")
            .attr("y2", "0%");

        lg.append("stop").attr("offset", "0%").attr("stop-color", palette.heatmap.negative);
        lg.append("stop").attr("offset", "50%").attr("stop-color", palette.heatmap.neutral);
        lg.append("stop").attr("offset", "100%").attr("stop-color", palette.heatmap.positive);

        const barHeight = innerHeight - 20;

        scaleSvg.append("rect")
            .attr("x", 10)
            .attr("y", 10)
            .attr("width", 12)
            .attr("height", barHeight)
            .attr("fill", "url(#heatmap-gradient)")
            .attr("stroke", "#ddd6cb");

        scaleSvg.append("text")
            .attr("x", 28)
            .attr("y", 14)
            .text("+pp");

        scaleSvg.append("text")
            .attr("x", 28)
            .attr("y", barHeight + 12)
            .text("-pp");
    }

    render(data = [], state = {}) {
        this.data = data;
        this.state = state;

        this.filteredData = this.data.filter(d => d.year === this.state.chapter2Year);

        this.#updateScales();
        this.#updateAxes();
        this.#updateCells();
        this.#updateAnnotation();
        this.#renderLegend();

        return this;
    }
}