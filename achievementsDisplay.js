// achievementsDisplay.js
import { saveDailyData, getAllDailyData, ACHIEVEMENTS_STORE_NAME, STEPS_STORE_NAME, WATER_STORE_NAME, CALORIES_STORE_NAME, WORKOUT_SESSIONS_STORE_NAME } from './db.js';
import { STEP_GOAL, WATER_GOAL, CALORIE_GOAL } from './constants.js'; // Import goals from constants.js
import { formatDate } from './utils.js';

// DOM element for achievements view
let achievementsViewElement;
let achievementsSubSectionElement;

// Define your achievement badges and their criteria
const ACHIEVEMENTS = [
    {
        id: 'first-steps',
        name: 'First Steps',
        description: `Log your first ${STEP_GOAL} steps!`,
        criteria: { type: 'steps', value: STEP_GOAL },
        icon: '👟',
        check: async () => {
            const today = formatDate(new Date());
            const dailySteps = await getAllDailyData(STEPS_STORE_NAME);
            const totalStepsToday = dailySteps.filter(d => d.date === today).reduce((sum, entry) => sum + entry.value, 0);
            return totalStepsToday >= STEP_GOAL;
        }
    },
    {
        id: 'water-drinker',
        name: 'Hydration Hero',
        description: `Drink ${WATER_GOAL}ml of water in a day!`,
        criteria: { type: 'water', value: WATER_GOAL },
        icon: '💧',
        check: async () => {
            const today = formatDate(new Date());
            const dailyWater = await getAllDailyData(WATER_STORE_NAME);
            const totalWaterToday = dailyWater.filter(d => d.date === today).reduce((sum, entry) => sum + entry.value, 0);
            return totalWaterToday >= WATER_GOAL;
        }
    },
    {
        id: 'calorie-tracker',
        name: 'Calorie King/Queen',
        description: `Log ${CALORIE_GOAL}kcal in a day!`,
        criteria: { type: 'calories', value: CALORIE_GOAL },
        icon: '🍎',
        check: async () => {
            const today = formatDate(new Date());
            const dailyCalories = await getAllDailyData(CALORIES_STORE_NAME);
            const totalCaloriesToday = dailyCalories.filter(d => d.date === today).reduce((sum, entry) => sum + entry.value, 0);
            return totalCaloriesToday >= CALORIE_GOAL;
        }
    },
    {
        id: 'first-workout',
        name: 'Workout Warrior',
        description: 'Complete your first workout session!',
        criteria: { type: 'workout_session', value: 1 },
        icon: '💪',
        check: async () => {
            const workoutSessions = await getAllDailyData(WORKOUT_SESSIONS_STORE_NAME);
            return workoutSessions.length > 0;
        }
    },
    {
        id: 'seven-day-streak-steps',
        name: '7-Day Step Streak',
        description: `Achieve ${STEP_GOAL} steps for 7 consecutive days!`,
        criteria: { type: 'steps_streak', value: 7 },
        icon: '🔥',
        check: async () => {
            const dailySteps = await getAllDailyData(STEPS_STORE_NAME);
            const sortedSteps = dailySteps.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Aggregate steps by date
            const stepsByDate = sortedSteps.reduce((acc, entry) => {
                acc[entry.date] = (acc[entry.date] || 0) + entry.value;
                return acc;
            }, {});

            let streak = 0;
            let lastDate = null;

            // Iterate backwards from today to find consecutive days meeting the goal
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date();
                checkDate.setDate(checkDate.getDate() - i);
                const formattedCheckDate = formatDate(checkDate);

                if (stepsByDate[formattedCheckDate] && stepsByDate[formattedCheckDate] >= STEP_GOAL) {
                    if (lastDate === null || (new Date(lastDate).getDate() - new Date(formattedCheckDate).getDate()) === 1) {
                        streak++;
                        lastDate = formattedCheckDate;
                    } else {
                        // Gap in streak
                        streak = 1; // Reset streak if there's a gap
                        lastDate = formattedCheckDate;
                    }
                } else {
                    // If today or any of the last 6 days don't meet the goal, no streak
                    return false;
                }
            }
            return streak >= 7;
        }
    }
];

