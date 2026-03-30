'use strict';

/* This file implements the Horizontal dot plot.
*/

// Import required functions/variables
import { palette, chartConfig, values } from './utils.js';

export default class HorizontalDotPlot {

    // Attributes
    width; height; margins;
    svg; chart; dots; axisX; axisY; labelX;

    scaleX; scaleY;

    data; state;
    plotData;

    // Callback attributes
    dotHover = () => {};
    dotOut = () => {};
    dotClick = () => {};

    constructor(container, width, height, margins) {

        this.width = width;
        this.height = height;
        this.margins = margins;

        this.svg = d3.select(container).append('svg')
            .classed('viz horizontal-dot-plot', true)
            .attr('width', width)
            .attr('height', height);

        this.chart = this.svg.append('g')
            .attr('transform', `translate(${margins.left}, ${margins.top})`);

        this.dots = this.chart.selectAll('circle');

        this.axisX = this.svg.append('g')
            .classed('axis axis-x', true).attr('transform', `translate(${margins.left}, ${this.height - margins.bottom})`);

        this.axisY = this.svg.append('g')
            .classed('axis axis-y', true).attr('transform', `translate(${margins.left}, ${margins.top})`);

        this.labelX = this.svg.append('text')
            .attr('transform', `translate(${this.width / 2}, ${this.height})`)
            .style('text-anchor', 'middle') 
            .attr('dy', -5)
            .text('Employment Rate (%)')
            .classed('axis-title', true);
            
        this.labelY = this.svg.append('text')
            .attr('transform', `translate(12, ${this.height / 2}) rotate(-90)`)
            .style('text-anchor', 'middle')
            .attr('dy', 10)
            .text('Age Group')
            .classed('axis-title', true);
    }

    // Calculate employment rate per age group and background for the selected year
    #updateData() {
        let filtered = this.data.filter(d => d.year === this.state.year);
          let filtered = this.data.filter(d => d.year === this.state.year);
        // Filter by education level if one is selected
        if (this.state.selectedEducation) {
            filtered = filtered.filter(d => d.education === this.state.selectedEducation);
        }

        let rolled = d3.rollup(
            filtered,
            v => {
                let employed = d3.sum(v, d => d.empStatus === values.employmentStatus.employed ? d.population : 0);
                let total = d3.sum(v, d => d.population);
                return total > 0 ? (employed / total) * 100 : 0;
            },
            d => d.ageGroup,
            d => d.background
        );

        this.plotData = Array.from(rolled, ([ageGroup, backgroundMap]) => ({
            ageGroup,
            immigrantRate: backgroundMap.get(values.background.immigrants) || 0,
            nativeRate: backgroundMap.get(values.background.natives) || 0,
        }));

