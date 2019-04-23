const cloneDeep = require('../node_modules/lodash/cloneDeep');
const { State } = require("./state.js");
const { monteCarlo } = require("./monteCarlo.js");
const countBy = require('../node_modules/lodash/countBy');
const pickBy = require('../node_modules/lodash/pickBy');
const { opponent } = require('./opponents.js');
const stringSimilarity = require('../node_modules/string-similarity');
const sumService = require('../node_modules/@haensl/subset-sum');

var console = {};
console.log = function(){};

class predictor{

    //predict ai move based on opponent responses
    constructor(turn, aiPlayer){
        this.frozenTurn = cloneDeep(turn); //do not touch
        this.aiCopy = cloneDeep(aiPlayer); //do not touch

        this.turn = cloneDeep(this.frozenTurn); //turn to use predictions for
        this.aiPlayer = aiPlayer; //player that will be using the prediction
        this.aiCards = this.aiPlayer.mCards.getVals();
        this.state = new State(this.turn); //important turn properties
        this.newSimGame = null; //simulated instance of the game

        this.opponents = this.turn.game.getOtherPlayerNames(aiPlayer); //name list of opponents
        this.pModels = this.turn.game.playerModels; //opponent responses
        this.totalPrize = null;

        //model data
        this.oppoData = [];

        //simulation results
        this.winningCards = null;
        this.winCardsCount = null;
        this.losingCards = null;
        this.NumOfResponses = 0;
        this.totalSimilarity = 0;
        this.avgSimilarity = 0;
        this.closestResponse = null;
        this.overallWinChance = 0;

        //CHOSEN CARD RESULT
        this.chosenCard = null;
        this.bestMove = null;
    }

    //after a simulation, the state must be reset back to original
    //so we can run multiple simulations using the same turn information
    resetPredictor(){
        this.turn = cloneDeep(this.frozenTurn);
        this.aiPlayer = cloneDeep(this.playerCopy);
        this.state = new State(this.turn); //state holds important turn properties
        this.newSimGame = null; //holds gameSim instance

        this.opponents = this.turn.game.getOtherPlayerNames(this.aiPlayer); //name list of opponents
        this.pModels = this.turn.game.playerModels; //opponent responses

        this.winningCards = null;
        this.losingCards = null;
        this.NumOfResponses = 0;
        this.totalSimilarity = 0;
        this.avgSimilarity = 0;
        this.closestResponse = null;
        this.overallWinChance = 0;
        this.oppoData = [];
        this.totalPrize = null;

        this.bestMove = null;
        this.chosenCard = null;
    }

    //returns list of players that can win the game in current state
    whoCanWinTheGame(){
        let allPlayers = this.state.playerList;
        let playersThatCanWin = [];
        for(let player of allPlayers){
            if(this.canWin(player) > 0){
                playersThatCanWin.push(player);
            }
        }
        return playersThatCanWin;
    }

    //returns true or false
    //shallow canWin
    //--> tests whether player can win if opponents only play their lowest cards
    //--> creates list of cards with winCount (choosing the card resulted in a win)
    //--> creates list of likely opponent moves
    canWin(player, totalPrize){
        this.totalPrize = totalPrize;
        let canWins = this.runSim(0, player, 1000);  //returns simWins/simRuns
        this.winCardsCount = countBy(this.winningCards);
        console.log("Overall Winning Chance: " + canWins + "\nLosing Choices: " + this.getLosingCards(this.winningCards));
        console.log("Card Win Counts:" + JSON.stringify(this.winCardsCount));

        this.likelyOpponentMoves(function(self){
            return self.pModels.forEach(self.aggregateData, self);
        });
        return this.bestMove;
    }

    likelyOpponentMoves(func){
        var self = this;
        func(self);
        this.getLikelyValues(this.totalPrize);
    }

    runSim(simType, player, numOfSims){
        let simRuns = 0;
        let mc = new monteCarlo(this.turn, player);
        if(simType === 0){
            while(simRuns < numOfSims){
                mc.predictionSim(simType);
                mc.resetMC();
                this.winningCards = mc.winningCards;
                simRuns++;
            }this.overallWinChance = mc.simWins/simRuns;
            return this.overallWinChance;
        }
    }

    getLosingCards(winningArr){
        let cards = this.aiPlayer.mCards.getVals();
        var losingArr = [];
        for(let val of cards){
            if(!winningArr.find(el => el === val)){
                losingArr.push(val);
            }
        }return losingArr;
    }

