import { getLocalStorage, deleteLocalStorage, setLocalStorage } from "./localStorage.mjs";

const localStorageKey = "matchingGameSettings";
let freezeCardFlip = false;

function addCardFlipEventListener(cardId) {
    document.getElementById(cardId).addEventListener("click", () => {
        if(!freezeCardFlip) {
            const theCard = document.getElementById(cardId);
            if(theCard.className === "unmatched") {
                flipCard(theCard, true, false);
            }
        }
    });
}

function checkForMatch() {
    const faceUpCards = document.getElementsByClassName("flipped");
    const gameSettings = getLocalStorage("matchingGameSettings");
    const { matchingHowMany, numberOfPlayers, numberOfCards } = gameSettings;
    if(faceUpCards.length >= matchingHowMany) {
        let flagMatched = true;
        const urlToMatch = faceUpCards[0].src;
        for(let a=1; a<faceUpCards.length; a++) {
            if(urlToMatch != faceUpCards[a].src) {
                flagMatched = false;
            }
        }
        if(flagMatched) {
            processMatch(numberOfPlayers);
            const currentFaceUpCardCount = document.getElementsByClassName("matched");
            if(currentFaceUpCardCount.length == Number(numberOfCards)) {
                goodGame();
            }
        }
        else {
            flipBackOverAllCards();
            updateCurrentRound();
        }
    }
    freezeCardFlip = false;
}

async function connectToAPI(apiInfo, gameSettings) {
    const { apiURL: url, callback, gameMode, maxAvailableCards } = apiInfo;
    const { numberOfCards, matchingHowMany } = gameSettings;
    const numberOfPotentialMatches = numberOfCards / 2 > maxAvailableCards ? maxAvailableCards : numberOfCards / 2;
    //const matchingHowMany = gameMode == "Match 3" || gameMode == "Match 2+" ? 3 : gameMode == "Match 4" ? 4 : 2; 
console.log('attempting to connect to API');
    try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const theImages = callback(data);
          setNewCards(theImages, numberOfPotentialMatches, matchingHowMany);
          displayGameBoard();
        } else {
            console.log('Problem connecting to API');
            throw Error(await response.text());
        }
      } catch (error) {
          console.log(error);
    }
}

function displayGameBoard() {
    const cardBackUrl = "./images/playingCardBack.png";
    const theCards = getLocalStorage("cards");
    const gameboardContainer = document.getElementById("gameboardContainer");
    theCards.map((x) => {
        const link = document.createElement('link');
        const div = document.createElement('div');
        const img = document.createElement("img");
        img.setAttribute("id", "card"+x.cardId);
        if(x.hasBeenMatched) {
            img.setAttribute("src", x.cardUrl);
            img.className = "matched";
        }
        else {
            img.setAttribute("src", cardBackUrl);
            img.setAttribute("flipside", x.cardUrl);
            img.className = "unmatched";
        }
        img.setAttribute("alt", "Card");
        div.appendChild(img);
        gameboardContainer.appendChild(div);
        addCardFlipEventListener("card"+x.cardId);
    });
}

function flipBackOverAllCards() {
    const faceUpCards = document.getElementsByClassName("flipped");
    for(let a=faceUpCards.length; a>0; a--) {
        flipCard(faceUpCards[(a-1)], false, true);
    }
}

function flipCard(theCard, checkResults, endingFaceDown) {
    const currentFlipside = theCard.getAttribute("src");
    const localSettings = getLocalStorage(localStorageKey);
    const pauseForAnimation = localSettings.animationSpeed * .75;
    //    localSettings.animationSpeed = theValue;
        //setLocalStorage(localStorageKey, localSettings);
        //document.documentElement.style.setProperty('--animationSpeed', String(theValue / 1000).concat('s'));
    freezeCardFlip = true;
    endingFaceDown ? theCard.classList.remove("flipped") : theCard.classList.add("flipped")
    theCard.classList.add("flipStart");
    setTimeout(() => {
        theCard.src = theCard.getAttribute("flipside");
        theCard.setAttribute("flipside", currentFlipside);
        theCard.classList.remove("flipStart");
    }, pauseForAnimation);
    setTimeout(() => {
        theCard.classList.add("flipEnd");
    }, pauseForAnimation);
    setTimeout(() => {
        theCard.classList.remove("flipEnd");
        checkResults ? checkForMatch() : freezeCardFlip = false;
    }, pauseForAnimation * 1.4);
}

function getSettings() {
    const initialSettings = {
        gameMode: "Match 2",
        numberOfCards: 10,
        cardSet: "Prophets",
        matchingHowMany: 2,
        numberOfPlayers: 1,
        animationSpeed: 2000,
        currentScore: 0,
        currentRound: 1,
        matchedCards: "",
    };
    const localSettings = getLocalStorage(localStorageKey);
    if(localSettings) {
        return localSettings
    }
    else {
        setLocalStorage(localStorageKey, initialSettings);
        return getLocalStorage(localStorageKey);
    }
}

function getApiList() {
    const apis = [{
        name: "Pokemon",
        apiURL: "https://pokeapi.co/api/v2/pokemon",
        maxAvailableCards: 40,
        callback: parseDataPokemon
    },
    {
        name: "Prophets",
        apiURL: "https://brotherblazzard.github.io/canvas-content/latter-day-prophets.json",
        maxAvailableCards: 17,
        callback: parseDataProphets
    }];
    return apis;
}

