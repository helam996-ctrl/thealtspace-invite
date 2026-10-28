/**
 * THE ALT SPACE - Simple Interactive Invitation Engine
 * With Real-time Dynamic Countdown Timer ("TIC TOK" Page) & Host Customizer
 * Company: THE ALT SPACE (@thealtspace._)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Compute a default future date: 7 days from today at 9:00 PM
  function getFreshDefaultTarget() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(21, 0, 0, 0);
    return d;
  }

  // --- Event & Guest State ---
  const state = {
    currentIndex: 0,
    soundEnabled: true,
    audioCtx: null,
    countdownInterval: null,
    hostPin: '2026',
    isHostAuthenticated: false,
    pendingFocusField: null,
    guest: {
      name: 'Ravit',
      status: 'Pakka',
      role: 'Game Master',
      passTier: 'Solo VIP',
      slots: 1,
      bookingId: 'ALT-BK-' + Math.floor(10000 + Math.random() * 90000)
    },
    event: {
      companyName: 'THE ALT SPACE',
      companyInstagram: 'https://www.instagram.com/thealtspace._?srtk=ZGtmZXY0enBidXRk',
      instagramHandle: '@thealtspace._',
      title: 'Fursat ki Raat',
      edition: 'DIWALI EDITION',
      targetDate: getFreshDefaultTarget(),
      dateStr: '',
      timeStr: '',
      timeVal: '21:00',
      timeNote: 'Post dinner scenes. Entry closes by 10 PM.',
      venue: 'The Loft @ Alt Space ♡',
      drinks: 'BYOB',
      dressCode: 'Traditional is mandatory',
      organizerWhatsApp: '919876543210'
    }
  };

  const wittyQuotes = {
    'DJ Saab': 'Aux cord responsibility is serious. No sad acoustic songs after 11 PM.',
    'Decor Paglu': 'Diyas, ambient lighting & aesthetic are in your hands. Make Pinterest weep.',
    'Chakna Champion': 'The true MVP the party doesn’t deserve. Bring high-grade snacks.',
    'Bartender': 'Pour with precision, or prepare the guest room for fallen soldiers.',
    'Game Master': 'Power suits you. Use it wisely.',
    'Paparazzi': 'If it’s not captured on your camera, did the night even happen?',
    'Hype Machine': 'Zero sitting allowed. Keep the living room vibrating till sunrise.',
    'Chief Guest': 'Royalty status unlocked. Arrive looking 10/10 and receive compliments.'
  };

  // --- Date & Time Format Helpers ---
  function formatDisplayDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
  }

  function formatShortDate(date) {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  }

  function formatDisplayTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes > 0 ? `:${String(minutes).padStart(2, '0')}` : '';
    return `${hours}${minStr} ${ampm}`;
  }

  // --- Load From URL Query Params or LocalStorage ---
  function loadSavedOrUrlParams() {
    let hasLoadedDate = false;

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('event')) state.event.title = params.get('event');
      if (params.has('venue')) state.event.venue = params.get('venue');
      if (params.has('phone')) state.event.organizerWhatsApp = params.get('phone').replace(/[^0-9]/g, '');
      if (params.has('drinks')) state.event.drinks = params.get('drinks');
      if (params.has('dress')) state.event.dressCode = params.get('dress');
      if (params.has('timenote')) state.event.timeNote = params.get('timenote');

      if (params.has('date')) {
        const parsedDate = new Date(params.get('date'));
        if (!isNaN(parsedDate.getTime())) {
          state.event.targetDate = parsedDate;
          hasLoadedDate = true;
        }
      }

      // Check LocalStorage if no URL params
      if (!params.has('event')) {
        const saved = localStorage.getItem('altSpaceHostEvent');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.title) state.event.title = parsed.title;
          if (parsed.venue) state.event.venue = parsed.venue;
          if (parsed.drinks) state.event.drinks = parsed.drinks;
          if (parsed.dressCode) state.event.dressCode = parsed.dressCode;
          if (parsed.organizerWhatsApp) state.event.organizerWhatsApp = parsed.organizerWhatsApp;
          if (parsed.timeNote) state.event.timeNote = parsed.timeNote;

          if (parsed.targetDate) {
            const savedDate = new Date(parsed.targetDate);
            // If saved date is still in future, use it; otherwise provide fresh target
            if (!isNaN(savedDate.getTime()) && savedDate.getTime() > Date.now()) {
              state.event.targetDate = savedDate;
              hasLoadedDate = true;
            }
          }
        }
      }

      // Check Host PIN and Authentication State
      const savedPin = localStorage.getItem('altSpaceHostPin');
      if (savedPin) state.hostPin = savedPin;
      const sessionAuth = sessionStorage.getItem('altSpaceHostAuth');
      if (sessionAuth === 'true') state.isHostAuthenticated = true;
    } catch (e) {
      console.warn('Storage or URL parse notice:', e);
    }

    if (!hasLoadedDate) {
      state.event.targetDate = getFreshDefaultTarget();
    }

    syncHostFormInputs();
    applyEventStateToUI();
  }

  // --- Web Audio API Synthesized Sounds ---
  function getAudioCtx() {
    if (!state.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) state.audioCtx = new AudioCtx();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'flip') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'role') {
        [440, 554.37, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);
          gain.gain.setValueAtTime(0.09, now + idx * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.03);
          osc.stop(now + idx * 0.03 + 0.3);
        });
      } else if (type === 'celebration') {
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.14, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      }
    } catch (e) {
      console.warn('Audio blocked or not supported:', e);
    }
  }

  // --- Toast Notification ---
  function showToast(msg) {
    const toast = document.getElementById('toastNotice');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- Sound Toggle Button ---
  const soundBtn = document.getElementById('soundBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      soundBtn.classList.toggle('active', state.soundEnabled);
      soundBtn.innerHTML = state.soundEnabled
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Sound`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg> Mute`;
      if (state.soundEnabled) playSound('click');
    });
  }

  // --- Deck Cards & Navigation ---
  const cards = Array.from(document.querySelectorAll('.playing-card'));
  const totalCards = cards.length;
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const deckDots = document.getElementById('deckDots');

  if (deckDots) {
    deckDots.innerHTML = '';
    cards.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `dot ${idx === 0 ? 'active' : ''}`;
      dot.title = `Card ${idx + 1}`;
      dot.addEventListener('click', () => goToCard(idx));
      deckDots.appendChild(dot);
    });
  }

  function updateDeck() {
    cards.forEach((card, idx) => {
      const diff = idx - state.currentIndex;

      if (diff === 0) {
        card.style.transform = 'translateY(0) scale(1) rotate(0deg)';
        card.style.opacity = '1';
        card.style.filter = 'none';
        card.style.pointerEvents = 'auto';
        card.style.zIndex = '10';
      } else if (diff < 0) {
        const rot = -18 + diff * 4;
        card.style.transform = `translateX(-120%) translateY(-20px) rotate(${rot}deg) scale(0.92)`;
        card.style.opacity = '0';
        card.style.filter = 'blur(4px)';
        card.style.pointerEvents = 'none';
        card.style.zIndex = '5';
      } else {
        const yOffset = diff * 8;
        const scaleVal = 1 - diff * 0.035;
        const rotVal = (diff % 2 === 0 ? 1 : -1) * (diff * 2.2);
        card.style.transform = `translateY(${yOffset}px) scale(${scaleVal}) rotate(${rotVal}deg)`;
        card.style.opacity = diff <= 2 ? '0.95' : '0';
        card.style.filter = diff > 0 ? 'brightness(0.92)' : 'none';
        card.style.pointerEvents = 'none';
        card.style.zIndex = `${10 - diff}`;
      }
    });

    if (prevBtn) prevBtn.disabled = state.currentIndex === 0;
    if (nextBtn) {
      nextBtn.textContent = state.currentIndex === totalCards - 1 ? 'Shuffle Deck ↺' : 'Next Card →';
    }

    if (deckDots) {
      const dots = deckDots.querySelectorAll('.dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === state.currentIndex);
      });
    }
  }

  function goToCard(idx) {
    if (idx < 0 || idx >= totalCards) return;
    state.currentIndex = idx;
    playSound('flip');
    updateDeck();
  }

  function nextCard() {
    if (state.currentIndex < totalCards - 1) {
      goToCard(state.currentIndex + 1);
    } else {
      goToCard(0);
    }
  }

  function prevCard() {
    if (state.currentIndex > 0) {
      goToCard(state.currentIndex - 1);
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', prevCard);
  if (nextBtn) nextBtn.addEventListener('click', nextCard);

  const cardCover = document.getElementById('cardCover');
  if (cardCover) {
    cardCover.addEventListener('click', () => goToCard(1));
  }

  const openPlanBtn = document.getElementById('openPlanBtn');
  if (openPlanBtn) {
    openPlanBtn.addEventListener('click', () => goToCard(2));
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      nextCard();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevCard();
    }
  });

  // Mobile Touch Swipe
  let touchStartX = 0;
  let touchStartY = 0;
  const stage = document.getElementById('cardDeckStage');

  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) nextCard();
        else prevCard();
      }
    }, { passive: true });
  }

  // =========================================================================
  // CARD 3 ("TIC TOK" PAGE): REAL-TIME COUNTDOWN TIMER ENGINE
  // =========================================================================

  function updateCountdown() {
    const daysEl = document.getElementById('countDays');
    const hrsEl = document.getElementById('countHours');
    const minEl = document.getElementById('countMin');
    const secEl = document.getElementById('countSec');
    const statusBadge = document.getElementById('countdownStatusBadge');
    const statusText = document.getElementById('countdownStatusText');

    if (!daysEl || !hrsEl || !minEl || !secEl) return;

    const now = new Date().getTime();
    const target = state.event.targetDate instanceof Date && !isNaN(state.event.targetDate)
      ? state.event.targetDate.getTime()
      : (now + 7 * 24 * 60 * 60 * 1000);

    const diff = target - now;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hrsEl.textContent = '00';
      minEl.textContent = '00';
      secEl.textContent = '00';

      if (statusBadge && statusText) {
        statusBadge.classList.add('live-now');
        statusText.innerHTML = '🎉 <strong>IT\'S PARTY TIME! THE EVENT IS LIVE!</strong> 🔥';
      }
      return;
    }

    if (statusBadge && statusText) {
      statusBadge.classList.remove('live-now');
      statusText.textContent = 'Live Countdown to Event';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hrsEl.textContent = String(hours).padStart(2, '0');
    minEl.textContent = String(minutes).padStart(2, '0');
    secEl.textContent = String(seconds).padStart(2, '0');
  }

  // Ensure single running interval
  if (state.countdownInterval) clearInterval(state.countdownInterval);
  state.countdownInterval = setInterval(updateCountdown, 1000);

  // --- Apply State to UI Cards ---
  function applyEventStateToUI() {
    const d = state.event.targetDate;
    state.event.dateStr = formatDisplayDate(d);
    state.event.timeStr = `${formatDisplayTime(d)} onwards. ${state.event.timeNote || 'Post dinner scenes.'}`;

    // Card 0 Cover
    const coverTitleEl = document.getElementById('displayCoverTitle');
    if (coverTitleEl) {
      coverTitleEl.innerHTML = `${state.event.title}<br><span>sirf aapke liye</span>`;
    }

    // Card 1 Ace
    const aceTitleEl = document.getElementById('displayAceTitle');
    if (aceTitleEl) {
      aceTitleEl.innerHTML = `Iss Diwali,<br><span class="highlight-orange">${state.event.companyName}</span><br>manao.`;
    }

    // Card 2 King (The Plan)
    const kingDateEl = document.getElementById('displayKingWhenDate');
    const kingTimeEl = document.getElementById('displayKingWhenTime');
    const kingVenueEl = document.getElementById('displayKingVenue');
    const kingDrinksEl = document.getElementById('displayKingDrinks');
    const directionsLink = document.getElementById('directionsWhatsAppBtn');

    if (kingDateEl) kingDateEl.textContent = state.event.dateStr;
    if (kingTimeEl) kingTimeEl.textContent = state.event.timeStr;
    if (kingVenueEl) kingVenueEl.textContent = state.event.venue;
    if (kingDrinksEl) kingDrinksEl.textContent = state.event.drinks;

    if (directionsLink) {
      const cleanPhone = state.event.organizerWhatsApp.replace(/[^0-9]/g, '');
      const dirMsg = encodeURIComponent(`Hey! Need directions to ${state.event.title} at ${state.event.venue}`);
      directionsLink.href = `https://wa.me/${cleanPhone}?text=${dirMsg}`;
    }

    // Card 3 Queen ("TIC TOK" Page)
    const countdownTitleEl = document.getElementById('displayCountdownEventTitle');
    const countdownBadgeEl = document.getElementById('displayCountdownBadge');
    if (countdownTitleEl) countdownTitleEl.textContent = state.event.title;
    if (countdownBadgeEl) {
      countdownBadgeEl.textContent = `📅 ${state.event.dateStr} · ${formatDisplayTime(d)}`;
    }

    // Card 4 Jack Rulebook
    const rule1El = document.getElementById('displayRule1Heading');
    if (rule1El) rule1El.textContent = `${state.event.dressCode}.`;

    // Card 7 VIP Pass
    const vipTitleEl = document.getElementById('displayVipEventTitle');
    const vipMetaEl = document.getElementById('displayVipEventMeta');
    if (vipTitleEl) vipTitleEl.textContent = state.event.title;
    if (vipMetaEl) {
      vipMetaEl.textContent = `${formatShortDate(d)} · ${formatDisplayTime(d)} · ${state.event.venue}`;
    }

    updateVIPPass();
    updateCountdown();
  }

  // --- Sync Host Modal Form with State ---
  function syncHostFormInputs() {
    const nameInp = document.getElementById('hostEventName');
    const venueInp = document.getElementById('hostEventVenue');
    const dateInp = document.getElementById('hostEventDate');
    const timeInp = document.getElementById('hostEventTime');
    const phoneInp = document.getElementById('hostWhatsApp');
    const drinksInp = document.getElementById('hostDrinks');
    const dressInp = document.getElementById('hostDressCode');

    if (nameInp) nameInp.value = state.event.title;
    if (venueInp) venueInp.value = state.event.venue;
    if (phoneInp) {
      let p = state.event.organizerWhatsApp;
      if (p.startsWith('91') && p.length > 10) p = p.substring(2);
      phoneInp.value = p;
    }
    if (drinksInp) drinksInp.value = state.event.drinks;
    if (dressInp) dressInp.value = state.event.dressCode;

    if (dateInp && state.event.targetDate) {
      const yyyy = state.event.targetDate.getFullYear();
      const mm = String(state.event.targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(state.event.targetDate.getDate()).padStart(2, '0');
      dateInp.value = `${yyyy}-${mm}-${dd}`;
    }

    if (timeInp && state.event.targetDate) {
      const hh = String(state.event.targetDate.getHours()).padStart(2, '0');
      const min = String(state.event.targetDate.getMinutes()).padStart(2, '0');
      timeInp.value = `${hh}:${min}`;
    }

    const timeNoteInp = document.getElementById('hostTimeNote');
    if (timeNoteInp) timeNoteInp.value = state.event.timeNote || 'Post dinner scenes. Entry closes by 10 PM.';

    const pinInp = document.getElementById('hostNewPin');
    if (pinInp) pinInp.value = state.hostPin;

    syncTimeShortcutButtons(timeInp ? timeInp.value : '21:00');
    updateTimingLivePreview();
  }

  // --- Real-time Timing Live Preview in Host Form ---
  function updateTimingLivePreview() {
    const previewEl = document.getElementById('timingLivePreview');
    const dateInp = document.getElementById('hostEventDate');
    const timeInp = document.getElementById('hostEventTime');
    if (!previewEl || !dateInp || !timeInp || !dateInp.value) return;

    const [y, m, d] = dateInp.value.split('-').map(Number);
    const [hh, mm] = (timeInp.value || '21:00').split(':').map(Number);
    const tempDate = new Date(y, m - 1, d, hh, mm, 0);
    if (!isNaN(tempDate.getTime())) {
      previewEl.textContent = `📅 ${formatShortDate(tempDate)} · ${formatDisplayTime(tempDate)}`;
    }
  }

  function syncTimeShortcutButtons(currentTimeVal) {
    const timeShortcutBtns = document.querySelectorAll('.time-shortcut-btn');
    let matched = false;
    timeShortcutBtns.forEach(b => {
      if (b.dataset.time === currentTimeVal) {
        b.classList.add('active');
        matched = true;
      } else {
        b.classList.remove('active');
      }
    });
    if (!matched) {
      const customBtn = document.querySelector('.time-shortcut-btn[data-time="custom"]');
      if (customBtn) customBtn.classList.add('active');
    }
  }

  // --- Add to Google Calendar Action ---
  const addToCalendarBtn = document.getElementById('addToCalendarBtn');
  if (addToCalendarBtn) {
    addToCalendarBtn.addEventListener('click', () => {
      playSound('click');
      const title = encodeURIComponent(`${state.event.title} (${state.event.companyName})`);
      const details = encodeURIComponent(
        `${state.event.timeStr}\n\nDress Code: ${state.event.dressCode}\nDrinks: ${state.event.drinks}\nCurated by THE ALT SPACE (@thealtspace._)\nInstagram: ${state.event.companyInstagram}`
      );
      const location = encodeURIComponent(state.event.venue);
      const startIso = state.event.targetDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endDate = new Date(state.event.targetDate.getTime() + 6 * 60 * 60 * 1000);
      const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');

      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
      window.open(gcalUrl, '_blank');
    });
  }

  // --- RSVP Guest Name & Status ---
  const guestNameInput = document.getElementById('guestNameInput');
  const statusButtons = Array.from(document.querySelectorAll('.status-btn'));
  const passTierButtons = Array.from(document.querySelectorAll('.pass-tier-btn'));

  if (guestNameInput) {
    guestNameInput.addEventListener('input', (e) => {
      state.guest.name = e.target.value.trim() || 'Ravit';
      updateVIPPass();
    });
  }

  // --- Pass / Slot Tier Selection ---
  passTierButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      passTierButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.guest.passTier = btn.dataset.tier || 'Solo VIP';
      state.guest.slots = parseInt(btn.dataset.slots, 10) || 1;
      playSound('click');
      updateVIPPass();
      showToast(`Selected: ${state.guest.passTier} (${state.guest.slots} ${state.guest.slots === 1 ? 'Slot' : 'Slots'})`);
    });
  });

  statusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      statusButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.guest.status = btn.dataset.status || 'Pakka';
      playSound('click');
      updateVIPPass();
    });
  });

  // --- Role Picker & Witty Quotes ---
  const roleCards = Array.from(document.querySelectorAll('.role-card-item'));
  const wittyQuoteText = document.getElementById('wittyQuoteText');

  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const chosenRole = card.dataset.role || 'Game Master';
      state.guest.role = chosenRole;

      playSound('role');

      if (wittyQuoteText && wittyQuotes[chosenRole]) {
        wittyQuoteText.style.opacity = '0';
        setTimeout(() => {
          wittyQuoteText.textContent = wittyQuotes[chosenRole];
          wittyQuoteText.style.opacity = '1';
        }, 150);
      }

      updateVIPPass();
    });
  });

  // --- Dynamic VIP Pass Update ---
  function updateVIPPass() {
    const initialEl = document.getElementById('vipInitialChar');
    const nameEl = document.getElementById('vipGuestName');
    const roleEl = document.getElementById('vipRoleBadge');
    const subEl = document.getElementById('vipSubtitle');
    const bookingRefEl = document.getElementById('displayBookingRef');
    const slotsConfirmedEl = document.getElementById('displaySlotsConfirmed');

    const name = state.guest.name || 'Guest';
    const firstChar = name.charAt(0).toUpperCase() || 'R';

    if (initialEl) initialEl.textContent = firstChar;
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = state.guest.role.toUpperCase();
    if (subEl) {
      subEl.textContent = `Dealt in as ${state.guest.role}. Iss Diwali, THE ALT SPACE manao.`;
    }
    if (bookingRefEl) {
      bookingRefEl.textContent = `BOOKING REF: ${state.guest.bookingId}`;
    }
    if (slotsConfirmedEl) {
      slotsConfirmedEl.textContent = `✓ ${state.guest.slots} ${state.guest.slots === 1 ? 'SLOT' : 'SLOTS'} CONFIRMED (${state.guest.passTier.toUpperCase()})`;
    }
  }

  // --- Deal Me In on WhatsApp RSVP ---
  const dealInWhatsAppBtn = document.getElementById('dealInWhatsAppBtn');
  if (dealInWhatsAppBtn) {
    dealInWhatsAppBtn.addEventListener('click', () => {
      playSound('celebration');
      launchConfetti();

      const lines = [
        `✦ *${state.event.companyName} EVENT RSVP* ✦`,
        `🎟️ *Booking ID:* ${state.guest.bookingId}`,
        `🎉 *Event:* ${state.event.title} (${state.event.edition})`,
        `👤 *Guest Name:* ${state.guest.name}`,
        `🎫 *Pass Type:* ${state.guest.passTier} (${state.guest.slots} ${state.guest.slots === 1 ? 'Slot' : 'Slots'} Booked)`,
        `✨ *Attendance:* ${state.guest.status}`,
        `🎲 *Crew Role:* ${state.guest.role}`,
        `📍 *Venue:* ${state.event.venue}`,
        `📅 *Date:* ${state.event.dateStr} at ${state.event.timeStr}`,
        ``,
        `Deal me in! Confirmed my booking! 🔥`,
        `Instagram: @thealtspace._`
      ];

      const text = encodeURIComponent(lines.join('\n'));
      const rawTarget = state.event.organizerWhatsApp.replace(/[^0-9]/g, '');
      const target = rawTarget.startsWith('91') ? rawTarget : `91${rawTarget}`;
      const url = `https://wa.me/${target}?text=${text}`;

      setTimeout(() => {
        window.open(url, '_blank');
      }, 500);
    });
  }

  // --- Download VIP Pass ---
  const downloadPassBtn = document.getElementById('downloadPassBtn');
  if (downloadPassBtn) {
    downloadPassBtn.addEventListener('click', () => {
      playSound('click');
      downloadPassImage();
    });
  }

  function downloadPassImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');

    const bgGrad = ctx.createRadialGradient(400, 300, 50, 400, 550, 600);
    bgGrad.addColorStop(0, '#261543');
    bgGrad.addColorStop(0.6, '#130C23');
    bgGrad.addColorStop(1, '#090611');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1100);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 740, 1040);

    ctx.strokeStyle = '#FF5E3A';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(45, 45, 710, 1010);
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#A78BFA';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('THE ALT SPACE PRESENTS', 400, 110);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic bold 44px "Playfair Display", serif';
    ctx.fillText(state.event.title, 400, 170);

    ctx.fillStyle = '#FF5E3A';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(state.event.edition, 400, 210);

    const circleGrad = ctx.createLinearGradient(310, 260, 490, 440);
    circleGrad.addColorStop(0, '#FF5E3A');
    circleGrad.addColorStop(1, '#7C3AED');
    ctx.beginPath();
    ctx.arc(400, 350, 90, 0, Math.PI * 2);
    ctx.fillStyle = circleGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(400, 350, 82, 0, Math.PI * 2);
    ctx.fillStyle = '#170E2B';
    ctx.fill();

    ctx.fillStyle = '#FF8A00';
    ctx.font = 'italic 900 100px "Playfair Display", serif';
    ctx.fillText((state.guest.name.charAt(0) || 'R').toUpperCase(), 400, 385);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px "Space Grotesk", sans-serif';
    ctx.fillText(state.guest.name, 400, 500);

    ctx.fillStyle = '#FF5E3A';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`CREW ROLE: ${state.guest.role.toUpperCase()}`, 400, 560);

    ctx.strokeStyle = '#382559';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 610);
    ctx.lineTo(650, 610);
    ctx.stroke();

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${state.event.dateStr} · ${state.event.timeStr}`, 400, 665);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(state.event.venue, 400, 705);

    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`✓ ${state.guest.passTier.toUpperCase()} (${state.guest.slots} ${state.guest.slots === 1 ? 'SLOT' : 'SLOTS'} BOOKED)`, 400, 755);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`BOOKING REF: ${state.guest.bookingId} · CONFIRMED`, 400, 810);

    ctx.fillStyle = '#C4B5FD';
    ctx.font = '16px monospace';
    ctx.fillText('CURATED BY THE ALT SPACE', 400, 850);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Follow @thealtspace._ on Instagram', 400, 920);

    const link = document.createElement('a');
    link.download = `TheAltSpace-VIP-Pass-${state.guest.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // --- Confetti Explosion ---
  function launchConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#FF5E3A', '#F59E0B', '#7C3AED', '#EC4899', '#FAF6ED']
      });
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF5E3A', '#F59E0B', '#FDE68A']
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#7C3AED', '#EC4899', '#FAF6ED']
        });
      }, 250);
    }
  }

  // --- Ambient Golden Sparks Canvas ---
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 35;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.8,
        speedY: -(Math.random() * 0.4 + 0.15),
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.4 ? '#FF8A00' : '#F59E0B'
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
      });
      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  // =========================================================================
  // HOST SECURITY PIN AUTHENTICATION & SETTINGS CONTROLS
  // =========================================================================

  const hostModal = document.getElementById('hostModal');
  const openHostModalBtn = document.getElementById('openHostModalBtn');
  const card3SetTimingBtn = document.getElementById('card3SetTimingBtn');
  const closeHostModalBtn = document.getElementById('closeHostModalBtn');
  const hostSettingsForm = document.getElementById('hostSettingsForm');
  const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
  const presetButtons = document.querySelectorAll('.preset-pill-btn');

  // PIN Security Modal Elements
  const hostPinModal = document.getElementById('hostPinModal');
  const pinModalCard = document.getElementById('pinModalCard');
  const closeHostPinModalBtn = document.getElementById('closeHostPinModalBtn');
  const hostPinForm = document.getElementById('hostPinForm');
  const hostPinInput = document.getElementById('hostPinInput');
  const pinErrorMsg = document.getElementById('pinErrorMsg');
  const lockHostControlsBtn = document.getElementById('lockHostControlsBtn');

  // --- PIN Modal Open / Close ---
  function openHostPinModal(focusTarget = 'hostEventName') {
    state.pendingFocusField = focusTarget;
    if (pinErrorMsg) pinErrorMsg.textContent = '';
    if (hostPinInput) hostPinInput.value = '';
    if (hostPinModal) hostPinModal.classList.add('open');
    playSound('click');
    setTimeout(() => {
      if (hostPinInput) hostPinInput.focus();
    }, 150);
  }

  function closeHostPinModal() {
    if (hostPinModal) hostPinModal.classList.remove('open');
  }

  if (closeHostPinModalBtn) {
    closeHostPinModalBtn.addEventListener('click', () => {
      closeHostPinModal();
      playSound('click');
    });
  }

  if (hostPinModal) {
    hostPinModal.addEventListener('click', (e) => {
      if (e.target === hostPinModal) {
        closeHostPinModal();
        playSound('click');
      }
    });
  }

  // --- PIN Form Submit Verification ---
  if (hostPinForm) {
    hostPinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = hostPinInput.value.trim();

      if (enteredPin === state.hostPin) {
        // Authenticated!
        state.isHostAuthenticated = true;
        try {
          sessionStorage.setItem('altSpaceHostAuth', 'true');
        } catch (err) {}

        closeHostPinModal();
        playSound('celebration');
        showToast('🔓 Host access granted! Welcome back.');
        openHostModal(state.pendingFocusField || 'hostEventName');
      } else {
        // Incorrect PIN
        playSound('click');
        if (pinErrorMsg) {
          pinErrorMsg.textContent = '❌ Incorrect PIN. Only the host can edit event details.';
        }
        if (pinModalCard) {
          pinModalCard.classList.remove('shake');
          void pinModalCard.offsetWidth; // trigger reflow
          pinModalCard.classList.add('shake');
        }
        if (hostPinInput) {
          hostPinInput.select();
        }
      }
    });
  }

  // --- Check PIN Before Opening Host Customizer ---
  function requestHostAccess(focusField = null) {
    if (state.isHostAuthenticated) {
      openHostModal(focusField);
    } else {
      openHostPinModal(focusField);
    }
  }

  function openHostModal(focusField = null) {
    syncHostFormInputs();
    if (hostModal) hostModal.classList.add('open');
    playSound('click');
    if (focusField) {
      setTimeout(() => {
        const el = document.getElementById(focusField);
        if (el) el.focus();
      }, 150);
    }
  }

  if (openHostModalBtn) {
    openHostModalBtn.addEventListener('click', () => requestHostAccess('hostEventName'));
  }

  // Direct Button on Card 2 (King / The Plan - Avenue & Time)
  const card2SetTimingBtn = document.getElementById('card2SetTimingBtn');
  if (card2SetTimingBtn) {
    card2SetTimingBtn.addEventListener('click', () => requestHostAccess('hostEventTime'));
  }

  // Direct Button on Card 3 ("TIC TOK" Page)
  if (card3SetTimingBtn) {
    card3SetTimingBtn.addEventListener('click', () => requestHostAccess('hostEventDate'));
  }

  // Quick Time Shortcut Buttons in Host Modal
  const timeShortcutBtns = document.querySelectorAll('.time-shortcut-btn');
  timeShortcutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.time;
      timeShortcutBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (val === 'custom') {
        const timeInp = document.getElementById('hostEventTime');
        if (timeInp) timeInp.focus();
        return;
      }

      const timeInp = document.getElementById('hostEventTime');
      if (timeInp) {
        timeInp.value = val;
        updateTimingLivePreview();
      }
      playSound('click');
      showToast(`⏱️ Event time set to ${btn.textContent}!`);
    });
  });

  // Date and Time Input Listeners for Live Preview
  const hostDateInp = document.getElementById('hostEventDate');
  const hostTimeInp = document.getElementById('hostEventTime');
  if (hostDateInp) {
    hostDateInp.addEventListener('input', updateTimingLivePreview);
    hostDateInp.addEventListener('change', updateTimingLivePreview);
  }
  if (hostTimeInp) {
    hostTimeInp.addEventListener('input', () => {
      syncTimeShortcutButtons(hostTimeInp.value);
      updateTimingLivePreview();
    });
    hostTimeInp.addEventListener('change', () => {
      syncTimeShortcutButtons(hostTimeInp.value);
      updateTimingLivePreview();
    });
  }

  // Lock Host Controls Button
  if (lockHostControlsBtn) {
    lockHostControlsBtn.addEventListener('click', () => {
      state.isHostAuthenticated = false;
      try {
        sessionStorage.removeItem('altSpaceHostAuth');
      } catch (err) {}
      if (hostModal) hostModal.classList.remove('open');
      playSound('click');
      showToast('🔒 Host controls locked. PIN required to edit again.');
    });
  }

  if (closeHostModalBtn && hostModal) {
    closeHostModalBtn.addEventListener('click', () => {
      hostModal.classList.remove('open');
      playSound('click');
    });
  }

  if (hostModal) {
    hostModal.addEventListener('click', (e) => {
      if (e.target === hostModal) {
        hostModal.classList.remove('open');
        playSound('click');
      }
    });
  }

  // Preset Buttons Logic
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.preset;
      const target = new Date();
      let hours = 21;
      let minutes = 0;

      if (type === 'tonight') {
        // Tonight 9 PM (or 11 PM if past 9 PM)
        if (target.getHours() >= 21) {
          target.setHours(23, 0, 0, 0);
          hours = 23;
        } else {
          target.setHours(21, 0, 0, 0);
          hours = 21;
        }
      } else if (type === 'tomorrow') {
        target.setDate(target.getDate() + 1);
        target.setHours(21, 0, 0, 0);
        hours = 21;
      } else if (type === 'saturday') {
        // Next upcoming Saturday
        const dayOfWeek = target.getDay();
        const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
        target.setDate(target.getDate() + daysUntilSat);
        target.setHours(20, 0, 0, 0);
        hours = 20;
      } else if (type === 'diwali') {
        // Nov 4 9 PM
        const currentYear = target.getFullYear();
        let diwaliDate = new Date(currentYear, 10, 4, 21, 0, 0);
        if (diwaliDate.getTime() < Date.now()) {
          diwaliDate = new Date(currentYear + 1, 10, 4, 21, 0, 0);
        }
        target.setTime(diwaliDate.getTime());
        hours = 21;
      }

      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      const dateInp = document.getElementById('hostEventDate');
      const timeInp = document.getElementById('hostEventTime');

      if (dateInp) dateInp.value = `${yyyy}-${mm}-${dd}`;
      if (timeInp) timeInp.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      syncTimeShortcutButtons(timeInp ? timeInp.value : '21:00');
      updateTimingLivePreview();

      playSound('click');
      showToast(`Preset: ${btn.textContent} selected!`);
    });
  });

  // Save & Apply Host Customizations
  if (hostSettingsForm) {
    hostSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameVal = document.getElementById('hostEventName').value.trim();
      const venueVal = document.getElementById('hostEventVenue').value.trim();
      const dateVal = document.getElementById('hostEventDate').value;
      const timeVal = document.getElementById('hostEventTime').value;
      const timeNoteVal = document.getElementById('hostTimeNote') ? document.getElementById('hostTimeNote').value.trim() : '';
      const phoneVal = document.getElementById('hostWhatsApp').value.trim().replace(/[^0-9]/g, '');
      const drinksVal = document.getElementById('hostDrinks').value.trim();
      const dressVal = document.getElementById('hostDressCode').value.trim();

      if (nameVal) state.event.title = nameVal;
      if (venueVal) state.event.venue = venueVal;
      if (timeNoteVal) state.event.timeNote = timeNoteVal;
      if (drinksVal) state.event.drinks = drinksVal;
      if (dressVal) state.event.dressCode = dressVal;
      if (phoneVal) {
        state.event.organizerWhatsApp = phoneVal.startsWith('91') ? phoneVal : `91${phoneVal}`;
      }

      if (dateVal) {
        const [y, m, d] = dateVal.split('-').map(Number);
        const [hh, mm] = (timeVal || '21:00').split(':').map(Number);
        state.event.targetDate = new Date(y, m - 1, d, hh, mm, 0);
      }

      const newPinVal = document.getElementById('hostNewPin') ? document.getElementById('hostNewPin').value.trim() : '';
      if (newPinVal && newPinVal.length >= 4) {
        state.hostPin = newPinVal;
        try {
          localStorage.setItem('altSpaceHostPin', newPinVal);
        } catch (err) {}
      }

      // Persist to LocalStorage
      try {
        localStorage.setItem('altSpaceHostEvent', JSON.stringify({
          title: state.event.title,
          venue: state.event.venue,
          targetDate: state.event.targetDate.toISOString(),
          timeNote: state.event.timeNote,
          drinks: state.event.drinks,
          dressCode: state.event.dressCode,
          organizerWhatsApp: state.event.organizerWhatsApp
        }));
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }

      applyEventStateToUI();
      if (hostModal) hostModal.classList.remove('open');
      playSound('celebration');
      launchConfetti();
      showToast('⏱️ Timer is live! Counting down to your event.');
      
      // JUMP DIRECTLY TO CARD 3 (THE "TIC TOK" PAGE) SO HOST SEES THE LIVE TIMER!
      goToCard(3);
    });
  }

  // Copy Shareable Link with Query Params
  if (copyShareLinkBtn) {
    copyShareLinkBtn.addEventListener('click', () => {
      const base = window.location.origin + window.location.pathname;
      const d = state.event.targetDate;
      const isoDate = d.toISOString();

      const params = new URLSearchParams();
      params.set('event', state.event.title);
      params.set('venue', state.event.venue);
      params.set('date', isoDate);
      params.set('phone', state.event.organizerWhatsApp);
      params.set('drinks', state.event.drinks);
      params.set('dress', state.event.dressCode);
      if (state.event.timeNote) params.set('timenote', state.event.timeNote);

      const shareUrl = `${base}?${params.toString()}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          playSound('click');
          showToast('📋 Share link copied! Send it on WhatsApp.');
        }).catch(() => {
          prompt('Copy this shareable link:', shareUrl);
        });
      } else {
        prompt('Copy this shareable link:', shareUrl);
      }
    });
  }

  // Initial Load
  loadSavedOrUrlParams();
  updateDeck();
});
