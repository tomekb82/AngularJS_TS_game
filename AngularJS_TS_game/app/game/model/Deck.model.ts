module Poker {

    export class Deck {

        static name:string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        private cards:Card[];

        constructor() {
            this.cards = [];
            this.createDeck();
        }

        createDeck() {
            var j:number;
            for (j = 0; j < Deck.name.length; j++) {
                    this.cards.push(new Card(Deck.name[j]));
            }
        }

        shuffle() {
            var i:number, j:number;
            for (i = 0; i < this.cards.length - 1; i++) {
                j = Math.floor(Math.random() * this.cards.length);
                var temp = this.cards[j];
                this.cards[j] = this.cards[i];
                this.cards[i] = temp;
            }
        }

        popCard() {
            return this.cards.pop();
        }

    }

}
