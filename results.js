document.addEventListener("DOMContentLoaded", function () {
 //event listener waits on page being fully loaded before runnin JS
 
	console.log("JavaScript Loaded ✅"); //testong console log to check its loading
 
 // function to get query parameters
	function getQueryParam(param) {
		const urlParams = new URLSearchParams(window.location.search); // gets bit of the URL after ?
		return urlParams.get(param); //gets parameter for each key
	}
	
 // extract values from url
	let startPage = getQueryParam("start") || "New_Orleans";
	let endPage = getQueryParam("end") || "Pro_Football_Hall_of_Fame";
	let clicks = getQueryParam("clicks") || 3;
	let time = getQueryParam("time") || 273;
	
	//testing console log to check arameters are being picked up
	console.log("Extracted Parameters:", { startPage, endPage, clicks, time }); 
 
 // insert values into results page, replaces underscores in page names with spaces for readability
	document.getElementById("startPage").textContent = startPage.replace(/_/g, " ");
	document.getElementById("endPage").textContent = endPage.replace(/_/g, " ");
	document.getElementById("clicks").textContent = clicks;
	document.getElementById("time").textContent = time;

});