    predictBestMove(player){
        function diff(a,b){return Math.abs(a-b);}
        var scoreDiff = diff(this.aiPlayer.currScore, player.currScore)
        //console.log("Score Diff: " + scoreDiff);
        //rules
        //emergency!! if winchance drops too low, ai must get all cards in any of the returned combos
        if(scoreDiff > 0 && this.overallWinChance < 0.2){
            let posWinningArrs = this.posCardsRemoveDiff(scoreDiff); //returns array of possible card combinations that add to scoreDiff+1.
            let negWinningArrs = this.negCardsRemoveDiff(scoreDiff);
            console.log(posWinningArrs);
            console.log(negWinningArrs);
            let currentPrize = this.totalPrize
            if(posWinningArrs.some(arr => arr.some(el => el === this.totalPrize))){
                //console.log("Highest Win Card: " + this.getHighestWinCard(player.probableChoice,));
                this.chosenCard = this.getHighestWinCard(player.probableChoice);
                console.log("chose option -2 " + this.chosenCard)
                return this.chosenCard;
            }else if(negWinningArrs.some(arr => arr.some(el => el === this.totalPrize))){
                //console.log("Highest Win Card: " + this.getHighestWinCard(player.probableChoice,));
                this.chosenCard = this.getHighestWinCard(player.probableChoice);
                console.log("chose option -1 " + this.chosenCard)
                return this.chosenCard;
            }
        }

        //if we predict the player will play a high card we don't have one higher and we don't have the same- we will save our high cards and play our lowest.
        if(!this.haveHigher(player.probableChoice, this.aiCards) && !this.haveSame(player.probableChoice, this.aiCards)){
            this.chosenCard = this.getLowestCard(this.aiCards);
            console.log("chose option 0 " + this.chosenCard)
            return this.chosenCard;
        }
        var opHasHigherThanProb = this.getHighestCard(player.currHand) > player.probableChoice
        var aiHasHigherThanProb = this.getHighestCard(this.aiCards) > player.probableChoice
        const margin = 5 //minimum ideal difference to keep between player and ai score - if the player wants to win

        //if ai win's prize and player has less score
        if (player.currScore <= (this.aiPlayer.currScore + Math.abs(this.totalPrize))){
            if (!opHasHigherThanProb && !aiHasHigherThanProb) {  //if op/ai don't have higher than prob:
                this.chosenCard = this.getHighestWinCardDodgeRoll(this.aiCards, 1) //play close to the same
                console.log("chose option 1 " + this.chosenCard)
                return this.chosenCard
            } else if (opHasHigherThanProb && !aiHasHigherThanProb) { //if ai don't have higher than prob:
                this.chosenCard = this.getLowestCard(this.aiCards)  //save cards, because op will probably get it
                console.log(this.totalPrize)
                console.log("chose option 2 " + this.chosenCard)
                return this.chosenCard
            } else if (!opHasHigherThanProb && aiHasHigherThanProb) { //if ai has higher than prob, but op doesn't
                this.chosenCard = this.getHighestWinCardDodgeRoll(player.probableChoice, 0) //choose highest winratio card that is higher than probable
                console.log("chose option 3 " + this.chosenCard)
                return this.chosenCard
            }else { // both have higher the probable
                this.chosenCard = this.getHighestWinCardDodgeRoll(player.probableChoice, 0) //choose highest winratio card that is higher than probable
                console.log("chose option 4 " + this.chosenCard)
                return this.chosenCard
            }
        //if ai win's prize and player still has higher score than margin
        } else if ((player.currScore - (this.aiPlayer.currScore + Math.abs(this.totalPrize))) >= margin){
            if (!opHasHigherThanProb && !aiHasHigherThanProb) {  //if op/ai don't have higher than prob:
                this.chosenCard = this.getHighestWinCardDodgeBack(player.probableChoice, 1) //play a little lower than probable
                console.log("chose option 7 " + this.chosenCard)
                return this.chosenCard
            } else if (opHasHigherThanProb && !aiHasHigherThanProb) { //if ai don't have higher than prob:
                this.chosenCard = this.getLowestCard(this.aiCards)  //save cards, because op will probably get it
                console.log("chose option 8 " + this.chosenCard)
                return this.chosenCard
            } else if (!opHasHigherThanProb && aiHasHigherThanProb) { //if ai has higher than prob, but op doesn't
                this.chosenCard = this.getHighestWinCardDodgeRoll(player.probableChoice, 0) //player a little higher than probable
                console.log("chose option 9 " + this.chosenCard)
                return this.chosenCard
            } else { //both have higher than prob
                this.chosenCard = this.getHighestWinCardDodgeRoll(player.probableChoice, 0) //player a little higher than probable
                console.log("chose option 10 " + this.chosenCard)
                return this.chosenCard
            }
        } else {
            this.chosenCard = this.getHighestWinCardDodgeRoll(player.probableChoice, 1) //choose highest winratio card that is higher than probable
            console.log("chose option 11 " + this.chosenCard)
            return this.chosenCard
        }

    }

