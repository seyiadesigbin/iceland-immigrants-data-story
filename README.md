# Iceland Demographics 2011 - 2021
*An interactive data story developed for:*

**Course**: F21DV Data Visualization and Analytics

**School**: Heriot-Watt University, Edinburgh

----

**`About the Project`**: The project examines the effect of immigration on Iceland between **2011** and **2021**.

**`Target Audience`**: Policy and Government Readers

## Project Focus

The project is built on a central narrative:

- Immigration reshaped Iceland geographically and demographically
- Immigrant employment outcomes reversed between 2011 and 2021
- Higher qualifications did not seem to address the employment gap

### Story Structure


| Chapter | Title   | Details | Visualisations|
|-------- | ------- | --------| --------------
|1      | The Shift | Shows where immigrant share rose across Icelandic municipalities and how population change varied by age group, for immigrants and natives. | ``Choropleth chart``  ``Grouped bar chart``
|2 | Employment Reversal | Highlights the decline of immigrant employment between 2011 and 2021 and how this varies by age group and education. | ``Slope Chart``  ``Horizontal dot plot``
|3| Qualification Paradox | Shows the employment-rate gap between immigrants and natives across age groups and education levels. | ``Heatmap``

## Interactions

The project includes linked interactions within and between visualisations.

### Chapter 1
- Clicking a municipality on the choropleth filters the grouped bar chart
- Clicking a grouped-bar highlights the five municipalities where that age-group trend is strongest
- Clicking outside either chart clears the relevant interaction state

### Chapter 2 and 3
- Education controls filter both the slope chart and horizontal dot plot together
- The year toggle in the horizontal dot plot updates the data of the dot plot and heatmap charts

## Data Sources

The cleaned datasets from the Design phase are loaded dynamically at runtime using d3.

### Files used:
- `data/datasets/clean/background_clean.csv`
- `data/datasets/clean/labour_clean.csv`
- `data/json/geoBoundaries-ISL-ADM2.topo.json`


### Datasets description

| Dataset | Description|
|-------- | ------- 
|`background_clean.csv` | Population by municipality, age group, background, sex, and year
|`labour_clean.csv` | Population by employment status, age group, background, education, sex, and year
|`geoBoundaries-ISL-ADM2.topo.json` | Municipality geometry mapping for the Choropleth map


## Data Pre-Processing

Pre-processing of data is handled within the application, in `scripts/preprocess.js`

### Main derived measures

| Measure | Definition
|-------- | ------- 
| **Immigrant share by municipality** | Immigrant population / total municipality population
| **Employment rate** | Employed population / total population within each subgroup
| **Population change** | `2021 population - 2011 population`
| **Employment-rate gap** | Immigrant employment rate - native employment rate


### Harmonisation
Municipality names across the `background` dataset and `map boundaries` to account for:
- Icelandic characters
- Alternate spellings
- Municipalities that were merged or renamed over time


### Processing functions
Implemented in:
- `scripts/preprocess.js`


## Application Architecture

The project adopts a modular d3 structure.

| Focus | File | Details|
|-------- | ------- | --------
|**Main coordination** | `scripts/main.js` | - Loads and parses all datasets <br> - Stored shared state <br>- Controls chart interactions <br>- Renders and updates the application
|**Pre-processing** |`scripts/preprocess.js`| - Computes municipality immigrant share <br> - Computes grouped employment-rate tables
|**Utility/config** | `scripts/utils.js` | - Shared constants <br> - Chart configuration <br> - Palette definitions <br> - Municipality name normalization <br> - Municipality-to-region mapping
|**Chart components**|`scripts/ChoroplethChart.js` <br> `scripts/GroupedBarChart.js` <br> `scripts/SlopeChart.js` <br> `scripts/HorizontalDotPlot.js` <br> `scripts/HeatmapChart.js`| Choropleth chart <br> Grouped bar chart <br> Slope chart <br> Horizontal dot plot chart <br> Heatmap chart <br>

Each chart is implemented as a resuable class with:
- A constructor for SVG/container setup
- Private update methods for data, scales, marks, axes, and events
- Setter methods for interactivity callbacks