        // Sort by age group
        this.plotData.sort((a, b) => d3.ascending(a.ageGroup, b.ageGroup));
    }

    // Update scales
    #updateScales() {
        let chartWidth = this.width - this.margins.left - this.margins.right;
    let chartHeight = this.height - this.margins.top - this.margins.bottom;

    this.scaleX = d3.scaleLinear()
        .domain([0, 100])
        .range([0, chartWidth]);

    this.scaleY = d3.scaleBand()
        .domain(this.plotData.map(d => d.ageGroup))
        .range([0, chartHeight])
        .padding(0.3);
    }

    // Update dot interactions
    #updateEvents() {
        const applyHover = (selection) => {
            selection
                .on('mouseover', (event, d) => {
                    d3.select(event.currentTarget)
                        .transition().duration(150)
                        .attr('r', 10)
                        .attr('opacity', 1);
                    this.dotHover(event, d);
                })
                .on('mouseout', (event, d) => {
                    d3.select(event.currentTarget)
                        .transition().duration(150)
                        .attr('r', 7)
                        .attr('opacity', 0.85);
                    this.dotOut(event, d);
                })
                .on('click', (event, d) => {
                    this.dotClick(event, d);
                });
        };

        applyHover(this.chart.selectAll('circle.dot-immigrant'));
        applyHover(this.chart.selectAll('circle.dot-native'));
    }

    // Draw or update the dots and reference lines
    #updateMarks() {
        let anim = 350;
        let chartWidth = this.width - this.margins.left - this.margins.right;

        // Draw horizontal grid lines per age group
        this.chart.selectAll('line.ref-line')
            .data(this.plotData, d => d.ageGroup)
            .join('line')
            .classed('ref-line', true)
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2)
            .attr('y2', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2)
            .attr('stroke', '#e5e7eb')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');

        // Draw connector lines between immigrant and native dots
        this.chart.selectAll('line.dumbbell-line')
            .data(this.plotData, d => d.ageGroup)
            .join('line')
            .classed('dumbbell-line', true)
            .attr('y1', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2)
            .attr('y2', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2)
            .attr('stroke', '#9ca3af')
            .attr('stroke-width', 2)
            .transition().duration(anim)
            .attr('x1', d => this.scaleX(Math.min(d.immigrantRate, d.nativeRate)))
            .attr('x2', d => this.scaleX(Math.max(d.immigrantRate, d.nativeRate)));

        // Draw immigrant dots
        this.chart.selectAll('circle.dot-immigrant')
            .data(this.plotData, d => d.ageGroup)
            .join(
                enter => enter.append('circle')
                    .classed('dot-immigrant', true)
                    .attr('cy', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2)
                    .attr('cx', 0)
                    .attr('r', 7)
                    .attr('fill', palette.immigrants)
                    .attr('opacity', 0.85),
                update => update,
                exit => exit.transition().duration(anim).attr('opacity', 0).remove()
            )
            .classed('selected', d => this.state.selectedAgeGroup === d.ageGroup)
            .attr('fill', palette.immigrants)
            .attr('opacity', 0.85)
            .transition().duration(anim)
            .attr('cx', d => this.scaleX(d.immigrantRate))
            .attr('cy', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2);

        // Draw native dots
        this.chart.selectAll('circle.dot-native')
            .data(this.plotData, d => d.ageGroup)
            .join(
                enter => enter.append('circle')
                    .classed('dot-native', true)
                    .attr('cy', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2)
                    .attr('cx', 0)
                    .attr('r', 7)
                    .attr('fill', palette.natives)
                    .attr('opacity', 0.85),
                update => update,
                exit => exit.transition().duration(anim).attr('opacity', 0).remove()
            )
            .classed('selected', d => this.state.selectedAgeGroup === d.ageGroup)
            .attr('fill', palette.natives)
            .attr('opacity', 0.85)
            .transition().duration(anim)
            .attr('cx', d => this.scaleX(d.nativeRate))
            .attr('cy', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2);

        // Draw rate labels for immigrants
        this.chart.selectAll('text.dot-label-immigrant')
            .data(this.plotData, d => d.ageGroup)
            .join('text')
            .classed('dot-label-immigrant', true)
            .attr('y', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2 - 10)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', palette.immigrants)
            .transition().duration(anim)
            .attr('x', d => this.scaleX(d.immigrantRate))
            .text(d => `${d.immigrantRate.toFixed(1)}%`);

        // Draw rate labels for natives
        this.chart.selectAll('text.dot-label-native')
            .data(this.plotData, d => d.ageGroup)
            .join('text')
            .classed('dot-label-native', true)
            .attr('y', d => this.scaleY(d.ageGroup) + this.scaleY.bandwidth() / 2 + 16)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', palette.natives)
            .transition().duration(anim)
            .attr('x', d => this.scaleX(d.nativeRate))
            .text(d => `${d.nativeRate.toFixed(1)}%`);

        this.#updateEvents();
    }

    // Update legend
    #updateLegend(){
        let legendData = [
            { label: values.background.immigrants, color: palette.immigrants },
            { label: values.background.natives, color: palette.natives }
        ];

        let container = d3.select('#dotplot-legend');

        let items = container.selectAll('div.legend-item')
            .data(legendData)
            .join('div')
            .classed('legend-item', true);

        items.selectAll('span.legend-swatch')
            .data(d => [d])
            .join('span')
            .classed('legend-swatch', true)
            .style('background-color', d => d.color);

        items.selectAll('span.legend-label')
            .data(d => [d])
            .join('span')
            .classed('legend-label', true)
            .text(d => d.label);
    }
    
    // Draw axes
    #updateAxes() {
        let axisGenX = d3.axisBottom(this.scaleX)
            .tickFormat(d => `${d}%`)
            .ticks(5);

        let axisGenY = d3.axisLeft(this.scaleY);

        this.axisX.transition().duration(300).call(axisGenX);
        this.axisY.transition().duration(300).call(axisGenY);
    }

    // Render the chart
    render(data = [], state = {}) {
    this.data = data;
    this.state = state;

    this.#updateData();
    this.#updateScales();
    this.#updateMarks();
    this.#updateAxes();
    this.#updateLegend();  // ← add this

    return this;
    }

    setDotHover(f = () => {}) {
        this.dotHover = f;
        this.#updateEvents();
        return this;
    }

    setDotOut(f = () => {}) {
        this.dotOut = f;
        this.#updateEvents();
        return this;
    }

    setDotClick(f = () => {}) {
        this.dotClick = f;
        this.#updateEvents();
        return this;
    }
}