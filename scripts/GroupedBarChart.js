'use strict';

/* This file implements the grouped bar chart. */

// Import required functions/variables
import { palette, values} from './utils.js';

export default class GroupedBarChart{

    // Attributes
    width; height; margins;
    svg; chart; bars; axisX; axisY; labelX; labelY; title; backgroundRect;
    scaleX; scaleY;

    data; state;
    ageData; barData;
    legendContainer;

    // Callback attributes
    barClick = () => {};
    barHover = () => {};
    barOut = () => {};
    chartBackgroundClick = () => {};

    constructor (container, legendContainer, width, height, margins) {

        this.width = width;
        this.height = height;
        this.margins = margins;
        this.legendContainer = d3.select(legendContainer);

        this.anim = 450; // Value to control animation speed


        this.svg = d3.select(container).append('svg')
            .classed('viz grouped-bar-chart', true)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('width', '100%')
            .attr('height', 'auto');

        this.chart = this.svg.append('g')
            .attr('transform', `translate(${margins.left}, ${margins.top})`);

        // Transparent background to catch clicks outside the bars.
        this.backgroundRect = this.chart.append('rect')
            .classed('chart-background', true)
            .attr('fill', 'transparent')
            .style('pointer-events', 'all');

        this.bars = this.chart.selectAll('rect.bar');

        this.axisX = this.svg.append('g')
            .classed('axis axis-x', true)
            .attr('transform', `translate(${this.margins.left}, ${this.height - this.margins.bottom})`);
        
        this.axisY = this.svg.append('g')
            .classed('axis axis-y', true)
            .attr('transform',  `translate(${this.margins.left}, ${this.margins.top})`);

        this.zeroLine = this.chart.append('line')
            .classed('zero-line', true);

        this.labelX = this.svg.append('text')
            .attr('transform', `translate(${this.width/2}, ${this.height})`)
            .style('text-anchor', 'middle')
            .attr('dy', -5)
            .text('Age Group')
            .classed('axis-title', true);

        this.labelY = this.svg.append('text')
            .attr('transform', `translate(10, ${this.margins.top}) rotate(-90)`)
            .style('text-anchor', 'end')
            .attr('dy', 10)
            .attr('dx', -50)
            .text('Population Change')
            .classed('axis-title', true);

        this.title = this.svg.append('text')
            .classed('title', true)
            .attr('transform', `translate(${this.width / 2}, ${this.margins.top})`)
            .style('text-anchor', 'middle');

    }

    // Calculate population change between 2011 and 2021.
    #getChange(population2011, population2021){

        let startValue = +population2011 || 0;
        let endValue = +population2021 || 0;

