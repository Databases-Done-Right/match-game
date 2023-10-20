import { getLocalStorage, deleteLocalStorage, setLocalStorage } from "./localStorage.mjs";

async function connectToAPI(url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          displayResults(data);
        } else {
            throw Error(await response.text());
        }
      } catch (error) {
          console.log(error);
    }
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

const gameSettings = getSettings();
console.log(gameSettings);