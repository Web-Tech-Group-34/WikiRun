document.addEventListener("DOMContentLoaded", function() {
    console.log("Gameplay JavaScript Loaded ✅");
    
    // Game state variables
    let clickCount = 0;
    let startTime = Date.now();
    let timer = 0;
    let timerInterval;
    let currentLevel = {};
    let hasWon = false;
    let currentPage = "";
    let pageHistory = [];
    
    // DOM elements
    const levelNameElement = document.getElementById("levelName");
    const startPageElement = document.getElementById("startPage");
    const endPageElement = document.getElementById("endPage");
    const clickCounterElement = document.getElementById("clickCounter");
    const timerElement = document.getElementById("timer");
    const wikiContentElement = document.getElementById("wikiContent");
    const giveUpBtn = document.getElementById("giveUpBtn");
    const searchPopup = document.getElementById("searchPopup");
    const hintPopup = document.getElementById("hintPopup");
    const historyPopup = document.getElementById("historyPopup");
    const popupOverlay = document.getElementById("popupOverlay");
    const closePopupBtn = document.getElementById("closePopupBtn");
    const closeHintBtn = document.getElementById("closeHintBtn");
    const closeHistoryBtn = document.getElementById("closeHistoryBtn");
    const hintBtn = document.getElementById("hintBtn");
    const hintText = document.getElementById("hintText");
    const progressBar = document.getElementById("progressBar");
    const pageHistoryElement = document.getElementById("pageHistory");
    const mobilePageHistoryElement = document.getElementById("mobilePageHistory");
    const historyBackBtn = document.getElementById("historyBackBtn");
    const restartBtn = document.getElementById("restartBtn");
    const mobileBackBtn = document.getElementById("mobileBackBtn");
    const mobileRestartBtn = document.getElementById("mobileRestartBtn");
    const mobileHistoryBtn = document.getElementById("mobileHistoryBtn");
    
    // Check if all required elements exist
    if (!wikiContentElement) {
        console.error("Error: Could not find wikiContent element");
        return;
    }
    
    // Function to get query parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
    
    // Get level ID from URL
    const levelId = getQueryParam("level") || 1;
    
    // Load level data from JSON
    fetch('levels.json')
        .then(response => response.json())
        .then(data => {
            // Find the level with the matching ID
            currentLevel = data.levels.find(level => level.id == levelId);
            
            if (!currentLevel) {
                console.error("Level not found!");
                return;
            }
            
            // Update UI with level information
            if (levelNameElement) levelNameElement.textContent = currentLevel.name;
            if (startPageElement) startPageElement.textContent = currentLevel.startPage.replace(/_/g, " ");
            if (endPageElement) endPageElement.textContent = currentLevel.endPage.replace(/_/g, " ");
            
            // Load the starting Wikipedia page
            loadWikiPage(currentLevel.startPage);
            
            // Start the timer
            startTimer();
        })
        .catch(error => {
            console.error("Error loading level data:", error);
        });
    
    // Function to create a loading indicator element
    function createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        loadingDiv.appendChild(spinner);
        
        const loadingText = document.createElement('p');
        loadingText.textContent = 'Loading Wikipedia content...';
        loadingDiv.appendChild(loadingText);
        
        return loadingDiv;
    }
    
    // Function to create an error message element
    function createErrorMessage(message, buttonText, buttonAction) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        
        const heading = document.createElement('h2');
        heading.textContent = 'Error';
        errorDiv.appendChild(heading);
        
        const errorText = document.createElement('p');
        errorText.textContent = message;
        errorDiv.appendChild(errorText);
        
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.addEventListener('click', buttonAction);
        errorDiv.appendChild(button);
        
        return errorDiv;
    }
    
    // Function to load a Wikipedia page using the API
    function loadWikiPage(pageName) {
        currentPage = pageName;
        
        // Show loading indicator
        wikiContentElement.innerHTML = '';
        wikiContentElement.appendChild(createLoadingIndicator());
        
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageName}&prop=text|displaytitle&formatversion=2&format=json&origin=*`;
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    wikiContentElement.innerHTML = '';
                    wikiContentElement.appendChild(
                        createErrorMessage(
                            `Sorry, the page "${pageName.replace(/_/g, " ")}" could not be found.`,
                            'Go Back',
                            () => goBack()
                        )
                    );
                    return;
                }
                
                // Add page to history if it's not already the current page
                if (pageHistory.length === 0 || pageHistory[pageHistory.length - 1] !== pageName) {
                    pageHistory.push(decodeURIComponent(pageName));
                    updatePageHistory();
                }
                
                // Create a document fragment to hold the content
                const fragment = document.createDocumentFragment();
                
                // Add the page title
                const titleElement = document.createElement('h1');
                titleElement.textContent = (data.parse.displaytitle || decodeURIComponent(pageName).replace(/_/g, " ")).replace(/<span class="mw-page-title-main">(.*?)<\/span>/g, '$1');
                fragment.appendChild(titleElement);
                
                // Add the content
                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = data.parse.text;
                fragment.appendChild(contentDiv);                
                // Remove unwanted elements
                removeUnwantedElements(fragment);
                
                // Process links to make them work within our game
                processLinks(fragment, pageName);
                
                // Set the content
                wikiContentElement.innerHTML = '';
                wikiContentElement.appendChild(fragment);
                
                // Update progress bar
                updateProgressBar();
                
                // Check if we've reached the target page
                checkForWin(pageName);
                
                // Scroll to top
                wikiContentElement.scrollTop = 0;
                
                // Fix page titles
                document.querySelectorAll('.mw-page-title-main').forEach(function(titleSpan) {
                    if (titleSpan.parentNode) {
                        titleSpan.parentNode.innerHTML = titleSpan.textContent;
                    }
                });
            })
            .catch(error => {
                console.error("Error fetching Wikipedia content:", error);
                wikiContentElement.innerHTML = '';
                wikiContentElement.appendChild(
                    createErrorMessage(
                        'There was a problem loading the Wikipedia content. Please try again.',
                        'Reload Page',
                        () => location.reload()
                    )
                );
            });
    }
    
    // Function to remove unwanted elements from Wikipedia content
    function removeUnwantedElements(container) {
        const selectors = [
            '.mw-editsection',
            '.navbox',
            '.vertical-navbox',
            '#External_links',
            '.external',
            '.reference',
            '.references',
            '.citation-needed',
            '#toc',
            '.toc',
            '.geo',
            '.geo-default',
            '.geo-nondefault',
            '.geo-multi-punct',
            '.hatnote'
        ];
        
        selectors.forEach(selector => {
            const elements = container.querySelectorAll(selector);
            elements.forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        });
    }
    
    // Function to process links in Wikipedia content
    function processLinks(container, currentPageName) {
        const links = container.querySelectorAll('a');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Only process internal wiki links
            if (href && href.startsWith('/wiki/')) {
                // Extract page name from href
                const pageName = href.replace('/wiki/', '');
                
                // Skip special pages, files, etc.
                if (pageName.includes(':') || 
                    pageName.startsWith('#') || 
                    pageName === currentPageName) {
                    link.style.color = '#767676';
                    link.style.textDecoration = 'none';
                    link.style.cursor = 'default';
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                    });
                } else {
                    // Make the link work within our game
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        clickCount++;
                        if (clickCounterElement) clickCounterElement.textContent = clickCount;
                        loadWikiPage(pageName);
                    });
                }
            } else {
                // Disable external links
                link.style.color = '#767676';
                link.style.textDecoration = 'none';
                link.style.cursor = 'default';
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                });
            }
        });
    }
    
    // Function to update the page history sidebar
    function updatePageHistory() {
        if (pageHistoryElement) {
            pageHistoryElement.innerHTML = '';
            
            // Display the pages (most recent at the top)
            const recentPages = [...pageHistory].reverse();
            
            recentPages.forEach((page, index) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = page.replace(/_/g, ' ');
                
                // Highlight current page
                if (index === 0) {
                    a.classList.add('current');
                }
                
                a.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (index !== 0) { // Don't reload current page
                        clickCount++;
                        if (clickCounterElement) clickCounterElement.textContent = clickCount;
                        loadWikiPage(page);
                    }
                });
                
                li.appendChild(a);
                pageHistoryElement.appendChild(li);
            });
        }
        
        // Also update mobile history if it exists
        if (mobilePageHistoryElement) {
            mobilePageHistoryElement.innerHTML = '';
            
            const recentPages = [...pageHistory].reverse();
            
            recentPages.forEach((page, index) => {
                const div = document.createElement('div');
                div.style.padding = '10px';
                div.style.borderBottom = '1px solid #eaecf0';
                
                if (index === 0) {
                    div.style.fontWeight = 'bold';
                    div.style.backgroundColor = '#eaecf0';
                }
                
                div.textContent = page.replace(/_/g, ' ');
                
                div.addEventListener('click', function() {
                    if (index !== 0) { // Don't reload current page
                        clickCount++;
                        if (clickCounterElement) clickCounterElement.textContent = clickCount;
                        loadWikiPage(page);
                        closeAllPopups();
                    }
                });
                
                mobilePageHistoryElement.appendChild(div);
            });
        }
    }
    
    // Function to update progress bar
    function updateProgressBar() {
        if (!progressBar) return;
        
        // This is a simplified progress calculation
        if (pageHistory.length <= 1) {
            progressBar.style.width = '0%';
            return;
        }
        
        progressBar.style.width = '10%';
        

        if (pageHistory.length > 2) {
            progressBar.style.width = '30%';
        }
        
        if (pageHistory.length > 4) {
            progressBar.style.width = '50%';
        }
        
        if (pageHistory.length > 6) {
            progressBar.style.width = '70%';
        }
        
        // Add animation to the progress bar
        progressBar.style.transition = 'width 0.5s ease-in-out';
    }
    
    // Function to check if the user has reached the target page
    function checkForWin(pageName) {
        if (pageName === currentLevel.endPage) {
            console.log("Goal reached!");
            
            // Show a success animation on the progress bar
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.backgroundColor = '#00af89';
            }
            
            // Wait a moment to show the completed progress bar before redirecting
            setTimeout(function() {
                endGame(true);
            }, 1000);
        }
    }
    
    // Function to start the timer
    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(function() {
            updateTimer();
        }, 1000);
    }
    
    // Function to update the timer display
    function updateTimer() {
        timer = Math.floor((Date.now() - startTime) / 1000);
        if (timerElement) timerElement.textContent = timer;
    }
    
    // Function to end the game
    function endGame(won = false) {
        clearInterval(timerInterval);
        hasWon = won;
        
        // saves user apth to local storage
        localStorage.setItem(`userPath`, JSON.stringify(pageHistory)); 

        // Redirect to results page with game data
        const resultsUrl = `wikirun_results.html?start=${currentLevel.startPage}&end=${currentLevel.endPage}&clicks=${clickCount}&time=${timer}`;
        window.location.href = resultsUrl;
    }
    
    // Function to go back to the previous page
    function goBack() {
        if (pageHistory.length > 1) {
            // Remove current page
            pageHistory.pop();
            // Go to previous page
            const previousPage = pageHistory.pop();
            loadWikiPage(previousPage);
        }
    }
    
    // Function to restart the level
    function restartLevel() {
        if (confirm("Are you sure you want to restart this level?")) {
            pageHistory = [];
            clickCount = 0;
            if (clickCounterElement) clickCounterElement.textContent = clickCount;
            startTime = Date.now();
            loadWikiPage(currentLevel.startPage);
        }
    }
    
    // Function to close all popups
    function closeAllPopups() {
        if (searchPopup) searchPopup.style.display = 'none';
        if (hintPopup) hintPopup.style.display = 'none';
        if (historyPopup) historyPopup.style.display = 'none';
        if (popupOverlay) popupOverlay.style.display = 'none';
    }
    
    // Function to show the search popup
    function showSearchPopup() {
        if (searchPopup) searchPopup.style.display = 'block';
        if (popupOverlay) popupOverlay.style.display = 'block';
    }
    
    // Function to show the hint popup
    function showHintPopup() {
        if (hintPopup) hintPopup.style.display = 'block';
        if (popupOverlay) popupOverlay.style.display = 'block';
    }
    
    // Function to show the history popup (mobile)
    function showHistoryPopup() {
        if (historyPopup) historyPopup.style.display = 'block';
        if (popupOverlay) popupOverlay.style.display = 'block';
    }
    
    // Event Listeners
    
    // Give up button event listener
    if (giveUpBtn) {
        giveUpBtn.addEventListener('click', function() {
            if (confirm("Are you sure you want to give up?")) {
                endGame(false);
            }
        });
    }
    
    // History back button event listener
    if (historyBackBtn) {
        historyBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
    }
    
    // Mobile back button event listener
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
    }
    
    // Restart button event listener
    if (restartBtn) {
        restartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            restartLevel();
        });
    }
    
    // Mobile restart button event listener
    if (mobileRestartBtn) {
        mobileRestartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            restartLevel();
        });
    }
    
    // Mobile history button event listener
    if (mobileHistoryBtn) {
        mobileHistoryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showHistoryPopup();
        });
    }
    
    // Hint button event listener
    if (hintBtn) {
        hintBtn.addEventListener('click', function() {
            // Get hints from the current level
            let hints = currentLevel.hints;
            let hint = hints[Math.floor(Math.random() * hints.length)];
            
            if (hintText) hintText.textContent = hint;
            showHintPopup();
        });
    }
    
    // Detect Ctrl+F to show popup
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            showSearchPopup();
        }
    });
    
    // Close popup button event listeners
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', function() {
            closeAllPopups();
        });
    }
    
    if (closeHintBtn) {
        closeHintBtn.addEventListener('click', function() {
            closeAllPopups();
        });
    }
    
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', function() {
            closeAllPopups();
        });
    }
    
    // Also close popups when clicking overlay
    if (popupOverlay) {
        popupOverlay.addEventListener('click', function() {
            closeAllPopups();
        });
    }
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key closes popups
        if (e.key === 'Escape') {
            closeAllPopups();
        }
        
        // Backspace key for going back (when not in an input field)
        if (e.key === 'Backspace' && 
            document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            goBack();
        }
    });
});
