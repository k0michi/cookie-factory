Game.registerMod("cookie factory", {
  init() {
    this.interval = setInterval(this.tick, 20);
    this.interval2 = setInterval(this.tick2, 100);
  },

  tick() {
    Game.ClickCookie({ preventDefault: () => { }, detail: 1 });
  },

  tick2() {
    let candidateObjects = [];

    for (let i = 0; i < Game.ObjectsById.length; i++) {
      const object = Game.ObjectsById[i];
      candidateObjects.push(object);

      if (object.amount == 0) {
        break;
      }
    }

    let objectToBuy;
    let maxCpsPerPrice = Number.MIN_VALUE;

    for (const object of candidateObjects) {
      const cpsPerPrice = object.storedCps / object.price;

      if (cpsPerPrice > maxCpsPerPrice) {
        objectToBuy = object;
        maxCpsPerPrice = cpsPerPrice;
      }
    }

    if (objectToBuy != null && Game.cookies > objectToBuy.price) {
      objectToBuy.buy();
    }

    for (const upgrade of Game.UpgradesInStore) {
      if (Game.cookies > upgrade.basePrice) {
        upgrade.buy();
      }
    }

    for (const shimmer of Game.shimmers) {
      shimmer.pop();
    }
  }
});