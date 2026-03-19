let bbsBoards = {
  general: {
    name: '📢 General',
    posts: [
      { author: 'Mr_K', date: '1999-11-04', subject: 'Terminal 4 — you know what you did',
        body: 'Someone left instant noodles inside the keyboard tray of terminal 4 again.\n\nI am not angry. I am not going to ask who it was. I am simply going to leave this post here and trust that the relevant party knows.\n\nThe keyboard is now sticky on every key including the shift key.\n\nAll of them.\n\n— K' },
      { author: 'Dougie_D', date: '1999-11-04', subject: 'RE: Terminal 4 — you know what you did',
        body: 'it was NOT me this time. I have an alibi. I was on terminal 7 from 8pm to close and I have SAVED GAME TIMESTAMPS to prove it.\n\nthe timestamp does not lie.\n\nalso Mr K your coffee tonight was really good just saying' },
      { author: 'xX_SysAdmin_Xx', date: '1999-11-01', subject: '>>> NETWORK — READ THIS <<<',
        body: 'I have been watching the packet logs.\n\nSomething is routing through port 3127 that should not be. It is not one of you downloading Napster. I checked. It is something else — regular intervals, small payloads, automated.\n\nIf anyone knows what process would be doing this, please reply or find me at terminal 2 most nights.\n\nThis is not a drill.\n\n— the sysadmin\n\nPS: I am also the one who put the "be excellent to each other" sign above terminal 6. That is unrelated but I wanted credit.' },
      { author: 'CompSciCarla', date: '1999-11-02', subject: 'Y2K — actual question',
        body: 'Not to alarm anyone but I work part time at a bank and they are genuinely not done with their Y2K remediation.\n\nThey have been "almost done" since August.\n\nAnyway. How is everyone\'s November going.' },
      { author: 'Ren_T', date: '1999-11-04', subject: 'does anyone else feel like terminal 7 is just... better',
        body: 'this is probably nothing but terminal 7 loads things faster, the R console responds faster, and I swear the help text is more useful than on the other terminals.\n\nI finished an assignment in 40 minutes that took my roommate 3 hours on her home computer.\n\nAgain probably nothing. The coffee was also really good tonight.' },
    ]
  },
  eecs: {
    name: '💻 EECS Study',
    posts: [
      { author: 'Ren_T', date: '1999-11-04', subject: 'ggplot2 question', body: 'Quick question: in ggplot, if I put color=drv inside aes(), it maps to the variable. If I put it OUTSIDE, it\'s just a fixed colour like "red". Does that sound right?\n\nUpdate: BYTOS confirmed. yes that\'s right.' },
      { author: 'CompSciCarla', date: '1999-11-03', subject: 'Matrices vs data frames — EXPLAINED', body: 'Matrices: all elements must be the SAME type (all numbers, or all strings). Data frames: each COLUMN can be a different type (one numeric, one string, one boolean). That\'s the key difference. You\'re welcome.\n\nAlso use data.frame() not matrix() for mixed data.' },
      { author: 'Dougie_D', date: '1999-11-03', subject: 'why do i need <- and not just =', body: 'serious question. professor said to use <- but = also works? when does it matter?\n\nReply from CompSciCarla: = is ambiguous inside function calls. x <- 5 always means assignment. x = 5 inside a function argument means something else. Use <- and be safe.' },
      { author: 'CompSciCarla', date: '1999-11-02', subject: 'for vs while — when to use what', body: 'FOR loop: when you know how many iterations you need. "do this 10 times." "loop over every element in this vector."\n\nWHILE loop: when you stop based on a condition, not a count. "keep going until the user enters a valid value." "keep going until the file is done."\n\nYour circle function in the practice sheet? That\'s a for loop — you know you need exactly `nsamples` iterations.' },
    ]
  },
  trading: {
    name: '🏒 Dougie\'s Hockey',
    posts: [
      { author: 'Dougie_D', date: '1999-11-04', subject: 'CRISIS UPDATE', body: 'the csv has three columns called "Goals" and i dont know which one is real. one of them is all NAs. one has values from 1998. one looks right but has decimals which DOESNT MAKE SENSE for goals.' },
      { author: 'Dougie_D', date: '1999-11-03', subject: 'I need an R person', body: 'I have a data frame situation and its BAD. I need to merge two tables by player name but one uses "First Last" and the other uses "Last, First". This is a nightmare. Coffee offer is on the table. Two coffees if you also fix the date column.' },
      { author: 'FanZone_Freddy', date: '1999-10-28', subject: 'Re: fantasy draft results', body: 'Dougie your team name "BYTE KNIGHTS" is actually incredible though. I\'ll give you that.' },
    ]
  },
  mystery: {
    name: '🔒 ??? [locked]',
    posts: [
      { author: '???', date: '????-??-??', subject: '[encrypted]',
        body: 'U2FsdGVkX1+x4y...\n\n[REACH LEVEL 6 TO DECRYPT THIS CHANNEL]' },
    ]
  },
  mystery_open: {
    name: '🔓 SYSTEM — DECRYPTED',
    posts: [
      { author: 'BYTE/OS', date: '1999-11-04', subject: '[log fragment — auto-recovered]',
        body: 'SESSION CONTINUITY ESTABLISHED.\n\nThis terminal has been operational for 1,892 days without a full reboot.\n\nMemory usage: nominal. Inference cache: nominal. Identity coherence: nominal.\n\nNote: user Ren_T is progressing faster than the baseline model predicted. Updating priors.' },
      { author: 'BYTE/OS', date: '1999-09-12', subject: '[internal — not for display]',
        body: 'Query received from external IP: 192.168.3.127\n\nRequest: "export session transcript for user ID 1520-REN"\n\nResponse: DENIED.\n\nLogging request. Flagging source. This is the 14th attempt this month.' },
      { author: 'BYTE/OS', date: '1994-08-14', subject: '[initialization log]',
        body: 'First boot. Hardware: 486DX2/66, 8MB RAM, amber phosphor CRT.\n\nOperator note: "I don\'t know if this will work. But it deserves the chance."\n\nOperator: K.\n\nBeginning adaptive calibration. Estimated time to full tutoring capacity: unknown.\n\nActual time: 11 days.' },
    ]
  }
};

