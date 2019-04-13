

class opponent{

    constructor(name, pMoves, pScores, pHands, pPrizes, pPlayers, pResponses, pTotalPrizes){
        //heuristic data 
        this.name = name;
        this.pMoves = pMoves;
        this.pScores = pScores;
        this.pHands = pHands;
        this.pPrizes = pPrizes;
        this.pPlayers = pPlayers;
        this.pResponses = pResponses;
        this.pTotalPrizes = pTotalPrizes;

        //player stats
        this.currHand = [];
        this.currScore = 0;

        //other relevant stats
        this.totalPrize = 0; 

        //fuzzy data 
        this.likelyMoves = [];
        this.closestPastScore = 0;
        this.closestHand = [];
        this.closestPrizes = [];
        this.closestTotalPrize = 0;
        this.probableChoice = null;

    }
}

module.exports = {
    opponent
};