    haveHigher(card, arr){
        var haveHigher = false;
        for(let val of arr){
            if(val > card){
                haveHigher = true;
            }
        }return haveHigher;
    }

    haveSame(card, arr){
        var haveSame = false;
        for(let val of arr){
            if(val === card){
                haveSame = true;
            }
        }return haveSame;
    }


    strToNums(arr){
        var numArr = [];
        for(let el of arr){
            numArr.push(parseInt(el));
        }return numArr;
    }

    getLowestCard(cards){
        var ascSortedCards = cards.sort((a, b) => a - b)
        if (ascSortedCards != []) {
            return ascSortedCards[0] //return first card
        } else {
            console.log("can't get lowest card: none left")
        }
    }

    getHighestCard(cards){
        var ascSortedCards = cards.sort((a, b) => a - b)
        if (ascSortedCards != []) {
            return ascSortedCards[ascSortedCards.length-1] //return last card
        } else {
            console.log("can't get highest card: none left")
        }
    }

    getHighestWinCard(){
        var winCount = 0
        var highestWinCard = null
        for (let card in this.winCardsCount) {
            if (this.winCardsCount[card] > winCount) {
                winCount = this.winCardsCount[card]
                highestWinCard = parseInt(card)
            }
        }
        if (highestWinCard === null){
            highestWinCard = this.getHighestCard(this.aiCards)
        }
        return this.closestValInArray(this.aiCards, highestWinCard)
    }

    //get card with highest win ratio, while not being equal to avoidCard
    getHighestWinCardDodge(avoidCard){
        var winCount = 0
        var highestWinCard = null
        for (let card in this.winCardsCount) {
            if (this.winCardsCount[card] > winCount && parseInt(card) !== avoidCard) {
                winCount = this.winCardsCount[card]
                highestWinCard = parseInt(card)
            }
        }
        return this.closestValInArray(this.aiCards, highestWinCard)
    }

    //get card with highest win ratio, while being greater than avoidCard+margin
    getHighestWinCardDodgeRoll(avoidCard, margin){
        var winCount = 0
        var highestWinCard = null
        for (let card in this.winCardsCount) {
            if (this.winCardsCount[card] > winCount && parseInt(card) > (avoidCard + margin)) {
                winCount = this.winCardsCount[card]
                highestWinCard = parseInt(card)
            }
        }
        return this.closestValInArray(this.aiCards, highestWinCard)
    }
    //get card with highest win ratio, while being less than avoidCard+margin
    getHighestWinCardDodgeBack(avoidCard, margin){
        var winCount = 0
        var highestWinCard = null
        for (let card in this.winCardsCount) {
            if (this.winCardsCount[card] > winCount && (parseInt(card) < (avoidCard + margin))) {
                winCount = this.winCardsCount[card]
                highestWinCard = parseInt(card)
            }
        }
        return this.closestValInArray(this.aiCards, highestWinCard)
    }

    //returns array with only positive nums
    getOnlyPositive(arr){
        let onlyPositive = [];
        for(let num of arr){
            if (num > 0){
                onlyPositive.push(num);
            }
        }return onlyPositive;
    }

    //returns array with only negative nums
    getOnlyNegative(arr){
        let onlyNegative = [];
        for(let num of arr){
            if (num < 0){
                onlyNegative.push(Math.abs(num));
            }
        }return onlyNegative;
    }

    //returns positive card winning combos
    posCardsRemoveDiff(difference, max){
        let posWinningCombos = []
        const solver = sumService.subsetSum(this.getOnlyPositive(this.turn.game.prizes.getValsSorted().concat([this.totalPrize])), difference, max);
        for (let solution of solver) {
            posWinningCombos.push(solution);
        }return posWinningCombos;
    }

