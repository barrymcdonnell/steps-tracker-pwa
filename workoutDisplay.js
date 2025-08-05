// workoutDisplay.js
import { saveDailyData, getAllDailyData, deleteItemById, getItemById, EXERCISES_STORE_NAME, WORKOUTS_STORE_NAME, WORKOUT_SESSIONS_STORE_NAME, WORKOUT_PLANS_STORE_NAME } from './db.js';
import { EXERCISE_TYPES, WORKOUT_CATEGORIES, DEFAULT_EXERCISE_SETTINGS } from './workoutConstants.js';
import { formatDate } from './utils.js'; // Import formatDate for session date

// DOM elements (will be dynamically assigned within renderWorkoutsView)
let workoutViewElement; // The main container for the entire workout section
let workoutSubSectionElement; // A sub-container within workoutViewElement for forms/lists

// DOM element for workout plans view (new)
let workoutPlansViewElement;
let workoutPlansSubSectionElement;

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
    // Also clear workout plans sub-section if it exists
    if (workoutPlansSubSectionElement) {
        workoutPlansSubSectionElement.innerHTML = '';
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
                    <div class="flex items-center ml-auto">
                        <span class="text-sm text-gray-600 mr-4">${exercise.type}</span>
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
                    <input type="checkbox" id="exercise-${exercise.id}" value="${exercise.id}" data-name="${exercise.name}" data-type="${exercise.type}"
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
            type: checkbox.dataset.type, // Include type for display in workout details
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
            // Redirect back to workouts list after successful save
            await displayWorkouts();
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
        <h3 class="text-xl font-semibold text-gray-800 mb-4 mt-8 text-center">Completed Workouts</h3>
        <ul id="completedWorkoutsList" class="space-y-3"></ul>
    `;

    const currentWorkoutList = document.getElementById('currentWorkoutList');
    const addWorkoutFromListBtn = document.getElementById('addWorkoutFromListBtn');
    const completedWorkoutsList = document.getElementById('completedWorkoutsList');

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
                    <div class="flex items-center space-x-2">
                        <button data-id="${workout.id}" class="start-workout-btn bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded-md transition duration-200 mr-2">Start</button>
                        <button data-id="${workout.id}" class="view-edit-workout-btn bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-1 px-3 rounded-md transition duration-200">View/Edit</button>
                        <button data-id="${workout.id}" class="delete-workout-btn text-red-500 hover:text-red-700 text-lg"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                currentWorkoutList.appendChild(listItem);
            });

            document.querySelectorAll('.start-workout-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const workoutId = parseInt(e.currentTarget.dataset.id, 10);
                    hideAllWorkoutSubSections();
                    await renderStartWorkoutSession(workoutId);
                });
            });

            document.querySelectorAll('.view-edit-workout-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const workoutId = parseInt(e.currentTarget.dataset.id, 10);
                    hideAllWorkoutSubSections();
                    await renderWorkoutDetailsForm(workoutId);
                });
            });

            document.querySelectorAll('.delete-workout-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const workoutId = parseInt(e.currentTarget.dataset.id, 10);
                    // Using a simple confirm for now, will will replace with custom modal later
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

    // Display Completed Workouts
    try {
        const completedSessions = await getAllDailyData(WORKOUT_SESSIONS_STORE_NAME);
        if (completedSessions.length === 0) {
            completedWorkoutsList.innerHTML = '<li class="p-3 rounded-lg text-center text-gray-500 bg-gray-50">No workouts completed yet.</li>';
        } else {
            completedSessions.forEach(session => {
                const listItem = document.createElement('li');
                listItem.className = 'p-3 rounded-lg flex justify-between items-center bg-green-50';
                listItem.innerHTML = `
                    <span class="font-medium text-green-800">${session.workoutName}</span>
                    <span class="text-sm text-green-600">${session.date}</span>
                `;
                completedWorkoutsList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error('Error displaying completed workouts:', error);
        completedWorkoutsList.innerHTML = '<li class="text-center text-red-500">Error loading completed workouts.</li>';
    }
}

/**
 * Renders the form to view/edit a specific workout routine.
 * @param {number} workoutId - The ID of the workout to view/edit.
 */
async function renderWorkoutDetailsForm(workoutId) {
    if (!workoutSubSectionElement) return;

    const workout = await getItemById(WORKOUTS_STORE_NAME, workoutId);
    if (!workout) {
        workoutSubSectionElement.innerHTML = '<p class="text-center text-red-500">Workout not found.</p>';
        return;
    }

    // Fetch all exercises to populate the selection for adding/removing
    const allExercises = await getAllDailyData(EXERCISES_STORE_NAME);

    workoutSubSectionElement.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Edit Workout: ${workout.name}</h2>
        <div class="mb-4">
            <label for="editWorkoutNameInput" class="block text-gray-700 text-sm font-semibold mb-2">Workout Name:</label>
            <input type="text" id="editWorkoutNameInput" value="${workout.name}"
                   class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
        </div>
        <div class="mb-4">
            <label for="editWorkoutCategorySelect" class="block text-gray-700 text-sm font-semibold mb-2">Category:</label>
            <select id="editWorkoutCategorySelect"
                    class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
                ${Object.values(WORKOUT_CATEGORIES).map(category =>
                    `<option value="${category}" ${workout.category === category ? 'selected' : ''}>${category}</option>`
                ).join('')}
            </select>
        </div>

        <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">Exercises in this Workout:</h3>
        <ul id="workoutExercisesList" class="space-y-2 mb-4 p-2 border rounded-lg bg-gray-50">
            ${workout.exercises.length === 0 ? '<li class="text-center text-gray-500">No exercises in this workout.</li>' : ''}
            ${workout.exercises.map(ex => `
                <li class="flex justify-between items-center p-2 bg-white rounded-md">
                    <span class="font-medium text-gray-800">${ex.name}</span>
                    <span class="text-sm text-gray-600">${ex.type} - ${ex.sets} sets of ${ex.reps} reps</span>
                </li>
            `).join('')}
        </ul>

        <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">Add/Remove Exercises:</h3>
        <div id="editExerciseSelection" class="space-y-2 mb-4 p-2 border rounded-lg bg-gray-50">
            ${allExercises.length === 0 ? '<p class="text-center text-gray-500">No exercises available to add.</p>' : ''}
            ${allExercises.map(exercise => {
                const isSelected = workout.exercises.some(ex => ex.id === exercise.id);
                return `
                    <div class="flex items-center">
                        <input type="checkbox" id="edit-exercise-${exercise.id}" value="${exercise.id}" data-name="${exercise.name}" data-type="${exercise.type}"
                               class="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500" ${isSelected ? 'checked' : ''}>
                        <label for="edit-exercise-${exercise.id}" class="ml-2 text-gray-700">${exercise.name} (${exercise.type})</label>
                    </div>
                `;
            }).join('')}
        </div>

        <button id="updateWorkoutBtn"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-4">
            Save Changes
        </button>
        <button id="backToWorkoutsListBtn"
                class="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-2">
            Back to Workouts List
        </button>
        <p id="editWorkoutFormMessage" class="text-center text-sm mt-2"></p>
    `;

    const editWorkoutNameInput = document.getElementById('editWorkoutNameInput');
    const editWorkoutCategorySelect = document.getElementById('editWorkoutCategorySelect');
    const editExerciseSelectionDiv = document.getElementById('editExerciseSelection');
    const updateWorkoutBtn = document.getElementById('updateWorkoutBtn');
    const backToWorkoutsListBtn = document.getElementById('backToWorkoutsListBtn');
    const editWorkoutFormMessage = document.getElementById('editWorkoutFormMessage');

    backToWorkoutsListBtn.addEventListener('click', async () => {
        hideAllWorkoutSubSections();
        await displayWorkouts();
    });

    updateWorkoutBtn.addEventListener('click', async () => {
        const name = editWorkoutNameInput.value.trim();
        const category = editWorkoutCategorySelect.value;
        const selectedExercises = Array.from(editExerciseSelectionDiv.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => ({
            id: parseInt(checkbox.value, 10),
            name: checkbox.dataset.name,
            type: checkbox.dataset.type,
            sets: DEFAULT_EXERCISE_SETTINGS.SETS, // Retain default or allow editing later
            reps: DEFAULT_EXERCISE_SETTINGS.REPS // Retain default or allow editing later
        }));

        if (!name) {
            editWorkoutFormMessage.textContent = 'Workout name cannot be empty.';
            editWorkoutFormMessage.className = 'text-center text-red-500 text-sm mt-2';
            return;
        }
        if (selectedExercises.length === 0) {
            editWorkoutFormMessage.textContent = 'Please select at least one exercise for the workout.';
            editWorkoutFormMessage.className = 'text-center text-red-500 text-sm mt-2';
            return;
        }

        try {
            const updatedWorkout = { id: workoutId, name, category, exercises: selectedExercises };
            await saveDailyData(WORKOUTS_STORE_NAME, updatedWorkout); // Use saveDailyData to update by ID
            editWorkoutFormMessage.textContent = 'Workout updated successfully!';
            editWorkoutFormMessage.className = 'text-center text-green-500 text-sm mt-2';
            // Redirect back to workouts list after successful update
            await displayWorkouts();
        } catch (error) {
            console.error('Error updating workout:', error);
            editWorkoutFormMessage.textContent = 'Failed to update workout. Please try again.';
            editWorkoutFormMessage.className = 'text-center text-red-500 text-sm mt-2';
        }
    });
}

