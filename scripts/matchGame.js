import { getLocalStorage, deleteLocalStorage, setLocalStorage } from "./localStorage.mjs";

let freezeCardFlip = false;
let currentRound = 1;

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
    const { matchingHowMany, numberOfPlayers } = gameSettings;
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
        }
        else {
            flipBackOverAllCards();
            currentRound++;
        }
    }
    freezeCardFlip = false;
}

async function connectToAPI(apiInfo, gameSettings) {
    const { apiURL: url, callback, gameMode, maxAvailableCards } = apiInfo;
    const { numberOfCards, matchingHowMany } = gameSettings;
    const numberOfPotentialMatches = numberOfCards / 2 > maxAvailableCards ? maxAvailableCards : numberOfCards / 2;
    //const matchingHowMany = gameMode == "Match 3" || gameMode == "Match 2+" ? 3 : gameMode == "Match 4" ? 4 : 2; 
    try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const theImages = callback(data);
          setNewCards(theImages, numberOfPotentialMatches, matchingHowMany);
          displayGameBoard();
        } else {
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
//        div.setAttribute("id", "card"+x.cardId);
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
        //img.setAttribute("loading", "lazy");
        div.appendChild(img);
//        div.setAttribute("onClick", "flipCard("+x.cardId+");");
        gameboardContainer.appendChild(div);
        addCardFlipEventListener("card"+x.cardId);
//        document.getElementById("card"+x.cardId).addEventListener
    });
    console.log('game ready to start2');
}

function flipBackOverAllCards() {
    const faceUpCards = document.getElementsByClassName("flipped");
    for(let a=faceUpCards.length; a>0; a--) {
        flipCard(faceUpCards[(a-1)], false, true);
    }
}

function flipCard(theCard, checkResults, endingFaceDown) {
    const currentFlipside = theCard.getAttribute("src");
    freezeCardFlip = true;
    endingFaceDown ? theCard.classList.remove("flipped") : theCard.classList.add("flipped")
    theCard.classList.add("flipStart");
    setTimeout(() => {
        theCard.src = theCard.getAttribute("flipside");
        theCard.setAttribute("flipside", currentFlipside);
        theCard.classList.remove("flipStart");
    }, 1300);
    setTimeout(() => {
        theCard.classList.add("flipEnd");
    }, 1300);
    setTimeout(() => {
        theCard.classList.remove("flipEnd");
        checkResults ? checkForMatch() : freezeCardFlip = false;
    }, 3000);
}

function getSettings() {
    const initialSettings = {
        gameMode: "Match 2",
        numberOfCards: 24,
        cardSet: "Pokemon",
        matchingHowMany: 2,
        numberOfPlayers: 1,
    };
    const localStorageKey = "matchingGameSettings";
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

function initializeNewGame() {
    const gameSettings = getSettings();
    if(gameSettings.cardSet) {
        const apiData = getApiData("Prophets");
        if(apiData[0] && apiData[0].apiURL && apiData[0].callback) {
            connectToAPI(apiData[0], gameSettings);
        }
    }
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
console.log("you scored " + points + " points!");
    removeMatch();
}

function removeMatch() {
    const faceUpCards = document.getElementsByClassName("flipped");
    for(let a=faceUpCards.length; a>0; a--) {
        faceUpCards[(a-1)].classList.add("matched")
        faceUpCards[(a-1)].classList.remove("flipped")
    }
}

function scoreMatch(numberOfPlayers) {
    const roundPercentPenalty = currentRound <= 15 ? (currentRound - 1) * 3 : 45;
    const playerBasedPointMultiplier = 1 + ((Number(numberOfPlayers) - 1) * .3);
    return 1000 * playerBasedPointMultiplier * (100 - roundPercentPenalty) / 100;
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

initializeNewGame();
//const apis = getApiList();
