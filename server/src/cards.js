let prizeCards = [
  ['Pile Of Shit',-5],
  ['Rat Droppings',-4],
  ['Chewed Up Gum',-3],
  ['Coal',-2],
  ['Banana Peel',-1],
  ['Fake Mona Lisa',1],
  ['Top hat',2],
  ['Fools Gold',3],
  ['Casio Calculator',4],
  ['The Best Haircut',5],
  ['Airpods',6],
  ['A Quick Vacation',7],
  ['Tesla Model S',8],
  ['Old Private Jet',9],
  ['The Ability To Read Minds',10],
];

let moneyCards = [
  ['1k',1],
  ['2k',2],
  ['3k',3],
  ['4k',4],
  ['5k',5],
  ['6k',6],
  ['7k',7],
  ['8k',8],
  ['9k',9],
  ['10k',10],
  ['11k',11],
  ['12k',12],
  ['13k',13],
  ['14k',14],
  ['15k',15],
];

class Card{

  constructor(name, value){
    this.name = name;
    this.value = value;
  }

  getName(){
    return this.name;
  }

  getValue(){
    return this.value;
  }

}//end Card class

//generic class to create a deck of cards given a 2d dict with values: [name,val]
class Deck{

  constructor(){
    this.deck = [];
  }

  cardExists(value){
    return this.deck.some(el => el.getValue() === value);
  }

  getCard(value){
    let cardExists = this.deck.some(el => el.getValue() === value);
    if(cardExists){
      let cardIndex = this.deck.findIndex(card => card.getValue() === value);
      return this.deck[cardIndex];
    }else{
      return this.getClosestCard(value);
    }
  }

  getClosestCard(value){
    let cardIndex = this.deck.findIndex(card => card.getValue() === this.closestValInArray(this.getVals(), value));
    return this.deck[cardIndex];
  }

  closestValInArray(array,num){
    var i=0;
    var minDiff=100;
    var ans;
    for(i in array){
         var m=Math.abs(num-array[i]);
         if(m<minDiff){ 
                minDiff=m; 
                ans=array[i]; 
            }
      }
    return ans;
  }

  getVals(){
    let valList = [];
    for (let val of this.deck){
      valList.push(val.getValue());
    }return valList;
  }

  getValsSorted(){
    let valList = [];
    for (let val of this.deck){
      valList.push(val.getValue());
    }return valList.sort();
  }

  getCardNames(){
    let nameList = [];
    for (let val of this.deck){
      nameList.push(val.getName());
    }return nameList;
  }

  createDeck(cardDict){
      for(var i=0; i<cardDict.length;i++){
        var cName = cardDict[i][0];
        var cVal = cardDict[i][1];
        this.deck.push(new Card(cName, cVal));
      }return this;
  }//end createDeck

  createMoneyCountDeck(){
    for(var i=0; i<moneyCards.length;i++){
      var cName = moneyCards[i][0];
      var cVal = moneyCards[i][1];
      var wins = 0;
      this.deck.push([new Card(cName, cVal), wins]);
    }return this;
  }

  //allow shuffling prize cards
  //credits to the Fisher-Yates (aka Knuth) Shuffle algorithm
  shuffle(){
    var currentIndex = this.deck.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = this.deck[currentIndex];
      this.deck[currentIndex] = this.deck[randomIndex];
      this.deck[randomIndex] = temporaryValue;
    }
    return this.deck;
  }//end shuffle

  //allow dealing one prize card each turn
  deal(){
    //removes and returns end card from deck 
    return this.deck.pop(); 
  }//end deal

  //creates a deck of money for a player
  createMoneyDeck(){
    this.createDeck(moneyCards);
    return this;
  }//end createMoneyDeck

  //create a deck of preshuffled prize Cards
  createPrizeDeck(){
    this.createDeck(prizeCards);
    this.shuffle();
    return this;
  }//end createPrizeDeck

}//end Deck class

module.exports = {
  Card,
  Deck
};