/**
 * Renders the interface for starting and tracking a workout session.
 * @param {number} workoutId - The ID of the workout routine to start.
 */
async function renderStartWorkoutSession(workoutId) {
    if (!workoutSubSectionElement) return;

    const workout = await getItemById(WORKOUTS_STORE_NAME, workoutId);
    if (!workout) {
        workoutSubSectionElement.innerHTML = '<p class="text-center text-red-500">Workout not found.</p>';
        return;
    }

    workoutSubSectionElement.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Start Workout: ${workout.name}</h2>
        <p class="text-center text-gray-600 mb-6">Track your sets by checking the boxes.</p>

        <div id="workoutSessionExercises" class="space-y-4">
            <!-- Exercises and sets will be rendered here -->
            ${workout.exercises.map((exercise, exIndex) => `
                <div class="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <h3 class="font-bold text-lg text-indigo-700 mb-2">${exercise.name} <span class="text-sm text-gray-600">(${exercise.type})</span></h3>
                    <p class="text-sm text-gray-600 mb-2">${exercise.sets} sets of ${exercise.reps} reps</p>
                    <div class="flex flex-wrap gap-2">
                        ${Array.from({ length: exercise.sets }).map((_, setIndex) => `
                            <label class="inline-flex items-center cursor-pointer bg-white px-3 py-1 rounded-full shadow-sm hover:bg-gray-50 transition duration-150">
                                <input type="checkbox" class="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                                       data-exercise-id="${exercise.id}" data-set-index="${setIndex}">
                                <span class="ml-2 text-gray-700 text-sm">Set ${setIndex + 1}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <button id="finishWorkoutSessionBtn"
                class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-8">
            Finish Workout
        </button>
        <button id="cancelWorkoutSessionBtn"
                class="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-2">
            Cancel Workout
        </button>
        <p id="workoutSessionMessage" class="text-center text-sm mt-2"></p>
    `;

    const finishWorkoutSessionBtn = document.getElementById('finishWorkoutSessionBtn');
    const cancelWorkoutSessionBtn = document.getElementById('cancelWorkoutSessionBtn');
    const workoutSessionMessage = document.getElementById('workoutSessionMessage');
    const workoutSessionExercisesContainer = document.getElementById('workoutSessionExercises');

    // Store the workout details in a data attribute or global variable for easy access
    workoutSessionExercisesContainer.dataset.workoutId = workout.id;
    workoutSessionExercisesContainer.dataset.workoutName = workout.name;

    // Event listener for the "Finish Workout" button
    finishWorkoutSessionBtn.addEventListener('click', async () => {
        const today = formatDate(new Date());
        const completedExercises = [];
        let allSetsCompleted = true;

        // Iterate through each exercise container
        workoutSessionExercisesContainer.querySelectorAll('.bg-gray-100').forEach(exerciseDiv => {
            const exerciseId = parseInt(exerciseDiv.querySelector('input[type="checkbox"]').dataset.exerciseId, 10);
            const exerciseName = exerciseDiv.querySelector('h3').textContent.split('(')[0].trim(); // Extract name
            const completedSets = [];
            let setsForThisExerciseCompleted = 0;

            // Iterate through checkboxes for each set
            exerciseDiv.querySelectorAll('input[type="checkbox"]').forEach((checkbox, setIndex) => {
                if (checkbox.checked) {
                    completedSets.push(setIndex + 1);
                    setsForThisExerciseCompleted++;
                }
            });

            // Check if all sets for this exercise were completed
            const totalSets = parseInt(exerciseDiv.querySelector('p').textContent.split(' ')[0], 10); // Extract total sets
            if (setsForThisExerciseCompleted < totalSets) {
                allSetsCompleted = false; // Mark if any exercise has incomplete sets
            }

            completedExercises.push({
                exerciseId: exerciseId,
                exerciseName: exerciseName,
                completedSets: completedSets,
                totalSets: totalSets // Store total sets for reference
            });
        });

        if (!allSetsCompleted) {
            workoutSessionMessage.textContent = 'Warning: Not all sets were completed. You can still finish the workout, or complete remaining sets.';
            workoutSessionMessage.className = 'text-center text-orange-500 text-sm mt-2';
            // You might want to add a confirmation dialog here for incomplete workouts
        } else {
            workoutSessionMessage.textContent = ''; // Clear any previous warning
        }

        try {
            const sessionData = {
                date: today,
                workoutId: workout.id,
                workoutName: workout.name,
                exercisesPerformed: completedExercises,
                completed: allSetsCompleted, // Indicates if all sets across all exercises were completed
                timestamp: new Date().toISOString() // Useful for sorting/unique identification
            };
            await saveDailyData(WORKOUT_SESSIONS_STORE_NAME, sessionData);
            workoutSessionMessage.textContent = 'Workout session saved successfully!';
            workoutSessionMessage.className = 'text-center text-green-500 text-sm mt-2';

            // After a short delay, redirect back to the workouts list
            setTimeout(async () => {
                hideAllWorkoutSubSections();
                await displayWorkouts();
            }, 1500); // Wait 1.5 seconds to show success message
        } catch (error) {
            console.error('Error saving workout session:', error);
            workoutSessionMessage.textContent = 'Failed to save workout session. Please try again.';
            workoutSessionMessage.className = 'text-center text-red-500 text-sm mt-2';
        }
    });

    // Event listener for the "Cancel Workout" button
    cancelWorkoutSessionBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to cancel this workout session? Any progress will be lost.')) {
            hideAllWorkoutSubSections();
            await displayWorkouts(); // Go back to workout list without saving
        }
    });
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

// --- Workout Plans Functions (New) ---

/**
 * Renders the initial view for Workout Plans.
 * @param {HTMLElement} viewElement - The main container for the workout plans view from main.js.
 */
export async function renderWorkoutPlansView(viewElement) {
    workoutPlansViewElement = viewElement; // Assign the main workout plans view element

    workoutPlansViewElement.innerHTML = `
        <h1 class="text-3xl font-bold text-center text-indigo-700 mb-6">Workout Plans</h1>
        <div class="space-y-4">
            <button id="showAddWorkoutPlanFormBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105">
                Create New Plan
            </button>
            <button id="showWorkoutPlansListBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105">
                View All Plans
            </button>
        </div>
        <div id="workoutPlansSubSection" class="mt-8">
            <!-- Sub-sections (add plan form, plan list) will be rendered here -->
        </div>
    `;

    // Assign the sub-section container after it's rendered
    workoutPlansSubSectionElement = workoutPlansViewElement.querySelector('#workoutPlansSubSection');

    // Add event listeners to the workout plan navigation buttons
    document.getElementById('showAddWorkoutPlanFormBtn').addEventListener('click', () => {
        hideAllWorkoutSubSections(); // Hide other workout sub-sections
        renderAddWorkoutPlanForm();
    });

    document.getElementById('showWorkoutPlansListBtn').addEventListener('click', async () => {
        hideAllWorkoutSubSections(); // Hide other workout sub-sections
        await displayWorkoutPlans();
    });
}

/**
 * Renders the form for creating a new workout plan.
 */
async function renderAddWorkoutPlanForm() {
    if (!workoutPlansSubSectionElement) return;

    // Fetch all available workouts to populate the dropdowns
    const workouts = await getAllDailyData(WORKOUTS_STORE_NAME);

    // Helper function to create a single workout-day input row
    function createWorkoutDayRow(workoutId = '', dayOfWeek = '') {
        const uniqueId = `workout-day-row-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return `
            <div id="${uniqueId}" class="flex flex-col sm:flex-row items-center gap-2 p-3 bg-white rounded-lg shadow-sm relative mb-2">
                <div class="flex-1 w-full sm:w-auto">
                    <label for="selectWorkout-${uniqueId}" class="block text-gray-700 text-xs font-semibold mb-1">Workout:</label>
                    <select id="selectWorkout-${uniqueId}"
                            class="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200 ease-in-out">
                        <option value="">-- Select Workout --</option>
                        ${workouts.map(workout => `<option value="${workout.id}" ${workout.id === workoutId ? 'selected' : ''}>${workout.name} (${workout.category})</option>`).join('')}
                    </select>
                </div>
                <div class="flex-1 w-full sm:w-auto mt-2 sm:mt-0">
                    <label for="selectDay-${uniqueId}" class="block text-gray-700 text-xs font-semibold mb-1">Day:</label>
                    <select id="selectDay-${uniqueId}"
                            class="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200 ease-in-out">
                        ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => `<option value="${day}" ${day === dayOfWeek ? 'selected' : ''}>${day}</option>`).join('')}
                    </select>
                </div>
                <button type="button" data-row-id="${uniqueId}" class="remove-workout-day-btn text-red-500 hover:text-red-700 mt-2 sm:mt-0 sm:ml-2">
                    <i class="fa-solid fa-times-circle text-xl"></i>
                </button>
            </div>
        `;
    }

    workoutPlansSubSectionElement.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Create New Workout Plan</h2>
        <div class="mb-4">
            <label for="planNameInput" class="block text-gray-700 text-sm font-semibold mb-2">Plan Name (e.g., Body Blast 6 Week):</label>
            <input type="text" id="planNameInput" placeholder="e.g., Body Blast 6 Week"
                   class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
        </div>
        <div class="mb-4">
            <label for="planStartDate" class="block text-gray-700 text-sm font-semibold mb-2">Start Date:</label>
            <input type="date" id="planStartDate"
                   class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
        </div>
        <div class="mb-6">
            <label for="planDurationWeeks" class="block text-gray-700 text-sm font-semibold mb-2">Duration (Weeks):</label>
            <input type="number" id="planDurationWeeks" value="6" min="1"
                   class="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out">
        </div>

        <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">Scheduled Workouts:</h3>
        <div id="scheduledWorkoutsContainer" class="space-y-3 p-2 border rounded-lg bg-gray-50">
            ${workouts.length === 0 ? '<p class="text-center text-gray-500">No workouts available. Create some in the "Workouts" tab first.</p>' : ''}
            <!-- Initial workout day row will be added here by JS -->
        </div>
        <button type="button" id="addWorkoutDayBtn"
                class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-4">
            Add Another Workout Day
        </button>

        <button id="saveWorkoutPlanBtn"
                class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-8">
            Save Workout Plan
        </button>
        <p id="workoutPlanFormMessage" class="text-center text-sm mt-2"></p>
    `;

    const planNameInput = document.getElementById('planNameInput');
    const planStartDate = document.getElementById('planStartDate');
    const planDurationWeeks = document.getElementById('planDurationWeeks');
    const scheduledWorkoutsContainer = document.getElementById('scheduledWorkoutsContainer');
    const addWorkoutDayBtn = document.getElementById('addWorkoutDayBtn');
    const saveWorkoutPlanBtn = document.getElementById('saveWorkoutPlanBtn');
    const workoutPlanFormMessage = document.getElementById('workoutPlanFormMessage');

    // Set today's date as default for start date
    planStartDate.value = formatDate(new Date());

    // Add initial workout day row if workouts are available
    if (workouts.length > 0) {
        scheduledWorkoutsContainer.insertAdjacentHTML('beforeend', createWorkoutDayRow());
    }

    // Event listener for adding more workout day rows
    addWorkoutDayBtn.addEventListener('click', () => {
        scheduledWorkoutsContainer.insertAdjacentHTML('beforeend', createWorkoutDayRow());
        // Re-attach listeners for new remove buttons
        attachRemoveButtonListeners();
    });

    // Function to attach event listeners to remove buttons
    function attachRemoveButtonListeners() {
        scheduledWorkoutsContainer.querySelectorAll('.remove-workout-day-btn').forEach(button => {
            button.onclick = null; // Remove previous listeners to prevent duplicates
            button.addEventListener('click', (e) => {
                const rowId = e.currentTarget.dataset.rowId;
                document.getElementById(rowId).remove();
            });
        });
    }
    attachRemoveButtonListeners(); // Attach for initial row

    saveWorkoutPlanBtn.addEventListener('click', async () => {
        const name = planNameInput.value.trim();
        const startDate = planStartDate.value;
        const durationWeeks = parseInt(planDurationWeeks.value, 10);

        const scheduledWorkouts = [];
        let isValid = true;

        scheduledWorkoutsContainer.querySelectorAll('.flex-col.sm\\:flex-row').forEach(row => {
            const workoutSelect = row.querySelector('select[id^="selectWorkout-"]');
            const daySelect = row.querySelector('select[id^="selectDay-"]');

            const workoutId = parseInt(workoutSelect.value, 10);
            const dayOfWeek = daySelect.value;

            if (isNaN(workoutId) || !dayOfWeek) {
                isValid = false;
                workoutPlanFormMessage.textContent = 'Please select a workout and a day for all scheduled entries.';
                workoutPlanFormMessage.className = 'text-center text-red-500 text-sm mt-2';
                return; // Exit forEach early
            }

            const selectedWorkout = workouts.find(w => w.id === workoutId);
            if (!selectedWorkout) {
                isValid = false;
                workoutPlanFormMessage.textContent = 'One or more selected workouts not found.';
                workoutPlanFormMessage.className = 'text-center text-red-500 text-sm mt-2';
                return; // Exit forEach early
            }

            scheduledWorkouts.push({
                workoutId: workoutId,
                workoutName: selectedWorkout.name,
                dayOfWeek: dayOfWeek
            });
        });

        if (!isValid) return; // Stop if any validation failed during row iteration

        if (!name || !startDate || isNaN(durationWeeks) || durationWeeks <= 0) {
            workoutPlanFormMessage.textContent = 'Please fill in all plan details correctly (name, start date, duration).';
            workoutPlanFormMessage.className = 'text-center text-red-500 text-sm mt-2';
            return;
        }

        if (scheduledWorkouts.length === 0) {
            workoutPlanFormMessage.textContent = 'Please add at least one workout to the plan.';
            workoutPlanFormMessage.className = 'text-center text-red-500 text-sm mt-2';
            return;
        }

        try {
            const newPlan = {
                name: name,
                startDate: startDate,
                durationWeeks: durationWeeks,
                scheduledWorkouts: scheduledWorkouts // Array of { dayOfWeek, workoutId, workoutName }
            };
            await saveDailyData(WORKOUT_PLANS_STORE_NAME, newPlan);
            workoutPlanFormMessage.textContent = 'Workout plan saved successfully!';
            workoutPlanFormMessage.className = 'text-center text-green-500 text-sm mt-2';

            // Clear form (reset to initial state)
            planNameInput.value = '';
            planStartDate.value = formatDate(new Date());
            planDurationWeeks.value = '6';
            scheduledWorkoutsContainer.innerHTML = ''; // Clear all dynamic rows
            if (workouts.length > 0) {
                scheduledWorkoutsContainer.insertAdjacentHTML('beforeend', createWorkoutDayRow()); // Add back one empty row
                attachRemoveButtonListeners(); // Re-attach listeners
            }


            // Redirect back to workout plans list after successful save
            setTimeout(async () => {
                await displayWorkoutPlans();
            }, 1500);
        } catch (error) {
            console.error('Error saving workout plan:', error);
            workoutPlanFormMessage.textContent = 'Failed to save workout plan. Please try again.';
            workoutPlanFormMessage.className = 'text-center text-red-500 text-sm mt-2';
        }
    });
}

/**
 * Displays the list of workout plans.
 */
async function displayWorkoutPlans() {
    if (!workoutPlansSubSectionElement) return;

    workoutPlansSubSectionElement.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Your Workout Plans</h2>
        <ul id="currentWorkoutPlansList" class="space-y-3"></ul>
        <button id="addWorkoutPlanFromListBtn" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105 mt-4">Create New Plan</button>
    `;

    const currentWorkoutPlansList = document.getElementById('currentWorkoutPlansList');
    const addWorkoutPlanFromListBtn = document.getElementById('addWorkoutPlanFromListBtn');

    addWorkoutPlanFromListBtn.addEventListener('click', () => {
        hideAllWorkoutSubSections();
        renderAddWorkoutPlanForm();
    });

    try {
        const plans = await getAllDailyData(WORKOUT_PLANS_STORE_NAME);
        if (plans.length === 0) {
            currentWorkoutPlansList.innerHTML = '<li class="p-3 rounded-lg text-center text-gray-500 bg-gray-50">No workout plans created yet. Click "Create New Plan" above.</li>';
        } else {
            plans.forEach(plan => {
                const listItem = document.createElement('li');
                listItem.className = 'p-3 rounded-lg flex flex-col bg-gray-100'; // Changed to flex-col for stacked content
                listItem.innerHTML = `
                    <div class="flex justify-between items-center w-full mb-2">
                        <span class="font-bold text-lg text-gray-800">${plan.name}</span>
                        <div class="flex items-center space-x-2">
                             <button data-id="${plan.id}" class="view-plan-btn bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded-md transition duration-200">View Details</button>
                            <button data-id="${plan.id}" class="delete-plan-btn text-red-500 hover:text-red-700 text-lg"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">Starts: ${plan.startDate} | Duration: ${plan.durationWeeks} weeks</p>
                    <div class="w-full">
                        <h4 class="font-semibold text-gray-700 mb-1">Scheduled Workouts:</h4>
                        <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                            ${plan.scheduledWorkouts.map(sw => `
                                <li><strong>${sw.dayOfWeek}:</strong> ${sw.workoutName}</li>
                            `).join('')}
                        </ul>
                    </div>
                `;
                currentWorkoutPlansList.appendChild(listItem);
            });

            document.querySelectorAll('.delete-plan-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const planId = parseInt(e.currentTarget.dataset.id, 10);
                    if (confirm('Are you sure you want to delete this workout plan?')) {
                        await deleteItemById(WORKOUT_PLANS_STORE_NAME, planId);
                        await displayWorkoutPlans(); // Refresh list after deletion
                    }
                });
            });

            // Add listener for the new View Details button (placeholder for now)
            document.querySelectorAll('.view-plan-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const planId = parseInt(e.currentTarget.dataset.id, 10);
                    // For now, this just logs. In a future step, this will render an edit form.
                    console.log('View/Edit Plan details for ID:', planId);
                    // hideAllWorkoutSubSections();
                    // await renderEditWorkoutPlanForm(planId); // Future function
                });
            });
        }
    } catch (error) {
        console.error('Error displaying workout plans:', error);
        currentWorkoutPlansList.innerHTML = '<li class="text-center text-red-500">Error loading workout plans.</li>';
    }
}

