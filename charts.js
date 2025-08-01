// charts.js
import { STEP_GOAL, WATER_GOAL, CALORIE_GOAL } from './constants.js'; // Import CALORIE_GOAL

let stepsChartInstance; // Variable to hold the Chart.js instance for steps
let waterChartInstance; // Variable to hold the Chart.js instance for water
let caloriesChartInstance; // Variable to hold the Chart.js instance for calories

/**
 * Renders or updates the Chart.js graph for steps with a goal line.
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element for the chart.
 * @param {Array<{date: string, value: number}>} stepsData - The steps data to plot.
 */
export function renderStepsChart(canvasElement, stepsData) {
    const labels = stepsData.map(entry => entry.date);
    const steps = stepsData.map(entry => entry.value);
    const goalLine = Array(stepsData.length).fill(STEP_GOAL);

    if (stepsChartInstance) {
        stepsChartInstance.data.labels = labels;
        stepsChartInstance.data.datasets[0].data = steps;
        stepsChartInstance.data.datasets[1].data = goalLine;
        stepsChartInstance.update();
    } else {
        stepsChartInstance = new Chart(canvasElement, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Daily Steps',
                        data: steps,
                        backgroundColor: 'rgba(79, 70, 229, 0.8)',
                        borderColor: 'rgb(79, 70, 229)',
                        borderWidth: 1,
                        yAxisID: 'y',
                        categoryPercentage: 0.7,
                        barPercentage: 0.8,
                        borderRadius: 5,
                        order: 1,
                    },
                    {
                        label: `Goal (${STEP_GOAL} steps)`,
                        data: goalLine,
                        type: 'line',
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0,
                        fill: false,
                        yAxisID: 'y',
                        order: 2,
                        borderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Steps vs. Goal',
                        font: { size: 16 },
                        color: '#374151'
                    },
                    legend: {
                        labels: { color: '#4B5563' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Date', color: '#4B5563' },
                        ticks: { color: '#6B7280' },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: 'Steps', color: '#4B5563' },
                        ticks: { color: '#6B7280' },
                        grid: { color: '#E5E7EB' },
                        beginAtZero: true,
                        suggestedMax: STEP_GOAL * 1.2
                    }
                }
            }
        });
    }
}

/**
 * Renders or updates the Chart.js graph for water with a goal line.
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element for the chart.
 * @param {Array<{date: string, value: number}>} waterData - The water data to plot.
 */
export function renderWaterChart(canvasElement, waterData) {
    const labels = waterData.map(entry => entry.date);
    const water = waterData.map(entry => entry.value);
    const goalLine = Array(waterData.length).fill(WATER_GOAL);

    if (waterChartInstance) {
        waterChartInstance.data.labels = labels;
        waterChartInstance.data.datasets[0].data = water;
        waterChartInstance.data.datasets[1].data = goalLine;
        waterChartInstance.update();
    } else {
        waterChartInstance = new Chart(canvasElement, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Daily Water (ml)',
                        data: water,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Tailwind blue-500 with opacity
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                        yAxisID: 'y',
                        categoryPercentage: 0.7,
                        barPercentage: 0.8,
                        borderRadius: 5,
                        order: 1,
                    },
                    {
                        label: `Goal (${WATER_GOAL} ml)`,
                        data: goalLine,
                        type: 'line',
                        borderColor: 'rgb(239, 68, 68)', // Tailwind red-500
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0,
                        fill: false,
                        yAxisID: 'y',
                        order: 2,
                        borderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Water Intake vs. Goal',
                        font: { size: 16 },
                        color: '#374151'
                    },
                    legend: {
                        labels: { color: '#4B5563' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Date', color: '#4B5563' },
                        ticks: { color: '#6B7280' },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: 'Water (ml)', color: '#4B5563' },
                        ticks: { color: '#6B7280' },
                        grid: { color: '#E5E7EB' },
                        beginAtZero: true,
                        suggestedMax: WATER_GOAL * 1.2
                    }
                }
            }
        });
    }
}

/**
 * Renders or updates the Chart.js graph for calories with a goal line.
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element for the chart.
 * @param {Array<{date: string, value: number}>} caloriesData - The calories data to plot.
 */
export function renderCaloriesChart(canvasElement, caloriesData) {
    const labels = caloriesData.map(entry => entry.date);
    const calories = caloriesData.map(entry => entry.value);
    const goalLine = Array(caloriesData.length).fill(CALORIE_GOAL);

    if (caloriesChartInstance) {
        caloriesChartInstance.data.labels = labels;
        caloriesChartInstance.data.datasets[0].data = calories;
        caloriesChartInstance.data.datasets[1].data = goalLine;
        caloriesChartInstance.update();
    } else {
        caloriesChartInstance = new Chart(canvasElement, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Daily Calories',
                        data: calories,
                        backgroundColor: 'rgba(245, 158, 11, 0.8)', // Tailwind orange-500 with opacity
                        borderColor: 'rgb(245, 158, 11)',
                        borderWidth: 1,
                        yAxisID: 'y',
                        categoryPercentage: 0.7,
                        barPercentage: 0.8,
                        borderRadius: 5,
                        order: 1,
                    },
                    {
                        label: `Goal (${CALORIE_GOAL} kcal)`,
                        data: goalLine,
                        type: 'line',
                        borderColor: 'rgb(239, 68, 68)', // Tailwind red-500
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0,
                        fill: false,
                        yAxisID: 'y',
                        order: 2,
                        borderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Calorie Intake vs. Goal',
                        font: { size: 16 },
                        color: '#374151'
                    },
                    legend: {
                        labels: { color: '#4B5563' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Date', color: '#4B5563' },
                        ticks: { color: '#6B7280' },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: 'Calories (kcal)', color: '#4B5563' },
                        ticks: { color: '#6B7280' },
                        grid: { color: '#E5E7EB' },
                        beginAtZero: true,
                        suggestedMax: CALORIE_GOAL * 1.2
                    }
                }
            }
        });
    }
}
