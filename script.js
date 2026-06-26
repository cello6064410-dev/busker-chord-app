// ============================================
// GLOBAL VARIABLES
// ============================================
let songs = [];
let currentSongId = null;
let currentKey = 0;
let fontSize = 16;
let scrollInterval = null;
let isScrolling = false;
let scrollSpeed = 1.5; // pixels per interval
let scrollIntervalTime = 50; // milliseconds

// ============================================
// LOAD SONGS FROM FIREBASE
// ============================================
function loadSongs() {
  const songList = document.getElementById('songList');
  songList.innerHTML = '<div class="loading-text">⏳ Loading songs...</div>';
  
  db.collection('songs')
    .orderBy('title')
    .get()
    .then((snapshot) => {
      songs = [];
      songList.innerHTML = '';
      
      if (snapshot.empty) {
        songList.innerHTML = '<div class="empty-text">📭 No songs found</div>';
        return;
      }
      
      snapshot.forEach((doc) => {
        const song = { id: doc.id, ...doc.data() };
        songs.push(song);
        
        const btn = document.createElement('button');
        btn.textContent = song.title || 'Untitled';
        btn.onclick = () => selectSong(song.id);
        songList.appendChild(btn);
      });
    })
    .catch((error) => {
      console.error('Error loading songs:', error);
      songList.innerHTML = '<div class="error-text">❌ Error loading songs</div>';
    });
}

// ============================================
// SELECT AND DISPLAY A SONG
// ============================================
function selectSong(songId) {
  // Stop auto-scroll when selecting a new song
  stopScroll();
  
  currentSongId = songId;
  const song = songs.find(s => s.id === songId);
  
  if (!song) return;
  
  document.getElementById('songTitle').textContent = song.title || 'Untitled';
  
  // Reset key when selecting new song
  currentKey = 0;
  document.getElementById('keyDisplay').textContent = 'Key: 0';
  
  // Display the lyrics
  displaySong(song);
}

// ============================================
// DISPLAY SONG WITH CHORD HIGHLIGHTING
// ============================================
function displaySong(song) {
  const output = document.getElementById('output');
  
  if (!song || !song.lyrics) {
    output.textContent = 'No lyrics available';
    return;
  }
  
  let lyrics = song.lyrics;
  
  // Apply transposition if key is not 0
  if (currentKey !== 0) {
    lyrics = transposeLyrics(lyrics, currentKey);
  }
  
  // Highlight chords
  lyrics = highlightChords(lyrics);
  
  output.innerHTML = lyrics;
  
  // Scroll to top when new song loads
  output.scrollTop = 0;
  
  // Reset scroll position indicator
  updateScrollIndicator();
}

// ============================================
// HIGHLIGHT CHORDS (Format: [Chord])
// ============================================
function highlightChords(text) {
  // Match patterns like [C], [Am], [G7], etc.
  return text.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>');
}

// ============================================
// TRANSPOSE LYRICS (Basic implementation)
// ============================================
function transposeLyrics(lyrics, steps) {
  // This is a basic implementation - you can enhance it
  // For now, we'll just indicate transposition
  const chordPattern = /\[([^\]]+)\]/g;
  
  // Simple note mapping (C major scale)
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  return lyrics.replace(chordPattern, (match, chord) => {
    // Try to transpose the chord
    let transposed = chord;
    
    // Check if chord starts with a note
    for (let i = 0; i < notes.length; i++) {
      if (chord.startsWith(notes[i])) {
        const newIndex = (i + steps + 12) % 12;
        transposed = notes[newIndex] + chord.substring(notes[i].length);
        break;
      }
    }
    
    return `[${transposed}]`;
  });
}

// ============================================
// TRANSPOSE FUNCTION
// ============================================
function transpose(steps) {
  currentKey += steps;
  document.getElementById('keyDisplay').textContent = `Key: ${currentKey}`;
  
  // Reload current song with new key
  if (currentSongId) {
    const song = songs.find(s => s.id === currentSongId);
    if (song) {
      displaySong(song);
    }
  }
}

// ============================================
// CHANGE FONT SIZE
// ============================================
function changeFontSize(delta) {
  fontSize += delta;
  // Limit font size
  if (fontSize < 10) fontSize = 10;
  if (fontSize > 32) fontSize = 32;
  
  document.getElementById('output').style.fontSize = fontSize + 'px';
}

