Game.registerMod('cookie factory', {
  init() {
    this.interval = setInterval(this.tick.bind(this), 20);
    this.interval2 = setInterval(this.tick2.bind(this), 20);
    // this.interval3 = setInterval(this.calculateCpsps.bind(this), 5000);
    this.logs = [];
    this.putButton();
    this.inject();
    this.settings = {
      autoUpgrade: true
    };
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

        const menu = l('menu');
        menu.innerHTML = str;
        const centerArea = l('centerArea');
        centerArea.scrollTop = centerArea.scrollHeight;
      } else {
        UpdateMenu();
      }
    };
  },

  calculateCpsps() {
    const deltaCps = Game.unbuffedCps - this.lastCps;
    const deltaTime = Game.time - this.lastTime;
    const cpsps = deltaCps / deltaTime;

    this.log(`CpSpS: ${cpsps}`);
    this.lastCps = Game.unbuffedCps;
    this.lastTime = Game.time;
  },

  tick() {
    Game.ClickCookie({ preventDefault: () => { }, detail: 1 });
  },

  tick2() {
    try {
      if (this.settings.autoUpgrade) {
        let estimated = [];
        let notEstimated = [];

        for (const object of Game.ObjectsById) {
          const cpsPerPrice = object.cps(object) / object.getPrice();
          estimated.push({ item: object, cpsPerPrice, kind: 'building' });

          if (object.amount == 0) {
            break;
          }
        }

        for (const upgrade of Game.UpgradesInStore) {
          if (upgrade.name != 'One mind' && upgrade.pool != "toggle") {
            if (Game.cookies > upgrade.getPrice() || Game.unbuffedCps * 900 > upgrade.getPrice()) {
              const cpsPerPrice = this.estimateCpsPerPrice(upgrade);

              if (cpsPerPrice != null) {
                estimated.push({ item: upgrade, cpsPerPrice, kind: 'upgrade' });
              } else {
                notEstimated.push({ item: upgrade, kind: 'upgrade' });
              }
            } else {
              break;
            }
          }
        }

        estimated.sort((a, b) => b.cpsPerPrice - a.cpsPerPrice);
        notEstimated.sort((a, b) => a.item.getPrice() - b.item.getPrice());
        let thing = estimated[0];

        if (thing != null && Game.cookies > thing.item.getPrice()) {
          thing.item.buy();
          this.log(`Bought ${thing.kind} '${thing.item.name}', Price: ${thing.item.getPrice()}, CpsPerPrice: ${thing.cpsPerPrice}`);
        } else {
          thing = notEstimated[0];

          if (thing != null && Game.cookies > thing.item.getPrice() * 5) {
            thing.item.buy();
            this.log(`Bought ${thing.kind} '${thing.item.name}', Price: ${thing.item.getPrice()}`);
          }
        }
      }

      for (const shimmer of Game.shimmers) {
        shimmer.pop();
      }

      const santaPrice = Math.pow(Game.santaLevel + 1, Game.santaLevel + 1);

      if (Game.specialTabs.includes('santa') && Game.cookies > santaPrice * 5 && Game.santaLevel < 14) {
        Game.UpgradeSanta();
      }

      if (Game.specialTabs.includes('dragon')) {
        Game.UpgradeDragon();
      }

      let wrinklerCount = 0;

      for (const wrinkler of Game.wrinklers) {
        if (wrinkler.phase > 0) wrinklerCount++;
      }

      if (wrinklerCount == Game.getWrinklersMax()) {
        Game.CollectWrinklers();
      }

      if (Game.TickerEffect != 0 && Game.TickerEffect.type == 'fortune') {
        Game.tickerL.click();
      }

      if (Game.isMinigameReady(Game.Objects['Farm'])) {
        const garden = Game.Objects['Farm'].minigame;

        for (let y = 0; y < 6; y++) {
          for (let x = 0; x < 6; x++) {
            if (garden.isTileUnlocked(x, y)) {
              const tile = garden.getTile(x, y);
              const plant = garden.plantsById[0];

              if (tile[0] == 0 && garden.canPlant(plant)) {
                plant.l.click();
                garden.clickTile(x, y);
              }
            }
          }
        }
      }

      if (Game.isMinigameReady(Game.Objects['Wizard tower'])) {
        const grimoire = Game.Objects['Wizard tower'].minigame;

        if (grimoire.magicM == grimoire.magic) {
          const spell = grimoire.spells['hand of fate'];
          const cost = grimoire.getSpellCost(spell);

          if (grimoire.magic > cost) {
            grimoire.castSpell(spell);
          }
        }
      }
    } catch (error) {
      this.log(error);
    }
  },

  estimateCpsPerPrice(upgrade) {
    const cps = Game.unbuffedCps;

    if (upgrade.pool == 'cookie') {
      let mul;

      if (typeof (upgrade.power) == 'function') {
        mul = 1 + upgrade.power() * 0.01;
      } else {
        mul = 1 + upgrade.power * 0.01;
      }

      return (cps * mul - cps) / upgrade.getPrice();
    } else if (typeof (upgrade.tier) == 'number' && upgrade.tier >= 1 && upgrade.buildingTie != 0) {
      const inc = upgrade.buildingTie.storedTotalCps;
      return inc / upgrade.getPrice();
    } else if (upgrade.kitten == 1) {
      const milkMult = 1;
      const mul = (1 + Game.milkProgress * catMultipliers[upgrade.name] * milkMult);
      return (cps * mul - cps) / upgrade.getPrice();
    }

    return null;
  },

  log(text) {
    const now = new Date().toLocaleTimeString();
    this.logs.push(`[${now}] ${text}`);
    if (Game.onMenu == 'console') Game.UpdateMenu();
  }
});

const catMultipliers = {
  'Kitten helpers': 0.1,
  'Kitten workers': 0.125,
  'Kitten engineers': 0.15,
  'Kitten overseers': 0.175,
  'Kitten managers': 0.2,
  'Kitten accountants': 0.2,
  'Kitten specialists': 0.2,
  'Kitten experts': 0.2,
  'Kitten consultants': 0.2,
  'Kitten assistants to the regional manager': 0.175,
  'Kitten marketeers': 0.15,
  'Kitten analysts': 0.125,
  'Kitten executives': 0.115,
  'Kitten angels': 0.1,
  'Fortune #103': 0.05
}