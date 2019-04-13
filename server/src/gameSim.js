const { Deck } = require("./cards.js");
const { turnSim } = require("./turnSim.js");
const cloneDeep = require('../node_modules/lodash/cloneDeep');

//turns console logs off
var console = {};
console.log = function(){};


class gameSim{

  constructor(state, simType, ai){
    this.state = state;
    this.simType = simType; //0 == monteCarlo, 1==canWin
    this.playerList = state.playerList;
    this.prizes = state.prizes; //all available prizes
    this.currPrizes = state.currPrizes; //available prizes for this turn
    this.winner = null; //initially there is no winner
    this.ai = cloneDeep(ai);
    this.aiPlayer = cloneDeep(ai); 
    this.possibleWinCard = null;
    this.rollOverPrizes = []; //prizes rolled over from a turn
    this.totalTurnPrize = 0; //total turn prize including roll over
    this.bestCards = new Deck().createMoneyCountDeck(); //[Card, numberOfWins]
  }



  //start simulated game
  start(){
      console.log("\nSimulated Game Starting...");
      this.gameLoop();
  }//end start

  gameLoop(){
    let turnNum = 0;
    while(this.checkIfPlayersStillHaveCards()){ //while prizes remain
      //1 -- begin turn
      turnNum++;
      //console.log("Simulated Turn #" + turnNum);
      if(turnNum === 1){ //if its the first turn of the simulated game, the prize must be of the provided state
        let newTurn = new turnSim(turnNum, this, this.currPrizes, this.simType);
        newTurn.skipDrawTurn(); //since we already have a prize set, skip draw phase
      }else{
        let newTurn = new turnSim(turnNum, this, this.currPrizes, this.simType);
        newTurn.turn();
      }
    }
    console.log("\nSimulated game has ended!");
    this.setWinner(); //looks for player with highest score and sets attrib
    if(this.winner == null){
      console.log("\nSimulated game was tied!");
    }else{
      console.log("\nSimulated winner is: " + this.winner.getName() + " with $" + this.winner.currScore + " million!");
    }
    return this.winner;
    //console.log(this.gameTurns);
  }//end gameLoop

  getOtherPlayerNames(player){
    let otherPlayers = [];
    for(let p of this.playerList){
      if(p != player){
        otherPlayers.push(p.getName());
      }
    }return otherPlayers;
  }

  checkIfPlayersStillHaveCards(){
    let playersHaveCards = true;
    for(let player of this.playerList){
      if (player.numMcards === 0){
        return false;
      }else{
        playersHaveCards = true;
      }
    }return playersHaveCards;
  }

  setWinner(){
    let theWinner = null;
    let winnerScore = -Infinity;
    for(let player of this.playerList){
      if(player.currScore > winnerScore){
        theWinner = player;
        winnerScore = player.currScore;
      }else if (player.currScore === winnerScore){
        theWinner = null;
      }
    }this.winner = theWinner;
  }
}//end Game class


module.exports = {
  gameSim
};
