'use strict';

// Import required functions
import {calculateEmploymentRates, calculateMunicipalityShare} from './preprocess.js'
import {chartConfig, values} from './utils.js'

// Import the charts
import ChoroplethChart from './ChoroplethChart.js'
import GroupedBarChart from './GroupedBarChart.js'
import HeatmapChart from './HeatmapChart.js'
import PyramidChart from './PyramidChart.js'
import SlopeChart from './SlopeChart.js'

// Define directory of data files
const backgroundDir = "data/datasets/background.csv"
const educationDir = "data/datasets/education.csv"
const labourDir = "data/datasets/labour.csv"
// const geoDir = "data/geo_json/iceland_municipalities.geojson"
const geoDir = "data/json/geoBoundaries-ISL-ADM2.topo.json"


// Shared app state- to store selectons needed for bidirectional interactions
const state = {
    year: 2021,
    selectedMunicipality: null,
    selectedEducation: null,
    selectedAgeGroup: null
};


// To store loaded data required for app to function
const appData = {
    background: [],
    education: [],
    labour: [],
    municipalityShare: [],
    employmentRates: [],
    geo: null
};

/* Datasets row parse */

// Background dataset
function parseBackgroundRow(d){
    return {
        municipality: d.Municipality,
        ageGroup: d.Age_Group,
        background: d.Background,
        year: +d.Year,
        sex: d.Sex,
        population: +d.Population,
    };
}

// Education dataset
function parseEducationRow(d){
    return {
        ageGroup: d.Age_Group,
        background: d.Background,
        year: +d.Year,
        sex: d.Sex,
        education: d.Education,
        population: +d.Population,
    };
}

// Labour dataset
function parseLabourRow(d){
    return {
        ageGroup: d.Age_Group,
        empStatus: d.Employment_Status,
        background: d.Background,
        education: d.Education,
        year: +d.Year,
        sex: d.Sex,
        population: +d.Population,
    };
}


/* Load all datasets required for the app */
async function loadData(){

    // Promise.all lets all files load at the same time
    const loadedData = await Promise.all([
        d3.csv(backgroundDir, parseBackgroundRow),
        d3.csv(educationDir, parseEducationRow),
        d3.csv(labourDir, parseLabourRow),
        d3.json(geoDir)
    ]);

    appData.background = loadedData[0];
    appData.education = loadedData[1];
    appData.labour = loadedData[2];

    // Convert topojson data
    const topoData = loadedData[3]
    appData.geo = topojson.feature(topoData, topoData.objects.ISLADM2gbOpen);

}





// Verify loaded data
function validateLoadedData(){

    console.log("================= Validate Loaded Data =================")
    console.log("Background row count: ", appData.background.length);
    console.log("Education row count: ", appData.education.length);
    console.log("Labour row count: ", appData.labour.length);

    console.log("Background sample row: ", appData.background[0]);
    console.log("Education sample row: ", appData.education[0]);
    console.log("Labour sample row: ", appData.labour[0]);

    console.log("Geo Sample: ", appData.geo.features[0].properties);

    console.log("\n\n================= End of Validation =================\n\n")
}


/*
Create Choropleth chart object and interactivity functions
*/
const choroplethChart = new ChoroplethChart(
    "#choropleth-chart",
    "#choropleth-legend",
    chartConfig.choroplethChart.width,
    chartConfig.choroplethChart.height,
    chartConfig.choroplethChart.margins,
);


const tooltip = d3.select('body').append('div')
    .classed('chart-tooltip', true)
    .style('opacity', 0);

function moveTooltip(event){
    tooltip
        .style('left', `${event.pageX + 12}px`)
        .style('top', `${event.pageY - 28}px`);
}

function showRegionTooltip(event, feature, row){
    let shareText = row ? `${row.immigrantShare.toFixed(1)}%` : 'No data';

    tooltip
        .style('opacity', 1)
        .html(`
            <strong>${feature.properties.shapeName}</strong>
            <span>Year: ${state.year}</span>
            <span>Immigrant share: ${shareText}</span>
        `);

    moveTooltip(event);
}

