import { initializeNewGame, setSettingsFormFieldValue, setAnimationSpeed, setCardSet, setNumberOfCards } from "./matchGame.js";
window.initializeNewGame = initializeNewGame;
window.menuItemClicked = menuItemClicked;
window.setAnimationSpeed = setAnimationSpeed;
window.setCardSet = setCardSet;
window.setNumberOfCards = setNumberOfCards;

function menuItemClicked(selection) {
    if(selection) {
        document.getElementById("menuFinalScore").style.display = "none";
        document.getElementById("menuMain").style.display = "none";
        document.getElementById("menuLeaderboard").style.display = "none";
        document.getElementById("menuSettings").style.display = "none";
        switch(selection) {
            case 'Close': {
                document.getElementById("menuRoot").style.display = "none";
                break;
            }
            case 'Continue Game': {
                document.getElementById("menuRoot").style.display = "none";
                break;
            }
            case 'Good Game': {
                document.getElementById("mainMenuLabel").innerHTML = "Final Score";
                document.getElementById("menuRoot").style.display = "";
                document.getElementById("menuFinalScore").style.display = "";
                break;
            }
            case 'Main Menu': {
                document.getElementById("mainMenuLabel").innerHTML = "Main Menu";
                document.getElementById("menuMain").style.display = "";
                document.getElementById("menuRoot").style.display = "";
                break;
            }
            case 'New Game': {
                initializeNewGame();
                document.getElementById("menuRoot").style.display = "none";
                break;
            }
            case 'Leaderboard': {
                document.getElementById("mainMenuLabel").innerHTML = "Leaderboard";
                document.getElementById("menuLeaderboard").style.display = "";
                break;
            }
            case 'Settings': {
                document.getElementById("mainMenuLabel").innerHTML = "Game Settings";
                setSettingsFormFieldValue();
                document.getElementById("menuSettings").style.display = "";
                break;
            }
        }
    }
}
