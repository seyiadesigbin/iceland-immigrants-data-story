// Compute municipality share for Choropleth chart
// function calculateMunicipalityShare(){

//     const data = appData.background; // get background dataset

//     // Group the data by municipality + year
//     const grouped = d3.rollup(
//         data, 
//         (rows) => {
//             let total = 0; // keep count of otal population
//             let immigrants = 0; // keep count of immigrants count

//             // Loop through each row/set in the data
//             rows.forEach((d) => {
//                 total += d.population;

//                  // Check if background is "Immigrant" and add population to employed value
//                 if (d.background === values.background.immigrants){
//                     immigrants += d.population;
//                 }
//             });

//             return {
//                 totalPopulation: total,
//                 immigrantPopulation: immigrants,
//                 immigrantShare: (immigrants/total) * 100
//             };
//         },
//         (d) => d.municipality,
//         (d) => d.year
//     );


//     // Convert Map to array
//     const result = []

//     grouped.forEach((yearMap, municipality) => {
//         yearMap.forEach((groupValues, year) => {
//             result.push({
//                 municipality,
//                 year,
//                 ...groupValues
//             });
//         });
//     });

//     return result;
// }

// Calculte employment rates
function calculateEmploymentRates(){
    
    const data = appData.labour; // get labour dataset

    // Compute employment rate
    const grouped = d3.rollup(
        data,
        (rows) => {

            let employed = 0; // keep count of employed people
            let total = 0; // keep count of total population

            rows.forEach(d => {
                total += d.population // total = Previous total + population value

                // Check if empStatus is "Employed" and add population to employed value
                if (d.empStatus === values.employmentStatus.employed){
                    employed += d.population;
                };
            });

            return {
                employed: employed,
                total: total,
                employmentRate: total == 0 ? 0 : (employed/total) * 100
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