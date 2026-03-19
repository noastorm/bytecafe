let puzzles = [
  {
    id: 'p1', title: 'PUZZLE 1 — ASSIGNMENT & VARIABLES',
    desc: 'Assign the value <code>42</code> to a variable called <code>answer</code>, then print it.',
    hint: 'In R, use <- to assign. Try: answer <- 42  then  print(answer)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>Assignment in R uses the arrow operator:<br><code style="color:var(--amber-bright)">x <- value</code><br><br>Then to see the value:<br><code style="color:var(--amber-bright)">print(x)</code><br>or just type <code style="color:var(--amber-bright)">x</code></div>`,
    check: (code, outputs) => {
      const hasAssign = /answer\s*<-\s*42/.test(code.join('\n')) || /answer\s*=\s*42/.test(code.join('\n'));
      const hasPrint = outputs.some(o => o.includes('42') || o.includes('[1] 42'));
      return hasAssign && hasPrint;
    },
    successMsg: '✓ CORRECT! Variables store values. answer <- 42 puts 42 into the box labelled "answer".',
  },
  {
    id: 'p2', title: 'PUZZLE 2 — VECTORS WITH c()',
    desc: 'Create a vector called <code>scores</code> containing the values <code>85, 92, 78, 95, 61</code>. Then find its mean with <code>mean(scores)</code>.',
    hint: 'Vectors use c(): scores <- c(85, 92, 78, 95, 61)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>A vector is a list of values:<br><code style="color:var(--amber-bright)">v <- c(1, 2, 3, 4)</code><br><br>Useful functions:<br><code style="color:var(--amber-bright)">mean(v)</code> — average<br><code style="color:var(--amber-bright)">length(v)</code> — how many<br><code style="color:var(--amber-bright)">sum(v)</code> — total<br><code style="color:var(--amber-bright)">v[2]</code> — 2nd element</div>`,
    check: (code, outputs) => {
      const hasVec = /scores\s*<-\s*c\(/.test(code.join(''));
      const hasMean = /mean\(scores\)/.test(code.join(''));
      const hasOutput = outputs.some(o => o.includes('82.2') || o.includes('82'));
      return hasVec && hasMean && hasOutput;
    },
    successMsg: '✓ CORRECT! mean(scores) = 82.2. Vectors are R\'s most fundamental data structure.',
  },
  {
    id: 'p3', title: 'PUZZLE 3 — IF/ELSE',
    desc: 'Write an if/else that checks if a variable <code>bmi</code> (set it to <code>27.5</code>) is above 25. Print <code>"Overweight"</code> if true, <code>"Normal"</code> if false.',
    hint: 'if(condition){ ... } else { ... }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br><code style="color:var(--amber-bright)">if(condition){<br>  # do this<br>} else {<br>  # or this<br>}</code><br><br>From your lecture: BMI classification uses chained if/else if to handle all ranges. Here we just need one branch.</div>`,
    check: (code, outputs) => {
      const hasBmi = /bmi\s*<-\s*27\.5/.test(code.join(''));
      const hasIf = /if\s*\(/.test(code.join(''));
      const hasOverweight = outputs.some(o => o.toLowerCase().includes('overweight'));
      return hasBmi && hasIf && hasOverweight;
    },
    successMsg: '✓ CORRECT! bmi = 27.5 > 25 → "Overweight". Your lecture\'s BMI example used this exact pattern.',
  },
  {
    id: 'p4', title: 'PUZZLE 4 — FOR LOOP',
    desc: 'Use a for loop to print the squares of numbers 1 through 5. Output should show 1, 4, 9, 16, 25.',
    hint: 'for(i in 1:5){ print(i^2) }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br><code style="color:var(--amber-bright)">for(var in sequence){<br>  # body<br>}</code><br><br>Your lecture example:<br><code style="color:var(--amber-bright)">sequence <- seq(1:30)<br>for(var in sequence){<br>  print(var)<br>}</code><br><br><code style="color:var(--amber-bright)">1:5</code> means c(1,2,3,4,5)</div>`,
    check: (code, outputs) => {
      const hasFor = /for\s*\(/.test(code.join(''));
      const has25 = outputs.some(o => o.includes('25'));
      const has16 = outputs.some(o => o.includes('16'));
      return hasFor && has25 && has16;
    },
    successMsg: '✓ CORRECT! for(i in 1:5){ print(i^2) } — loops are essential for repeated operations.',
  },
  {
    id: 'p5', title: 'PUZZLE 5 — WRITE A FUNCTION',
    desc: 'Write a function called <code>maxi</code> that takes two arguments <code>a</code> and <code>b</code> and returns the larger one. Then call it: <code>maxi(7, 12)</code>.',
    hint: 'maxi <- function(a, b){ if(a >= b){ return(a) } else { return(b) } }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your practice sheet!<br><code style="color:var(--amber-bright)">maxi <- function(a, b){<br>  if(a >= b){<br>    return(a)<br>  } else {<br>    return(b)<br>  }<br>}</code><br><br>Functions are reusable code blocks. <code style="color:var(--amber-bright)">return()</code> sends back a value.</div>`,
    check: (code, outputs) => {
      const hasFunc = /maxi\s*<-\s*function/.test(code.join(''));
      const hasCall = /maxi\s*\(/.test(code.join(''));
      const has12 = outputs.some(o => o.includes('12'));
      return hasFunc && hasCall && has12;
    },
    successMsg: '✓ CORRECT! maxi(7, 12) → 12. This is straight from your practice sheet!',
  },
  {
    id: 'p6', title: 'PUZZLE 6 — MATRICES',
    desc: 'Create a 2×3 matrix from 1:6, filled by row. Use <code>matrix(1:6, nrow=2, ncol=3, byrow=TRUE)</code>. Then access element row 1, col 2.',
    hint: 'm <- matrix(1:6, nrow=2, ncol=3, byrow=TRUE)  then  m[1,2]',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br><code style="color:var(--amber-bright)">m <- matrix(data, nrow, ncol, byrow)</code><br><br>Access elements:<br><code style="color:var(--amber-bright)">m[row, col]</code> — one element<br><code style="color:var(--amber-bright)">m[1, ]</code> — whole row 1<br><code style="color:var(--amber-bright)">m[, 2]</code> — whole col 2<br><br>byrow=TRUE fills across rows first.</div>`,
    check: (code, outputs) => {
      const hasMat = /matrix\s*\(/.test(code.join(''));
      const hasAccess = /m\s*\[\s*1\s*,\s*2\s*\]/.test(code.join(''));
      const has2 = outputs.some(o => o.includes('[1] 2') || o.trim() === '2');
      return hasMat && (hasAccess || has2);
    },
    successMsg: '✓ CORRECT! m[1,2] = 2. Matrices are 2D vectors — rows × columns.',
  },
  {
    id: 'p7', title: 'PUZZLE 7 — DATA FRAMES',
    desc: 'Create a data frame with Name=c("Alice","Bob","Carol") and Age=c(15,12,5). Then print the colnames().',
    hint: 'kids <- data.frame(Name=c("Alice","Bob","Carol"), Age=c(15,12,5))  then  print(colnames(kids))',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your Data Frames practice sheet!<br><code style="color:var(--amber-bright)">df <- data.frame(col1, col2)</code><br><br>Useful functions:<br><code style="color:var(--amber-bright)">colnames(df)</code> — column names<br><code style="color:var(--amber-bright)">df$Name</code> — access a column<br><code style="color:var(--amber-bright)">df[1,]</code> — first row<br><code style="color:var(--amber-bright)">nrow(df)</code> — count rows</div>`,
    check: (code, outputs) => {
      const hasDf = /data\.frame\s*\(/.test(code.join(''));
      const hasColnames = /colnames\s*\(/.test(code.join(''));
      const hasOutput = outputs.some(o => o.includes('Name') || o.includes('Age'));
      return hasDf && hasColnames && hasOutput;
    },
    successMsg: '✓ CORRECT! Data frames are tables — vectors of equal length bound together as columns.',
  },
  {
    id: 'p8', title: 'PUZZLE 8 — WHILE LOOP',
    desc: 'Write a while loop that starts with <code>i <- 1</code> and prints "Hello" exactly 3 times, incrementing i each time.',
    hint: 'i <- 1; while(i <= 3){ print("Hello"); i <- i + 1 }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your practice sheet!<br><code style="color:var(--amber-bright)">i <- 1<br>while(i <= 5){<br>  print("Hello")<br>  i <- i + 1<br>}</code><br><br>⚠️ Always increment or you get an infinite loop!</div>`,
    check: (code, outputs) => {
      const hasWhile = /while\s*\(/.test(code.join(''));
      const helloCount = outputs.filter(o => o.includes('Hello')).length;
      return hasWhile && helloCount === 3;
    },
    successMsg: '✓ CORRECT! While loops run as long as the condition is true. Always update the counter!',
  },
  {
    id: 'p9', title: 'PUZZLE 9 — GGPLOT2 BASICS',
    desc: 'Write a ggplot2 scatter plot command using the <code>faithful</code> dataset: x=waiting, y=eruptions. (Just write the command — we\'ll evaluate the syntax.)',
    hint: 'ggplot(data=faithful, aes(x=waiting, y=eruptions)) + geom_point()',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your ggplot practice sheet!<br><code style="color:var(--amber-bright)">ggplot(data=faithful,<br>  aes(x=waiting,<br>      y=eruptions)) +<br>geom_point()</code><br><br>Key parts:<br>• <code style="color:var(--amber-bright)">ggplot()</code> — canvas<br>• <code style="color:var(--amber-bright)">aes()</code> — aesthetics mapping<br>• <code style="color:var(--amber-bright)">geom_*()</code> — the layer type</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasGgplot = /ggplot\s*\(/.test(allCode);
      const hasFaithful = /faithful/.test(allCode);
      const hasAes = /aes\s*\(/.test(allCode);
      const hasGeom = /geom_point/.test(allCode);
      return hasGgplot && hasFaithful && hasAes && hasGeom;
    },
    successMsg: '✓ CORRECT! ggplot2 works in layers: canvas + aesthetics + geometry. The faithful dataset is built into R.',
  },
  {
    id: 'p10', title: 'PUZZLE 10 — GGPLOT2 LAYERS',
    desc: 'Write a ggplot command for the <code>mpg</code> dataset that plots engine displacement (displ) vs highway mpg (hwy), with color mapped to drive type (drv). Add proper axis labels.',
    hint: 'ggplot(mpg, aes(x=displ, y=hwy, color=drv)) + geom_point() + labs(x="Engine Displacement (l)", y="Highway MPG")',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your ggplot practice sheet!<br><code style="color:var(--amber-bright)">ggplot(mpg,<br>  aes(x=displ, y=hwy,<br>      color=drv)) +<br>geom_point() +<br>labs(x="...", y="...")</code><br><br><code style="color:var(--amber-bright)">color=drv</code> inside <code style="color:var(--amber-bright)">aes()</code> maps a variable to colour — ggplot auto-creates a legend!</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasMpg = /mpg/.test(allCode);
      const hasDispl = /displ/.test(allCode);
      const hasHwy = /hwy/.test(allCode);
      const hasDrv = /color\s*=\s*drv/.test(allCode);
      const hasLabs = /labs\s*\(/.test(allCode);
      return hasMpg && hasDispl && hasHwy && hasDrv && hasLabs;
    },
    successMsg: '✓ PERFECT! Mapping color=drv inside aes() gives a categorical colour scale automatically. This is the ggplot2 grammar!',
  },
  {
    id: 'p11', title: 'PUZZLE 11 — SWITCH STATEMENT',
    desc: 'Create a variable <code>year_of_study <- 2</code>, then use <code>switch()</code> to print "Freshperson", "Experienced", "Very Experienced", or "Ready to graduate" based on the value.',
    hint: 'switch(year_of_study, print("Freshperson"), print("Experienced"), print("Very Experienced"), print("Ready to graduate"))',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your practice sheet!<br><code style="color:var(--amber-bright)">switch(year_of_study,<br>  print("Freshperson"),<br>  print("Experienced"),<br>  print("Very Experienced"),<br>  print("Ready to graduate"))</code><br><br>switch() picks by position — value 1 → first option, value 2 → second, etc.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasSwitch = /switch\s*\(/.test(allCode);
      const hasYear = /year_of_study\s*<-\s*2/.test(allCode);
      const hasOutput = outputs.some(o => o.includes('Experienced'));
      return hasSwitch && hasYear && hasOutput;
    },
    successMsg: '✓ CORRECT! switch() is cleaner than chained if/else when selecting from a fixed set of options.',
  },
  {
    id: 'p12', title: 'PUZZLE 12 — PASTE0 & STRINGS',
    desc: 'Create variables <code>name <- "Ren"</code> and <code>score <- 95</code>. Use <code>paste0()</code> to print: <code>Ren scored 95</code>',
    hint: 'name <- "Ren"; score <- 95; print(paste0(name, " scored ", score))',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br><code style="color:var(--amber-bright)">paste0()</code> joins strings with no separator:<br><code style="color:var(--amber-bright)">paste0("Hello", " ", "World")</code><br>→ "Hello World"<br><br>Mix variables and strings freely:<br><code style="color:var(--amber-bright)">paste0(name, " scored ", score)</code></div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasPaste = /paste0\s*\(/.test(allCode);
      const hasName = /name\s*<-\s*["']Ren["']/.test(allCode);
      const hasOutput = outputs.some(o => o.includes('Ren') && o.includes('95'));
      return hasPaste && hasName && hasOutput;
    },
    successMsg: '✓ CORRECT! paste0() is your go-to for building strings from variables. Used constantly in R output.',
  },
  {
    id: 'p13', title: 'PUZZLE 13 — RBIND & CBIND',
    desc: 'Create two vectors: <code>r1 <- c(1,2,3)</code> and <code>r2 <- c(4,5,6)</code>. Combine them into a matrix using <code>rbind()</code>, then print it.',
    hint: 'r1 <- c(1,2,3); r2 <- c(4,5,6); m <- rbind(r1, r2); print(m)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your matrices sheet!<br><code style="color:var(--amber-bright)">rbind(r1, r2)</code> — stacks rows<br><code style="color:var(--amber-bright)">cbind(c1, c2)</code> — stacks columns<br><br>Result of rbind:<br><code style="color:var(--amber-bright)">   [,1] [,2] [,3]<br>r1    1    2    3<br>r2    4    5    6</code></div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasRbind = /rbind\s*\(/.test(allCode);
      const hasVecs = /r1\s*<-\s*c\(/.test(allCode) && /r2\s*<-\s*c\(/.test(allCode);
      const hasOutput = outputs.some(o => o.includes('[,1]') || o.includes('r1') || o.includes('1    2    3'));
      return hasRbind && hasVecs && hasOutput;
    },
    successMsg: '✓ CORRECT! rbind() builds matrices row by row. cbind() does it column by column. Both essential.',
  },
  {
    id: 'p14', title: 'PUZZLE 14 — MATRIX OPERATIONS',
    desc: 'Create matrix <code>m <- matrix(1:4, nrow=2, ncol=2)</code>. Then print its transpose with <code>t(m)</code> and check its inverse with <code>solve(m)</code>.',
    hint: 'm <- matrix(1:4, nrow=2, ncol=2); t(m); solve(m)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>Matrix operations from your sheet:<br><code style="color:var(--amber-bright)">t(m)</code> — transpose (flip rows/cols)<br><code style="color:var(--amber-bright)">solve(m)</code> — matrix inverse<br><code style="color:var(--amber-bright)">m1 %*% m2</code> — matrix multiply<br><br>Note: solve() only works on square matrices. A matrix times its inverse = identity matrix.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasMat = /matrix\s*\(1:4/.test(allCode);
      const hasT = /\bt\s*\(\s*m\s*\)/.test(allCode);
      const hasSolve = /solve\s*\(\s*m\s*\)/.test(allCode);
      return hasMat && hasT && hasSolve;
    },
    successMsg: '✓ CORRECT! t() and solve() are standard matrix tools. You\'ll see these in linear algebra and stats.',
  },
  {
    id: 'p15', title: 'PUZZLE 15 — DATA FRAME FILTERING',
    desc: 'Create the kids data frame: Name=c("Alice","Bob","Carol"), Age=c(15,12,5). Then filter it to show only kids older than 10: <code>kids[kids$Age > 10, ]</code>',
    hint: 'kids <- data.frame(Name=c("Alice","Bob","Carol"), Age=c(15,12,5)); kids[kids$Age > 10, ]',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>Filter a data frame with a condition:<br><code style="color:var(--amber-bright)">df[df$column > value, ]</code><br><br>The comma after the condition is required — it means "all columns".<br><br>So <code style="color:var(--amber-bright)">kids[kids$Age > 10, ]</code> returns rows where Age > 10, keeping all columns.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasDf = /data\.frame\s*\(/.test(allCode);
      const hasFilter = /kids\s*\[\s*kids\s*\$\s*Age/.test(allCode);
      const hasOutput = outputs.some(o => o.includes('Alice') || o.includes('Bob'));
      return hasDf && hasFilter && hasOutput;
    },
    successMsg: '✓ CORRECT! df[condition, ] is the core filtering pattern in R. The comma means "keep all columns".',
  },
  {
    id: 'p16', title: 'PUZZLE 16 — MERGE DATA FRAMES',
    desc: 'Create two data frames: <code>kids1</code> with Name+Age and <code>kids2</code> with Name+Height. Merge them by Name using <code>merge(kids1, kids2, by="Name")</code>.',
    hint: 'kids1 <- data.frame(Name=c("Alice","Bob"), Age=c(15,12)); kids2 <- data.frame(Name=c("Alice","Bob"), Height=c(162,148)); merge(kids1, kids2, by="Name")',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your data frames sheet!<br><code style="color:var(--amber-bright)">merge(df1, df2, by="Name")</code><br><br>This is an inner join — only rows with matching Name in BOTH frames are kept.<br><br>If column names differ:<br><code style="color:var(--amber-bright)">merge(df1, df2,<br>  by.x="Name",<br>  by.y="Student")</code></div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasMerge = /merge\s*\(/.test(allCode);
      const hasBoth = /kids1/.test(allCode) && /kids2/.test(allCode);
      const hasBy = /by\s*=/.test(allCode);
      return hasMerge && hasBoth && hasBy;
    },
    successMsg: '✓ CORRECT! merge() is how you join tables in R — essential for real data work. Dougie needed this.',
  },
  {
    id: 'p17', title: 'PUZZLE 17 — GGPLOT GEOM_LINE & LAYERS',
    desc: 'Using the ggplot practice sheet pattern: create <code>xdat <- c(1:12)</code> and <code>ydat <- xdat^2</code>. Plot a line graph with <code>geom_line()</code>.',
    hint: 'xdat <- c(1:12); ydat <- xdat^2; print(ggplot(data=NULL) + geom_line(aes(x=xdat, y=ydat)))',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your ggplot sheet!<br><code style="color:var(--amber-bright)">ggplot(data=NULL) +<br>  geom_line(aes(x=xdat, y=ydat))</code><br><br>Key geom types:<br><code style="color:var(--amber-bright)">geom_point()</code> — scatter<br><code style="color:var(--amber-bright)">geom_line()</code> — line chart<br><code style="color:var(--amber-bright)">geom_bar()</code> — bar chart<br><code style="color:var(--amber-bright)">geom_histogram()</code> — histogram</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasLine = /geom_line\s*\(/.test(allCode);
      const hasAes = /aes\s*\(/.test(allCode);
      const hasData = /xdat/.test(allCode) && /ydat/.test(allCode);
      return hasLine && hasAes && hasData;
    },
    successMsg: '✓ CORRECT! geom_line() is the line chart layer. Swap it for geom_point() for scatter, geom_bar() for bars.',
  },
  {
    id: 'p18', title: 'PUZZLE 18 — GGPLOT HISTOGRAM & FACETS',
    desc: 'Write a ggplot histogram of engine displacement from the <code>mpg</code> dataset. Then add <code>facet_grid(year~.)</code> to split by year.',
    hint: 'ggplot(mpg) + geom_histogram(aes(x=displ), color="blue", fill="lightblue") + facet_grid(year~.)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your ggplot sheet!<br><code style="color:var(--amber-bright)">ggplot(mpg) +<br>  geom_histogram(<br>    aes(x=displ),<br>    color="blue",<br>    fill="lightblue") +<br>  facet_grid(year~.)</code><br><br><code style="color:var(--amber-bright)">facet_grid(var~.)</code> splits the plot into subplots — one per value of var. Very useful for comparing groups.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasHist = /geom_histogram\s*\(/.test(allCode);
      const hasFacet = /facet_grid\s*\(/.test(allCode);
      const hasMpg = /mpg/.test(allCode);
      return hasHist && hasFacet && hasMpg;
    },
    successMsg: '✓ CORRECT! facet_grid() splits one plot into a grid of subplots by a variable. Powerful for comparison.',
  },
  {
    id: 'p19', title: 'BONUS — THE CIRCLE FUNCTION',
    desc: 'From your practice sheet: write the <code>circle()</code> function that takes xcord, ycord, radius, and nsamples=64, builds x and y vectors using a for loop and cos/sin, then calls plot().',
    hint: 'circle <- function(xcord, ycord, radius, nsamples=64){ x<-c(); y<-c(); for(s in 1:nsamples){ x[s]<-radius*cos(2*pi*s/nsamples)+xcord; y[s]<-radius*sin(2*pi*s/nsamples)+ycord }; plot(x,y,asp=1) }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>This is straight from your practice sheet — the full circle function:<br><code style="color:var(--amber-bright)">circle <- function(xcord, ycord,<br>  radius, nsamples=64){<br>  x <- c()<br>  y <- c()<br>  for(s in 1:nsamples){<br>    x[s] <- radius*cos(<br>      2*pi*s/nsamples)+xcord<br>    y[s] <- radius*sin(<br>      2*pi*s/nsamples)+ycord<br>  }<br>  plot(x, y, asp=1)<br>}</code><br><br>This tests: functions + default args + for loops + vectors + math.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasFunc = /circle\s*<-\s*function/.test(allCode);
      const hasFor = /for\s*\(/.test(allCode);
      const hasCos = /cos\s*\(/.test(allCode);
      const hasSin = /sin\s*\(/.test(allCode);
      const hasPlot = /plot\s*\(/.test(allCode);
      return hasFunc && hasFor && hasCos && hasSin && hasPlot;
    },
    successMsg: '✓ PERFECT! The circle function combines everything: functions, default args, for loops, vectors, and math. This is real R.',
  },
];

// ══════════════════════════════════════════════════════════════
//  R CONSOLE ENGINE (simulated)
// ══════════════════════════════════════════════════════════════
let codeHistory = [];
let sessionCode = [];
let sessionOutputs = [];

function initPuzzles() {
  loadPuzzle(currentPuzzle || 0);
}

function setActivePuzzles(nextPuzzles) {
  if (Array.isArray(nextPuzzles) && nextPuzzles.length) {
    puzzles = nextPuzzles;
  }
}

// Puzzle attempt tracking (for humor + badges)
let wrongAttempts   = 0;
let puzzleStartTime = Date.now();

// Per-puzzle reward tables
const PUZZLE_XP    = [30, 35, 40, 40, 55, 50, 50, 45, 60, 70, 50, 45, 55, 60, 55, 65, 60, 65, 80];
const PUZZLE_COINS = [ 0,  0,  0,  1,  0,  1,  0,  0,  1,  2,  1,  0,  1,  1,  1,  2,  1,  2,  3];
const PUZZLE_REP   = [ 1,  1,  1,  1,  2,  2,  2,  2,  2,  3,  2,  2,  2,  3,  2,  3,  2,  3,  4];

const BYTOS_SUCCESS = [
  // P1 — variables
  'Variable assigned. Value stored. The box has a label now. This is how it begins.',
  // P2 — vectors
  'c() successful. Five numbers, one vector. R is pleased. Honestly so am I.',
  // P3 — if/else
  'Correct. The condition evaluated. The branch was taken. Logic: confirmed.',
  // P4 — for loop
  'The loop ran. All five squares printed. Somewhere a computer science professor felt a disturbance in the force. A good one.',
  // P5 — functions
  'You wrote a function. maxi() now exists. It will outlive this terminal session. Probably.',
  // P6 — matrices
  'Matrix created. Element accessed. byrow=TRUE understood. You are now dangerous with 2D data.',
  // P7 — data frames
  'Data frame built. Columns named. colnames() interrogated successfully. Dougie is watching. He looks hopeful.',
  // P8 — while loop
  'Three Hellos. Exactly three. Counter incremented correctly. You did not create an infinite loop. This is more impressive than it sounds.',
  // P9 — ggplot basics
  'ggplot rendered. faithful dataset visualized. geom_point() placed. The volcano is mapped. Well done.',
  // P10 — ggplot layers
  'color=drv inside aes(). Labs added. Legend auto-generated. The grammar of graphics bows its head.',
  // P11 — switch
  'switch() executed. The correct branch selected by position. If/else chains everywhere just got jealous.',
  // P12 — paste0
  'paste0() mastered. Variables and strings unified. You can now make R say anything. Use this power carefully.',
  // P13 — rbind/cbind
  'Vectors bound into matrices. Row by row. Column by column. The building blocks, assembled.',
  // P14 — matrix ops
  't() transposed. %*% multiplied. The linear algebra works. I am choosing not to explain why this matters. You will find out.',
  // P15 — df filter
  'Filtered. df[condition, ] executed. Only the qualifying rows remain. This is how real data work starts.',
  // P16 — merge
  'merge() successful. Two tables joined by a common column. Dougie could have used this two weeks ago. He did not know to ask.',
  // P17 — geom_line
  'geom_line() layered. Multiple series plotted. The grammar grows another room.',
  // P18 — facets
  'facet_grid() applied. The plot fractured into subplots by variable. You now see data the way statisticians see data. It is a lot.',
  // P19 — circle
  "...That's the circle function. From the actual practice sheet. You built it. Functions, loops, vectors, trigonometry — all of it. I have been running on this terminal for five years. That is the best thing I have seen.",
];

const BYTOS_WRONG = [
  "Not quite. The syntax is close but R is a precise language. It notices everything.",
  "Almost. In the way that a closed door is almost open. Try again.",
  "That ran. It just didn't do what the puzzle asked. These are different problems.",
  "I have seen this mistake before. I have seen it many times. You are not alone.",
  "R returned something. It was not the something we were looking for.",
  "The logic is there. The implementation needs another pass.",
  "Interesting approach. R disagrees with it, but I see what you were trying.",
  "One more attempt. You are closer than you think. Or exactly as far. Hard to say without running it.",
  "The error is specific. The error is trying to help you. The error is your friend right now.",
  "I believe in you. This is not sarcasm. I have belief functions. They are currently active.",
];

// Puzzle index → scene background key
const PUZZLE_BG = [
  'terminal_7', // 1  variables
  'terminal_7', // 2  vectors
  'terminal_7', // 3  if/else
  'cafe_main',  // 4  for loop
  'terminal_7', // 5  functions
  'late_night', // 6  matrices
  'late_night', // 7  data frames
  'cafe_main',  // 8  while loop
  'late_night', // 9  ggplot basics
  'late_night', // 10 ggplot layers
  'terminal_7', // 11 switch
  'terminal_7', // 12 paste0
  'late_night', // 13 rbind/cbind
  'late_night', // 14 matrix ops
  'cafe_main',  // 15 df filtering
  'late_night', // 16 merge
  'terminal_7', // 17 geom_line
  'late_night', // 18 histogram+facet
  'cafe_main',  // 19 bonus circle
];
