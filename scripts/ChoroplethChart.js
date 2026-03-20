'use strict';

/* This file handles the choropleth chart 
Assigned team member: Seyi

*/

// Import required functions/variables
import { normalizeName, palette } from './utils.js';

export default class ChoroplethChart{

    // Attributes
    width; height; margin;
    svg; mapGroup;
    projection; pathGen;
    data; state; regions;
    colorScale; lookup;

    constructor (container, legendContainer, width, height, margin){

        this.width = width;
        this.height = height;
        this.margin = margin;

        // Set up selection
        this.svg = d3.select(container).append("svg")
            .classed("viz choropleth", true)
            .attr("width", width)
            .attr("height", height);

        // Group to hold the map
        this.mapGroup = this.svg.append('g')
            .classed('map', true);

        // Legend container
        this.legendContainer = d3.select(legendContainer);

        // this.chart = this.svg.append("g");

        // this.path = d3.geoPath();

    }

    #getMunicipalityFill(feature){
        const name = normalizeName(feature.properties.shapeName);
        const match = this.lookup.get(name);

        return match ? this.colorScale(match.immigrantShare) : '#eee';
    }

    // Function to render the base map
    #renderMap(projection = d3.geoMercator){

        this.projection = projection()
            .fitSize([this.width, this.height], this.regions);

        this.pathGen = d3.geoPath()
            .projection(this.projection);

        this.mapGroup.selectAll('path.regions')
            .data(this.regions.features)
            .join('path')
            .classed('regions', true)
            .attr('d', this.pathGen)
            .attr('fill', d => this.#getMunicipalityFill(d))
            .attr('stroke', palette.border)
            .attr('stroke-width', d => {
                const name = normalizeName(d.properties.shapeName);
                const isSelected = this.state.selectedMunicipality &&
                    normalizeName(this.state.selectedMunicipality) === name;

                return isSelected ? 2 : 0.8;
            });

    }

    // Function to render the Legend
    #renderLegend(){
        this.legendContainer.html('');

        this.legendContainer.append('div')
            .classed('legend', true)
            .text('Immigrant share (%)');
    }

    // Render the Choropleth map
    render(data = [], regions = null, state = {}){
        this.data = data;
        this.regions = regions;
        this.state = state;

        // Filter the data to the selected year
        const filtered = this.data.filter(d => d.year === this.state.year);

        // Create lookup table for matching municipality names
        this.lookup = new Map(
            filtered.map(d => [normalizeName(d.municipality), d])
        );

        // Create color scale
        this.colorScale = d3.scaleSequential()
            .domain([0, d3.max(this.data, d => d.immigrantShare)])
            .interpolator(t => d3.interpolateBlues(0.25 + t * 0.75));

        // Render the map and legend
        this.#renderMap(d3.geoMercator);
        this.#renderLegend();

        return this;
    }
}