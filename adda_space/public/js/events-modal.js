import {
  getCsrfToken, escapeHtml, stripHtml, isPendingEvent, isPastEvent, recapStateHtml,
  getCategoryClass, getCategoryLabel, formatEventTime, formatEventTimeRange, formatShortDateTimeRange,
  formatLongDate, formatDayPopupDate
} from './events-utils.js';

export function createModalController(ctx) {
  var recapGalleryImages = [];
  var recapGalleryIndex = 0;
  var recapGalleryTrigger = null;
  var recapGalleryPreviousOverflow = '';
  var currentActiveEvent = null;
  var currentRegisteringEvent = null;
  var isSubmittingRegistration = false;

  function renderModalRecap(event) {
    if (!ctx.dom.modalEventRecap) return;
    var recap = event && event.recap;
    var past = isPastEvent(event);
    ctx.dom.modalEventRecap.style.display = past ? 'block' : 'none';
    if (!past) return;

    if (!recap) {
      ctx.dom.modalRecapTitle.textContent = 'Recap coming soon';
      ctx.dom.modalRecapSummary.textContent = 'Details from this gathering will be shared here when they are available.';
      ctx.dom.modalRecapOutcomes.style.display = 'none';
      ctx.dom.modalRecapMeta.innerHTML = '';
      ctx.dom.modalRecapGallery.innerHTML = '';
      return;
    }

    ctx.dom.modalRecapTitle.textContent = recap.title || 'Event recap';
    ctx.dom.modalRecapSummary.textContent = stripHtml(recap.summary || '');
    var outcomes = String(recap.key_outcomes || '').trim();
    ctx.dom.modalRecapOutcomes.style.display = outcomes ? 'block' : 'none';
    ctx.dom.modalRecapOutcomes.textContent = outcomes ? 'Key outcomes and community actions\n' + outcomes : '';

    var meta = [];
    if (recap.attendees !== null && recap.attendees !== undefined && recap.attendees !== '') {
      var count = parseInt(recap.attendees, 10);
      if (!isNaN(count) && count >= 0) meta.push('<span class="adda-recap-status adda-recap-status--available">' + count + ' attended</span>');
    }
    if (recap.facilitator) meta.push('<span>Facilitated by ' + escapeHtml(recap.facilitator) + '</span>');
    ctx.dom.modalRecapMeta.innerHTML = meta.join('');

    var gallery = Array.isArray(recap.gallery) ? recap.gallery : [];
    ctx.dom.modalRecapGallery.innerHTML = gallery.map(function(photo) {
      if (!photo || !photo.photo) return '';
      var caption = photo.caption || '';
      var alt = photo.alt_text || caption || recap.title || 'Gathering photo';
      return '<figure><img src="' + escapeHtml(photo.photo) + '" alt="' + escapeHtml(alt) + '" tabindex="0" role="button" aria-label="Open photo: ' + escapeHtml(alt) + '" loading="lazy"><figcaption>' + escapeHtml(caption) + '</figcaption></figure>';
    }).join('');
  }

  function updateRecapLightbox() {
    if (!recapGalleryImages.length) return;
    var active = recapGalleryImages[recapGalleryIndex];
    ctx.dom.recapGalleryLightboxImage.src = active.src;
    ctx.dom.recapGalleryLightboxImage.alt = active.alt || 'Event recap photo';
    ctx.dom.recapGalleryLightboxCaption.textContent = active.closest('figure').querySelector('figcaption').textContent || '';
    ctx.dom.recapGalleryLightboxCount.textContent = (recapGalleryIndex + 1) + ' / ' + recapGalleryImages.length;
    ctx.dom.recapGalleryLightboxPrev.style.display = recapGalleryImages.length > 1 ? 'inline-flex' : 'none';
    ctx.dom.recapGalleryLightboxNext.style.display = recapGalleryImages.length > 1 ? 'inline-flex' : 'none';
  }

  function openRecapLightbox(gallery, image) {
    if (!ctx.dom.recapGalleryLightbox || !gallery || !image) return;
    recapGalleryImages = Array.prototype.slice.call(gallery.querySelectorAll('img'));
    recapGalleryIndex = recapGalleryImages.indexOf(image);
    if (recapGalleryIndex < 0) return;
    recapGalleryTrigger = image;
    recapGalleryPreviousOverflow = document.body.style.overflow;
    updateRecapLightbox();
    ctx.dom.recapGalleryLightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    ctx.dom.recapGalleryLightboxClose.focus();
  }

  function closeRecapLightbox() {
    if (!ctx.dom.recapGalleryLightbox) return;
    ctx.dom.recapGalleryLightbox.classList.remove('is-open');
    ctx.dom.recapGalleryLightbox.style.display = 'none';
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

  if (ctx.dom.modalRecapGallery) {
    ctx.dom.modalRecapGallery.addEventListener('click', function(e) {
      var image = e.target.closest('img');
      if (image) openRecapLightbox(ctx.dom.modalRecapGallery, image);
    });
    ctx.dom.modalRecapGallery.addEventListener('keydown', function(e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('img')) {
        e.preventDefault();
        openRecapLightbox(ctx.dom.modalRecapGallery, e.target);
      }
    });
  }
  if (ctx.dom.recapGalleryLightboxClose) ctx.dom.recapGalleryLightboxClose.addEventListener('click', closeRecapLightbox);
  if (ctx.dom.recapGalleryLightboxPrev) ctx.dom.recapGalleryLightboxPrev.addEventListener('click', function() { moveRecapLightbox(-1); });
  if (ctx.dom.recapGalleryLightboxNext) ctx.dom.recapGalleryLightboxNext.addEventListener('click', function() { moveRecapLightbox(1); });
  if (ctx.dom.recapGalleryLightbox) {
    ctx.dom.recapGalleryLightbox.addEventListener('click', function(e) {
      if (e.target === ctx.dom.recapGalleryLightbox) closeRecapLightbox();
    });
  }
  document.addEventListener('keydown', function(e) {
    if (!ctx.dom.recapGalleryLightbox || !ctx.dom.recapGalleryLightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      closeRecapLightbox();
    }
    else if (e.key === 'ArrowLeft') moveRecapLightbox(-1);
    else if (e.key === 'ArrowRight') moveRecapLightbox(1);
  });

  function showToast(msg) {
    if (!ctx.dom.shareToast) return;
    ctx.dom.shareToast.textContent = msg;
    ctx.dom.shareToast.classList.add('is-visible');
    setTimeout(function() {
      ctx.dom.shareToast.classList.remove('is-visible');
    }, 2800);
  }

  // ========================================================================
  // DAY OVERFLOW EVENTS POPUP MODAL (+N More)
  // ========================================================================

  function openDayEventsPopup(dateKey) {
    if (!ctx.dom.dayEventsBackdrop || !ctx.dom.dayEventsList) return;
    var dayEvents = ctx.calendarState.calEventsByDate[dateKey] || [];
    if (dayEvents.length === 0) return;

    if (ctx.dom.dayEventsTitle) {
      ctx.dom.dayEventsTitle.textContent = 'Events on ' + formatDayPopupDate(dateKey);
    }
    if (ctx.dom.dayEventsCount) {
      ctx.dom.dayEventsCount.textContent = dayEvents.length + (dayEvents.length === 1 ? ' event' : ' events');
    }

    ctx.dom.dayEventsList.innerHTML = '';
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

      ctx.dom.dayEventsList.appendChild(card);
    });

    ctx.dom.dayEventsBackdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
      ctx.dom.dayEventsBackdrop.classList.add('is-open');
      if (ctx.dom.dayEventsCloseBtn) ctx.dom.dayEventsCloseBtn.focus();
    }, 10);
  }

  function closeDayEventsPopup(keepScrollLocked) {
    if (!ctx.dom.dayEventsBackdrop) return;
    ctx.dom.dayEventsBackdrop.classList.remove('is-open');
    setTimeout(function() {
      ctx.dom.dayEventsBackdrop.style.display = 'none';
      if (!keepScrollLocked && (!ctx.dom.detailModalBackdrop || !ctx.dom.detailModalBackdrop.classList.contains('is-open'))) {
        document.body.style.overflow = '';
      }
    }, 200);
  }

  if (ctx.dom.dayEventsCloseBtn) {
    ctx.dom.dayEventsCloseBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeDayEventsPopup();
    });
  }

  if (ctx.dom.dayEventsBackdrop) {
    ctx.dom.dayEventsBackdrop.addEventListener('click', function(e) {
      if (e.target === ctx.dom.dayEventsBackdrop) {
        closeDayEventsPopup();
      }
    });
  }

  // ========================================================================
  // EVENT DETAIL POPUP MODAL LOGIC
  // ========================================================================

  function openEventDetailModal(ev) {
    if (!ev || !ctx.dom.detailModalBackdrop) return;
    currentActiveEvent = ev;

    var safeTitle = ev.title || 'Untitled Gathering';
    ctx.dom.modalEventTitle.textContent = safeTitle;

    var catClass = getCategoryClass(ev.type);
    if (ctx.dom.modalEventBadge) {
      ctx.dom.modalEventBadge.className = 'adda-cat-badge ' + catClass;
      ctx.dom.modalEventBadge.textContent = getCategoryLabel(ev.type);
    }
    if (ctx.dom.modalEventCity) {
      ctx.dom.modalEventCity.textContent = ev.city || 'Neighbourhood';
    }

    if (ctx.dom.modalEventTime) {
      ctx.dom.modalEventTime.innerHTML = formatShortDateTimeRange(ev);
    }

    var venueParts = [];
    if (ev.room_name) venueParts.push(ev.room_name);
    if (ev.venue_details) venueParts.push(ev.venue_details);
    if (ev.city && venueParts.length === 0) venueParts.push(ev.city);
    var venueText = venueParts.join(' • ');
    if (ctx.dom.modalEventVenue) {
      ctx.dom.modalEventVenue.textContent = venueText;
      var venueRow = document.getElementById('modal-event-venue-row');
      if (venueRow) {
        venueRow.style.display = venueText ? 'flex' : 'none';
      }
    }

    if (ctx.dom.modalEventMode) {
      ctx.dom.modalEventMode.textContent = ev.mode || 'Offline';
    }

    var descText = stripHtml(ev.description || '');
    if (ctx.dom.modalEventDesc) {
      if (descText && descText.toLowerCase() !== 'na' && descText.toLowerCase() !== 'none') {
        ctx.dom.modalEventDesc.textContent = descText;
        ctx.dom.modalEventDesc.style.display = 'block';
      } else {
        ctx.dom.modalEventDesc.textContent = '';
        ctx.dom.modalEventDesc.style.display = 'none';
      }
    }
    renderModalRecap(ev);

    // Image resolution: cover_image or image, normalize relative paths
    var rawImg = (ev.cover_image || ev.image || '');
    if (rawImg && typeof rawImg === 'string' && rawImg.trim()) {
      var cleanImg = rawImg.trim();
      var lowerImg = cleanImg.toLowerCase();
      if (lowerImg === 'none' || lowerImg === 'null' || lowerImg === 'undefined') {
        ctx.dom.modalPosterImg.src = '';
        ctx.dom.modalPosterWrap.style.display = 'none';
      } else {
        // Keep the server-provided origin for uploaded files. It can differ
        // from the current page host when the site uses an alias or proxy.
        if (!cleanImg.startsWith('http://') && !cleanImg.startsWith('https://') && !cleanImg.startsWith('/')) {
          cleanImg = '/' + cleanImg;
        }
        if (cleanImg.startsWith('/private/files/')) {
          cleanImg = cleanImg.replace('/private/files/', '/files/');
        }
        ctx.dom.modalPosterImg.onerror = function() {
          ctx.dom.modalPosterWrap.style.display = 'none';
        };
        ctx.dom.modalPosterImg.src = cleanImg;
        ctx.dom.modalPosterWrap.style.display = 'block';
      }
    } else {
      ctx.dom.modalPosterImg.src = '';
      ctx.dom.modalPosterWrap.style.display = 'none';
    }

    if (ctx.dom.modalRegisterBtn) {
      ctx.dom.modalRegisterBtn.style.display = 'none';
    }

    ctx.dom.detailModalBackdrop.style.display = 'flex';
    setTimeout(function() {
      ctx.dom.detailModalBackdrop.classList.add('is-open');
    }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeEventDetailModal() {
    if (!ctx.dom.detailModalBackdrop) return;
    ctx.dom.detailModalBackdrop.classList.remove('is-open');
    setTimeout(function() {
      ctx.dom.detailModalBackdrop.style.display = 'none';
      currentActiveEvent = null;
      document.body.style.overflow = '';
    }, 200);
  }

  if (ctx.dom.modalDetailCloseBtn) ctx.dom.modalDetailCloseBtn.addEventListener('click', closeEventDetailModal);
  if (ctx.dom.modalDetailActionClose) ctx.dom.modalDetailActionClose.addEventListener('click', closeEventDetailModal);

  if (ctx.dom.detailModalBackdrop) {
    ctx.dom.detailModalBackdrop.addEventListener('click', function(e) {
      if (e.target === ctx.dom.detailModalBackdrop) {
        closeEventDetailModal();
      }
    });
  }

  // Poster Lightbox
  if (ctx.dom.modalPosterWrap) {
    ctx.dom.modalPosterWrap.addEventListener('click', function() {
      var imgSrc = (ctx.dom.modalPosterImg && ctx.dom.modalPosterImg.src) || (currentActiveEvent && (currentActiveEvent.cover_image || currentActiveEvent.image));
      if (imgSrc && ctx.dom.modalPosterWrap.style.display !== 'none' && ctx.dom.posterLightboxOverlay && ctx.dom.lightboxEnlargedImg) {
        ctx.dom.lightboxEnlargedImg.src = imgSrc;
        ctx.dom.posterLightboxOverlay.style.display = 'flex';
        setTimeout(function() { ctx.dom.posterLightboxOverlay.classList.add('is-open'); }, 10);
      }
    });
  }

  if (ctx.dom.posterLightboxOverlay) {
    ctx.dom.posterLightboxOverlay.addEventListener('click', function() {
      ctx.dom.posterLightboxOverlay.classList.remove('is-open');
      setTimeout(function() { ctx.dom.posterLightboxOverlay.style.display = 'none'; }, 200);
    });
  }

  // Share Event Action
  if (ctx.dom.modalShareBtn) {
    ctx.dom.modalShareBtn.addEventListener('click', function() {
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
    if (!ev || !ctx.dom.regModalBackdrop) return;
    currentRegisteringEvent = ev;
    isSubmittingRegistration = false;

    // Reset views
    if (ctx.dom.modalRegFormView) ctx.dom.modalRegFormView.style.display = 'block';
    if (ctx.dom.modalRegSuccessView) ctx.dom.modalRegSuccessView.style.display = 'none';
    if (ctx.dom.modalRegDuplicateView) ctx.dom.modalRegDuplicateView.style.display = 'none';
    if (ctx.dom.modalRegPastView) ctx.dom.modalRegPastView.style.display = 'none';
    if (ctx.dom.modalRegErrorBox) ctx.dom.modalRegErrorBox.style.display = 'none';
    if (ctx.dom.modalRegMobileError) ctx.dom.modalRegMobileError.style.display = 'none';
    if (ctx.dom.modalRegNameInput) ctx.dom.modalRegNameInput.value = '';
    if (ctx.dom.modalRegMobileInput) ctx.dom.modalRegMobileInput.value = '';
    if (ctx.dom.modalRegSubmitBtn) {
      ctx.dom.modalRegSubmitBtn.disabled = false;
      ctx.dom.modalRegSubmitBtn.textContent = 'Confirm Free RSVP';
    }

    if (ctx.dom.modalRegEventTitle) {
      ctx.dom.modalRegEventTitle.textContent = ev.title || 'Untitled Gathering';
    }
    if (ctx.dom.modalRegEventTime) {
      ctx.dom.modalRegEventTime.innerHTML = formatShortDateTimeRange(ev);
    }
    var venueParts = [];
    if (ev.room_name) venueParts.push(ev.room_name);
    if (ev.venue_details) venueParts.push(ev.venue_details);
    if (ev.city && venueParts.length === 0) venueParts.push(ev.city);
    if (ctx.dom.modalRegEventVenue) {
      ctx.dom.modalRegEventVenue.textContent = venueParts.join(' • ') || (ev.city || 'Neighbourhood');
    }

    if (isPastEvent(ev)) {
      if (ctx.dom.modalRegFormView) ctx.dom.modalRegFormView.style.display = 'none';
      if (ctx.dom.modalRegPastView) ctx.dom.modalRegPastView.style.display = 'block';
    }

    // Close detail modal if open
    if (ctx.dom.detailModalBackdrop && ctx.dom.detailModalBackdrop.classList.contains('is-open')) {
      ctx.dom.detailModalBackdrop.classList.remove('is-open');
      ctx.dom.detailModalBackdrop.style.display = 'none';
    }

    ctx.dom.regModalBackdrop.style.display = 'flex';
    setTimeout(function() {
      ctx.dom.regModalBackdrop.classList.add('is-open');
    }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeEventRegistrationModal() {
    if (!ctx.dom.regModalBackdrop) return;
    ctx.dom.regModalBackdrop.classList.remove('is-open');
    setTimeout(function() {
      ctx.dom.regModalBackdrop.style.display = 'none';
      currentRegisteringEvent = null;
      document.body.style.overflow = '';
    }, 200);
  }

  if (ctx.dom.modalRegCloseBtn) ctx.dom.modalRegCloseBtn.addEventListener('click', closeEventRegistrationModal);
  if (ctx.dom.modalRegSuccessCloseBtn) ctx.dom.modalRegSuccessCloseBtn.addEventListener('click', closeEventRegistrationModal);
  if (ctx.dom.modalRegDuplicateCloseBtn) ctx.dom.modalRegDuplicateCloseBtn.addEventListener('click', closeEventRegistrationModal);
  if (ctx.dom.modalRegPastCloseBtn) ctx.dom.modalRegPastCloseBtn.addEventListener('click', closeEventRegistrationModal);

  if (ctx.dom.regModalBackdrop) {
    ctx.dom.regModalBackdrop.addEventListener('click', function(e) {
      if (e.target === ctx.dom.regModalBackdrop) {
        closeEventRegistrationModal();
      }
    });
  }

  if (ctx.dom.modalRegisterBtn) {
    ctx.dom.modalRegisterBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentActiveEvent) {
        openEventRegistrationModal(currentActiveEvent);
      }
    });
  }

  if (ctx.dom.modalEventRegForm) {
    ctx.dom.modalEventRegForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (isSubmittingRegistration) return;

      if (ctx.dom.modalRegErrorBox) ctx.dom.modalRegErrorBox.style.display = 'none';
      if (ctx.dom.modalRegMobileError) ctx.dom.modalRegMobileError.style.display = 'none';

      var rawMob = ctx.dom.modalRegMobileInput ? ctx.dom.modalRegMobileInput.value.trim() : '';
      var cleanMob = rawMob.replace(/\D/g, '');
      if (cleanMob.length === 11 && cleanMob.charAt(0) === '0') cleanMob = cleanMob.slice(1);
      else if (cleanMob.length === 12 && cleanMob.slice(0, 2) === '91') cleanMob = cleanMob.slice(2);

      if (!cleanMob) {
        if (ctx.dom.modalRegMobileError) {
          ctx.dom.modalRegMobileError.textContent = 'Mobile number is required.';
          ctx.dom.modalRegMobileError.style.display = 'block';
        }
        if (ctx.dom.modalRegMobileInput) ctx.dom.modalRegMobileInput.focus();
        return;
      }
      if (cleanMob.length !== 10) {
        if (ctx.dom.modalRegMobileError) {
          ctx.dom.modalRegMobileError.textContent = 'Please enter a valid 10-digit mobile number.';
          ctx.dom.modalRegMobileError.style.display = 'block';
        }
        if (ctx.dom.modalRegMobileInput) ctx.dom.modalRegMobileInput.focus();
        return;
      }
      if (!/^[6-9]/.test(cleanMob)) {
        if (ctx.dom.modalRegMobileError) {
          ctx.dom.modalRegMobileError.textContent = 'Mobile number must start with 6, 7, 8, or 9.';
          ctx.dom.modalRegMobileError.style.display = 'block';
        }
        if (ctx.dom.modalRegMobileInput) ctx.dom.modalRegMobileInput.focus();
        return;
      }

      if (!currentRegisteringEvent) {
        if (ctx.dom.modalRegErrorBox && ctx.dom.modalRegErrorText) {
          ctx.dom.modalRegErrorText.textContent = 'No event selected for registration.';
          ctx.dom.modalRegErrorBox.style.display = 'block';
        }
        return;
      }

      isSubmittingRegistration = true;
      if (ctx.dom.modalRegSubmitBtn) {
        ctx.dom.modalRegSubmitBtn.disabled = true;
        ctx.dom.modalRegSubmitBtn.textContent = 'Reserving your spot...';
      }

      var eventIdentifier = currentRegisteringEvent.name || currentRegisteringEvent.unique_id;
      var fullName = ctx.dom.modalRegNameInput ? ctx.dom.modalRegNameInput.value.trim() : '';

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
            if (ctx.dom.modalRegDuplicateId) ctx.dom.modalRegDuplicateId.textContent = refCode;
            if (ctx.dom.modalRegFormView) ctx.dom.modalRegFormView.style.display = 'none';
            if (ctx.dom.modalRegDuplicateView) ctx.dom.modalRegDuplicateView.style.display = 'block';
            return;
          }
          throw new Error(payload.reason || 'Your registration could not be accepted.');
        }

        var isDuplicate = payload.already_registered === true || payload.is_new === false;
        var regRef = payload.registration_name || (payload.doc && payload.doc.name);

        if (isDuplicate) {
          if (ctx.dom.modalRegDuplicateId) ctx.dom.modalRegDuplicateId.textContent = regRef || 'Existing Registration';
          if (ctx.dom.modalRegFormView) ctx.dom.modalRegFormView.style.display = 'none';
          if (ctx.dom.modalRegDuplicateView) ctx.dom.modalRegDuplicateView.style.display = 'block';
        } else {
          if (ctx.dom.modalRegSuccessId) ctx.dom.modalRegSuccessId.textContent = regRef || 'Confirmed';
          if (ctx.dom.modalRegFormView) ctx.dom.modalRegFormView.style.display = 'none';
          if (ctx.dom.modalRegSuccessView) ctx.dom.modalRegSuccessView.style.display = 'block';
        }
      })
      .catch(function(err) {
        var errMsg = err ? (err.message || String(err)) : 'Unable to complete registration.';
        if (errMsg.toLowerCase().indexOf('duplicate') !== -1 || errMsg.toLowerCase().indexOf('already registered') !== -1) {
          if (ctx.dom.modalRegDuplicateId) ctx.dom.modalRegDuplicateId.textContent = 'Existing Registration';
          if (ctx.dom.modalRegFormView) ctx.dom.modalRegFormView.style.display = 'none';
          if (ctx.dom.modalRegDuplicateView) ctx.dom.modalRegDuplicateView.style.display = 'block';
        } else {
          if (ctx.dom.modalRegErrorBox && ctx.dom.modalRegErrorText) {
            ctx.dom.modalRegErrorText.textContent = errMsg;
            ctx.dom.modalRegErrorBox.style.display = 'block';
          }
          if (ctx.dom.modalRegSubmitBtn) {
            ctx.dom.modalRegSubmitBtn.disabled = false;
            ctx.dom.modalRegSubmitBtn.textContent = 'Confirm Free RSVP';
          }
          isSubmittingRegistration = false;
        }
      });
    });
  }

  return {
    openDayEventsPopup: openDayEventsPopup,
    closeDayEventsPopup: closeDayEventsPopup,
    openEventDetailModal: openEventDetailModal,
    closeEventDetailModal: closeEventDetailModal,
    openEventRegistrationModal: openEventRegistrationModal,
    closeEventRegistrationModal: closeEventRegistrationModal,
    showToast: showToast
  };
}
