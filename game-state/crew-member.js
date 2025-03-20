export class CrewMember {
    constructor() {
        this.races = {
            "Human": ["Alex Carter", "Mei Tanaka", "Javier Castillo", "Aisha Patel"],
            "Skaari": ["Tekkari", "S'kaal", "Rythrek", "Vaaresh"],
            "Gorvath": ["Durnak", "Thorrun", "Kralth", "Umbrak"],
            "Rylthian": ["Eilois", "Naith", "Ouvren", "Yzrii"],
            "Kha'Torii": ["Ch'taxx", "Vith'kaar", "Xyrrik", "J’zekk"],
            "Vorr'Xal": ["Sylthos", "Vessren", "Tho’mal", "Xiraal"],
            "Drell'Ka": ["Ssarkesh", "Vyorran", "Tzakis", "Ozzeth"],
            "Ulzeri": ["Ithli", "Quoro", "Zheln", "Pa’ati"],
            "Brakari": ["Unit-7", "Ryn", "K-4S", "Theta", "Voxis"]
        };

        this.skills = [
            "Scientific Analysis",
            "Engineering & Mechanics",
            "Piloting & Navigation",
            "Survival & Combat",
            "Diplomacy & Communication"
        ];

        this.demeanorTraits = {
            "Stoic": 0.3, "Curious": 0.2, "Reckless": 0.1, "Cautious": 0.2, "Aloof": 0.15,
            "Friendly": 0.25, "Blunt": 0.15, "Patient": 0.2, "Aggressive": 0.1, "Methodical": 0.2
        };

        this.raceDemeanorProbabilities = {
            "Human": { "Curious": 0.3, "Friendly": 0.3, "Blunt": 0.1, "Patient": 0.15, "Cautious": 0.15 },
            "Skaari": { "Stoic": 0.4, "Reckless": 0.2, "Blunt": 0.2, "Methodical": 0.2 },
            "Gorvath": { "Stoic": 0.5, "Patient": 0.3, "Aloof": 0.2 },
            "Rylthian": { "Curious": 0.4, "Friendly": 0.3, "Cautious": 0.3 },
            "Kha'Torii": { "Aggressive": 0.4, "Reckless": 0.3, "Blunt": 0.2, "Stoic": 0.1 },
            "Vorr'Xal": { "Methodical": 0.4, "Patient": 0.3, "Aloof": 0.3 },
            "Drell'Ka": { "Stoic": 0.3, "Aggressive": 0.3, "Blunt": 0.2, "Cautious": 0.2 },
            "Ulzeri": { "Curious": 0.4, "Friendly": 0.3, "Patient": 0.3 },
            "Brakari": { "Methodical": 0.4, "Aloof": 0.3, "Blunt": 0.3 }
        };

        this.race = this.getRandomKey(this.races);
        this.name = this.getRandomElement(this.races[this.race]);
        this.skillLevels = this.generateSkillLevels();
        this.demeanor = this.generateDemeanor();
    }

    getRandomKey(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    weightedRandom(probabilities) {
        let total = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
        let random = Math.random() * total;
        let sum = 0;
        for (let key in probabilities) {
            sum += probabilities[key];
            if (random <= sum) return key;
        }
    }

    generateSkillLevels() {
        let skillLevels = {};
        this.skills.forEach(skill => {
            skillLevels[skill] = Math.floor(Math.random() * 6); // Random score between 0-5
        });
        return skillLevels;
    }

    generateDemeanor() {
        let demeanorSet = new Set();
        while (demeanorSet.size < 2) {
            demeanorSet.add(this.weightedRandom(this.raceDemeanorProbabilities[this.race]));
        }
        return Array.from(demeanorSet);
    }

    displayInfo() {
        console.log(`Crew Member: ${this.name} (${this.race})`);
        console.log("Skills:");
        for (let skill in this.skillLevels) {
            console.log(`  ${skill}: ${this.skillLevels[skill]}/5`);
        }
        console.log("Demeanor Traits: " + this.demeanor.join(", "));
    }
}

// Example usage:
const crewMember = new CrewMember();
crewMember.displayInfo();
