'use strict';

import { palette, chartConfig } from './utils.js';

export default class SlopeChart {

    width; height; margins;
    svg; chartGroup;
    axisXGroup; axisYGroup;
    scaleX; scaleY;
    innerWidth; innerHeight;
    data; state;
    legendContainer;

    constructor(container, legendContainer, width, height, margins) {
        this.width = width;
        this.height = height;
        this.margins = margins;

        this.innerWidth = width - margins.left - margins.right;
        this.innerHeight = height - margins.top - margins.bottom;

        this.svg = d3.select(container).append('svg')
            .classed('viz slope-chart', true)
            .attr('width', width)
            .attr('height', height);

        this.chartGroup = this.svg.append('g')
            .attr('transform', `translate(${margins.left}, ${margins.top})`);

        this.axisXGroup = this.svg.append('g')
            .classed('axis axis-x', true)
            .attr('transform', `translate(${margins.left}, ${height - margins.bottom})`);

        this.axisYGroup = this.svg.append('g')
            .classed('axis axis-y', true)
            .attr('transform', `translate(${margins.left}, ${margins.top})`);

        this.scaleX = d3.scalePoint();
        this.scaleY = d3.scaleLinear();

        this.legendContainer = d3.select(legendContainer);
    }

    #prepareData() {
        let workingData = this.data;

        if (this.state.selectedEducation) {
            workingData = workingData.filter(d => d.education === this.state.selectedEducation);
        }

        let grouped = d3.rollup(
            workingData,
            rows =>{
                let totalEmployed= d3.sum(rows,d=>d.employed);
                let totalPop = d3.sum(rows, d => d.total);
                return totalPop > 0 ? (totalEmployed / totalPop) * 100 : 0;
            },
            d=>d.year,
            d=>d.background
        );

        let flatData=[];
        for (let [year,bgMap] of grouped) {
            for (let [background,rate] of bgMap) {
                flatData.push({year,background,rate});
            }
        }

        return flatData;
    }

    #updateScales(chartData){
    this.scaleX
        .domain([2011, 2021])
        .range([0, this.innerWidth])
        .padding(0.3);

    let rateValues = chartData.map(d => d.rate);
    let highest = d3.max(rateValues) || 0;

    this.scaleY
        .domain([0, 100])
        .range([this.innerHeight, 0]);
}

    #updateMarks(chartData) {
    this.chartGroup.selectAll('*').remove();

    let backgrounds = ['Immigrants', 'Natives'];
    let groupColours = {
        'Immigrants': palette.immigrants,
        'Natives': palette.natives
    };

    backgrounds.forEach(group => {
        let groupRows = chartData.filter(d => d.background === group);

        let start = groupRows.find(d => d.year === 2011);
        let end = groupRows.find(d => d.year === 2021);

        if (!start || !end) return;

        let lineColour = groupColours[group];
        let startY = this.scaleY(0);

        this.chartGroup.append('line')
            .attr('x1', this.scaleX(2011))
            .attr('y1', startY)
            .attr('x2', this.scaleX(2021))
            .attr('y2', startY)
            .attr('stroke', lineColour)
            .attr('stroke-width', 2.5)
            .attr('stroke-linecap', 'round')
            .transition()
            .duration(800)
            .attr('y1', this.scaleY(start.rate))
            .attr('y2', this.scaleY(end.rate));

        [start, end].forEach(d => {
            this.chartGroup.append('circle')
                .attr('cx', this.scaleX(d.year))
                .attr('cy', startY)
                .attr('r', 5)
                .attr('fill', lineColour)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
                .transition()
                .duration(800)
                .attr('cy', this.scaleY(d.rate));
        });

        this.chartGroup.append('text')
            .attr('x', this.scaleX(2011) - 10)
            .attr('y', startY)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .style('fill', lineColour)
            .style('font-weight', '600')
            .text(`${group}: ${start.rate.toFixed(1)}%`)
            .transition()
            .duration(800)
            .attr('y', this.scaleY(start.rate));

        this.chartGroup.append('text')
            .attr('x', this.scaleX(2021) + 10)
            .attr('y', startY)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'start')
            .style('font-size', '12px')
            .style('fill', lineColour)
            .style('font-weight', '600')
            .text(`${group}: ${end.rate.toFixed(1)}%`)
            .transition()
            .duration(800)
            .attr('y', this.scaleY(end.rate));
    });
}

    #updateAxes() {
        let xAxis = d3.axisBottom(this.scaleX)
            .tickSize(0)
            .tickPadding(10);

        this.axisXGroup.call(xAxis)
            .select('.domain').remove();

        let yAxis = d3.axisLeft(this.scaleY)
            .tickValues([0, 25, 50, 75, 100])
            // .ticks(5)
            .tickFormat(d => d + '%')
            .tickSize(-this.innerWidth);

        this.axisYGroup.call(yAxis)
            .select('.domain').remove();

        this.axisYGroup.selectAll('.tick line')
            .attr('stroke', '#e5e7eb')
            .attr('stroke-dasharray', '3,3');
    }

    #updateLegend() {
        this.legendContainer.selectAll('*').remove();

        let legendEntries = [
            { label: 'Immigrants', colour: palette.immigrants },
            { label: 'Natives', colour: palette.natives }
        ];

        legendEntries.forEach(item => {
            let legendItem = this.legendContainer.append('span')
                .style('display', 'inline-flex')
                .style('align-items', 'center')
                .style('margin-right', '16px')
                .style('font-size', '12px')
                .style('color', palette.ink);

            legendItem.append('span')
                .style('width', '12px')
                .style('height', '12px')
                .style('border-radius', '50%')
                .style('background', item.colour)
                .style('display', 'inline-block')
                .style('margin-right', '6px');

            legendItem.append('span')
                .text(item.label);
        });
    }

    render(data = [], state = {}) {
        this.data = data;
        this.state = state;

        let chartData = this.#prepareData();

        this.#updateScales(chartData);
        this.#updateMarks(chartData);
        this.#updateAxes();
        this.#updateLegend();

        return this;
    }
}