## Shared State

The application uses a shared `state` object in `main.js` to coordinate interactions across the different views.

Examples include:
- `year`
- `selectedMunicipality`
- `selectedEducation`
- `selectedAgeGroup`
- `selectedBackground`
- `highlightedMunicipalities`

This allows chart interactions to stay linked across views.

## Visual Design

The story uses a light editorial design with:
- Serif headings
- Sans-serif body text
- Mono labels for small metadata and controls
- Colourblind-safe blue/orange category pairing for immigrants and natives
- Consistent section banding and chart framing

Accessibility was considered using:
- Colourblind-safe categorical colours
- Supplementary labels and interaction hints
- Non-colour interaction cues such as opacity and highlighting

```md
## Repository Structure

```text
f-21-dv-ed-group-1/
├── data/
│   ├── datasets/
│   │   ├── clean/
│   │   │   ├── background_clean.csv
│   │   │   ├── education_clean.csv
│   │   │   └── labour_clean.csv
│   │   └── raw/
│   │       ├── background_raw.csv
│   │       ├── education_raw.csv
│   │       └── labour_raw.csv
│   └── json/
│       ├── background.json
│       ├── education.json
│       └── geoBoundaries-ISL-ADM2.topo.json
├── img/
├── libs/
├── scripts/
│   ├── ChoroplethChart.js
│   ├── GroupedBarChart.js
│   ├── HeatmapChart.js
│   ├── HorizontalDotPlot.js
│   ├── main.js
│   ├── preprocess.js
│   ├── project-overview.js
│   ├── SlopeChart.js
│   └── utils.js
├── styles/
│   ├── main.css
│   └── project-overview.css
├── index.html
└── README.md

```

## Running the Project

This project is a static web application.

To run it locally:
1. Open the up-to-date repository in a local web server environment
2. Load `index.html`
3. Keep the `data`, `scripts`, `styles`, `libs`, and `img` folders in their current relative paths

The project must be launched through a local server rather than directly as a raw file in the browser, to enable the datasets load dynamically using D3.

## Limitations
- The project compares 2011 and 2021, so intermediate change is not directly observed
- The available data does not break down employment by both sector and background
- While the project identifies patterns in inequality, it does not directly test factors like language barriers, credential recognition, or professional network effects

## Future Improvements

Potential next steps include:
- Clearer active-filter summaries and reset controls
- Stronger keyboard accessibility and mobile interaction support
- Richer chart annotations to guide users through the main findings

## Team and Course Information

### Course
- **Course**: F21DV Data Visualization and Analytics
- **Institution**: Heriot-Watt University, Edinburgh
- **Lecturer**: Dr Pierre Le Bras (PhD, FHEA)

### Team
- [Oluwaseyi Adesigbin](https://www.linkedin.com/in/seyiadesigbin/) `Team Lead`
- Ee Ern Ong
- Sanket Bhoye
- [Shashank Sunil](https://www.linkedin.com/in/shashanksunil)


## References

### Data and report sources
- Statistics Iceland | [🔗](https://statice.is/statistics/population/census/census-2021/)
- OECD. Immigration in Iceland (2024) | [🔗](https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/11/immigration-in-iceland_e1b2c815/645ca1ac-en.pdf)

### External Assets

- LinkedIn icon | [🔗](https://commons.wikimedia.org/wiki/File:LinkedIn_icon.svg)
- Iceland logo | [🔗](https://www.government.is/publications/design-standard/ministry-logos/)
- Iceland Ministry of Justice logo | [🔗](https://www.government.is/publications/design-standard/ministry-logos/)


## Use of AI Tools

The project made use of AI-assisted tools during development. The main platforms used were:

- OpenAI ChatGPT / Codex
- Anthropic Claude
- Microsoft 365 Copilot

These tools were used in a supporting role for tasks such as:
- Refining explanatory and narrative text
- Iterating layout and interface ideas
- Troubleshooting parts of the JavaScript and CSS implementation
- Suggesting code structure improvements during development
