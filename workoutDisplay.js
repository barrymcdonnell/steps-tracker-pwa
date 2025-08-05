// workoutDisplay.js
import { saveDailyData, getAllDailyData, deleteItemById, EXERCISES_STORE_NAME, WORKOUTS_STORE_NAME } from './db.js';
import { EXERCISE_TYPES, WORKOUT_CATEGORIES, DEFAULT_EXERCISE_SETTINGS } from './workoutConstants.js';

// DOM elements (will be dynamically assigned within renderWorkoutsView)
let workoutViewElement; // The main container for the entire workout section
let workoutSubSectionElement; // A sub-container within workoutViewElement for forms/lists

/**
 * Hides all sub-sections within the workout view to prepare for rendering a new one.
 * This is crucial because we are dynamically updating a single sub-section container.
 */
function hideAllWorkoutSubSections() {
    // Since forms and lists are rendered into workoutSubSectionElement,
    // we just need to clear its content when switching.
    if (workoutSubSectionElement) {
        workoutSubSectionElement.innerHTML = '';
    }
}

/**
 * Renders the form for adding a new exercise.
 */
function renderAddExerciseForm() {
    if (!workoutSubSectionElement) return; // Ensure element is available

    workoutSubSectionElement.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Add New Exercise</h2>
        <div class="mb-4">
            <label for="exerciseNameInput" class="block text-gray-700 text-sm font-semibold mb-2">Exercise Name:</label>
            <input type="text" id="exerciseNameInput" placeholder="e.g., Push-up"
                   class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
        </div>
        <div class="mb-4">
            <label for="exerciseTypeSelect" class="block text-gray-700 text-sm font-semibold mb-2">Exercise Type:</label>
            <select id="exerciseTypeSelect"
                    class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
                ${Object.values(EXERCISE_TYPES).map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>
        </div>
        <button id="saveExerciseBtn"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105">
            Save Exercise
        </button>
        <p id="exerciseFormMessage" class="text-center text-sm mt-2"></p>
    `;

    const saveExerciseBtn = document.getElementById('saveExerciseBtn');
    const exerciseNameInput = document.getElementById('exerciseNameInput');
    const exerciseTypeSelect = document.getElementById('exerciseTypeSelect');
    const exerciseFormMessage = document.getElementById('exerciseFormMessage');

    saveExerciseBtn.addEventListener('click', async () => {
        const name = exerciseNameInput.value.trim();
        const type = exerciseTypeSelect.value;

        if (!name) {
            exerciseFormMessage.textContent = 'Exercise name cannot be empty.';
            exerciseFormMessage.className = 'text-center text-red-500 text-sm mt-2';
            return;
        }

        try {
            // ID will be auto-incremented by IndexedDB
            const newExercise = { name, type };
            await saveDailyData(EXERCISES_STORE_NAME, newExercise);
            exerciseFormMessage.textContent = 'Exercise saved successfully!';
            exerciseFormMessage.className = 'text-center text-green-500 text-sm mt-2';
            exerciseNameInput.value = ''; // Clear input
            // Optionally, you could immediately show the list of exercises here
            // await displayExercises();
        } catch (error) {
            console.error('Error saving exercise:', error);
            exerciseFormMessage.textContent = 'Failed to save exercise. Please try again.';
            exerciseFormMessage.className = 'text-center text-red-500 text-sm mt-2';
        }
    });
}

/**
 * Displays the list of exercises.
 */
async function displayExercises() {
    if (!workoutSubSectionElement) return; // Ensure element is available

    workoutSubSectionElement.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Your Exercises</h2>
        <ul id="currentExerciseList" class="space-y-3"></ul>
        <button id="addExerciseFromListBtn" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-4">Add New Exercise</button>
    `;

    const currentExerciseList = document.getElementById('currentExerciseList');
    const addExerciseFromListBtn = document.getElementById('addExerciseFromListBtn');

    addExerciseFromListBtn.addEventListener('click', () => {
        hideAllWorkoutSubSections();
        renderAddExerciseForm();
    });

    try {
        const exercises = await getAllDailyData(EXERCISES_STORE_NAME);
        if (exercises.length === 0) {
            currentExerciseList.innerHTML = '<li class="p-3 rounded-lg text-center text-gray-500 bg-gray-50">No exercises added yet. Click "Add New Exercise" above.</li>';
        } else {
            exercises.forEach(exercise => {
                const listItem = document.createElement('li');
                listItem.className = 'p-3 rounded-lg flex justify-between items-center bg-gray-100';
                listItem.innerHTML = `
                    <span class="font-medium text-gray-800">${exercise.name}</span>
                    <div class="flex items-center ml-auto"> <!-- Added this div for alignment -->
                        <span class="text-sm text-gray-600 mr-4">${exercise.type}</span> <!-- Added mr-4 for spacing -->
                        <button data-id="${exercise.id}" class="delete-exercise-btn text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                currentExerciseList.appendChild(listItem);
            });

            document.querySelectorAll('.delete-exercise-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const exerciseId = parseInt(e.currentTarget.dataset.id, 10);
                    // Using a simple confirm for now, will replace with custom modal later
                    if (confirm('Are you sure you want to delete this exercise?')) {
                        await deleteItemById(EXERCISES_STORE_NAME, exerciseId);
                        await displayExercises(); // Refresh list after deletion
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error displaying exercises:', error);
        currentExerciseList.innerHTML = '<li class="text-center text-red-500">Error loading exercises.</li>';
    }
}

/**
 * Renders the form for creating a new workout routine.
 */
async function renderAddWorkoutForm() {
    if (!workoutSubSectionElement) return; // Ensure element is available

    workoutSubSectionElement.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Create New Workout</h2>
        <div class="mb-4">
            <label for="workoutNameInput" class="block text-gray-700 text-sm font-semibold mb-2">Workout Name:</label>
            <input type="text" id="workoutNameInput" placeholder="e.g., Full Body Blast"
                   class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
        </div>
        <div class="mb-4">
            <label for="workoutCategorySelect" class="block text-gray-700 text-sm font-semibold mb-2">Category:</label>
            <select id="workoutCategorySelect"
                    class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
                ${Object.values(WORKOUT_CATEGORIES).map(category => `<option value="${category}">${category}</option>`).join('')}
            </select>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">Select Exercises:</h3>
        <div id="exerciseSelection" class="space-y-2 mb-4 p-2 border rounded-lg bg-gray-50">
            <!-- Exercises will be loaded here -->
            <p class="text-center text-gray-500">Loading exercises...</p>
        </div>
        <button id="saveWorkoutBtn"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105">
            Save Workout
        </button>
        <p id="workoutFormMessage" class="text-center text-sm mt-2"></p>
    `;

    const workoutNameInput = document.getElementById('workoutNameInput');
    const workoutCategorySelect = document.getElementById('workoutCategorySelect');
    const exerciseSelectionDiv = document.getElementById('exerciseSelection');
    const saveWorkoutBtn = document.getElementById('saveWorkoutBtn');
    const workoutFormMessage = document.getElementById('workoutFormMessage');

    try {
        const exercises = await getAllDailyData(EXERCISES_STORE_NAME);
        exerciseSelectionDiv.innerHTML = ''; // Clear loading message

        if (exercises.length === 0) {
            exerciseSelectionDiv.innerHTML = '<p class="text-center text-gray-500">No exercises added yet. Go to "Add New Exercise" to create some.</p>';
            saveWorkoutBtn.disabled = true; // Disable save if no exercises
        } else {
            exercises.forEach(exercise => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'flex items-center';
                checkboxDiv.innerHTML = `
                    <input type="checkbox" id="exercise-${exercise.id}" value="${exercise.id}" data-name="${exercise.name}"
                           class="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500">
                    <label for="exercise-${exercise.id}" class="ml-2 text-gray-700">${exercise.name} (${exercise.type})</label>
                `;
                exerciseSelectionDiv.appendChild(checkboxDiv);
            });
            saveWorkoutBtn.disabled = false; // Enable save if exercises exist
        }
    } catch (error) {
        console.error('Error loading exercises for workout form:', error);
        exerciseSelectionDiv.innerHTML = '<p class="text-center text-red-500">Error loading exercises.</p>';
        saveWorkoutBtn.disabled = true;
    }

    saveWorkoutBtn.addEventListener('click', async () => {
        const name = workoutNameInput.value.trim();
        const category = workoutCategorySelect.value;
        const selectedExercises = Array.from(exerciseSelectionDiv.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => ({
            id: parseInt(checkbox.value, 10),
            name: checkbox.dataset.name,
            // You might add default sets/reps/duration here or allow user to input them for each exercise in the workout
            sets: DEFAULT_EXERCISE_SETTINGS.SETS,
            reps: DEFAULT_EXERCISE_SETTINGS.REPS
        }));

        if (!name) {
            workoutFormMessage.textContent = 'Workout name cannot be empty.';
            workoutFormMessage.className = 'text-center text-red-500 text-sm mt-2';
            return;
        }
        if (selectedExercises.length === 0) {
            workoutFormMessage.textContent = 'Please select at least one exercise for the workout.';
            workoutFormMessage.className = 'text-center text-red-500 text-sm mt-2';
            return;
        }

        try {
            const newWorkout = { name, category, exercises: selectedExercises };
            await saveDailyData(WORKOUTS_STORE_NAME, newWorkout);
            workoutFormMessage.textContent = 'Workout saved successfully!';
            workoutFormMessage.className = 'text-center text-green-500 text-sm mt-2';
            workoutNameInput.value = ''; // Clear input
            // Uncheck all checkboxes
            exerciseSelectionDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
            // Optionally, you could immediately show the list of workouts here
            // await displayWorkouts();
        } catch (error) {
            console.error('Error saving workout:', error);
            workoutFormMessage.textContent = 'Failed to save workout. Please try again.';
            workoutFormMessage.className = 'text-center text-red-500 text-sm mt-2';
        }
    });
}

/**
 * Displays the list of workout routines.
 */
async function displayWorkouts() {
    if (!workoutSubSectionElement) return; // Ensure element is available

    workoutSubSectionElement.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Your Workouts</h2>
        <ul id="currentWorkoutList" class="space-y-3"></ul>
        <button id="addWorkoutFromListBtn" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-4">Create New Workout</button>
    `;

    const currentWorkoutList = document.getElementById('currentWorkoutList');
    const addWorkoutFromListBtn = document.getElementById('addWorkoutFromListBtn');

    addWorkoutFromListBtn.addEventListener('click', () => {
        hideAllWorkoutSubSections();
        renderAddWorkoutForm();
    });

    try {
        const workouts = await getAllDailyData(WORKOUTS_STORE_NAME);
        if (workouts.length === 0) {
            currentWorkoutList.innerHTML = '<li class="p-3 rounded-lg text-center text-gray-500 bg-gray-50">No workouts created yet. Click "Create New Workout" above.</li>';
        } else {
            workouts.forEach(workout => {
                const listItem = document.createElement('li');
                listItem.className = 'p-3 rounded-lg flex justify-between items-center bg-gray-100';
                listItem.innerHTML = `
                    <div>
                        <span class="font-medium text-gray-800">${workout.name}</span>
                        <p class="text-sm text-gray-600">${workout.category} - ${workout.exercises.length} exercises</p>
                    </div>
                    <button data-id="${workout.id}" class="delete-workout-btn text-red-500 hover:text-red-700 ml-4"><i class="fa-solid fa-trash"></i></button>
                `;
                currentWorkoutList.appendChild(listItem);
            });

            document.querySelectorAll('.delete-workout-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const workoutId = parseInt(e.currentTarget.dataset.id, 10);
                    // Using a simple confirm for now, will replace with custom modal later
                    if (confirm('Are you sure you want to delete this workout?')) {
                        await deleteItemById(WORKOUTS_STORE_NAME, workoutId);
                        await displayWorkouts(); // Refresh list after deletion
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error displaying workouts:', error);
        currentWorkoutList.innerHTML = '<li class="text-center text-red-500">Error loading workouts.</li>';
    }
}

/**
 * Renders the main Workouts view with options to add exercises/workouts or view them.
 * This is the entry point for the workouts tab.
 * @param {HTMLElement} viewElement - The main container for the workout view from main.js.
 */
export async function renderWorkoutsView(viewElement) {
    workoutViewElement = viewElement; // Assign the main workout view element

    workoutViewElement.innerHTML = `
        <h1 class="text-3xl font-bold text-center text-indigo-700 mb-6">Workouts</h1>
        <div class="space-y-4">
            <button id="showAddExerciseFormBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105">
                Add New Exercise
            </button>
            <button id="showExercisesListBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105">
                View All Exercises
            </button>
            <button id="showAddWorkoutFormBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105">
                Create New Workout
            </button>
            <button id="showWorkoutsListBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105">
                View All Workouts
            </button>
        </div>
        <div id="workoutSubSection" class="mt-8">
            <!-- Sub-sections (add exercise, exercise list, add workout, workout list) will be rendered here -->
        </div>
    `;

    // Assign the sub-section container after it's rendered
    workoutSubSectionElement = workoutViewElement.querySelector('#workoutSubSection');

    // Add event listeners to the main workout navigation buttons
    document.getElementById('showAddExerciseFormBtn').addEventListener('click', () => {
        hideAllWorkoutSubSections();
        renderAddExerciseForm();
    });

    document.getElementById('showExercisesListBtn').addEventListener('click', async () => {
        hideAllWorkoutSubSections();
        await displayExercises();
    });

    document.getElementById('showAddWorkoutFormBtn').addEventListener('click', () => {
        hideAllWorkoutSubSections();
        renderAddWorkoutForm();
    });

    document.getElementById('showWorkoutsListBtn').addEventListener('click', async () => {
        hideAllWorkoutSubSections();
        await displayWorkouts();
    });
}
