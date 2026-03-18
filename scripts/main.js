// Define directory of data files
const backgroundDir = "data/datasets/background.csv"
const educationDir = "data/datasets/education.csv"
const labourDir = "data/datasets/labour.csv"

// Shared app state- to store selectons needed for bidirectional interactions
const state = {
    year: "2021",
    selectedMunicipality: null,
    selectedEducation: null,
    selectedAgeGroup: null
}; 

// To store loaded data
const appData = {
    background: [],
    education: [],
    labour: []
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

/* Load all dataset
Promise.all lets all three CSV files load at the same time
*/

async function loadData(){
    const loadedData = await Promise.all([
        d3.csv(backgroundDir, parseBackgroundRow),
        d3.csv(educationDir, parseEducationRow),
        d3.csv(labourDir, parseLabourRow)
    ]);

    appData.background = loadedData[0];
    appData.education = loadedData[1];
    appData.labour = loadedData[2];
}


// Compute municipality share for Choropleth chart
function calculateMunicipalityShare(){
    const data = appData.background;

    // Group the data by municipality + year
    const grouped = d3.rollup(
        data, 
        (rows) => {
            let total = 0;
            let immigrants = 0;

            rows.forEach((d) => {
                total += d.population;

                if (d.background == "Immigrants"){
                    immigrants += d.population;
                }
            });

            return {
                totalPopulation: total,
                immigrantPopulation: immigrants,
                immigrantShare: (immigrants/total) * 100
            };
        },
        (d) => d.municipality,
        (d) => d.year
    );


    // Convert Map to array
    const result = []

    grouped.forEach((yearMap, municipality) => {
        yearMap.forEach((values, year) => {
            result.push({
                municipality,
                year,
                ...values
            });
        });
    });

    return result;
}




// Verify loaded data
function validateLoadedData(){
    console.log("Background row count: ", appData.background.length);
    console.log("Education row count: ", appData.education.length);
    console.log("Labour row count: ", appData.labour.length);

    console.log("Background sample row: ", appData.background[0]);
    console.log("Education sample row: ", appData.education[0]);
    console.log("Labour sample row: ", appData.labour[0]);
}


// Functions to draw the charts
function renderChoropleth(){
    console.log("Render choroleth chart")
}

function renderPyramid(){
    console.log("Render population pyramid");
}

function renderSlope(){
    console.log("Render slope chart")
}

function renderGroupedBar(){
    console.log("Render grouped bar chart")
}

function renderHeatmap(){
    console.log("Render heatmap")
}


// Render all charts
function renderAll(){
    renderChoropleth();
    renderPyramid()
    renderSlope();
    renderGroupedBar();
    renderHeatmap();
}

// Start the application
async function init(){
    try{
        await loadData();
        validateLoadedData();
        renderAll();

        console.log("App initialized successfully.");
    }catch (error){
        console.error("Error initializing app: ", error);
    }
}

init();

// console.log(appData.background)

// Load all datasets in D3