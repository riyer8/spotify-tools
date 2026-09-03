function layout(clips) {
  let cursor = 0;
  return clips.map((clip, i) => {
    const clipMs = clip.useToMs - clip.useFromMs;
    const overlapIn = i === 0 ? 0 : (clip.transitionIn?.durationMs || 0);
    const mixInMs = i === 0 ? 0 : Math.max(0, cursor - overlapIn);
    const mixOutMs = mixInMs + clipMs;
    cursor = mixOutMs;
    return {
      ...clip,
      n: i + 1,
      deck: i % 2 === 0 ? 'A' : 'B',
      mixInMs,
      mixOutMs,
    };
  });
}

function makeMix({ id, title, kicker, subtitle, legend, clips }) {
  const tracks = layout(clips);
  return {
    id,
    title,
    kicker,
    subtitle,
    legend,
    tracks,
    runtimeMs: tracks[tracks.length - 1].mixOutMs,
  };
}

const t = (partial) => partial;

export const MIXES = [
  makeMix({
    id: 'dg-queue',
    title: 'DG QUEUE',
    kicker: 'the spike',
    subtitle: 'Frat nostalgia with a Death Grips hole in the floor.',
    legend: 'Gold is frat / nostalgia. Red is the spike. Cream is the climb back.',
    clips: [
      t({
        id: 'dg-dsb', spotifyId: '4bHsxqR3GMrXTxEPLuK5ue',
        title: "Don't Stop Believin'", artists: ['Journey'], album: 'Escape',
        rooms: ['memories', 'happiness', 'freeways'], vibe: 'porch', bpm: 119, durationMs: 251000,
        useFromMs: 140000, useToMs: 251000,
        transitionIn: { type: 'cold-open', durationMs: 0, note: 'Cold open on the last-chorus stretch. The room has to agree this is a mix.' },
        transitionOut: { type: 'blend', durationMs: 15000, note: '15s blend on “streetlight people.”' },
      }),
      t({
        id: 'dg-brightside', spotifyId: '7oK9VyNzrYvRFo7nQEYkWN',
        title: 'Mr. Brightside', artists: ['The Killers'], album: 'Hot Fuss',
        rooms: ['pixie dust'], vibe: 'porch', bpm: 148, durationMs: 222000,
        useFromMs: 48000, useToMs: 170000,
        transitionIn: { type: 'blend', durationMs: 15000, note: 'Guitar riff over Journey’s last chorus.' },
        transitionOut: { type: 'blend', durationMs: 8000, note: '8s phrase blend into the BA-BA-BAA.' },
      }),
      t({
        id: 'dg-caroline', spotifyId: '6PHf8qq1n8mWplJ9nEZ9ED',
        title: 'Sweet Caroline', artists: ['Neil Diamond'], album: 'All-Time Greatest Hits',
        rooms: ['raw'], vibe: 'porch', bpm: 126, durationMs: 201000,
        useFromMs: 100000, useToMs: 201000,
        transitionIn: { type: 'blend', durationMs: 8000, note: 'Crowd-hook in. The frat password.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Fade-blend on “good times never seemed so good.”' },
      }),
      t({
        id: 'dg-feeling', spotifyId: '2H1047e0oMSj10dgp7p2VG',
        title: 'I Gotta Feeling', artists: ['Black Eyed Peas'], album: 'THE E.N.D.',
        rooms: ['nights', 'oth', "Stanny '26 <3"], vibe: 'house', bpm: 128, durationMs: 289000,
        useFromMs: 30000, useToMs: 155000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Night officially starts.' },
        transitionOut: { type: 'blend', durationMs: 16000, note: 'Phrase match into Kesha.' },
      }),
      t({
        id: 'dg-tiktok', spotifyId: '0HPD5WQqrq7wPWR7P7Dw1i',
        title: 'TiK ToK', artists: ['Kesha'], album: 'Animal',
        rooms: ['nostalgia', 'nights', 'raw'], vibe: 'house', bpm: 120, durationMs: 200000,
        useFromMs: 0, useToMs: 110000,
        transitionIn: { type: 'blend', durationMs: 16000, note: '2010 peak. Your nostalgia DNA.' },
        transitionOut: { type: 'echo-out', durationMs: 12000, note: 'Echo the “don’t stop” into Miley. Tempo is about to drop.' },
      }),
      t({
        id: 'dg-partyusa', spotifyId: '3E7dfMvvCLUddWissuqMwr',
        title: 'Party In The U.S.A.', artists: ['Miley Cyrus'], album: 'The Time Of Our Lives',
        rooms: ['nostalgia', 'ones i can probably karaoke to'], vibe: 'house', bpm: 96, durationMs: 202000,
        useFromMs: 40000, useToMs: 135000,
        transitionIn: { type: 'echo-out', durationMs: 12000, note: '120 → 96. Let the “yeah” land after the echo.' },
        transitionOut: { type: 'echo-out', durationMs: 10000, note: 'Echo out. Filter closed before Carly.' },
      }),
      t({
        id: 'dg-maybe', spotifyId: '3TGRqZ0a2l1LRblBkJoaDx',
        title: 'Call Me Maybe', artists: ['Carly Rae Jepsen'], album: 'Kiss',
        rooms: ['nostalgia', 'memories', 'nights'], vibe: 'house', bpm: 120, durationMs: 193000,
        useFromMs: 0, useToMs: 100000,
        transitionIn: { type: 'filter-sweep', durationMs: 10000, note: 'Filter sweep back up to 120.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Into Timber’s clap pattern.' },
      }),
      t({
        id: 'dg-timber', spotifyId: '3cHyrEgdyYRjgJKSOiOtcS',
        title: 'Timber', artists: ['Pitbull', 'Kesha'], album: 'Global Warming: Meltdown',
        rooms: ['nostalgia', 'nights'], vibe: 'house', bpm: 130, durationMs: 204000,
        useFromMs: 20000, useToMs: 120000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Country-frat. Clap pattern takes the wheel.' },
        transitionOut: { type: 'blend', durationMs: 8000, note: 'Last polite banger incoming.' },
      }),
      t({
        id: 'dg-tdfw', spotifyId: '67awxiNHNyjMXhVgsHuIrs',
        title: 'Turn Down for What', artists: ['DJ Snake', 'Lil Jon'], album: 'Turn Down for What',
        rooms: ['feaberry', 'nostalgia'], vibe: 'house', bpm: 100, durationMs: 213000,
        useFromMs: 45000, useToMs: 140000,
        transitionIn: { type: 'blend', durationMs: 8000, note: 'Last song that still belongs at a house party.' },
        transitionOut: { type: 'hard-cut', durationMs: 0, note: 'Hard cut. Zero overlap. The trapdoor.' },
      }),
      t({
        id: 'dg-800', spotifyId: '2MLuFz9Y3Vg3PF0Yf93M5c',
        title: '800 db cloud', artists: ['100 gecs', 'Laura Les', 'Dylan Brady'], album: '1000 gecs',
        rooms: ["Stanny '26 <3"], vibe: 'spike', bpm: 140, durationMs: 140000,
        useFromMs: 0, useToMs: 80000,
        transitionIn: { type: 'hard-cut', durationMs: 0, note: 'Smash cut. Airlock into Death Grips.' },
        transitionOut: { type: 'smash', durationMs: 8000, note: 'Both decks full. Do not EQ this politely.' },
      }),
      t({
        id: 'dg-hacker', spotifyId: '7y8X0Z04gJCKtfrnSAMywJ',
        title: 'Hacker', artists: ['Death Grips'], album: 'The Money Store',
        rooms: ["Stanny '26 <3"], vibe: 'spike', bpm: 130, durationMs: 271000,
        useFromMs: 12000, useToMs: 160000,
        transitionIn: { type: 'smash', durationMs: 8000, note: 'The title event. Claimed the same second as 100 gecs, Feb 15 2022.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Same-artist grind so DG is not a cameo.' },
      }),
      t({
        id: 'dg-bedrooms', spotifyId: '5wtlMHHDKJuokR4a02thk2',
        title: 'Three Bedrooms In A Good Neighborhood', artists: ['Death Grips'], album: 'Bottomless Pit',
        rooms: ["Stanny '26 <3"], vibe: 'spike', bpm: 135, durationMs: 209000,
        useFromMs: 0, useToMs: 95000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Second DG punch. Dirtier, still in the hole.' },
        transitionOut: { type: 'rescue-blend', durationMs: 16000, note: 'The joke: industrial dust into a song everyone can scream.' },
      }),
      t({
        id: 'dg-prayer', spotifyId: '37ZJ0p5Jm13JPevGcx4SkF',
        title: "Livin' On A Prayer", artists: ['Bon Jovi'], album: 'Slippery When Wet',
        rooms: ['feaberry', 'walk'], vibe: 'rescue', bpm: 123, durationMs: 249000,
        useFromMs: 70000, useToMs: 200000,
        transitionIn: { type: 'rescue-blend', durationMs: 16000, note: 'Talkbox guitar is the rope out of the spike.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Lift into Queen. Lights up.' },
      }),
      t({
        id: 'dg-queen', spotifyId: '3lrNq7iGL5r3KS93YiKAbC',
        title: "Don't Stop Me Now", artists: ['Queen'], album: 'Greatest Hits',
        rooms: ['random songs to listen to'], vibe: 'rescue', bpm: 156, durationMs: 209000,
        useFromMs: 0, useToMs: 129000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Hands up. No more tricks.' },
        transitionOut: { type: 'fade', durationMs: 10000, note: '10s fade to black.' },
      }),
    ],
  }),

  makeMix({
    id: 'friday-night',
    title: 'FRIDAY NIGHT',
    kicker: '2010 nostalgia',
    subtitle: 'A Teenage Dream / Animal / Fame house mix stolen from nostalgia, nights, and speaker.',
    legend: 'Sky is 2008–2012 pop. Gold is the 2014 hangover. No spike — this one never leaves the party.',
    clips: [
      t({
        id: 'fn-dance', spotifyId: '2x7MyWybabEz6Y6wvHuwGE',
        title: 'Just Dance', artists: ['Lady Gaga', "Colby O'Donis"], album: 'The Fame',
        rooms: ['happiness', 'nights'], vibe: 'pop', bpm: 119, durationMs: 241000,
        useFromMs: 0, useToMs: 105000,
        transitionIn: { type: 'cold-open', durationMs: 0, note: 'Kick the lights on with The Fame. Everyone already knows the “na-na-na.”' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Same era, same Gaga crate — poker face on the four-count.' },
      }),
      t({
        id: 'fn-poker', spotifyId: '5R8dQOPq8haW94K7mgERlO',
        title: 'Poker Face', artists: ['Lady Gaga'], album: 'The Fame',
        rooms: ['speaker', 'nights', 'raw'], vibe: 'pop', bpm: 119, durationMs: 237000,
        useFromMs: 15000, useToMs: 125000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Keep the 119. This is one artist, two passwords.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Brush the synth into Kesha’s “wake up.”' },
      }),
      t({
        id: 'fn-tiktok', spotifyId: '0HPD5WQqrq7wPWR7P7Dw1i',
        title: 'TiK ToK', artists: ['Kesha'], album: 'Animal',
        rooms: ['nostalgia', 'nights', 'raw'], vibe: 'pop', bpm: 120, durationMs: 200000,
        useFromMs: 0, useToMs: 110000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'The song your nostalgia playlist is actually about.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Hand the floor to Teenage Dream.' },
      }),
      t({
        id: 'fn-td', spotifyId: '5jzKL4BDMClWqRguW5qZvh',
        title: 'Teenage Dream', artists: ['Katy Perry'], album: 'Teenage Dream',
        rooms: ['nostalgia', 'date', 'freeways'], vibe: 'pop', bpm: 120, durationMs: 227000,
        useFromMs: 0, useToMs: 115000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Do not skip the chorus. This is the title of the decade.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Snoop’s “california” is the next postcard.' },
      }),
      t({
        id: 'fn-gurls', spotifyId: '6tS3XVuOyu10897O3ae7bi',
        title: 'California Gurls', artists: ['Katy Perry', 'Snoop Dogg'], album: 'Teenage Dream: The Complete Confection',
        rooms: ['california', 'speaker'], vibe: 'pop', bpm: 125, durationMs: 234000,
        useFromMs: 20000, useToMs: 125000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'You have a playlist named california. Use it.' },
        transitionOut: { type: 'echo-out', durationMs: 10000, note: 'Echo the “oh-oh” into TGIF.' },
      }),
      t({
        id: 'fn-tgif', spotifyId: '3oHNJECGN3bBoGXejlw2b1',
        title: 'Last Friday Night (T.G.I.F.)', artists: ['Katy Perry'], album: 'Teenage Dream',
        rooms: ['nights', 'raw'], vibe: 'pop', bpm: 126, durationMs: 230000,
        useFromMs: 10000, useToMs: 120000,
        transitionIn: { type: 'echo-out', durationMs: 10000, note: 'This mix is named after this song, basically.' },
        transitionOut: { type: 'echo-out', durationMs: 10000, note: 'Tempo drop into Miley. Let the party bus arrive late.' },
      }),
      t({
        id: 'fn-usa', spotifyId: '3E7dfMvvCLUddWissuqMwr',
        title: 'Party In The U.S.A.', artists: ['Miley Cyrus'], album: 'The Time Of Our Lives',
        rooms: ['nostalgia', 'ones i can probably karaoke to'], vibe: 'house', bpm: 96, durationMs: 202000,
        useFromMs: 35000, useToMs: 130000,
        transitionIn: { type: 'echo-out', durationMs: 10000, note: 'Karaoke-list song. If they don’t sing, leave.' },
        transitionOut: { type: 'filter-sweep', durationMs: 12000, note: 'Sweep back to 120 for Carly.' },
      }),
      t({
        id: 'fn-maybe', spotifyId: '3TGRqZ0a2l1LRblBkJoaDx',
        title: 'Call Me Maybe', artists: ['Carly Rae Jepsen'], album: 'Kiss',
        rooms: ['nostalgia', 'memories', 'nights'], vibe: 'house', bpm: 120, durationMs: 193000,
        useFromMs: 0, useToMs: 105000,
        transitionIn: { type: 'filter-sweep', durationMs: 12000, note: 'Violin is the blend cue. 2012 in one gesture.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Nicki takes the spaceship.' },
      }),
      t({
        id: 'fn-starships', spotifyId: '1oHNvJVbFkexQc0BpQp7Y4',
        title: 'Starships', artists: ['Nicki Minaj'], album: 'Pink Friday ... Roman Reloaded',
        rooms: ['nostalgia', 'memories', 'speaker'], vibe: 'house', bpm: 125, durationMs: 210000,
        useFromMs: 15000, useToMs: 125000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Hands up. This is the peak of the 2012 block.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Timber’s country clap is the hangover joke.' },
      }),
      t({
        id: 'fn-timber', spotifyId: '3cHyrEgdyYRjgJKSOiOtcS',
        title: 'Timber', artists: ['Pitbull', 'Kesha'], album: 'Global Warming: Meltdown',
        rooms: ['nostalgia', 'nights'], vibe: 'house', bpm: 130, durationMs: 204000,
        useFromMs: 20000, useToMs: 120000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Kesha returns. Full-circle Animal energy.' },
        transitionOut: { type: 'blend', durationMs: 14000, note: 'Avicii is the 2013 sunrise.' },
      }),
      t({
        id: 'fn-wake', spotifyId: '0nrRP2bk19rLc0orkWPQk2',
        title: 'Wake Me Up', artists: ['Avicii'], album: 'True',
        rooms: ['nostalgia', 'freeways', 'nights'], vibe: 'house', bpm: 124, durationMs: 247000,
        useFromMs: 0, useToMs: 130000,
        transitionIn: { type: 'blend', durationMs: 14000, note: 'Folk-EDM handshake. Freeways playlist energy.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Bruno walks in like he owns 2015.' },
      }),
      t({
        id: 'fn-uptown', spotifyId: '32OlwWuMpZ6b0aN2RZOeMS',
        title: 'Uptown Funk (feat. Bruno Mars)', artists: ['Mark Ronson', 'Bruno Mars'], album: 'Uptown Special',
        rooms: ['nostalgia', 'speaker', 'nights'], vibe: 'house', bpm: 115, durationMs: 269000,
        useFromMs: 20000, useToMs: 150000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'The last song that still feels like Friday.' },
        transitionOut: { type: 'fade', durationMs: 12000, note: 'Let the horn lick die. Lights stay warm.' },
      }),
    ],
  }),

  makeMix({
    id: 'club',
    title: 'CLUB',
    kicker: 'from nights',
    subtitle: 'Usher through Daft Punk — the body of your nights playlist, not the sad songs.',
    legend: 'Magenta is 2000s club. Gold is the 2010s afterparty.',
    clips: [
      t({
        id: 'cl-yeah', spotifyId: '5rb9QrpfcKFHM1EUbSIurX',
        title: 'Yeah! (feat. Lil Jon & Ludacris)', artists: ['USHER', 'Lil Jon', 'Ludacris'], album: 'Confessions',
        rooms: ['nights', 'raw'], vibe: 'club', bpm: 105, durationMs: 250000,
        useFromMs: 20000, useToMs: 130000,
        transitionIn: { type: 'cold-open', durationMs: 0, note: 'The nights playlist password. If this doesn’t work, nothing will.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Apple Bottom jeans is the next sentence.' },
      }),
      t({
        id: 'cl-low', spotifyId: '0CAfXk7DXMnon4gLudAp7J',
        title: 'Low (feat. T-Pain)', artists: ['Flo Rida', 'T-Pain'], album: 'Mail on Sunday',
        rooms: ['nights', 'raw'], vibe: 'club', bpm: 128, durationMs: 231000,
        useFromMs: 0, useToMs: 105000,
        transitionIn: { type: 'blend', durationMs: 10000, note: '2008. The floor is already gone.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Timbaland stays on the boards for Nelly Furtado.' },
      }),
      t({
        id: 'cl-prom', spotifyId: '47aQT2aV12TyilaoYi1NiD',
        title: 'Promiscuous', artists: ['Nelly Furtado', 'Timbaland'], album: 'Loose',
        rooms: ['toxic', 'nights', 'raw'], vibe: 'club', bpm: 114, durationMs: 242000,
        useFromMs: 0, useToMs: 110000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Call-and-response. They will do the parts.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Timberlake is the same summer, louder jacket.' },
      }),
      t({
        id: 'cl-sexy', spotifyId: '4Lvc9SbPc0svm9TEoMgFzB',
        title: 'SexyBack (feat. Timbaland)', artists: ['Justin Timberlake', 'Timbaland'], album: 'FutureSex/LoveSounds Deluxe Edition',
        rooms: ['nostalgia', 'nights', 'raw'], vibe: 'club', bpm: 117, durationMs: 242000,
        useFromMs: 0, useToMs: 110000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'I’m bringing it. Do not talk over this.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Beyoncé is the promotion.' },
      }),
      t({
        id: 'cl-crazy', spotifyId: '5IVuqXILoxVWvWEPm82Jxr',
        title: 'Crazy In Love (feat. JAY-Z)', artists: ['Beyoncé', 'JAY-Z'], album: 'Dangerously In Love',
        rooms: ['nostalgia', 'nights', 'raw'], vibe: 'club', bpm: 99, durationMs: 236000,
        useFromMs: 0, useToMs: 115000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Horn hit is the mix point. If you miss it, restart.' },
        transitionOut: { type: 'blend', durationMs: 8000, note: 'Sasha Fierce is the sequel, not a new artist.' },
      }),
      t({
        id: 'cl-single', spotifyId: '2XmCxvapzwF0QDhauHEkhk',
        title: 'Single Ladies (Put a Ring on It)', artists: ['Beyoncé'], album: 'I AM...SASHA FIERCE',
        rooms: ['nostalgia', 'nights', 'raw'], vibe: 'club', bpm: 193, durationMs: 193000,
        useFromMs: 0, useToMs: 95000,
        transitionIn: { type: 'blend', durationMs: 8000, note: 'Hands. The choreography is the transition.' },
        transitionOut: { type: 'echo-out', durationMs: 10000, note: 'Echo the “oh” into Drake. Decade skip, same hips.' },
      }),
      t({
        id: 'cl-hotline', spotifyId: '0wwPcA6wtMf6HUMpIRdeP7',
        title: 'Hotline Bling', artists: ['Drake'], album: 'Views',
        rooms: ['nostalgia', 'nights', 'raw'], vibe: 'house', bpm: 135, durationMs: 267000,
        useFromMs: 0, useToMs: 110000,
        transitionIn: { type: 'echo-out', durationMs: 10000, note: '2015 afterparty. Dimmer lights, same nights playlist.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'One Dance is the 2016 continuation.' },
      }),
      t({
        id: 'cl-onedance', spotifyId: '1zi7xx7UVEFkmKfv06H8x0',
        title: 'One Dance', artists: ['Drake', 'Wizkid', 'Kyla'], album: 'Views',
        rooms: ['random songs to listen to'], vibe: 'house', bpm: 104, durationMs: 173000,
        useFromMs: 0, useToMs: 100000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Keep Drake on the A-deck. Don’t overthink it.' },
        transitionOut: { type: 'filter-sweep', durationMs: 14000, note: 'Open the filter into Nile Rodgers.' },
      }),
      t({
        id: 'cl-lucky', spotifyId: '69kOkLUCkxIZYexIgSG8rq',
        title: 'Get Lucky', artists: ['Daft Punk', 'Pharrell Williams', 'Nile Rodgers'], album: 'Random Access Memories',
        rooms: ['freeways', 'nights', 'raw'], vibe: 'house', bpm: 116, durationMs: 369000,
        useFromMs: 40000, useToMs: 160000,
        transitionIn: { type: 'filter-sweep', durationMs: 14000, note: 'Guitar disco. This is the grown version of Yeah!.' },
        transitionOut: { type: 'blend', durationMs: 16000, note: 'I gotta feeling is the circle back to the house.' },
      }),
      t({
        id: 'cl-feeling', spotifyId: '2H1047e0oMSj10dgp7p2VG',
        title: 'I Gotta Feeling', artists: ['Black Eyed Peas'], album: 'THE E.N.D.',
        rooms: ['nights', 'oth', "Stanny '26 <3"], vibe: 'house', bpm: 128, durationMs: 289000,
        useFromMs: 30000, useToMs: 155000,
        transitionIn: { type: 'blend', durationMs: 16000, note: 'Good night. You already opened another mix with this; here it’s the closer.' },
        transitionOut: { type: 'fade', durationMs: 12000, note: 'Fade before the last “woo-hoo.” Leave them wanting the porch mix.' },
      }),
    ],
  }),

  makeMix({
    id: 'texan',
    title: 'TEXAN',
    kicker: 'texan girl',
    subtitle: 'Tailgate crate from texan girl + the country you hid in raw.',
    legend: 'Terracotta is country. Gold is the bar-song peak.',
    clips: [
      t({
        id: 'tx-cruise', spotifyId: '0i5el041vd6nxrGEU8QRxy',
        title: 'Cruise', artists: ['Florida Georgia Line'], album: "Here's To The Good Times",
        rooms: ['texan girl', 'raw'], vibe: 'country', bpm: 148, durationMs: 209000,
        useFromMs: 0, useToMs: 110000,
        transitionIn: { type: 'cold-open', durationMs: 0, note: 'If the truck mix has a national anthem, this is it.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Sam Hunt keeps the night on.' },
      }),
      t({
        id: 'tx-leave', spotifyId: '3wx2kQWPn9p5UppQbNhPAk',
        title: 'Leave The Night On', artists: ['Sam Hunt'], album: 'Montevallo',
        rooms: ['texan girl'], vibe: 'country', bpm: 172, durationMs: 192000,
        useFromMs: 0, useToMs: 100000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Talk-sing into the chorus. Do not start on the verse.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'H.O.L.Y. is the slow-eyed cousin.' },
      }),
      t({
        id: 'tx-holy', spotifyId: '2tUJbvjNznjNZfCeKtkhGm',
        title: 'H.O.L.Y.', artists: ['Florida Georgia Line'], album: 'Dig Your Roots',
        rooms: ['texan girl'], vibe: 'country', bpm: 78, durationMs: 207000,
        useFromMs: 20000, useToMs: 125000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Let it breathe. This is the almost-ballad.' },
        transitionOut: { type: 'blend', durationMs: 8000, note: 'Snap back to dirt roads.' },
      }),
      t({
        id: 'tx-backroad', spotifyId: '7FpBQ067pHB67deawpbbcY',
        title: 'Body Like A Back Road', artists: ['Sam Hunt'], album: 'SOUTHSIDE',
        rooms: ['raw'], vibe: 'country', bpm: 98, durationMs: 165000,
        useFromMs: 0, useToMs: 95000,
        transitionIn: { type: 'blend', durationMs: 8000, note: 'Hidden in raw, not texan girl. Still yours.' },
        transitionOut: { type: 'blend', durationMs: 8000, note: 'Luke Bryan walks in for the dirt joke.' },
      }),
      t({
        id: 'tx-dirt', spotifyId: '69AIpwGNLxr4qS1X5ynx60',
        title: 'Buy Dirt', artists: ['Jordan Davis', 'Luke Bryan'], album: 'Buy Dirt',
        rooms: ['texan girl'], vibe: 'country', bpm: 178, durationMs: 167000,
        useFromMs: 0, useToMs: 100000,
        transitionIn: { type: 'blend', durationMs: 8000, note: 'Singalong country. Porch, not club.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Tequila is the actual bar.' },
      }),
      t({
        id: 'tx-tequila', spotifyId: '42fw0rxRO2xbesF6mJfd4Y',
        title: 'Tequila', artists: ['Dan + Shay'], album: 'Dan + Shay',
        rooms: ['texan girl'], vibe: 'country', bpm: 86, durationMs: 196000,
        useFromMs: 0, useToMs: 110000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Harmony country. The room gets softer, not sadder.' },
        transitionOut: { type: 'hard-cut', durationMs: 0, note: 'Hard cut into Wallen. Different Texas.' },
      }),
      t({
        id: 'tx-lastnight', spotifyId: '7K3BhSpAxZBznislvUMVtn',
        title: 'Last Night', artists: ['Morgan Wallen'], album: "One Thing At A Time",
        rooms: ['texan girl'], vibe: 'house', bpm: 204, durationMs: 163000,
        useFromMs: 0, useToMs: 95000,
        transitionIn: { type: 'hard-cut', durationMs: 0, note: 'Peak. This is the 2023 bar, not 2012.' },
        transitionOut: { type: 'smash', durationMs: 8000, note: 'Shaboozey is the same bar, newer paint.' },
      }),
      t({
        id: 'tx-bar', spotifyId: '7wd9kz7UXhJr8pgdqpzKu5',
        title: 'A Bar Song (Tipsy)', artists: ['Shaboozey'], album: 'Where I’ve Been, Isn’t Where I’m Going',
        rooms: ['texan girl'], vibe: 'house', bpm: 81, durationMs: 171000,
        useFromMs: 0, useToMs: 100000,
        transitionIn: { type: 'smash', durationMs: 8000, note: 'Everyone knows this whether they admit it or not.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Carrie is the original bar fight.' },
      }),
      t({
        id: 'tx-cheats', spotifyId: '0ZUo4YjG4saFnEJhdWp9Bt',
        title: 'Before He Cheats', artists: ['Carrie Underwood'], album: 'Some Hearts',
        rooms: ['texan girl'], vibe: 'country', bpm: 148, durationMs: 199000,
        useFromMs: 20000, useToMs: 130000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'The baseball bat. Do not blend this politely at the chorus.' },
        transitionOut: { type: 'blend', durationMs: 8000, note: 'Kelsea keeps the bottle open.' },
      }),
      t({
        id: 'tx-bottle', spotifyId: '2yySWxfeRN2QRZnFMnYMQl',
        title: 'hole in the bottle', artists: ['Kelsea Ballerini'], album: 'kelsea',
        rooms: ['texan girl'], vibe: 'country', bpm: 90, durationMs: 158000,
        useFromMs: 0, useToMs: 95000,
        transitionIn: { type: 'blend', durationMs: 8000, note: 'Your texan girl playlist is mostly Kelsea. Let her close the party, not the sermon.' },
        transitionOut: { type: 'rescue-blend', durationMs: 14000, note: 'Thomas Rhett is the porch light.' },
      }),
      t({
        id: 'tx-happy', spotifyId: '5kNe7PE09d6Kvw5pAsx23n',
        title: 'Die A Happy Man', artists: ['Thomas Rhett'], album: 'Tangled Up',
        rooms: ['texan girl', 'raw'], vibe: 'rescue', bpm: 166, durationMs: 227000,
        useFromMs: 30000, useToMs: 140000,
        transitionIn: { type: 'rescue-blend', durationMs: 14000, note: 'Slow dance in a parking lot. End of the night, still country.' },
        transitionOut: { type: 'fade', durationMs: 12000, note: 'Fade on the last “die a happy man.” Keys out.' },
      }),
    ],
  }),

  makeMix({
    id: 'karaoke',
    title: 'KARAOKE',
    kicker: '13 songs you admitted',
    subtitle: 'Your actual karaoke list, treated as a set — not shuffled, sequenced.',
    legend: 'Pink is the booth. Gold is the crowd-pleaser. Red is the dare.',
    clips: [
      t({
        id: 'ka-holiday', spotifyId: '3ibAzRj9JnowdoLkyllk3n',
        title: 'Holiday', artists: ['Madonna'], album: 'Holiday',
        rooms: ['ones i can probably karaoke to'], vibe: 'karaoke', bpm: 118, durationMs: 240000,
        useFromMs: 0, useToMs: 100000,
        transitionIn: { type: 'cold-open', durationMs: 0, note: 'Warm the booth. Madonna is the least embarrassing first song.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Miley is why this playlist exists.' },
      }),
      t({
        id: 'ka-usa', spotifyId: '3E7dfMvvCLUddWissuqMwr',
        title: 'Party In The U.S.A.', artists: ['Miley Cyrus'], album: 'The Time Of Our Lives',
        rooms: ['ones i can probably karaoke to', 'nostalgia'], vibe: 'karaoke', bpm: 96, durationMs: 202000,
        useFromMs: 35000, useToMs: 135000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'You filed this under “probably.” That is a confession.' },
        transitionOut: { type: 'blend', durationMs: 8000, note: 'Selena says who says you can’t.' },
      }),
      t({
        id: 'ka-says', spotifyId: '3TcL0dyCMyr0kyTTc4NLgI',
        title: 'Who Says', artists: ['Selena Gomez & The Scene'], album: 'When The Sun Goes Down',
        rooms: ['ones i can probably karaoke to'], vibe: 'karaoke', bpm: 101, durationMs: 195000,
        useFromMs: 0, useToMs: 100000,
        transitionIn: { type: 'blend', durationMs: 8000, note: 'Middle-school voice. Keep it.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'The Climb is the key change of the night.' },
      }),
      t({
        id: 'ka-climb', spotifyId: '0V8FYVlBFuXXTIvRnMbZyS',
        title: 'The Climb', artists: ['Miley Cyrus'], album: 'Hannah Montana: The Movie',
        rooms: ['ones i can probably karaoke to'], vibe: 'karaoke', bpm: 80, durationMs: 237000,
        useFromMs: 40000, useToMs: 150000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Start at the climb, not the verse. This is karaoke, not a recital.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Adele is the real test.' },
      }),
      t({
        id: 'ka-rolling', spotifyId: '1c8gk2PeTE04A1pIDH9YMk',
        title: 'Rolling in the Deep', artists: ['Adele'], album: '21',
        rooms: ['ones i can probably karaoke to'], vibe: 'karaoke', bpm: 105, durationMs: 228000,
        useFromMs: 20000, useToMs: 140000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'If they can hit this, they can stay at the mic.' },
        transitionOut: { type: 'hard-cut', durationMs: 0, note: 'Hard cut. Cardi is the dare.' },
      }),
      t({
        id: 'ka-bodak', spotifyId: '6KBYefIoo7KydImq1uUQlL',
        title: 'Bodak Yellow', artists: ['Cardi B'], album: 'Invasion of Privacy',
        rooms: ['ones i can probably karaoke to'], vibe: 'spike', bpm: 125, durationMs: 223000,
        useFromMs: 0, useToMs: 95000,
        transitionIn: { type: 'hard-cut', durationMs: 0, note: 'The song you put on a karaoke list to prove something.' },
        transitionOut: { type: 'rescue-blend', durationMs: 12000, note: 'Rescue with Disney. That is the whole joke of this playlist.' },
      }),
      t({
        id: 'ka-world', spotifyId: '5viFjDGTnrApmUY5c8qkfw',
        title: 'A Whole New World', artists: ['Mena Massoud', 'Naomi Scott'], album: 'Aladdin (Original Motion Picture Soundtrack)',
        rooms: ['ones i can probably karaoke to'], vibe: 'rescue', bpm: 108, durationMs: 242000,
        useFromMs: 20000, useToMs: 130000,
        transitionIn: { type: 'rescue-blend', durationMs: 12000, note: 'Duet. Grab someone. Do not do both parts yourself unless you must.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Céline is the finale they think they want.' },
      }),
      t({
        id: 'ka-titanic', spotifyId: '33LC84JgLvK2KuW43MfaNq',
        title: 'My Heart Will Go On', artists: ['Céline Dion'], album: 'Titanic: Original Motion Picture Soundtrack',
        rooms: ['ones i can probably karaoke to'], vibe: 'rescue', bpm: 99, durationMs: 272000,
        useFromMs: 60000, useToMs: 180000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Start at the lift. Nobody came for the pennywhistle intro.' },
        transitionOut: { type: 'fade', durationMs: 14000, note: 'Fade before the last belt if the room is tired. Lights up either way.' },
      }),
    ],
  }),

  makeMix({
    id: 'porch',
    title: 'PORCH',
    kicker: 'everyone sings',
    subtitle: 'Journey through Queen. No trapdoors. The mix if the spike mix is too much.',
    legend: 'Gold is the handshake. Cream is the encore.',
    clips: [
      t({
        id: 'po-dsb', spotifyId: '4bHsxqR3GMrXTxEPLuK5ue',
        title: "Don't Stop Believin'", artists: ['Journey'], album: 'Escape',
        rooms: ['memories', 'happiness', 'freeways'], vibe: 'porch', bpm: 119, durationMs: 251000,
        useFromMs: 140000, useToMs: 251000,
        transitionIn: { type: 'cold-open', durationMs: 0, note: 'Streetlight people. Same open as DG QUEUE, different night.' },
        transitionOut: { type: 'blend', durationMs: 15000, note: 'Brightside is still the second handshake.' },
      }),
      t({
        id: 'po-bright', spotifyId: '7oK9VyNzrYvRFo7nQEYkWN',
        title: 'Mr. Brightside', artists: ['The Killers'], album: 'Hot Fuss',
        rooms: ['pixie dust'], vibe: 'porch', bpm: 148, durationMs: 222000,
        useFromMs: 48000, useToMs: 175000,
        transitionIn: { type: 'blend', durationMs: 15000, note: 'It was only a kiss. They will scream it.' },
        transitionOut: { type: 'blend', durationMs: 8000, note: 'Caroline is mandatory.' },
      }),
      t({
        id: 'po-caroline', spotifyId: '6PHf8qq1n8mWplJ9nEZ9ED',
        title: 'Sweet Caroline', artists: ['Neil Diamond'], album: 'All-Time Greatest Hits',
        rooms: ['raw'], vibe: 'porch', bpm: 126, durationMs: 201000,
        useFromMs: 100000, useToMs: 201000,
        transitionIn: { type: 'blend', durationMs: 8000, note: 'BA-BA-BAA. If they don’t, it is not a porch.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Buttercup is the older sibling.' },
      }),
      t({
        id: 'po-butter', spotifyId: '1tfZtA15BfJHQTUy3dqTKC',
        title: 'Build Me Up Buttercup', artists: ['The Foundations'], album: "Baby Now That I've Found You",
        rooms: ['happiness', 'raw'], vibe: 'porch', bpm: 134, durationMs: 177000,
        useFromMs: 0, useToMs: 105000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Mono mix. Clap on 2 and 4.' },
        transitionOut: { type: 'blend', durationMs: 10000, note: 'Backstreet is the 90s porch.' },
      }),
      t({
        id: 'po-thatway', spotifyId: '68y6OIiE1nDdI1MLQdJNh8',
        title: 'I Want It That Way', artists: ['Backstreet Boys'], album: 'The Essential Backstreet Boys',
        rooms: ['nostalgia', 'raw'], vibe: 'porch', bpm: 99, durationMs: 213000,
        useFromMs: 20000, useToMs: 130000,
        transitionIn: { type: 'blend', durationMs: 10000, note: 'Tell me why. They will.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Bon Jovi is the key change into rock.' },
      }),
      t({
        id: 'po-prayer', spotifyId: '37ZJ0p5Jm13JPevGcx4SkF',
        title: "Livin' On A Prayer", artists: ['Bon Jovi'], album: 'Slippery When Wet',
        rooms: ['feaberry', 'walk'], vibe: 'rescue', bpm: 123, durationMs: 249000,
        useFromMs: 70000, useToMs: 205000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Whoa. Take my hand. This is the peak of a mix with no spike.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Fun. is the millennial verse of the same hymn.' },
      }),
      t({
        id: 'po-young', spotifyId: '5rgy6ghBq1eRApCkeUdJXf',
        title: 'We Are Young (feat. Janelle Monáe)', artists: ['fun.', 'Janelle Monáe'], album: 'Some Nights',
        rooms: ['nostalgia', 'roomeez', 'raw'], vibe: 'rescue', bpm: 116, durationMs: 250000,
        useFromMs: 40000, useToMs: 155000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'Tonight we are young. Let the “na-na” carry.' },
        transitionOut: { type: 'blend', durationMs: 12000, note: 'Queen is the actual encore.' },
      }),
      t({
        id: 'po-dsmn', spotifyId: '3lrNq7iGL5r3KS93YiKAbC',
        title: "Don't Stop Me Now", artists: ['Queen'], album: 'Greatest Hits',
        rooms: ['random songs to listen to'], vibe: 'rescue', bpm: 156, durationMs: 209000,
        useFromMs: 0, useToMs: 125000,
        transitionIn: { type: 'blend', durationMs: 12000, note: 'I’m having such a good time. Faster than prayer, same hands.' },
        transitionOut: { type: 'rescue-blend', durationMs: 16000, note: 'Rhapsody is long. Blend into the opera, leave before the rock ending if you must.' },
      }),
      t({
        id: 'po-rhapsody', spotifyId: '6l8GvAyoUZwWDgF1e4822w',
        title: 'Bohemian Rhapsody', artists: ['Queen'], album: 'Stone Cold Classics',
        rooms: ['slow dancer', 'raw'], vibe: 'rescue', bpm: 72, durationMs: 354000,
        useFromMs: 180000, useToMs: 330000,
        transitionIn: { type: 'rescue-blend', durationMs: 16000, note: 'Start at Galileo, not Mama. This is a mix, not a tribute act.' },
        transitionOut: { type: 'fade', durationMs: 12000, note: 'Nothing really matters. Fade. Go home.' },
      }),
    ],
  }),
];

