'use strict';

// Import required functions
import {calculateEmploymentRates, calculateMunicipalityShare, buildHeatmapData} from './preprocess.js'
import {chartConfig, values, getMunicipalityRegion} from './utils.js'

// Import the charts
import ChoroplethChart from './ChoroplethChart.js'
import GroupedBarChart from './GroupedBarChart.js'
import HeatmapChart from './HeatmapChart.js'
import SlopeChart from './SlopeChart.js'
import HorizontalDotPlot from './HorizontalDotPlot.js'

// Define directory of data files
const backgroundDir = "data/datasets/clean/background_clean.csv"
const educationDir = "data/datasets/clean/education_clean.csv"
const labourDir = "data/datasets/clean/labour_clean.csv"
const geoDir = "data/json/geoBoundaries-ISL-ADM2.topo.json"


// Shared app state used to store selections needed for linked interactions
const state = {
    chapter1Year: 2021,
    chapter2Year: 2021,
    selectedMunicipality: null,
    selectedEducation: null,
    selectedAgeGroup: null,
    selectedBackground: null,
    highlightedMunicipalities: []
};


// To store loaded data required for app to function
const appData = {
    background: [],
    education: [],
    labour: [],
    municipalityShare: [],
    employmentRates: [],
    heatmapData: [],
    geo: null
};


/* ============== Parse datasets rows ================== */

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
        ageGroup: String(d.Age_Group).trim().replace("65 and over", "65+"),
        empStatus: String(d.Employment_Status).trim(),
        background: String(d.Background).trim(),
        education: String(d.Education).trim(),
        year: +d.Year,
        sex: String(d.Sex).trim(),
        population: +String(d.Population).replace(/,/g, "").trim(),
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


// Verify loaded data for debugging only
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


/* =========================== Chapter 1 interactions ==========================*/

// Create choropleth chart object
const choroplethChart = new ChoroplethChart(
    "#choropleth-chart",
    "#choropleth-legend",
    chartConfig.choroplethChart.width,
    chartConfig.choroplethChart.height,
    chartConfig.choroplethChart.margins,
);

// Create Chapter1 Grouped bar chart object 
const chapter1GroupBarChart = new GroupedBarChart (
    "#chp1-grouped-bar-chart",
    "#chp1-groupedbar-legend",
    chartConfig.groupedBarChart.width,
    chartConfig.groupedBarChart.height,
    chartConfig.groupedBarChart.margins,
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
    let region = getMunicipalityRegion(feature.properties.shapeName);

    tooltip
        .style('opacity', 1)
        .html(`
            <strong>${feature.properties.shapeName}</strong>
            <span>Region: ${region}</span>
            <span>Year: ${state.chapter1Year}</span>
            <span>Immigrant share: ${shareText}</span>
        `);

    moveTooltip(event);
}

function hideTooltip(){
    tooltip.style('opacity', 0);
}

/*
Clicking a municipality selects it.
Clicking the same municipality again clears the municipality filter.

Any grouped-bar driven map highlight is cleared when the user switches
back to municipality selection mode.

*/

function selectMunicipality(event, feature, row){
    let municipalityName = row ? row.municipality : feature.properties.shapeName;

    state.selectedMunicipality = 
        state.selectedMunicipality === municipalityName ? null : municipalityName;

    
    // Reset the reverse interaction when the user returns to the map
    state.selectedAgeGroup = null;
    state.selectedBackground = null;
    state.highlightedMunicipalities = [];

    renderChapter1();;
}

// Clear Chapter 1 interaction state when the user clicks outside the map regions.
function clearMunicipalitySelection(){
    state.selectedMunicipality = null;
    state.selectedAgeGroup = null;
    state.selectedBackground = null;
    state.highlightedMunicipalities = [];

    renderChapter1();
}

function syncYearToggleButtons(){
    d3.selectAll('#chapter1-year-toggle .toggle-btn')
        .classed('active', false)
        .filter(function(){
            return +this.dataset.year === state.chapter1Year;
        })
        .classed('active', true);
}

function setChapter1Year(year){
    state.chapter1Year = year;
    syncYearToggleButtons();
    renderChapter1();
}

function bindControls(){
    d3.selectAll('#chapter1-year-toggle .toggle-btn')
        .on('click', function(){
            setChapter1Year(+this.dataset.year);
        });
}

