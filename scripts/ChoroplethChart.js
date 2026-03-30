'use strict';

/* This file implements the Choropleth map. */

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

    }

    #getMunicipalityMatch(feature){
        let name = normalizeName(feature.properties.shapeName);
        return this.lookup.get(name) || null;
    }

    #getMunicipalityFill(feature){
        let match = this.#getMunicipalityMatch(feature);

        return match ? this.colorScale(match.immigrantShare) : palette.noColor;
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

        // The map keeps one fill meaning at all times; selections and reverse interaction
        // are shown through stroke emphasis and opacity instead of changing the color metric.

        this.regionSelection
            .transition()
            .duration(anim)
            .attr('fill', d => this.#getMunicipalityFill(d))
            .attr('stroke', d => {
                let name = normalizeName(d.properties.shapeName);
                let highlightedNames = (this.state.highlightedMunicipalities || []).map(normalizeName);

                let isSelected = this.state.selectedMunicipality &&
                    normalizeName(this.state.selectedMunicipality) === name;

                let isHighlighted = highlightedNames.includes(name);

                return (isSelected || isHighlighted) ? palette.ink : palette.border;
            })
            .attr('stroke-width', d => {
                let name = normalizeName(d.properties.shapeName);

                let highlightedNames = (this.state.highlightedMunicipalities || []).map(normalizeName);

                let isSelected = this.state.selectedMunicipality &&
                    normalizeName(this.state.selectedMunicipality) === name;


                let isHighlighted = highlightedNames.includes(name);

                if (isSelected) return 2.4;
                if (isHighlighted) return 1.6;
                return 0.8;

            })
            .attr('opacity', d => {
                let name = normalizeName(d.properties.shapeName);
                let highlightedNames = (this.state.highlightedMunicipalities || []).map(normalizeName);
                
                let hasBarDrivenHighlight = highlightedNames.length > 0;

                let isSelected = this.state.selectedMunicipality &&
                    normalizeName(this.state.selectedMunicipality) === name;

                let isHighlighted = highlightedNames.includes(name);

                // Municipality selection mode
                if (this.state.selectedMunicipality) {
                    return isSelected ? 1 : 0.35;
                }

                // Grouped-bar reverse interaction mode
                if (hasBarDrivenHighlight){
                    return isHighlighted ? 1 : 0.22;
                }

                // Default map view
                return 1;
            })
    }

    // Function to render the Legend
    #renderLegend(){

        // let minValue = 0;
        // let maxValue = d3.max(this.data, d => d.immigrantShare) || 0;

        let [minValue, maxValue] = this.colorScale.domain();
        let gradientSteps = d3.range(0, 1.01, 0.1);

        // Sample the actual color scale, so the legend matches the map exactly.
        let gradientStops = gradientSteps.map(t => {
            let value = minValue + (maxValue - minValue) * t;
            return `${this.colorScale(value)} ${t * 100}%`;
        }).join(', ');

        // Use readable interior ticks, but always include the exact max at the end.
        let tickValues = d3.ticks(minValue, maxValue, 3);

        if (tickValues[tickValues.length - 1] !== maxValue){
            tickValues = [...tickValues, maxValue];
        }

        this.legendContainer.html('');

        this.legendContainer.append('div')
            .classed('legend', true)
            .text('Immigrant share (%)');

        let legendScale = this.legendContainer.append('div')
            .classed('choropleth-legend-scale', true);

        /// Build the gradient bar from the sampled choropleth color scale.
        legendScale.append('div')
            .classed('choropleth-legend-gradient', true)
            .style('background', `linear-gradient(to right, ${gradientStops})`);
          
        let legendLabels = legendScale.append('div')
            .classed('choropleth-legend-labels', true);

        legendLabels.selectAll('span')
            .data(tickValues)
            .join('span')
            .text((d, i) => {
                let isLastTick = i === tickValues.length - 1;
                return isLastTick ? `${d.toFixed(1)}%` : `${d.toFixed(0)}%`;
            });
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

        if (!regions) return this;
        
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