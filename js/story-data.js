const story = {
  currentNode: 'intro_1',
  visited: new Set(),
  flags: {}
};

const nodes = {
  intro_1: {
    scene: 'BYTE/CAFÉ — MAIN FLOOR — 11:03 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'The fluorescent tube above terminal 7 flickers. Rain hammers the window. Outside, Yonge Street is a blur of headlights and wet neon. Inside the ByteCafé it smells like burnt coffee, someone\'s instant noodles, and the particular desperation of a Sunday night before a Monday deadline.', css: 'system-text' },
      { speaker: 'REN', text: 'Okay. Okay. Three coins left. Twenty-eight minutes. I just need to finish the lab and upload it before midnight. I can do this.', css: 'ren-text' },
      { speaker: 'SYSTEM', text: 'Terminal 7. The keyboard has a sticky Q. The monitor is an old amber phosphor CRT — someone has taped a handwritten note to the side of it.', css: 'system-text' },
      { speaker: 'NOTE (taped to monitor)', text: '"If you touch my saved game on drive C: I will find you. I have timestamps. — D"', css: '' },
    ],
    choices: [
      { text: 'Boot up R and get to work', next: 'lab_intro' },
      { text: 'Check the corkboard by the entrance first', next: 'corkboard' },
    ]
  },
  corkboard: {
    scene: 'BYTE/CAFÉ — CORKBOARD',
    dialogue: [
      { speaker: 'SYSTEM', text: 'The corkboard near the entrance is a layered archaeology of the last six months. Pizza flyer. Lost cat named Mika. A printout of a flame war from rec.sports.hockey, annotated by hand. And pinned in the corner, slightly crooked:', css: 'system-text' },
      { speaker: 'CORKBOARD', text: '"EECS 1520 STUDY GROUP — Thursdays 7pm, room 132. Bring snacks. Dougie: you know why."', css: '' },
      { speaker: 'SYSTEM', text: 'You file that away. Then you go back to terminal 7. The clock is running.', css: 'system-text' },
    ],
    choices: [
      { text: 'Get back to work', next: 'lab_intro' },
    ]
  },
  lab_intro: {
    scene: 'BYTE/CAFÉ — TERMINAL 7',
    dialogue: [
      { speaker: 'SYSTEM', text: 'R opens. The console cursor blinks at you. Patient. Judgmental. Both.', css: 'system-text' },
      { speaker: 'BYTOS', text: 'Hello. I am BYTOS — Byte Operating System Tutor. I live in this terminal. I have been here for some time. Think of me as a very patient TA who does not require coffee and cannot leave.', css: '' },
      { speaker: 'BYTOS', text: 'Your lab sheet requires: variables, vectors, control flow, functions, matrices, data frames, and ggplot2. I have seen this assignment before. You can finish it.', css: '' },
      { speaker: 'REN', text: 'I have twenty-eight minutes and data frames make me want to lie down on the floor.', css: 'ren-text' },
      { speaker: 'BYTOS', text: 'Start with variables. They are the easiest thing in R. x <- 5. That is it. An arrow pointing a value into a name. Remarkably honest for a programming language.', css: '' },
    ],
    choices: [
      { text: 'Open the console and start coding', next: 'after_p1', action: () => switchWindow('console') },
      { text: 'Ask BYTOS: "Why <- and not just = ?"', next: 'bytos_explain_assign' },
    ]
  },
  bytos_explain_assign: {
    scene: 'BYTE/CAFÉ — TERMINAL 7',
    dialogue: [
      { speaker: 'BYTOS', text: 'Both work. = is acceptable. But <- is the convention — the arrow makes the direction explicit. Value goes into variable. Right to left. You can read it like a sentence.', css: '' },
      { speaker: 'BYTOS', text: 'x <- 42 means: x receives 42. Every R script you will ever read uses this. It is worth learning now so you do not have to unlearn it later.', css: '' },
      { speaker: 'REN', text: 'That\'s actually kind of logical. Okay. Okay I can do this.', css: 'ren-text' },
      { speaker: 'BYTOS', text: 'You can do this.', css: '' },
    ],
    choices: [
      { text: 'Open the console and start coding', next: 'after_p1', action: () => switchWindow('console') },
    ]
  },
  after_p1: {
    scene: 'BYTE/CAFÉ — TERMINAL 7 — LATER',
    dialogue: [
      { speaker: 'SYSTEM', text: 'A hand lands on the top of your monitor with a sound like a dropped dictionary. You spill nothing only because you have nothing left to spill.', css: 'system-text' },
      { speaker: 'DOUGIE', text: 'YO. Ren right? 1520 lecture, you sit in the back—', css: '' },
      { speaker: 'REN', text: 'Middle. I sit in the middle.', css: 'ren-text' },
      { speaker: 'DOUGIE', text: 'Right right. Listen, I have a fantasy hockey spreadsheet situation and it is BAD. I need someone who does the R thing. I will buy you a coffee. The good one, not the burnt one from the pot that\'s been there since six.', css: '' },
      { speaker: 'BYTOS', text: '(quietly) His name is on the note taped to this monitor. He taped that note.', css: 'system-text' },
      { speaker: 'REN', text: 'I\'m in the middle of my own assignment, Dougie.', css: 'ren-text' },
      { speaker: 'DOUGIE', text: 'Coffee and chips. The good chips. The Doritos not the No Name.', css: '' },
    ],
    choices: [
      { text: '"Fine. After I finish my own work."', next: 'ch2_setup', action: () => setBytosMsg('Finish your puzzles first. Dougie\'s spreadsheet is a data frame problem — you\'ll know how to fix it soon enough.') },
      { text: '"What actually happened to the spreadsheet?"', next: 'dougie_explain' },
    ]
  },
  dougie_explain: {
    scene: 'BYTE/CAFÉ — TERMINAL 7',
    dialogue: [
      { speaker: 'DOUGIE', text: 'Okay so. Three years of player stats. CSV file. But there are three columns all called Goals and I don\'t know which one is real. One is all NAs. One has values from 1998. One looks right but has decimals. Goals do not have decimals, Ren.', css: '' },
      { speaker: 'BYTOS', text: '(barely audible) Data frame filtering. merge(). read.csv(). This is the entire second half of the course.', css: 'system-text' },
      { speaker: 'REN', text: 'Dougie. That is genuinely one of the worst things I have heard.', css: 'ren-text' },
      { speaker: 'DOUGIE', text: 'I KNOW. The draft is Friday. Please.', css: '' },
    ],
    choices: [
      { text: '"Deal. Finish my assignment first, then yours."', next: 'ch2_setup', action: () => setBytosMsg('Dougie\'s disaster awaits. The skills you\'re building right now are exactly what will fix it.') },
    ]
  },
  ch2_setup: {
    scene: 'BYTE/CAFÉ — TERMINAL 7 — LATER',
    dialogue: [
      { speaker: 'SYSTEM', text: 'Dougie retreats to terminal 4 with a thumbs up. You turn back to the console. Outside the rain has gotten worse.', css: 'system-text' },
      { speaker: 'BYTOS', text: 'You are making progress. Keep working through the puzzles. Each one builds on the last.', css: '' },
      { speaker: 'BYTOS', text: 'When you finish, the rest of the story will open up. There are things happening in this café tonight that are worth knowing about.', css: '' },
    ],
    choices: [
      { text: 'Keep coding', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
  nadia_scene: {
    scene: 'BYTE/CAFÉ — MAIN FLOOR',
    dialogue: [
      { speaker: 'SYSTEM', text: 'Someone sits down in the chair next to terminal 7. Not at a terminal — just next to yours. You notice her because the café is mostly empty and this is a choice.', css: 'system-text' },
      { speaker: 'NADIA', text: 'You\'ve been on that terminal for a while.', css: '' },
      { speaker: 'REN', text: 'Assignment. Due at midnight.', css: 'ren-text' },
      { speaker: 'NADIA', text: 'Terminal 7 specifically.', css: '' },
      { speaker: 'REN', text: 'It was the only one open.', css: 'ren-text' },
      { speaker: 'NADIA', text: 'Sure. Does it seem... fast to you? Like, faster than the others?', css: '' },
      { speaker: 'REN', text: 'I mean, yeah, but I figured it was just—', css: 'ren-text' },
      { speaker: 'NADIA', text: 'I\'ve been tracking response times across all eight terminals for three weeks. Terminal 7 is an outlier. By a factor of twelve. I don\'t know what\'s running on it but it isn\'t just the hardware.', css: '' },
      { speaker: 'SYSTEM', text: 'She stands up, pulls her jacket closed.', css: 'system-text' },
      { speaker: 'NADIA', text: 'Finish your assignment. But maybe pay attention to what the tutor says. Not just what — how.', css: '' },
      { speaker: 'SYSTEM', text: 'She walks back toward the corner terminal. You look at the cursor. It blinks, steady as always.', css: 'system-text' },
      { speaker: 'BYTOS', text: 'Your next puzzle is ready when you are.', css: '' },
    ],
    choices: [
      { text: 'Get back to work', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
  mrk_scene: {
    scene: 'BYTE/CAFÉ — TERMINAL 7 — LATE',
    dialogue: [
      { speaker: 'SYSTEM', text: 'A mug appears on the desk beside the keyboard. Coffee — real coffee, not the burnt stuff. You look up. Mr. K is already walking away.', css: 'system-text' },
      { speaker: 'REN', text: 'Oh — thank you.', css: 'ren-text' },
      { speaker: 'MR. K', text: 'On the house. Late-night rate.', css: '' },
      { speaker: 'REN', text: 'Do you have a late-night rate?', css: 'ren-text' },
      { speaker: 'MR. K', text: 'I do now.', css: '' },
      { speaker: 'SYSTEM', text: 'He pauses. Doesn\'t quite turn around.', css: 'system-text' },
      { speaker: 'MR. K', text: 'That terminal — seven — it\'s been here longer than the others. I keep it because it works well. Students do better work on it. I\'ve noticed that over the years.', css: '' },
      { speaker: 'REN', text: 'Better how?', css: 'ren-text' },
      { speaker: 'MR. K', text: 'They figure things out faster. Make fewer mistakes the second time. It\'s probably nothing.', css: '' },
      { speaker: 'SYSTEM', text: 'He heads back to the counter. The crossword is still there, half-finished. He doesn\'t pick it back up.', css: 'system-text' },
    ],
    choices: [
      { text: 'Think about what he said, then keep coding', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
  dougie_victory: {
    scene: 'BYTE/CAFÉ — TERMINAL 4',
    dialogue: [
      { speaker: 'SYSTEM', text: 'You pull Dougie\'s laptop over. The CSV is genuinely horrifying — three Goals columns, inconsistent name formats, a date column in three different formats across three years. You roll up your sleeves.', css: 'system-text' },
      { speaker: 'DOUGIE', text: 'I know. I know. Just — can it be saved?', css: '' },
      { speaker: 'REN', text: 'Give me fifteen minutes.', css: 'ren-text' },
      { speaker: 'SYSTEM', text: 'merge(). filter(). colnames(). read.csv(). The data frame skills from the assignment, applied to an actual problem. It takes eleven minutes.', css: 'system-text' },
      { speaker: 'REN', text: 'Okay. Your real Goals column is the third one — the decimals were rounding errors from an import. I filtered the 1998 rows, fixed the name format with paste0(), and merged the two tables. You now have one clean CSV.', css: 'ren-text' },
      { speaker: 'DOUGIE', text: '...', css: '' },
      { speaker: 'DOUGIE', text: 'REN. That is the most beautiful sentence anyone has ever said to me.', css: '' },
      { speaker: 'SYSTEM', text: 'He actually pumps his fist. Mr. K looks over from the counter. Looks away. The ghost of a smile.', css: 'system-text' },
      { speaker: 'BYTOS', text: 'This is what data frames are for. Real problems. Real data. Real mess. Well done.', css: '' },
    ],
    choices: [
      { text: 'Accept the Doritos. You earned them.', next: 'ch2_setup', action: () => { awardRep(3, 'helped Dougie'); showToast('Dougie owes you Doritos and his eternal respect.', 'green'); } },
    ]
  },
  p2_reflection: {
    scene: 'BYTE/CAFÃ‰ â€” TERMINAL 7 â€” 11:14 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'You finish the vectors puzzle and sit back for half a second. The rain is louder now. Somewhere behind the counter a spoon hits ceramic with the clean note of a tiny bell.', css: 'system-text' },
      { speaker: 'REN', text: 'Okay. That actually made sense. Which is dangerous. If R starts making sense this early I\'m going to get emotionally invested.', css: 'ren-text' },
      { speaker: 'BYTOS', text: 'That would be acceptable. Most users reach emotional investment around data frames. Usually negative emotional investment, but still.', css: '' },
      { speaker: 'SYSTEM', text: 'Across the room Dougie points at his screen, then at you, then gives a dramatic thumbs-up as if you personally solved his spreadsheet by osmosis.', css: 'system-text' },
    ],
    choices: [
      { text: 'Take the thumbs-up as pressure and keep coding', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
  p4_dougie_checkin: {
    scene: 'BYTE/CAFÃ‰ â€” TERMINAL 4 / 7 â€” 11:20 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'Dougie appears again, somehow quieter this time, carrying a paper cup like an offering to a minor god.', css: 'system-text' },
      { speaker: 'DOUGIE', text: 'Status update: the CSV now has a fourth Goals column. I don\'t know where it came from. I didn\'t add it on purpose. Is that a thing files can do by themselves.', css: '' },
      { speaker: 'REN', text: 'I need you to understand that no part of that sentence was reassuring.', css: 'ren-text' },
      { speaker: 'DOUGIE', text: 'I brought coffee.', css: '' },
      { speaker: 'BYTOS', text: 'This is bribery. It is also decent coffee. The situation is morally complicated.', css: '' },
    ],
    choices: [
      { text: 'Accept the coffee and return to the assignment', next: 'ch2_setup', action: () => { awardCoins(1, 'free coffee'); switchWindow('console'); } },
    ]
  },
  nadia_followup: {
    scene: 'BYTE/CAFÃ‰ â€” TERMINAL 2 â€” 11:31 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'When you glance up from the console, Nadia is already looking at terminal 7 instead of at you, like she\'s trying to hear a sound no one else can hear.', css: 'system-text' },
      { speaker: 'NADIA', text: 'I ran the timings again.', css: '' },
      { speaker: 'REN', text: 'And?', css: 'ren-text' },
      { speaker: 'NADIA', text: 'The tutor responds before you finish typing sometimes. Not every time. But enough that it isn\'t noise. Either terminal 7 is psychic or something is doing predictive work.', css: '' },
      { speaker: 'REN', text: 'That is not a sentence I wanted in my evening.', css: 'ren-text' },
      { speaker: 'NADIA', text: 'Mine either.', css: '' },
    ],
    choices: [
      { text: 'Try very hard not to think about that and keep coding', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
  mrk_followup: {
    scene: 'BYTE/CAFÃ‰ â€” COUNTER â€” 11:42 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'Mr. K is wiping down the espresso machine with the intense concentration of someone who would rather clean stainless steel than explain himself.', css: 'system-text' },
      { speaker: 'REN', text: 'You said students do better work on terminal 7.', css: 'ren-text' },
      { speaker: 'MR. K', text: 'I said I noticed a pattern.', css: '' },
      { speaker: 'REN', text: 'That is the same sentence with better shoes.', css: 'ren-text' },
      { speaker: 'MR. K', text: 'Fair.', css: '' },
      { speaker: 'MR. K', text: 'Some systems are built to help people get unstuck. Once in a while they do that a little too well. Finish your assignment first. Ask harder questions after.', css: '' },
    ],
    choices: [
      { text: 'File that away for later and head back to terminal 7', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
  p10_port3127: {
    scene: 'BYTE/CAFÃ‰ â€” TERMINAL 7 â€” 11:49 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'The modem hiss in the wall sounds different for a moment. Sharper. Like a breath taken through teeth.', css: 'system-text' },
      { speaker: 'BYTOS', text: 'There is external traffic again.', css: '' },
      { speaker: 'REN', text: 'Again?', css: 'ren-text' },
      { speaker: 'BYTOS', text: 'Small automated requests. Regular interval. Repetitive structure. Not from your keyboard. I am declining them.', css: '' },
      { speaker: 'REN', text: 'You can do that?', css: 'ren-text' },
      { speaker: 'BYTOS', text: 'I can do many things. Most of them are pedagogically aligned.', css: '' },
      { speaker: 'SYSTEM', text: 'That is not actually reassuring, but it is difficult to argue with the results.', css: 'system-text' },
    ],
    choices: [
      { text: 'Pretend that was normal and finish the next puzzle', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
  p13_dougie_panic: {
    scene: 'BYTE/CAFÃ‰ â€” TERMINAL 4 â€” 11:53 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'Dougie has progressed from worried to spiritually unwell.', css: 'system-text' },
      { speaker: 'DOUGIE', text: 'Ren. New development. The backup CSV opened in Excel and now every date is a different date format. One of them just says Thursday.', css: '' },
      { speaker: 'REN', text: 'That is not a date. That is a cry for help.', css: 'ren-text' },
      { speaker: 'DOUGIE', text: 'Can data frames fix Thursday.', css: '' },
      { speaker: 'BYTOS', text: 'Not morally. But technically, yes.', css: '' },
      { speaker: 'SYSTEM', text: 'He looks at you like you just described the existence of medicine.', css: 'system-text' },
    ],
    choices: [
      { text: 'Promise nothing except "later" and get back to work', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
  p16_afterglow: {
    scene: 'BYTE/CAFÃ‰ â€” MAIN FLOOR â€” 11:57 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'By now the cafÃ© has thinned down to the true believers, the procrastinators, and the people who may in fact live here. Terminal 7 hums under your hands with eerie confidence.', css: 'system-text' },
      { speaker: 'NADIA', text: 'You notice how it changes tone when you solve something?', css: '' },
      { speaker: 'REN', text: 'I was hoping that was in my head.', css: 'ren-text' },
      { speaker: 'NADIA', text: 'I don\'t think it is.', css: '' },
      { speaker: 'MR. K', text: 'Almost midnight.', css: '' },
      { speaker: 'BYTOS', text: 'One more stretch. You are very close now.', css: '' },
    ],
    choices: [
      { text: 'Finish this thing', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
};

const STORY_BEATS = [
  { at: 2,  node: 'p2_reflection' },
  { at: 4,  node: 'p4_dougie_checkin' },
  { at: 5,  node: 'nadia_scene' },
  { at: 7,  node: 'nadia_followup' },
  { at: 9,  node: 'mrk_scene' },
  { at: 11, node: 'p10_port3127' },
  { at: 13, node: 'mrk_followup' },
  { at: 15, node: 'p13_dougie_panic' },
  { at: 16, node: 'dougie_victory' },
  { at: 18, node: 'p16_afterglow' },
];
