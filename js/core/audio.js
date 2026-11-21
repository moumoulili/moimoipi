// =====================================================================
//  AUDIO 8-BIT (Web Audio, aucun fichier) : séquenceur de musique
//  (mélodie onde carrée, arpèges, basse triangle, batterie bruit blanc)
//  et petits effets sonores. Démarre au premier toucher (exigence iOS).
// =====================================================================
(function () {
  const A = {};
  let ctx = null, master, musicBus, sfxBus, noiseBuf, waves = {};
  let track = null, trackId = null, compiled = null, step = 0, nextTime = 0, timer = null, want = null;
  const S = () => (G.state ? G.state.settings : { music: true, musicVol: 0.5, sfx: true });
  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const midi = (n) => { const m = n.match(/^([A-G][#b]?)(\d)$/); return 12 * (+m[2] + 1) + NOTE[m[1]]; };
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function pulseWave(duty) {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  }
  A.unlock = function () {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      waves[0.125] = pulseWave(0.125); waves[0.25] = pulseWave(0.25); waves[0.5] = pulseWave(0.5);
      A.applyVolume();
    }
    if (ctx.state === 'suspended') ctx.resume();
    if (want) A.play(want);
  };
  A.applyVolume = function () {
    if (!ctx) return;
    musicBus.gain.setTargetAtTime(S().music ? 0.32 * S().musicVol : 0, ctx.currentTime, 0.1);
    sfxBus.gain.value = S().sfx ? 0.5 : 0;
  };

  // ---------- Compilation d'un thème en événements par pas ----------
  function chordNotes(name, oct) {
    const m = name.match(/^([A-G][#b]?)(m?)$/), r = 12 * (oct + 1) + NOTE[m[1]];
    return [r, r + (m[2] ? 3 : 4), r + 7, r + 12];
  }
  function compile(t) {
    const len = t.chords.length * 16, ev = [];
    for (let i = 0; i < len; i++) ev.push([]);
    // mélodie
    let pos = 0;
    for (const tok of t.lead.split(/\s+/)) {
      if (!tok || tok === '|') continue;
      const [n, d] = tok.split(':'), dur = +d;
      if (n !== '-') ev[pos % len].push({ v: 'lead', m: midi(n), d: dur });
      pos += dur;
    }
    t.chords.forEach((c, bar) => {
      const b0 = bar * 16, cn = chordNotes(c, 4), bn = chordNotes(c, 2);
      // arpèges
      const seq = [0, 1, 2, 3, 2, 1, 0, 1];
      if (t.arp === 'up8') for (let k = 0; k < 8; k++) ev[b0 + k * 2].push({ v: 'arp', m: cn[seq[k]], d: 2 });
      else for (let k = 0; k < 16; k++) ev[b0 + k].push({ v: 'arp', m: cn[[0, 1, 2, 3][k % 4]] + (k >= 8 ? 12 : 0), d: 1 });
      // basse
      if (t.bass === 'root4') [0, 4, 8, 12].forEach((s, k) => ev[b0 + s].push({ v: 'bass', m: k === 2 ? bn[2] : bn[0], d: 4 }));
      else for (let k = 0; k < 8; k++) ev[b0 + k * 2].push({ v: 'bass', m: k % 2 ? bn[0] + 12 : bn[0], d: 2 });
      // batterie
      const D = { soft: { k: [0, 8], s: [], h: [0, 4, 8, 12] }, march: { k: [0, 8], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
        battle: { k: [0, 3, 8, 11], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] } }[t.drums];
      D.k.forEach((s) => ev[b0 + s].push({ v: 'kick' }));
      D.s.forEach((s) => ev[b0 + s].push({ v: 'snare' }));
      D.h.forEach((s) => ev[b0 + s].push({ v: 'hat' }));
    });
    return { len, ev, stepDur: 60 / t.bpm / 4 };
  }

  // ---------- Instruments ----------
  function tone(bus, type, f, t, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (typeof type === 'number') o.setPeriodicWave(waves[type]); else o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setValueAtTime(vol * 0.75, t + Math.min(0.06, dur * 0.4));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  }
  function noise(bus, t, dur, vol, hp) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.01);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.16);
  }
  function playEvent(e, t, sd) {
    const v = track.vol || 1;
    if (e.v === 'lead') tone(musicBus, track.wave, freq(e.m), t, e.d * sd * 0.95, 0.22 * v);
    else if (e.v === 'arp') tone(musicBus, 0.5, freq(e.m), t, e.d * sd * 0.7, 0.07 * v);
    else if (e.v === 'bass') tone(musicBus, 'triangle', freq(e.m), t, e.d * sd * 0.9, 0.3 * v);
    else if (e.v === 'kick') kick(t);
    else if (e.v === 'snare') noise(musicBus, t, 0.12, 0.25 * v, 1500);
    else if (e.v === 'hat') noise(musicBus, t, 0.03, 0.08 * v, 7000);
  }
  function scheduler() {
    if (!ctx || !compiled) return;
    while (nextTime < ctx.currentTime + 0.15) {
      for (const e of compiled.ev[step % compiled.len]) playEvent(e, nextTime, compiled.stepDur);
      nextTime += compiled.stepDur; step++;
    }
  }
  // change de thème ('camp', 'dungeon', 'boss')
  A.play = function (id) {
    want = id;
    if (!ctx || id === trackId) return;
    trackId = id; track = G.data.music[id]; compiled = compile(track);
    // petit fondu
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0, ctx.currentTime);
    A.applyVolume();
    step = 0; nextTime = ctx.currentTime + 0.1;
    if (!timer) timer = setInterval(scheduler, 25);
  };
  A.pause = () => { if (ctx && ctx.state === 'running') ctx.suspend(); };
  A.resume = () => { if (ctx && ctx.state === 'suspended') ctx.resume(); };

  // ---------- Effets sonores ----------
  A.sfx = function (id) {
    if (!ctx || !S().sfx) return;
    const t = ctx.currentTime;
    if (id === 'tink') tone(sfxBus, 0.25, 1320 + Math.random() * 200, t, 0.05, 0.25);
    else if (id === 'crit') { tone(sfxBus, 0.125, 1760, t, 0.06, 0.3); tone(sfxBus, 0.125, 2349, t + 0.04, 0.08, 0.25); }
    else if (id === 'break') { noise(sfxBus, t, 0.2, 0.6, 300); tone(sfxBus, 0.5, 523, t + 0.05, 0.08, 0.25); tone(sfxBus, 0.5, 784, t + 0.11, 0.12, 0.25); }
    else if (id === 'up' || id === 'craft') [523, 659, 784, 1047].forEach((f, k) => tone(sfxBus, 0.25, f, t + k * 0.07, 0.1, 0.25));
    else if (id === 'level') [392, 523, 659, 784, 1047].forEach((f, k) => tone(sfxBus, 0.25, f, t + k * 0.06, 0.12, 0.22));
    else if (id === 'loot') [880, 1175, 1568].forEach((f, k) => tone(sfxBus, 0.125, f, t + k * 0.08, 0.14, 0.22));
  };
  G.sys.audio = A;
})();
