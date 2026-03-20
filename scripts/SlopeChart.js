'use strict';

/* This file handles the slope chart 
Assigned team member: 

*/

// Import required functions/variables
import { palette, chartConfig } from './utils.js';

export default class SlopeChart{

    // Attributes
    width; height; margins;
    svg; chartGroup;

    data; state;

    constructor (container, legendContainer, width, height, margins) {

        this.width = width;
        this.height = height;
        this.margins = margins;

        this.svg = d3.select(container).append('svg')
            .classed('viz slope-chart', true)
            .attr('width', width)
            .attr('height', height);

        this.chartGroup = this.svg.append('g')
            .attr('transform', `translate(${margins.left}, ${margins.top})`);

    }

    /*
    Chart scales
    */
    #updateScales() {

    }

    /*
    Chart marks
    */
    #updateMarks(){
        
    }

    /*
    Legend logic goes in here 
    */
    #updateLegend(){
        
    }

    // Render the chart
    render (data = [], state = {}){
        this.data = data;
        this.state = state;

        this.#updateScales();
        this.#updateMarks();
        this.#updateLegend();

        return this;
    }

}