// Update Chapter 1 chart title
function updateChapter1DetailTitle(){
    let titleText = state.selectedMunicipality
        ? `Population Growth by Age Group - ${state.selectedMunicipality}`
        : `Population Growth by Age Group - All municipalities`;

    d3.select('#chapter1-detail-title').text(titleText);
}

// Render Chapter 1
function renderChapter1(){
    choroplethChart.render(appData.municipalityShare, appData.geo, state);
    chapter1GroupBarChart.render(appData.background, state);
    updateChapter1DetailTitle();
}


/*
Chapter 1 reverse interaction:
the grouped bar chart can highlight matching municipalities on the map.
*/

/*
Return a small set of municipalities that best match the clicked grouped-bar value.

If the clicked bar is positive, highlight the municipalities with the 5 strongest positive change.
If the clicked bar is negative, highlight the municipalities with the 5 strongest negative change.
*/
function getHighlightedMunicipalitiesForBar(barData){
    let grouped = d3.rollup(
        appData.background.filter(d => 
            d.ageGroup === barData.ageGroup &&
            d.background === barData.background
        ),
        v => d3.sum(v, d => d.population),
        d => d.municipality,
        d => d.year
    );

    let changes = Array.from(grouped, ([municipality, yearMap]) => {
        let population2011 = yearMap.get(2011) || 0;
        let population2021 = yearMap.get(2021) ||0;

        return {
            municipality,
            change: population2021 - population2011
        };
    });

    let sameDirection = changes.filter(d =>
        barData.value >= 0 ? d.change > 0: d.change < 0
    );

    sameDirection.sort((a, b) => 
        barData.value >= 0
            ? d3.descending(a.change, b.change)
            : d3.ascending(a.change, b.change)
    );

    // Keep the highlight small so the map is not cluttered
    return sameDirection.slice(0, 5).map(d => d.municipality);
}

/*
Clicking a grouped-bar bar highlights the municipalities that best match
that age-group/background trend.

Clicking the same bar again clears the reverse interaction.
*/
function toggleGroupedBarMapHighlight(event, d){
    let isSameBar = 
        state.selectedAgeGroup === d.ageGroup &&
        state.selectedBackground === d.background;

    if (isSameBar){
        state.selectedAgeGroup = null;
        state.selectedBackground = null;
        state.highlightedMunicipalities = [];
    }
    else{
        // Switch out of municipality filter mode before applying the reverse interaction
        state.selectedMunicipality = null;
        state.selectedAgeGroup = d.ageGroup;
        state.selectedBackground = d.background;
        state.highlightedMunicipalities = getHighlightedMunicipalitiesForBar(d);
    }

    renderChapter1();;
}


// Show tooltip for Chapter 1 grouped-bar values.
function showAgeGrowthTooltip(event, d){
    let growthText = d.value === null ? 'n/a' : `${d.value.toLocaleString()}`;

    tooltip
        .style('opacity', 1)
        .html(`
            <strong>${d.ageGroup}</strong>
            <span>${d.background}</span>
            <span>2011 population: ${d3.format(',')(d.startValue)}</span>
            <span>2021 population: ${d3.format(',')(d.endValue)}</span>
            <span>Change: ${growthText}</span> 
        `);

    moveTooltip(event);
}


function clearGroupedBarSelection(){
    state.selectedAgeGroup = null;
    state.selectedBackground = null;
    state.highlightedMunicipalities = [];

    renderChapter1();
}


/* ======================= Chapter 2 charts and controls ======================= */

// Create Horizontal Dot Plot object
const horizontalDotPlot = new HorizontalDotPlot(
    "#horizontal-dotplot",
    chartConfig.horizontalDotPlot.width,
    chartConfig.horizontalDotPlot.height,
    chartConfig.horizontalDotPlot.margins,
);

const slopeChart = new SlopeChart(
    "#slope-chart",
    "#slope-legend",
    chartConfig.slopeChart.width,
    chartConfig.slopeChart.height,
    chartConfig.slopeChart.margins
);