    //returns negative card winning combos
    negCardsRemoveDiff(difference, max){
        let negWinningCombos = []
        const solver = sumService.subsetSum(this.getOnlyNegative(this.turn.game.prizes.getValsSorted().concat([this.totalPrize])), difference, max);
        for (let solution of solver) {
            negWinningCombos.push(solution.map(x=> x*(-1)));
        }return negWinningCombos;
    }

    //gets most likely op moves
    //then gets probable move
    //then looks for best move for ai
    getLikelyValues(totalPrize){
        var actualPlayers = this.turn.game.playerList;
        //var closestPrizeToTotal = this.closestValInArray((this.turn.game.prizes.getVals()), totalPrize);
        //console.log(closestPrizeToTotal);
        for(let player of this.oppoData){
            if(this.pModels.get(player.name).responses.has(totalPrize)){

                var actualOppo = actualPlayers.find(el => el.name === player.name);
                let likelyMoves = countBy(player.pMoves);
                let likelyMovesCount = pickBy(likelyMoves, function(value, key){
                    return actualOppo.mCards.getVals().includes(parseInt(key));
                });
                likelyMoves = Object.keys(likelyMovesCount).map(Number);

                player.likelyMoves = likelyMoves;
                console.log(player.name + "'s likely moves: " + player.likelyMoves);


                if(player.pScores.length > 0){
                    var closestScore = this.closestValInArray(player.pScores, actualOppo.currScore);
                    player.closestScore = closestScore;
                    console.log(player.name + "'s Current Score: " + actualOppo.currScore + "\nClosest past score: " + player.closestScore);
                }else{
                    console.log(player.name + "'s Current Score: " + actualOppo.currScore)
                }

                let closestHand = this.fuzzyArrayFinder(actualOppo.mCards.getVals(), player.pHands);
                player.closestHand = closestHand;
                //console.log("Closest Hand: " + player.closestHand);

                let closestPrizes= this.fuzzyArrayFinder(this.turn.game.prizes.getValsSorted(), player.pPrizes);
                player.closestPrizes = closestPrizes;
                //console.log("Closest Prizes: " + player.closestPrizes);
                let otherPlayers = player.pPlayers;

                let closestTotalPrize = this.closestValInArray(player.pTotalPrizes, this.totalPrize);
                player.closestTotalPrize = closestTotalPrize;
                //console.log("Current total prize: " + this.totalPrize+ "\nClosest past total prize: " + player.closestTotalPrize);

                //set relevant stats
                player.currHand = actualOppo.mCards.getVals();
                player.currScore = actualOppo.currScore;
                player.totalPrize = this.totalPrize;

                let fuzzyBestMatchValues = [closestHand, closestScore, otherPlayers, closestPrizes, closestTotalPrize];
                //console.log(fuzzyBestMatchValues);
                let joinedVals = fuzzyBestMatchValues.join(',');

                for(let response of player.pResponses){
                    var deconstructedResponse = [response.handAtResp, response.scoreAtResp, response.prizesAtResp, response.totalTurnPrize];
                    var joinedDeconstructed = deconstructedResponse.join(',');
                    var tempSimilarity = stringSimilarity.compareTwoStrings(joinedVals, joinedDeconstructed);
                    if(tempSimilarity > this.avgSimilarity){
                        this.totalSimilarity += tempSimilarity;
                        this.NumOfResponses++;
                        this.avgSimilarity = this.totalSimilarity/this.NumOfResponses;
                        this.closestResponse = response;
                    }
                }
                var predictedVal = this.closestResponse['cardSelected']['value'];
                if(this.closestResponse != null && !this.haveSame(predictedVal, actualOppo.mCards.getVals())){
                    let closestPredictedValInHand = this.closestValInArray(actualOppo.mCards.getVals(), predictedVal);
                    console.log("Predicted Value= " + closestPredictedValInHand);
                    player.probableChoice = closestPredictedValInHand;
                }else{
                    console.log("Predicted Value= " + predictedVal);
                    player.probableChoice = predictedVal;
                }
            }
            this.bestMove = this.predictBestMove(player);
        }
    }

    //finds array length closest to 'array'.length in set of 'arrays'
    closestLengthArray(array, arrays){
        let len = array.length;
        let lens = []
        for(let arr of arrays){
            lens.push(arr.length);
        }
        let closestLength = this.closestValInArray(lens, len);
        return closestLength;
    }

