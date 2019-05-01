const { Card } = require("./cards.js");

//var console = {};
//console.log = function(){};

class turnSim{

  constructor(turnNum, simulatedGame, currPrizes, simType){
    this.game = simulatedGame;
    this.turnNum = turnNum;
    this.turnPrize = null;
    this.allTurnPrizes = currPrizes || [];
    this.rollOverPrizesValue = 0;
    this.totalTurnPrize = 0;
    this.turnWinner = null;

    this.simType = simType; //diff simType == diff turnChoose

    //set limit on number of times we can try to force ai to win
    //as ai might just not be able to win with their current hand
    this.maxTries = 500;
    this.numOfWinTries = 0; //increment

  }

  getAllTurnPrizes(){
    return this.allTurnPrizes;
  }

  turn(){
    this.turnDraw();
    this.rollOverPrizes();
    this.turnChoose();
    this.turnWin();
  }

  //only ever for the first turn of any game
  //so currPrizes can only have one prize [0]
  skipDrawTurn(){
    this.turnPrize = this.game.state.turn.turnPrize;
    this.totalTurnPrize += this.turnPrize.getValue();
    this.turnChoose();
    this.turnWin();
    this.updateBestCards();
  }

  //For usage if simulating with a predicted value
  skipDrawChooseTurn() {
    this.turnPrize = this.game.state.turn.turnPrize;
    this.totalTurnPrize += this.turnPrize.getValue();
    this.turnChoose();
    this.turnWin();
  }

  getCardThatWon(){
      return this.turnWinner.currCard;
  }

  //increments num of wins for card that won main turn
  updateBestCards(){
    if(this.turnWinner != null && this.turnNum === 1){
      //console.log("Card that won: " + this.getCardThatWon().getName() + " ...updating..");
      for(let card of this.game.bestCards.deck){
        if(card[0].name === this.getCardThatWon().name){
          card[1]++;
        }
      }
    }else{
    }
  }

  turnDraw(){
    this.turnPrize = this.game.prizes.deal();
    this.allTurnPrizes.push(this.turnPrize);
    this.totalTurnPrize += this.turnPrize.getValue();
    //console.log("Simulated Prize Drawn: " + this.turnPrize.getName() + ": " + this.turnPrize.getValue() + " million!");
  }

  rollOverPrizes(){
    if(this.game.rollOverPrizes.length > 0){
      for(let prize of this.game.rollOverPrizes){
        this.rollOverPrizesValue += prize.getValue();
      }
    }
  }

  turnChoose(){
    //if typeSim == 0, then monteCarlo == random choices
    if(this.simType === 0){
      for (let player of this.game.playerList){
        let chosenCard = player.chooseRandomMCard();
        player.currCard = chosenCard;
      }
    }else if(this.simType === 1 || this.simType === 2){ //playerModelPrediction
      for (let player of this.game.playerList){
        if (player.aiEnable === 0){
          this.chooseRandomly(player);
        } else if (this.simType == 2 && player.aiEnable === 1 && this.turnNum === 1 && this.game.predictedVal !== null) {
          this.predictedChoice(player, this.game.predictedVal);
          if(this.game.possibleWinCard === null){this.game.possibleWinCard = player.currCard;}
        } else{
          this.chooseRandomly(player);
          if(this.game.possibleWinCard === null){this.game.possibleWinCard = player.currCard;}
        }
      }
    }

  }

  predictedChoice(player, predictedVal) {
    let cardName = predictedVal + "k";
    let cardIndex = player.mCards.deck.findIndex(card => card.name === cardName);
    player.mCards.deck.splice(cardIndex, 1);
    player.numMcards--;
    player.currCard = new Card(cardName, predictedVal);
  }

  chooseRandomly(player){
    let min = 0;
    let max = player.numMcards;
    let random = Math.floor(Math.random() * max) + min;
    let chosenCard = player.mCards.deck[random];
    player.mCards.deck.splice(random, 1);
    player.numMcards--; //decrement number of mcards remaining
    player.currCard = chosenCard; //set current card to best card
  }

  unChooseCard(player){
    player.mCards.deck.push(player.currCard); //add chosen card back to their deck
    player.numMcards++; //increment number of mcards remaining
  }

  chooseLowestCard(player){
    var lowestVal = Infinity;
    var lowestCard;
    for(let card of player.mCards.deck){
      if(card.getValue() < lowestVal){
        lowestVal = card.getValue();
        lowestCard = card;
      }else{
        continue;
      }
    }
    let currCardIndex = player.mCards.deck.findIndex(card => card.getValue() === lowestCard.getValue());
    player.mCards.deck.splice(currCardIndex, 1);//remove chosenCard from hand
    player.numMcards--; //decrement number of mcards remaining
    player.currCard = lowestCard; //set current card to best card
  }

