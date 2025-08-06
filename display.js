// display.js
import { getDailyData, getStoreData, WORKOUTS_STORE_NAME, PLANS_STORE_NAME } from './db.js';
import { STEP_GOAL, WATER_GOAL, CALORIE_GOAL } from './constants.js';
import { renderStepsChart, renderWaterChart, renderCaloriesChart } from './charts.js';
import { EXERCISE_TYPES, WORKOUT_CATEGORIES } from './workoutConstants.js';

/**
 * Updates the summary card on the dashboard with today's data and goals.
 * @param {HTMLElement} stepsElement - The DOM element for today's steps.
 * @param {HTMLElement} waterElement - The DOM element for today's water.
 * @param {HTMLElement} caloriesElement - The DOM element for today's calories.
 * @param {HTMLElement} stepsGoalElement - The DOM element for the steps goal.
 * @param {HTMLElement} waterGoalElement - The DOM element for the water goal.
 * @param {HTMLElement} caloriesGoalElement - The DOM element for the calories goal.
 */
export async function displayDashboardSummary(stepsElement, waterElement, caloriesElement, stepsGoalElement, waterGoalElement, caloriesGoalElement) {
    const todaySteps = await getDailyData('steps');
    const todayWater = await getDailyData('water');
    const todayCalories = await getDailyData('calories');

    stepsElement.textContent = todaySteps.value !== undefined ? todaySteps.value : '0';
    waterElement.textContent = todayWater.value !== undefined ? todayWater.value / 1000 : '0';
    caloriesElement.textContent = todayCalories.value !== undefined ? todayCalories.value : '0';

    stepsGoalElement.textContent = STEP_GOAL;
    waterGoalElement.textContent = WATER_GOAL / 1000;
    caloriesGoalElement.textContent = CALORIE_GOAL;
}

/**
 * Fetches and displays progress data for a given store, including a chart and a list.
 * @param {HTMLElement} listElement - The list DOM element to populate.
 * @param {HTMLCanvasElement} chartCanvas - The chart canvas DOM element.
 * @param {string} storeName - The name of the IndexedDB object store (e.g., 'steps').
 * @param {Function} renderChartFn - The chart rendering function (e.g., renderStepsChart).
 */
async function displayDataForStore(listElement, chartCanvas, storeName, renderChartFn) {
    const data = await getStoreData(storeName);

    // Clear existing content
    listElement.innerHTML = '';
    
    if (data.length === 0) {
        listElement.innerHTML = '<li class="p-4 text-center text-gray-500">No data logged yet.</li>';
        // Destroy the old chart instance if it exists to avoid rendering issues
        if (chartCanvas && chartCanvas.chart) {
            chartCanvas.chart.destroy();
        }
        return;
    }

    // Populate the list
    data.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.className = 'p-4 border-b border-gray-200 last:border-b-0 flex justify-between items-center';
        listItem.innerHTML = `
            <div class="font-medium text-gray-800">${entry.date}</div>
            <div class="text-indigo-600 font-semibold">${entry.value}</div>
        `;
        listElement.appendChild(listItem);
    });

    // Render the chart
    if (chartCanvas) {
        renderChartFn(chartCanvas, data);
    }
}

/**
 * Displays the progress view with charts and lists for steps, water, and calories.
 * @param {HTMLElement} stepsListElement - The DOM element for the steps list.
 * @param {HTMLElement} waterListElement - The DOM element for the water list.
 * @param {HTMLCanvasElement} stepsChartCanvasElement - The DOM element for the steps chart.
 * @param {HTMLCanvasElement} waterChartCanvasElement - The DOM element for the water chart.
 * @param {HTMLElement} caloriesListElement - The DOM element for the calories list.
 * @param {HTMLCanvasElement} caloriesChartCanvasElement - The DOM element for the calories chart.
 */
export async function displayProgress(stepsListElement, waterListElement, stepsChartCanvasElement, waterChartCanvasElement, caloriesListElement, caloriesChartCanvasElement) {
    await displayDataForStore(stepsListElement, stepsChartCanvasElement, 'steps', renderStepsChart);
    await displayDataForStore(waterListElement, waterChartCanvasElement, 'water', renderWaterChart);
    await displayDataForStore(caloriesListElement, caloriesChartCanvasElement, 'calories', renderCaloriesChart);
}

/**
 * Displays the list of saved workouts.
 * @param {HTMLElement} workoutsListElement - The DOM element for the workouts list.
 */
export async function displayWorkouts() {
    const workoutsListElement = document.getElementById('workoutsList');
    workoutsListElement.innerHTML = '';
    
    const workouts = await getStoreData(WORKOUTS_STORE_NAME);

    if (workouts.length === 0) {
        workoutsListElement.innerHTML = '<p class="text-center text-gray-500 mt-4">No workouts saved yet. Time to get moving!</p>';
        return;
    }

    workouts.forEach(workout => {
        const li = document.createElement('li');
        li.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-2';
        li.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-900">${workout.name}</h3>
            <p class="text-sm text-gray-500">Category: ${workout.category}</p>
            <ul class="mt-2 text-sm text-gray-700">
                ${workout.exercises.map(ex => `
                    <li class="pl-2 border-l-2 border-indigo-500 my-1">
                        <strong>${ex.name}:</strong> ${ex.sets} sets of ${ex.reps} reps
                    </li>
                `).join('')}
            </ul>
        `;
        workoutsListElement.appendChild(li);
    });
}

/**
 * Displays the list of saved workout plans.
 * @param {HTMLElement} workoutPlansListElement - The DOM element for the workout plans list.
 */
export async function displayPlans() {
    const workoutPlansListElement = document.getElementById('workoutPlansList');
    workoutPlansListElement.innerHTML = '';
    
    const plans = await getStoreData(PLANS_STORE_NAME);

    if (plans.length === 0) {
        workoutPlansListElement.innerHTML = '<p class="text-center text-gray-500 mt-4">No workout plans created yet. Let\'s build one!</p>';
        return;
    }

    plans.forEach(plan => {
        const li = document.createElement('li');
        li.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-2';
        li.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-900">${plan.name}</h3>
            <p class="text-sm text-gray-500">Duration: ${plan.durationDays} days</p>
            <ul class="mt-2 text-sm text-gray-700">
                ${plan.workoutIds.map(workoutId => `
                    <li class="pl-2 border-l-2 border-green-500 my-1">
                        Workout ID: ${workoutId}
                    </li>
                `).join('')}
            </ul>
        `;
        workoutPlansListElement.appendChild(li);
    });
}
