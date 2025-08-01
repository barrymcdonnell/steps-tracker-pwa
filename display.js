// display.js
import { getAllDailyData, STEPS_STORE_NAME, WATER_STORE_NAME } from './db.js';
import { renderStepsChart, renderWaterChart } from './charts.js';
import { STEP_GOAL, WATER_GOAL } from './constants.js';

/**
 * Displays the progress data in the UI lists and updates the charts.
 * @param {HTMLElement} stepsListElement - The ul element for steps.
 * @param {HTMLElement} waterListElement - The ul element for water.
 * @param {HTMLCanvasElement} stepsChartCanvasElement - The canvas element for steps chart.
 * @param {HTMLCanvasElement} waterChartCanvasElement - The canvas element for water chart.
 */
export async function displayProgress(stepsListElement, waterListElement, stepsChartCanvasElement, waterChartCanvasElement) {
    try {
        const stepsData = await getAllDailyData(STEPS_STORE_NAME);
        const waterData = await getAllDailyData(WATER_STORE_NAME);

        // Display Steps List
        stepsListElement.innerHTML = '';
        if (stepsData.length === 0) {
            stepsListElement.innerHTML = '<li class="text-center text-gray-500">No steps recorded yet.</li>';
        } else {
            const displayCount = Math.min(stepsData.length, 7);
            for (let i = 0; i < displayCount; i++) {
                const entry = stepsData[i];
                const listItem = document.createElement('li');
                let goalStatusClass = '';
                let goalStatusText = '';

                if (entry.value >= STEP_GOAL) {
                    goalStatusClass = 'bg-green-100 text-green-800';
                    goalStatusText = '✅ Goal Met!';
                } else {
                    goalStatusClass = 'bg-red-100 text-red-800';
                    goalStatusText = '❌ Goal Not Met';
                }

                listItem.className = `p-3 rounded-lg flex justify-between items-center ${goalStatusClass}`;
                listItem.innerHTML = `
                    <span class="font-medium">${entry.date}</span>
                    <span class="text-sm">${entry.value} steps (${goalStatusText})</span>
                `;
                stepsListElement.appendChild(listItem);
            }
        }

        // Display Water List
        waterListElement.innerHTML = '';
        if (waterData.length === 0) {
            waterListElement.innerHTML = '<li class="text-center text-gray-500">No water recorded yet.</li>';
        } else {
            const displayCount = Math.min(waterData.length, 7);
            for (let i = 0; i < displayCount; i++) {
                const entry = waterData[i];
                const listItem = document.createElement('li');
                let goalStatusClass = '';
                let goalStatusText = '';

                if (entry.value >= WATER_GOAL) {
                    goalStatusClass = 'bg-green-100 text-green-800';
                    goalStatusText = '✅ Goal Met!';
                } else {
                    goalStatusClass = 'bg-red-100 text-red-800';
                    goalStatusText = '❌ Goal Not Met';
                }

                listItem.className = `p-3 rounded-lg flex justify-between items-center ${goalStatusClass}`;
                listItem.innerHTML = `
                    <span class="font-medium">${entry.date}</span>
                    <span class="text-sm">${entry.value} ml (${goalStatusText})</span>
                `;
                waterListElement.appendChild(listItem);
            }
        }

        // Render Charts
        renderStepsChart(stepsChartCanvasElement, stepsData.slice(0, Math.min(stepsData.length, 7)).reverse());
        renderWaterChart(waterChartCanvasElement, waterData.slice(0, Math.min(waterData.length, 7)).reverse());

    } catch (error) {
        console.error('Failed to display progress:', error);
        stepsListElement.innerHTML = '<li class="text-center text-red-500">Error loading steps data.</li>';
        waterListElement.innerHTML = '<li class="text-center text-red-500">Error loading water data.</li>';
        // Note: Chart instances are managed within charts.js, so we don't destroy them here.
        // However, we can hide the canvases if there's an error.
        stepsChartCanvasElement.style.display = 'none';
        waterChartCanvasElement.style.display = 'none';
    }
}
