import {
  getCsrfToken,
  escapeHtml,
  stripHtml,
  isPendingEvent,
  isPastEvent,
  recapStateHtml,
  padZero,
  getCategoryClass,
  getCategoryLabel,
  formatShortDate,
  formatShortDateTimeRange,
  formatEventTime,
  formatEventTimeRange,
  formatLongDate,
  formatDayPopupDate
} from './events-utils.js?v=2.0.3';
import { createModalController } from './events-modal.js?v=2.0.3';
import { createHostController } from './events-host.js?v=2.0.3';
import { createCalendarListController } from './events-calendar-list.js?v=2.0.3';

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


  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var calendarState = {
    currentCity: '',
    currentView: 'calendar',
    calYear: todayYear,
    calMonth: todayMonth,
    selectedDateStr: istDateStr,
    calEventsByDate: {},
    todayYear: todayYear,
    todayMonth: todayMonth,
    todayDay: todayDay,
    istDateStr: istDateStr,
    showPastEvents: false,
    monthNames: monthNames
  };

  // Set min date to today in IST
  if (modalEventDate) {
    modalEventDate.min = istDateStr;
    if (!modalEventDate.value) modalEventDate.value = istDateStr;
  }

  function normalizeDateStr(dStr) {
    if (!dStr) return '';
    var s = String(dStr).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      var p = s.split('-');
      return p[2] + '-' + p[1] + '-' + p[0];
    }
    return s.slice(0, 10);
  }

  var calendarListController;
  var hostController = createHostController({
    calendarState: calendarState,
    calendarListController: { fetchCalendarEvents: function() { if (calendarListController) calendarListController.fetchCalendarEvents(); } },
    dom: {
      openHostModalBtn: openHostModalBtn,
      hostModalBackdrop: hostModalBackdrop,
      hostModalCloseBtn: hostModalCloseBtn,
      modalCitySelect: modalCitySelect,
      modalStep1Error: modalStep1Error,
      modalEventDate: modalEventDate,
      modalStartTime: modalStartTime,
      modalEndTime: modalEndTime,
      modalDurationDisplay: modalDurationDisplay,
      modalRoomsLoading: modalRoomsLoading,
      modalRoomsGrid: modalRoomsGrid,
      modalSelectedRoom: modalSelectedRoom,
      modalAvailBanner: modalAvailBanner,
      modalAvailMessage: modalAvailMessage,
      modalTitleInput: modalTitleInput,
      modalDescInput: modalDescInput,
      modalPeopleInput: modalPeopleInput,
      modalCapacityHint: modalCapacityHint,
      modalModeSelect: modalModeSelect,
      modalPosterFile: modalPosterFile,
      modalPosterTabUpload: modalPosterTabUpload,
      modalPosterTabUrl: modalPosterTabUrl,
      modalPosterUploadPanel: modalPosterUploadPanel,
      modalPosterUrlPanel: modalPosterUrlPanel,
      modalPosterUrlInput: modalPosterUrlInput,
      modalPosterPreviewBox: modalPosterPreviewBox,
      modalHostPosterImg: modalHostPosterImg,
      modalPosterFilename: modalPosterFilename,
      modalPosterFilesize: modalPosterFilesize,
      modalPosterReplaceBtn: modalPosterReplaceBtn,
      modalStep3Error: modalStep3Error,
      modalStep3ErrorText: modalStep3ErrorText,
      mrevTitle: mrevTitle,
      mrevCity: mrevCity,
      mrevRoom: mrevRoom,
      mrevDatetime: mrevDatetime,
      mrevPeople: mrevPeople,
      modalAuthGuestCallout: modalAuthGuestCallout,
      modalAuthLoggedInCallout: modalAuthLoggedInCallout,
      modalLoggedInUserDisplay: modalLoggedInUserDisplay,
      modalSaveAndLoginBtn: modalSaveAndLoginBtn,
      modalSubmitErrorBox: modalSubmitErrorBox,
      modalSubmitErrorText: modalSubmitErrorText,
      modalConfRefName: modalConfRefName,
      modalConfCloseBtn: modalConfCloseBtn,
      modalStepBackBtn: modalStepBackBtn,
      modalStepNextBtn: modalStepNextBtn,
      modalStepSubmitBtn: modalStepSubmitBtn,
      coordSection: coordSection,
      coordToggleBtn: coordToggleBtn,
      coordHeader: coordHeader,
      coordGrid: coordGrid,
      calDrawerHostBtn: calDrawerHostBtn,
      calDrawerHostActiveBtn: calDrawerHostActiveBtn,
      emptyHostBtn: emptyHostBtn,
    }
  });
  var eventModalController = createModalController({ calendarState: calendarState, dom: {
      dayEventsBackdrop: dayEventsBackdrop,
      dayEventsTitle: dayEventsTitle,
      dayEventsCount: dayEventsCount,
      dayEventsList: dayEventsList,
      dayEventsCloseBtn: dayEventsCloseBtn,
      detailModalBackdrop: detailModalBackdrop,
      modalEventTitle: modalEventTitle,
      modalEventBadge: modalEventBadge,
      modalEventCity: modalEventCity,
      modalEventTime: modalEventTime,
      modalEventVenue: modalEventVenue,
      modalEventMode: modalEventMode,
      modalEventDesc: modalEventDesc,
      modalEventRecap: modalEventRecap,
      modalRecapTitle: modalRecapTitle,
      modalRecapSummary: modalRecapSummary,
      modalRecapOutcomes: modalRecapOutcomes,
      modalRecapMeta: modalRecapMeta,
      modalRecapGallery: modalRecapGallery,
      recapGalleryLightbox: recapGalleryLightbox,
      recapGalleryLightboxImage: recapGalleryLightboxImage,
      recapGalleryLightboxCaption: recapGalleryLightboxCaption,
      recapGalleryLightboxCount: recapGalleryLightboxCount,
      recapGalleryLightboxClose: recapGalleryLightboxClose,
      recapGalleryLightboxPrev: recapGalleryLightboxPrev,
      recapGalleryLightboxNext: recapGalleryLightboxNext,
      modalPosterWrap: modalPosterWrap,
      modalPosterImg: modalPosterImg,
      modalDetailCloseBtn: modalDetailCloseBtn,
      modalDetailActionClose: modalDetailActionClose,
      modalShareBtn: modalShareBtn,
      modalRegisterBtn: modalRegisterBtn,
      regModalBackdrop: regModalBackdrop,
      modalRegCloseBtn: modalRegCloseBtn,
      modalRegEventTitle: modalRegEventTitle,
      modalRegEventTime: modalRegEventTime,
      modalRegEventVenue: modalRegEventVenue,
      modalRegFormView: modalRegFormView,
      modalEventRegForm: modalEventRegForm,
      modalRegNameInput: modalRegNameInput,
      modalRegMobileInput: modalRegMobileInput,
      modalRegSubmitBtn: modalRegSubmitBtn,
      modalRegMobileError: modalRegMobileError,
      modalRegErrorBox: modalRegErrorBox,
      modalRegErrorText: modalRegErrorText,
      modalRegSuccessView: modalRegSuccessView,
      modalRegSuccessId: modalRegSuccessId,
      modalRegSuccessCloseBtn: modalRegSuccessCloseBtn,
      modalRegDuplicateView: modalRegDuplicateView,
      modalRegDuplicateId: modalRegDuplicateId,
      modalRegDuplicateCloseBtn: modalRegDuplicateCloseBtn,
      modalRegPastView: modalRegPastView,
      modalRegPastCloseBtn: modalRegPastCloseBtn,
      posterLightboxOverlay: posterLightboxOverlay,
      lightboxEnlargedImg: lightboxEnlargedImg,
      shareToast: shareToast,
  } });

  // URL State Initialization
  var urlParams = new URLSearchParams(window.location.search);
  var initialEventId = urlParams.get('event_id');
  var initialCity = urlParams.get('city');
  if (initialCity && initialCity.trim()) calendarState.currentCity = initialCity.trim();

  var initialView = urlParams.get('view');
  if (initialView && (initialView === 'list' || initialView === 'calendar')) calendarState.currentView = initialView;

  var initialDate = urlParams.get('date');
  if (initialDate && (/^\d{4}-\d{2}-\d{2}$/.test(initialDate.trim()) || /^\d{2}-\d{2}-\d{4}$/.test(initialDate.trim()))) {
    initialDate = normalizeDateStr(initialDate.trim());
    calendarState.selectedDateStr = initialDate;
    var dParts = initialDate.split('-').map(Number);
    if (dParts.length === 3 && !isNaN(dParts[0]) && !isNaN(dParts[1])) {
      calendarState.calYear = dParts[0];
      calendarState.calMonth = dParts[1] - 1;
      calMonthTitle.textContent = calendarState.monthNames[calendarState.calMonth];
      calYearBadge.textContent = calendarState.calYear;
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
        if (payload.success && payload.event) eventModalController.openEventDetailModal(payload.event);
      })
      .catch(function() {});
  }

  calendarListController = createCalendarListController({
    state: calendarState,
    dom: {
    viewCalendarBtn: viewCalendarBtn,
    viewListBtn: viewListBtn,
    calendarSection: calendarSection,
    listSection: listSection,
    calMonthTitle: calMonthTitle,
    calYearBadge: calYearBadge,
    calPrevBtn: calPrevBtn,
    calNextBtn: calNextBtn,
    calTodayBtn: calTodayBtn,
    calDaysGrid: calDaysGrid,
    calLoading: calLoading,
    calDayDrawer: calDayDrawer,
    calDrawerTitle: calDrawerTitle,
    calDrawerSubtitle: calDrawerSubtitle,
    calDrawerCount: calDrawerCount,
    calDrawerCards: calDrawerCards,
    calDrawerEmpty: calDrawerEmpty,
    calDrawerHostBtn: calDrawerHostBtn,
    calDrawerHostActiveBtn: calDrawerHostActiveBtn,
    loadingState: loadingState,
    gridContainer: gridContainer,
    emptyState: emptyState,
    emptyStateTitle: emptyStateTitle,
    emptyStateDesc: emptyStateDesc,
    errorState: errorState,
    errorMessage: errorMessage,
    statusBar: statusBar,
    countLabel: countLabel,
    resetBtn: resetBtn,
    retryBtn: retryBtn,
    emptyHostBtn: emptyHostBtn,
    cityFilterSelect: cityFilterSelect,
    },
    openEventDetailModal: eventModalController.openEventDetailModal,
    openHostModal: hostController.openHostModal,
    openDayEventsPopup: eventModalController.openDayEventsPopup,
    showToast: eventModalController.showToast
  });

  calendarListController.updateFilterUI();
  if (calendarState.currentView === 'calendar') {
    calendarListController.fetchCalendarEvents();
  } else {
    calendarListController.fetchListEvents();
  }

  // Keyboard accessibility: ESC key closes modals
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    if (posterLightboxOverlay && posterLightboxOverlay.classList.contains('is-open')) {
      posterLightboxOverlay.classList.remove('is-open');
      posterLightboxOverlay.style.display = 'none';
    } else if (dayEventsBackdrop && dayEventsBackdrop.classList.contains('is-open')) {
      eventModalController.closeDayEventsPopup();
    } else if (regModalBackdrop && regModalBackdrop.classList.contains('is-open')) {
      eventModalController.closeEventRegistrationModal();
    } else if (detailModalBackdrop && detailModalBackdrop.classList.contains('is-open')) {
      eventModalController.closeEventDetailModal();
    } else if (hostModalBackdrop && hostModalBackdrop.classList.contains('is-open')) {
      hostController.closeHostModal();
    }
  });

  // Pre-fetch supported cities
  fetch('/api/method/adda_space.api.events.get_supported_cities')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var cities = (data && data.message && Array.isArray(data.message.cities)) ? data.message.cities : ['Bengaluru', 'Mysuru'];
      if (cities.length > 0) calendarListController.renderCityFilterButtons(cities);
      hostController.loadCoordinatorSection(cities);

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
      var hasDraft = hostController.restoreHostDraft();
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
          hostController.openHostModal(resumeDate, hasDraft);
        }
      }
    })
    .catch(function() {
      var fallbackCities = ['Bengaluru', 'Mysuru'];
      calendarListController.renderCityFilterButtons(fallbackCities);
      hostController.loadCoordinatorSection(fallbackCities);
      if (modalCitySelect && !modalCitySelect.options.length) {
        modalCitySelect.innerHTML = '<option value="" selected disabled>Select a city</option><option value="Bengaluru">Bengaluru</option><option value="Mysuru">Mysuru</option>';
        modalCitySelect.value = '';
      }
    });

})();