/**
 * Displays the next scheduled workout on the dashboard.
 * This function is exported to be called from main.js.
 */
export async function displayNextScheduledWorkout() {
    const nextWorkoutDetailsElement = document.getElementById('nextWorkoutDetails');
    if (!nextWorkoutDetailsElement) {
        console.error('Next workout details element not found on dashboard.');
        return;
    }

    nextWorkoutDetailsElement.textContent = 'Checking plans...'; // Initial loading state

    try {
        const plans = await getAllDailyData(WORKOUT_PLANS_STORE_NAME);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = daysOfWeek[today.getDay()];

        let nextWorkout = null;
        let nextWorkoutDay = null; // Stores the actual date of the next workout
        let minDaysUntilNextWorkout = Infinity;

        plans.forEach(plan => {
            const planStartDate = new Date(plan.startDate);
            planStartDate.setHours(0, 0, 0, 0);
            const planEndDate = new Date(planStartDate);
            planEndDate.setDate(planStartDate.getDate() + (plan.durationWeeks * 7));
            planEndDate.setHours(0, 0, 0, 0);

            // Check if the plan is currently active or starts in the future
            if (today <= planEndDate) {
                plan.scheduledWorkouts.forEach(scheduledWorkout => {
                    const scheduledDayIndex = daysOfWeek.indexOf(scheduledWorkout.dayOfWeek);
                    const currentDayIndex = today.getDay();

                    let daysUntil = scheduledDayIndex - currentDayIndex;
                    if (daysUntil < 0) {
                        daysUntil += 7; // Wrap around to next week
                    }

                    // Calculate the exact date for this potential next workout
                    const potentialWorkoutDate = new Date(today);
                    potentialWorkoutDate.setDate(today.getDate() + daysUntil);
                    potentialWorkoutDate.setHours(0, 0, 0, 0);

                    // Ensure the potential workout date is within the plan's active period
                    if (potentialWorkoutDate >= planStartDate && potentialWorkoutDate <= planEndDate) {
                        // If it's today's workout, prioritize it
                        if (daysUntil === 0) {
                            nextWorkout = scheduledWorkout;
                            nextWorkoutDay = potentialWorkoutDate;
                            minDaysUntilNextWorkout = 0;
                            return; // Found today's workout, no need to check further for this plan
                        }

                        // If it's an upcoming workout and closer than previous ones
                        if (daysUntil < minDaysUntilNextWorkout) {
                            nextWorkout = scheduledWorkout;
                            nextWorkoutDay = potentialWorkoutDate;
                            minDaysUntilNextWorkout = daysUntil;
                        }
                    }
                });
            }
        });

        if (nextWorkout) {
            let displayDay = '';
            if (minDaysUntilNextWorkout === 0) {
                displayDay = 'Today';
            } else if (minDaysUntilNextWorkout === 1) {
                displayDay = 'Tomorrow';
            } else {
                displayDay = nextWorkout.dayOfWeek;
            }
            nextWorkoutDetailsElement.textContent = `${nextWorkout.workoutName} (${displayDay})`;
        } else {
            nextWorkoutDetailsElement.textContent = 'No upcoming workouts scheduled.';
        }

    } catch (error) {
        console.error('Error displaying next scheduled workout:', error);
        nextWorkoutDetailsElement.textContent = 'Error loading workout schedule.';
    }
}
