import { getLocalStorage, deleteLocalStorage, setLocalStorage } from "./localStorage.mjs";

async function connectToAPI(apiInfo, gameSettings) {
    const { apiURL: url, callback, gameMode, maxAvailableCards } = apiInfo;
    const { numberOfCards } = gameSettings;
    const numberOfPotentialMatches = numberOfCards / 2 > maxAvailableCards ? maxAvailableCards : numberOfCards / 2;
    const matchingHowMany = gameMode == "Match 3" || gameMode == "Match 2+" ? 3 : gameMode == "Match 4" ? 4 : 2; 
//console.log(gameSettings, numberOfPotentialMatches, matchingHowMany);
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
    console.log('game ready to start');
}

function getCardDomElement() {
    const gameboardContainer = document.getElementById("gameboardContainer");
}

function getSettings() {
    const initialSettings = {
        gameMode: "Match 2",
        numberOfCards: 24,
        cardSet: "Pokemon",
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

function setNewCards(theImages, numberOfPotentialMatches, matchingHowMany) {
    let arrayOfCards = [];
    for(let a=0; a<numberOfPotentialMatches; a++) {
        for(let b=0; b<matchingHowMany; b++) {
            arrayOfCards.push(theImages[a]);
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