function getApiData(apiName) {
    const apis = getApiList();
    return apis.filter((x) => x.name === apiName);
}

function goodGame() {
    const localSettings = getLocalStorage(localStorageKey);
    document.getElementById("finalScoreContainer").innerHTML = localSettings.currentScore;
    menuItemClicked('Good Game');
}

export function initializeNewGame() {
    resetGameLocalStorage();
    document.getElementById("gameboardContainer").innerHTML = "";
    updateCurrentRound(1);
    const gameSettings = getSettings();
    updateCurrentScore(0);
    if(gameSettings.cardSet) {
        const apiData = getApiData("Prophets");
        if(apiData[0] && apiData[0].apiURL && apiData[0].callback) {
            connectToAPI(apiData[0], gameSettings);
        }
    }
    updateAnimationSpeed(gameSettings.animationSpeed)
}

function parseDataPokemon(data) {
    console.log('Poke data');
}

function parseDataProphets(data) {
    if(data && data.prophets) {
        return data.prophets.map((x) => {
            return x.imageurl;
        });
    }
}

function processMatch(numberOfPlayers) {
    const points = scoreMatch(numberOfPlayers);
    updateCurrentScore(points);
    removeMatch();
}

function removeMatch() {
    const faceUpCards = document.getElementsByClassName("flipped");
    for(let a=faceUpCards.length; a>0; a--) {
        faceUpCards[(a-1)].classList.add("matched")
        faceUpCards[(a-1)].classList.remove("flipped")
    }
}

function resetGameLocalStorage() {
    let localSettings = getLocalStorage(localStorageKey);
    localSettings.currentScore = 0;
    localSettings.currentRound = 1;
    localSettings.matchedCards = "";
    setLocalStorage(localStorageKey, localSettings);
}

function scoreMatch(numberOfPlayers) {
    const localSettings = getLocalStorage(localStorageKey);
    const { currentRound } = localSettings;
    const roundPercentPenalty = currentRound <= 15 ? (currentRound - 1) * 3 : 45;
    const playerBasedPointMultiplier = 1 + ((Number(numberOfPlayers) - 1) * .3);
    return 1000 * playerBasedPointMultiplier * (100 - roundPercentPenalty) / 100;
}

export function setAnimationSpeed(theValue) {
    if(theValue && !isNaN(theValue) && theValue >= 500 && theValue <= 2000) {
        let localSettings = getLocalStorage(localStorageKey);
        localSettings.animationSpeed = theValue;
        setLocalStorage(localStorageKey, localSettings);
        updateAnimationSpeed(theValue);
    }
}

export function setCardSet(theValue) {
    let localSettings = getLocalStorage(localStorageKey);
    const hasChanged = theValue == localSettings.cardSet ? false : true;
    localSettings.cardSet = theValue;
    setLocalStorage(localStorageKey, localSettings);
    hasChanged || initializeNewGame();
}

function setCurrentGameState(theCards, roundeNumber, currentScore) {

}

export function setNumberOfCards(theValue) {
    if(theValue && !isNaN(theValue) && theValue >= 4 && theValue <= 12) {
        let localSettings = getLocalStorage(localStorageKey);
        const hasChanged = theValue == localSettings.numberOfCards ? false : true;
        localSettings.numberOfCards = theValue;
        setLocalStorage(localStorageKey, localSettings);
        hasChanged || initializeNewGame();
    }
}

export function setSettingsFormFieldValue() {
    const localSettings = getLocalStorage(localStorageKey);
    document.getElementById("settingCardSet").value = localSettings.cardSet;
    document.getElementById("settingNumberOfCards").value = localSettings.numberOfCards;
    document.getElementById("settingAnimationSpeed").value = localSettings.animationSpeed;
}

function setNewCards(theImages, numberOfPotentialMatches, matchingHowMany) {
    let arrayOfCards = [];
    for(let a=0; a<numberOfPotentialMatches; a++) {
        for(let b=0; b<matchingHowMany; b++) {
            arrayOfCards.push({
                cardUrl: theImages[a],
                hasBeenMatched: false,
                cardId: a*100+b
            });
        }
    }
    setLocalStorage("cards", shuffleCards(arrayOfCards));
}

function shuffleCards(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
}

function updateAnimationSpeed(theValue) {
    if(theValue && !isNaN(theValue)) {
        document.documentElement.style.setProperty('--animationSpeed', String(theValue / 1000).concat('s'));
    }
}

function updateCurrentRound(theValue) {
    let localSettings = getLocalStorage(localStorageKey);
    if(theValue && !isNaN(theValue)) {
        localSettings.currentRound = theValue;
    }
    else {
        localSettings.currentRound++;
    }
    setLocalStorage(localStorageKey, localSettings);
    document.getElementById("displayRoundContainer").innerHTML = localSettings.currentRound;
}

function updateCurrentScore(theValue) {
    if(theValue && !isNaN(theValue)) {
        let localSettings = getLocalStorage(localStorageKey);
        theValue == 0 ? localSettings.currentScore = 0 : localSettings.currentScore += theValue;
        setLocalStorage(localStorageKey, localSettings);
        document.getElementById("displayScoreContainer").innerHTML = localSettings.currentScore;
    }
}

initializeNewGame();