function hideRegionTooltip(){
    tooltip.style('opacity', 0);
}

function selectMunicipality(event, feature, row){
    state.selectedMunicipality = row ? row.municipality : feature.properties.shapeName;
    renderAll();
}

function syncYearToggleButtons(){
    d3.selectAll('#chapter1-year-toggle .toggle-btn')
        .classed('active', false)
        .filter(function(){
            return +this.dataset.year === state.year;
        })
        .classed('active', true);
}

function setYear(year){
    state.year = year;
    syncYearToggleButtons();
    renderAll();
}

function bindControls(){
    d3.selectAll('#chapter1-year-toggle .toggle-btn')
        .on('click', function(){
            setYear(+this.dataset.year);
        });
}

// Update Chapter 1 chart title
function updateChapter1DetailTitle(){
    let titleText = state.selectedMunicipality
        ? `Population Growth by Age Group - ${state.selectedMunicipality}`
        : `Population Growth by Age Group - All municipalities`;

    d3.select('#chapter1-detail-title').text(titleText);
}



// /*
// Create Pyramid chart object and interactivity functions
// */
// const pyramidChart = new PyramidChart(
//     "#pyramid-chart",
//     "#pyramid-legend",
//     chartConfig.pyramidChart.width,
//     chartConfig.pyramidChart.height,
//     chartConfig.pyramidChart.margins,
// );



// Create Chapter1 Grouped bar chart object 
const chapter1GroupBarChart = new GroupedBarChart (
    "#chp1-grouped-bar-chart",
    "#chp1-groupedbar-legend",
    chartConfig.groupedBarChart.width,
    chartConfig.groupedBarChart.height,
    chartConfig.groupedBarChart.margins,
);

// Tooltip callback
function showAgeGrowthTooltip(event, d){
    let growthText = d.value === null ? 'n/a (2021 baseline = 0' : `${d.value.toFixed(1)}%`;

    tooltip
        .style('opactity', 1)
        .html(`
            <strong>${d.ageGroup}</strong>
            <span>${d.background}</span>
            <span>2011 population: ${d3.format(',')(d.startValue)}</span>
            <span>2021 population: ${d3.format(',')(d.endValue)}</span>
            <span>Growth: ${growthText}</span> 
        `);

    moveTooltip(event);
}

function selectedAgeGroup(event, d){
    state.selectedAgeGroup = state.selectedAgeGroup === d.ageGroup ? null : d.ageGroup;
    renderAll();
}



// Render all charts
function renderAll(){

    choroplethChart.render(appData.municipalityShare, appData.geo, state) // render choropleth chart
    chapter1GroupBarChart.render(appData.background, state);

    // pyramidChart.render(appData.background, state);

    updateChapter1DetailTitle();

}

// Start the application
async function init(){
    try{
        await loadData();
        validateLoadedData();

        appData.municipalityShare = calculateMunicipalityShare(appData.background);
        appData.employmentRates = calculateEmploymentRates(appData.labour);

        // Test municipality share and employment rates functions
        console.log("Municipality Share: ", appData.municipalityShare);
        console.log("Employment Rates: ", appData.employmentRates);


        console.log("Check: ", appData.employmentRates.filter(d => d.year === 2021 && d.background === "Immigrants" ))

        choroplethChart
            .setRegionHover(showRegionTooltip)
            .setRegionOut(hideRegionTooltip)
            .setRegionClick(selectMunicipality);

        chapter1GroupBarChart
            .setBarHover((event, d) => showAgeGrowthTooltip(event, d))
            .setBarOut(hideRegionTooltip)
            .setBarClick(selectedAgeGroup);
            
        bindControls();
        syncYearToggleButtons();
        renderAll();

        console.log("App initialized successfully.");
    }catch (error){
        console.error("Error initializing app: ", error);
    }
}

init();

// console.log(appData.background)

// Load all datasets in D3