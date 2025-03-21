export class CrewMember {
    constructor() {
        this.races = {
            "Human": { "names": ["Alex Carter", "Mei Tanaka", "Javier Castillo", "Aisha Patel"], "description": "Versatile and adaptive, humans are known for their resilience and ability to excel in various disciplines." },
            "Skaari": { "names": ["Tekkari", "S'kaal", "Rythrek", "Vaaresh"], "description": "An avian species with keen eyesight and exceptional navigational instincts, the Skaari are proud and disciplined." },
            "Gorvath": { "names": ["Durnak", "Thorrun", "Kralth", "Umbrak"], "description": "Massive, rock-based beings with slow but deliberate movements, Gorvath are known for their patience and endurance." },
            "Rylthian": { "names": ["Eilois", "Naith", "Ouvren", "Yzrii"], "description": "Jellyfish-like creatures composed of bioelectric energy, Rylthians communicate through pulses of light and are highly analytical." },
            "Kha'Torii": { "names": ["Ch'taxx", "Vith'kaar", "Xyrrik", "J’zekk"], "description": "Insectoid warriors with a strong sense of loyalty, the Kha'Torii are fast, aggressive, and fiercely independent." },
            "Vorr'Xal": { "names": ["Sylthos", "Vessren", "Tho’mal", "Xiraal"], "description": "Plant-based beings with deep connections to their environments, Vorr'Xal value patience and long-term planning." },
            "Drell'Ka": { "names": ["Ssarkesh", "Vyorran", "Tzakis", "Ozzeth"], "description": "Reptilian hunters with a strong warrior culture, Drell'Ka are resilient, tactical, and deeply spiritual." },
            "Ulzeri": { "names": ["Ithli", "Quoro", "Zheln", "Pa’ati"], "description": "Amphibious beings known for their adaptability and lateral problem-solving skills, often thriving in aquatic environments." },
            "Brakari": { "names": ["Unit-7", "Ryn", "K-4S", "Theta", "Voxis"], "description": "Once purely synthetic, the Brakari have evolved into bio-mechanical beings with logical yet emerging emotional depth." }
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
        this.name = this.getRandomElement(this.races[this.race]["names"]);
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

}