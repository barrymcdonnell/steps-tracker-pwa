// main.js
import { openDatabase, saveDailyData, STEPS_STORE_NAME, WATER_STORE_NAME, CALORIES_STORE_NAME } from './db.js';
import { formatDate } from './utils.js';
import { displayProgress, displayDashboardSummary } from './display.js';
// Import both renderWorkoutsView and renderExercisesView
import { renderWorkoutsView, renderWorkoutPlansView, renderExercisesView, displayNextScheduledWorkout } from './workoutDisplay.js';
import { renderAchievementsView, checkAndAwardAchievements } from './achievementsDisplay.js';

document.addEventListener('DOMContentLoaded', async () => {
    const stepsInput = document.getElementById('stepsInput');
    const waterInput = document.getElementById('waterInput');
    const caloriesInput = document.getElementById('caloriesInput');
    const saveDailyDataBtn = document.getElementById('saveDailyDataBtn');

    // Dashboard Summary Elements
    const todayStepsElement = document.getElementById('todaySteps');
    const todayWaterElement = document.getElementById('todayWater');
    const todayCaloriesElement = document.getElementById('todayCalories');
    const todayStepsGoalElement = document.getElementById('todayStepsGoal');
    const todayWaterGoalElement = document.getElementById('todayWaterGoal');
    const todayCaloriesGoalElement = document.getElementById('todayCaloriesGoal');

    // Tracking View Elements
    const stepsList = document.getElementById('stepsList');
    const waterList = document.getElementById('waterList');
    const caloriesList = document.getElementById('caloriesList');
    const stepsChartCanvas = document.getElementById('stepsChart');
    const waterChartCanvas = document.getElementById('waterChart');
    const caloriesChartCanvas = document.getElementById('caloriesChart');
    const appVersionSpan = document.getElementById('appVersion');

    // View Containers
    const dashboardView = document.getElementById('dashboardView');
    const trackingView = document.getElementById('trackingView');
    const workoutsView = document.getElementById('workoutsView');
    const workoutPlansView = document.getElementById('workoutPlansView');
    const moreView = document.getElementById('moreView');
    const exercisesView = document.getElementById('exercisesView'); // New exercises view container
    const achievementsView = document.getElementById('achievementsView');

    // Navigation Links
    const navDashboard = document.getElementById('navDashboard');
    const navTracking = document.getElementById('navTracking');
    const navWorkouts = document.getElementById('navWorkouts');
    const navPlans = document.getElementById('navPlans');
    const navMore = document.getElementById('navMore');

    // Set the app version
    appVersionSpan.textContent = '1.6.0'; // Updated version for new feature

    // Function to show a specific view and update active nav link
    function showView(viewToShow, activeNavLink) {
        dashboardView.classList.add('hidden');
        trackingView.classList.add('hidden');
        workoutsView.classList.add('hidden');
        workoutPlansView.classList.add('hidden');
        moreView.classList.add('hidden');
        exercisesView.classList.add('hidden'); // Hide exercises view
        achievementsView.classList.add('hidden');

        viewToShow.classList.remove('hidden');

        // Remove active class from all nav links
        document.querySelectorAll('.active-nav-link').forEach(link => {
            link.classList.remove('active-nav-link');
            // Removed: link.classList.remove('bg-indigo-600'); // This is now handled by CSS
        });
        // Add active class to the clicked nav link
        if (activeNavLink) {
            activeNavLink.classList.add('active-nav-link');
            // Removed: activeNavLink.classList.add('bg-indigo-600'); // This is now handled by CSS
        }
    }

    // Function to render the content of the "More" view
    function renderMoreView() {
        const showAchievementsBtn = document.getElementById('showAchievementsFromMoreBtn');
        if (showAchievementsBtn) {
            showAchievementsBtn.onclick = async (e) => {
                e.preventDefault();
                showView(achievementsView, navMore);
                await renderAchievementsView(achievementsView);
            };
        }

        const showExercisesBtn = document.getElementById('showExercisesFromMoreBtn'); // New button for exercises
        if (showExercisesBtn) {
            showExercisesBtn.onclick = async (e) => {
                e.preventDefault();
                showView(exercisesView, navMore); // Show exercises view, keep 'More' active
                await renderExercisesView(exercisesView); // Call the new render function for exercises
            };
        }
    }

    // Initial load logic
    try {
        await openDatabase();
        await displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement);
        await displayNextScheduledWorkout();
        showView(dashboardView, navDashboard);
    } catch (error) {
        console.error('Failed to initialize app:', error);
        const mainContentWrapper = document.getElementById('mainContentWrapper');
        if (mainContentWrapper) {
            mainContentWrapper.innerHTML = '<p class="text-center text-red-500 text-lg font-semibold mt-8">Failed to load the app. Please check your browser console for details.</p>';
        }
    }

    // Navigation Link Event Listeners
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        showView(dashboardView, navDashboard);
        displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement);
        displayNextScheduledWorkout();
    });

    navTracking.addEventListener('click', (e) => {
        e.preventDefault();
        showView(trackingView, navTracking);
        displayProgress(stepsList, waterList, stepsChartCanvas, waterChartCanvas, caloriesList, caloriesChartCanvas);
    });

    navWorkouts.addEventListener('click', async (e) => {
        e.preventDefault();
        showView(workoutsView, navWorkouts);
        await renderWorkoutsView(workoutsView); // This will now only handle workouts
    });

    navPlans.addEventListener('click', async (e) => {
        e.preventDefault();
        showView(workoutPlansView, navPlans);
        await renderWorkoutPlansView(workoutPlansView);
    });

    navMore.addEventListener('click', async (e) => {
        e.preventDefault();
        showView(moreView, navMore);
        renderMoreView();
    });

    // Event listener for the save button
    saveDailyDataBtn.addEventListener('click', async () => {
        const stepsValue = stepsInput.value;
        const waterValue = waterInput.value;
        const caloriesValue = caloriesInput.value;
        const today = formatDate(new Date());

        let stepsToSave = null;
        let waterToSave = null;
        let caloriesToSave = null;
        let anyDataToSave = false;

        // Validate and parse steps
        if (stepsValue !== '') {
            const parsedSteps = parseInt(stepsValue, 10);
            if (isNaN(parsedSteps) || parsedSteps < 0) {
                stepsInput.value = '';
                stepsInput.placeholder = 'Invalid steps!';
                setTimeout(() => { stepsInput.placeholder = 'e.g., 7500'; }, 3000);
            } else {
                stepsToSave = parsedSteps;
                anyDataToSave = true;
            }
        }

        // Validate and parse water
        if (waterValue !== '') {
            const parsedWater = parseInt(waterValue, 10);
            if (isNaN(parsedWater) || parsedWater < 0) {
                waterInput.value = '';
                waterInput.placeholder = 'Invalid water!';
                setTimeout(() => { waterInput.placeholder = 'e.g., 2000'; }, 3000);
            } else {
                waterToSave = parsedWater;
                anyDataToSave = true;
            }
        }

        // Validate and parse calories
        if (caloriesValue !== '') {
            const parsedCalories = parseInt(caloriesValue, 10);
            if (isNaN(parsedCalories) || parsedCalories < 0) {
                caloriesInput.value = '';
                caloriesInput.placeholder = 'Invalid calories!';
                setTimeout(() => { caloriesInput.placeholder = 'e.g., 1730'; }, 3000);
            } else {
                caloriesToSave = parsedCalories;
                anyDataToSave = true;
            }
        }

        if (!anyDataToSave) {
            const errorMessage = document.createElement('li');
            errorMessage.className = 'text-center text-red-500';
            errorMessage.textContent = 'Please enter valid data for steps, water, or calories to save.';
            const dashboardErrorDiv = document.getElementById('dashboardView').querySelector('.mb-6');
            const currentError = dashboardErrorDiv.querySelector('.temp-error-message');
            if (currentError) currentError.remove();

            const tempError = document.createElement('p');
            tempError.className = 'text-center text-red-500 text-sm mt-2 temp-error-message';
            tempError.textContent = 'Please enter valid data for steps, water, or calories to save.';
            dashboardErrorDiv.parentNode.insertBefore(tempError, dashboardErrorDiv.nextSibling);
            setTimeout(() => tempError.remove(), 5000);
            return;
        }

        try {
            if (stepsToSave !== null) {
                await saveDailyData(STEPS_STORE_NAME, { date: today, value: stepsToSave });
                stepsInput.value = '';
            }

            if (waterToSave !== null) {
                await saveDailyData(WATER_STORE_NAME, { date: today, value: waterToSave });
                waterInput.value = '';
            }

            if (caloriesToSave !== null) {
                await saveDailyData(CALORIES_STORE_NAME, { date: today, value: caloriesToSave });
                caloriesInput.value = '';
            }

            await checkAndAwardAchievements();

            await displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement);
            await displayNextScheduledWorkout();
            if (!trackingView.classList.contains('hidden')) {
                await displayProgress(stepsList, waterList, stepsChartCanvas, waterChartCanvas, caloriesList, caloriesChartCanvas);
            }

        } catch (error) {
                console.error('Error saving daily data:', error);
                const dashboardErrorDiv = document.getElementById('dashboardView').querySelector('.mb-6');
                const currentError = dashboardErrorDiv.querySelector('.temp-error-message');
                if (currentError) currentError.remove();

                const tempError = document.createElement('p');
                tempError.className = 'text-center text-red-500 text-sm mt-2 temp-error-message';
                tempError.textContent = 'Failed to save data. Please try again.';
                dashboardErrorDiv.parentNode.insertBefore(tempError, dashboardErrorDiv.nextSibling);
                setTimeout(() => tempError.remove(), 5000);
        }
    });
});
