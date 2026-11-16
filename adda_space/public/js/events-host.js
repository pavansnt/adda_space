import {
  getCsrfToken, escapeHtml, stripHtml, isPendingEvent, isPastEvent, recapStateHtml,
  getCategoryClass, getCategoryLabel, formatEventTime, formatEventTimeRange,
  formatLongDate, formatDayPopupDate
} from './events-utils.js';

export function createHostController(ctx) {
  var isHostLoggedIn = ctx.dom.hostModalBackdrop && ctx.dom.hostModalBackdrop.getAttribute('data-logged-in') === 'true';
  var hostUserEmail = (ctx.dom.hostModalBackdrop && ctx.dom.hostModalBackdrop.getAttribute('data-user')) || '';
  var selectedPosterFile = null;
  var selectedPosterDataUrl = '';
  var uploadedPosterUrl = '';
  var modalPosterSource = 'upload';
  var currentCoordinatorData = null;
  var currentRoomData = null;
  var pendingModalStartTime = '';
  var pendingModalEndTime = '';
  var currentCoordinatorCity = '';
  var currentCoordinatorTimezone = 'Asia/Kolkata';
  var selectedHostDate = null;
  var coordFetchSeq = 0;
  var hostModalStep = 1;
  var hostAvailableRooms = [];
  var modalAvailabilitySeq = 0;
  var modalAvailabilityStatus = 'unknown';
  var isSubmittingHostProposal = false;

  // ========================================================================
  // HOST AT ADDA MULTI-STEP MODAL LOGIC
  // ========================================================================

  var currentCoordinatorData = null;
  var currentRoomData = null;
  var pendingModalStartTime = '';
  var pendingModalEndTime = '';
  var currentCoordinatorCity = '';
  var currentCoordinatorTimezone = 'Asia/Kolkata';
  var selectedHostDate = null;
  var coordFetchSeq = 0;

  function normalizePhoneNumber(phone, defaultCode) {
    defaultCode = defaultCode || '91';
    if (!phone) return '';
    var raw = String(phone).trim();
    var digits = raw.replace(/[^\d]/g, '');
    if (raw.charAt(0) === '+') {
      return digits;
    }
    if (digits.length === 10) {
      return defaultCode + digits;
    }
    if (digits.length === 11 && digits.charAt(0) === '0') {
      return defaultCode + digits.slice(1);
    }
    return digits;
  }

  function formatTime12hr(timeStr) {
    if (!timeStr) return '';
    var parts = String(timeStr).trim().split(':');
    var hours = parseInt(parts[0], 10);
    if (isNaN(hours)) return timeStr;
    var minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isNaN(minutes)) minutes = 0;
    var ampm = hours >= 12 ? 'PM' : 'AM';
    var h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    var mStr = minutes < 10 ? '0' + minutes : String(minutes);
    return h12 + ':' + mStr + ' ' + ampm;
  }

  function generateWhatsAppUrl(coordName, cityName, phone, eventDate) {
    var normPhone = normalizePhoneNumber(phone);
    var dateVal = (eventDate && String(eventDate).trim()) ? String(eventDate).trim() : 'a date I’m still planning';
    var msg = 'Hi ' + coordName + ', I’d like to host an event at the Adda in ' + cityName + '. I’m looking at ' + dateVal + '. Could you help me plan it?';
    return 'https://wa.me/' + normPhone + '?text=' + encodeURIComponent(msg);
  }

  function updateWhatsAppLink() {
    var waLink = document.getElementById('modal-coord-wa-link');
    var waText = document.getElementById('modal-coord-wa-text');
    if (!waLink) return;

    if (!currentCoordinatorData || !currentCoordinatorData.whatsapp_number) {
      waLink.style.display = 'none';
      waLink.removeAttribute('href');
      waLink.classList.add('disabled');
      waLink.setAttribute('aria-disabled', 'true');
      return;
    }

    var coordName = currentCoordinatorData.coordinator_name || 'Coordinator';
    var cityName = currentCoordinatorCity || (ctx.dom.modalCitySelect ? ctx.dom.modalCitySelect.value : '') || 'Bengaluru';
    var phone = currentCoordinatorData.whatsapp_number;
    var dateToUse = selectedHostDate || (ctx.dom.modalEventDate ? ctx.dom.modalEventDate.value : null);

    var url = generateWhatsAppUrl(coordName, cityName, phone, dateToUse);
    waLink.href = url;
    waLink.style.display = 'inline-flex';
    waLink.classList.remove('disabled');
    waLink.removeAttribute('aria-disabled');
    if (waText) {
      waText.textContent = 'WhatsApp ' + phone;
    }
  }

  function updateRoomOperatingHoursDisplay(room) {
    var hoursBox = document.getElementById('modal-room-hours-box');
    var hoursTitle = document.getElementById('modal-room-hours-title');
    var tzEl = document.getElementById('modal-room-timezone');
    var hoursGrid = document.getElementById('modal-room-hours-grid');
    var hoursMissing = document.getElementById('modal-room-hours-missing');
    var openTimeEl = document.getElementById('modal-room-open-time');
    var closeTimeEl = document.getElementById('modal-room-close-time');

    if (!hoursBox) return;

    if (!room) {
      hoursBox.style.display = 'none';
      if (hoursMissing) hoursMissing.style.display = 'none';
      return;
    }

    hoursBox.style.display = 'block';
    if (hoursTitle) {
      hoursTitle.textContent = (room.room_name || room.name || 'Space') + ' Hours';
    }
    if (tzEl) {
      tzEl.textContent = room.timezone || 'Asia/Kolkata';
    }

    if (room.opening_time && room.closing_time) {
      if (hoursGrid) hoursGrid.style.display = 'flex';
      if (hoursMissing) hoursMissing.style.display = 'none';
      if (openTimeEl) openTimeEl.textContent = room.formatted_opening_time || formatTime12hr(room.opening_time);
      if (closeTimeEl) closeTimeEl.textContent = room.formatted_closing_time || formatTime12hr(room.closing_time);
    } else {
      if (hoursGrid) hoursGrid.style.display = 'none';
      if (hoursMissing) hoursMissing.style.display = 'block';
    }
  }

  function checkOperatingHoursWarning() {
    var warningBox = document.getElementById('modal-hours-warning');
    var warningText = document.getElementById('modal-hours-warning-text');
    if (!warningBox || !warningText) return;

    if (!currentRoomData || !currentRoomData.opening_time || !currentRoomData.closing_time) {
      warningBox.style.display = 'none';
      setTimeOptions(ctx.dom.modalStartTime, [], 'Select an Adda space first');
      setTimeOptions(ctx.dom.modalEndTime, [], 'Select an Adda space first');
      if (ctx.dom.modalEndTime) ctx.dom.modalEndTime.disabled = true;
      return;
    }

    var openT = normalizeClockTime(currentRoomData.opening_time);
    var closeT = normalizeClockTime(currentRoomData.closing_time);
    if (!openT || !closeT) {
      warningBox.style.display = 'none';
      setTimeOptions(ctx.dom.modalStartTime, [], 'Space hours could not be read');
      setTimeOptions(ctx.dom.modalEndTime, [], 'Space hours could not be read');
      if (ctx.dom.modalEndTime) ctx.dom.modalEndTime.disabled = true;
      return;
    }
    var closeParts = closeT.split(':').map(Number);
    var openParts = openT.split(':').map(Number);
    var openMinutes = openParts[0] * 60 + openParts[1];
    var closeMinutes = closeParts[0] * 60 + closeParts[1];
    var lastStartMinutes = closeMinutes - 15;
    var preferredStart = ctx.dom.modalStartTime.value || pendingModalStartTime;
    var preferredEnd = ctx.dom.modalEndTime.value || pendingModalEndTime;
    setTimeOptions(ctx.dom.modalStartTime, timeChoices(openMinutes, lastStartMinutes), 'Select a start time', preferredStart);
    updateModalEndTimeOptions(preferredEnd);
    pendingModalStartTime = '';
    pendingModalEndTime = '';
    updateDurationDisplay();

    var startTimeVal = ctx.dom.modalStartTime ? ctx.dom.modalStartTime.value : '';
    var endTimeVal = ctx.dom.modalEndTime ? ctx.dom.modalEndTime.value : '';
    if (!startTimeVal || !endTimeVal) {
      warningBox.style.display = 'none';
      return;
    }

    var reqOpen = startTimeVal.slice(0, 5);
    var reqClose = endTimeVal.slice(0, 5);

    if (timeToMinutes(reqOpen) < timeToMinutes(openT) || timeToMinutes(reqClose) > timeToMinutes(closeT) || timeToMinutes(reqClose) <= timeToMinutes(reqOpen)) {
      var openFmt = currentRoomData.formatted_opening_time || formatTime12hr(openT);
      var closeFmt = currentRoomData.formatted_closing_time || formatTime12hr(closeT);
      warningText.textContent = 'Event must start at or after ' + openFmt + ' and finish by ' + closeFmt + '.';
      warningBox.style.display = 'block';
      warningBox.classList.remove('adda-avail-warning');
      warningBox.classList.add('adda-avail-alert');
    } else {
      warningBox.style.display = 'none';
    }
  }

  function timeToMinutes(value) {
    var normalized = normalizeClockTime(value);
    if (!normalized) return NaN;
    var parts = normalized.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  }

  function normalizeClockTime(value) {
    var match = String(value || '').trim().match(/(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/);
    if (!match) return '';
    return String(Number(match[1])).padStart(2, '0') + ':' + match[2];
  }

  function minutesToTime(minutes) {
    return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
  }

  function timeChoices(first, last) {
    var values = [];
    for (var minutes = first; minutes <= last; minutes += 15) values.push(minutesToTime(minutes));
    if (values.indexOf(minutesToTime(last)) === -1) values.push(minutesToTime(last));
    return values;
  }

  function setTimeOptions(select, values, placeholder, preferred) {
    if (!select) return;
    select.innerHTML = '';
    var prompt = document.createElement('option');
    prompt.value = '';
    prompt.textContent = placeholder;
    prompt.disabled = true;
    prompt.selected = true;
    select.appendChild(prompt);
    values.forEach(function(value) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = formatTime12hr(value);
      select.appendChild(option);
    });
    if (preferred && values.indexOf(String(preferred).slice(0, 5)) !== -1) select.value = String(preferred).slice(0, 5);
    else if (values.length) select.value = values[0];
  }

  function updateModalEndTimeOptions(preferred) {
    if (!currentRoomData || !currentRoomData.closing_time || !ctx.dom.modalStartTime || !ctx.dom.modalStartTime.value) {
      setTimeOptions(ctx.dom.modalEndTime, [], 'Select a start time first');
      if (ctx.dom.modalEndTime) ctx.dom.modalEndTime.disabled = true;
      return;
    }
    var closing = timeToMinutes(currentRoomData.closing_time);
    var start = timeToMinutes(ctx.dom.modalStartTime.value);
    setTimeOptions(ctx.dom.modalEndTime, timeChoices(start + 15, closing), 'Select an end time', preferred || minutesToTime(start + 60));
    ctx.dom.modalEndTime.disabled = false;
  }

  function updateCoordinatorInfo(cityName) {
    var targetCity = (cityName || '').trim();
    var coordinatorCard = document.getElementById('modal-coordinator-card');
    if (!targetCity) {
      coordFetchSeq++;
      currentCoordinatorData = null;
      if (coordinatorCard) coordinatorCard.style.display = 'none';
      return;
    }
    if (coordinatorCard) coordinatorCard.style.display = 'block';

    var currentSeq = ++coordFetchSeq;
    currentCoordinatorData = null;

    var coordLoading = document.getElementById('modal-coord-loading');
    var coordEmpty = document.getElementById('modal-coord-empty');
    var coordEmptyMsg = document.getElementById('modal-coord-empty-msg');
    var coordRetryBtn = document.getElementById('modal-coord-retry-btn');
    var coordContent = document.getElementById('modal-coord-content');
    var coordCityTag = document.getElementById('modal-coord-city-tag');
    var waLink = document.getElementById('modal-coord-wa-link');

    if (coordCityTag) coordCityTag.textContent = targetCity + ' Adda Space';

    // Set loading state
    if (coordLoading) coordLoading.style.display = 'flex';
    if (coordEmpty) coordEmpty.style.display = 'none';
    if (coordContent) coordContent.style.display = 'none';
    if (waLink) {
      waLink.style.display = 'none';
      waLink.removeAttribute('href');
      waLink.classList.add('disabled');
      waLink.setAttribute('aria-disabled', 'true');
    }

    fetch('/api/method/adda_space.api.events.get_city_coordinator?city=' + encodeURIComponent(targetCity), {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Frappe-CSRF-Token': getCsrfToken()
      }
    })
    .then(function(res) {
      return res.json().then(function(data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    })
    .then(function(result) {
      // Ignore stale response if user rapidly selected another city
      if (currentSeq !== coordFetchSeq) return;

      if (coordLoading) coordLoading.style.display = 'none';

      var payload = result.data.message || result.data;
      if (!result.ok || !payload || payload.coordinator === null || !payload.coordinator) {
        currentCoordinatorData = null;
        currentCoordinatorCity = targetCity;
        currentCoordinatorTimezone = (payload && payload.timezone) || 'Asia/Kolkata';

        var emptyMsg = (payload && payload.message) || 'No active coordinator is assigned to this city yet.';
        if (coordEmptyMsg) coordEmptyMsg.textContent = emptyMsg;
        if (coordRetryBtn) coordRetryBtn.style.display = 'none';
        if (coordEmpty) coordEmpty.style.display = 'block';
        if (coordContent) coordContent.style.display = 'none';
        updateWhatsAppLink();
        return;
      }

      var coord = payload.coordinator;
      currentCoordinatorData = coord;
      currentCoordinatorCity = payload.city || targetCity;
      currentCoordinatorTimezone = payload.timezone || 'Asia/Kolkata';

      if (coordEmpty) coordEmpty.style.display = 'none';
      if (coordContent) coordContent.style.display = 'block';

      // Update Coordinator Info
      var coordNameEl = document.getElementById('modal-coord-name');
      var coordRoleEl = document.getElementById('modal-coord-role');
      var coordContactEl = document.getElementById('modal-coord-contact');

      if (coordNameEl) coordNameEl.textContent = coord.coordinator_name || '';
      if (coordRoleEl) {
        if (coord.role_title) {
          coordRoleEl.textContent = coord.role_title;
          coordRoleEl.style.display = 'block';
        } else {
          coordRoleEl.style.display = 'none';
        }
      }
      if (coordContactEl) coordContactEl.textContent = coord.whatsapp_number || '';

      // Update WhatsApp link
      updateWhatsAppLink();
    })
    .catch(function(err) {
      if (currentSeq !== coordFetchSeq) return;

      if (coordLoading) coordLoading.style.display = 'none';
      if (coordContent) coordContent.style.display = 'none';
      currentCoordinatorData = null;

      if (coordEmptyMsg) coordEmptyMsg.textContent = 'Unable to load coordinator details. Please try again.';
      if (coordRetryBtn) {
        coordRetryBtn.style.display = 'inline';
        coordRetryBtn.onclick = function() {
          updateCoordinatorInfo(targetCity);
        };
      }
      if (coordEmpty) coordEmpty.style.display = 'block';
      updateWhatsAppLink();
    });
  }

  function resetHostModalForm() {
    selectedHostDate = null;
    currentCoordinatorData = null;
    currentRoomData = null;
    updateRoomOperatingHoursDisplay(null);
    modalAvailabilitySeq++;
    modalAvailabilityStatus = 'unknown';
    var hoursWarn = document.getElementById('modal-hours-warning');
    if (hoursWarn) hoursWarn.style.display = 'none';

    try {
      sessionStorage.removeItem('adda_host_form_data');
    } catch(e) {}

    if (ctx.dom.modalTitleInput) ctx.dom.modalTitleInput.value = '';
    if (ctx.dom.modalDescInput) ctx.dom.modalDescInput.value = '';
    if (ctx.dom.modalPeopleInput) ctx.dom.modalPeopleInput.value = '20';
    if (ctx.dom.modalModeSelect) ctx.dom.modalModeSelect.value = 'Offline';
    if (ctx.dom.modalSelectedRoom) ctx.dom.modalSelectedRoom.value = '';
    if (ctx.dom.modalRoomsGrid) {
      ctx.dom.modalRoomsGrid.querySelectorAll('.adda-room-card').forEach(function(c) { c.classList.remove('selected'); });
    }

    selectedPosterFile = null;
    selectedPosterDataUrl = '';
    uploadedPosterUrl = '';
    if (ctx.dom.modalPosterFile) ctx.dom.modalPosterFile.value = '';
    if (ctx.dom.modalPosterUrlInput) ctx.dom.modalPosterUrlInput.value = '';
    if (ctx.dom.modalHostPosterImg) ctx.dom.modalHostPosterImg.src = '';
    if (ctx.dom.modalPosterFilename) ctx.dom.modalPosterFilename.textContent = '';
    if (ctx.dom.modalPosterFilesize) ctx.dom.modalPosterFilesize.textContent = '';
    if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'none';

    if (ctx.dom.modalStep1Error) ctx.dom.modalStep1Error.style.display = 'none';
    var step2Err = document.getElementById('modal-step-2-error');
    if (step2Err) step2Err.style.display = 'none';
    if (ctx.dom.modalStep3Error) ctx.dom.modalStep3Error.style.display = 'none';
    if (ctx.dom.modalSubmitErrorBox) ctx.dom.modalSubmitErrorBox.style.display = 'none';
    if (ctx.dom.modalAvailBanner) ctx.dom.modalAvailBanner.style.display = 'none';

    if (ctx.dom.modalStepSubmitBtn) {
      ctx.dom.modalStepSubmitBtn.disabled = false;
      ctx.dom.modalStepSubmitBtn.textContent = 'Submit Gathering Proposal';
    }
  }

  function openHostModal(prefilledDate, preserveDraft) {
    if (!ctx.dom.hostModalBackdrop) return;

    selectedHostDate = prefilledDate || null;

    // Reset previous inputs if fresh proposal or prefilling date
    if (!preserveDraft && (hostModalStep === 5 || prefilledDate)) {
      resetHostModalForm();
      selectedHostDate = prefilledDate || null;
    }

    if (prefilledDate && ctx.dom.modalEventDate) {
      ctx.dom.modalEventDate.value = prefilledDate;
    } else if (ctx.dom.modalEventDate && !ctx.dom.modalEventDate.value) {
      ctx.dom.modalEventDate.value = istDateStr;
    }

    var targetCity = preserveDraft
      ? ((ctx.dom.modalCitySelect && ctx.dom.modalCitySelect.value) || ctx.calendarState.currentCity || '')
      : (ctx.calendarState.currentCity || '');
    if (ctx.dom.modalCitySelect) {
      ctx.dom.modalCitySelect.value = targetCity;
    }
    if (targetCity) {
      updateCoordinatorInfo(targetCity);
    } else {
      coordFetchSeq++;
      currentCoordinatorData = null;
      pendingModalStartTime = '';
      pendingModalEndTime = '';
      checkOperatingHoursWarning();
      var coordLoading = document.getElementById('modal-coord-loading');
      var coordContent = document.getElementById('modal-coord-content');
      var coordEmpty = document.getElementById('modal-coord-empty');
      var coordinatorCard = document.getElementById('modal-coordinator-card');
      if (coordLoading) coordLoading.style.display = 'none';
      if (coordContent) coordContent.style.display = 'none';
      if (coordEmpty) coordEmpty.style.display = 'none';
      if (coordinatorCard) coordinatorCard.style.display = 'none';
    }

    // Resume drafts at time selection so room hours and availability are rechecked.
    if (prefilledDate && targetCity) {
      goToModalStep(2);
      loadModalRooms(targetCity, function() {
        checkModalRoomAvailability();
      });
    } else {
      goToModalStep(1);
      if (targetCity) {
        loadModalRooms(targetCity);
      } else {
        hostAvailableRooms = [];
        if (ctx.dom.modalRoomsGrid) ctx.dom.modalRoomsGrid.innerHTML = '';
        if (ctx.dom.modalRoomsLoading) ctx.dom.modalRoomsLoading.style.display = 'none';
      }
    }

    ctx.dom.hostModalBackdrop.style.display = 'flex';
    setTimeout(function() {
      ctx.dom.hostModalBackdrop.classList.add('is-open');
    }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeHostModal() {
    if (!ctx.dom.hostModalBackdrop) return;
    var wasSubmitted = (hostModalStep === 5);
    ctx.dom.hostModalBackdrop.classList.remove('is-open');
    setTimeout(function() {
      ctx.dom.hostModalBackdrop.style.display = 'none';
      document.body.style.overflow = '';
      if (wasSubmitted) {
        resetHostModalForm();
        ctx.calendarListController.fetchCalendarEvents();
      }
    }, 200);
  }

  if (ctx.dom.openHostModalBtn) ctx.dom.openHostModalBtn.addEventListener('click', function() { openHostModal(); });
  if (ctx.dom.calDrawerHostBtn) ctx.dom.calDrawerHostBtn.addEventListener('click', function() { openHostModal(ctx.calendarState.selectedDateStr); });
  if (ctx.dom.calDrawerHostActiveBtn) ctx.dom.calDrawerHostActiveBtn.addEventListener('click', function() { openHostModal(ctx.calendarState.selectedDateStr); });
  if (ctx.dom.emptyHostBtn) ctx.dom.emptyHostBtn.addEventListener('click', function() { openHostModal(); });
  if (ctx.dom.hostModalCloseBtn) ctx.dom.hostModalCloseBtn.addEventListener('click', closeHostModal);
  if (ctx.dom.modalConfCloseBtn) ctx.dom.modalConfCloseBtn.addEventListener('click', closeHostModal);

  // Screen 1 close button
  var hostStep1CloseBtn = document.getElementById('host-step-1-close-btn');
  if (hostStep1CloseBtn) hostStep1CloseBtn.addEventListener('click', closeHostModal);

  // Screen 2 close buttons
  var hostStep2CloseBtn = document.getElementById('host-step-2-close-btn');
  var hostStep2CloseBtnBottom = document.getElementById('host-step-2-close-btn-bottom');
  if (hostStep2CloseBtn) hostStep2CloseBtn.addEventListener('click', closeHostModal);
  if (hostStep2CloseBtnBottom) hostStep2CloseBtnBottom.addEventListener('click', closeHostModal);

  // Screen 3 close buttons
  var hostStep3CloseBtn = document.getElementById('host-step-3-close-btn');
  var hostStep3CloseBtnBottom = document.getElementById('host-step-3-close-btn-bottom');
  if (hostStep3CloseBtn) hostStep3CloseBtn.addEventListener('click', closeHostModal);
  if (hostStep3CloseBtnBottom) hostStep3CloseBtnBottom.addEventListener('click', closeHostModal);

  // Modal city select change handler - immediately updates coordinator info & preloads rooms
  if (ctx.dom.modalCitySelect) {
    ctx.dom.modalCitySelect.addEventListener('change', function() {
      updateCoordinatorInfo(this.value);
      loadModalRooms(this.value);
    });
  }

  // Screen Back buttons
  var hostStep2BackBtn = document.getElementById('host-step-2-back-btn');
  if (hostStep2BackBtn) hostStep2BackBtn.addEventListener('click', function() { goToModalStep(1); });

  var hostStep3BackBtn = document.getElementById('host-step-3-back-btn');
  if (hostStep3BackBtn) hostStep3BackBtn.addEventListener('click', function() { goToModalStep(2); });

  if (ctx.dom.hostModalBackdrop) {
    ctx.dom.hostModalBackdrop.addEventListener('click', function(e) {
      if (e.target === ctx.dom.hostModalBackdrop) {
        closeHostModal();
      }
    });
  }

  function saveHostDraft() {
    var state = {
      city: ctx.dom.modalCitySelect ? ctx.dom.modalCitySelect.value : '',
      date: ctx.dom.modalEventDate ? ctx.dom.modalEventDate.value : '',
      start_time: ctx.dom.modalStartTime ? ctx.dom.modalStartTime.value : '',
      end_time: ctx.dom.modalEndTime ? ctx.dom.modalEndTime.value : '',
      room_name: ctx.dom.modalSelectedRoom ? ctx.dom.modalSelectedRoom.value : '',
      title: ctx.dom.modalTitleInput ? ctx.dom.modalTitleInput.value : '',
      description: ctx.dom.modalDescInput ? ctx.dom.modalDescInput.value : '',
      people_expected: ctx.dom.modalPeopleInput ? ctx.dom.modalPeopleInput.value : '',
      mode: ctx.dom.modalModeSelect ? ctx.dom.modalModeSelect.value : 'Offline',
      poster_filename: selectedPosterFile ? selectedPosterFile.name : (ctx.dom.modalPosterFilename ? ctx.dom.modalPosterFilename.textContent : ''),
      uploaded_poster_url: (ctx.dom.modalPosterUrlInput && ctx.dom.modalPosterUrlInput.value.trim()) || uploadedPosterUrl || '',
      poster_source: modalPosterSource || 'upload'
    };
    try {
      sessionStorage.setItem('adda_host_form_data', JSON.stringify(state));
    } catch(e) {}
  }

  function restoreHostDraft() {
    try {
      var raw = sessionStorage.getItem('adda_host_form_data');
      if (!raw) return false;
      var state = JSON.parse(raw);
      if (!state || typeof state !== 'object') return false;

      // Only treat as draft if user has provided at least a title, room, description, or poster
      var hasMeaningfulData = Boolean(
        (state.title && state.title.trim()) ||
        (state.room_name && state.room_name.trim()) ||
        (state.description && state.description.trim()) ||
        state.uploaded_poster_url
      );
      if (!hasMeaningfulData) return false;

      if (state.city && ctx.dom.modalCitySelect) {
        ctx.dom.modalCitySelect.value = state.city;
      }
      if (state.date && ctx.dom.modalEventDate) {
        ctx.dom.modalEventDate.value = state.date;
        selectedHostDate = state.date;
      }
      pendingModalStartTime = state.start_time || '';
      pendingModalEndTime = state.end_time || '';
      if (state.room_name && ctx.dom.modalSelectedRoom) ctx.dom.modalSelectedRoom.value = state.room_name;
      if (state.title && ctx.dom.modalTitleInput) ctx.dom.modalTitleInput.value = state.title;
      if (state.description && ctx.dom.modalDescInput) ctx.dom.modalDescInput.value = state.description;
      if (state.people_expected && ctx.dom.modalPeopleInput) ctx.dom.modalPeopleInput.value = state.people_expected;
      if (state.mode && ctx.dom.modalModeSelect) ctx.dom.modalModeSelect.value = state.mode;
      if (state.poster_source === 'url' || (state.uploaded_poster_url && /^https?:\/\//i.test(state.uploaded_poster_url))) {
        setModalPosterTab('url');
        if (ctx.dom.modalPosterUrlInput) ctx.dom.modalPosterUrlInput.value = state.uploaded_poster_url;
      }
      if (state.uploaded_poster_url) {
        uploadedPosterUrl = state.uploaded_poster_url;
        if (ctx.dom.modalHostPosterImg) ctx.dom.modalHostPosterImg.src = uploadedPosterUrl;
        if (ctx.dom.modalPosterFilename) ctx.dom.modalPosterFilename.textContent = state.poster_filename || (uploadedPosterUrl.split('?')[0].split('/').pop()) || 'Poster Image';
        if (ctx.dom.modalPosterFilesize) ctx.dom.modalPosterFilesize.textContent = /^https?:\/\//i.test(uploadedPosterUrl) ? 'Web Image Link' : 'Uploaded';
        if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'block';
      }

      return true;
    } catch(e) {
      return false;
    }
  }

  function goToModalStep(step) {
    hostModalStep = step;
    saveHostDraft();

    if (step === 1) {
      var currentChosenCity = (ctx.dom.modalCitySelect && ctx.dom.modalCitySelect.value) || '';
      updateCoordinatorInfo(currentChosenCity);
    }

    if (step === 3) {
      if (selectedPosterDataUrl || uploadedPosterUrl) {
        if (ctx.dom.modalHostPosterImg) ctx.dom.modalHostPosterImg.src = selectedPosterDataUrl || uploadedPosterUrl;
        if (ctx.dom.modalPosterFilename && selectedPosterFile) ctx.dom.modalPosterFilename.textContent = selectedPosterFile.name;
        else if (ctx.dom.modalPosterFilename && uploadedPosterUrl) ctx.dom.modalPosterFilename.textContent = uploadedPosterUrl.split('/').pop();
        if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'block';
      }
    }

    for (var i = 1; i <= 4; i++) {
      var navEl = document.getElementById('modal-nav-step-' + i);
      var panelEl = document.getElementById('modal-panel-step-' + i);
      if (navEl) {
        navEl.classList.remove('active', 'completed');
        if (i === hostModalStep) navEl.classList.add('active');
        else if (i < hostModalStep) navEl.classList.add('completed');
      }
      if (panelEl) {
        panelEl.classList.toggle('active', i === hostModalStep);
        panelEl.style.display = (i === hostModalStep) ? 'block' : 'none';
      }
    }

    var panel5 = document.getElementById('modal-panel-step-5');
    if (panel5) {
      panel5.classList.toggle('active', hostModalStep === 5);
      panel5.style.display = (hostModalStep === 5) ? 'block' : 'none';
    }

    if (hostModalStep === 2) {
      updateDurationDisplay();
      if (hostAvailableRooms.length === 0 && ctx.dom.modalRoomsGrid && ctx.dom.modalRoomsGrid.style.display !== 'none') {
        var hStep2Btn = document.getElementById('host-step-2-continue-btn');
        if (hStep2Btn) hStep2Btn.disabled = true;
      }
    }

    if (hostModalStep === 3) {
      // Update Screen 3 Summary Card
      var summaryRoomEl = document.getElementById('modal-step-3-summary-room');
      var summaryDatetimeEl = document.getElementById('modal-step-3-summary-datetime');
      if (summaryRoomEl) {
        var roomName = ctx.dom.modalSelectedRoom ? ctx.dom.modalSelectedRoom.value : '';
        var cityName = ctx.dom.modalCitySelect ? ctx.dom.modalCitySelect.value : '';
        summaryRoomEl.textContent = (roomName || 'Selected Space') + (cityName ? ' • ' + cityName : '');
      }
      if (summaryDatetimeEl && ctx.dom.modalEventDate && ctx.dom.modalStartTime && ctx.dom.modalEndTime) {
        var dateFormatted = ctx.dom.modalEventDate.value ? formatLongDate(ctx.dom.modalEventDate.value) : '';
        var s = ctx.dom.modalStartTime.value;
        var e = ctx.dom.modalEndTime.value;
        var sParts = s.split(':').map(Number);
        var eParts = e.split(':').map(Number);
        var diffMin = (eParts[0] * 60 + eParts[1]) - (sParts[0] * 60 + sParts[1]);
        var durStr = '';
        if (diffMin > 0) {
          var hrs = Math.floor(diffMin / 60);
          var mins = diffMin % 60;
          if (hrs > 0 && mins > 0) durStr = ' (' + hrs + ' hr ' + mins + ' mins)';
          else if (hrs > 0) durStr = ' (' + (hrs === 1 ? '1 hour' : hrs + ' hours') + ')';
          else durStr = ' (' + mins + ' mins)';
        }
        summaryDatetimeEl.textContent = dateFormatted + ' • ' + s + ' – ' + e + durStr;
      }
    }

    // Keep hidden compatibility buttons in sync
    if (ctx.dom.modalStepBackBtn) ctx.dom.modalStepBackBtn.style.display = (hostModalStep > 1 && hostModalStep < 5) ? 'inline-block' : 'none';
    if (ctx.dom.modalStepNextBtn) {
      ctx.dom.modalStepNextBtn.style.display = (hostModalStep < 3) ? 'inline-block' : 'none';
      ctx.dom.modalStepNextBtn.disabled = false;
      if (hostModalStep === 1) ctx.dom.modalStepNextBtn.textContent = 'Next: Date & Space →';
      if (hostModalStep === 2) ctx.dom.modalStepNextBtn.textContent = 'Next: Event Details →';
    }
  }

  function updateDurationDisplay() {
    if (!ctx.dom.modalStartTime || !ctx.dom.modalEndTime || !ctx.dom.modalDurationDisplay) return;
    var s = ctx.dom.modalStartTime.value;
    var e = ctx.dom.modalEndTime.value;
    var hStep2Btn = document.getElementById('host-step-2-continue-btn');
    if (s && e) {
      var sParts = s.split(':').map(Number);
      var eParts = e.split(':').map(Number);
      var diffMin = (eParts[0] * 60 + eParts[1]) - (sParts[0] * 60 + sParts[1]);
      if (diffMin > 0) {
        var hrs = Math.floor(diffMin / 60);
        var mins = diffMin % 60;
        var durStr = '';
        if (hrs > 0 && mins > 0) {
          durStr = hrs + ' hr ' + mins + ' mins';
        } else if (hrs > 0) {
          durStr = hrs === 1 ? '1 hour' : hrs + ' hours';
        } else {
          durStr = mins + ' mins';
        }
        ctx.dom.modalDurationDisplay.textContent = 'You’ll request ' + s + ' – ' + e + ' (' + durStr + ')';
        ctx.dom.modalDurationDisplay.style.color = '#0F766E';
        var canProceed = Boolean(ctx.dom.modalSelectedRoom && ctx.dom.modalSelectedRoom.value && (modalAvailabilityStatus === 'available' || modalAvailabilityStatus === 'warning_pending'));
        if (hStep2Btn) hStep2Btn.disabled = !canProceed;
      } else {
        ctx.dom.modalDurationDisplay.textContent = 'End time must be later than start time.';
        ctx.dom.modalDurationDisplay.style.color = '#DC2626';
        if (hStep2Btn) hStep2Btn.disabled = true;
      }
    }
  }

  if (ctx.dom.modalStartTime) ctx.dom.modalStartTime.addEventListener('change', updateDurationDisplay);
  if (ctx.dom.modalEndTime) ctx.dom.modalEndTime.addEventListener('change', updateDurationDisplay);

  function loadModalRooms(city, callback) {
    if (!ctx.dom.modalRoomsLoading || !ctx.dom.modalRoomsGrid) return;
    modalAvailabilitySeq++;
    modalAvailabilityStatus = 'unknown';
    currentRoomData = null;
    updateRoomOperatingHoursDisplay(null);
    var availabilityContinueBtn = document.getElementById('host-step-2-continue-btn');
    if (availabilityContinueBtn) availabilityContinueBtn.disabled = true;
    ctx.dom.modalRoomsLoading.style.display = 'block';
    ctx.dom.modalRoomsGrid.style.display = 'none';

    fetch('/api/method/adda_space.api.events.get_adda_rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Frappe-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify({ city: city })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      ctx.dom.modalRoomsLoading.style.display = 'none';
      var payload = data.message || data;
      hostAvailableRooms = (payload && Array.isArray(payload.rooms)) ? payload.rooms : [];

      ctx.dom.modalRoomsGrid.innerHTML = '';
      if (hostAvailableRooms.length === 0) {
        ctx.dom.modalSelectedRoom.value = '';
        currentRoomData = null;
        updateRoomOperatingHoursDisplay(null);
        checkOperatingHoursWarning();
        ctx.dom.modalRoomsGrid.innerHTML = '<div class="adda-room-empty" style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--adda-text-muted); background: var(--adda-surface-warm); border-radius: var(--radius-sm); border: 1px dashed var(--adda-border);"><p style="margin: 0;">No active spaces or rooms found for this city.</p></div>';
        ctx.dom.modalRoomsGrid.style.display = 'block';
        var hStep2Btn = document.getElementById('host-step-2-continue-btn');
        if (hStep2Btn) hStep2Btn.disabled = true;
        if (callback) callback();
        return;
      }

      var selectedIndex = -1;
      hostAvailableRooms.forEach(function(r, idx) {
        if (ctx.dom.modalSelectedRoom.value && ctx.dom.modalSelectedRoom.value === (r.room_name || r.name)) {
          selectedIndex = idx;
        }
      });
      if (selectedIndex === -1) selectedIndex = 0;

      hostAvailableRooms.forEach(function(r, idx) {
        var card = document.createElement('div');
        card.className = 'adda-room-card';
        var rName = r.room_name || r.name;
        card.setAttribute('data-room-name', rName);

        var hoursText = (r.formatted_opening_time && r.formatted_closing_time) ?
          (r.formatted_opening_time + ' – ' + r.formatted_closing_time) :
          ((r.opening_time && r.closing_time) ? (formatTime12hr(r.opening_time) + ' – ' + formatTime12hr(r.closing_time)) : 'Hours unconfigured');

        if (idx === selectedIndex) {
          card.classList.add('selected');
          ctx.dom.modalSelectedRoom.value = rName;
          currentRoomData = r;
          if (ctx.dom.modalCapacityHint) ctx.dom.modalCapacityHint.textContent = 'Room capacity is ' + (r.capacity || 'Flexible') + ' people.';
        }

        card.innerHTML = [
          '<div class="adda-room-name">' + escapeHtml(rName) + '</div>',
          '<div class="adda-room-cap">Capacity: ~' + escapeHtml(r.capacity || 'Flexible') + ' people</div>',
          '<div class="adda-room-hours-hint" style="font-size: 0.75rem; color: #4B5563; margin-top: 0.25rem;">' + escapeHtml(hoursText) + '</div>'
        ].join('\n');

        card.addEventListener('click', function() {
          ctx.dom.modalRoomsGrid.querySelectorAll('.adda-room-card').forEach(function(c) { c.classList.remove('selected'); });
          card.classList.add('selected');
          ctx.dom.modalSelectedRoom.value = rName;
          currentRoomData = r;
          if (ctx.dom.modalCapacityHint) ctx.dom.modalCapacityHint.textContent = 'Room capacity is ' + (r.capacity || 'Flexible') + ' people.';
          updateRoomOperatingHoursDisplay(r);
          checkOperatingHoursWarning();
          var hStep2Btn = document.getElementById('host-step-2-continue-btn');
          if (hStep2Btn) {
            var hasHours = Boolean(r && r.opening_time && r.closing_time);
            hStep2Btn.disabled = !hasHours;
          }
          checkModalRoomAvailability();
        });

        ctx.dom.modalRoomsGrid.appendChild(card);
      });

      ctx.dom.modalRoomsGrid.style.display = 'grid';
      var activeRoom = hostAvailableRooms[selectedIndex];
      currentRoomData = activeRoom;
      updateRoomOperatingHoursDisplay(activeRoom);
      checkOperatingHoursWarning();

      var hStep2Btn = document.getElementById('host-step-2-continue-btn');
      if (hStep2Btn) {
        var hasHours = Boolean(activeRoom && activeRoom.opening_time && activeRoom.closing_time);
        hStep2Btn.disabled = !hasHours;
      }
      if (callback) callback();
    })
    .catch(function(err) {
      ctx.dom.modalRoomsLoading.style.display = 'none';
      hostAvailableRooms = [];
      ctx.dom.modalSelectedRoom.value = '';
      currentRoomData = null;
      updateRoomOperatingHoursDisplay(null);
      checkOperatingHoursWarning();
      ctx.dom.modalRoomsGrid.innerHTML = '<div class="adda-room-empty" style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: #DC2626; background: #FEF2F2; border-radius: var(--radius-sm); border: 1px solid #FCA5A5;"><p style="margin: 0;">Unable to load spaces for this city. Please try again.</p></div>';
      ctx.dom.modalRoomsGrid.style.display = 'block';
      var hStep2Btn = document.getElementById('host-step-2-continue-btn');
      if (hStep2Btn) hStep2Btn.disabled = true;
      if (callback) callback();
    });
  }

  function checkModalRoomAvailability() {
    var date = ctx.dom.modalEventDate.value;
    var city = ctx.dom.modalCitySelect.value;
    var room = ctx.dom.modalSelectedRoom.value;
    var startTime = ctx.dom.modalStartTime.value;
    var endTime = ctx.dom.modalEndTime.value;

    var hStep2Btn = document.getElementById('host-step-2-continue-btn');
    var requestSeq = ++modalAvailabilitySeq;
    if (!date || !room || !startTime || !endTime) {
      modalAvailabilityStatus = 'unknown';
      if (hStep2Btn) hStep2Btn.disabled = true;
      return;
    }

    modalAvailabilityStatus = 'checking';
    if (hStep2Btn) hStep2Btn.disabled = true;

    fetch('/api/method/adda_space.api.events.get_adda_room_availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Frappe-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify({ date: date, city: city, room_name: room, start_time: startTime, end_time: endTime })
    })
    .then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) throw new Error('Availability check failed');
        return data;
      });
    })
    .then(function(data) {
      if (requestSeq !== modalAvailabilitySeq) return;
      var payload = data.message || data;
      if (!payload || payload.status !== 'success') {
        throw new Error('Availability check failed');
      }
      var bookings = (payload && Array.isArray(payload.bookings)) ? payload.bookings : [];
      var pendingBookings = (payload && Array.isArray(payload.pending_bookings)) ? payload.pending_bookings : [];

      var collision = payload.collision || null;
      var pendingCollision = payload.pending_collision || null;

      if (!collision && startTime && endTime) {
        var sReq = startTime + ':00';
        var eReq = endTime + ':00';
        for (var i = 0; i < bookings.length; i++) {
          var b = bookings[i];
          if (b.start_time < eReq && b.end_time > sReq) {
            collision = b;
            break;
          }
        }
        if (!collision) {
          for (var j = 0; j < pendingBookings.length; j++) {
            var pb = pendingBookings[j];
            if (pb.start_time < eReq && pb.end_time > sReq) {
              pendingCollision = pb;
              break;
            }
          }
        }
      }

      ctx.dom.modalAvailBanner.style.display = 'flex';
      if (collision) {
        modalAvailabilityStatus = 'collision';
        ctx.dom.modalAvailBanner.className = 'adda-avail-box adda-avail-alert';
        var cStart = collision.start_time ? collision.start_time.slice(0, 5) : '';
        var cEnd = collision.end_time ? collision.end_time.slice(0, 5) : '';
        ctx.dom.modalAvailMessage.innerHTML = '<strong>This space is already booked during that time.</strong> ' + escapeHtml(room ? room + ' is' : 'This space is') + ' booked for approved event "' +
          escapeHtml(collision.title || 'Another Event') + '" (' + escapeHtml(cStart) + ' &ndash; ' +
          escapeHtml(cEnd) + '). Please choose another time after or before this event.';
        if (hStep2Btn) hStep2Btn.disabled = true;
      } else if (pendingCollision) {
        modalAvailabilityStatus = 'warning_pending';
        ctx.dom.modalAvailBanner.className = 'adda-avail-box adda-avail-warning';
        var pStart = pendingCollision.start_time ? pendingCollision.start_time.slice(0, 5) : '';
        var pEnd = pendingCollision.end_time ? pendingCollision.end_time.slice(0, 5) : '';
        ctx.dom.modalAvailMessage.innerHTML = '<strong>Warning: Already there is a pending event with this time.</strong> There is a pending event proposal "' +
          escapeHtml(pendingCollision.title || 'Pending Event') + '" (' + escapeHtml(pStart) + ' &ndash; ' +
          escapeHtml(pEnd) + '). You can still request this time slot for coordinator review.';
        if (hStep2Btn) hStep2Btn.disabled = false;
        updateDurationDisplay();
      } else {
        modalAvailabilityStatus = 'available';
        ctx.dom.modalAvailBanner.className = 'adda-avail-box adda-avail-success';
        ctx.dom.modalAvailMessage.innerHTML = '<strong>Available:</strong> ' + escapeHtml(room || 'This space') + ' is free for your selected slot (' +
          escapeHtml(startTime) + ' &ndash; ' + escapeHtml(endTime) + ').';
        if (hStep2Btn) hStep2Btn.disabled = false;
        updateDurationDisplay();
      }
    })
    .catch(function() {
      if (requestSeq !== modalAvailabilitySeq) return;
      modalAvailabilityStatus = 'error';
      ctx.dom.modalAvailBanner.className = 'adda-avail-box adda-avail-alert';
      ctx.dom.modalAvailMessage.textContent = 'Could not verify room availability. Please change the date or time to retry.';
      ctx.dom.modalAvailBanner.style.display = 'flex';
      if (hStep2Btn) hStep2Btn.disabled = true;
    });
  }

  if (ctx.dom.modalEventDate) {
    ctx.dom.modalEventDate.addEventListener('input', function() {
      selectedHostDate = this.value;
      updateWhatsAppLink();
      checkOperatingHoursWarning();
    });
    ctx.dom.modalEventDate.addEventListener('change', function() {
      selectedHostDate = this.value;
      updateWhatsAppLink();
      checkOperatingHoursWarning();
      checkModalRoomAvailability();
    });
  }
  if (ctx.dom.modalStartTime) {
    ctx.dom.modalStartTime.addEventListener('change', function() {
      updateModalEndTimeOptions();
      checkModalRoomAvailability();
      checkOperatingHoursWarning();
    });
    ctx.dom.modalStartTime.addEventListener('input', checkOperatingHoursWarning);
  }
  if (ctx.dom.modalEndTime) {
    ctx.dom.modalEndTime.addEventListener('change', function() {
      checkModalRoomAvailability();
      checkOperatingHoursWarning();
    });
    ctx.dom.modalEndTime.addEventListener('input', checkOperatingHoursWarning);
  }

  // Poster Image Preview
  if (ctx.dom.modalPosterFile) {
    ctx.dom.modalPosterFile.addEventListener('change', function() {
      var file = this.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Poster file must be less than 5MB.');
          this.value = '';
          ctx.dom.modalPosterPreviewBox.style.display = 'none';
          return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
          if (ctx.dom.modalHostPosterImg) ctx.dom.modalHostPosterImg.src = e.target.result;
          ctx.dom.modalPosterPreviewBox.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        ctx.dom.modalPosterPreviewBox.style.display = 'none';
      }
    });
  }

  function populateModalReview() {
    if (ctx.dom.mrevTitle) ctx.dom.mrevTitle.textContent = ctx.dom.modalTitleInput ? ctx.dom.modalTitleInput.value.trim() || 'Untitled Gathering' : '';
    if (ctx.dom.mrevCity) ctx.dom.mrevCity.textContent = ctx.dom.modalCitySelect ? ctx.dom.modalCitySelect.value || 'Not selected' : '';
    if (ctx.dom.mrevRoom) ctx.dom.mrevRoom.textContent = ctx.dom.modalSelectedRoom ? ctx.dom.modalSelectedRoom.value || 'Not selected' : '';
    if (ctx.dom.mrevDatetime) ctx.dom.mrevDatetime.textContent = (ctx.dom.modalEventDate ? ctx.dom.modalEventDate.value || '' : '') + ' (' + (ctx.dom.modalStartTime ? ctx.dom.modalStartTime.value || '' : '') + ' - ' + (ctx.dom.modalEndTime ? ctx.dom.modalEndTime.value || '' : '') + ')';
    if (ctx.dom.mrevPeople) ctx.dom.mrevPeople.textContent = (ctx.dom.modalPeopleInput ? ctx.dom.modalPeopleInput.value || '20' : '20') + ' people';

    // Auth callouts removed — all users can submit freely
    if (ctx.dom.modalStepSubmitBtn) ctx.dom.modalStepSubmitBtn.style.display = 'inline-block';
  }

  if (ctx.dom.modalSaveAndLoginBtn) {
    ctx.dom.modalSaveAndLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      saveHostDraft();
      var returnUrl = window.location.pathname + '?open_host=1';
      window.location.href = '/login?redirect=' + encodeURIComponent(returnUrl);
    });
  }

  // Step 1 Continue Button
  var hostStep1ContinueBtn = document.getElementById('host-step-1-continue-btn');
  if (hostStep1ContinueBtn) {
    hostStep1ContinueBtn.addEventListener('click', function() {
      var city = ctx.dom.modalCitySelect ? ctx.dom.modalCitySelect.value : '';
      if (!city) {
        if (ctx.dom.modalStep1Error) ctx.dom.modalStep1Error.style.display = 'flex';
        return;
      }
      if (ctx.dom.modalStep1Error) ctx.dom.modalStep1Error.style.display = 'none';
      goToModalStep(2);
      loadModalRooms(city, function() {
        checkModalRoomAvailability();
      });
    });
  }

  // Step 2 Continue Button
  var hostStep2ContinueBtn = document.getElementById('host-step-2-continue-btn');
  if (hostStep2ContinueBtn) {
    hostStep2ContinueBtn.addEventListener('click', function() {
      var step2Err = document.getElementById('modal-step-2-error');
      var step2ErrText = document.getElementById('modal-step-2-error-text');
      function showStep2Error(msg) {
        if (step2Err && step2ErrText) {
          step2ErrText.textContent = msg;
          step2Err.style.display = 'flex';
        } else {
          alert(msg);
        }
      }
      if (step2Err) step2Err.style.display = 'none';

      if (!ctx.dom.modalEventDate || !ctx.dom.modalEventDate.value) {
        showStep2Error('Please select a date.');
        return;
      }
      if (ctx.dom.modalEventDate.value < istDateStr) {
        showStep2Error('Please select today or a future date.');
        return;
      }
      if (!ctx.dom.modalStartTime || !ctx.dom.modalEndTime || !ctx.dom.modalStartTime.value || !ctx.dom.modalEndTime.value) {
        showStep2Error('Please select start and end time.');
        return;
      }
      if (ctx.dom.modalStartTime.value >= ctx.dom.modalEndTime.value) {
        showStep2Error('End time must be after start time.');
        return;
      }
      if (!ctx.dom.modalSelectedRoom || !ctx.dom.modalSelectedRoom.value) {
        showStep2Error('Please select an Adda room.');
        return;
      }
      if (!currentRoomData || !currentRoomData.opening_time || !currentRoomData.closing_time) {
        showStep2Error('Operating hours are not configured for this space. Please contact a coordinator or select another space.');
        return;
      }
      var op = normalizeClockTime(currentRoomData.opening_time);
      var cl = normalizeClockTime(currentRoomData.closing_time);
      if (!op || !cl || timeToMinutes(ctx.dom.modalStartTime.value) < timeToMinutes(op) || timeToMinutes(ctx.dom.modalEndTime.value) > timeToMinutes(cl)) {
        showStep2Error('Events in ' + (currentRoomData.room_name || 'this space') + ' must start at or after ' + formatTime12hr(op) + ' and finish by ' + formatTime12hr(cl) + '.');
        return;
      }
      if (modalAvailabilityStatus === 'collision') {
        showStep2Error('This space is already booked for an approved event during that time. Please choose another time or space.');
        return;
      }
      if (modalAvailabilityStatus !== 'available' && modalAvailabilityStatus !== 'warning_pending') {
        showStep2Error('Please wait for the room availability check to finish, then try again.');
        return;
      }
      goToModalStep(3);
    });
  }

  // Stepper Navigation compatibility for existing tests
  if (ctx.dom.modalStepBackBtn) {
    ctx.dom.modalStepBackBtn.addEventListener('click', function() {
      if (hostModalStep > 1) goToModalStep(hostModalStep - 1);
    });
  }

  if (ctx.dom.modalStepNextBtn) {
    ctx.dom.modalStepNextBtn.addEventListener('click', function() {
      if (hostModalStep === 1) {
        var city = ctx.dom.modalCitySelect ? ctx.dom.modalCitySelect.value : '';
        if (!city) {
          if (ctx.dom.modalStep1Error) ctx.dom.modalStep1Error.style.display = 'flex';
          return;
        }
        if (ctx.dom.modalStep1Error) ctx.dom.modalStep1Error.style.display = 'none';
        goToModalStep(2);
        loadModalRooms(city, function() {
          checkModalRoomAvailability();
        });
      } else if (hostModalStep === 2) {
        var step2Err = document.getElementById('modal-step-2-error');
        var step2ErrText = document.getElementById('modal-step-2-error-text');
        function showStep2Error(msg) {
          if (step2Err && step2ErrText) {
            step2ErrText.textContent = msg;
            step2Err.style.display = 'flex';
          } else {
            alert(msg);
          }
        }
        if (step2Err) step2Err.style.display = 'none';

        if (!ctx.dom.modalEventDate || !ctx.dom.modalEventDate.value) {
          showStep2Error('Please select a date.');
          return;
        }
        if (ctx.dom.modalEventDate.value < istDateStr) {
          showStep2Error('Please select today or a future date.');
          return;
        }
        if (!ctx.dom.modalStartTime || !ctx.dom.modalEndTime || !ctx.dom.modalStartTime.value || !ctx.dom.modalEndTime.value) {
          showStep2Error('Please select start and end time.');
          return;
        }
        if (ctx.dom.modalStartTime.value >= ctx.dom.modalEndTime.value) {
          showStep2Error('End time must be after start time.');
          return;
        }
        if (!ctx.dom.modalSelectedRoom || !ctx.dom.modalSelectedRoom.value) {
          showStep2Error('Please select an Adda room.');
          return;
        }
        if (!currentRoomData || !currentRoomData.opening_time || !currentRoomData.closing_time) {
          showStep2Error('Operating hours are not configured for this space. Please contact a coordinator or select another space.');
          return;
        }
        var op = normalizeClockTime(currentRoomData.opening_time);
        var cl = normalizeClockTime(currentRoomData.closing_time);
        if (!op || !cl || timeToMinutes(ctx.dom.modalStartTime.value) < timeToMinutes(op) || timeToMinutes(ctx.dom.modalEndTime.value) > timeToMinutes(cl)) {
          showStep2Error('Events in ' + (currentRoomData.room_name || 'this space') + ' must start at or after ' + formatTime12hr(op) + ' and finish by ' + formatTime12hr(cl) + '.');
          return;
        }
        if (modalAvailabilityStatus === 'collision') {
          showStep2Error('This space is already booked for an approved event during that time. Please choose another time or space.');
          return;
        }
        if (modalAvailabilityStatus !== 'available' && modalAvailabilityStatus !== 'warning_pending') {
          showStep2Error('Please wait for the room availability check to finish, then try again.');
          return;
        }
        goToModalStep(3);
      }
    });
  }

  // Modal Poster Tab Switching & URL Input
  function setModalPosterTab(mode) {
    modalPosterSource = mode;
    if (mode === 'upload') {
      if (ctx.dom.modalPosterTabUpload) {
        ctx.dom.modalPosterTabUpload.style.background = '#111827';
        ctx.dom.modalPosterTabUpload.style.color = '#FFFFFF';
        ctx.dom.modalPosterTabUpload.classList.add('active');
      }
      if (ctx.dom.modalPosterTabUrl) {
        ctx.dom.modalPosterTabUrl.style.background = '#F9FAFB';
        ctx.dom.modalPosterTabUrl.style.color = '#374151';
        ctx.dom.modalPosterTabUrl.classList.remove('active');
      }
      if (ctx.dom.modalPosterUploadPanel) ctx.dom.modalPosterUploadPanel.style.display = 'block';
      if (ctx.dom.modalPosterUrlPanel) ctx.dom.modalPosterUrlPanel.style.display = 'none';
    } else {
      if (ctx.dom.modalPosterTabUpload) {
        ctx.dom.modalPosterTabUpload.style.background = '#F9FAFB';
        ctx.dom.modalPosterTabUpload.style.color = '#374151';
        ctx.dom.modalPosterTabUpload.classList.remove('active');
      }
      if (ctx.dom.modalPosterTabUrl) {
        ctx.dom.modalPosterTabUrl.style.background = '#111827';
        ctx.dom.modalPosterTabUrl.style.color = '#FFFFFF';
        ctx.dom.modalPosterTabUrl.classList.add('active');
      }
      if (ctx.dom.modalPosterUploadPanel) ctx.dom.modalPosterUploadPanel.style.display = 'none';
      if (ctx.dom.modalPosterUrlPanel) ctx.dom.modalPosterUrlPanel.style.display = 'block';
      if (ctx.dom.modalPosterUrlInput && ctx.dom.modalPosterUrlInput.value.trim()) {
        handleModalPosterUrlInput();
      }
    }
    saveHostDraft();
  }

  if (ctx.dom.modalPosterTabUpload) ctx.dom.modalPosterTabUpload.addEventListener('click', function() { setModalPosterTab('upload'); });
  if (ctx.dom.modalPosterTabUrl) ctx.dom.modalPosterTabUrl.addEventListener('click', function() { setModalPosterTab('url'); });

  function handleModalPosterUrlInput() {
    var url = (ctx.dom.modalPosterUrlInput && ctx.dom.modalPosterUrlInput.value.trim()) || '';
    if (!url) {
      if (modalPosterSource === 'url' && !selectedPosterFile && !uploadedPosterUrl) {
        if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'none';
      }
      return;
    }
    var isValidUrl = /^https?:\/\/.+/i.test(url) || /^\/\/.+/i.test(url);
    if (!isValidUrl) {
      if (ctx.dom.modalPosterPreviewBox && modalPosterSource === 'url' && !selectedPosterFile) {
        ctx.dom.modalPosterPreviewBox.style.display = 'none';
      }
      return;
    }
    if (ctx.dom.modalStep3Error) ctx.dom.modalStep3Error.style.display = 'none';
    if (ctx.dom.modalHostPosterImg) {
      ctx.dom.modalHostPosterImg.onload = function() {
        if (ctx.dom.modalPosterFilename) {
          var cleanName = url.split('?')[0].split('#')[0].split('/').pop();
          ctx.dom.modalPosterFilename.textContent = cleanName || 'Image URL';
        }
        if (ctx.dom.modalPosterFilesize) ctx.dom.modalPosterFilesize.textContent = 'Web Image Link';
        if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'block';
      };
      ctx.dom.modalHostPosterImg.onerror = function() {
        if (ctx.dom.modalPosterPreviewBox && modalPosterSource === 'url' && !selectedPosterFile) {
          ctx.dom.modalPosterPreviewBox.style.display = 'none';
        }
      };
      ctx.dom.modalHostPosterImg.src = url;
    }
    saveHostDraft();
  }

  if (ctx.dom.modalPosterUrlInput) {
    ctx.dom.modalPosterUrlInput.addEventListener('input', handleModalPosterUrlInput);
    ctx.dom.modalPosterUrlInput.addEventListener('change', handleModalPosterUrlInput);
  }

  // Poster File Selection & Validation
  if (ctx.dom.modalPosterFile) {
    ctx.dom.modalPosterFile.addEventListener('change', function() {
      var file = this.files && this.files[0];
      if (!file) return;

      var validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      var fileName = file.name.toLowerCase();
      var isValidExt = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp');
      if (!validTypes.includes(file.type) && !isValidExt) {
        if (ctx.dom.modalStep3Error) {
          ctx.dom.modalStep3Error.style.display = 'flex';
          if (ctx.dom.modalStep3ErrorText) ctx.dom.modalStep3ErrorText.textContent = 'Unsupported file format. Please upload a PNG, JPG, or WEBP image.';
        }
        this.value = '';
        selectedPosterFile = null;
        if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'none';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        if (ctx.dom.modalStep3Error) {
          ctx.dom.modalStep3Error.style.display = 'flex';
          if (ctx.dom.modalStep3ErrorText) ctx.dom.modalStep3ErrorText.textContent = 'Poster image size cannot exceed 5MB.';
        }
        this.value = '';
        selectedPosterFile = null;
        if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'none';
        return;
      }

      if (ctx.dom.modalStep3Error) ctx.dom.modalStep3Error.style.display = 'none';
      selectedPosterFile = file;

      var reader = new FileReader();
      reader.onload = function(e) {
        selectedPosterDataUrl = e.target.result;
        if (ctx.dom.modalHostPosterImg) ctx.dom.modalHostPosterImg.src = selectedPosterDataUrl;
        if (ctx.dom.modalPosterFilename) ctx.dom.modalPosterFilename.textContent = file.name;
        if (ctx.dom.modalPosterFilesize) ctx.dom.modalPosterFilesize.textContent = (file.size / 1024).toFixed(1) + ' KB';
        if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'block';
        saveHostDraft();
      };
      reader.readAsDataURL(file);
    });
  }

  if (ctx.dom.modalPosterReplaceBtn) {
    ctx.dom.modalPosterReplaceBtn.addEventListener('click', function(e) {
      e.preventDefault();
      selectedPosterFile = null;
      selectedPosterDataUrl = '';
      uploadedPosterUrl = '';
      if (ctx.dom.modalPosterFile) {
        ctx.dom.modalPosterFile.value = '';
      }
      if (ctx.dom.modalPosterUrlInput) {
        ctx.dom.modalPosterUrlInput.value = '';
      }
      if (ctx.dom.modalHostPosterImg) ctx.dom.modalHostPosterImg.src = '';
      if (ctx.dom.modalPosterPreviewBox) ctx.dom.modalPosterPreviewBox.style.display = 'none';
      saveHostDraft();
    });
  }

  function parseServerMessages(raw) {
    if (!raw) return 'Submission failed. Please try again.';
    try {
      var arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        var parsed = typeof arr[0] === 'string' ? JSON.parse(arr[0]) : arr[0];
        return parsed.message || stripHtml(parsed);
      }
    } catch(e) {}
    return stripHtml(String(raw));
  }

  // Submit Proposal
  if (ctx.dom.modalStepSubmitBtn) {
    ctx.dom.modalStepSubmitBtn.addEventListener('click', function() {
      var title = ctx.dom.modalTitleInput ? ctx.dom.modalTitleInput.value.trim() : '';
      var desc = ctx.dom.modalDescInput ? ctx.dom.modalDescInput.value.trim() : '';
      if (!title) {
        if (ctx.dom.modalStep3Error) {
          ctx.dom.modalStep3Error.style.display = 'flex';
          if (ctx.dom.modalStep3ErrorText) ctx.dom.modalStep3ErrorText.textContent = 'Please provide an event title.';
        }
        return;
      }
      if (!desc) {
        if (ctx.dom.modalStep3Error) {
          ctx.dom.modalStep3Error.style.display = 'flex';
          if (ctx.dom.modalStep3ErrorText) ctx.dom.modalStep3ErrorText.textContent = 'Please provide an event description.';
        }
        return;
      }

      var DEFAULT_HOST_POSTER_URL = '/assets/adda_space/images/default_event_poster.jpg';
      var file = selectedPosterFile || (ctx.dom.modalPosterFile && ctx.dom.modalPosterFile.files && ctx.dom.modalPosterFile.files[0]);
      var directUrl = (ctx.dom.modalPosterUrlInput && ctx.dom.modalPosterUrlInput.value.trim()) || '';

      if (directUrl && !file && !uploadedPosterUrl) {
        var isValidUrl = /^https?:\/\/.+/i.test(directUrl) || /^\/\/.+/i.test(directUrl);
        if (!isValidUrl) {
          if (ctx.dom.modalStep3Error) {
            ctx.dom.modalStep3Error.style.display = 'flex';
            if (ctx.dom.modalStep3ErrorText) ctx.dom.modalStep3ErrorText.textContent = 'Please provide a valid image URL starting with http:// or https://';
          }
          return;
        }
      }

      if (ctx.dom.modalStep3Error) ctx.dom.modalStep3Error.style.display = 'none';

      if (isSubmittingHostProposal) return;
      isSubmittingHostProposal = true;
      if (ctx.dom.modalSubmitErrorBox) ctx.dom.modalSubmitErrorBox.style.display = 'none';

      // If direct image URL provided and no local file selected, submit directly
      if (directUrl && !file) {
        ctx.dom.modalStepSubmitBtn.disabled = true;
        ctx.dom.modalStepSubmitBtn.textContent = 'Submitting proposal...';
        submitHostPayload(directUrl);
        return;
      }

      // If poster was already uploaded in this session and no new file selected, proceed directly
      if (uploadedPosterUrl && !file) {
        ctx.dom.modalStepSubmitBtn.disabled = true;
        ctx.dom.modalStepSubmitBtn.textContent = 'Submitting proposal...';
        submitHostPayload(uploadedPosterUrl);
        return;
      }

      // If no poster provided, submit directly with default poster
      if (!file) {
        ctx.dom.modalStepSubmitBtn.disabled = true;
        ctx.dom.modalStepSubmitBtn.textContent = 'Submitting proposal...';
        submitHostPayload(DEFAULT_HOST_POSTER_URL);
        return;
      }

      ctx.dom.modalStepSubmitBtn.disabled = true;
      ctx.dom.modalStepSubmitBtn.textContent = 'Uploading poster...';

      var formData = new FormData();
      formData.append('file', file);
      formData.append('is_private', '0');
      formData.append('folder', 'Home');

      fetch('/api/method/upload_file', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Frappe-CSRF-Token': getCsrfToken()
        },
        body: formData
      })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            var errText = (data && data._server_messages) ? parseServerMessages(data._server_messages) : ((data && data.message && (data.message.error || data.message.message)) || 'Failed to upload event poster');
            throw new Error(errText);
          }
          return data;
        });
      })
      .then(function(uploadData) {
        var fileUrl = (uploadData.message && uploadData.message.file_url) || (uploadData.message && uploadData.message.name);
        if (!fileUrl) {
          throw new Error('Poster upload did not return a valid file URL. Please retry.');
        }
        uploadedPosterUrl = fileUrl;
        ctx.dom.modalStepSubmitBtn.textContent = 'Submitting proposal...';
        submitHostPayload(fileUrl);
      })
      .catch(function(uploadErr) {
        isSubmittingHostProposal = false;
        ctx.dom.modalStepSubmitBtn.disabled = false;
        ctx.dom.modalStepSubmitBtn.textContent = 'Submit Gathering Proposal';
        if (ctx.dom.modalSubmitErrorBox) ctx.dom.modalSubmitErrorBox.style.display = 'flex';
        if (ctx.dom.modalSubmitErrorText) ctx.dom.modalSubmitErrorText.textContent = 'Poster upload failed: ' + (uploadErr.message || 'Please check your file and try again.');
      });
    });
  }

  function submitHostPayload(coverImageUrl) {
    var finalImageUrl = coverImageUrl || DEFAULT_HOST_POSTER_URL;

    var sDate = ctx.dom.modalEventDate.value;
    var sTime = ctx.dom.modalStartTime.value;
    var eTime = ctx.dom.modalEndTime.value;

    var payload = {
      title: ctx.dom.modalTitleInput.value.trim(),
      type: 'Custom Event',
      description: ctx.dom.modalDescInput.value.trim(),
      start_date_time: sDate + ' ' + sTime + ':00',
      end_date_time: sDate + ' ' + eTime + ':00',
      start: sDate + ' ' + sTime + ':00',
      end: sDate + ' ' + eTime + ':00',
      city: ctx.dom.modalCitySelect.value.trim(),
      room_name: ctx.dom.modalSelectedRoom.value.trim(),
      people_expected: parseInt(ctx.dom.modalPeopleInput.value, 10) || 20,
      approval_status: 'Pending Review',
      mode: ctx.dom.modalModeSelect.value || 'Offline',
      image: finalImageUrl,
      cover_image: finalImageUrl
    };

    fetch('/api/method/adda_space.api.events.create_adda_event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Frappe-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) {
          var msg = (data && data._server_messages) ? parseServerMessages(data._server_messages) : ((data && data.message && (data.message.error || data.message.message)) || ('Submission failed (' + res.status + ')'));
          throw new Error(msg);
        }
        return data;
      });
    })
    .then(function(data) {
      isSubmittingHostProposal = false;
      try {
        sessionStorage.removeItem('adda_host_form_data');
      } catch(e) {}

      var doc = data.message || data;
      if (ctx.dom.modalConfRefName) ctx.dom.modalConfRefName.textContent = doc.name || doc.title || 'Created';
      goToModalStep(5);
    })
    .catch(function(err) {
      isSubmittingHostProposal = false;
      ctx.dom.modalStepSubmitBtn.disabled = false;
      ctx.dom.modalStepSubmitBtn.textContent = 'Submit Gathering Proposal';
      if (ctx.dom.modalSubmitErrorBox) ctx.dom.modalSubmitErrorBox.style.display = 'flex';
      if (ctx.dom.modalSubmitErrorText) ctx.dom.modalSubmitErrorText.textContent = err.message || 'Unable to submit proposal. Please try again.';
    });
  }

  // ========================================================================
  // CALENDAR VIEW LOGIC
  // ========================================================================

  // Coordinator Section Dynamic Loading
  function loadCoordinatorSection(cities) {
    if (!ctx.dom.coordGrid) return;
    var subEl = document.getElementById('adda-coord-subtitle');
    if (subEl && cities && cities.length) {
      subEl.textContent = 'Use Adda space in ' + cities.join(' or ') + ' \u2014 talk to a coordinator';
    }

    ctx.dom.coordGrid.innerHTML = '';
    if (!cities || !cities.length) {
      ctx.dom.coordGrid.innerHTML = '<div style="color: #6B7280; font-size: 0.875rem; padding: 1rem;">No cities available.</div>';
      return;
    }

    cities.forEach(function(cityName) {
      var card = document.createElement('div');
      card.className = 'adda-coord-card';
      card.innerHTML = '<span class="adda-coord-city-tag">' + escapeHtml(cityName.toUpperCase()) + '</span>' +
        '<div class="adda-coord-loading" style="padding: 0.5rem 0; font-size: 0.8125rem; color: #6B7280;">Loading...</div>';
      ctx.dom.coordGrid.appendChild(card);

      fetch('/api/method/adda_space.api.events.get_city_coordinator?city=' + encodeURIComponent(cityName), {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Frappe-CSRF-Token': getCsrfToken()
        }
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var payload = d.message || d;
        var coord = payload && payload.coordinator;
        if (coord) {
          var roleHtml = coord.role_title ? '<div style="font-size: 0.75rem; color: #6B7280;">' + escapeHtml(coord.role_title) + '</div>' : '';
          var waUrl = generateWhatsAppUrl(coord.coordinator_name || 'Coordinator', cityName, coord.whatsapp_number, ctx.calendarState.selectedDateStr || null);

          card.innerHTML = '<span class="adda-coord-city-tag">' + escapeHtml(cityName.toUpperCase()) + '</span>' +
            '<div class="adda-coord-name">' + escapeHtml(coord.coordinator_name || '') + '</div>' +
            roleHtml +
            '<div class="adda-coord-phone">' + escapeHtml(coord.whatsapp_number || '') + '</div>' +
            '<a href="' + escapeHtml(waUrl) + '" target="_blank" rel="noopener noreferrer" class="adda-coord-wa-btn" id="coord-wa-' + escapeHtml(cityName.toLowerCase()) + '">' +
            '<svg class="adda-whatsapp-mark" width="18" height="18" style="width:18px!important;height:18px!important" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.2a9.6 9.6 0 0 0-8.2 14.6L2.4 22l5.4-1.4A9.7 9.7 0 1 0 12 2.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.1 6.8c-.3 0-.6.1-.8.4-.3.3-1 1-1 2.3s1 2.7 1.1 2.9c.1.2 2 3 4.7 4.1 2.3.9 2.8.7 3.3.6.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.1-1.3-.1-.1-.3-.2-.7-.4l-1.9-.9c-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.6L9 7.2c-.2-.4-.4-.4-.6-.4Z" fill="currentColor"/></svg> WhatsApp ' + escapeHtml(coord.whatsapp_number || '') + '</a>';
        } else {
          card.remove();
        }
      })
      .catch(function() {
        card.remove();
      });
    });
  }

  // Coordinator Section Expand / Collapse Toggle
  function toggleCoordSection() {
    if (!ctx.dom.coordGrid || !ctx.dom.coordToggleBtn) return;
    if (ctx.dom.coordGrid.style.display === 'none') {
      ctx.dom.coordGrid.style.display = 'grid';
      ctx.dom.coordToggleBtn.innerHTML = '&minus;';
      ctx.dom.coordToggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      ctx.dom.coordGrid.style.display = 'none';
      ctx.dom.coordToggleBtn.innerHTML = '+';
      ctx.dom.coordToggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  if (ctx.dom.coordToggleBtn) {
    ctx.dom.coordToggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleCoordSection();
    });
  }

  if (ctx.dom.coordHeader) {
    ctx.dom.coordHeader.addEventListener('click', toggleCoordSection);
  }

  return {
    openHostModal: openHostModal,
    closeHostModal: closeHostModal,
    restoreHostDraft: restoreHostDraft,
    loadCoordinatorSection: loadCoordinatorSection
  };
}