export const TRANSITION_LABELS = {
  'cold-open': 'COLD OPEN',
  blend: 'BLEND',
  'echo-out': 'ECHO OUT',
  'filter-sweep': 'FILTER SWEEP',
  'hard-cut': 'HARD CUT',
  smash: 'SMASH',
  'rescue-blend': 'RESCUE',
  fade: 'FADE',
};

export function formatClock(ms) {
  const clamped = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function mixById(id) {
  return MIXES.find((m) => m.id === id) || MIXES[0];
}

export function trackAt(mix, timeMs) {
  const tracks = mix.tracks;
  const live = tracks.filter((t) => timeMs >= t.mixInMs && timeMs < t.mixOutMs);
  if (live.length === 0) {
    return tracks.find((t) => timeMs < t.mixInMs) || tracks[tracks.length - 1];
  }
  return live.sort((a, b) => b.mixInMs - a.mixInMs)[0];
}

export function liveTracks(mix, timeMs) {
  return mix.tracks.filter((t) => timeMs >= t.mixInMs && timeMs < t.mixOutMs);
}

export function nextTransition(mix, timeMs) {
  const tracks = mix.tracks;
  const upcoming = tracks
    .map((track) => ({ track, at: track.mixInMs }))
    .filter((x) => x.at > timeMs)
    .sort((a, b) => a.at - b.at)[0];

  const outgoing = tracks
    .map((track) => ({ track, at: track.mixOutMs - (track.transitionOut?.durationMs || 0) }))
    .filter((x) => x.at > timeMs)
    .sort((a, b) => a.at - b.at)[0];

  if (!upcoming && !outgoing) return null;
  if (!upcoming) return { at: outgoing.at, track: outgoing.track, kind: outgoing.track.transitionOut.type };
  if (!outgoing) return { at: upcoming.at, track: upcoming.track, kind: upcoming.track.transitionIn.type };
  return upcoming.at <= outgoing.at
    ? { at: upcoming.at, track: upcoming.track, kind: upcoming.track.transitionIn.type }
    : { at: outgoing.at, track: outgoing.track, kind: outgoing.track.transitionOut.type };
}

export function overlaps(mix) {
  const tracks = mix.tracks;
  const result = [];
  for (let i = 0; i < tracks.length - 1; i += 1) {
    const a = tracks[i];
    const b = tracks[i + 1];
    const start = b.mixInMs;
    const end = a.mixOutMs;
    if (end > start) {
      result.push({
        id: `${a.id}-${b.id}`,
        from: a,
        to: b,
        startMs: start,
        endMs: end,
        durationMs: end - start,
        type: a.transitionOut.type,
        note: a.transitionOut.note,
      });
    } else {
      result.push({
        id: `${a.id}-${b.id}`,
        from: a,
        to: b,
        startMs: a.mixOutMs,
        endMs: b.mixInMs,
        durationMs: 0,
        type: a.transitionOut.type,
        note: a.transitionOut.note,
        hardCut: true,
      });
    }
  }
  return result;
}
