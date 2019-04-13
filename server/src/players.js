const { Deck } = require("./cards.js");


class Player{

  constructor(name, aiEnable){
    //each player has a name, aiStatus, money cards, score, and the currently selected card
    this.name = name;
    this.aiEnable = aiEnable;
    this.mCards = new Deck().createMoneyDeck(); //each player gets one deck of finite money
    this.numMcards = this.mCards.deck.length;
    this.currScore = 0; //default score is zero
    this.currCard = null; //card player has selected for the current turn
  }

  getName(){
    return this.name;
  }
  getCurrCard(){
    return this.currCard;
  }

  numOfMoneyCards(){
    return this.numMcards;
  }

  getmCardsDeck(){
    return this.mCards.deck;
  }


  //let player choose a money card
  chooseCard(){
    let chosenCard = null;
    chosenCard = this.chooseRandomMCard();
    return chosenCard;
  }//end chooseCard


  chooseRandomMCard(){
    //if(this.aiEnable === 0){
      let min = 0;
      let max = this.numMcards;
      let random = Math.floor(Math.random() * max) + min;
      let chosenCard = this.mCards.deck[random];
      this.mCards.deck.splice(random, 1);
      this.numMcards--; //decrement number of mcards remaining
      return chosenCard;
    /*}else{
      let min = 0;
      let max = this.numSimcards;
      let random = Math.floor(Math.random() * max) + min;
      let chosenCard = this.simCards.deck[random];
      this.mCards.deck.splice(random, 1);//remove chosenCard from hand
      this.numMcards--; //decrement number of mcards remaining
      return chosenCard;
    }*/
  }


}//end Player class

module.exports = {
  Player
};
