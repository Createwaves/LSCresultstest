// --- Global Variables for Viewer ---
let series = []; // Will be loaded from JSON
// let boatList = []; // Not strictly needed for viewer unless referenced somewhere

// URL where the JSON file will live relative to the HTML file
// Using a relative path is simplest when hosted together
const resultsDataUrl = './latest-results-data.json'; // Fetches from the same directory

// --- DOM Element References (Add necessary ones for viewer) ---
// Tab Buttons
const btnSeriesResults = document.getElementById('btn-series-results');
const btnRaceView = document.getElementById('btn-race-view');

// Tab Content Divs
const seriesResultsTab = document.getElementById('series-results-tab');
const raceViewTab = document.getElementById('race-view-tab');

// Series Results Tab Elements
const viewSeriesSelect = document.getElementById('view-series-select');
const seriesSummary = document.getElementById('series-summary');
const seriesResultsHeader = document.getElementById('series-results-header');
const seriesResultsBody = document.getElementById('series-results-body');
const legendDiv = document.querySelector('.legend');

// Race Viewer Tab Elements
const viewAllSeriesSelect = document.getElementById('view-all-series-select');
const raceSummaryView = document.getElementById('race-summary-view');
const raceSelector = document.querySelector('.race-selector');
const individualRaceInfo = document.getElementById('individual-race-info');
const individualRaceHeader = document.querySelector('#individual-race-results thead'); // Assuming thead exists
const individualRaceBody = document.getElementById('individual-race-body');