// Show tooltip for the Chapter 2 horizontal dot plot.
function showEmploymentRateTooltip(event, d){
    tooltip
        .style('opacity', 1)
        .html(`
            <strong>${d.ageGroup}</strong>
            <span>Year: ${state.chapter2Year}</span>
            <span>Immigrants: ${d.immigrantRate.toFixed(1)}%</span>
            <span>Natives: ${d.nativeRate.toFixed(1)}%</span>
            <span>Gap: ${Math.abs(d.immigrantRate - d.nativeRate).toFixed(1)}pp (${d.immigrantRate < d.nativeRate ? 'Immigrants behind' : 'Immigrants ahead'})</span>
        `);
    moveTooltip(event);
}

// Bind dotplot year toggle
function bindDotPlotControls(){
    d3.selectAll('#dotplot-year-toggle .toggle-btn')
        .on('click', function(){
            d3.selectAll('#dotplot-year-toggle .toggle-btn').classed('active', false);
            d3.select(this).classed('active', true);
            state.chapter2Year = +this.dataset.year;
            horizontalDotPlot.render(appData.labour, state);
            heatmapChart.render(appData.heatmapData, state);
        });
}

// Bind level toggle
function bindLevelToggle(){
    d3.selectAll('#level-toggle .filter-btn')
        .on('click', function(){
            d3.selectAll('#level-toggle .filter-btn').classed('active', false);
            d3.select(this).classed('active', true);

            const edu = this.dataset.edu;
            if (edu === 'all-level') {
                state.selectedEducation = null;
            } else if (edu === 'basic-level') {
                state.selectedEducation = values.education.basic;
            } else if (edu === 'secondary-level') {
                state.selectedEducation = values.education.upperSecondary;
            } else if (edu === 'tertiary-level') {
                state.selectedEducation = values.education.tertiary;
            }

            renderAll();
        });
    }
    
/* ======================= Chapter 3 chart and controls ======================= */
const heatmapChart = new HeatmapChart(
    "#heatmap-chart",
    "#heatmap-legend",
    chartConfig.heatmapChart.width,
    chartConfig.heatmapChart.height,
    chartConfig.heatmapChart.margins,
    tooltip
);

function syncChapter3YearToggleButtons(){
    d3.selectAll('#chapter3-year-toggle .toggle-btn')
        .classed('active', false)
        .filter(function(){
            return +this.dataset.year === state.chapter2Year;
        })
        .classed('active', true);
}





// Central render function: refresh every chart from the current shared state.
function renderAll(){

    choroplethChart.render(appData.municipalityShare, appData.geo, state) // render choropleth chart
    chapter1GroupBarChart.render(appData.background, state);
    horizontalDotPlot.render(appData.labour, state); // render horizontal dot plot
    slopeChart.render(appData.employmentRates, state);// render SlopeChart
    heatmapChart.render(appData.heatmapData, state);

    updateChapter1DetailTitle();

}

// Start the application
async function init(){
    try{
        await loadData();
        

        appData.municipalityShare = calculateMunicipalityShare(appData.background);
        appData.employmentRates = calculateEmploymentRates(appData.labour);
        appData.heatmapData = buildHeatmapData(appData.employmentRates);

        choroplethChart
            .setRegionHover(showRegionTooltip)
            .setRegionOut(hideTooltip)
            .setRegionClick(selectMunicipality)
            .setMapBackgroundClick(clearMunicipalitySelection);

        chapter1GroupBarChart
            .setBarHover((event, d) => showAgeGrowthTooltip(event, d))
            .setBarOut(hideTooltip)
            .setBarClick(toggleGroupedBarMapHighlight)
            .setChartBackgroundClick(clearGroupedBarSelection);
            // .setBarClick(selectedAgeGroup);

        horizontalDotPlot
            .setDotHover((event, d) => showEmploymentRateTooltip(event, d))
            .setDotOut(hideTooltip)
            .setDotClick((event, d) => {
            state.selectedAgeGroup = state.selectedAgeGroup === d.ageGroup ? null : d.ageGroup;
            
            horizontalDotPlot.render(appData.labour, state);
            heatmapChart.render(appData.heatmapData, state);
            });
            
        bindControls();
        bindDotPlotControls();
        bindLevelToggle();
        syncYearToggleButtons();
        syncChapter3YearToggleButtons();
        renderAll();

        console.log("App initialized successfully.");
    }catch (error){
        console.error("Error initializing app: ", error);
    }
}

init();

// console.log(appData.background)

// Load all datasets in D3