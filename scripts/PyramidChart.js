'use strict';

/* This file handles the pyramid chart 
Assigned team member: Seyi

*/

// Import required functions/variables
import { palette, chartConfig, values } from './utils.js';

export default class PyramidChart{

    // Attributes
    width; height; margins;
    svg; chart; bars; axisX; axisY; labelX; labelY; title;
    scaleX; scaleY;

    data; state;
    ageData; barData;
    legendContainer;

    // Callback attributes
    barClick = () => {};
    barHover = () => {};
    barOut = () => {};

    // Format values on the x-axis
    axisFormat = d3.format(',');

    constructor (container, legendContainer, width, height, margins) {

        this.width = width;
        this.height = height;
        this.margins = margins;
        this.legendContainer = legendContainer;

        this.svg = d3.select(container).append('svg')
            .classed('viz pyramid-chart', true)
            .attr('width', this.width)
            .attr('height', this.height);

        this.chart = this.svg.append('g')
            .attr('transform', `translate(${margins.left}, ${margins.top})`);

        this.bars = this.chart.selectAll('rect.bar');

        this.axisX = this.svg.append('g')
            .attr('transform', `translate(${this.margins.left}, ${this.height - this.margins.bottom})`);
        
        this.axisY = this.svg.append('g')
            .attr('transform',  `translate(${this.margins.left}, ${this.margins.top})`);

        this.labelX = this.svg.append('text')
            .attr('transform', `translate(${this.width/2}, ${this.height})`)
            .style('text-anchor', 'middle')
            .attr('dy', -5)
            .text('Immigrant Population');

        this.labelY = this.svg.append('text')
            .attr('transform', `translate(${this.margins.top}) rotate(-90)`)
            .style('text-anchor', 'end')
            .attr('dy', 15)
            .text('Age Group');

        this.title = this.svg.append('text')
            .classed('title', true)
            .attr('transform', `translate(${this.width / 2}, ${this.margins.top})`)
            .style('text-anchor', 'middle');

    }


    /*
    Prepare internal chart data.
    The pyramid disaggregates the immigrants statistics by age group and sex
    */
    #updateData(){
        let filtered = this.data.filter(d => 
            d.year === this.state.year &&
            d.background === values.background.immigrants
        );

        let municipalityFiltered = this.state.selectedMunicipality
            ? filtered.filter(d => d.municipality === this.state.selectedMunicipality)
            : filtered;

        let rolled = d3.rollup(
            municipalityFiltered,
            v => d3.sum(v, d => d.population),
            d => d.ageGroup,
            d => d.sex
        );

        this.ageData = Array.from(rolled, ([ageGroup, sexMap]) => ({
            ageGroup,
            males: sexMap.get(values.sex.males) || 0,
            females: sexMap.get(values.sex.females) || 0
        }));

        // Keep a stable age-group order
        this.ageData.sort((a, b) => d3.ascending(a.ageGroup, b.ageGroup));

        this.barData = this.ageData.flatMap(d => ([
            {
                key: `${d.ageGroup}-males`,
                ageGroup: d.ageGroup,
                sex: values.sex.males,
                value: -d.males,
                absValue: d.males
            },
            {
                key: `${d.ageGroup}-females`,
                ageGroup: d.ageGroup,
                sex: values.sex.females,
                value: d.females,
                absValue: d.females
            }
        ]));
    }

    /*
    Update scales after data preparation
    */
    
    #updateScales() {
        const chartWidth = this.width - this.margins.left - this.margins.right;
        const chartHeight = this.height - this.margins.top - this.margins.bottom;
        const maxValue = d3.max(this.barData, d => d.absValue) || 0;

        // let maxValue = d3.max(
        //     this.data.filter(d => d.background === values.background.immigrants),
        //     d => d.population
        // ) || 0;

        this.scaleX = d3.scaleLinear()
            .domain([-maxValue, maxValue])
            .range([0, chartWidth])
            .nice();

        this.scaleY = d3.scaleBand()
            .domain(this.ageData.map(d => d.ageGroup))
            .range([chartHeight, 0])
            .padding(0.1);
    }

    // Refresh bar interactions after the join

    #updateEvents(){
        if (!this.bars) return;

        this.bars
            .on('mouseover', this.barHover)
            .on('mouseout', this.barOut)
            .on('click', (event, d) => {
                this.barClick(event, d)
            });
    }
    
    // Draw or update the bars
    #updateMarks(){
        let anim = 350;
        let centreX = this.scaleX(0);

        this.bars = this.bars
            .data(this.barData, d => d.key)
            .join(
                enter => enter.append('rect')
                    .attr('x', centreX)
                    .attr('y', d => this.scaleY(d.ageGroup))
                    .attr('width', 0)
                    .attr('height', this.scaleY.bandwidth()),
                update => update,
                exit => exit.transition().duration(anim)
                    .attr('x', centreX)
                    .attr('width', 0)
                    .remove()
            )
            .classed('bar', true)
            .classed('selected', d => this.state.selectedAgeGroup === d.ageGroup)
            .attr('fill', d =>
                d.sex === values.sex.males
                    ? palette.immigrants
                    : palette.natives
            );

        this.bars.transition().duration(anim)
            .attr('x', d => Math.min(this.scaleX(d.value), centreX))
            .attr('y', d => this.scaleY(d.ageGroup))
            .attr('width', d => Math.abs(this.scaleX(d.value) - centreX))
            .attr('height', this.scaleY.bandwidth());

        this.bars.selectAll('title')
            .data(d => [d])
            .join('title')
            .text(d => `${d.ageGroup} | ${d.sex}: ${this.axisFormat(d.absValue)}`);

        this.#updateEvents();
        
    }

    // Draw axes
    #updateAxes(){
        let axisGenX = d3.axisBottom(this.scaleX)
            .ticks(6)
            .tickFormat(d => this.axisFormat(Math.abs(d)));

        let axisGenY = d3.axisLeft(this.scaleY);

        this.axisX.transition().duration(300).call(axisGenX);
        this.axisY.transition().duration(300).call(axisGenY);
    }

    /*
    Legend logic goes in here 
    */
    #updateLegend(){
        let legendData = [
            {  label: values.sex.males, color: palette.immigrants },
            { label: values.sex.females, color: palette.natives}
        ];

        let items = this.legendContainer.selectAll('div.legend-item')
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

    // Render the chart
    render (data = [], state = {}){
        this.data = data;
        this.state = state;

        this.#updateData();
        this.#updateScales();
        this.#updateMarks();
        this.#updateAxes();
        this.#updateLegend();

        this.setTitle(
            this.state.selectedMunicipality
                ? `Immigrant Population Pyramid - ${this.state.selectedMunicipality}`
                : 'Immigrant Population Pyramid - All municipalities'
        );

        return this;
    }

    setTitle(title = ''){
        this.title.text(title);
        return this;
    }

    setBarClick(f = () => {}){
        this.barClick = f;
        this.#updateEvents();
        return this;
    }

    setBarHover(f = () => {}){
        this.barHover = f;
        this.#updateEvents();
        return this;
    }

    setBarOut(f = () => {}){
        this.barOut = f;
        this.#updateEvents();
        return this;
    }

}