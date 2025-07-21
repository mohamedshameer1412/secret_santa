module.exports = {
    generateClue: function(dare) {
        const clues = [
            "Look where you keep your shoes.",
            "Check under the couch cushions.",
            "The answer is in the kitchen.",
            "Find something that starts with the letter 'B'.",
            "Look for a hidden note in your favorite book."
        ];
        const randomIndex = Math.floor(Math.random() * clues.length);
        return `Clue for ${dare}: ${clues[randomIndex]}`;
    },

    validateClue: function(clue) {
        const validClues = [
            "Look where you keep your shoes.",
            "Check under the couch cushions.",
            "The answer is in the kitchen.",
            "Find something that starts with the letter 'B'.",
            "Look for a hidden note in your favorite book."
        ];
        return validClues.includes(clue);
    }
};