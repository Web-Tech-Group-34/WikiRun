document.addEventListener("DOMContentLoaded", function () {
 //event listener waits on page being fully loaded before runnin JS
 
	console.log("JavaScript Loaded ✅"); //testong console log to check its loading
 
 // function to get query parameters
	function getQueryParam(param) {
		const urlParams = new URLSearchParams(window.location.search); // gets bit of the URL after ?
		return urlParams.get(param); //gets parameter for each key
	}
	
 // extract values from url addtional blank values for testing purposes
	let startPage = getQueryParam("start"); // || "New_Orleans";
	let endPage = getQueryParam("end"); // || "Pro_Football_Hall_of_Fame";
	let clicks = getQueryParam("clicks"); //|| 3;
	let time = getQueryParam("time"); // || 273;

// variables to assist in scoring
	let difficulty = 1; // default, will be updated after fetching levels.json
	let optimalClicks = 3; // default, will be updated after fetching levels.json

	
	//testing console log to check arameters are being picked up
	console.log("Extracted Parameters:", { startPage, endPage, clicks, time }); 
 
 // insert values into results page, replaces underscores in page names with spaces for readability
	document.getElementById("startPage").textContent = startPage.replace(/_/g, " ");
	document.getElementById("endPage").textContent = endPage.replace(/_/g, " ");
	document.getElementById("clicks").textContent = clicks;
	document.getElementById("time").textContent = time;

// fetch level data from levels.json
	fetch(`levels.json`)
		.then(response => response.json())
		.then(data => {
			const levels = data.levels;
			const matchedLevel = levels.find(level =>
				level.startPage === startPage && level.endPage === endPage
			);

			if (matchedLevel) {
				//checks difficulty levels matches for validation
				const difficultyJson = document.getElementById("difficulty");
				difficultyJson.textContent = matchedLevel.difficulty

				//optimal path
				const optimalPathElement = document.getElementById("optimalPath");
				optimalPathElement.innerHTML = matchedLevel.optimalPaths[0].join(" -> ");

				//calculate score at this point
				calculateScore(clicks, time, difficulty, optimalClicks);

			} else {
				console.log("level not ofound");
			}
		})
		.catch(error => {
			console.error("error loading JSON level", error);
		}
		);

// get users actual path from local storage
	const userPath = JSON.parse(localStorage.getItem(`userPath`)) || [];

	const userPathElement = document.getElementById("userPath");
	if (userPath.length > 0 ) {
		// make each page a clickable link
		const links = userPath.map(page => {
			const pageName = page.replace(/_/g, " ");
			const pageUrl = `https://en.wikipedia.org/wiki/${page}`;
			return `<a href="${pageUrl}" target="_blank">${pageName}</a>`;
		});
	
		// display all links with arrows between them
		userPathElement.innerHTML = links.join(' -> ');
	} else {
		userPathElement.textContent = "No path recorded.";
	}

// calculate a user score
	function calculateScore(clicks, time, difficulty, optimalClicks) {
		//testing to see if function is being called properly
		console.log("CALCULATE SCORE CALLED!", { clicks, time, difficulty, optimalClicks });
		const baseScore = 250;
		console.log("base score ", baseScore);

		//penalties
		const timePenalty = time * 1;

		const extraClicks = Math.max(0, clicks - optimalClicks);

		const extraClickPenalty = extraClicks * 10;
		console.log("time penalty ", timePenalty);
		console.log("clicks penalty ", extraClickPenalty);

		// raw score
		const rawScore = baseScore - (extraClickPenalty + timePenalty);

		// dificulty multiplier
		let difficultyMultiplier = 1;

		if (difficulty === 2) {
			difficultyMultiplier = 1.5;
		} else if (difficulty === 3) {
			difficultyMultiplier = 2;
		}
		console.log ("difficluty multiplier", difficultyMultiplier);

		//final score
		let finalScore = Math.max(0, Math.round(rawScore * difficultyMultiplier));

		console.log("total", finalScore);

		const scoreElement = document.getElementById("finalScore");
		if (scoreElement) {
			scoreElement.textContent = finalScore;
		}
		
		//set max score for star fill
		let maxPossibleScore = 235;

		if (difficulty ===2) {
			maxPossibleScore = 345;
		} else if (difficulty ===3) {
			maxPossibleScore = 400;
		}

		//get percentage for star fill
		const fillPercentage = Math.min((finalScore / maxPossibleScore) * 100, 100);
	}

	

});