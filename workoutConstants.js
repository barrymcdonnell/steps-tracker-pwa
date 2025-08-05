// workoutConstants.js

// Define types of exercises
export const EXERCISE_TYPES = {
    STRENGTH: 'Strength',
    CARDIO: 'Cardio',
    BODYWEIGHT: 'Bodyweight',
    FLEXIBILITY: 'Flexibility',
    OTHER: 'Other'
};

// Define categories for workouts (e.g., Full Body, Upper, Lower)
export const WORKOUT_CATEGORIES = {
    FULL_BODY: 'Full Body',
    UPPER_BODY: 'Upper Body',
    LOWER_BODY: 'Lower Body',
    CARDIO: 'Cardio Session',
    CUSTOM: 'Custom'
};

// Default sets/reps/duration for new exercises (can be overridden)
export const DEFAULT_EXERCISE_SETTINGS = {
    SETS: 3,
    REPS: 10,
    DURATION_MINUTES: 30
};
