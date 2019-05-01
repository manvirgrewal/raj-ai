const { Deck } = require("./cards.js");
const { State } = require("./state.js");
const { turnSim } = require("./turnSim.js");
const cloneDeep = require('../node_modules/lodash/cloneDeep');

//turns console logs off
var console = {};
console.log = function(){};


class gameSim{

  constructor(turn, state, simType, ai, predictedVal){
    //never changes
    this.frozenTurn = cloneDeep(turn); //do not touch
    this.aiCopy = cloneDeep(ai); //do not touch
    this.simType = simType; //0 == monteCarlo, 1==canWin

    //can change on reset
    this.turn = turn;
    this.aiPlayer = ai;
    this.state = state;
    this.newSimTurn = null; //holds turnSim instance

    //utility
    this.playerList = this.state.playerList;
    this.prizes = this.state.prizes; //all available prizes
    this.currPrizes = this.state.currPrizes; //available prizes for this turn

    //shouldn't change
    this.simType = simType;
    this.winner = null; //initially there is no winner
    this.possibleWinCard = null;
    this.rollOverPrizes = []; //prizes rolled over from a turn
    this.totalTurnPrize = 0; //total turn prize including roll over
    this.bestCards = new Deck().createMoneyCountDeck(); //[Card, numberOfWins]

    //simulate on a predicted value if any
    this.predictedVal = predictedVal || null;
  }

  resetSimToDefault(){
    this.turn = cloneDeep(this.frozenTurn);
    this.aiPlayer = cloneDeep(this.aiCopy);
    this.state = new State(this.frozenTurn); //state holds important turn properties
    this.newSimTurn = null; //holds gameSim instance
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
      //turn 1 will either use random winning val or use predicted value if it's provided to gameSim
      if (turnNum === 1) {
        this.newSimTurn = new turnSim(turnNum, this, this.currPrizes, this.simType);
        this.newSimTurn.skipDrawTurn();
      } else {
        this.newSimTurn = new turnSim(turnNum, this, this.currPrizes, this.simType);
        this.newSimTurn.turn();
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

  getOtherPlayers(player){
    let otherPlayers = [];
    for(let p of this.playerList){
      if(p != player){
        otherPlayers.push(p);
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