// ============================================
// AUTO-SCROLL FUNCTIONS
// ============================================
function startScroll() {
  const output = document.getElementById('output');
  
  // Don't start if already scrolling
  if (isScrolling) return;
  
  // Don't start if no content
  if (!output.innerHTML || output.innerHTML === 'No lyrics available' || output.innerHTML === 'Select a song to begin') {
    return;
  }
  
  // Don't start if already at the bottom
  if (output.scrollTop + output.clientHeight >= output.scrollHeight - 10) {
    return;
  }
  
  isScrolling = true;
  
  // Change button appearance
  const startBtn = document.querySelector('.floating-bar button:nth-child(5)');
  if (startBtn) {
    startBtn.textContent = '▶️';
    startBtn.style.background = '#2a5a2e';
  }
  
  // Add scrolling class for visual indicator
  output.classList.add('scrolling');
  
  scrollInterval = setInterval(() => {
    const output = document.getElementById('output');
    
    // Check if we've reached the bottom
    if (output.scrollTop + output.clientHeight >= output.scrollHeight - 5) {
      stopScroll();
      return;
    }
    
    // Scroll down
    output.scrollTop += scrollSpeed;
  }, scrollIntervalTime);
}

function stopScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
  
  isScrolling = false;
  
  // Reset button appearance
  const startBtn = document.querySelector('.floating-bar button:nth-child(5)');
  if (startBtn) {
    startBtn.textContent = '▶';
    startBtn.style.background = '#1a1a2e';
  }
  
  // Remove scrolling class
  const output = document.getElementById('output');
  output.classList.remove('scrolling');
}

function toggleScroll() {
  if (isScrolling) {
    stopScroll();
  } else {
    startScroll();
  }
}

// ============================================
// UPDATE SCROLL INDICATOR
// ============================================
function updateScrollIndicator() {
  const output = document.getElementById('output');
  // Remove any existing indicator
  const existing = output.querySelector('.scroll-indicator');
  if (existing) existing.remove();
}

// ============================================
// TAP/CLICK ON SCREEN TO STOP SCROLL
// ============================================
function setupTapToStop() {
  const output = document.getElementById('output');
  
  // For touch devices
  output.addEventListener('touchstart', function(e) {
    if (isScrolling) {
      stopScroll();
      e.preventDefault();
    }
  });
  
  // For mouse clicks (desktop)
  output.addEventListener('click', function(e) {
    if (isScrolling) {
      stopScroll();
    }
  });
  
  // Also stop if user manually scrolls
  output.addEventListener('scroll', function() {
    if (isScrolling) {
      stopScroll();
    }
  });
}

// ============================================
// TOGGLE FULLSCREEN
// ============================================
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log('Fullscreen not available');
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', function(e) {
  // Space bar to toggle scroll
  if (e.key === ' ' || e.key === 'Space') {
    e.preventDefault();
    toggleScroll();
  }
  
  // Arrow keys to adjust scroll speed
  if (e.key === 'ArrowUp' && isScrolling) {
    e.preventDefault();
    scrollSpeed = Math.min(scrollSpeed + 0.5, 5);
    showSpeedIndicator();
  }
  if (e.key === 'ArrowDown' && isScrolling) {
    e.preventDefault();
    scrollSpeed = Math.max(scrollSpeed - 0.5, 0.5);
    showSpeedIndicator();
  }
});

// ============================================
// SHOW SPEED INDICATOR
// ============================================
function showSpeedIndicator() {
  const output = document.getElementById('output');
  let indicator = output.querySelector('.speed-indicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'speed-indicator';
    output.appendChild(indicator);
  }
  
  indicator.textContent = `Speed: ${scrollSpeed.toFixed(1)}x`;
  indicator.style.display = 'block';
  
  clearTimeout(indicator._timeout);
  indicator._timeout = setTimeout(() => {
    indicator.style.display = 'none';
  }, 1500);
}

// ============================================
// SETUP SCROLL SPEED CONTROL (Optional UI)
// ============================================
function setScrollSpeed(speed) {
  scrollSpeed = Math.max(0.5, Math.min(5, speed));
  return scrollSpeed;
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  // Setup tap-to-stop
  setupTapToStop();
  
  // Set initial font size
  document.getElementById('output').style.fontSize = fontSize + 'px';
  
  // Auto-load songs
  loadSongs();
  
  // Fix: Update the Play button to use toggleScroll
  const buttons = document.querySelectorAll('.floating-bar button');
  if (buttons.length >= 7) {
    buttons[4].onclick = toggleScroll; // Play button
    buttons[5].onclick = stopScroll;   // Stop button
  }
});

// ============================================
// CLEANUP ON PAGE UNLOAD
// ============================================
window.addEventListener('beforeunload', function() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
});

// ============================================
// CONSOLE HELP
// ============================================
console.log('🎵 Song Viewer Pro loaded!');
console.log('Controls:');
console.log('  ▶  - Start auto-scroll');
console.log('  ⏹  - Stop auto-scroll');
console.log('  Tap on lyrics - Stop scrolling');
console.log('  Space bar - Toggle scroll');
console.log('  ↑/↓ arrows - Adjust scroll speed');