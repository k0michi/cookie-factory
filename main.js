Game.registerMod('cookie factory', {
  init() {
    this.interval = setInterval(this.tick.bind(this), 20);
    this.interval2 = setInterval(this.tick2.bind(this), 100);
    this.logs = [];
    this.putButton();
    this.inject();
  },

  putButton() {
    l('game').insertAdjacentHTML('beforeend', '<a style="position: absolute;left: 0px;top: 0px;margin: 8px;font-size: 12px;z-index: 100000000;" class="smallFancyButton" id="openConsole">Console</a>');

    AddEvent(l('openConsole'), 'click', function () {
      Game.ShowMenu('console');
    });
  },

  inject() {
    const UpdateMenu = Game.UpdateMenu;
    const MOD = this;

    Game.UpdateMenu = () => {
      if (Game.onMenu == 'console') {
        let str = '';
        str += '<div class="close menuClose" ' + Game.clickStr + '="Game.ShowMenu();">x</div>';

        for (const log of MOD.logs) {
          str += `<div class="listing">${log}</div>`;
        }

        l('menu').innerHTML = str;
      } else {
        UpdateMenu();
      }
    };
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
      this.log(`Bought building '${objectToBuy.name}', Price: ${objectToBuy.price}, CpsPerPrice: ${maxCpsPerPrice}`);
    }

    for (const upgrade of Game.UpgradesInStore) {
      if (Game.cookies > upgrade.basePrice) {
        upgrade.buy();
        this.log(`Bought upgrade '${upgrade.name}', Price: ${upgrade.basePrice}`);
      }
    }

    for (const shimmer of Game.shimmers) {
      shimmer.pop();
      this.log(`Popped golden cookie '${shimmer.type}'`);
    }
  },

  log(text) {
    const now = new Date().toLocaleTimeString();
    this.logs.push(`[${now}] ${text}`);
    if (Game.onMenu == 'console') Game.UpdateMenu();
  }
});