  chooseWithDoubleAbs(player){
    let chosenCard = null;
    let prizeVal = Math.abs(this.turnPrize.getValue())*2;
    chosenCard = player.mCards.getCard(prizeVal);
    let currCardIndex = player.mCards.deck.findIndex(card => card.getValue() === chosenCard.getValue());
    player.mCards.deck.splice(currCardIndex, 1);//remove chosenCard from hand
    player.numMcards--; //decrement number of mcards remaining
    player.currCard = chosenCard; //set current card to best card
  }

  async turnWin(){
    try {
      this.calculateTurnWinner();
      if (this.turnNum != 1) {
        if (this.turnWinner == null){
          for(let prize of this.allTurnPrizes){
            this.game.rollOverPrizes.push(prize);
          }
          this.allTurnPrizes = []; //reset turn prizes
        }else{
          this.turnWinner.currScore += this.totalTurnPrize;
          this.game.rollOverPrizes = []; //reset rollOverPrizes after they are won
          this.allTurnPrizes = []; //reset turn prizes
        }
      } else {
        if (this.simType === 1 && (this.turnWinner == null || (this.turnWinner.name != this.game.aiPlayer.name) && (this.numOfWinTries < this.maxTries))){
          //console.log(`Forcing win.. Player: ${this.turnWinner.name}, Chosen Card: ${this.turnWinner.currCard.getValue()}, SimType: ${this.simType}`)
          for (let player of this.game.playerList){
            if (player.aiEnable == 0){
              this.unChooseCard(player);
            }else{
              this.unChooseCard(player);
            }
          }
          //increment num of win tries
          this.numOfWinTries++
          //reset possible ai wincard
          if(this.game.possibleWinCard === null){this.game.possibleWinCard = null}
          //reset turnwinner
          this.turnWinner = null;
          //then redo turn
          this.skipDrawTurn();
        }else{
          //console.log(`Random.. Player: ${this.turnWinner.name}, Chosen Card: ${this.turnWinner.currCard.getValue()}, SimType: ${this.simType}`)
          this.turnWinner.currScore += this.totalTurnPrize;
          this.game.rollOverPrizes = []; //reset rollOverPrizes after they are won
          this.allTurnPrizes = []; //reset turn prizes
        }
      }
    } catch (error) {
      //console.error(error)
    }
  }

  calculateTurnWinner(){
    let uniqueVals = this.uniqueCardPlayers();
    let highestValPlayer = this.getHighestValPlayer(uniqueVals);
    let lowestValPlayer = this.getLowestValPlayer(uniqueVals);
    if(uniqueVals === []){ //if everyone placed the same card, the prize rolls over
      this.turnWinner = null;
    }else if(this.totalTurnPrize > 0){
      this.turnWinner = highestValPlayer;
    }else{
      this.turnWinner = lowestValPlayer;
    }
  }

  uniqueCardPlayers(){
    var uniqueVals = [];
    var dupes = [];
    for(let i=0; i<this.game.playerList.length; i++){
      var currPlayer = this.game.playerList[i];
      for(let j=0; j<this.game.playerList.length; j++){
        if (currPlayer.getName() == this.game.playerList[j].getName()){
          continue; //if comparing with the same player, skip to next
        }else if(currPlayer.currCard.getValue() == this.game.playerList[j].currCard.getValue()){
          dupes.push(currPlayer);
          dupes.push(this.game.playerList[j]);
        }else{
          continue;
        }
      }
      if(!dupes.includes(currPlayer)){uniqueVals.push(currPlayer);}
    }
    return uniqueVals;
  }

  getHighestValPlayer(uniqueValPlayers){
    var highestVal = 0;
    var highestPlayer;
    for(let player of uniqueValPlayers){
      if(player.currCard.getValue() > highestVal){
        highestVal = player.currCard.getValue();
        highestPlayer = player;
      }else{
        continue;
      }
    }return highestPlayer;
  }

  getLowestValPlayer(uniqueValPlayers){
    var lowestVal = Infinity;
    var lowestPlayer;
    for(let player of uniqueValPlayers){
      if(player.currCard.getValue() < lowestVal){
        lowestVal = player.currCard.getValue();
        lowestPlayer = player;
      }else{
        continue;
      }
    }return lowestPlayer;
  }

}//end turn class

module.exports = {
  turnSim
};
