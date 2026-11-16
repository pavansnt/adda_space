(function() {
  'use strict';

  // DOM Elements
  var viewCalendarBtn = document.getElementById('view-calendar-btn');
  var viewListBtn = document.getElementById('view-list-btn');

  var calendarSection = document.getElementById('events-calendar-section');
  var listSection = document.getElementById('events-list-section');

  // Calendar Elements
  var calMonthTitle = document.getElementById('cal-month-title');
  var calYearBadge = document.getElementById('cal-year-badge');
  var calPrevBtn = document.getElementById('cal-prev-btn');
  var calNextBtn = document.getElementById('cal-next-btn');
  var calTodayBtn = document.getElementById('cal-today-btn');
  var calDaysGrid = document.getElementById('cal-days-grid');
  var calLoading = document.getElementById('cal-loading-indicator');
  var calDayDrawer = document.getElementById('cal-day-drawer');
  var calDrawerTitle = document.getElementById('cal-drawer-title');
  var calDrawerSubtitle = document.getElementById('cal-drawer-subtitle');
  var calDrawerCount = document.getElementById('cal-drawer-count');
  var calDrawerCards = document.getElementById('cal-drawer-cards');
  var calDrawerEmpty = document.getElementById('cal-drawer-empty');
  var calDrawerHostBtn = document.getElementById('cal-drawer-host-btn');
  var calDrawerHostActiveBtn = document.getElementById('cal-drawer-host-active-btn');

  // Day Overflow Events Modal Elements
  var dayEventsBackdrop = document.getElementById('day-events-modal-backdrop');
  var dayEventsTitle = document.getElementById('day-events-modal-title');
  var dayEventsCount = document.getElementById('day-events-modal-count');
  var dayEventsList = document.getElementById('day-events-modal-list');
  var dayEventsCloseBtn = document.getElementById('day-events-modal-close-btn');

  // List View Elements
  var loadingState = document.getElementById('events-loading-state');
  var gridContainer = document.getElementById('events-grid-container');
  var emptyState = document.getElementById('events-empty-state');
  var emptyStateTitle = document.getElementById('empty-state-title');
  var emptyStateDesc = document.getElementById('empty-state-desc');
  var errorState = document.getElementById('events-error-state');
  var errorMessage = document.getElementById('error-state-message');
  var statusBar = document.getElementById('events-status-bar');
  var countLabel = document.getElementById('events-count-label');
  var resetBtn = document.getElementById('reset-filters-btn');
  var retryBtn = document.getElementById('retry-fetch-btn');
  var emptyHostBtn = document.getElementById('empty-host-btn');

  // Event Detail Modal Elements
  var detailModalBackdrop = document.getElementById('event-detail-modal-backdrop');
  var modalEventTitle = document.getElementById('modal-event-title');
  var modalEventBadge = document.getElementById('modal-event-badge');
  var modalEventCity = document.getElementById('modal-event-city');
  var modalEventTime = document.getElementById('modal-event-time');
  var modalEventVenue = document.getElementById('modal-event-venue');
  var modalEventMode = document.getElementById('modal-event-mode');
  var modalEventDesc = document.getElementById('modal-event-desc');
  var modalEventRecap = document.getElementById('modal-event-recap');
  var modalRecapTitle = document.getElementById('modal-recap-title');
  var modalRecapSummary = document.getElementById('modal-recap-summary');
  var modalRecapOutcomes = document.getElementById('modal-recap-outcomes');
  var modalRecapMeta = document.getElementById('modal-recap-meta');
  var modalRecapGallery = document.getElementById('modal-recap-gallery');
  var recapGalleryLightbox = document.getElementById('recap-gallery-lightbox');
  var recapGalleryLightboxImage = document.getElementById('recap-gallery-lightbox-image');
  var recapGalleryLightboxCaption = document.getElementById('recap-gallery-lightbox-caption');
  var recapGalleryLightboxCount = document.getElementById('recap-gallery-lightbox-count');
  var recapGalleryLightboxClose = document.getElementById('recap-gallery-close');
  var recapGalleryLightboxPrev = document.getElementById('recap-gallery-prev');
  var recapGalleryLightboxNext = document.getElementById('recap-gallery-next');
  var recapGalleryImages = [];
  var recapGalleryIndex = 0;
  var recapGalleryTrigger = null;
  var recapGalleryPreviousOverflow = '';
  var modalPosterWrap = document.getElementById('modal-poster-wrap');
  var modalPosterImg = document.getElementById('modal-poster-img');
  var modalDetailCloseBtn = document.getElementById('modal-detail-close-btn');
  var modalDetailActionClose = document.getElementById('modal-detail-action-close');
  var modalShareBtn = document.getElementById('modal-share-btn');
  var modalRegisterBtn = document.getElementById('modal-register-btn');

  // Registration Modal Elements
  var regModalBackdrop = document.getElementById('event-reg-modal-backdrop');
  var modalRegCloseBtn = document.getElementById('modal-reg-close-btn');
  var modalRegEventTitle = document.getElementById('modal-reg-event-title');
  var modalRegEventTime = document.getElementById('modal-reg-event-time');
  var modalRegEventVenue = document.getElementById('modal-reg-event-venue');
  var modalRegFormView = document.getElementById('modal-reg-form-view');
  var modalEventRegForm = document.getElementById('modal-event-reg-form');
  var modalRegNameInput = document.getElementById('modal-reg-name');
  var modalRegMobileInput = document.getElementById('modal-reg-mobile');
  var modalRegSubmitBtn = document.getElementById('modal-reg-submit-btn');
  var modalRegMobileError = document.getElementById('modal-reg-mobile-error');
  var modalRegErrorBox = document.getElementById('modal-reg-error-box');
  var modalRegErrorText = document.getElementById('modal-reg-error-text');
  var modalRegSuccessView = document.getElementById('modal-reg-success-view');
  var modalRegSuccessId = document.getElementById('modal-reg-success-id');
  var modalRegSuccessCloseBtn = document.getElementById('modal-reg-success-close-btn');
  var modalRegDuplicateView = document.getElementById('modal-reg-duplicate-view');
  var modalRegDuplicateId = document.getElementById('modal-reg-duplicate-id');
  var modalRegDuplicateCloseBtn = document.getElementById('modal-reg-duplicate-close-btn');
  var modalRegPastView = document.getElementById('modal-reg-past-view');
  var modalRegPastCloseBtn = document.getElementById('modal-reg-past-close-btn');

  var currentRegisteringEvent = null;
  var isSubmittingRegistration = false;

  // Lightbox & Toast
  var posterLightboxOverlay = document.getElementById('poster-lightbox-overlay');
  var lightboxEnlargedImg = document.getElementById('lightbox-enlarged-img');
  var shareToast = document.getElementById('adda-share-toast');

  // Coordinator Section Elements
  var coordSection = document.getElementById('adda-coordinator-section');
  var coordToggleBtn = document.getElementById('adda-coord-toggle-btn');
  var coordHeader = document.getElementById('adda-coord-header');
  var coordGrid = document.getElementById('adda-coord-grid');

  // Toolbar & Scope Controls
  var cityFilterSelect = document.getElementById('adda-city-filter-select');

  // Host at Adda Modal Elements
  var openHostModalBtn = document.getElementById('open-host-modal-btn');
  var hostModalBackdrop = document.getElementById('host-modal-backdrop');
  var hostModalCloseBtn = document.getElementById('host-modal-close-btn');
  var isHostLoggedIn = hostModalBackdrop.getAttribute('data-logged-in') === 'true';
  var hostUserEmail = hostModalBackdrop.getAttribute('data-user') || '';

  var modalCitySelect = document.getElementById('modal-city-select');
  var modalStep1Error = document.getElementById('modal-step-1-error');
  var modalEventDate = document.getElementById('modal-event-date');
  var modalStartTime = document.getElementById('modal-start-time');
  var modalEndTime = document.getElementById('modal-end-time');
  var modalDurationDisplay = document.getElementById('modal-duration-display');
  var modalRoomsLoading = document.getElementById('modal-rooms-loading');
  var modalRoomsGrid = document.getElementById('modal-rooms-grid');
  var modalSelectedRoom = document.getElementById('modal-selected-room');
  var modalAvailBanner = document.getElementById('modal-avail-banner');
  var modalAvailMessage = document.getElementById('modal-avail-message');

  var modalTitleInput = document.getElementById('modal-title-input');
  var modalDescInput = document.getElementById('modal-desc-input');
  var modalPeopleInput = document.getElementById('modal-people-input');
  var modalCapacityHint = document.getElementById('modal-capacity-hint');
  var modalModeSelect = document.getElementById('modal-mode-select');
  var modalPosterFile = document.getElementById('modal-poster-file');
  var modalPosterTabUpload = document.getElementById('modal-poster-tab-upload');
  var modalPosterTabUrl = document.getElementById('modal-poster-tab-url');
  var modalPosterUploadPanel = document.getElementById('modal-poster-upload-panel');
  var modalPosterUrlPanel = document.getElementById('modal-poster-url-panel');
  var modalPosterUrlInput = document.getElementById('modal-poster-url-input');
  var modalPosterPreviewBox = document.getElementById('modal-poster-preview-box');
  var modalHostPosterImg = document.getElementById('modal-host-poster-img');
  var modalPosterFilename = document.getElementById('modal-poster-filename');
  var modalPosterFilesize = document.getElementById('modal-poster-filesize');
  var modalPosterReplaceBtn = document.getElementById('modal-poster-replace-btn');
  var selectedPosterFile = null;
  var selectedPosterDataUrl = '';
  var uploadedPosterUrl = '';
  var modalPosterSource = 'upload';
  var modalStep3Error = document.getElementById('modal-step-3-error');
  var modalStep3ErrorText = document.getElementById('modal-step-3-error-text');

  var mrevTitle = document.getElementById('mrev-title');
  var mrevCity = document.getElementById('mrev-city');
  var mrevRoom = document.getElementById('mrev-room');
  var mrevDatetime = document.getElementById('mrev-datetime');
  var mrevPeople = document.getElementById('mrev-people');
  var modalAuthGuestCallout = document.getElementById('modal-auth-guest-callout');
  var modalAuthLoggedInCallout = document.getElementById('modal-auth-logged-in-callout');
  var modalLoggedInUserDisplay = document.getElementById('modal-logged-in-user-display');
  var modalSaveAndLoginBtn = document.getElementById('modal-save-and-login-btn');
  var modalSubmitErrorBox = document.getElementById('modal-submit-error-box');
  var modalSubmitErrorText = document.getElementById('modal-submit-error-text');
  var modalConfRefName = document.getElementById('modal-conf-ref-name');
  var modalConfCloseBtn = document.getElementById('modal-conf-close-btn');

  var modalStepBackBtn = document.getElementById('modal-step-back-btn');
  var modalStepNextBtn = document.getElementById('modal-step-next-btn');
  var modalStepSubmitBtn = document.getElementById('modal-step-submit-btn');

  // Shared State
  var currentCity = '';
  var currentView = 'calendar'; // 'calendar' or 'list'
  var currentActiveEvent = null; // currently opened event in modal

  // Host Modal State
  var hostModalStep = 1;
  var hostAvailableRooms = [];
  var modalAvailabilitySeq = 0;
  var modalAvailabilityStatus = 'unknown';
  var isSubmittingHostProposal = false;

  // Calendar State (calculated in Asia/Kolkata)
  var now = new Date();
  var istDateStr = '';
  try {
    istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch(e) {
    istDateStr = now.toISOString().slice(0, 10);
  }
  var parts = istDateStr.split('-');
  var todayYear = parseInt(parts[0], 10);
  var todayMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  var todayDay = parseInt(parts[2], 10);

  var calYear = todayYear;
  var calMonth = todayMonth;
  var selectedDateStr = istDateStr;
  var calEventsByDate = {}; // 'YYYY-MM-DD' -> [event1, event2, ...]

  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Set min date to today in IST
  if (modalEventDate) {
    modalEventDate.min = istDateStr;
    if (!modalEventDate.value) modalEventDate.value = istDateStr;
  }

  function getCsrfToken() {
    return (window.frappe && window.frappe.csrf_token) || window.csrf_token || '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function stripHtml(html) {
    if (!html) return '';
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  function isPendingEvent(event) {
    if (!event) return false;
    if (String(event.type || '').trim().toLowerCase() !== 'custom event') return false;
    var status = String(event.approval_status || '').trim().toLowerCase();
    return status === 'pending review' || status === 'pending';
  }

  function isPastEvent(event) {
    if (!event) return false;

    // 1. Prefer the backend's trustworthy past-event flag if available
    if (typeof event.is_past === 'boolean') {
      return event.is_past;
    }
    if (typeof event.is_past === 'number') {
      return event.is_past === 1;
    }
    if (typeof event.is_past === 'string') {
      var s = event.is_past.trim().toLowerCase();
      if (s === 'true' || s === '1') return true;
      if (s === 'false' || s === '0') return false;
    }

    // 2. Determine effective raw end datetime or fallback to start datetime
    var raw = event.end_date_time || event.end || event.start_date_time || event.start;
    var rawDate = event.end_date || event.date || event.start_date;
    var rawTime = event.end_time || event.start_time;

    if (!raw && rawDate) {
      raw = String(rawDate).trim() + (rawTime ? (' ' + String(rawTime).trim()) : ' 23:59:59');
    }
    if (!raw) return false;

    var str = String(raw).trim();
    // Normalize DD-MM-YYYY to YYYY-MM-DD
    var dmyMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})(.*)$/);
    if (dmyMatch) {
      str = dmyMatch[3] + '-' + dmyMatch[2] + '-' + dmyMatch[1] + dmyMatch[4];
    }
    str = str.replace(' ', 'T');
    // Trim sub-second precision to 3 digits
    str = str.replace(/(\.\d{3})\d+/, '$1');

    // If date-only (YYYY-MM-DD), default to end of day if end date, else start of day
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      str += (event.end_date_time || event.end || event.end_date) ? 'T23:59:59' : 'T00:00:00';
    }

    // Check if timezone offset is already present after the time component (Z or [+-]HH:MM)
    var hasTz = /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(str);
    if (!hasTz) {
      str += '+05:30';
    }

    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.getTime() < Date.now();
    }
    return Boolean(event.is_past);
  }

  function recapStateHtml(event) {
    if (!isPastEvent(event)) return '';
    if (event.recap) return '<span class="adda-recap-status adda-recap-status--available">Event recap available</span>';
    return '<span class="adda-recap-status adda-recap-status--pending">Recap coming soon</span>';
  }

  function renderModalRecap(event) {
    if (!modalEventRecap) return;
    var recap = event && event.recap;
    var past = isPastEvent(event);
    modalEventRecap.style.display = past ? 'block' : 'none';
    if (!past) return;

    if (!recap) {
      modalRecapTitle.textContent = 'Recap coming soon';
      modalRecapSummary.textContent = 'Details from this gathering will be shared here when they are available.';
      modalRecapOutcomes.style.display = 'none';
      modalRecapMeta.innerHTML = '';
      modalRecapGallery.innerHTML = '';
      return;
    }

    modalRecapTitle.textContent = recap.title || 'Event recap';
    modalRecapSummary.textContent = stripHtml(recap.summary || '');
    var outcomes = String(recap.key_outcomes || '').trim();
    modalRecapOutcomes.style.display = outcomes ? 'block' : 'none';
    modalRecapOutcomes.textContent = outcomes ? 'Key outcomes and community actions\n' + outcomes : '';

    var meta = [];
    if (recap.attendees !== null && recap.attendees !== undefined && recap.attendees !== '') {
      var count = parseInt(recap.attendees, 10);
      if (!isNaN(count) && count >= 0) meta.push('<span class="adda-recap-status adda-recap-status--available">' + count + ' attended</span>');
    }
    if (recap.facilitator) meta.push('<span>Facilitated by ' + escapeHtml(recap.facilitator) + '</span>');
    modalRecapMeta.innerHTML = meta.join('');

    var gallery = Array.isArray(recap.gallery) ? recap.gallery : [];
    modalRecapGallery.innerHTML = gallery.map(function(photo) {
      if (!photo || !photo.photo) return '';
      var caption = photo.caption || '';
      var alt = photo.alt_text || caption || recap.title || 'Gathering photo';
      return '<figure><img src="' + escapeHtml(photo.photo) + '" alt="' + escapeHtml(alt) + '" tabindex="0" role="button" aria-label="Open photo: ' + escapeHtml(alt) + '" loading="lazy"><figcaption>' + escapeHtml(caption) + '</figcaption></figure>';
    }).join('');
  }

  function updateRecapLightbox() {
    if (!recapGalleryImages.length) return;
    var active = recapGalleryImages[recapGalleryIndex];
    recapGalleryLightboxImage.src = active.src;
    recapGalleryLightboxImage.alt = active.alt || 'Event recap photo';
    recapGalleryLightboxCaption.textContent = active.closest('figure').querySelector('figcaption').textContent || '';
    recapGalleryLightboxCount.textContent = (recapGalleryIndex + 1) + ' / ' + recapGalleryImages.length;
    recapGalleryLightboxPrev.style.display = recapGalleryImages.length > 1 ? 'inline-flex' : 'none';
    recapGalleryLightboxNext.style.display = recapGalleryImages.length > 1 ? 'inline-flex' : 'none';
  }

  function openRecapLightbox(gallery, image) {
    if (!recapGalleryLightbox || !gallery || !image) return;
    recapGalleryImages = Array.prototype.slice.call(gallery.querySelectorAll('img'));
    recapGalleryIndex = recapGalleryImages.indexOf(image);
    if (recapGalleryIndex < 0) return;
    recapGalleryTrigger = image;
    recapGalleryPreviousOverflow = document.body.style.overflow;
    updateRecapLightbox();
    recapGalleryLightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    recapGalleryLightboxClose.focus();
  }

  function closeRecapLightbox() {
    if (!recapGalleryLightbox) return;
    recapGalleryLightbox.classList.remove('is-open');
    recapGalleryLightbox.style.display = 'none';
    document.body.style.overflow = recapGalleryPreviousOverflow;
    var trigger = recapGalleryTrigger;
    recapGalleryImages = [];
    recapGalleryTrigger = null;
    if (trigger && document.contains(trigger)) trigger.focus();
  }

  function moveRecapLightbox(step) {
    if (recapGalleryImages.length < 2) return;
    recapGalleryIndex = (recapGalleryIndex + step + recapGalleryImages.length) % recapGalleryImages.length;
    updateRecapLightbox();
  }

  if (modalRecapGallery) {
    modalRecapGallery.addEventListener('click', function(e) {
      var image = e.target.closest('img');
      if (image) openRecapLightbox(modalRecapGallery, image);
    });
    modalRecapGallery.addEventListener('keydown', function(e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('img')) {
        e.preventDefault();
        openRecapLightbox(modalRecapGallery, e.target);
      }
    });
  }
  if (recapGalleryLightboxClose) recapGalleryLightboxClose.addEventListener('click', closeRecapLightbox);
  if (recapGalleryLightboxPrev) recapGalleryLightboxPrev.addEventListener('click', function() { moveRecapLightbox(-1); });
  if (recapGalleryLightboxNext) recapGalleryLightboxNext.addEventListener('click', function() { moveRecapLightbox(1); });
  if (recapGalleryLightbox) {
    recapGalleryLightbox.addEventListener('click', function(e) {
      if (e.target === recapGalleryLightbox) closeRecapLightbox();
    });
  }
  document.addEventListener('keydown', function(e) {
    if (!recapGalleryLightbox || !recapGalleryLightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      closeRecapLightbox();
    }
    else if (e.key === 'ArrowLeft') moveRecapLightbox(-1);
    else if (e.key === 'ArrowRight') moveRecapLightbox(1);
  });

  function padZero(num) {
    return num < 10 ? '0' + num : '' + num;
  }

  function getCategoryClass(type, title) {
    var t = String(type || '').trim().toLowerCase();
    var titleStr = String(title || '').trim().toLowerCase();
    if (t.indexOf('connection') !== -1 || titleStr.indexOf('connection corner') !== -1 || t.indexOf('workshop') !== -1) {
      return 'cat-connection-corner';
    }
    if (t.indexOf('jam') !== -1) return 'cat-solver-jam';
    if (t.indexOf('custom') !== -1) return 'cat-custom-event';
    if (t.indexOf('adda') !== -1) return 'cat-adda';
    return 'cat-default';
  }

  function getCategoryLabel(type) {
    if (!type) return 'Adda';
    var t = String(type).trim();
    if (t.toLowerCase().indexOf('jam') !== -1) return 'SolverJam';
    if (t.toLowerCase().indexOf('custom') !== -1) return 'Custom Event';
    if (t.toLowerCase().indexOf('adda') !== -1) return 'Adda';
    return t;
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '';
    var trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    var normalized = trimmed.indexOf('T') !== -1 ? trimmed : trimmed.replace(' ', 'T');
    if (!/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized)) {
      normalized += '+05:30';
    }
    var d = new Date(normalized);
    if (isNaN(d.getTime())) return escapeHtml(dateStr);

    var formattedDate = d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    var formattedTime = d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return formattedDate + ' &bull; ' + formattedTime;
  }

  function formatShortDateTimeRange(event) {
    if (!event) return '';
    var start = formatShortDate(event.start_date_time);
    var end = formatEventTime(event.end_date_time);
    return end ? start + ' – ' + end : start;
  }

  function formatEventTime(dateStr) {
    if (!dateStr) return '';
    var trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    var normalized = trimmed.indexOf('T') !== -1 ? trimmed : trimmed.replace(' ', 'T');
    if (!/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized)) {
      normalized += '+05:30';
    }
    var d = new Date(normalized);
    if (isNaN(d.getTime())) return '';
    var t = d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return t.toUpperCase();
  }

  function formatEventTimeRange(event) {
    var start = formatEventTime(event && event.start_date_time);
    var end = formatEventTime(event && event.end_date_time);
    if (!start) return end;
    return end ? start + ' – ' + end : start;
  }

  function formatLongDate(dateKey) {
    var p = dateKey.split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function showToast(msg) {
    if (!shareToast) return;
    shareToast.textContent = msg;
    shareToast.classList.add('is-visible');
    setTimeout(function() {
      shareToast.classList.remove('is-visible');
    }, 2800);
  }

  // ========================================================================
  // DAY OVERFLOW EVENTS POPUP MODAL (+N More)
  // ========================================================================

  function formatDayPopupDate(dateKey) {
    if (!dateKey) return '';
    var p = dateKey.split('-');
    if (p.length < 3) return dateKey;
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }

  function openDayEventsPopup(dateKey) {
    if (!dayEventsBackdrop || !dayEventsList) return;
    var dayEvents = calEventsByDate[dateKey] || [];
    if (dayEvents.length === 0) return;

    if (dayEventsTitle) {
      dayEventsTitle.textContent = 'Events on ' + formatDayPopupDate(dateKey);
    }
    if (dayEventsCount) {
      dayEventsCount.textContent = dayEvents.length + (dayEvents.length === 1 ? ' event' : ' events');
    }

    dayEventsList.innerHTML = '';
    dayEvents.forEach(function(ev) {
      var safeTitle = escapeHtml(ev.title || 'Untitled Gathering');
      var timeStr = formatEventTime(ev.start_date_time) || 'All day';
      var cityText = escapeHtml(ev.city || 'Neighbourhood');
      var cleanDesc = stripHtml(ev.description || '');
      var descSnippet = escapeHtml(cleanDesc);

      var isPending = isPendingEvent(ev);
      var catClass = isPending ? 'cat-pending-event' : getCategoryClass(ev.type, ev.title);

      var card = document.createElement('div');
      card.className = 'adda-day-popup-card ' + catClass;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', safeTitle + ', ' + timeStr + ', ' + cityText);

      card.innerHTML = [
        '<div class="adda-day-popup-time">' + escapeHtml(timeStr) + '</div>',
        '<div class="adda-day-popup-content">',
        '  <div class="adda-day-popup-title">' + (isPending ? (safeTitle + ' &middot; Pending') : safeTitle) + '</div>',
        '  <div class="adda-day-popup-location">' + cityText + '</div>',
        (descSnippet && descSnippet.toLowerCase() !== 'na' && descSnippet.toLowerCase() !== 'none' && descSnippet.length > 2) ? ('  <div class="adda-day-popup-desc">' + descSnippet + '</div>') : '',
        '</div>',
        '<div class="adda-day-popup-action">View &rsaquo;</div>'
      ].join('\n');

      function handleCardClick(e) {
        e.preventDefault();
        e.stopPropagation();
        closeDayEventsPopup(true);
        openEventDetailModal(ev);
      }

      card.addEventListener('click', handleCardClick);
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick(e);
        }
      });

      dayEventsList.appendChild(card);
    });

    dayEventsBackdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
      dayEventsBackdrop.classList.add('is-open');
      if (dayEventsCloseBtn) dayEventsCloseBtn.focus();
    }, 10);
  }

  function closeDayEventsPopup(keepScrollLocked) {
    if (!dayEventsBackdrop) return;
    dayEventsBackdrop.classList.remove('is-open');
    setTimeout(function() {
      dayEventsBackdrop.style.display = 'none';
      if (!keepScrollLocked && (!detailModalBackdrop || !detailModalBackdrop.classList.contains('is-open'))) {
        document.body.style.overflow = '';
      }
    }, 200);
  }

  if (dayEventsCloseBtn) {
    dayEventsCloseBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeDayEventsPopup();
    });
  }

  if (dayEventsBackdrop) {
    dayEventsBackdrop.addEventListener('click', function(e) {
      if (e.target === dayEventsBackdrop) {
        closeDayEventsPopup();
      }
    });
  }

  // ========================================================================
  // EVENT DETAIL POPUP MODAL LOGIC
  // ========================================================================

  function openEventDetailModal(ev) {
    if (!ev || !detailModalBackdrop) return;
    currentActiveEvent = ev;

    var safeTitle = ev.title || 'Untitled Gathering';
    modalEventTitle.textContent = safeTitle;

    var catClass = getCategoryClass(ev.type);
    if (modalEventBadge) {
      modalEventBadge.className = 'adda-cat-badge ' + catClass;
      modalEventBadge.textContent = getCategoryLabel(ev.type);
    }
    if (modalEventCity) {
      modalEventCity.textContent = ev.city || 'Neighbourhood';
    }

    if (modalEventTime) {
      modalEventTime.innerHTML = formatShortDateTimeRange(ev);
    }

    var venueParts = [];
    if (ev.room_name) venueParts.push(ev.room_name);
    if (ev.venue_details) venueParts.push(ev.venue_details);
    if (ev.city && venueParts.length === 0) venueParts.push(ev.city);
    var venueText = venueParts.join(' • ');
    if (modalEventVenue) {
      modalEventVenue.textContent = venueText;
      var venueRow = document.getElementById('modal-event-venue-row');
      if (venueRow) {
        venueRow.style.display = venueText ? 'flex' : 'none';
      }
    }

    if (modalEventMode) {
      modalEventMode.textContent = ev.mode || 'Offline';
    }

    var descText = stripHtml(ev.description || '');
    if (modalEventDesc) {
      if (descText && descText.toLowerCase() !== 'na' && descText.toLowerCase() !== 'none') {
        modalEventDesc.textContent = descText;
        modalEventDesc.style.display = 'block';
      } else {
        modalEventDesc.textContent = '';
        modalEventDesc.style.display = 'none';
      }
    }
    renderModalRecap(ev);

    // Image resolution: cover_image or image, normalize relative paths
    var rawImg = (ev.cover_image || ev.image || '');
    if (rawImg && typeof rawImg === 'string' && rawImg.trim()) {
      var cleanImg = rawImg.trim();
      var lowerImg = cleanImg.toLowerCase();
      if (lowerImg === 'none' || lowerImg === 'null' || lowerImg === 'undefined') {
        modalPosterImg.src = '';
        modalPosterWrap.style.display = 'none';
      } else {
        // Keep the server-provided origin for uploaded files. It can differ
        // from the current page host when the site uses an alias or proxy.
        if (!cleanImg.startsWith('http://') && !cleanImg.startsWith('https://') && !cleanImg.startsWith('/')) {
          cleanImg = '/' + cleanImg;
        }
        if (cleanImg.startsWith('/private/files/')) {
          cleanImg = cleanImg.replace('/private/files/', '/files/');
        }
        modalPosterImg.onerror = function() {
          modalPosterWrap.style.display = 'none';
        };
        modalPosterImg.src = cleanImg;
        modalPosterWrap.style.display = 'block';
      }
    } else {
      modalPosterImg.src = '';
      modalPosterWrap.style.display = 'none';
    }

    if (modalRegisterBtn) {
      modalRegisterBtn.style.display = 'none';
    }

    detailModalBackdrop.style.display = 'flex';
    setTimeout(function() {
      detailModalBackdrop.classList.add('is-open');
    }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeEventDetailModal() {
    if (!detailModalBackdrop) return;
    detailModalBackdrop.classList.remove('is-open');
    setTimeout(function() {
      detailModalBackdrop.style.display = 'none';
      currentActiveEvent = null;
      document.body.style.overflow = '';
    }, 200);
  }

  if (modalDetailCloseBtn) modalDetailCloseBtn.addEventListener('click', closeEventDetailModal);
  if (modalDetailActionClose) modalDetailActionClose.addEventListener('click', closeEventDetailModal);

  if (detailModalBackdrop) {
    detailModalBackdrop.addEventListener('click', function(e) {
      if (e.target === detailModalBackdrop) {
        closeEventDetailModal();
      }
    });
  }

  // Poster Lightbox
  if (modalPosterWrap) {
    modalPosterWrap.addEventListener('click', function() {
      var imgSrc = (modalPosterImg && modalPosterImg.src) || (currentActiveEvent && (currentActiveEvent.cover_image || currentActiveEvent.image));
      if (imgSrc && modalPosterWrap.style.display !== 'none' && posterLightboxOverlay && lightboxEnlargedImg) {
        lightboxEnlargedImg.src = imgSrc;
        posterLightboxOverlay.style.display = 'flex';
        setTimeout(function() { posterLightboxOverlay.classList.add('is-open'); }, 10);
      }
    });
  }

  if (posterLightboxOverlay) {
    posterLightboxOverlay.addEventListener('click', function() {
      posterLightboxOverlay.classList.remove('is-open');
      setTimeout(function() { posterLightboxOverlay.style.display = 'none'; }, 200);
    });
  }

  // Share Event Action
  if (modalShareBtn) {
    modalShareBtn.addEventListener('click', function() {
      if (!currentActiveEvent) return;
      var eventIdentifier = currentActiveEvent.unique_id || currentActiveEvent.name;
      var shareUrl = window.location.origin + '/events?event_id=' + encodeURIComponent(eventIdentifier);
      var shareTitle = currentActiveEvent.title || 'Adda Space Gathering';

      if (navigator.share) {
        navigator.share({
          title: shareTitle,
          text: 'Join this gathering at Adda Space: ' + shareTitle,
          url: shareUrl
        }).catch(function() {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(function() {
          showToast('Event link copied to clipboard!');
        }).catch(function() {
          showToast('Share link: ' + shareUrl);
        });
      } else {
        showToast('Share link: ' + shareUrl);
      }
    });
  }

  // ========================================================================
  // EVENT REGISTRATION MODAL LOGIC
  // ========================================================================

  function openEventRegistrationModal(ev) {
    if (!ev || !regModalBackdrop) return;
    currentRegisteringEvent = ev;
    isSubmittingRegistration = false;

    // Reset views
    if (modalRegFormView) modalRegFormView.style.display = 'block';
    if (modalRegSuccessView) modalRegSuccessView.style.display = 'none';
    if (modalRegDuplicateView) modalRegDuplicateView.style.display = 'none';
    if (modalRegPastView) modalRegPastView.style.display = 'none';
    if (modalRegErrorBox) modalRegErrorBox.style.display = 'none';
    if (modalRegMobileError) modalRegMobileError.style.display = 'none';
    if (modalRegNameInput) modalRegNameInput.value = '';
    if (modalRegMobileInput) modalRegMobileInput.value = '';
    if (modalRegSubmitBtn) {
      modalRegSubmitBtn.disabled = false;
      modalRegSubmitBtn.textContent = 'Confirm Free RSVP';
    }

    if (modalRegEventTitle) {
      modalRegEventTitle.textContent = ev.title || 'Untitled Gathering';
    }
    if (modalRegEventTime) {
      modalRegEventTime.innerHTML = formatShortDateTimeRange(ev);
    }
    var venueParts = [];
    if (ev.room_name) venueParts.push(ev.room_name);
    if (ev.venue_details) venueParts.push(ev.venue_details);
    if (ev.city && venueParts.length === 0) venueParts.push(ev.city);
    if (modalRegEventVenue) {
      modalRegEventVenue.textContent = venueParts.join(' • ') || (ev.city || 'Neighbourhood');
    }

    if (isPastEvent(ev)) {
      if (modalRegFormView) modalRegFormView.style.display = 'none';
      if (modalRegPastView) modalRegPastView.style.display = 'block';
    }

    // Close detail modal if open
    if (detailModalBackdrop && detailModalBackdrop.classList.contains('is-open')) {
      detailModalBackdrop.classList.remove('is-open');
      detailModalBackdrop.style.display = 'none';
    }

    regModalBackdrop.style.display = 'flex';
    setTimeout(function() {
      regModalBackdrop.classList.add('is-open');
    }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeEventRegistrationModal() {
    if (!regModalBackdrop) return;
    regModalBackdrop.classList.remove('is-open');
    setTimeout(function() {
      regModalBackdrop.style.display = 'none';
      currentRegisteringEvent = null;
      document.body.style.overflow = '';
    }, 200);
  }

  if (modalRegCloseBtn) modalRegCloseBtn.addEventListener('click', closeEventRegistrationModal);
  if (modalRegSuccessCloseBtn) modalRegSuccessCloseBtn.addEventListener('click', closeEventRegistrationModal);
  if (modalRegDuplicateCloseBtn) modalRegDuplicateCloseBtn.addEventListener('click', closeEventRegistrationModal);
  if (modalRegPastCloseBtn) modalRegPastCloseBtn.addEventListener('click', closeEventRegistrationModal);

  if (regModalBackdrop) {
    regModalBackdrop.addEventListener('click', function(e) {
      if (e.target === regModalBackdrop) {
        closeEventRegistrationModal();
      }
    });
  }

  if (modalRegisterBtn) {
    modalRegisterBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentActiveEvent) {
        openEventRegistrationModal(currentActiveEvent);
      }
    });
  }

  if (modalEventRegForm) {
    modalEventRegForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (isSubmittingRegistration) return;

      if (modalRegErrorBox) modalRegErrorBox.style.display = 'none';
      if (modalRegMobileError) modalRegMobileError.style.display = 'none';

      var rawMob = modalRegMobileInput ? modalRegMobileInput.value.trim() : '';
      var cleanMob = rawMob.replace(/\D/g, '');
      if (cleanMob.length === 11 && cleanMob.charAt(0) === '0') cleanMob = cleanMob.slice(1);
      else if (cleanMob.length === 12 && cleanMob.slice(0, 2) === '91') cleanMob = cleanMob.slice(2);

      if (!cleanMob) {
        if (modalRegMobileError) {
          modalRegMobileError.textContent = 'Mobile number is required.';
          modalRegMobileError.style.display = 'block';
        }
        if (modalRegMobileInput) modalRegMobileInput.focus();
        return;
      }
      if (cleanMob.length !== 10) {
        if (modalRegMobileError) {
          modalRegMobileError.textContent = 'Please enter a valid 10-digit mobile number.';
          modalRegMobileError.style.display = 'block';
        }
        if (modalRegMobileInput) modalRegMobileInput.focus();
        return;
      }
      if (!/^[6-9]/.test(cleanMob)) {
        if (modalRegMobileError) {
          modalRegMobileError.textContent = 'Mobile number must start with 6, 7, 8, or 9.';
          modalRegMobileError.style.display = 'block';
        }
        if (modalRegMobileInput) modalRegMobileInput.focus();
        return;
      }

      if (!currentRegisteringEvent) {
        if (modalRegErrorBox && modalRegErrorText) {
          modalRegErrorText.textContent = 'No event selected for registration.';
          modalRegErrorBox.style.display = 'block';
        }
        return;
      }

      isSubmittingRegistration = true;
      if (modalRegSubmitBtn) {
        modalRegSubmitBtn.disabled = true;
        modalRegSubmitBtn.textContent = 'Reserving your spot...';
      }

      var eventIdentifier = currentRegisteringEvent.name || currentRegisteringEvent.unique_id;
      var fullName = modalRegNameInput ? modalRegNameInput.value.trim() : '';

      fetch('/api/method/adda_space.api.events.register_adda_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Frappe-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          event: eventIdentifier,
          solve_event: eventIdentifier,
          mobile: cleanMob,
          whatsapp_name: fullName || cleanMob,
          full_name: fullName,
          source: 'Web Form'
        })
      })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            var msg = (data && data.message && (data.message.error || data.message)) ||
                      (data && data.error) ||
                      'Registration failed (' + res.status + ')';
            throw new Error(msg);
          }
          return data;
        });
      })
      .then(function(data) {
        var payload = (data && data.message) ? data.message : data;
        if (!payload || typeof payload !== 'object') {
          throw new Error('Received an invalid response from registration server.');
        }

        if (payload.status === 'Rejected') {
          var reason = (payload.reason || '').toLowerCase();
          if (reason.indexOf('duplicate') !== -1 || reason.indexOf('already registered') !== -1 || payload.already_registered === true) {
            var refCode = payload.registration_name || (payload.doc && payload.doc.name) || 'Existing Registration';
            if (modalRegDuplicateId) modalRegDuplicateId.textContent = refCode;
            if (modalRegFormView) modalRegFormView.style.display = 'none';
            if (modalRegDuplicateView) modalRegDuplicateView.style.display = 'block';
            return;
          }
          throw new Error(payload.reason || 'Your registration could not be accepted.');
        }

        var isDuplicate = payload.already_registered === true || payload.is_new === false;
        var regRef = payload.registration_name || (payload.doc && payload.doc.name);

        if (isDuplicate) {
          if (modalRegDuplicateId) modalRegDuplicateId.textContent = regRef || 'Existing Registration';
          if (modalRegFormView) modalRegFormView.style.display = 'none';
          if (modalRegDuplicateView) modalRegDuplicateView.style.display = 'block';
        } else {
          if (modalRegSuccessId) modalRegSuccessId.textContent = regRef || 'Confirmed';
          if (modalRegFormView) modalRegFormView.style.display = 'none';
          if (modalRegSuccessView) modalRegSuccessView.style.display = 'block';
        }
      })
      .catch(function(err) {
        var errMsg = err ? (err.message || String(err)) : 'Unable to complete registration.';
        if (errMsg.toLowerCase().indexOf('duplicate') !== -1 || errMsg.toLowerCase().indexOf('already registered') !== -1) {
          if (modalRegDuplicateId) modalRegDuplicateId.textContent = 'Existing Registration';
          if (modalRegFormView) modalRegFormView.style.display = 'none';
          if (modalRegDuplicateView) modalRegDuplicateView.style.display = 'block';
        } else {
          if (modalRegErrorBox && modalRegErrorText) {
            modalRegErrorText.textContent = errMsg;
            modalRegErrorBox.style.display = 'block';
          }
          if (modalRegSubmitBtn) {
            modalRegSubmitBtn.disabled = false;
            modalRegSubmitBtn.textContent = 'Confirm Free RSVP';
          }
          isSubmittingRegistration = false;
        }
      });
    });
  }

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
    var cityName = currentCoordinatorCity || (modalCitySelect ? modalCitySelect.value : '') || 'Bengaluru';
    var phone = currentCoordinatorData.whatsapp_number;
    var dateToUse = selectedHostDate || (modalEventDate ? modalEventDate.value : null);

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
      setTimeOptions(modalStartTime, [], 'Select an Adda space first');
      setTimeOptions(modalEndTime, [], 'Select an Adda space first');
      if (modalEndTime) modalEndTime.disabled = true;
      return;
    }

    var openT = normalizeClockTime(currentRoomData.opening_time);
    var closeT = normalizeClockTime(currentRoomData.closing_time);
    if (!openT || !closeT) {
      warningBox.style.display = 'none';
      setTimeOptions(modalStartTime, [], 'Space hours could not be read');
      setTimeOptions(modalEndTime, [], 'Space hours could not be read');
      if (modalEndTime) modalEndTime.disabled = true;
      return;
    }
    var closeParts = closeT.split(':').map(Number);
    var openParts = openT.split(':').map(Number);
    var openMinutes = openParts[0] * 60 + openParts[1];
    var closeMinutes = closeParts[0] * 60 + closeParts[1];
    var lastStartMinutes = closeMinutes - 15;
    var preferredStart = modalStartTime.value || pendingModalStartTime;
    var preferredEnd = modalEndTime.value || pendingModalEndTime;
    setTimeOptions(modalStartTime, timeChoices(openMinutes, lastStartMinutes), 'Select a start time', preferredStart);
    updateModalEndTimeOptions(preferredEnd);
    pendingModalStartTime = '';
    pendingModalEndTime = '';
    updateDurationDisplay();

    var startTimeVal = modalStartTime ? modalStartTime.value : '';
    var endTimeVal = modalEndTime ? modalEndTime.value : '';
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
    if (!currentRoomData || !currentRoomData.closing_time || !modalStartTime || !modalStartTime.value) {
      setTimeOptions(modalEndTime, [], 'Select a start time first');
      if (modalEndTime) modalEndTime.disabled = true;
      return;
    }
    var closing = timeToMinutes(currentRoomData.closing_time);
    var start = timeToMinutes(modalStartTime.value);
    setTimeOptions(modalEndTime, timeChoices(start + 15, closing), 'Select an end time', preferred || minutesToTime(start + 60));
    modalEndTime.disabled = false;
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

    if (modalTitleInput) modalTitleInput.value = '';
    if (modalDescInput) modalDescInput.value = '';
    if (modalPeopleInput) modalPeopleInput.value = '20';
    if (modalModeSelect) modalModeSelect.value = 'Offline';
    if (modalSelectedRoom) modalSelectedRoom.value = '';
    if (modalRoomsGrid) {
      modalRoomsGrid.querySelectorAll('.adda-room-card').forEach(function(c) { c.classList.remove('selected'); });
    }

    selectedPosterFile = null;
    selectedPosterDataUrl = '';
    uploadedPosterUrl = '';
    if (modalPosterFile) modalPosterFile.value = '';
    if (modalPosterUrlInput) modalPosterUrlInput.value = '';
    if (modalHostPosterImg) modalHostPosterImg.src = '';
    if (modalPosterFilename) modalPosterFilename.textContent = '';
    if (modalPosterFilesize) modalPosterFilesize.textContent = '';
    if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'none';

    if (modalStep1Error) modalStep1Error.style.display = 'none';
    var step2Err = document.getElementById('modal-step-2-error');
    if (step2Err) step2Err.style.display = 'none';
    if (modalStep3Error) modalStep3Error.style.display = 'none';
    if (modalSubmitErrorBox) modalSubmitErrorBox.style.display = 'none';
    if (modalAvailBanner) modalAvailBanner.style.display = 'none';

    if (modalStepSubmitBtn) {
      modalStepSubmitBtn.disabled = false;
      modalStepSubmitBtn.textContent = 'Submit Gathering Proposal';
    }
  }

  function openHostModal(prefilledDate, preserveDraft) {
    if (!hostModalBackdrop) return;

    selectedHostDate = prefilledDate || null;

    // Reset previous inputs if fresh proposal or prefilling date
    if (!preserveDraft && (hostModalStep === 5 || prefilledDate)) {
      resetHostModalForm();
      selectedHostDate = prefilledDate || null;
    }

    if (prefilledDate && modalEventDate) {
      modalEventDate.value = prefilledDate;
    } else if (modalEventDate && !modalEventDate.value) {
      modalEventDate.value = istDateStr;
    }

    var targetCity = preserveDraft
      ? ((modalCitySelect && modalCitySelect.value) || currentCity || '')
      : (currentCity || '');
    if (modalCitySelect) {
      modalCitySelect.value = targetCity;
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
        if (modalRoomsGrid) modalRoomsGrid.innerHTML = '';
        if (modalRoomsLoading) modalRoomsLoading.style.display = 'none';
      }
    }

    hostModalBackdrop.style.display = 'flex';
    setTimeout(function() {
      hostModalBackdrop.classList.add('is-open');
    }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeHostModal() {
    if (!hostModalBackdrop) return;
    var wasSubmitted = (hostModalStep === 5);
    hostModalBackdrop.classList.remove('is-open');
    setTimeout(function() {
      hostModalBackdrop.style.display = 'none';
      document.body.style.overflow = '';
      if (wasSubmitted) {
        resetHostModalForm();
        fetchCalendarEvents();
      }
    }, 200);
  }

  if (openHostModalBtn) openHostModalBtn.addEventListener('click', function() { openHostModal(); });
  if (calDrawerHostBtn) calDrawerHostBtn.addEventListener('click', function() { openHostModal(selectedDateStr); });
  if (calDrawerHostActiveBtn) calDrawerHostActiveBtn.addEventListener('click', function() { openHostModal(selectedDateStr); });
  if (emptyHostBtn) emptyHostBtn.addEventListener('click', function() { openHostModal(); });
  if (hostModalCloseBtn) hostModalCloseBtn.addEventListener('click', closeHostModal);
  if (modalConfCloseBtn) modalConfCloseBtn.addEventListener('click', closeHostModal);

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
  if (modalCitySelect) {
    modalCitySelect.addEventListener('change', function() {
      updateCoordinatorInfo(this.value);
      loadModalRooms(this.value);
    });
  }

  // Screen Back buttons
  var hostStep2BackBtn = document.getElementById('host-step-2-back-btn');
  if (hostStep2BackBtn) hostStep2BackBtn.addEventListener('click', function() { goToModalStep(1); });

  var hostStep3BackBtn = document.getElementById('host-step-3-back-btn');
  if (hostStep3BackBtn) hostStep3BackBtn.addEventListener('click', function() { goToModalStep(2); });

  if (hostModalBackdrop) {
    hostModalBackdrop.addEventListener('click', function(e) {
      if (e.target === hostModalBackdrop) {
        closeHostModal();
      }
    });
  }

  function saveHostDraft() {
    var state = {
      city: modalCitySelect ? modalCitySelect.value : '',
      date: modalEventDate ? modalEventDate.value : '',
      start_time: modalStartTime ? modalStartTime.value : '',
      end_time: modalEndTime ? modalEndTime.value : '',
      room_name: modalSelectedRoom ? modalSelectedRoom.value : '',
      title: modalTitleInput ? modalTitleInput.value : '',
      description: modalDescInput ? modalDescInput.value : '',
      people_expected: modalPeopleInput ? modalPeopleInput.value : '',
      mode: modalModeSelect ? modalModeSelect.value : 'Offline',
      poster_filename: selectedPosterFile ? selectedPosterFile.name : (modalPosterFilename ? modalPosterFilename.textContent : ''),
      uploaded_poster_url: (modalPosterUrlInput && modalPosterUrlInput.value.trim()) || uploadedPosterUrl || '',
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

      if (state.city && modalCitySelect) {
        modalCitySelect.value = state.city;
      }
      if (state.date && modalEventDate) {
        modalEventDate.value = state.date;
        selectedHostDate = state.date;
      }
      pendingModalStartTime = state.start_time || '';
      pendingModalEndTime = state.end_time || '';
      if (state.room_name && modalSelectedRoom) modalSelectedRoom.value = state.room_name;
      if (state.title && modalTitleInput) modalTitleInput.value = state.title;
      if (state.description && modalDescInput) modalDescInput.value = state.description;
      if (state.people_expected && modalPeopleInput) modalPeopleInput.value = state.people_expected;
      if (state.mode && modalModeSelect) modalModeSelect.value = state.mode;
      if (state.poster_source === 'url' || (state.uploaded_poster_url && /^https?:\/\//i.test(state.uploaded_poster_url))) {
        setModalPosterTab('url');
        if (modalPosterUrlInput) modalPosterUrlInput.value = state.uploaded_poster_url;
      }
      if (state.uploaded_poster_url) {
        uploadedPosterUrl = state.uploaded_poster_url;
        if (modalHostPosterImg) modalHostPosterImg.src = uploadedPosterUrl;
        if (modalPosterFilename) modalPosterFilename.textContent = state.poster_filename || (uploadedPosterUrl.split('?')[0].split('/').pop()) || 'Poster Image';
        if (modalPosterFilesize) modalPosterFilesize.textContent = /^https?:\/\//i.test(uploadedPosterUrl) ? 'Web Image Link' : 'Uploaded';
        if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'block';
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
      var currentChosenCity = (modalCitySelect && modalCitySelect.value) || '';
      updateCoordinatorInfo(currentChosenCity);
    }

    if (step === 3) {
      if (selectedPosterDataUrl || uploadedPosterUrl) {
        if (modalHostPosterImg) modalHostPosterImg.src = selectedPosterDataUrl || uploadedPosterUrl;
        if (modalPosterFilename && selectedPosterFile) modalPosterFilename.textContent = selectedPosterFile.name;
        else if (modalPosterFilename && uploadedPosterUrl) modalPosterFilename.textContent = uploadedPosterUrl.split('/').pop();
        if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'block';
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
      if (hostAvailableRooms.length === 0 && modalRoomsGrid && modalRoomsGrid.style.display !== 'none') {
        var hStep2Btn = document.getElementById('host-step-2-continue-btn');
        if (hStep2Btn) hStep2Btn.disabled = true;
      }
    }

    if (hostModalStep === 3) {
      // Update Screen 3 Summary Card
      var summaryRoomEl = document.getElementById('modal-step-3-summary-room');
      var summaryDatetimeEl = document.getElementById('modal-step-3-summary-datetime');
      if (summaryRoomEl) {
        var roomName = modalSelectedRoom ? modalSelectedRoom.value : '';
        var cityName = modalCitySelect ? modalCitySelect.value : '';
        summaryRoomEl.textContent = (roomName || 'Selected Space') + (cityName ? ' • ' + cityName : '');
      }
      if (summaryDatetimeEl && modalEventDate && modalStartTime && modalEndTime) {
        var dateFormatted = modalEventDate.value ? formatLongDate(modalEventDate.value) : '';
        var s = modalStartTime.value;
        var e = modalEndTime.value;
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
    if (modalStepBackBtn) modalStepBackBtn.style.display = (hostModalStep > 1 && hostModalStep < 5) ? 'inline-block' : 'none';
    if (modalStepNextBtn) {
      modalStepNextBtn.style.display = (hostModalStep < 3) ? 'inline-block' : 'none';
      modalStepNextBtn.disabled = false;
      if (hostModalStep === 1) modalStepNextBtn.textContent = 'Next: Date & Space →';
      if (hostModalStep === 2) modalStepNextBtn.textContent = 'Next: Event Details →';
    }
  }

  function updateDurationDisplay() {
    if (!modalStartTime || !modalEndTime || !modalDurationDisplay) return;
    var s = modalStartTime.value;
    var e = modalEndTime.value;
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
        modalDurationDisplay.textContent = 'You’ll request ' + s + ' – ' + e + ' (' + durStr + ')';
        modalDurationDisplay.style.color = '#0F766E';
        var canProceed = Boolean(modalSelectedRoom && modalSelectedRoom.value && (modalAvailabilityStatus === 'available' || modalAvailabilityStatus === 'warning_pending'));
        if (hStep2Btn) hStep2Btn.disabled = !canProceed;
      } else {
        modalDurationDisplay.textContent = 'End time must be later than start time.';
        modalDurationDisplay.style.color = '#DC2626';
        if (hStep2Btn) hStep2Btn.disabled = true;
      }
    }
  }

  if (modalStartTime) modalStartTime.addEventListener('change', updateDurationDisplay);
  if (modalEndTime) modalEndTime.addEventListener('change', updateDurationDisplay);

  function loadModalRooms(city, callback) {
    if (!modalRoomsLoading || !modalRoomsGrid) return;
    modalAvailabilitySeq++;
    modalAvailabilityStatus = 'unknown';
    currentRoomData = null;
    updateRoomOperatingHoursDisplay(null);
    var availabilityContinueBtn = document.getElementById('host-step-2-continue-btn');
    if (availabilityContinueBtn) availabilityContinueBtn.disabled = true;
    modalRoomsLoading.style.display = 'block';
    modalRoomsGrid.style.display = 'none';

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
      modalRoomsLoading.style.display = 'none';
      var payload = data.message || data;
      hostAvailableRooms = (payload && Array.isArray(payload.rooms)) ? payload.rooms : [];

      modalRoomsGrid.innerHTML = '';
      if (hostAvailableRooms.length === 0) {
        modalSelectedRoom.value = '';
        currentRoomData = null;
        updateRoomOperatingHoursDisplay(null);
        checkOperatingHoursWarning();
        modalRoomsGrid.innerHTML = '<div class="adda-room-empty" style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--adda-text-muted); background: var(--adda-surface-warm); border-radius: var(--radius-sm); border: 1px dashed var(--adda-border);"><p style="margin: 0;">No active spaces or rooms found for this city.</p></div>';
        modalRoomsGrid.style.display = 'block';
        var hStep2Btn = document.getElementById('host-step-2-continue-btn');
        if (hStep2Btn) hStep2Btn.disabled = true;
        if (callback) callback();
        return;
      }

      var selectedIndex = -1;
      hostAvailableRooms.forEach(function(r, idx) {
        if (modalSelectedRoom.value && modalSelectedRoom.value === (r.room_name || r.name)) {
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
          modalSelectedRoom.value = rName;
          currentRoomData = r;
          if (modalCapacityHint) modalCapacityHint.textContent = 'Room capacity is ' + (r.capacity || 'Flexible') + ' people.';
        }

        card.innerHTML = [
          '<div class="adda-room-name">' + escapeHtml(rName) + '</div>',
          '<div class="adda-room-cap">Capacity: ~' + escapeHtml(r.capacity || 'Flexible') + ' people</div>',
          '<div class="adda-room-hours-hint" style="font-size: 0.75rem; color: #4B5563; margin-top: 0.25rem;">' + escapeHtml(hoursText) + '</div>'
        ].join('\n');

        card.addEventListener('click', function() {
          modalRoomsGrid.querySelectorAll('.adda-room-card').forEach(function(c) { c.classList.remove('selected'); });
          card.classList.add('selected');
          modalSelectedRoom.value = rName;
          currentRoomData = r;
          if (modalCapacityHint) modalCapacityHint.textContent = 'Room capacity is ' + (r.capacity || 'Flexible') + ' people.';
          updateRoomOperatingHoursDisplay(r);
          checkOperatingHoursWarning();
          var hStep2Btn = document.getElementById('host-step-2-continue-btn');
          if (hStep2Btn) {
            var hasHours = Boolean(r && r.opening_time && r.closing_time);
            hStep2Btn.disabled = !hasHours;
          }
          checkModalRoomAvailability();
        });

        modalRoomsGrid.appendChild(card);
      });

      modalRoomsGrid.style.display = 'grid';
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
      modalRoomsLoading.style.display = 'none';
      hostAvailableRooms = [];
      modalSelectedRoom.value = '';
      currentRoomData = null;
      updateRoomOperatingHoursDisplay(null);
      checkOperatingHoursWarning();
      modalRoomsGrid.innerHTML = '<div class="adda-room-empty" style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: #DC2626; background: #FEF2F2; border-radius: var(--radius-sm); border: 1px solid #FCA5A5;"><p style="margin: 0;">Unable to load spaces for this city. Please try again.</p></div>';
      modalRoomsGrid.style.display = 'block';
      var hStep2Btn = document.getElementById('host-step-2-continue-btn');
      if (hStep2Btn) hStep2Btn.disabled = true;
      if (callback) callback();
    });
  }

  function checkModalRoomAvailability() {
    var date = modalEventDate.value;
    var city = modalCitySelect.value;
    var room = modalSelectedRoom.value;
    var startTime = modalStartTime.value;
    var endTime = modalEndTime.value;

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

      modalAvailBanner.style.display = 'flex';
      if (collision) {
        modalAvailabilityStatus = 'collision';
        modalAvailBanner.className = 'adda-avail-box adda-avail-alert';
        var cStart = collision.start_time ? collision.start_time.slice(0, 5) : '';
        var cEnd = collision.end_time ? collision.end_time.slice(0, 5) : '';
        modalAvailMessage.innerHTML = '<strong>This space is already booked during that time.</strong> ' + escapeHtml(room ? room + ' is' : 'This space is') + ' booked for approved event "' +
          escapeHtml(collision.title || 'Another Event') + '" (' + escapeHtml(cStart) + ' &ndash; ' +
          escapeHtml(cEnd) + '). Please choose another time after or before this event.';
        if (hStep2Btn) hStep2Btn.disabled = true;
      } else if (pendingCollision) {
        modalAvailabilityStatus = 'warning_pending';
        modalAvailBanner.className = 'adda-avail-box adda-avail-warning';
        var pStart = pendingCollision.start_time ? pendingCollision.start_time.slice(0, 5) : '';
        var pEnd = pendingCollision.end_time ? pendingCollision.end_time.slice(0, 5) : '';
        modalAvailMessage.innerHTML = '<strong>Warning: Already there is a pending event with this time.</strong> There is a pending event proposal "' +
          escapeHtml(pendingCollision.title || 'Pending Event') + '" (' + escapeHtml(pStart) + ' &ndash; ' +
          escapeHtml(pEnd) + '). You can still request this time slot for coordinator review.';
        if (hStep2Btn) hStep2Btn.disabled = false;
        updateDurationDisplay();
      } else {
        modalAvailabilityStatus = 'available';
        modalAvailBanner.className = 'adda-avail-box adda-avail-success';
        modalAvailMessage.innerHTML = '<strong>Available:</strong> ' + escapeHtml(room || 'This space') + ' is free for your selected slot (' +
          escapeHtml(startTime) + ' &ndash; ' + escapeHtml(endTime) + ').';
        if (hStep2Btn) hStep2Btn.disabled = false;
        updateDurationDisplay();
      }
    })
    .catch(function() {
      if (requestSeq !== modalAvailabilitySeq) return;
      modalAvailabilityStatus = 'error';
      modalAvailBanner.className = 'adda-avail-box adda-avail-alert';
      modalAvailMessage.textContent = 'Could not verify room availability. Please change the date or time to retry.';
      modalAvailBanner.style.display = 'flex';
      if (hStep2Btn) hStep2Btn.disabled = true;
    });
  }

  if (modalEventDate) {
    modalEventDate.addEventListener('input', function() {
      selectedHostDate = this.value;
      updateWhatsAppLink();
      checkOperatingHoursWarning();
    });
    modalEventDate.addEventListener('change', function() {
      selectedHostDate = this.value;
      updateWhatsAppLink();
      checkOperatingHoursWarning();
      checkModalRoomAvailability();
    });
  }
  if (modalStartTime) {
    modalStartTime.addEventListener('change', function() {
      updateModalEndTimeOptions();
      checkModalRoomAvailability();
      checkOperatingHoursWarning();
    });
    modalStartTime.addEventListener('input', checkOperatingHoursWarning);
  }
  if (modalEndTime) {
    modalEndTime.addEventListener('change', function() {
      checkModalRoomAvailability();
      checkOperatingHoursWarning();
    });
    modalEndTime.addEventListener('input', checkOperatingHoursWarning);
  }

  // Poster Image Preview
  if (modalPosterFile) {
    modalPosterFile.addEventListener('change', function() {
      var file = this.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Poster file must be less than 5MB.');
          this.value = '';
          modalPosterPreviewBox.style.display = 'none';
          return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
          if (modalHostPosterImg) modalHostPosterImg.src = e.target.result;
          modalPosterPreviewBox.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        modalPosterPreviewBox.style.display = 'none';
      }
    });
  }

  function populateModalReview() {
    if (mrevTitle) mrevTitle.textContent = modalTitleInput ? modalTitleInput.value.trim() || 'Untitled Gathering' : '';
    if (mrevCity) mrevCity.textContent = modalCitySelect ? modalCitySelect.value || 'Not selected' : '';
    if (mrevRoom) mrevRoom.textContent = modalSelectedRoom ? modalSelectedRoom.value || 'Not selected' : '';
    if (mrevDatetime) mrevDatetime.textContent = (modalEventDate ? modalEventDate.value || '' : '') + ' (' + (modalStartTime ? modalStartTime.value || '' : '') + ' - ' + (modalEndTime ? modalEndTime.value || '' : '') + ')';
    if (mrevPeople) mrevPeople.textContent = (modalPeopleInput ? modalPeopleInput.value || '20' : '20') + ' people';

    // Auth callouts removed — all users can submit freely
    if (modalStepSubmitBtn) modalStepSubmitBtn.style.display = 'inline-block';
  }

  if (modalSaveAndLoginBtn) {
    modalSaveAndLoginBtn.addEventListener('click', function(e) {
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
      var city = modalCitySelect ? modalCitySelect.value : '';
      if (!city) {
        if (modalStep1Error) modalStep1Error.style.display = 'flex';
        return;
      }
      if (modalStep1Error) modalStep1Error.style.display = 'none';
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

      if (!modalEventDate || !modalEventDate.value) {
        showStep2Error('Please select a date.');
        return;
      }
      if (modalEventDate.value < istDateStr) {
        showStep2Error('Please select today or a future date.');
        return;
      }
      if (!modalStartTime || !modalEndTime || !modalStartTime.value || !modalEndTime.value) {
        showStep2Error('Please select start and end time.');
        return;
      }
      if (modalStartTime.value >= modalEndTime.value) {
        showStep2Error('End time must be after start time.');
        return;
      }
      if (!modalSelectedRoom || !modalSelectedRoom.value) {
        showStep2Error('Please select an Adda room.');
        return;
      }
      if (!currentRoomData || !currentRoomData.opening_time || !currentRoomData.closing_time) {
        showStep2Error('Operating hours are not configured for this space. Please contact a coordinator or select another space.');
        return;
      }
      var op = normalizeClockTime(currentRoomData.opening_time);
      var cl = normalizeClockTime(currentRoomData.closing_time);
      if (!op || !cl || timeToMinutes(modalStartTime.value) < timeToMinutes(op) || timeToMinutes(modalEndTime.value) > timeToMinutes(cl)) {
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
  if (modalStepBackBtn) {
    modalStepBackBtn.addEventListener('click', function() {
      if (hostModalStep > 1) goToModalStep(hostModalStep - 1);
    });
  }

  if (modalStepNextBtn) {
    modalStepNextBtn.addEventListener('click', function() {
      if (hostModalStep === 1) {
        var city = modalCitySelect ? modalCitySelect.value : '';
        if (!city) {
          if (modalStep1Error) modalStep1Error.style.display = 'flex';
          return;
        }
        if (modalStep1Error) modalStep1Error.style.display = 'none';
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

        if (!modalEventDate || !modalEventDate.value) {
          showStep2Error('Please select a date.');
          return;
        }
        if (modalEventDate.value < istDateStr) {
          showStep2Error('Please select today or a future date.');
          return;
        }
        if (!modalStartTime || !modalEndTime || !modalStartTime.value || !modalEndTime.value) {
          showStep2Error('Please select start and end time.');
          return;
        }
        if (modalStartTime.value >= modalEndTime.value) {
          showStep2Error('End time must be after start time.');
          return;
        }
        if (!modalSelectedRoom || !modalSelectedRoom.value) {
          showStep2Error('Please select an Adda room.');
          return;
        }
        if (!currentRoomData || !currentRoomData.opening_time || !currentRoomData.closing_time) {
          showStep2Error('Operating hours are not configured for this space. Please contact a coordinator or select another space.');
          return;
        }
        var op = normalizeClockTime(currentRoomData.opening_time);
        var cl = normalizeClockTime(currentRoomData.closing_time);
        if (!op || !cl || timeToMinutes(modalStartTime.value) < timeToMinutes(op) || timeToMinutes(modalEndTime.value) > timeToMinutes(cl)) {
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
      if (modalPosterTabUpload) {
        modalPosterTabUpload.style.background = '#111827';
        modalPosterTabUpload.style.color = '#FFFFFF';
        modalPosterTabUpload.classList.add('active');
      }
      if (modalPosterTabUrl) {
        modalPosterTabUrl.style.background = '#F9FAFB';
        modalPosterTabUrl.style.color = '#374151';
        modalPosterTabUrl.classList.remove('active');
      }
      if (modalPosterUploadPanel) modalPosterUploadPanel.style.display = 'block';
      if (modalPosterUrlPanel) modalPosterUrlPanel.style.display = 'none';
    } else {
      if (modalPosterTabUpload) {
        modalPosterTabUpload.style.background = '#F9FAFB';
        modalPosterTabUpload.style.color = '#374151';
        modalPosterTabUpload.classList.remove('active');
      }
      if (modalPosterTabUrl) {
        modalPosterTabUrl.style.background = '#111827';
        modalPosterTabUrl.style.color = '#FFFFFF';
        modalPosterTabUrl.classList.add('active');
      }
      if (modalPosterUploadPanel) modalPosterUploadPanel.style.display = 'none';
      if (modalPosterUrlPanel) modalPosterUrlPanel.style.display = 'block';
      if (modalPosterUrlInput && modalPosterUrlInput.value.trim()) {
        handleModalPosterUrlInput();
      }
    }
    saveHostDraft();
  }

  if (modalPosterTabUpload) modalPosterTabUpload.addEventListener('click', function() { setModalPosterTab('upload'); });
  if (modalPosterTabUrl) modalPosterTabUrl.addEventListener('click', function() { setModalPosterTab('url'); });

  function handleModalPosterUrlInput() {
    var url = (modalPosterUrlInput && modalPosterUrlInput.value.trim()) || '';
    if (!url) {
      if (modalPosterSource === 'url' && !selectedPosterFile && !uploadedPosterUrl) {
        if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'none';
      }
      return;
    }
    var isValidUrl = /^https?:\/\/.+/i.test(url) || /^\/\/.+/i.test(url);
    if (!isValidUrl) {
      if (modalPosterPreviewBox && modalPosterSource === 'url' && !selectedPosterFile) {
        modalPosterPreviewBox.style.display = 'none';
      }
      return;
    }
    if (modalStep3Error) modalStep3Error.style.display = 'none';
    if (modalHostPosterImg) {
      modalHostPosterImg.onload = function() {
        if (modalPosterFilename) {
          var cleanName = url.split('?')[0].split('#')[0].split('/').pop();
          modalPosterFilename.textContent = cleanName || 'Image URL';
        }
        if (modalPosterFilesize) modalPosterFilesize.textContent = 'Web Image Link';
        if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'block';
      };
      modalHostPosterImg.onerror = function() {
        if (modalPosterPreviewBox && modalPosterSource === 'url' && !selectedPosterFile) {
          modalPosterPreviewBox.style.display = 'none';
        }
      };
      modalHostPosterImg.src = url;
    }
    saveHostDraft();
  }

  if (modalPosterUrlInput) {
    modalPosterUrlInput.addEventListener('input', handleModalPosterUrlInput);
    modalPosterUrlInput.addEventListener('change', handleModalPosterUrlInput);
  }

  // Poster File Selection & Validation
  if (modalPosterFile) {
    modalPosterFile.addEventListener('change', function() {
      var file = this.files && this.files[0];
      if (!file) return;

      var validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      var fileName = file.name.toLowerCase();
      var isValidExt = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp');
      if (!validTypes.includes(file.type) && !isValidExt) {
        if (modalStep3Error) {
          modalStep3Error.style.display = 'flex';
          if (modalStep3ErrorText) modalStep3ErrorText.textContent = 'Unsupported file format. Please upload a PNG, JPG, or WEBP image.';
        }
        this.value = '';
        selectedPosterFile = null;
        if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'none';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        if (modalStep3Error) {
          modalStep3Error.style.display = 'flex';
          if (modalStep3ErrorText) modalStep3ErrorText.textContent = 'Poster image size cannot exceed 5MB.';
        }
        this.value = '';
        selectedPosterFile = null;
        if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'none';
        return;
      }

      if (modalStep3Error) modalStep3Error.style.display = 'none';
      selectedPosterFile = file;

      var reader = new FileReader();
      reader.onload = function(e) {
        selectedPosterDataUrl = e.target.result;
        if (modalHostPosterImg) modalHostPosterImg.src = selectedPosterDataUrl;
        if (modalPosterFilename) modalPosterFilename.textContent = file.name;
        if (modalPosterFilesize) modalPosterFilesize.textContent = (file.size / 1024).toFixed(1) + ' KB';
        if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'block';
        saveHostDraft();
      };
      reader.readAsDataURL(file);
    });
  }

  if (modalPosterReplaceBtn) {
    modalPosterReplaceBtn.addEventListener('click', function(e) {
      e.preventDefault();
      selectedPosterFile = null;
      selectedPosterDataUrl = '';
      uploadedPosterUrl = '';
      if (modalPosterFile) {
        modalPosterFile.value = '';
      }
      if (modalPosterUrlInput) {
        modalPosterUrlInput.value = '';
      }
      if (modalHostPosterImg) modalHostPosterImg.src = '';
      if (modalPosterPreviewBox) modalPosterPreviewBox.style.display = 'none';
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
  if (modalStepSubmitBtn) {
    modalStepSubmitBtn.addEventListener('click', function() {
      var title = modalTitleInput ? modalTitleInput.value.trim() : '';
      var desc = modalDescInput ? modalDescInput.value.trim() : '';
      if (!title) {
        if (modalStep3Error) {
          modalStep3Error.style.display = 'flex';
          if (modalStep3ErrorText) modalStep3ErrorText.textContent = 'Please provide an event title.';
        }
        return;
      }
      if (!desc) {
        if (modalStep3Error) {
          modalStep3Error.style.display = 'flex';
          if (modalStep3ErrorText) modalStep3ErrorText.textContent = 'Please provide an event description.';
        }
        return;
      }

      var DEFAULT_HOST_POSTER_URL = '/assets/adda_space/images/default_event_poster.jpg';
      var file = selectedPosterFile || (modalPosterFile && modalPosterFile.files && modalPosterFile.files[0]);
      var directUrl = (modalPosterUrlInput && modalPosterUrlInput.value.trim()) || '';

      if (directUrl && !file && !uploadedPosterUrl) {
        var isValidUrl = /^https?:\/\/.+/i.test(directUrl) || /^\/\/.+/i.test(directUrl);
        if (!isValidUrl) {
          if (modalStep3Error) {
            modalStep3Error.style.display = 'flex';
            if (modalStep3ErrorText) modalStep3ErrorText.textContent = 'Please provide a valid image URL starting with http:// or https://';
          }
          return;
        }
      }

      if (modalStep3Error) modalStep3Error.style.display = 'none';

      if (isSubmittingHostProposal) return;
      isSubmittingHostProposal = true;
      if (modalSubmitErrorBox) modalSubmitErrorBox.style.display = 'none';

      // If direct image URL provided and no local file selected, submit directly
      if (directUrl && !file) {
        modalStepSubmitBtn.disabled = true;
        modalStepSubmitBtn.textContent = 'Submitting proposal...';
        submitHostPayload(directUrl);
        return;
      }

      // If poster was already uploaded in this session and no new file selected, proceed directly
      if (uploadedPosterUrl && !file) {
        modalStepSubmitBtn.disabled = true;
        modalStepSubmitBtn.textContent = 'Submitting proposal...';
        submitHostPayload(uploadedPosterUrl);
        return;
      }

      // If no poster provided, submit directly with default poster
      if (!file) {
        modalStepSubmitBtn.disabled = true;
        modalStepSubmitBtn.textContent = 'Submitting proposal...';
        submitHostPayload(DEFAULT_HOST_POSTER_URL);
        return;
      }

      modalStepSubmitBtn.disabled = true;
      modalStepSubmitBtn.textContent = 'Uploading poster...';

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
        modalStepSubmitBtn.textContent = 'Submitting proposal...';
        submitHostPayload(fileUrl);
      })
      .catch(function(uploadErr) {
        isSubmittingHostProposal = false;
        modalStepSubmitBtn.disabled = false;
        modalStepSubmitBtn.textContent = 'Submit Gathering Proposal';
        if (modalSubmitErrorBox) modalSubmitErrorBox.style.display = 'flex';
        if (modalSubmitErrorText) modalSubmitErrorText.textContent = 'Poster upload failed: ' + (uploadErr.message || 'Please check your file and try again.');
      });
    });
  }

  function submitHostPayload(coverImageUrl) {
    var finalImageUrl = coverImageUrl || DEFAULT_HOST_POSTER_URL;

    var sDate = modalEventDate.value;
    var sTime = modalStartTime.value;
    var eTime = modalEndTime.value;

    var payload = {
      title: modalTitleInput.value.trim(),
      type: 'Custom Event',
      description: modalDescInput.value.trim(),
      start_date_time: sDate + ' ' + sTime + ':00',
      end_date_time: sDate + ' ' + eTime + ':00',
      start: sDate + ' ' + sTime + ':00',
      end: sDate + ' ' + eTime + ':00',
      city: modalCitySelect.value.trim(),
      room_name: modalSelectedRoom.value.trim(),
      people_expected: parseInt(modalPeopleInput.value, 10) || 20,
      approval_status: 'Pending Review',
      mode: modalModeSelect.value || 'Offline',
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
      if (modalConfRefName) modalConfRefName.textContent = doc.name || doc.title || 'Created';
      goToModalStep(5);
    })
    .catch(function(err) {
      isSubmittingHostProposal = false;
      modalStepSubmitBtn.disabled = false;
      modalStepSubmitBtn.textContent = 'Submit Gathering Proposal';
      if (modalSubmitErrorBox) modalSubmitErrorBox.style.display = 'flex';
      if (modalSubmitErrorText) modalSubmitErrorText.textContent = err.message || 'Unable to submit proposal. Please try again.';
    });
  }

  // ========================================================================
  // CALENDAR VIEW LOGIC
  // ========================================================================

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function updateCalHeader() {
    if (calMonthTitle) calMonthTitle.textContent = monthNames[calMonth];
    if (calYearBadge) calYearBadge.textContent = calYear;
  }

  function fetchCalendarEvents() {
    if (calLoading) calLoading.style.display = 'block';
    updateCalHeader();

    var leadDays = getFirstDayOfWeek(calYear, calMonth);
    var daysInCurMonth = getDaysInMonth(calYear, calMonth);
    var totalCells = leadDays + daysInCurMonth;
    var trailDays = (7 - (totalCells % 7)) % 7;

    var prevMonthDays = getDaysInMonth(calYear, calMonth - 1);

    var startDateKey = '';
    var endDateKey = '';

    if (leadDays > 0) {
      var pYear = calMonth === 0 ? calYear - 1 : calYear;
      var pMonth = calMonth === 0 ? 11 : calMonth - 1;
      var pStartDay = prevMonthDays - leadDays + 1;
      startDateKey = pYear + '-' + padZero(pMonth + 1) + '-' + padZero(pStartDay);
    } else {
      startDateKey = calYear + '-' + padZero(calMonth + 1) + '-01';
    }

    if (trailDays > 0) {
      var nYear = calMonth === 11 ? calYear + 1 : calYear;
      var nMonth = calMonth === 11 ? 0 : calMonth + 1;
      endDateKey = nYear + '-' + padZero(nMonth + 1) + '-' + padZero(trailDays);
    } else {
      endDateKey = calYear + '-' + padZero(calMonth + 1) + '-' + padZero(daysInCurMonth);
    }

    var apiUrl = new URL('/api/method/adda_space.api.events.get_adda_events', window.location.origin);
    apiUrl.searchParams.set('start_date', startDateKey);
    apiUrl.searchParams.set('end_date', endDateKey);
    apiUrl.searchParams.set('event_type', 'all');
    apiUrl.searchParams.set('include_pending', '1');
    if (currentCity) {
      apiUrl.searchParams.set('city', currentCity);
    }
    apiUrl.searchParams.set('page_length', '100');

    fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Failed to load month gatherings');
      return res.json();
    })
    .then(function(data) {
      if (calLoading) calLoading.style.display = 'none';
      var payload = data.message || data;
      var events = payload.events || [];

      calEventsByDate = {};
      events.forEach(function(ev) {
        if (ev.start_date_time) {
          var key = String(ev.start_date_time).slice(0, 10);
          if (!calEventsByDate[key]) calEventsByDate[key] = [];
          calEventsByDate[key].push(ev);
        }
      });

      renderCalendarGrid(leadDays, daysInCurMonth, trailDays, prevMonthDays);
      updateDayDrawer(selectedDateStr);
    })
    .catch(function() {
      if (calLoading) calLoading.style.display = 'none';
      renderCalendarGrid(leadDays, daysInCurMonth, trailDays, prevMonthDays);
      updateDayDrawer(selectedDateStr);
    });
  }

  function renderCalendarGrid(leadDays, daysInCurMonth, trailDays, prevMonthDays) {
    if (!calDaysGrid) return;
    calDaysGrid.innerHTML = '';

    var pYear = calMonth === 0 ? calYear - 1 : calYear;
    var pMonth = calMonth === 0 ? 11 : calMonth - 1;
    for (var i = leadDays - 1; i >= 0; i--) {
      var pDay = prevMonthDays - i;
      var pDateKey = pYear + '-' + padZero(pMonth + 1) + '-' + padZero(pDay);
      createCalCell(pDay, pDateKey, true);
    }

    for (var d = 1; d <= daysInCurMonth; d++) {
      var curDateKey = calYear + '-' + padZero(calMonth + 1) + '-' + padZero(d);
      createCalCell(d, curDateKey, false);
    }

    var nYear = calMonth === 11 ? calYear + 1 : calYear;
    var nMonth = calMonth === 11 ? 0 : calMonth + 1;
    for (var t = 1; t <= trailDays; t++) {
      var nDateKey = nYear + '-' + padZero(nMonth + 1) + '-' + padZero(t);
      createCalCell(t, nDateKey, true);
    }
  }

  function createCalCell(dayNum, dateKey, isOtherMonth) {
    var cell = document.createElement('div');
    cell.className = 'adda-cal-cell';
    cell.setAttribute('data-date', dateKey);
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('tabindex', '0');

    if (isOtherMonth) cell.classList.add('is-other-month');
    if (dateKey === istDateStr) cell.classList.add('is-today');
    if (dateKey === selectedDateStr) cell.classList.add('is-selected');

    var dayEvents = calEventsByDate[dateKey] || [];
    cell.setAttribute('aria-label', formatLongDate(dateKey) + ', ' + dayEvents.length + (dayEvents.length === 1 ? ' gathering' : ' gatherings'));

    var topRow = document.createElement('div');
    topRow.className = 'adda-cal-cell-top';

    var numEl = document.createElement('span');
    numEl.className = 'adda-cal-day-num';
    numEl.textContent = dayNum;
    topRow.appendChild(numEl);

    if (dayEvents.length > 0) {
      var countBadge = document.createElement('span');
      countBadge.className = 'adda-cal-badge-count';
      countBadge.textContent = dayEvents.length;
      topRow.appendChild(countBadge);
    }
    cell.appendChild(topRow);

    var mobileIndicators = document.createElement('span');
    mobileIndicators.className = 'adda-cal-mobile-indicators';
    mobileIndicators.setAttribute('aria-hidden', 'true');
    dayEvents.slice(0, 3).forEach(function(ev) {
      var dot = document.createElement('span');
      dot.className = 'adda-cal-mobile-dot ' + getCategoryClass(ev.type);
      mobileIndicators.appendChild(dot);
    });
    if (dayEvents.length > 3) {
      var overflowCount = document.createElement('span');
      overflowCount.className = 'adda-cal-mobile-overflow';
      overflowCount.textContent = '+' + (dayEvents.length - 3);
      mobileIndicators.appendChild(overflowCount);
    }
    cell.appendChild(mobileIndicators);

    var pillsList = document.createElement('div');
    pillsList.className = 'adda-cal-events-list';

    var maxPills = 3;
    var displayEvents = dayEvents.slice(0, maxPills);

    displayEvents.forEach(function(ev) {
      var pill = document.createElement('a');
      var isPending = isPendingEvent(ev);
      var catClass = isPending ? 'cat-pending-event' : getCategoryClass(ev.type);
      pill.className = 'adda-cal-event-pill ' + catClass;
      if (isPending) {
        pill.classList.add('is-pending-event');
        pill.setAttribute('data-status', 'Pending Review');
      }
      pill.setAttribute('data-category', ev.type || 'Adda');
      pill.href = '#';
      pill.title = (ev.title || 'Gathering') + ' (' + (ev.city || '') + ')' + (isPending ? ' - Pending confirmation' : '');
      if (isPastEvent(ev)) {
        pill.classList.add('is-past-event');
        pill.setAttribute('aria-label', (ev.title || 'Gathering') + (ev.recap ? ' — event recap available' : ' — past gathering'));
      }

      var timeSpan = document.createElement('span');
      timeSpan.className = 'adda-cal-event-time';
      timeSpan.textContent = formatEventTimeRange(ev);

      var titleSpan = document.createElement('span');
      titleSpan.className = 'adda-cal-event-title-text';
      titleSpan.textContent = isPending ? ((ev.title || 'Gathering') + ' · Pending') : (ev.title || 'Gathering');

      pill.appendChild(timeSpan);
      pill.appendChild(titleSpan);
      if (isPastEvent(ev) && ev.recap) {
        var recapMark = document.createElement('span');
        recapMark.className = 'adda-cal-recap-mark';
        recapMark.textContent = 'Recap';
        pill.appendChild(recapMark);
      }

      pill.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openEventDetailModal(ev);
      });

      pillsList.appendChild(pill);
    });

    if (dayEvents.length > maxPills) {
      var morePill = document.createElement('div');
      morePill.className = 'adda-cal-more-pill';
      morePill.textContent = '+' + (dayEvents.length - maxPills) + ' more';
      morePill.setAttribute('role', 'button');
      morePill.setAttribute('tabindex', '0');
      morePill.setAttribute('aria-label', '+' + (dayEvents.length - maxPills) + ' more gatherings on ' + formatLongDate(dateKey));
      morePill.addEventListener('click', function(e) {
        e.stopPropagation();
        selectCalendarDay(dateKey);
        openDayEventsPopup(dateKey);
      });
      morePill.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          selectCalendarDay(dateKey);
          openDayEventsPopup(dateKey);
        }
      });
      pillsList.appendChild(morePill);
    }

    cell.appendChild(pillsList);

    // Free date click handler -> Opens Host Modal with date pre-selected
    cell.addEventListener('click', function(e) {
      if (e.target.closest('.adda-cal-event-pill') || e.target.closest('.adda-cal-more-pill')) {
        return;
      }
      selectCalendarDay(dateKey);
      if (dateKey >= istDateStr) {
        openHostModal(dateKey);
      } else {
        if (window.matchMedia('(max-width: 640px)').matches) {
          openMobileDayDrawer();
        }
        showToast('This date is in the past. To host an Adda, please select an upcoming date.');
      }
    });

    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCalendarDay(dateKey);
        if (dateKey >= istDateStr) {
          openHostModal(dateKey);
        } else {
          if (window.matchMedia('(max-width: 640px)').matches) {
            openMobileDayDrawer();
          }
          showToast('This date is in the past. To host an Adda, please select an upcoming date.');
        }
      }
    });

    calDaysGrid.appendChild(cell);
  }

  function selectCalendarDay(dateKey) {
    selectedDateStr = dateKey;
    var cells = calDaysGrid.querySelectorAll('.adda-cal-cell');
    cells.forEach(function(c) {
      if (c.getAttribute('data-date') === dateKey) c.classList.add('is-selected');
      else c.classList.remove('is-selected');
    });
    updateDayDrawer(dateKey);
  }

  function openDayDrawer(scroll) {
    if (!calDayDrawer) return;
    calDayDrawer.style.display = 'block';
    calDayDrawer.classList.remove('is-open');
    window.requestAnimationFrame(function() {
      calDayDrawer.classList.add('is-open');
      if (scroll) {
        calDayDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function openMobileDayDrawer() {
    openDayDrawer(true);
  }

  function updateDayDrawer(dateKey) {
    if (!calDayDrawer) return;
    calDayDrawer.style.display = 'block';
    calDayDrawer.classList.remove('is-open');

    if (calDrawerTitle) calDrawerTitle.textContent = formatLongDate(dateKey);
    if (calDrawerSubtitle) {
      var cityContext = currentCity ? (' in ' + currentCity) : ' across all Adda locations';
      calDrawerSubtitle.textContent = 'Scheduled gatherings' + cityContext;
    }

    var dayEvents = calEventsByDate[dateKey] || [];
    if (calDrawerCount) {
      calDrawerCount.textContent = dayEvents.length + (dayEvents.length === 1 ? ' Gathering' : ' Gatherings');
    }

    if (calDrawerCards) calDrawerCards.innerHTML = '';

    if (dayEvents.length === 0) {
      if (calDrawerEmpty) calDrawerEmpty.style.display = 'block';
      if (calDrawerCards) calDrawerCards.style.display = 'none';
    } else {
      if (calDrawerEmpty) calDrawerEmpty.style.display = 'none';
      if (calDrawerCards) {
        calDrawerCards.style.display = 'grid';
        dayEvents.forEach(function(ev) {
          var safeTitle = escapeHtml(ev.title || 'Untitled Gathering');
          var timeStr = formatEventTimeRange(ev);
          var roomText = ev.room_name ? ' &bull; ' + escapeHtml(ev.room_name) : '';
          var venueText = ev.venue_details ? ' &bull; ' + escapeHtml(ev.venue_details) : '';
          var cityText = escapeHtml(ev.city || 'Neighbourhood');
          var isPending = isPendingEvent(ev);
          var catClass = isPending ? 'cat-pending-event' : getCategoryClass(ev.type);

          var isPast = isPastEvent(ev);
          var card = document.createElement('div');
          card.className = 'adda-cal-drawer-card' + (isPast ? ' is-past-event' : '');
          card.style.cursor = 'pointer';
          card.innerHTML = [
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">',
            '  <span class="adda-cat-badge ' + catClass + '">' + escapeHtml(isPending ? 'Pending Review' : getCategoryLabel(ev.type)) + '</span>',
            '  <span style="font-size: 0.75rem; font-weight: 700; color: var(--adda-green);">' + timeStr + '</span>',
            '</div>',
            '<h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--adda-navy);">' + (isPending ? (safeTitle + ' · Pending') : safeTitle) + '</h4>',
            '  ' + recapStateHtml(ev),
            '<div style="font-size: 0.8125rem; color: var(--adda-text-muted); margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">',
            '  <span>' + cityText + roomText + venueText + '</span>',
            '</div>'
          ].join('\n');

          card.addEventListener('click', function(e) {
            e.preventDefault();
            openEventDetailModal(ev);
          });

          calDrawerCards.appendChild(card);
        });
      }
    }

    var calDrawerFooter = document.getElementById('cal-drawer-footer');
    if (calDrawerFooter) {
      if (dateKey >= istDateStr && dayEvents.length > 0) {
        calDrawerFooter.style.display = 'flex';
      } else {
        calDrawerFooter.style.display = 'none';
      }
    }
  }

  // ========================================================================
  // LIST VIEW LOGIC
  // ========================================================================

  function setListUIState(state, message) {
    if (loadingState) loadingState.style.display = (state === 'loading') ? 'grid' : 'none';
    if (gridContainer) gridContainer.style.display = (state === 'results') ? 'block' : 'none';
    if (emptyState) emptyState.style.display = (state === 'empty') ? 'block' : 'none';
    if (errorState) errorState.style.display = (state === 'error') ? 'block' : 'none';
    if (statusBar) statusBar.style.display = 'none';

    if (state === 'error' && message && errorMessage) {
      errorMessage.textContent = message;
    }
  }

  function renderListCard(event) {
    var eventIdentifier = event.unique_id || event.name;
    var safeTitle = escapeHtml(event.title || 'Untitled Gathering');
    var safeCity = escapeHtml(event.city || 'Neighbourhood');
    var plainDesc = stripHtml(event.description || '');
    var safeDesc = escapeHtml(plainDesc);
    var isPending = isPendingEvent(event);
    var catClass = isPending ? 'cat-pending-event is-pending-card' : getCategoryClass(event.type, event.title);
    var isPast = isPastEvent(event);
    var pastClass = isPast ? ' is-past-event' : '';
    var timeText = formatEventTime(event.start_date_time);

    var mediaHtml = '';
    var cardImg = event.cover_image || event.image || '';
    if (cardImg && typeof cardImg === 'string' && cardImg.trim()) {
      var cImgStr = cardImg.trim();
      var cLower = cImgStr.toLowerCase();
      if (cLower !== 'none' && cLower !== 'null' && cLower !== 'undefined') {
        if (cImgStr.startsWith('/private/files/')) {
          cImgStr = cImgStr.replace('/private/files/', '/files/');
        }
        mediaHtml = '  <div class="adda-list-card-poster" aria-hidden="true">' +
          '<img src="' + escapeHtml(cImgStr) + '" alt="' + safeTitle + '" class="adda-card-img" loading="lazy" onerror="var p=this.closest(\'.adda-list-card-poster\');if(p)p.style.display=\'none\';" />' +
          '</div>';
      }
    }

    return [
      '<article class="adda-list-card ' + catClass + pastClass + '" data-event-id="' + escapeHtml(eventIdentifier) + '" tabindex="0" role="button" aria-label="View details for ' + safeTitle + '">',
      '  <span class="adda-list-card-time">' + timeText + '</span>',
      mediaHtml,
      '  <div class="adda-list-card-content">',
      '    <h3 class="adda-list-card-title">' + (isPending ? (safeTitle + ' · Pending') : safeTitle) + '</h3>',
      '    <div class="adda-list-card-meta"><span>' + safeCity + '</span>' + (isPending ? ' · Pending Review' : '') + recapStateHtml(event) + '</div>',
      (safeDesc ? '    <p class="adda-list-card-description">' + safeDesc + '</p>' : ''),
      '  </div>',
      '  <div class="adda-list-card-action">',
      '    <span class="adda-list-card-chevron">View &rsaquo;</span>',
      '  </div>',
      '</article>'
    ].filter(Boolean).join('\n');
  }

  function getListDateKey(event) {
    var dateValue = String(event.start_date_time || '').trim().replace('T', ' ');
    return dateValue.slice(0, 10) || 'date-tbd';
  }

  function formatListDateHeading(dateKey) {
    if (!dateKey || dateKey === 'date-tbd') return 'DATE TO BE ANNOUNCED';
    if (dateKey === istDateStr) return 'TODAY';
    var tomorrow = new Date(istDateStr + 'T12:00:00+05:30');
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowKey = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (dateKey === tomorrowKey) return 'TOMORROW';
    var dateObj = new Date(dateKey + 'T12:00:00+05:30');
    if (isNaN(dateObj.getTime())) return escapeHtml(dateKey);
    var dateOptions = { timeZone: 'Asia/Kolkata' };
    var weekday = dateObj.toLocaleDateString('en-IN', Object.assign({ weekday: 'short' }, dateOptions));
    var month = dateObj.toLocaleDateString('en-IN', Object.assign({ month: 'short' }, dateOptions));
    var day = dateObj.toLocaleDateString('en-IN', Object.assign({ day: 'numeric' }, dateOptions));
    return (weekday + ' · ' + month + ' ' + day).toUpperCase();
  }

  function renderListDateGroups(events) {
    var groups = [];
    events.forEach(function(event) {
      var key = getListDateKey(event);
      var group = groups.find(function(item) { return item.key === key; });
      if (!group) {
        group = { key: key, events: [] };
        groups.push(group);
      }
      group.events.push(event);
    });

    return groups.map(function(group) {
      var eventWord = group.events.length === 1 ? 'event' : 'events';
      return [
        '<section class="adda-list-day-group" data-date="' + escapeHtml(group.key) + '" aria-label="' + formatListDateHeading(group.key) + '">',
        '  <header class="adda-list-day-heading"><h2>' + formatListDateHeading(group.key) + '</h2><span>' + group.events.length + ' ' + eventWord + '</span></header>',
        '  <div class="adda-list-day-cards">' + group.events.map(renderListCard).join('') + '</div>',
        '</section>'
      ].join('');
    }).join('');
  }

  function isCurrentListMonth() {
    return calYear === todayYear && calMonth === todayMonth;
  }

  function scrollListToDate(dateKey) {
    if (!gridContainer || !dateKey) return;
    var heading = gridContainer.querySelector('[data-date="' + dateKey + '"] .adda-list-day-heading');
    if (!heading) return;
    // Wait until the visible list has completed layout before measuring the heading.
    window.requestAnimationFrame(function() {
      window.requestAnimationFrame(function() {
        var headingTop = heading.getBoundingClientRect().top;
        var stickyBottom = 0;
        document.querySelectorAll('header, #cal-toolbar').forEach(function(el) {
          var style = window.getComputedStyle(el);
          if (style.position !== 'sticky' && style.position !== 'fixed') return;
          var rect = el.getBoundingClientRect();
          if (rect.height && rect.top <= 1 && rect.bottom > stickyBottom) stickyBottom = rect.bottom;
        });
        window.scrollTo({ top: window.pageYOffset + headingTop - stickyBottom - 12, behavior: 'smooth' });
      });
    });
  }

  var showPastEvents = false;

  function fetchListEvents() {
    setListUIState('loading');

    var apiUrl = new URL('/api/method/adda_space.api.events.get_adda_events', window.location.origin);
    var monthStart = calYear + '-' + padZero(calMonth + 1) + '-01';
    var monthEnd = calYear + '-' + padZero(calMonth + 1) + '-' + padZero(getDaysInMonth(calYear, calMonth));
    apiUrl.searchParams.set('start_date', monthStart);
    apiUrl.searchParams.set('end_date', monthEnd);
    apiUrl.searchParams.set('event_type', 'all');
    apiUrl.searchParams.set('include_pending', '1');
    if (currentCity) {
      apiUrl.searchParams.set('city', currentCity);
    }
    apiUrl.searchParams.set('start', '0');
    apiUrl.searchParams.set('page_length', '100');

    fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Server returned status ' + res.status);
      return res.json();
    })
    .then(function(data) {
      var payload = data.message || data;
      var events = payload.events || [];
      var pastEvents = [];
      var visibleEvents = events;
      if (isCurrentListMonth()) {
        pastEvents = events.filter(function(ev) { return getListDateKey(ev) < istDateStr; });
        visibleEvents = events.filter(function(ev) { return getListDateKey(ev) >= istDateStr; });
      }
      if (events.length === 0) {
        var cityContext = currentCity ? (' in ' + currentCity) : '';
        emptyStateTitle.textContent = 'No gatherings' + cityContext;
        emptyStateDesc.textContent = 'There are currently no Adda gatherings scheduled' + (currentCity ? (' for ' + currentCity) : '') + '. Explore another city or propose a community gathering.';
        setListUIState('empty');
      } else {
        gridContainer.innerHTML = renderListDateGroups(visibleEvents);
        if (isCurrentListMonth() && visibleEvents.length === 0 && pastEvents.length) {
          gridContainer.insertAdjacentHTML('afterbegin', '<p class="adda-list-upcoming-empty">No upcoming gatherings this month.</p>');
        }
        if (pastEvents.length) {
          pastEvents.sort(function(a, b) {
            return String(a.start_date_time || '').localeCompare(String(b.start_date_time || ''));
          });
          var monthLabel = monthNames[calMonth];
          var pastEventCount = pastEvents.length;
          var pastCountText = pastEventCount + ' ' + (pastEventCount === 1 ? 'event' : 'events') + ' in ' + monthLabel;
          var pastSection = document.createElement('section');
          pastSection.className = 'adda-list-past-events' + (showPastEvents ? ' is-expanded' : '');
          pastSection.innerHTML = '<button type="button" class="adda-list-past-toggle" aria-expanded="' + (showPastEvents ? 'true' : 'false') + '" aria-controls="adda-list-past-content"><span class="adda-list-past-toggle-copy"><span class="adda-list-past-title">' + (showPastEvents ? 'Past events · ' + monthLabel : 'Explore past events') + '</span><span class="adda-list-past-summary">' + pastCountText + '</span></span><span class="adda-list-past-arrow" aria-hidden="true"></span></button><div class="adda-list-past-content" id="adda-list-past-content"><div class="adda-list-past-content-inner">' + renderListDateGroups(pastEvents) + '</div></div>';
          gridContainer.insertBefore(pastSection, gridContainer.firstChild);
          var pastContent = pastSection.querySelector('.adda-list-past-content');
          if (showPastEvents) pastContent.style.maxHeight = pastContent.scrollHeight + 'px';
          pastSection.querySelector('.adda-list-past-toggle').addEventListener('click', function() {
            showPastEvents = !showPastEvents;
            pastSection.classList.toggle('is-expanded', showPastEvents);
            this.setAttribute('aria-expanded', showPastEvents ? 'true' : 'false');
            pastSection.querySelector('.adda-list-past-title').textContent = showPastEvents ? 'Past events · ' + monthLabel : 'Explore past events';
            if (showPastEvents) {
              pastContent.style.maxHeight = pastContent.scrollHeight + 'px';
            } else {
              pastContent.style.maxHeight = pastContent.scrollHeight + 'px';
              window.requestAnimationFrame(function() { pastContent.style.maxHeight = '0px'; });
            }
          });
          pastContent.addEventListener('transitionend', function(event) {
            if (event.propertyName === 'max-height' && showPastEvents) pastContent.style.maxHeight = 'none';
          });
        }

        // Attach modal trigger to list cards
        gridContainer.querySelectorAll('.adda-list-card').forEach(function(cardEl) {
          var eventId = cardEl.getAttribute('data-event-id');
          var ev = events.find(function(e) { return (e.unique_id || e.name) === eventId; });
          cardEl.addEventListener('click', function(e) {
            e.preventDefault();
            if (ev) openEventDetailModal(ev);
          });
          cardEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (ev) openEventDetailModal(ev);
            }
          });
        });

        var cityLabel = currentCity || 'all cities';
        countLabel.textContent = 'Showing ' + visibleEvents.length + ' gathering' + (visibleEvents.length === 1 ? '' : 's') + ' across ' + cityLabel + '.';
        setListUIState('results');
        var targetDate = isCurrentListMonth() ? istDateStr : (calYear > todayYear || (calYear === todayYear && calMonth > todayMonth) ? monthStart : selectedDateStr);
        scrollListToDate(targetDate);
      }
    })
    .catch(function(err) {
      setListUIState('error', err.message || 'Unable to connect to Adda Space events service.');
    });
  }

  // ========================================================================
  // VIEW SWITCHING & FILTERS
  // ========================================================================

  function renderCityFilterButtons(cities) {
    if (!Array.isArray(cities)) return;

    if (cityFilterSelect) {
      cityFilterSelect.innerHTML = '<option value="" data-city="">All cities</option>';
      cities.forEach(function(cityName) {
        var opt = document.createElement('option');
        opt.value = cityName;
        opt.setAttribute('data-city', cityName);
        opt.textContent = cityName;
        if (currentCity && currentCity.toLowerCase() === cityName.toLowerCase()) {
          opt.selected = true;
        }
        cityFilterSelect.appendChild(opt);
      });
    }

    updateFilterUI();
  }

  function updateFilterUI() {
    if (cityFilterSelect) {
      cityFilterSelect.value = currentCity || '';
    }

    if (viewCalendarBtn && viewListBtn) {
      var calendarNavGroup = document.querySelector('#cal-toolbar .adda-cal-nav-group');
      if (calendarNavGroup) calendarNavGroup.style.display = 'flex';
      if (calTodayBtn) calTodayBtn.style.display = '';
      if (currentView === 'calendar') {
        viewCalendarBtn.classList.add('active');
        viewCalendarBtn.setAttribute('aria-pressed', 'true');
        viewListBtn.classList.remove('active');
        viewListBtn.setAttribute('aria-pressed', 'false');
        if (calendarSection) calendarSection.style.display = 'block';
        if (listSection) listSection.style.display = 'none';
      } else {
        viewListBtn.classList.add('active');
        viewListBtn.setAttribute('aria-pressed', 'true');
        viewCalendarBtn.classList.remove('active');
        viewCalendarBtn.setAttribute('aria-pressed', 'false');
        if (calendarSection) calendarSection.style.display = 'none';
        if (listSection) listSection.style.display = 'block';
      }
    }

  }

  function syncUrlParams() {
    var url = new URL(window.location.href);
    if (currentCity) url.searchParams.set('city', currentCity);
    else url.searchParams.delete('city');

    if (currentView) url.searchParams.set('view', currentView);

    url.searchParams.delete('scope');

    window.history.replaceState({}, '', url.toString());
  }

  function switchView(viewName) {
    if (currentView === viewName) return;
    currentView = viewName;
    updateFilterUI();
    syncUrlParams();

    if (currentView === 'calendar') {
      fetchCalendarEvents();
    } else {
      fetchListEvents();
    }
  }

  if (viewCalendarBtn) viewCalendarBtn.addEventListener('click', function() { switchView('calendar'); });
  if (viewListBtn) viewListBtn.addEventListener('click', function() { switchView('list'); });

  if (calPrevBtn) {
    calPrevBtn.addEventListener('click', function() {
      if (calMonth === 0) { calMonth = 11; calYear--; }
      else { calMonth--; }
      updateCalHeader();
      if (currentView === 'calendar') fetchCalendarEvents();
      else fetchListEvents();
    });
  }

  if (calNextBtn) {
    calNextBtn.addEventListener('click', function() {
      if (calMonth === 11) { calMonth = 0; calYear++; }
      else { calMonth++; }
      updateCalHeader();
      if (currentView === 'calendar') fetchCalendarEvents();
      else fetchListEvents();
    });
  }

  if (calTodayBtn) {
    calTodayBtn.addEventListener('click', function() {
      calYear = todayYear;
      calMonth = todayMonth;
      selectedDateStr = istDateStr;
      showPastEvents = false;
      updateCalHeader();
      if (currentView === 'calendar') fetchCalendarEvents();
      else fetchListEvents();
    });
  }

  if (cityFilterSelect) {
    cityFilterSelect.addEventListener('change', function() {
      currentCity = this.value;
      updateFilterUI();
      syncUrlParams();
      if (currentView === 'calendar') fetchCalendarEvents();
      else fetchListEvents();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      currentCity = '';
      updateFilterUI();
      syncUrlParams();
      fetchListEvents();
    });
  }

  if (retryBtn) retryBtn.addEventListener('click', fetchListEvents);

  // Coordinator Section Dynamic Loading
  function loadCoordinatorSection(cities) {
    if (!coordGrid) return;
    var subEl = document.getElementById('adda-coord-subtitle');
    if (subEl && cities && cities.length) {
      subEl.textContent = 'Use Adda space in ' + cities.join(' or ') + ' \u2014 talk to a coordinator';
    }

    coordGrid.innerHTML = '';
    if (!cities || !cities.length) {
      coordGrid.innerHTML = '<div style="color: #6B7280; font-size: 0.875rem; padding: 1rem;">No cities available.</div>';
      return;
    }

    cities.forEach(function(cityName) {
      var card = document.createElement('div');
      card.className = 'adda-coord-card';
      card.innerHTML = '<span class="adda-coord-city-tag">' + escapeHtml(cityName.toUpperCase()) + '</span>' +
        '<div class="adda-coord-loading" style="padding: 0.5rem 0; font-size: 0.8125rem; color: #6B7280;">Loading...</div>';
      coordGrid.appendChild(card);

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
          var waUrl = generateWhatsAppUrl(coord.coordinator_name || 'Coordinator', cityName, coord.whatsapp_number, selectedDateStr || null);

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
    if (!coordGrid || !coordToggleBtn) return;
    if (coordGrid.style.display === 'none') {
      coordGrid.style.display = 'grid';
      coordToggleBtn.innerHTML = '&minus;';
      coordToggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      coordGrid.style.display = 'none';
      coordToggleBtn.innerHTML = '+';
      coordToggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  if (coordToggleBtn) {
    coordToggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleCoordSection();
    });
  }

  if (coordHeader) {
    coordHeader.addEventListener('click', toggleCoordSection);
  }

  // Keyboard accessibility: ESC key closes modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (posterLightboxOverlay && posterLightboxOverlay.classList.contains('is-open')) {
        posterLightboxOverlay.classList.remove('is-open');
        posterLightboxOverlay.style.display = 'none';
      } else if (dayEventsBackdrop && dayEventsBackdrop.classList.contains('is-open')) {
        closeDayEventsPopup();
      } else if (regModalBackdrop && regModalBackdrop.classList.contains('is-open')) {
        closeEventRegistrationModal();
      } else if (detailModalBackdrop && detailModalBackdrop.classList.contains('is-open')) {
        closeEventDetailModal();
      } else if (hostModalBackdrop && hostModalBackdrop.classList.contains('is-open')) {
        closeHostModal();
      }
    }
  });

  function normalizeDateStr(dStr) {
    if (!dStr) return '';
    var s = String(dStr).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      var p = s.split('-');
      return p[2] + '-' + p[1] + '-' + p[0];
    }
    return s.slice(0, 10);
  }

  // URL State Initialization
  var urlParams = new URLSearchParams(window.location.search);
  var initialEventId = urlParams.get('event_id');
  var initialCity = urlParams.get('city');
  if (initialCity && initialCity.trim()) currentCity = initialCity.trim();

  var initialView = urlParams.get('view');
  if (initialView && (initialView === 'list' || initialView === 'calendar')) currentView = initialView;

  var initialDate = urlParams.get('date');
  if (initialDate && (/^\d{4}-\d{2}-\d{2}$/.test(initialDate.trim()) || /^\d{2}-\d{2}-\d{4}$/.test(initialDate.trim()))) {
    initialDate = normalizeDateStr(initialDate.trim());
    selectedDateStr = initialDate;
    var dParts = initialDate.split('-').map(Number);
    if (dParts.length === 3 && !isNaN(dParts[0]) && !isNaN(dParts[1])) {
      calYear = dParts[0];
      calMonth = dParts[1] - 1;
      updateCalHeader();
    }
  } else {
    initialDate = null;
  }

  var shouldOpenHost = urlParams.get('open_host') === '1' || urlParams.get('action') === 'host';

  if (initialEventId) {
    var eventDetailUrl = new URL('/api/method/adda_space.api.events.get_adda_event_detail', window.location.origin);
    eventDetailUrl.searchParams.set('event_id', initialEventId);
    fetch(eventDetailUrl.toString(), { headers: { 'Accept': 'application/json' } })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var payload = data.message || data;
        if (payload.success && payload.event) openEventDetailModal(payload.event);
      })
      .catch(function() {});
  }

  // Pre-fetch supported cities
  fetch('/api/method/adda_space.api.events.get_supported_cities')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var cities = (data && data.message && Array.isArray(data.message.cities)) ? data.message.cities : ['Bengaluru', 'Mysuru'];
      if (cities.length > 0) renderCityFilterButtons(cities);
      loadCoordinatorSection(cities);

      // Populate the Host Modal City Select without inheriting the calendar filter.
      if (modalCitySelect) {
        modalCitySelect.innerHTML = '';
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a city';
        placeholder.disabled = true;
        placeholder.selected = true;
        modalCitySelect.appendChild(placeholder);
        cities.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          modalCitySelect.appendChild(opt);
        });
        modalCitySelect.value = '';
      }

      // Opening /events loads the calendar normally — NO modal automatically opened.
      // Only open if URL specifically requests it (open_host=1) or returning from login to submit draft.
      var hasDraft = restoreHostDraft();
      var hasAutoOpenedHost = false;
      try {
        hasAutoOpenedHost = Boolean(sessionStorage.getItem('adda_host_modal_auto_opened'));
      } catch(e) {}

      if (shouldOpenHost || hasDraft) {
        try {
          sessionStorage.setItem('adda_host_modal_auto_opened', '1');
        } catch(e) {}
        if (hostModalBackdrop) {
          var resumeDate = hasDraft
            ? (modalEventDate ? modalEventDate.value : null)
            : initialDate;
          openHostModal(resumeDate, hasDraft);
        }
      }
    })
    .catch(function() {
      if (modalCitySelect && !modalCitySelect.options.length) {
        modalCitySelect.innerHTML = '<option value="" selected disabled>Select a city</option><option value="Bengaluru">Bengaluru</option><option value="Mysuru">Mysuru</option>';
        modalCitySelect.value = '';
      }
    });

  // Initial render
  updateFilterUI();
  if (currentView === 'calendar') {
    fetchCalendarEvents();
  } else {
    fetchListEvents();
  }

})();