/**
 * Renders the initial view for Achievements.
 * @param {HTMLElement} viewElement - The main container for the achievements view from main.js.
 */
export async function renderAchievementsView(viewElement) {
    achievementsViewElement = viewElement;

    achievementsViewElement.innerHTML = `
        <h1 class="text-3xl font-bold text-center text-indigo-700 mb-6">Achievements</h1>
        <div id="achievementsList" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Achievements will be rendered here -->
            <p class="text-center text-gray-500 col-span-full">Loading achievements...</p>
        </div>
    `;

    achievementsSubSectionElement = achievementsViewElement.querySelector('#achievementsList');
    await displayAchievements(); // Display achievements when the view is rendered
}

/**
 * Displays the list of awarded achievements.
 */
async function displayAchievements() {
    if (!achievementsSubSectionElement) return;

    try {
        const awardedAchievements = await getAllDailyData(ACHIEVEMENTS_STORE_NAME);
        achievementsSubSectionElement.innerHTML = ''; // Clear loading message

        if (awardedAchievements.length === 0) {
            achievementsSubSectionElement.innerHTML = '<p class="text-center text-gray-500 col-span-full">No achievements earned yet. Keep tracking!</p>';
        } else {
            ACHIEVEMENTS.forEach(achievementDef => {
                const isAwarded = awardedAchievements.some(a => a.id === achievementDef.id);
                const badgeElement = document.createElement('div');
                badgeElement.className = `p-4 rounded-lg shadow-md flex flex-col items-center text-center transition-all duration-300 ${isAwarded ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300 opacity-60'}`;

                badgeElement.innerHTML = `
                    <span class="text-5xl mb-2">${achievementDef.icon}</span>
                    <h3 class="font-bold text-lg text-gray-800">${achievementDef.name}</h3>
                    <p class="text-sm text-gray-600">${achievementDef.description}</p>
                    ${isAwarded ? '<span class="text-xs text-green-700 font-semibold mt-2">EARNED!</span>' : ''}
                `;
                achievementsSubSectionElement.appendChild(badgeElement);
            });
        }
    } catch (error) {
        console.error('Error displaying achievements:', error);
        achievementsSubSectionElement.innerHTML = '<p class="text-center text-red-500 col-span-full">Error loading achievements.</p>';
    }
}

/**
 * Checks all defined achievements and awards them if criteria are met.
 * This function should be called after any data is saved (steps, water, calories, workouts).
 */
export async function checkAndAwardAchievements() {
    const awardedAchievements = await getAllDailyData(ACHIEVEMENTS_STORE_NAME);
    let newAchievementAwarded = false;

    for (const achievementDef of ACHIEVEMENTS) {
        const alreadyAwarded = awardedAchievements.some(a => a.id === achievementDef.id);

        if (!alreadyAwarded) {
            try {
                const isMet = await achievementDef.check();
                if (isMet) {
                    await saveDailyData(ACHIEVEMENTS_STORE_NAME, {
                        id: achievementDef.id,
                        name: achievementDef.name,
                        dateAwarded: formatDate(new Date()),
                        timestamp: new Date().toISOString()
                    });
                    console.log(`Achievement Awarded: ${achievementDef.name}`);
                    newAchievementAwarded = true;
                }
            } catch (error) {
                console.error(`Error checking achievement "${achievementDef.name}":`, error);
            }
        }
    }

    // If new achievements were awarded and the achievements view is currently active, refresh it.
    // This is a simple check; a more robust solution might involve a global event.
    if (newAchievementAwarded && achievementsViewElement && !achievementsViewElement.classList.contains('hidden')) {
        await displayAchievements();
    }
}
