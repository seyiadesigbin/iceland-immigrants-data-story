'use strict';

// This file derives the aggregated measures used by the charts.

import { values } from './utils.js'


/*
Calculate immigrant share for each municipality-year pair.

@param {object[]} backgroundData - Background dataset rows
@returns {object[]} Municipality-level immigrant share values
*/

export function calculateMunicipalityShare(backgroundData){

    const data = backgroundData; // get background dataset

    // Group the data by municipality + year
    const grouped = d3.rollup(
        data, 
        (rows) => {
            let total = 0; // total population in the municipality-year group
            let immigrants = 0; // immigrant population in the municipality-year group

            // Loop through each row/set in the data
            rows.forEach((d) => {
                total += d.population;

                 // Check if background is "Immigrant" and add population to employed value
                if (d.background === values.background.immigrants){
                    immigrants += d.population;
                }
            });

            return {
                totalPopulation: total,
                immigrantPopulation: immigrants,
                immigrantShare: total === 0 ? 0 : (immigrants / total) * 100
            };
        },
        (d) => d.municipality,
        (d) => d.year
    );


    // Convert Map to array
    const result = []

    grouped.forEach((yearMap, municipality) => {
        yearMap.forEach((groupValues, year) => {
            result.push({
                municipality,
                year,
                ...groupValues
            });
        });
    });

    return result;
}


/*
Calculate employment rates for each year-age-background-education combination.

@param {object[]} labourData - Labour dataset rows
@returns {object[]} Aggregated employment-rate rows
*/

export function calculateEmploymentRates(labourData){
    
    const data = labourData; // get labour dataset

    // Compute employment rate
    const grouped = d3.rollup(
        data,
        (rows) => {

            let employed = 0; // keep count of employed people
            let total = 0; // keep count of total population

            rows.forEach(d => {
                total += d.population; // total = Previous total + population value

                // Check if empStatus is "Employed" and add population to employed value
                if (d.empStatus === values.employmentStatus.employed){
                    employed += d.population;
                };
            });

            return {
                employed: employed,
                total: total,
                employmentRate: total === 0 ? 0 : (employed/total) * 100
            };
        },

        d => d.year,
        d => d.ageGroup,
        d => d.background,
        d => d.education    
    );


    const result = []; // variable to store results

    grouped.forEach((ageMap, year) => {
        ageMap.forEach((backgroundMap, ageGroup) => {
            backgroundMap.forEach((educationMap, background) => {
                educationMap.forEach((groupValues, education) => {

                    let resultToPush = {
                        year: year,
                        ageGroup: ageGroup,
                        background: background,
                        education: education,
                        employed: groupValues.employed,
                        total: groupValues.total,
                        employmentRate: groupValues.employmentRate
                    }

                    result.push(resultToPush)
                    
                }); // educationMap

            }); // backgroundMap

        }); // ageMap

    }); // grouped

    return result;

}

/*
Build heatmap rows by pairing immigrant and native employment rates
within the same year, education level, and age group.
*/
export function buildHeatmapData(employmentRates){

    // Group by year -> education -> ageGroup -> background
    const grouped = d3.rollup(
        employmentRates,
        rows => rows[0], // one row per combination already exists
        d => d.year,
        d => d.education,
        d => d.ageGroup,
        d => d.background
    );

    const result = [];

    grouped.forEach((educationMap, year) => {
        educationMap.forEach((ageMap, education) => {
            ageMap.forEach((backgroundMap, ageGroup) => {

                const immigrantRow = backgroundMap.get(values.background.immigrants);
                const nativeRow = backgroundMap.get(values.background.natives);

                if (!immigrantRow || !nativeRow) return;

                const immigrantRate = immigrantRow.employmentRate;
                const nativeRate = nativeRow.employmentRate;

                if (!Number.isFinite(immigrantRate) || !Number.isFinite(nativeRate)) return;

                const gap = immigrantRate - nativeRate;

                result.push({
                    year: +year,
                    education,
                    ageGroup,
                    immigrantRate: +immigrantRate.toFixed(1),
                    nativeRate: +nativeRate.toFixed(1),
                    gap: +gap.toFixed(1)
                });
            });
        });
    });

    return result;
}