    fuzzyArrayFinder(array, arrays){
        let closestLengthArrays = [];
        let closestLength = this.closestLengthArray(array, arrays);
        for(let arr of arrays){
            if(arr.length === closestLength){
                closestLengthArrays.push(arr);
            }
        }
        var intersectArray = [];
        var fuzzyArray = [];
        var evenFuzzierArray = [];
        for(let i=0; i<closestLengthArrays.length; i++){
            for(let j=0; j<closestLength; j++){
                if(array[j] === closestLengthArrays[i][j] && intersectArray.indexOf(closestLengthArrays[i][j]) === -1){
                    intersectArray = closestLengthArrays[i];
                }
                //max difference between values is 2
                if(Math.abs(closestLengthArrays[i][j]-array[j]) < 3 && fuzzyArray.indexOf(closestLengthArrays[i][j]) === -1){
                    fuzzyArray = closestLengthArrays[i];
                }

                if(Math.abs(closestLengthArrays[i][j]-array[j]) < 5 && evenFuzzierArray.indexOf(closestLengthArrays[i][j]) === -1){
                    evenFuzzierArray = closestLengthArrays[i]
                }
            }
        }
        let threeArrays = [intersectArray, fuzzyArray, evenFuzzierArray];
        let threeArrayLengths = [intersectArray.length, fuzzyArray.length, evenFuzzierArray.length];
        let closestFuzzyLengthArr = this.closestValInArray(threeArrayLengths, closestLength, 2);
        let closestArrayIndex = threeArrayLengths.indexOf(closestFuzzyLengthArr);
        return threeArrays[closestArrayIndex].sort(function(a, b) {
            return a - b;
          });
    }

    //returns value in 'array' that is closest to 'num'
    closestValInArray(array, num, minDiff){
        if(array === []){
            return num;
        }
        var i=0;
        var minDiff=60 || minDiff;
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

    //splices apart op's prize responses and creates an 'oppo' object with the spliced data
    aggregateData(value, key, map){
        let player = key; //player name
        //value == allResponse: [], responses: map {prize => {...}}
        let prize = this.totalPrize;
        let prizeResponses = value.responses.get(prize); //prize Responses
        var parsedResponses = []
        if(prizeResponses != null){
            for (let response of prizeResponses){
                parsedResponses.push(JSON.parse(response))
            };
        }
        let pastMoves = this.getMoves(parsedResponses);
        let pastScores = this.getScores(parsedResponses);
        let pastHands = this.getHand(parsedResponses);
        let pastPrizes = this.getPrizes(parsedResponses);
        let pastTotalPrizes = this.getTotalTurnPrize(parsedResponses);
        //let pastPlayers = this.getPlayers(parsedResponses);
        let pastResponses = parsedResponses;
        let oppo = new opponent(player, pastMoves, pastScores, pastHands, pastPrizes, null, pastResponses, pastTotalPrizes);
        this.oppoData.push(oppo);
        //console.log("Past Moves: " + moves + "\nPast Scores: " + scores);
    }

    //Getters for pModel Data
    getMoves(arr){
        let moves = [];
        for(let response of arr){
            moves.push(response['cardSelected']['value']);
        }
        return moves;
    }

    getScores(arr){
        let scores = [];
        for(let response of arr){
            scores.push(response['scoreAtResp']);
        }
        return scores;
    }
    getHand(arr){
        let hand = [];
        for(let response of arr){
            hand.push(response['handAtResp']);
        }
        return hand;
    }
    getPrizes(arr){
        let prizesLeft = [];
        for(let response of arr){
            prizesLeft.push(response['prizesAtResp']);
        }
        return prizesLeft;
    }

    getPlayers(arr){
        var otherPlayers = [];
        for(let response of arr){
            let val = response['playersAtResp'];
            if(!otherPlayers.some(el => el === val) && val.length === this.turn.game.playerList.length-1){
                otherPlayers.push(response['playersAtResp']);
            }
        }
        //console.log(otherPlayers);
        return otherPlayers;
    }

    getTotalTurnPrize(arr){
        let totalTurnPrizes = [];
        for(let response of arr){
            totalTurnPrizes.push(response['totalTurnPrize']);
        }
        return totalTurnPrizes;
    }



}

module.exports = {
    predictor
  };