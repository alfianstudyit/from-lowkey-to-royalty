(function(){
  "use strict";

  var TOTAL = 13;
  var book = document.getElementById('book');
  var pages = [];
  var current = 0; // number of pages currently flipped open (0 = fully closed/cover showing)

  // Build pages: page index 0..TOTAL-1 correspond to images/1.jpg.. images/13.jpg
  for (var i = 0; i < TOTAL; i++){
    var p = document.createElement('div');
    p.className = 'page';
    p.style.zIndex = (TOTAL - i);
    p.innerHTML =
      '<div class="face front"><img src="images/' + (i+1) + '.jpg" alt="Halaman ' + (i+1) + '" draggable="false"></div>' +
      '<div class="face back"><div class="mark">&#10070;</div></div>';
    book.appendChild(p);
    pages.push(p);
  }

  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var indicator = document.getElementById('pageIndicator');
  var zoneLeft = document.getElementById('zoneLeft');
  var zoneRight = document.getElementById('zoneRight');
  var hint = document.getElementById('hint');

  function updateUI(){
    prevBtn.classList.toggle('disabled', current === 0);
    nextBtn.classList.toggle('disabled', current === TOTAL);
    if (current === 0) indicator.textContent = 'Cover';
    else if (current === TOTAL) indicator.textContent = 'The End';
    else indicator.textContent = 'Page ' + current + ' / ' + (TOTAL-1);
  }

  var animating = false;

  function goNext(){
    if (animating || current >= TOTAL) return;
    animating = true;
    var p = pages[current];
    p.classList.add('flipping');
    p.style.zIndex = TOTAL + 5;
    p.style.transform = 'rotateY(-180deg)';
    playFlip();
    current++;
    updateUI();
    setTimeout(function(){
      p.classList.remove('flipping');
      p.style.zIndex = current; // sits under the remaining stack, above already-flipped ones
      animating = false;
      if (current === TOTAL){
        // sudah sampai halaman terakhir: jeda sebentar lalu tutup buku sendiri
        setTimeout(autoCloseBook, 2600);
      }
    }, 1000);
  }

  // ---------------- Auto-close: menutup buku & kembali ke awal ----------------
  function autoCloseBook(){
    if (current <= 0){
      setTimeout(function(){
        intro.classList.remove('hidden');
        hinted = false;
        hint.style.opacity = '';
        setTimeout(dismissHint, 9000);
      }, 400);
      return;
    }
    goPrev();
    setTimeout(autoCloseBook, 1050);
  }

  function goPrev(){
    if (animating || current <= 0) return;
    animating = true;
    current--;
    var p = pages[current];
    p.style.zIndex = TOTAL + 5;
    p.style.transform = 'rotateY(0deg)';
    playFlip();
    updateUI();
    setTimeout(function(){
      p.style.zIndex = (TOTAL - current);
      animating = false;
    }, 1000);
  }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  zoneLeft.addEventListener('click', goPrev);
  zoneRight.addEventListener('click', goNext);

  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // swipe support (diabaikan saat pinch-zoom / 2 jari)
  var touchX = null;
  var multiTouch = false;
  document.addEventListener('touchstart', function(e){
    if (e.touches.length > 1){ multiTouch = true; touchX = null; return; }
    multiTouch = false;
    touchX = e.changedTouches[0].clientX;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    if (multiTouch){ multiTouch = false; touchX = null; return; }
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50){ dx < 0 ? goNext() : goPrev(); }
    touchX = null;
  }, {passive:true});

  updateUI();

  // hide hint after first interaction
  var hinted = false;
  function dismissHint(){
    if (hinted) return;
    hinted = true;
    hint.style.opacity = '0';
  }
  zoneLeft.addEventListener('click', dismissHint);
  zoneRight.addEventListener('click', dismissHint);
  setTimeout(dismissHint, 9000);

  // ---------------- Intro / open book ----------------
  var intro = document.getElementById('intro');
  var openBtn = document.getElementById('openBtn');
  openBtn.addEventListener('click', function(){
    intro.classList.add('hidden');
    initAudio();
    startMusic();
    playFlip();
    setTimeout(goNext, 350);
  });

  var helpBtn = document.getElementById('helpBtn');
  helpBtn.addEventListener('click', function(){
    intro.classList.remove('hidden');
  });

  // ---------------- Dust motes ----------------
  var motesEl = document.getElementById('motes');
  for (var m = 0; m < 26; m++){
    var mote = document.createElement('div');
    mote.className = 'mote';
    mote.style.left = (Math.random()*100) + 'vw';
    mote.style.bottom = (-10 - Math.random()*10) + 'vh';
    mote.style.animationDuration = (10 + Math.random()*14) + 's';
    mote.style.animationDelay = (Math.random()*14) + 's';
    motesEl.appendChild(mote);
  }

  // ================= AUDIO =================
  // Suara balik halaman sekarang memakai file audio asli dari folder /music
  // (music/flip_effect.mp3), sedangkan musik latar tetap memakai
  // elemen <audio id="bgMusic"> di index.html.
  var ctx = null;
  var masterGain = null;
  var muted = false;
  var bgMusic = document.getElementById('bgMusic');
  var flipSound = document.getElementById('flipSound');

  function initAudio(){
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(ctx.destination);
  }

  // --- Page flip sound: diputar dari file music/flip_effect.mp3 ---
  function playFlip(){
    if (muted || !flipSound) { return; }
    // clone node biar bisa overlap kalau user klik cepat berkali-kali
    var s = flipSound.cloneNode(true);
    s.volume = 0.85;
    s.play().catch(function(){ /* menunggu interaksi user jika autoplay diblokir */ });
  }

  // --- Musik latar dari file audio (bgMusic) ---
  function startMusic(){
    if (!bgMusic) return;
    bgMusic.volume = muted ? 0 : 0.5;
    bgMusic.play().catch(function(){ /* menunggu interaksi user jika autoplay diblokir */ });
  }

  function stopMusic(){
    if (!bgMusic) return;
    bgMusic.pause();
  }

  var soundBtn = document.getElementById('soundBtn');
  soundBtn.addEventListener('click', function(){
    if (!ctx){ initAudio(); startMusic(); muted=false; soundBtn.style.opacity=1; return; }
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.85;
    if (bgMusic) bgMusic.volume = muted ? 0 : 0.5;
    if (flipSound) flipSound.volume = muted ? 0 : 0.85;
    soundBtn.style.opacity = muted ? 0.45 : 1;
  });

})();
