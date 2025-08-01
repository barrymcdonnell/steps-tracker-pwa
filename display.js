// display.js
import { getAllDailyData, STEPS_STORE_NAME, WATER_STORE_NAME, CALORIES_STORE_NAME } from './db.js';
import { renderStepsChart, renderWaterChart, renderCaloriesChart } from './charts.js';
import { STEP_GOAL, WATER_GOAL, CALORIE_GOAL } from './constants.js';
import { formatDate } from './utils.js'; // Import formatDate

/**
 * Displays the progress data in the UI lists and updates the charts for the Tracking View.
 * @param {HTMLElement} stepsListElement - The ul element for steps.
 * @param {HTMLElement} waterListElement - The ul element for water.
 * @param {HTMLCanvasElement} stepsChartCanvasElement - The canvas element for steps chart.
 * @param {HTMLCanvasElement} waterChartCanvasElement - The canvas element for water chart.
 * @param {HTMLElement} caloriesListElement - The ul element for calories.
 * @param {HTMLCanvasElement} caloriesChartCanvasElement - The canvas element for calories chart.
 */
export async function displayProgress(stepsListElement, waterListElement, stepsChartCanvasElement, waterChartCanvasElement, caloriesListElement, caloriesChartCanvasElement) {
    try {
        const stepsData = await getAllDailyData(STEPS_STORE_NAME);
        const waterData = await getAllDailyData(WATER_STORE_NAME);
        const caloriesData = await getAllDailyData(CALORIES_STORE_NAME);

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

        // Display Calories List
        caloriesListElement.innerHTML = '';
        if (caloriesData.length === 0) {
            caloriesListElement.innerHTML = '<li class="text-center text-gray-500">No calories recorded yet.</li>';
        } else {
            const displayCount = Math.min(caloriesData.length, 7);
            for (let i = 0; i < displayCount; i++) {
                const entry = caloriesData[i];
                const listItem = document.createElement('li');
                let goalStatusClass = '';
                let goalStatusText = '';
                const caloriesDifference = CALORIE_GOAL - entry.value;

                if (caloriesDifference >= 0) {
                    goalStatusClass = 'bg-green-100 text-green-800';
                    goalStatusText = `✅ ${caloriesDifference} kcal left`;
                } else {
                    goalStatusClass = 'bg-red-100 text-red-800';
                    goalStatusText = `❌ ${Math.abs(caloriesDifference)} kcal over`;
                }

                listItem.className = `p-3 rounded-lg flex justify-between items-center ${goalStatusClass}`;
                listItem.innerHTML = `
                    <span class="font-medium">${entry.date}</span>
                    <span class="text-sm">${entry.value} kcal (${goalStatusText})</span>
                `;
                caloriesListElement.appendChild(listItem);
            }
        }

        // Render Charts
        renderStepsChart(stepsChartCanvasElement, stepsData.slice(0, Math.min(stepsData.length, 7)).reverse());
        renderWaterChart(waterChartCanvasElement, waterData.slice(0, Math.min(waterData.length, 7)).reverse());
        renderCaloriesChart(caloriesChartCanvasElement, caloriesData.slice(0, Math.min(caloriesData.length, 7)).reverse());

    } catch (error) {
        console.error('Failed to display progress:', error);
        stepsListElement.innerHTML = '<li class="text-center text-red-500">Error loading steps data.</li>';
        waterListElement.innerHTML = '<li class="text-center text-red-500">Error loading water data.</li>';
        caloriesListElement.innerHTML = '<li class="text-center text-red-500">Error loading calories data.</li>';
        stepsChartCanvasElement.style.display = 'none';
        waterChartCanvasElement.style.display = 'none';
        caloriesChartCanvasElement.style.display = 'none';
    }
}

/**
 * Displays today's summary data on the Dashboard View.
 * @param {HTMLElement} todayStepsElement - Element to display today's steps.
 * @param {HTMLElement} todayWaterElement - Element to display today's water.
 * @param {HTMLElement} todayCaloriesElement - Element to display today's calories.
 * @param {HTMLElement} todayStepsGoalElement - Element to display steps goal status.
 * @param {HTMLElement} todayWaterGoalElement - Element to display water goal status.
 * @param {HTMLElement} todayCaloriesGoalElement - Element to display calories goal status.
 */
export async function displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement) {
    const today = formatDate(new Date());

    try {
        const stepsData = await getAllDailyData(STEPS_STORE_NAME);
        const waterData = await getAllDailyData(WATER_STORE_NAME);
        const caloriesData = await getAllDailyData(CALORIES_STORE_NAME);

        // Get today's steps
        const todayStepsEntry = stepsData.find(entry => entry.date === today);
        const currentSteps = todayStepsEntry ? todayStepsEntry.value : 0;
        todayStepsElement.textContent = currentSteps;
        if (currentSteps >= STEP_GOAL) {
            todayStepsGoalElement.textContent = `Goal Met (${STEP_GOAL})`;
            todayStepsGoalElement.classList.remove('text-red-600');
            todayStepsGoalElement.classList.add('text-green-600');
        } else {
            todayStepsGoalElement.textContent = `${STEP_GOAL - currentSteps} left`;
            todayStepsGoalElement.classList.remove('text-green-600');
            todayStepsGoalElement.classList.add('text-red-600');
        }

        // Get today's water
        const todayWaterEntry = waterData.find(entry => entry.date === today);
        const currentWater = todayWaterEntry ? todayWaterEntry.value : 0;
        todayWaterElement.textContent = currentWater;
        if (currentWater >= WATER_GOAL) {
            todayWaterGoalElement.textContent = `Goal Met (${WATER_GOAL}ml)`;
            todayWaterGoalElement.classList.remove('text-red-600');
            todayWaterGoalElement.classList.add('text-green-600');
        } else {
            todayWaterGoalElement.textContent = `${WATER_GOAL - currentWater}ml left`;
            todayWaterGoalElement.classList.remove('text-green-600');
            todayWaterGoalElement.classList.add('text-red-600');
        }

        // Get today's calories
        const todayCaloriesEntry = caloriesData.find(entry => entry.date === today);
        const currentCalories = todayCaloriesEntry ? todayCaloriesEntry.value : 0;
        todayCaloriesElement.textContent = currentCalories;
        const caloriesDifference = CALORIE_GOAL - currentCalories;
        if (caloriesDifference >= 0) {
            todayCaloriesGoalElement.textContent = `${caloriesDifference} kcal left`;
            todayCaloriesGoalElement.classList.remove('text-red-600');
            todayCaloriesGoalElement.classList.add('text-green-600');
        } else {
            todayCaloriesGoalElement.textContent = `${Math.abs(caloriesDifference)} kcal over`;
            todayCaloriesGoalElement.classList.remove('text-green-600');
            todayCaloriesGoalElement.classList.add('text-red-600');
        }

    } catch (error) {
        console.error('Failed to display dashboard summary:', error);
        todayStepsElement.textContent = 'Error';
        todayWaterElement.textContent = 'Error';
        todayCaloriesElement.textContent = 'Error';
        todayStepsGoalElement.textContent = '';
        todayWaterGoalElement.textContent = '';
        todayCaloriesGoalElement.textContent = '';
    }
}
