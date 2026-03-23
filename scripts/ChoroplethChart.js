'use strict';

/* This file handles the choropleth chart 
Assigned team member: Seyi

*/

// Import required functions/variables
import { normalizeName, palette } from './utils.js';

export default class ChoroplethChart{

    // Attributes
    width; height; margin;
    svg; mapGroup; regionSelection; backgroundRect;
    projection; pathGen;
    data; state; regions;
    colorScale; lookup;
    isMapInitialised = false;

    mapBackgroundClick = () => {};

    constructor (container, legendContainer, width, height, margin){

        this.width = width;
        this.height = height;
        this.margin = margin;

        // Set up selection
        this.svg = d3.select(container).append("svg")
            .classed("viz choropleth", true)
            .attr("width", this.width)
            .attr("height", this.height);

        // Transparent background to catch clicks outside municipalities
        this.backgroundRect = this.svg.append('rect')
            .classed('map-background', true)
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('fill', 'transparent')
            .style('pointer-events', 'all')
            .on('click', (event) => {
                this.mapBackgroundClick(event);
            });

        // Group to hold the map
        this.mapGroup = this.svg.append('g')
            .classed('map', true);

        // Legend container
        this.legendContainer = d3.select(legendContainer);

        // this.chart = this.svg.append("g");

        // this.path = d3.geoPath();

    }

    #getMunicipalityMatch(feature){
        let name = normalizeName(feature.properties.shapeName);
        return this.lookup.get(name) || null;
    }

    #getMunicipalityFill(feature){
        let match = this.#getMunicipalityMatch(feature);

        return match ? this.colorScale(match.immigrantShare) : '#eee';
    }

    #updateEvents(){

        if (!this.regionSelection) return;

        this.regionSelection
            .on('mouseover', (event, d) => {
                let match = this.#getMunicipalityMatch(d);
                this.regionHover(event, d, match);
            })
            .on('mouseout', (event, d) => {
                let match = this.#getMunicipalityMatch(d);
                this.regionOut(event, d, match);
            })
            .on('click', (event, d) => {

                // Prevent region clicks causing the background to clear.
                event.stopPropagation();

                let match = this.#getMunicipalityMatch(d);
                this.regionClick(event, d, match);
            });
    }
    

    // Build the static map once, then only update visual properties afterwards.
    #updateMap(projection = d3.geoMercator){

        if (!this.isMapInitialised){
                
            this.projection = projection()
                .fitSize([this.width, this.height], this.regions);

            this.pathGen = d3.geoPath()
                .projection(this.projection);

            this.regionSelection = this.mapGroup.selectAll('path.regions')
                .data(this.regions.features)
                .join('path')
                .classed('regions', true)
                .attr('d', this.pathGen)
                .attr('stroke', palette.border)
                .style('cursor', 'pointer');

            this.isMapInitialised = true;
        }

        // Refresh interactions after the selection has been updated.
        this.#updateRegionStyles(); 
        this.#updateEvents();

    }

    /*
    Update only the visual components that change with filters or selections.
    This optimizes the chart rather than rebuilding the geometry on every render.
    */
    #updateRegionStyles(){
        const anim = 350;

        // this.regionSelection
        //     .transition()
        //     .duration(anim)
        //     // .ease(d3.easeCubicInOut)
        //     .attr('fill', d => this.#getMunicipalityFill(d))
        //     .attr('stroke-width', d => {
        //         let name = normalizeName(d.properties.shapeName);
        //         let isSelected = this.state.selectedMunicipality &&
        //             normalizeName(this.state.selectedMunicipality) === name;

        //         return isSelected ? 2 : 0.8;
        //     });

        this.regionSelection
            .transition()
            .duration(anim)
            .attr('fill', d => this.#getMunicipalityFill(d))
            .attr('stroke-width', d => {
                let name = normalizeName(d.properties.shapeName);
                let isSelected = this.state.selectedMunicipality &&
                    normalizeName(this.state.selectedMunicipality) === name;

                return isSelected ? 2 : 0.8;
            })
            .attr('opacity', d => {
                // When nothing is selected, show all municipalities equally.
                if (!this.state.selectedMunicipality) return 1;

                let name = normalizeName(d.properties.shapeName);
                let isSelected =
                    normalizeName(this.state.selectedMunicipality) === name;

                // Fade non-selected municipalities so the active one stands out.
                return isSelected ? 1 : 0.35;
            });
    }

    // Function to render the Legend
    #renderLegend(){
        this.legendContainer.html('');

        this.legendContainer.append('div')
            .classed('legend', true)
            .text('Immigrant share (%)');
    }

    setRegionClick(f = () => {}){
        this.regionClick = f;
        this.#updateEvents();
        return this;
    }

    setRegionHover(f = () => {}){
        this.regionHover = f;
        this.#updateEvents();
        return this;
    }

    setRegionOut(f = () => {}){
        this.regionOut = f;
        this.#updateEvents();
        return this;
    }

    setMapBackgroundClick(f = () => {}){
        this.mapBackgroundClick = f;
        return this;
    }


    // Render the Choropleth map
    render(data = [], regions = null, state = {}){
        this.data = data;
        this.regions = regions;
        this.state = state;

        // Filter the data to the selected year
        let filtered = this.data.filter(d => d.year === this.state.year);

        // Create lookup table for matching municipality names
        this.lookup = new Map(
            filtered.map(d => [normalizeName(d.municipality), d])
        );

        // Create color scale
        this.colorScale = d3.scaleSequential()
            .domain([0, d3.max(this.data, d => d.immigrantShare)])
            .interpolator(t => d3.interpolateBlues(0.25 + t * 0.75));

        // Render the map and legend
        this.#updateMap(d3.geoMercator);
        this.#renderLegend();

        return this;
    }
}