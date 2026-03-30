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
        width: 600,
        height: 300,
        margins: {
            top: 24,
            right: 56,
            bottom: 30,
            left: 100,
        }
    },

    horizontalDotPlot: {
    width: chartWidth,
    height: 300,
    margins: {
        top: 24,
        right: 40,
        bottom: 52,
        left: 90,
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
* Municipality to region mapping.
* Keys are stored using the same normalized style used throughout the project.
* Regions follow Iceland's standard regional grouping in English.
*/
export const municipalityToRegion = {
    'akrahreppur': 'Northwest',
    'akraneskaupstadur': 'West',
    'akureyrarbaer': 'Northeast',
    'arneshreppur': 'Westfjords',
    'asahreppur': 'South',
    'blaskogabyggd': 'South',
    'blonduosbaer': 'Northwest',
    'bolungarvikurkaupstadur': 'Westfjords',
    'borgarbyggd': 'West',
    'dalabyggd': 'West',
    'dalvikurbyggd': 'Northeast',
    'eyja- og miklaholtshreppur': 'West',
    'eyjafjardarsveit': 'Northeast',
    'fjallabyggd': 'Northeast',
    'fjardabyggd': 'East',
    'fljotsdalshreppur': 'East',
    'floahreppur': 'South',
    'gardabaer': 'Capital Region',
    'grimsnes- og grafningshreppur': 'South',
    'grindavikurbaer': 'Southern Peninsula',
    'grundarfjardarbaer': 'West',
    'grytubakkahreppur': 'Northeast',
    'hafnarfjardarkaupstadur': 'Capital Region',
    'helgafellssveit': 'West',
    'hrunamannahreppur': 'South',
    'hunathing vestra': 'Northwest',
    'hunavatnshreppur': 'Northwest',
    'hvalfjardarsveit': 'West',
    'hveragerdisbaer': 'South',
    'isafjardarbaer': 'Westfjords',
    'kaldrananeshreppur': 'Westfjords',
    'kjosarhreppur': 'Capital Region',
    'kopavogsbaer': 'Capital Region',
    'langanesbyggd': 'Northeast',
    'mosfellsbaer': 'Capital Region',
    'mulathing': 'East',
    'myrdalshreppur': 'South',
    'nordurthing': 'Northeast',
    'rangarthing eystra': 'South',
    'rangarthing ytra': 'South',
    'reykholahreppur': 'Westfjords',
    'reykjanesbaer': 'Southern Peninsula',
    'reykjavikurborg': 'Capital Region',
    'seltjarnarnesbaer': 'Capital Region',
    'skaftarhreppur': 'South',
    'skagabyggd': 'Northwest',
    'skeida- og gnupverjahreppur': 'South',
    'skorradalshreppur': 'West',
    'skutustadahreppur': 'Northeast',
    'snaefellsbaer': 'West',
    'strandabyggd': 'Westfjords',
    'stykkisholmsbaer': 'West',
    'sudavikurhreppur': 'Westfjords',
    'sudurnesjabaer': 'Southern Peninsula',
    'svalbardshreppur': 'Northeast',
    'svalbardsstrandarhreppur': 'Northeast',
    'sveitarfelagid arborg': 'South',
    'sveitarfelagid hornafjordur': 'South',
    'sveitarfelagid olfus': 'South',
    'sveitarfelagid skagafjordur': 'Northwest',
    'sveitarfelagid skagastrond': 'Northwest',
    'sveitarfelagid vogar': 'Southern Peninsula',
    'talknafjardarhreppur': 'Westfjords',
    'thingeyjarsveit': 'Northeast',
    'tjorneshreppur': 'Northeast',
    'vestmannaeyjabaer': 'South',
    'vesturbyggd': 'Westfjords',
    'vopnafjardarhreppur': 'East'
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

/*
* Return the Icelandic region for a municipality name.
* The input can be a dataset municipality name or a map feature name.
*/
export function getMunicipalityRegion(name){
    return municipalityToRegion[normalizeName(name)] || 'Region unavailable';
}

export const heatmapOrder = {
    education: [
        values.education.basic,
        values.education.upperSecondary,
        values.education.tertiary
    ],
    ageGroup: [
        "16-24",
        "25-34",
        "35-44",
        "45-54",
        "55-64",
        "65+"
    ]
};

