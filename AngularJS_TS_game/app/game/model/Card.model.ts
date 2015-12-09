module Poker {

    export class Card {

        constructor(public name:string) {

        }

        toString() {
            return this.name;
        }
    }

}