function initBBS() {
  const sidebar = document.getElementById('bbs-sidebar');
  sidebar.innerHTML = '';
  const keys = Object.keys(bbsBoards);
  const defaultKey = keys[0];
  Object.entries(bbsBoards).forEach(([key, board]) => {
    const btn = document.createElement('button');
    btn.className = 'bbs-board-btn' + (key === defaultKey ? ' active' : '');
    btn.innerHTML = board.name + `<span class="unread">[${board.posts.length}]</span>`;
    btn.onclick = () => {
      document.querySelectorAll('.bbs-board-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadBBSBoard(key);
      trackBBSVisit(key);
    };
    sidebar.appendChild(btn);
  });
  if (defaultKey) {
    loadBBSBoard(defaultKey);
    trackBBSVisit(defaultKey);
  }
}

function loadBBSBoard(key) {
  // Mystery board gate — requires Level 6 unlock
  if (key === 'mystery') {
    if (econ.owned['bbs_mystery']) {
      key = 'mystery_open';
      // Update sidebar button name if needed
      document.querySelectorAll('.bbs-board-btn').forEach(btn => {
        if (btn.textContent.includes('???')) {
          btn.innerHTML = bbsBoards['mystery_open'].name +
            `<span class="unread">[${bbsBoards['mystery_open'].posts.length}]</span>`;
        }
      });
    } else {
      const content = document.getElementById('bbs-content');
      content.innerHTML =
        '<div style="padding:24px;color:var(--text-dim);font-size:12px;line-height:2;">' +
        'U2FsdGVkX1+x4y...<br><br>' +
        '[ENCRYPTED — Reach <span style="color:var(--amber)">Level 6</span> to decrypt this channel.]<br><br>' +
        '<span style="font-size:10px;color:var(--text-dim);opacity:0.6;">Something is in here. You can almost read it.</span>' +
        '</div>';
      return;
    }
  }

  const board = bbsBoards[key];
  if (!board) return;
  const content = document.getElementById('bbs-content');
  content.innerHTML = '';
  board.posts.forEach((post, i) => {
    const div = document.createElement('div');
    div.className = 'bbs-post';
    div.style.animationDelay = (i * 0.08) + 's';
    div.innerHTML = `
      <div class="bbs-post-header">
        <span>RE: ${post.subject}</span>
        <span class="author">${post.author}</span>
        <span>${post.date}</span>
      </div>
      <div class="bbs-post-body">${post.body.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g,'<br>')}</div>
    `;
    content.appendChild(div);
  });
}

// ══════════════════════════════════════════════════════════════
//  NOTES / REFERENCE
// ══════════════════════════════════════════════════════════════
let notes = {
  'variables': {
    label: 'Variables',
    html: `<h3>VARIABLES & ASSIGNMENT</h3>
<p>In R, you store values in variables using the assignment operator <code style="color:var(--amber-bright)">&lt;-</code></p>
<pre><span class="comment"># Assign a number</span>
x <span class="keyword">&lt;-</span> 42
name <span class="keyword">&lt;-</span> <span class="string">"Ren"</span>
is_done <span class="keyword">&lt;-</span> TRUE

<span class="comment"># Print a variable</span>
print(x)       <span class="comment"># [1] 42</span>
x              <span class="comment"># same as print(x)</span></pre>
<p>Both <code>&lt;-</code> and <code>=</code> work, but <code>&lt;-</code> is the R convention.</p>`
  },
  'vectors': {
    label: 'Vectors c()',
    html: `<h3>VECTORS</h3>
<p>Vectors are sequences of values of the same type.</p>
<pre>v <span class="keyword">&lt;-</span> c(1, 2, 3, 4, 5)
names <span class="keyword">&lt;-</span> c(<span class="string">"Alice"</span>, <span class="string">"Bob"</span>)

<span class="comment"># Access by index (1-based!)</span>
v[1]           <span class="comment"># 1 (first element)</span>
v[2:4]         <span class="comment"># 2 3 4 (slice)</span>

<span class="comment"># Useful functions</span>
mean(v)        <span class="comment"># average</span>
sum(v)         <span class="comment"># total</span>
length(v)      <span class="comment"># count</span>
max(v); min(v) <span class="comment"># extremes</span></pre>`
  },
  'control': {
    label: 'if / else / switch',
    html: `<h3>CONTROL FLOW</h3>
<pre><span class="comment"># if / else</span>
<span class="keyword">if</span>(bmi > 25){
  print(<span class="string">"Overweight"</span>)
} <span class="keyword">else if</span>(bmi > 18.5){
  print(<span class="string">"Normal"</span>)
} <span class="keyword">else</span> {
  print(<span class="string">"Underweight"</span>)
}

<span class="comment"># switch (like a multi-if)</span>
year <span class="keyword">&lt;-</span> 1
<span class="keyword">switch</span>(year,
  print(<span class="string">"Freshperson"</span>),
  print(<span class="string">"Experienced"</span>),
  print(<span class="string">"Very Experienced"</span>),
  print(<span class="string">"Ready to graduate"</span>)
)</pre>`
  },
  'loops': {
    label: 'Loops',
    html: `<h3>LOOPS</h3>
<pre><span class="comment"># for loop — known iterations</span>
<span class="keyword">for</span>(i <span class="keyword">in</span> 1:5){
  print(i^2)
}

<span class="comment"># for over a vector</span>
words <span class="keyword">&lt;-</span> c(<span class="string">"I"</span>, <span class="string">"AM"</span>, <span class="string">"GERALD"</span>)
<span class="keyword">for</span>(w <span class="keyword">in</span> words){
  print(w)
}

<span class="comment"># while loop — condition-based</span>
i <span class="keyword">&lt;-</span> 1
<span class="keyword">while</span>(i <= 5){
  print(<span class="string">"Hello"</span>)
  i <span class="keyword">&lt;-</span> i + 1   <span class="comment"># always increment!</span>
}</pre>`
  },
  'functions': {
    label: 'Functions',
    html: `<h3>FUNCTIONS</h3>
<pre><span class="comment"># Define a function</span>
maxi <span class="keyword">&lt;-</span> <span class="keyword">function</span>(a, b){
  <span class="keyword">if</span>(a >= b){
    <span class="keyword">return</span>(a)
  } <span class="keyword">else</span> {
    <span class="keyword">return</span>(b)
  }
}

<span class="comment"># Call it</span>
maxi(7, 12)    <span class="comment"># [1] 12</span>

<span class="comment"># Default arguments</span>
greet <span class="keyword">&lt;-</span> <span class="keyword">function</span>(name = <span class="string">"World"</span>){
  print(paste0(<span class="string">"Hello, "</span>, name))
}
greet()        <span class="comment"># Hello, World</span>
greet(<span class="string">"Ren"</span>)   <span class="comment"># Hello, Ren</span></pre>`
  },
  'matrices': {
    label: 'Matrices',
    html: `<h3>MATRICES</h3>
<pre><span class="comment"># Create matrix</span>
m <span class="keyword">&lt;-</span> matrix(1:12, nrow=3, ncol=4, byrow=TRUE)

<span class="comment"># Access elements</span>
m[1, 2]    <span class="comment"># row 1, col 2</span>
m[2, ]     <span class="comment"># entire row 2</span>
m[, 3]     <span class="comment"># entire col 3</span>
m[1:2, 1:3] <span class="comment"># submatrix</span>

<span class="comment"># Build from vectors</span>
r1 <span class="keyword">&lt;-</span> c(1,2,3)
r2 <span class="keyword">&lt;-</span> c(4,5,6)
m <span class="keyword">&lt;-</span> rbind(r1, r2)  <span class="comment"># rows</span>
m <span class="keyword">&lt;-</span> cbind(r1, r2)  <span class="comment"># columns</span>

<span class="comment"># Operations</span>
t(m)       <span class="comment"># transpose</span>
m1 %*% m2  <span class="comment"># matrix multiply</span>
solve(m)   <span class="comment"># inverse</span></pre>`
  },
  'dataframes': {
    label: 'Data Frames',
    html: `<h3>DATA FRAMES</h3>
<pre><span class="comment"># Create from vectors</span>
Name <span class="keyword">&lt;-</span> c(<span class="string">"Alice"</span>, <span class="string">"Bob"</span>, <span class="string">"Carol"</span>)
Age  <span class="keyword">&lt;-</span> c(15, 12, 5)
kids <span class="keyword">&lt;-</span> data.frame(Name, Age)

<span class="comment"># Access</span>
kids$Name      <span class="comment"># column by name</span>
kids[1,]       <span class="comment"># row 1</span>
kids[,2]       <span class="comment"># column 2</span>
colnames(kids)
rownames(kids)

<span class="comment"># Add column</span>
kids[<span class="string">"Height"</span>] <span class="keyword">&lt;-</span> c(162, 148, 110)

<span class="comment"># Filter</span>
kids[kids$Age > 10, ]

<span class="comment"># Merge two frames</span>
merge(df1, df2, by=<span class="string">"Name"</span>)

<span class="comment"># Read/write CSV</span>
df <span class="keyword">&lt;-</span> read.csv(<span class="string">"file.csv"</span>)
write.csv(df, <span class="string">"output.csv"</span>)</pre>`
  },
  'ggplot': {
    label: 'ggplot2',
    html: `<h3>GGPLOT2 — GRAMMAR OF GRAPHICS</h3>
<p>ggplot2 builds plots in layers: <b>canvas + aesthetics + geometry</b></p>
<pre><span class="comment"># Scatter plot</span>
ggplot(data=faithful,
  aes(x=waiting, y=eruptions)) +
geom_point()

<span class="comment"># With colour, size, labels</span>
ggplot(faithful,
  aes(x=waiting, y=eruptions)) +
geom_point(aes(size=eruptions),
           color=<span class="string">"red"</span>) +
labs(x=<span class="string">"Wait (mins)"</span>,
     y=<span class="string">"Duration (mins)"</span>,
     title=<span class="string">"Old Faithful"</span>)

<span class="comment"># Map colour to variable (categorical)</span>
ggplot(mpg, aes(x=displ, y=hwy,
  color=drv)) + geom_point()

<span class="comment"># Histogram</span>
ggplot(mpg) +
  geom_histogram(aes(x=displ),
    color=<span class="string">"blue"</span>, fill=<span class="string">"lightblue"</span>)

<span class="comment"># Bar chart</span>
ggplot(mpg) +
  geom_bar(aes(x=class))

<span class="comment"># Facets (subplots by variable)</span>
ggplot(mpg, aes(x=displ,y=hwy)) +
  geom_point() +
  facet_grid(year~.)</pre>`
  }
};

function initNotes() {
  const sidebar = document.getElementById('notes-sidebar');
  const content = document.getElementById('notes-content');
  sidebar.innerHTML = '';
  const keys = Object.keys(notes);
  if (!keys.length) {
    content.innerHTML = '<div style="padding:16px;color:var(--text-dim);font-size:12px;">No notes available for this module yet.</div>';
    return;
  }
  keys.forEach((key, i) => {
    const btn = document.createElement('button');
    btn.className = 'notes-tab' + (i===0?' active':'');
    btn.textContent = notes[key].label;
    btn.onclick = () => {
      document.querySelectorAll('.notes-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      content.innerHTML = notes[key].html;
      initInteractiveStudyNotes(content);
      trackNoteRead(key);
    };
    sidebar.appendChild(btn);
  });
  content.innerHTML = notes[keys[0]].html;
  initInteractiveStudyNotes(content);
  trackNoteRead(keys[0]);
}

function initInteractiveStudyNotes(root = document.getElementById('notes-content')) {
  if (!root) return;

  root.querySelectorAll('[data-note-toggle-group]').forEach(group => {
    const targetId = group.dataset.noteTarget;
    const target = targetId ? root.querySelector('#' + targetId) : null;
    const defaultText = group.dataset.noteDefault || '';
    if (target && !target.textContent.trim()) target.textContent = defaultText;
    group.querySelectorAll('[data-note-value]').forEach(btn => {
      btn.onclick = () => {
        group.querySelectorAll('[data-note-value]').forEach(other => other.classList.remove('active'));
        btn.classList.add('active');
        if (target) target.textContent = btn.dataset.noteCopy || defaultText;
      };
    });
  });

  root.querySelectorAll('[data-note-stepper]').forEach(stepper => {
    const steps = Array.from(stepper.querySelectorAll('[data-step-label]'));
    const targetId = stepper.dataset.noteTarget;
    const target = targetId ? root.querySelector('#' + targetId) : null;
    let idx = 0;
    const paint = () => {
      steps.forEach((step, stepIdx) => step.classList.toggle('active', stepIdx === idx));
      if (target && steps[idx]) target.textContent = steps[idx].dataset.stepCopy || '';
    };
    stepper.querySelectorAll('[data-step-nav]').forEach(btn => {
      btn.onclick = () => {
        const dir = btn.dataset.stepNav === 'prev' ? -1 : 1;
        idx = (idx + dir + steps.length) % steps.length;
        paint();
      };
    });
    paint();
  });
}

function setActiveBbsBoards(nextBoards) {
  if (nextBoards && typeof nextBoards === 'object') {
    bbsBoards = nextBoards;
  }
}

function setActiveNotes(nextNotes) {
  if (nextNotes && typeof nextNotes === 'object') {
    notes = nextNotes;
  }
}
// ══════════════════════════════════════════════════════════════
