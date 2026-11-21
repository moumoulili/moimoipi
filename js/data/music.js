// =====================================================================
//  MUSIQUE 8-BIT : 3 thèmes originaux (style JRPG rétro).
//  chords : un accord par mesure (16 pas = 1 mesure)
//  lead : « NOTE:durée » en pas (double croche), « - » = silence, « | » = barre de mesure (ignorée)
//  arp / bass / drums : motifs d'accompagnement (voir core/audio.js)
// =====================================================================
G.data.music = {
  // Le feu de camp : calme et chaleureux
  camp: { bpm: 92, wave: 0.25, vol: 0.9,
    chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'C', 'C'],
    lead: 'A4:4 C5:4 F5:6 E5:2 | D5:8 A4:4 F4:4 | Bb4:4 D5:4 F5:4 D5:4 | C5:6 E5:2 G5:4 E5:4 | ' +
      'F5:4 E5:2 D5:2 C5:8 | D5:4 F5:4 A5:6 G5:2 | F5:4 D5:4 Bb4:4 D5:4 | C5:12 -:4 | ' +
      'D5:4 E5:4 F5:4 A5:4 | Bb5:6 A5:2 G5:4 F5:4 | A5:4 G5:2 F5:2 C5:8 | E5:4 G5:4 C6:8 | ' +
      'D6:4 C6:4 A5:4 F5:4 | Bb5:4 A5:4 G5:4 D5:4 | E5:4 F5:4 G5:4 Bb5:4 | A5:4 G5:4 E5:4 C5:4',
    arp: 'up8', bass: 'root4', drums: 'soft' },
  // Les profondeurs : aventure et tension
  dungeon: { bpm: 128, wave: 0.125, vol: 0.85,
    chords: ['Am', 'F', 'G', 'Am', 'Am', 'F', 'Dm', 'E', 'F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'E'],
    lead: 'A4:2 E5:2 A5:4 G5:2 E5:2 D5:2 E5:2 | F5:6 E5:2 C5:4 A4:4 | G4:2 B4:2 D5:4 G5:4 F5:2 D5:2 | E5:12 -:4 | ' +
      'A5:4 G5:2 E5:2 C5:4 E5:4 | F5:4 A5:4 G5:4 F5:4 | D5:2 F5:2 A5:4 F5:2 D5:2 A4:4 | G#5:8 B5:4 E5:4 | ' +
      'C6:4 A5:4 F5:4 A5:4 | B5:4 G5:4 D5:4 G5:4 | E5:2 G5:2 B5:4 G5:4 E5:4 | A5:8 C6:4 A5:4 | ' +
      'F5:2 A5:2 D6:4 C6:2 A5:2 F5:4 | G5:2 B5:2 D6:4 B5:4 G5:4 | E5:4 G5:4 C6:4 E6:4 | D6:4 B5:4 G#5:4 E5:4',
    arp: 'up8', bass: 'drive8', drums: 'march' },
  // Le gardien : combat de boss
  boss: { bpm: 160, wave: 0.25, vol: 0.9,
    chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A'],
    lead: 'D5:2 D5:2 F5:2 D5:2 A5:4 G#5:2 A5:2 | Bb5:4 A5:2 G5:2 F5:4 D5:4 | C5:2 E5:2 G5:2 C6:2 Bb5:4 G5:4 | A5:2 C#6:2 E6:4 C#6:2 A5:2 E5:4 | ' +
      'F5:4 E5:2 D5:2 A5:4 D6:4 | D6:2 C6:2 Bb5:2 A5:2 Bb5:4 F5:4 | G5:2 Bb5:2 D6:4 C6:2 Bb5:2 A5:4 | A5:8 C#6:4 E6:4',
    arp: 'up16', bass: 'drive8', drums: 'battle' },
};
