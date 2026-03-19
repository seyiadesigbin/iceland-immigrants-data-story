'use strict';

/* This file handles the choropleth chart 
Assigned team member: Seyi

*/

// Import required functions/variables
import { normalizedName } from './utils.js';

export default class ChoroplethChart{

    // Attributes
    width; height; margin;
    svg; chart;
    path;
    colorScale;

    constructor (container, legendContainer, width, height, margin){

        this.width = width;
        this.height = height;
        this.margin = margin;

        this.svg = d3.select(container)
            .append("svg")
            .classed("")
            .attr("width", this.width)
            .attr("height", this.height);

        this.chart = this.svg.append("g");

        this.path = d3.geoPath();

    }

    #updateMap(){

        this.chart.selectAll("path")
            .data(this.geo.features)
            .join("path")
            .attr("d", this.path)
            .attr("fill", d => {
                let name = this.normalizeName(d.properties.shapeName);
                let match = this.lookup.get(name);
                return match ? this.colorScale(match.immigrantShare) : "#eee";
            })
            .attr("stroke", "#333");

    }

    render(data, geo, state, normalizeName){

        this.data = data;
        this.geo = geo;
        this.state = state;
        this.normalizeName = normalizeName;

        let filtered = this.data.filter(d => d.year === this.state.year);

        this.lookup = new Map();
        filtered.forEach(d=>{
            this.lookup.set(normalizeName(d.municipality), d);
        });

        let projection = d3.getoMercator()
            .fitSize([this.width, this.height], this.geo);

        this.path.projection(projection);

        let max = d3.max(this.data, d=>d.immigrantShare);

        this.colorScale = d3.scaleSequential()
            .domain([0, max])
            .interpolator(d3.interpolateBlues);

        this.#updateMap()

        return this;
    }

}