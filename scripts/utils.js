'use strict';

// This script handles all reusable functions

const chartWidth = 636

/*
* Dataset attribute values are defined in the "values" object
*/
export const values = {
    background: {
        immigrants: "Immigrants",
        natives: "Natives"
    },

    year: {
        2011: 2011,
        2021: 2021
    },

    sex: {
        females: "Females",
        males: "Males"
    },

    education: {
        basic: "Basic education",
        upperSecondary: "Upper secondary education",
        tertiary: "Tertiary education" 
    },

    employmentStatus: {
        employed: "Employed",
        notEmployed: "Not employed"
    }
};


/*
* Chart dimensions are defined here, to keep things well structured
*/
export const chartConfig = {
    
    // Dimensions for Choropleth chart
    choroplethChart: {
        width: chartWidth,
        height: 360,
        margin: [12, 12, 12, 12]
    },

    pyramidChart: {
        width: chartWidth,
        height: 340,
        margin: [24, 48, 44, 48]
    },

    slopeChart: {
        width: chartWidth,
        height: 260,
        margin: [24, 56, 44, 56]
    },

    groupedBarChart: {
        width: chartWidth,
        heigh: 300,
        margin: [24, 56, 52, 56]
    },

    heatmapChart: {
        width: 636,
        height: 250,
        margin: [24, 40, 52, 88]
    }
};


/*
* Chart color palettes are defined here, to keep things well structured
*/
export const palette = {
    immigrants: "#0077b6",
    natives: "#d95f02",

    map: {
        low: '#deebf7',
        mid: '#9ecae1',
        high: '#08519c'
    },

    heatmap: {
        negative: '#b91c1c',
        neutral: '#f3f4f6',
        positive: '#15803d'
    },

    ink: '#111827',
    muted: '#6b7280',
    border: '#d1d5db'

};


/*
* Converts the municipality name in the dataset to the format in the geoJSON
* @param {string} name - Municipality name from dataset
*/
export function normalizeName(name){

    let normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return normalizedName;
}