        return endValue - startValue;
    }

    /*
    Prepare grouped-bar rows showing population change from 2011 to 2021
    for immigrants and natives within each age group.
    */
    #updateData(){
    
            let municipalityFiltered = this.state.selectedMunicipality
                ? this.data.filter(d => d.municipality === this.state.selectedMunicipality)
                : this.data;
    
            let rolled = d3.rollup(
                municipalityFiltered,
                v => d3.sum(v, d => d.population),
                d => d.ageGroup,
                d => d.background,
                d => d.year
            );
    
            this.ageData = Array.from(rolled, ([ageGroup, backgroundMap]) => {
                let immigrantYearMap = backgroundMap.get(values.background.immigrants) || new Map();
                let nativeYearMap = backgroundMap.get(values.background.natives) || new Map();

                let immigrants2011 = immigrantYearMap.get(2011) || 0;
                let immigrants2021 = immigrantYearMap.get(2021) || 0;
                let natives2011 = nativeYearMap.get(2011) || 0;
                let natives2021 = nativeYearMap.get(2021) || 0;

                return {
                    ageGroup,
                    immigrants2011,
                    immigrants2021,
                    natives2011,
                    natives2021,
                    immigrantGrowth: this.#getChange(immigrants2011, immigrants2021),
                    nativeGrowth: this.#getChange(natives2011, natives2021)
                };

            });
    
            // Keep age groups in a stable order
            this.ageData.sort((a, b) => d3.ascending(a.ageGroup, b.ageGroup));
    
            this.barData = this.ageData.flatMap(d => ([
                {
                    key: `${d.ageGroup}-immigrants`,
                    ageGroup: d.ageGroup,
                    background: values.background.immigrants,
                    startValue: d.immigrants2011,
                    endValue: d.immigrants2021,
                    value: d.immigrantGrowth,
                },
                {
                    key: `${d.ageGroup}-natives`,
                    ageGroup: d.ageGroup,
                    background: values.background.natives,
                    startValue: d.natives2011,
                    endValue: d.natives2021,
                    value: d.nativeGrowth,
                }
            ]));
        }

    /*
    Chart scales
    */
    #updateScales() {
        let chartWidth = this.width - this.margins.left - this.margins.right;
        let chartHeight = this.height - this.margins.top - this.margins.bottom;

        let validValues = this.barData
            .map(d => d.value)
            .filter(d => Number.isFinite(d));

        let minValue = validValues.length > 0 ? Math.min(0, d3.min(validValues)) : 0;
        let maxValue = validValues.length > 0 ? Math.max(0, d3.max(validValues)) : 1;

        this.scaleX = d3.scaleBand()
            .domain(this.ageData.map(d => d.ageGroup))
            .range([0, chartWidth])
            .padding(0.18);

        this.scaleGroup = d3.scaleBand()
            .domain([values.background.immigrants, values.background.natives])
            .range([0, this.scaleX.bandwidth()])
            .padding(0.08);

        this.scaleY = d3.scaleLinear()
            // .domain([-maxAbsValue, maxAbsValue])
            .domain([minValue, maxValue])
            .range([chartHeight, 0])
            .nice();

        // Keep the click-catcher the same size as the plotting area
        this.backgroundRect
            .attr('width', chartWidth)
            .attr('height', chartHeight);
        
    }

    // Refresh bar interactions after the join

    #updateEvents(){
        if (!this.bars) return;

        this.bars
            .on('mouseover', this.barHover)
            .on('mouseout', this.barOut)
            .on('click', (event, d) => {
                // Prevent bar clicks from also triggering the background reset.
                event.stopPropagation();
                this.barClick(event, d);
            });
    }

    // Refresh click handling for the empty chart area.
    #updateBackgroundEvent(){
        this.backgroundRect.on('click', (event) => {
            this.chartBackgroundClick(event);
        });
    }

    // Draw or update the bars
    #updateMarks(){
        let zeroY = this.scaleY(0);

        this.bars = this.bars
            .data(this.barData, d => d.key)
            .join(
                enter => enter.append('rect')
                    .attr('x', d => this.scaleX(d.ageGroup) + this.scaleGroup(d.background))
                    .attr('y', zeroY)
                    .attr('width', this.scaleGroup.bandwidth())
                    .attr('height', 0),
                update => update,
                exit => exit.transition().duration(this.anim)
                    .attr('y', zeroY)
                    .attr('height', 0)
                    .remove()
            )
            .classed('bar', true)
            .classed('selected', d => 
                this.state.selectedAgeGroup === d.ageGroup &&
                this.state.selectedBackground === d.background
            )
            .attr('fill', d =>
                d.background === values.background.immigrants
                    ? palette.immigrants
                    : palette.natives
            );                

        this.bars.transition().duration(this.anim)
            .attr('x', d => this.scaleX(d.ageGroup) + this.scaleGroup(d.background))
            .attr('y', d => d.value === null ? zeroY : Math.min(this.scaleY(d.value), zeroY))
            .attr('width', this.scaleGroup.bandwidth())
            .attr('height', d => d.value === null ? 0 : Math.abs(this.scaleY(d.value) - zeroY))
            .attr('opacity', d => {
                let hasSelectedBar = 
                    this.state.selectedAgeGroup && this.state.selectedBackground;

                let isSelected =
                    this.state.selectedAgeGroup === d.ageGroup &&
                    this.state.selectedBackground === d.background;

                // Keep this bar faint if it has no usable value.
                if (!Number.isFinite(d.value)) return 0.25;

                // Default state: show all bars normally.
                if (!hasSelectedBar) return 1;

                // Interaction state: keep the selected bar strong and dim the rest.
                return isSelected ? 1 : 0.25;

            });

        this.#updateEvents();
        this.#updateBackgroundEvent();
        
    }

    // Draw axes
    #updateAxes(){
        let chartWidth = this.width - this.margins.left - this.margins.right;
        let zeroY = this.scaleY(0);

        let axisGenX = d3.axisBottom(this.scaleX);
        let axisGenY = d3.axisLeft(this.scaleY);

        /* Keep age-group labels horizontal for easier scanning. */
        this.axisX.call(axisGenX);

        this.axisX.selectAll('text')
            .style('text-anchor', 'center')
            // .attr('dx', '-0.6em')
            // .attr('dy', '0.15em')
            .attr('transform', null);

        // Remove tick line
        this.axisX.selectAll('.tick line').remove();


        /* Keep the vertical axis clean so the zero line remains prominent. */
        this.axisY.transition().duration(this.anim).call(axisGenY)

        this.axisY.selectAll('.tick line').remove();

        this.zeroLine
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', zeroY)
            .attr('y2', zeroY)
            .attr('stroke', '#9ca3af')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');
    }

    
    /*
    Render the grouped-bar legend for immigrants and natives.
    */
    #updateLegend(){
        let legendData = [
            {  label: values.background.immigrants, color: palette.immigrants },
            { label: values.background.natives, color: palette.natives}
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

    setChartBackgroundClick (f = () => {}){
        this.chartBackgroundClick = f;
        this.#updateBackgroundEvent();
        return this;
    }

}