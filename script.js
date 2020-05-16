window.onload = () => {
	const STORAGE_KEYS = {
		NAMES: "teams-name",
		THEME: "teams-theme_dark",
		TEAMCOUNT: "teams-teamcount",
		MODE: "teams-mode",
	};

	const StorageManager = {
		get: (key) => {
			return localStorage.getItem(key) || null;
		},
		set: (key, value) => {
			localStorage.setItem(key, value);
		},
		clear: (key) => {
			localStorage.removeItem(key);
		},
	};

	//
	//

	const NAMES_INPUT = document.getElementById("names-input");
	const CLEAR_BUTTON = document.getElementById("clear-names-btn");

	const TEAMCOUNT_INPUT = document.getElementById("teamCount");
	const MODE_INPUT = document.getElementById("asOrder");
	if (TEAMCOUNT_INPUT) {
		TEAMCOUNT_INPUT.value = StorageManager.get(STORAGE_KEYS.TEAMCOUNT) || 2;
	}
	if (MODE_INPUT) {
		MODE_INPUT.checked = StorageManager.get(STORAGE_KEYS.MODE) === "true";
	}

	// Saving & Loading Names
	function SaveNames(toSave) {
		if (toSave === null || toSave.length === 0) {
			StorageManager.clear(STORAGE_KEYS.NAMES);
		} else {
			toSave = toSave
				.filter((name) => name.trim().length > 0)
				.join("|~|");
			StorageManager.set(STORAGE_KEYS.NAMES, toSave);
			if (toSave.length > 0) {
				CLEAR_BUTTON.classList.add("show");
			}
		}
	}
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
			CLEAR_BUTTON.classList.remove("show");
		});
	})();
	// Saving & Loading Names

	// Saving & Loading Theme
	function setColorTheme(el, mode, save) {
		if (!el) {
			return;
		}
		var keys = [
			"--bg-color",
			"--text-color",
			"--input-bg-color",
			"--dark-toggle-icon",
		];
		var d = ["#212121", "#efefef", "#333", "'🌙'"];
		var l = ["#efefef", "#212121", "#fff", "'☀'"];
		let s = mode ? d : l;
		keys.forEach((k, i) => {
			el.style.setProperty(k, s[i]);
		});
		if (save) {
			StorageManager.set(STORAGE_KEYS.THEME, mode);
		}
	}

	const rootElement = document.querySelector(":root");
	(() => {
		const SavedTheme = StorageManager.get(STORAGE_KEYS.THEME);
		const UserPrefersDark = SavedTheme === "true";
		const HasSavedTheme = SavedTheme !== null;

		if (HasSavedTheme) {
			setColorTheme(rootElement, UserPrefersDark, false);
		} else {
			// No preference, use system theme
			setColorTheme(
				rootElement,
				window.matchMedia("(prefers-color-scheme: dark)").matches,
				false
			);
		}
	})();

	document
		.getElementById("dark-toggle")
		.addEventListener("click", function (e) {
			userPrefersDark = !(
				StorageManager.get(STORAGE_KEYS.THEME) === "true"
			);
			setColorTheme(rootElement, userPrefersDark, true);
		});
	// Saving & Loading Theme

	// Team Generation
	class TeamGenerator {
		constructor() {
			this.names = [];
			this.teamCount = 2;
			this.asRandomOrder = false;

			this.hasEvenTeams = false;

			this.target = null;
		}

		Generate(names, teamCount, asRandomOrder) {
			this.names = names;
			this.teamCount = teamCount;
			this.asRandomOrder = asRandomOrder;

			// Save all settings
			SaveNames(names);
			StorageManager.set(STORAGE_KEYS.TEAMCOUNT, teamCount);
			StorageManager.set(STORAGE_KEYS.MODE, asRandomOrder);

			// Clear out the result target
			if (!this.target) {
				this.target = document.getElementById("results");
			}
			this._clearTarget();

			if (this.names.length > 0) {
				// Shuffle players
				this._shuffle();

				// Generate and display.
				if (this.asRandomOrder) {
					this.hasEvenTeams = true; // Not really, but :shrug:
					this._renderAsOrder();
				} else {
					this.hasEvenTeams =
						this.names.length % this.teamCount === 0;
					this._renderAsTeams();
				}
			} else {
				alert("Please enter at least one (1) name first.");
			}
		}
		_clearTarget() {
			while (this.target.firstChild) {
				this.target.removeChild(this.target.firstChild);
			}
			this.target.classList.remove("asOrder");
		}
		_shuffle() {
			for (let i = this.names.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[this.names[i], this.names[j]] = [this.names[j], this.names[i]];
			}
		}
		//
		_renderAsTeams() {
			// Split into teams, first
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

			teams.forEach((players, idx) => {
				this.target.appendChild(
					this._buildTeamCard(`Team ${idx + 1}`, players)
				);
			});
		}
		_renderAsOrder() {
			// No need to split into teams
			this.target.classList.add("asOrder");
			this.target.appendChild(
				this._buildTeamCard(`1. ${this.names[0]}`, this.names, 1)
			);
		}
		//
		_buildTeamCard(teamName, players, playerIdxOffset = 0) {
			var res = document.createElement("div");
			res.classList.add("team");
			res.innerHTML += `<span class="teamname">${teamName} ${
				!this.hasEvenTeams ? `(${players.length})` : ""
			}</span>`;
			for (let n = playerIdxOffset; n < players.length; n++) {
				res.innerHTML += `<span class="player">${n + 1}. ${
					players[n]
				}</span>`;
			}

			return res;
		}
	}

	const Generator = new TeamGenerator();
	(() => {
		function GenerateTeams(e) {
			e.preventDefault();

			const names = NAMES_INPUT.value
				.split("\n")
				.filter((name) => name.trim().length > 0);

			Generator.Generate(
				names,
				parseInt(TEAMCOUNT_INPUT.value),
				MODE_INPUT.checked
			);
		}

		document
			.getElementById("form")
			.addEventListener("submit", GenerateTeams);
	})();
	// Team Generation
};