// --- Core Data Loading Function ---
async function loadDataAndView() {
    console.log('Attempting to load results data from:', resultsDataUrl);
    // Add loading indicators
    if(seriesResultsBody) seriesResultsBody.innerHTML = '<tr><td colspan="10">Loading data...</td></tr>';
    if(individualRaceBody) individualRaceBody.innerHTML = '<tr><td colspan="9">Loading data...</td></tr>';
    if(viewSeriesSelect) viewSeriesSelect.innerHTML = '<option>Loading...</option>';
    if(viewAllSeriesSelect) viewAllSeriesSelect.innerHTML = '<option>Loading...</option>';


    try {
        // Add cache-busting query parameter to the fetch URL
        const response = await fetch(resultsDataUrl + '?cachebust=' + Date.now());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - Could not fetch results file.`);
        }
        const data = await response.json();

        if (data && data.seriesData && Array.isArray(data.seriesData)) { // Check structure
            series = data.seriesData;
            // boatList = data.boatListData || []; // Load if needed

            console.log('Data loaded successfully:', series.length, 'series found.');

            // --- Initialize the Viewer UI ---
            refreshSeriesDropdowns(); // Populate dropdowns now that 'series' is loaded

            // Trigger the display of the default active tab's content
            const activeTab = document.querySelector('.tab-content.active-tab');
            if (activeTab && activeTab.id === 'series-results-tab') {
                 if (viewSeriesSelect?.value) {
                    calculateSeriesResults();
                 } else if (series.length > 0) {
                    // If no series selected but data exists, select first and display
                    viewSeriesSelect.value = series[0].id;
                    calculateSeriesResults();
                 } else {
                    displayErrorMessage("No series data found in the loaded file.", seriesResultsBody, seriesSummary);
                 }
            } else if (activeTab && activeTab.id === 'race-view-tab') {
                if (viewAllSeriesSelect?.value) {
                    displayRaceViewer();
                } else if (series.length > 0) {
                    // If no series selected but data exists, select first and display
                    viewAllSeriesSelect.value = series[0].id;
                    displayRaceViewer();
                 } else {
                    displayErrorMessage("No series data found in the loaded file.", individualRaceBody, raceSummaryView);
                 }
            } else {
                // Fallback: If no tab is marked active (shouldn't happen with default HTML), display series results
                 if (series.length > 0) {
                    viewSeriesSelect.value = series[0].id;
                    calculateSeriesResults();
                    setActiveTab(seriesResultsTab);
                 } else {
                    displayErrorMessage("No series data found in the loaded file.", seriesResultsBody, seriesSummary);
                 }
            }

        } else {
            console.error('Loaded data is not in the expected format.', data);
            displayErrorMessage("Could not load or parse results data correctly. Check the format of latest-results-data.json.", seriesResultsBody, seriesSummary);
            displayErrorMessage("", individualRaceBody, raceSummaryView); // Clear other tab too
        }
    } catch (error) {
        console.error('Error loading or processing results data:', error);
        displayErrorMessage(`Failed to load results. Ensure 'latest-results-data.json' exists in the same directory. Error: ${error.message}`, seriesResultsBody, seriesSummary);
        displayErrorMessage("", individualRaceBody, raceSummaryView); // Clear other tab too
    }
}

function displayErrorMessage(message, tableBodyElement, summaryElement) {
    // Clear loading states / dropdowns
    if(viewSeriesSelect) viewSeriesSelect.innerHTML = '<option value="">Error</option>';
    if(viewAllSeriesSelect) viewAllSeriesSelect.innerHTML = '<option value="">Error</option>';

    if (tableBodyElement) {
         tableBodyElement.innerHTML = `<tr><td colspan="15" style="color: red; text-align: center; padding: 20px;">${message}</td></tr>`; // Increased colspan
    }
     if (summaryElement) {
         summaryElement.innerHTML = `<p style="color:red; font-weight: bold;">${message}</p>`;
     }
}

// --- Tab Navigation ---
function setActiveTab(tabElement) {
     document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
     document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active-button'));

     if (tabElement) {
         tabElement.classList.add('active-tab');
         const buttonId = 'btn-' + tabElement.id.replace('-tab', '');
         const correspondingButton = document.getElementById(buttonId);
         if(correspondingButton) {
              correspondingButton.classList.add('active-button');
         }
         // Trigger data refresh/display for the newly activated tab
         if (tabElement.id === 'series-results-tab' && viewSeriesSelect?.value) {
             calculateSeriesResults();
         } else if (tabElement.id === 'race-view-tab' && viewAllSeriesSelect?.value) {
             displayRaceViewer();
         }
     } else {
          console.error("setActiveTab called with null element");
     }
 }
// Add listeners for the viewer tab buttons
if(btnSeriesResults) btnSeriesResults.addEventListener('click', () => setActiveTab(seriesResultsTab));
if(btnRaceView) btnRaceView.addEventListener('click', () => setActiveTab(raceViewTab));


// --- Utility Functions (Copy from original script) ---
function secondsToTime(seconds) { if (isNaN(seconds) || seconds === null || seconds < 0) return ''; seconds = Math.round(seconds); const hours = Math.floor(seconds / 3600); let minutes = Math.floor((seconds % 3600) / 60); let secs = seconds % 60; if (secs === 60) { minutes += 1; secs = 0; } if (minutes === 60) { /* hours += 1; */ minutes = 0; } return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`; }
// Add any other utility functions needed by the display logic


// --- Dropdown Population and Event Listeners ---
function refreshSeriesDropdowns() {
     const dropdowns = [viewSeriesSelect, viewAllSeriesSelect];
     dropdowns.forEach((dropdown) => {
         if (!dropdown) return;
         const selectedVal = dropdown.value; // Preserve selection if possible
         dropdown.innerHTML = '<option value="">Select Series</option>'; // Clear old options

         if (!series || series.length === 0) {
            dropdown.innerHTML = '<option value="">No Series Data</option>';
            return;
         }

         // Sort series alphabetically by name for dropdowns
         const sortedSeries = [...series].sort((a, b) => a.name.localeCompare(b.name));

         sortedSeries.forEach(s => {
             const option = document.createElement('option');
             option.value = s.id;
             option.textContent = s.name;
             dropdown.appendChild(option);
         });

         // Try to restore previous selection or select the first item
         if (selectedVal && series.some(s => s.id == selectedVal)) {
             dropdown.value = selectedVal;
         } else if (series.length > 0) {
            // Don't automatically select here, let the loadDataAndView logic decide
            // dropdown.value = sortedSeries[0].id;
         }
     });
 }
// Add change listeners to trigger display updates
if(viewSeriesSelect) viewSeriesSelect.addEventListener('change', calculateSeriesResults);
if(viewAllSeriesSelect) viewAllSeriesSelect.addEventListener('change', displayRaceViewer);


// --- Series Results Display Functions (Copy relevant functions from original) ---
function calculateSeriesResults() {
    console.log("Calculating Series Results...");
    const seriesId = viewSeriesSelect?.value;
    // Clear previous results immediately
    if (seriesResultsBody) seriesResultsBody.innerHTML = '<tr><td colspan="15">Calculating...</td></tr>';
    if (seriesResultsHeader) seriesResultsHeader.innerHTML = '<tr><th>Loading...</th></tr>';
    if (legendDiv) legendDiv.innerHTML = '<strong>Legend:</strong>';
    if (seriesSummary) seriesSummary.innerHTML = '';

    if (!seriesId) {
        if(seriesSummary) seriesSummary.innerHTML = '<p>Select a series.</p>';
        if(seriesResultsHeader) seriesResultsHeader.innerHTML = '';
        if(seriesResultsBody) seriesResultsBody.innerHTML = '<tr><td colspan="15">Please select a series to view results.</td></tr>';
        return;
    }
    const selectedSeries = series.find(s => s.id == seriesId); // Use == for potential string/number comparison
    if (!selectedSeries) {
        if(seriesSummary) seriesSummary.innerHTML = '<p>Error: Selected series not found.</p>';
        if(seriesResultsHeader) seriesResultsHeader.innerHTML = '';
        if(seriesResultsBody) seriesResultsBody.innerHTML = '<tr><td colspan="15">Error: Could not find the selected series data.</td></tr>';
        console.error("Series not found for ID:", seriesId, "Available Series:", series);
        return;
    }

    // --- PASTE THE CORE LOGIC OF calculateSeriesResults HERE ---
    // (from your original script, starting from filtering racesWithResults
    // down to rendering the table body and legend)
    // Ensure it uses the 'selectedSeries' variable defined above.
    // Make sure all helper functions it calls (like calculateOODPointsSeriesContext)
    // are also copied into this viewer.js file.

    // Example Placeholder - REPLACE WITH YOUR ACTUAL LOGIC
    console.log("Running results logic for series:", selectedSeries.name);
    const racesWithResults = selectedSeries.races.filter(r => r.results && r.results.length > 0);
    const completedRacesCount = racesWithResults.length;
    const discardThreshold = selectedSeries.discardThreshold ?? 0;
    let numDiscardsToApply = 0;
    if (discardThreshold > 0 && completedRacesCount > 0) {
        numDiscardsToApply = Math.floor(completedRacesCount / discardThreshold);
    }
    const discardRuleText = discardThreshold > 0 ? `1 per ${discardThreshold} completed` : 'None';

    if(seriesSummary) seriesSummary.innerHTML = `<div class="race-info-panel"><h3>${selectedSeries.name}</h3><p><strong>Races Planned:</strong> ${selectedSeries.numberOfRaces}</p><p><strong>Completed:</strong> ${completedRacesCount}</p><p><strong>Discard Rule:</strong> ${discardRuleText}</p><p><strong>Discards Applied Now:</strong> ${numDiscardsToApply}</p></div>`;

    if (completedRacesCount === 0) {
         if(seriesResultsHeader) seriesResultsHeader.innerHTML = '';
         if(seriesResultsBody) seriesResultsBody.innerHTML = '<tr><td colspan="6">No race results available for this series yet.</td></tr>';
         return;
    }

    let headerHTML = `<tr><th>Pos</th><th>Sail #</th><th>Skipper</th><th>Boat Class</th>`;
    for (let i = 1; i <= selectedSeries.numberOfRaces; i++) headerHTML += `<th>R${i}</th>`;
    headerHTML += `<th>Total</th><th>Net</th></tr>`;
    if(seriesResultsHeader) seriesResultsHeader.innerHTML = headerHTML;

    // --- START: Copy core calculation logic from original calculateSeriesResults ---
    let competitors = new Map();
    let allSailNumbers = new Set();
    selectedSeries.races.forEach(r => {
        if (r.results) r.results.forEach(res => allSailNumbers.add(res.sailNumber));
    });

    allSailNumbers.forEach(sailNo => {
        if (!competitors.has(sailNo)) {
            let lastResult = null;
            for (let i = selectedSeries.races.length - 1; i >= 0; i--) {
                const r = selectedSeries.races[i];
                if (r.results) {
                    lastResult = r.results.find(res => res.sailNumber === sailNo);
                    if (lastResult) break;
                }
            }
            competitors.set(sailNo, {
                sailNumber: sailNo,
                skipper: lastResult?.skipper || 'N/A',
                boatClass: lastResult?.boatClass || 'N/A',
                raceScores: Array(selectedSeries.numberOfRaces).fill(null),
                totalPoints: 0,
                netPoints: 0,
                position: 0
            });
        }
    });

     selectedSeries.races.forEach(race => {
         const raceNumIndex = race.raceNumber - 1;
         if (race.results && race.results.length > 0) {
             race.results.forEach(result => {
                 const competitor = competitors.get(result.sailNumber);
                 if (competitor && raceNumIndex >= 0 && raceNumIndex < competitor.raceScores.length) {
                    // Ensure points is a number or null
                    let points = (result.points !== undefined && result.points !== null && !isNaN(result.points)) ? Number(result.points) : null;
                    competitor.raceScores[raceNumIndex] = {
                        points: points,
                        status: result.status?.toUpperCase() || 'N/A',
                        position: result.position ?? (result.status?.toUpperCase() || 'N/A'), // Use position or status
                        discarded: false
                    };
                 } else if (competitor) {
                    console.warn(`Race index out of bounds (${raceNumIndex}) for sail number ${result.sailNumber} in series ${selectedSeries.name}`);
                 }
             });
         }
     });


    competitors.forEach(competitor => {
        const dncRule = selectedSeries.dncScoringRule || 'raceEntries';
        const totalSeriesCompetitors = competitors.size;
        for (let i = 0; i < selectedSeries.numberOfRaces; i++) {
            const raceNumber = i + 1;
            const correspondingRace = selectedSeries.races.find(r => r.raceNumber === raceNumber);
            if (competitor.raceScores[i] === null) {
                if (correspondingRace && correspondingRace.results && correspondingRace.results.length > 0) {
                    let dncPoints;
                    if (dncRule === 'raceEntries') {
                        const numEntriesInRace = correspondingRace.results.length;
                        dncPoints = numEntriesInRace + 1;
                    } else {
                         dncPoints = totalSeriesCompetitors + 1;
                    }
                    competitor.raceScores[i] = { points: dncPoints, status: 'DNC', position: 'DNC', discarded: false };
                } else {
                    competitor.raceScores[i] = { points: null, status: 'NR', position: 'NR', discarded: false };
                }
            } else if (competitor.raceScores[i].status === 'OOD') {
                 // Ensure OOD points calculation exists and handles potential errors
                 try {
                    competitor.raceScores[i].points = calculateOODPointsSeriesContext(competitor.sailNumber, raceNumber, selectedSeries, competitors);
                 } catch (e) {
                    console.error("Error calculating OOD points for", competitor.sailNumber, e);
                    competitor.raceScores[i].points = 0; // Assign fallback OOD score
                 }
            }
        }

        const validScores = competitor.raceScores.filter(score => score && score.points !== null && !isNaN(score.points));
        competitor.totalPoints = validScores.reduce((sum, score) => sum + score.points, 0);

         if (validScores.length > 0 && numDiscardsToApply > 0) {
             const scoresEligible = competitor.raceScores.map((score, index) => ({ ...score, originalIndex: index }))
                                   .filter(score => score && score.points !== null && !isNaN(score.points));
            scoresEligible.sort((a, b) => b.points - a.points);
            for (let i = 0; i < Math.min(numDiscardsToApply, scoresEligible.length); i++) {
                const originalIndexToDiscard = scoresEligible[i].originalIndex;
                if (competitor.raceScores[originalIndexToDiscard]) {
                   competitor.raceScores[originalIndexToDiscard].discarded = true;
                }
             }
            competitor.netPoints = competitor.raceScores.reduce((sum, score) => {
                if (score && score.points !== null && !isNaN(score.points) && !score.discarded) {
                    return sum + score.points;
                }
                return sum;
            }, 0);
        } else {
             competitor.netPoints = competitor.totalPoints;
             competitor.raceScores.forEach(score => { if(score) score.discarded = false; });
        }
    });

     const competitorsArray = Array.from(competitors.values());
    // Sorting logic (ensure checkTieBroken exists)
     competitorsArray.sort((a, b) => {
         if (a.netPoints !== b.netPoints) return a.netPoints - b.netPoints;
         let lastCommonRaceResult = 0;
         for (let i = selectedSeries.numberOfRaces - 1; i >= 0; i--) {
             const scoreA = a.raceScores[i]; const scoreB = b.raceScores[i];
             if (scoreA && scoreA.points != null && scoreB && scoreB.points != null) {
                 if (scoreA.points !== scoreB.points) { lastCommonRaceResult = scoreA.points - scoreB.points; break; }
             }
         }
         if (lastCommonRaceResult !== 0) return lastCommonRaceResult;
         const scoresA = a.raceScores.filter(s => s && !s.discarded && s.points !== null).map(s => s.points).sort((x, y) => x - y);
         const scoresB = b.raceScores.filter(s => s && !s.discarded && s.points !== null).map(s => s.points).sort((x, y) => x - y);
         for (let i = 0; i < Math.min(scoresA.length, scoresB.length); i++) { if (scoresA[i] !== scoresB[i]) return scoresA[i] - scoresB[i]; }
         return a.sailNumber.localeCompare(b.sailNumber, undefined, { numeric: true });
     });


    let currentRank = 0; let currentPosition = 0;
     for (let i = 0; i < competitorsArray.length; i++) {
        currentRank++;
        // Ensure checkTieBroken function exists or implement tie-breaking logic here
        if (i === 0 || competitorsArray[i].netPoints > competitorsArray[i-1].netPoints /* || checkTieBroken(competitorsArray[i], competitorsArray[i-1], selectedSeries.numberOfRaces) */ ) {
            currentPosition = currentRank;
        }
        competitorsArray[i].position = currentPosition;
    }

    if(seriesResultsBody) {
         seriesResultsBody.innerHTML = ''; // Clear previous content
         if (competitorsArray.length === 0) {
            const row = seriesResultsBody.insertRow();
            row.insertCell().textContent = 'No competitors found with results in this series.';
            row.cells[0].colSpan = selectedSeries.numberOfRaces + 6; // Adjust colspan
             return;
         }
         competitorsArray.forEach(competitor => {
             const row = seriesResultsBody.insertRow();
             let rowHTML = `<td>${competitor.position}</td><td>${competitor.sailNumber}</td><td>${competitor.skipper}</td><td>${competitor.boatClass}</td>`;
             competitor.raceScores.forEach(score => {
                 if (!score || score.status === 'NR') {
                     rowHTML += `<td class="nr-cell" title="No Race / Not Sailed">NR</td>`;
                 } else {
                     const points = (score.points !== null && !isNaN(score.points)) ? score.points : '-';
                     const status = score.status?.toUpperCase() || '';
                     let cellContent = points;
                     if (status !== 'FINISHED' && status !== '') cellContent = `${points}(${status})`;
                     const title = `title="${status} (Race Pos: ${score.position ?? status})"`;
                     rowHTML += `<td class="${score.discarded ? 'discarded' : ''}" ${title}>${cellContent}</td>`;
                 }
             });
             rowHTML += `<td>${competitor.totalPoints}</td><td><strong>${competitor.netPoints}</strong></td>`;
             row.innerHTML = rowHTML;
         });
    }

     if (legendDiv) { legendDiv.innerHTML = `<strong>Legend:</strong> <span class="discarded-example">15</span> Discarded Score,  <span class="nr-cell">NR</span> No Race/Not Sailed,  <span>DNF</span> Did Not Finish,  <span>DNS</span> Did Not Start,  <span>OCS</span> On Course Side,  <span>DSQ</span> Disqualified,  <span>OOD</span> Race Officer Duty,  <span>DNC</span> Did Not Compete (Race Sailed)`; }

    // --- END: Copy core calculation logic ---

}

// --- OOD Points Calculation (Copy from original) ---
function calculateOODPointsSeriesContext(sailNo, oodRaceNumber, seriesData, competitorMap) {
     const competitor = competitorMap.get(sailNo);
     if (!competitor) return 0;
     let racePoints = []; let racesSailedCount = 0;
     for (let i = 0; i < seriesData.numberOfRaces; i++) {
         const raceNumber = i + 1;
         if (raceNumber === oodRaceNumber) continue;
         const score = competitor.raceScores[i];
         if (score && score.points !== null && !isNaN(score.points) && score.status === 'FINISHED') {
             racePoints.push(score.points);
             racesSailedCount++;
         }
     }
     if (racesSailedCount > 0) {
         const avgPoints = racePoints.reduce((sum, pts) => sum + pts, 0) / racesSailedCount;
         return Math.round(avgPoints * 10) / 10;
     } else {
        // Fallback logic (average of finishers in the OOD race, or 0)
        const oodRaceData = seriesData.races.find(r => r.raceNumber === oodRaceNumber);
        let fallbackPoints = 0;
        if (oodRaceData && oodRaceData.results) {
            const finishersInOODRace = oodRaceData.results.filter(r => r.status === 'finished' && r.points != null && !isNaN(r.points));
            if (finishersInOODRace.length > 0) {
                const avgFinisherPoints = finishersInOODRace.reduce((sum, r) => sum + Number(r.points), 0) / finishersInOODRace.length;
                fallbackPoints = Math.round(avgFinisherPoints * 10) / 10;
            }
        }
        console.warn(`OOD Fallback used for ${sailNo} in Race ${oodRaceNumber}. Points: ${fallbackPoints}`);
        return fallbackPoints;
     }
 }

// --- Tie Breaking Function (Copy or Implement from original) ---
// function checkTieBroken(boatA, boatB, numRaces) { /* ... tie-breaking check logic ... */ return false; // Placeholder }


// --- Race Viewer Display Functions (Copy relevant functions from original) ---
function displayRaceViewer() {
    console.log("Displaying Race Viewer...");
    const seriesId = viewAllSeriesSelect?.value;

    // Clear previous state
    if (raceSelector) raceSelector.innerHTML = '';
    if (individualRaceInfo) individualRaceInfo.innerHTML = '';
    if (individualRaceBody) individualRaceBody.innerHTML = '<tr><td colspan="9">Select a race...</td></tr>'; // Use colspan 9 based on header
    if (raceSummaryView) raceSummaryView.innerHTML = '';
     // Set header if not already set
    if (individualRaceHeader && !individualRaceHeader.innerHTML.includes('<th>Pos</th>')) { // Check if header needs setting
        individualRaceHeader.innerHTML = '<tr><th>Pos</th><th>Sail No</th><th>Boat Type</th><th>Helm</th><th>YS</th><th>Finish</th><th>Elapsed</th><th>Corrected</th><th>Points</th></tr>';
    }


    if (!seriesId) {
        if(raceSummaryView) raceSummaryView.innerHTML = '<p>Select a series.</p>';
        return;
    }
    const selectedSeries = series.find(s => s.id == seriesId); // Use ==
    if (!selectedSeries) {
        if(raceSummaryView) raceSummaryView.innerHTML = '<p>Error: Selected series not found.</p>';
        return;
    }

    // --- PASTE THE CORE LOGIC OF displayRaceViewer HERE ---
    // (from your original script, starting from calculating completedRaces
    // down to populating race buttons and displaying the default/last race)
    // Ensure it calls displayRaceResultsView correctly.

    // Example Placeholder - REPLACE WITH YOUR ACTUAL LOGIC
     const completedRaces = selectedSeries.races.filter(r => r.results && r.results.length > 0).length;
     const discardThreshold = selectedSeries.discardThreshold ?? 0;
     const discardRuleText = discardThreshold > 0 ? `1 per ${discardThreshold} completed races` : 'None';
     if(raceSummaryView) raceSummaryView.innerHTML = `<div class="race-info-panel"><h3>${selectedSeries.name}</h3><p><strong>Races Planned:</strong> ${selectedSeries.numberOfRaces}</p><p><strong>Completed:</strong> ${completedRaces}</p><p><strong>Discard Rule:</strong> ${discardRuleText}</p></div>`;

    if (!raceSelector) return; // Stop if race selector element doesn't exist

    let firstRaceWithResults = -1;
    for (let i = 1; i <= selectedSeries.numberOfRaces; i++) {
        const raceBtn = document.createElement('button');
        raceBtn.textContent = `Race ${i}`;
        raceBtn.classList.add('race-button');
        raceBtn.dataset.raceNumber = i; // Store race number in data attribute

        const race = selectedSeries.races.find(r => r.raceNumber === i);
        const hasResults = race && race.results && race.results.length > 0;

        if (hasResults) {
            raceBtn.classList.add('has-results');
            if (firstRaceWithResults === -1) firstRaceWithResults = i;
            if (race.date) {
                try { // Add date formatting safely
                    const raceDate = new Date(race.date + 'T00:00:00'); // Ensure correct parsing
                     if (!isNaN(raceDate)) { // Check if date is valid
                        raceBtn.textContent += ` (${raceDate.toLocaleDateString('en-AU', {day:'numeric', month:'short'})})`;
                     } else {
                         console.warn("Invalid date format for race", i, race.date);
                     }
                } catch (e) { console.error("Date format error in race viewer button:", e); }
            }
        } else {
             raceBtn.disabled = true; // Disable button if no results
             raceBtn.style.opacity = "0.5";
             raceBtn.style.cursor = "not-allowed";
        }

        // Add click listener to display results for THAT race
        raceBtn.addEventListener('click', (e) => {
            // Don't use 'i' directly from loop due to closure issues
            const clickedRaceNumber = parseInt(e.target.dataset.raceNumber);
            document.querySelectorAll('.race-button.active').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            displayRaceResultsView(selectedSeries, clickedRaceNumber); // Pass series data and race number
        });
        raceSelector.appendChild(raceBtn);
    }

    // Automatically display the last completed race by default
    let lastRaceWithResults = -1;
    for (let i = selectedSeries.races.length - 1; i >= 0; i--) {
        const race = selectedSeries.races[i];
        if (race && race.results && race.results.length > 0) {
            lastRaceWithResults = race.raceNumber;
            break;
        }
    }

    const targetRaceNum = lastRaceWithResults !== -1 ? lastRaceWithResults : (firstRaceWithResults !== -1 ? firstRaceWithResults : null) ;

    if (targetRaceNum) {
        const targetButton = raceSelector.querySelector(`.race-button[data-race-number="${targetRaceNum}"]`);
        if (targetButton) {
            targetButton.classList.add('active'); // Highlight the button
            displayRaceResultsView(selectedSeries, targetRaceNum); // Display its results
        }
    } else if (selectedSeries.numberOfRaces > 0) {
        if(individualRaceInfo) individualRaceInfo.innerHTML = '<p>No races have results yet for this series.</p>';
        if(individualRaceBody) individualRaceBody.innerHTML = '<tr><td colspan="9">No results available.</td></tr>';
    } else {
         if(individualRaceInfo) individualRaceInfo.innerHTML = '<p>No races defined in this series.</p>';
    }
    // --- END: Copy core viewer logic ---

}

function displayRaceResultsView(selectedSeriesData, raceNumber) {
    console.log(`Displaying results for Race ${raceNumber} of series ${selectedSeriesData.name}`);
     if (!individualRaceBody || !individualRaceInfo || !selectedSeriesData) return;

     individualRaceBody.innerHTML = ''; // Clear previous results
     individualRaceInfo.innerHTML = ''; // Clear previous info

     const race = selectedSeriesData.races.find(r => r.raceNumber === parseInt(raceNumber));

     if (!race || !race.results || race.results.length === 0) {
         individualRaceInfo.innerHTML = `<div class="race-info-panel"><h3>Race ${raceNumber} Results</h3><p>No results saved or available for this race.</p></div>`;
         const row = individualRaceBody.insertRow();
         const cell = row.insertCell();
         cell.colSpan = 9; // Match header columns
         cell.textContent = 'No results saved for this race.';
         cell.style.textAlign = 'center';
         cell.style.fontStyle = 'italic';
         cell.style.color = '#666';
         return;
     }

     // --- PASTE THE CORE LOGIC OF displayRaceResultsView HERE ---
     // (from your original script, starting from getting the date
     // down to sorting and rendering the results table)

     // Example Placeholder - REPLACE WITH YOUR ACTUAL LOGIC
     let dateStr = 'Date Not Set';
      try {
          if (race.date) {
             const raceDate = new Date(race.date + 'T00:00:00');
             if (!isNaN(raceDate)) {
                 dateStr = raceDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
             }
          }
      } catch(e) { console.error("Error formatting race date:", e)}

     individualRaceInfo.innerHTML = `<div class="race-info-panel"><h3>Race ${race.raceNumber} Results</h3><p><strong>Date:</strong> ${dateStr}</p><p><strong>Entries Recorded:</strong> ${race.results.length}</p></div>`;

     // Sort results before displaying - ensure points/position are numbers for sorting
    const sortedResults = [...race.results].sort((a, b) => {
        const posA = (typeof a.position === 'number') ? a.position : Infinity;
        const posB = (typeof b.position === 'number') ? b.position : Infinity;
        if(posA !== posB) return posA - posB;

        // Fallback sort by points if positions are tied or not numbers
        const pointsA = (a.points != null && !isNaN(a.points)) ? Number(a.points) : Infinity;
        const pointsB = (b.points != null && !isNaN(b.points)) ? Number(b.points) : Infinity;
        if (pointsA !== pointsB) return pointsA - pointsB;

        // Final fallback: Sail number
        return (a.sailNumber || '').localeCompare(b.sailNumber || '', undefined, { numeric: true });
    });


     sortedResults.forEach(result => {
         const row = individualRaceBody.insertRow();
         // Format data safely
         const position = result.position ?? '-';
         const sailNumber = result.sailNumber || 'N/A';
         const boatClass = result.boatClass || 'N/A';
         const skipper = result.skipper || 'N/A';
         const yardstick = result.yardstick || '-';
         const status = result.status?.toUpperCase() || '-';
         const elapsedTime = result.elapsedTime || '-';
         // Recalculate corrected time for display consistency if needed, or use stored one
         let correctedTime = result.correctedTime || '-';
         if (status === 'FINISHED' && result.elapsedTime && result.yardstick) {
             try {
                 const elapsedSeconds = timeToSeconds(result.elapsedTime); // Assumes timeToSeconds exists
                 if (elapsedSeconds > 0 && result.yardstick > 0) {
                    const correctedSeconds = elapsedSeconds * 100 / result.yardstick;
                    correctedTime = secondsToTime(correctedSeconds); // Assumes secondsToTime exists
                 }
             } catch (e) { console.error("Error calculating corrected time for display", e); correctedTime = "Calc Error"; }
         } else if (status !== 'FINISHED') {
            correctedTime = '-'; // Ensure no corrected time for non-finishers
         }
         const points = (result.points !== null && result.points !== undefined) ? result.points : '-';


         row.innerHTML = `
             <td>${position}</td>
             <td>${sailNumber}</td>
             <td>${boatClass}</td>
             <td>${skipper}</td>
             <td>${yardstick}</td>
             <td>${status}</td>
             <td>${elapsedTime}</td>
             <td>${correctedTime}</td>
             <td>${points}</td>`;
     });
    // --- END: Copy core viewer logic ---
}


// --- Initial Load ---
// Add event listener to run loadDataAndView when the DOM is ready
document.addEventListener('DOMContentLoaded', loadDataAndView);