# Iceland Demographics 2011 - 2021

**``Course``**: F21DV Data Visualization and Analytics

**``School``**: Heriot-Watt University, Edinburgh

----

**``About the Project``**: The project examnines the effect of immigration on Iceland between **2011** and **2021**.

**``Target Audience``**: Policy and Government Leaders

## Project Focus

The project is built on a central narrative:

- Immigration reshaped Iceland geoegraphically and demographically
- Immigrant employment outcomes reversed between 2011 and 2021
- Higher qualifications did not seem to address the employmen gap

### Story Structure


| Chapter | Title   | Details | Visualisations
|-------- | ------- | --------| --------------
|1      | The Shift | Shows whre immigraant share across Icelandic municipalities and how | ``Choropleth chart``  ``Horizontal chart``
|2 | Employment Reversal | Highlights the decline of immigrant employment between 2011 and 2021 and how this varies by age group and education. | ``Slope Chart``  ``Horizontal dot plot``
|3| Qualification Paradox | Shows the employment-rate gap between immigrants and natives across age groups and education levels. | ``Heatmap``

## Data Sources

The cleaned datasets from the Design phase are loaded dynamically at runtime using d3.

### Files
- `data/datasets/clean/background_clean.csv`
- `data/datasets/clean/labour_clean.csv`
- `data/json/geoBoundaries-ISL-ADM2.topo.json`


### Datasets description

| Dataset | Description
|-------- | ------- 
|`background_clean.csv` | Population by municipality, age group, background, sex, and year
|`labour_clean.csv` | Population by employment status, age group, background, education, sex, and year
|`geoBoundaries-ISL-ADM2.topo.json` | Municipality geometry mapping for the Choropleth map


## Data Pre-Processing

Pre-processing of data is handled within the application.

### Main derived measures

| Measure | Definition
|-------- | ------- 
| **Immigrant share by municipality** | Immigrant population divided by total population for each municipality-year pair
| **Employment rate** | Employed population divided by total population within each subgroup
| **Population change** | `2021 population - 2011 population`
| **Employment-rate gap** | Immigrant employment rate minus native employment rate


### Harmonisation
Municipality names across the `background` dataset and `map boundaries` to account for:
- Icelandic characters
- Alternate spellings
- Municipalities that were merged or renamed over time


### Processing functions
Implemented in:
- `scripts/preprocess,js`


## Application Architecture

The project adopts a modular d3 structure.

| Focus | File | Details
|-------- | ------- | --------
|**Main coordination** | `scripts/main.js` | - Loads and parses all datasets <br> - Stored shared state <br>- Controls chart interactions <br>- Renders and updates the application