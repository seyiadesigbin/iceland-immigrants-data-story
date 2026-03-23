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
        margins: {
            top: 12,
            right: 12,
            bottom: 12,
            left: 12,
        }
    },

    pyramidChart: {
        width: chartWidth,
        height: 340,
        margins: {
            top: 24,
            right: 48,
            bottom: 44,
            left: 48,
        }
    },

    slopeChart: {
        width: chartWidth,
        height: 260,
        margins: {
            top: 24,
            right: 56,
            bottom: 44,
            left: 56,
        }
    },

    groupedBarChart: {
        width: chartWidth,
        height: 300,
        margins: {
            top: 24,
            right: 56,
            bottom: 52,
            left: 80,
        }
    },

    heatmapChart: {
        width: 636,
        height: 250,
        margins: {
            top: 24,
            right: 40,
            bottom: 52,
            left: 88,
        }
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
    border: '#717174'

};



// Municipality name mapping geoJSON vs CSV
const municipalityAliases = {
    'hafnarfjardarbaer': 'hafnarfjardarkaupstadur',
    'sandgerdisbaer': 'sudurnesjabaer',
    'sveitarfelagid gardur': 'sudurnesjabaer',
    'sveitarfelagid skagafjordu': 'sveitarfelagid skagafjordur',
    'akureyrarkaupstadur': 'akureyrarbaer',
    'seydisfjardarkaupstadur': 'mulathing',
    'borgarfjardarhreppur': 'mulathing',
    'breiddalshreppur': 'fjardabyggd',
    'djupavogshreppur': 'mulathing',
    'fljotsdalsherad': 'mulathing',
    'sveitarfelagid hornafjordu': 'sveitarfelagid hornafjordur'
};


/*
* Converts the municipality name in the dataset to the format in the geoJSON
* @param {string} name - Municipality name from dataset
*/
export function normalizeName(name){

    // let normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let normalizedName = name
        .toLowerCase()
        .trim()
        .replaceAll('á', 'a')
        .replaceAll('é', 'e')
        .replaceAll('í', 'i')
        .replaceAll('ó', 'o')
        .replaceAll('ú', 'u')
        .replaceAll('ý', 'y')
        .replaceAll('ö', 'o')
        .replaceAll('æ', 'ae')
        .replaceAll('ð', 'd')
        .replaceAll('þ', 'th')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return municipalityAliases[normalizedName] || normalizedName;
}

