// The HUD and the overlay screens: start, pause, caught, escaped.
// One screen is visible at a time; the HUD always shows the live state.
export class Hud {
  constructor(doc) {
    this.doc = doc;
    this.alertValue = doc.getElementById('alert-value');
    this.alertFill = doc.getElementById('alert-fill');
    this.timerValue = doc.getElementById('timer-value');
    this.intelValue = doc.getElementById('intel-value');
    this.objectiveValue = doc.getElementById('objective-value');
    this.screens = {
      start: doc.getElementById('screen-start'),
      pause: doc.getElementById('screen-pause'),
      caught: doc.getElementById('screen-caught'),
      win: doc.getElementById('screen-win'),
    };
    this.winStats = doc.getElementById('win-stats');
    this.caughtStats = doc.getElementById('caught-stats');
  }

  showScreen(name) {
    for (const [key, el] of Object.entries(this.screens)) {
      el.hidden = key !== name;
    }
  }

  hideScreens() {
    for (const el of Object.values(this.screens)) el.hidden = true;
  }

  setAlert(suspicion, label) {
    const pct = Math.round(Math.max(0, Math.min(100, suspicion)));
    this.alertValue.textContent = label;
    this.alertFill.style.width = `${pct}%`;
    this.alertFill.classList.toggle('wary', pct >= 25 && pct < 100);
    this.alertFill.classList.toggle('alarm', pct >= 100);
  }

  setTimer(seconds) {
    const total = Math.floor(seconds);
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    this.timerValue.textContent = `${mm}:${ss}`;
  }

  setIntel(collected, total) {
    this.intelValue.textContent = `${collected} / ${total}`;
  }

  setObjective(text) {
    this.objectiveValue.textContent = text;
  }

  setWinStats({ time, intel, totalIntel, alerts, rating }) {
    this.winStats.textContent =
      `Escaped in ${time} — ledger pages ${intel} of ${totalIntel}, alarms raised ${alerts}. Rating: ${rating}.`;
  }

  setCaughtStats({ guardName, time, intel, totalIntel }) {
    this.caughtStats.textContent =
      `${guardName} caught you after ${time}, with ${intel} of ${totalIntel} ledger pages. Slip past the cones and try again.`;
  }
}
