window.onload = () => {
	const STORAGE_KEYS = {
		NAMES: "teams-name",
		TEAMCOUNT: "teams-teamcount",
		MODE: "teams-mode",
	};

	const StorageManager = {
		/**
		 * Retrieves a value from localStorage associated with the given key.
		 * @param {string} key The key to retrieve.
		 * @returns {string | null} The stored value, or null if not found.
		 */
		get: (key) => {
			return localStorage.getItem(key) || null;
		},
		/**
		 * Stores a key-value pair in localStorage.
		 * @param {string} key The key to set.
		 * @param {string} value The value to store.
		 * @returns {void}
		 */
		set: (key, value) => {
			localStorage.setItem(key, value);
		},
		/**
		 * Removes an item from localStorage associated with the given key.
		 * @param {string} key The key to clear.
		 * @returns {void}
		 */
		clear: (key) => {
			localStorage.removeItem(key);
		},
	};

	//
	//

	/** @type {HTMLInputElement} */
	const NAMES_INPUT = document.getElementById("names-input");

	/** @type {HTMLButtonElement} */
	const CLEAR_BUTTON = document.getElementById("clear-names-btn");

	/** @type {HTMLButtonElement} */
	const GEN_BUTTON = document.getElementById("gen-btn");

	/** @type {HTMLInputElement} */
	const TEAMCOUNT_INPUT = document.getElementById("teamCount");

	/** @type {HTMLCheckboxElement} */
	const MODE_INPUT = document.getElementById("asOrder");

	if (TEAMCOUNT_INPUT) {
		TEAMCOUNT_INPUT.value = StorageManager.get(STORAGE_KEYS.TEAMCOUNT) || 2;
	}
	if (MODE_INPUT) {
		MODE_INPUT.checked = StorageManager.get(STORAGE_KEYS.MODE) === "true";
	}

	if (MODE_INPUT.checked == true) {
		// Mode is checked, so in "order mode"
		GEN_BUTTON.innerText = "Generate Order";
	} else {
		GEN_BUTTON.innerText = "Generate Teams";
	}

	// Saving & Loading Names
	/**
	 * Saves an array of names to localStorage, filtering out empty names.
	 * If the array is null or empty, the saved names are cleared.
	 * @param {string[] | null} toSave An array of names to save, or null to clear.
	 * @returns {void}
	 */
	function SaveNames(toSave) {
		if (toSave === null || toSave.length === 0) {
			StorageManager.clear(STORAGE_KEYS.NAMES);
		} else {
			toSave = toSave.filter((name) => name.trim().length > 0).join("|~|");
			StorageManager.set(STORAGE_KEYS.NAMES, toSave);
			if (toSave.length > 0) {
				CLEAR_BUTTON.classList.add("show");
			}
		}
	}
	/**
	 * Loads saved names from localStorage and formats them as a newline-separated string.
	 * @returns {string | null} The loaded names as a string, or null if no names are saved.
	 */
	function LoadNames() {
		const saved = StorageManager.get(STORAGE_KEYS.NAMES);
		if (saved === null) {
			return null;
		} else {
			return saved.split("|~|").join("\n");
		}
	}
	(() => {
		const initialNames = LoadNames();
		if (initialNames !== null) {
			NAMES_INPUT.value = initialNames;
			CLEAR_BUTTON.classList.add("show");
		}

		NAMES_INPUT.value.trim().split("\n");

		CLEAR_BUTTON.addEventListener("click", function (e) {
			e.preventDefault();
			NAMES_INPUT.value = "";
			SaveNames(null);
			if (Generator != undefined) {
				Generator.target.innerHTML = "";
			}
			CLEAR_BUTTON.classList.remove("show");
		});
	})();
	// Saving & Loading Names

	// Team Generation
	class TeamGenerator {
		/**
		 * Creates an instance of TeamGenerator.
		 */
		constructor() {
			/** @type {string[]} */
			this.names = [];
			/** @type {number} */
			this.teamCount = 2;
			/** @type {boolean} */
			this.asRandomOrder = false;

			/** @type {boolean} */
			this.hasEvenTeams = false;

			/** @type {HTMLElement | null} */
			this.target = null;
		}

		/**
		 * Generates and displays teams or a random order based on input.
		 * Also saves the current settings to localStorage.
		 * @param {string[]} names An array of names to be distributed or ordered.
		 * @param {number} teamCount The number of teams to generate.
		 * @param {boolean} asRandomOrder If true, generates a random order; otherwise, generates teams.
		 * @returns {Promise<void>} A Promise that resolves when generation and rendering are complete.
		 */
		async Generate(names, teamCount, asRandomOrder) {
			this.names = names;
			this.teamCount = teamCount;
			this.asRandomOrder = asRandomOrder;

			// Save all settings
			SaveNames(names);
			StorageManager.set(STORAGE_KEYS.TEAMCOUNT, teamCount);
			StorageManager.set(STORAGE_KEYS.MODE, asRandomOrder);

			if (this.names.length <= 0) {
				alert("Please enter at least one (1) name first.");
				return;
			}

			// Clear out the result target
			if (!this.target) {
				this.target = document.getElementById("results");
			}

			// Clear the output
			this._clearTarget();

			// Shuffle players
			this._shuffle();

			// Generate and display.
			if (this.asRandomOrder) {
				this.hasEvenTeams = true; // Not really, but :shrug:

				// Set this for the "next load"
				GEN_BUTTON.innerText = "Generate Order";

				this._renderAsOrder();
			} else {
				this.hasEvenTeams = this.names.length % this.teamCount === 0;

				GEN_BUTTON.innerText = "Generate Teams";

				this._renderAsTeams();
			}
		}

		/**
		 * Clears the "output" container
		 */
		_clearTarget() {
			while (this.target.firstChild) {
				this.target.removeChild(this.target.firstChild);
			}
			this.target.classList.remove("asOrder");
		}

		/**
		 * Shuffles the teams, does not split the order
		 */
		_shuffle() {
			for (let i = this.names.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[this.names[i], this.names[j]] = [this.names[j], this.names[i]];
			}
		}
		//

		/**
		 * Splits the already-shuffles Names into teams,
		 * and renders to the output container
		 */
		_renderAsTeams() {
			// Split into teams, first
			/** @type {string[][]} */
			const teams = new Array(this.teamCount);
			const namesCopy = [].concat(this.names);

			let teamIdx = 0;
			while (namesCopy.length > 0) {
				if (teams[teamIdx] === undefined) {
					teams[teamIdx] = [];
				}
				teams[teamIdx++].push(namesCopy.pop());
				if (teamIdx === this.teamCount) {
					teamIdx = 0;
				}
			}

			if (this.hasEvenTeams == false) {
				this.target.appendChild(this._buildPlayerCounts(teams));
			}

			teams.forEach((players, idx) => {
				this.target.appendChild(this._buildTeamCard(`Team ${idx + 1}`, players));
			});
		}

		/**
		 * Renders the already-shuffles Names in a "list",
		 * and renders to the output container
		 */
		_renderAsOrder() {
			// No need to split into teams
			this.target.classList.add("asOrder");
			this.target.appendChild(this._buildTeamCard(`1. ${this.names[0]}`, this.names, 1));
		}
		//

		/**
		 * Renders the "players per team" message.
		 *
		 * @param {string[][]} teams An array of arrays, where each inner array is a team.
		 * @returns {HTMLElement} A bold HTML element displaying team sizes.
		 */
		_buildPlayerCounts(teams) {
			var res = document.createElement("b");
			res.id = "player-count";
			res.innerText = `Team Sizes: ${teams.map((t) => t.length).join(" / ")}`;

			return res;
		}

		/**
		 * Builds an article element representing a team card or order list.
		 * @param {string} teamName The title of the card (e.g., "Team 1" or the first name in order mode).
		 * @param {string[]} players An array of names to display in the card.
		 * @param {number} [playerIdxOffset=0] The starting index offset for numbering the players.
		 * @returns {HTMLElement} An article HTML element containing the team/order information.
		 */
		_buildTeamCard(teamName, players, playerIdxOffset = 0) {
			var res = document.createElement("article");
			res.classList.add("team");
			res.innerHTML += `<h3>${teamName}</h3><hr/>`;

			var list = document.createElement("div");
			list.classList.add("col", "half");

			for (let n = playerIdxOffset; n < players.length; n++) {
				list.innerHTML += `<b>${n + 1}. ${players[n]}</b>`;
			}

			res.appendChild(list);
			return res;
		}
	}

	const Generator = new TeamGenerator();
	(() => {
		function GenerateTeams(e) {
			e.preventDefault();

			const names = NAMES_INPUT.value.split("\n").filter((name) => name.trim().length > 0);

			Generator.Generate(names, parseInt(TEAMCOUNT_INPUT.value), MODE_INPUT.checked);
		}

		document.getElementById("form").addEventListener("submit", GenerateTeams);
	})();
	// Team Generation
};
