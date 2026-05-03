/* main의 js 파일 입니다. */

document.addEventListener('DOMContentLoaded', function () {
    if (typeof Swiper === 'undefined') return;

    var mvSlider = document.querySelector('.mv_slider_swiper');
    if (mvSlider) {
        new Swiper(mvSlider, {
            effect: 'fade',
            fadeEffect: { crossFade: true },
            loop: true,
            speed: 1500,
            autoplay: {
                delay: 3500,
                disableOnInteraction: false
            },
            allowTouchMove: false
        });
    }

    /* CON02: 매출 안내 카드 strip Swiper (main_sales 게시판 연동) */
    var salesSwiper = document.querySelector('.c2_sales_swiper');
    if (salesSwiper) {
        new Swiper(salesSwiper, {
            slidesPerView: 'auto',
            spaceBetween: 14,
            loop: true,
            centeredSlides: false,
            speed: 600,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false
            }
        });
    }

    /* CON14: 인테리어 슬라이드 Swiper (slidesPerView 3, centered, autoplay) */
    var c14Swiper = document.querySelector('.c14_swiper');
    if (c14Swiper) {
        new Swiper(c14Swiper, {
            slidesPerView: 3,
            spaceBetween: 38,
            centeredSlides: true,
            loop: true,
            speed: 600,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false
            }
        });
    }

    /* CON07: 미디어 영상 Swiper (iframe carousel + 외부 nav) */
    var videoSwiper = document.querySelector('.con7_swiper');
    if (videoSwiper) {
        new Swiper(videoSwiper, {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            speed: 600,
            navigation: {
                prevEl: '.con7_prev',
                nextEl: '.con7_next'
            }
        });
    }

    /* CON10: 리뷰 카드 가로 슬라이드 (main_review 게시판 연동) */
    var c10Swiper = document.querySelector('.c10_reviews_swiper');
    if (c10Swiper) {
        new Swiper(c10Swiper, {
            slidesPerView: 'auto',
            spaceBetween: 24,
            loop: true,
            centeredSlides: false,
            speed: 600,
            autoplay: {
                delay: 3500,
                disableOnInteraction: false
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var cards = document.querySelectorAll('[data-con1-card]');
    if (!cards.length) return;

    function activate(card) {
        cards.forEach(function (item) {
            item.classList.toggle('is-active', item === card);
        });
    }

    cards.forEach(function (card) {
        card.addEventListener('mouseenter', function () { activate(card); });
        card.addEventListener('focus', function () { activate(card); });
    });
});

/* CON09: 차림표 — 3 카테고리 × 3 Swiper + 공유 nav (main_menu 게시판 연동) */
document.addEventListener('DOMContentLoaded', function () {
    if (typeof Swiper === 'undefined') return;

    var c9Swipers = document.querySelectorAll('.c9_swiper');
    if (!c9Swipers.length) return;

    var prevEl = document.querySelector('.c9_prev');
    var nextEl = document.querySelector('.c9_next');
    var instances = {};

    c9Swipers.forEach(function (el) {
        var cat = el.getAttribute('data-c9-cat');
        instances[cat] = new Swiper(el, {
            slidesPerView: 4,
            spaceBetween: 23,
            loop: false,
            speed: 500,
            watchOverflow: true
        });
    });

    function getActiveCat() {
        var activeTab = document.querySelector('.c9_tab.is-active');
        return activeTab ? activeTab.getAttribute('data-c9-cat') : 'main';
    }

    function updateNavState() {
        var s = instances[getActiveCat()];
        if (!s || !prevEl || !nextEl) return;
        prevEl.classList.toggle('swiper-button-disabled', s.isBeginning);
        nextEl.classList.toggle('swiper-button-disabled', s.isEnd);
    }

    Object.keys(instances).forEach(function (cat) {
        instances[cat].on('slideChange reachBeginning reachEnd fromEdge', function () {
            if (cat === getActiveCat()) updateNavState();
        });
    });

    if (prevEl) prevEl.addEventListener('click', function () {
        var s = instances[getActiveCat()];
        if (s) s.slidePrev();
    });
    if (nextEl) nextEl.addEventListener('click', function () {
        var s = instances[getActiveCat()];
        if (s) s.slideNext();
    });

    var c9Tabs = document.querySelectorAll('.c9_tab[data-c9-cat]');
    c9Tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var cat = tab.getAttribute('data-c9-cat');
            c9Tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
            c9Swipers.forEach(function (sw) {
                sw.classList.toggle('is-active', sw.getAttribute('data-c9-cat') === cat);
            });
            if (instances[cat]) instances[cat].update();
            updateNavState();
        });
    });

    updateNavState();
});

document.addEventListener('DOMContentLoaded', function () {
    var btns = document.querySelectorAll('.c8_btn[data-c8-state]');
    if (!btns.length) return;

    var labelImg = document.querySelector('[data-c8-label]');
    var bowlImg  = document.querySelector('[data-c8-bowl]');
    var labelBox = labelImg && labelImg.parentElement;
    var bowlBox  = bowlImg && bowlImg.parentElement;
    if (!labelImg || !bowlImg) return;

    function activate(state) {
        btns.forEach(function (b) {
            b.classList.toggle('is-active', b.getAttribute('data-c8-state') === state);
        });
        labelImg.src = '/images/con08_' + state + '_1.png';
        bowlImg.src  = '/images/con08_' + state + '_2.png';
        if (labelBox) labelBox.setAttribute('data-c8-state', state);
        if (bowlBox)  bowlBox.setAttribute('data-c8-state', state);
    }

    btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            activate(btn.getAttribute('data-c8-state'));
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    var accordion = document.querySelector('[data-con12-accordion]');
    if (!accordion) return;

    var cards = accordion.querySelectorAll('[data-con12-card]');
    if (!cards.length) return;

    function activate(state) {
        accordion.setAttribute('data-active', state);
        cards.forEach(function (card) {
            var isActive = card.getAttribute('data-con12-card') === state;
            card.classList.toggle('is-active', isActive);
            card.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });
    }

    cards.forEach(function (card) {
        card.addEventListener('click', function () {
            activate(card.getAttribute('data-con12-card'));
        });
        card.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            activate(card.getAttribute('data-con12-card'));
        });
    });

    activate(accordion.getAttribute('data-active') || '1');
});

document.addEventListener('DOMContentLoaded', function () {
    var section = document.querySelector('[data-c13-scroll]');
    if (!section) return;

    var stage = section.querySelector('.c13_scroll_stage');
    var viewport = section.querySelector('.c13_right_viewport');
    var track = section.querySelector('.c13_card_track');
    if (!stage || !viewport || !track) return;

    var ticking = false;
    var pinEdgeBuffer = 0.5;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function updateCon13Scroll() {
        ticking = false;

        var rect = section.getBoundingClientRect();
        var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        var sectionTop = scrollY + rect.top;
        var sectionStyle = window.getComputedStyle(section);
        var paddingTop = parseFloat(sectionStyle.paddingTop) || 0;
        var paddingBottom = parseFloat(sectionStyle.paddingBottom) || 0;
        var start = sectionTop + paddingTop;
        var range = paddingBottom;
        var raw = scrollY - start;
        var pinned = range > 0 ? clamp(raw, 0, range) : 0;
        var progress = range > 0 ? pinned / range : 0;
        var baseTravel = Math.max(track.scrollHeight - viewport.clientHeight, 0);
        var travel = Math.max(baseTravel, range);
        var isBefore = raw < -pinEdgeBuffer;
        var isAfter = raw > range + pinEdgeBuffer;

        section.classList.toggle('is-c13-pinned', !isBefore && !isAfter);
        section.classList.toggle('is-c13-after', isAfter);
        section.style.setProperty('--c13-track-y', Math.round(-travel * progress) + 'px');
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateCon13Scroll);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    updateCon13Scroll();
});

/* ===== CON18: 매장 안내 (main_shop 연동, kakao map + 검색 + 팝업) ===== */
document.addEventListener('DOMContentLoaded', function () {
    var listEl    = document.getElementById('c18List');
    var mapEl     = document.getElementById('c18Map');
    var inputEl   = document.getElementById('c18Direct');
    var btnEl     = document.getElementById('c18SearchBtn');
    var noShopEl  = listEl ? listEl.querySelector('.c18_noshop') : null;
    var popupEl   = document.getElementById('c18Popup');
    var popupClose= document.getElementById('c18PopupClose');
    var popupName = document.getElementById('c18PopupName');
    var popupAddr = document.getElementById('c18PopupAddr');
    var popupTel  = document.getElementById('c18PopupTel');
    var popupNaver= document.getElementById('c18PopupNaver');
    var popupPhoto= document.getElementById('c18PopupPhoto');
    if (!listEl || !mapEl) return;

    var stores = [].slice.call(listEl.querySelectorAll('.c18_store'));
    if (!stores.length) return;

    function setActive(storeEl) {
        stores.forEach(function (s) { s.classList.toggle('is-active', s === storeEl); });
        var lat = parseFloat(storeEl.getAttribute('data-lat'));
        var lng = parseFloat(storeEl.getAttribute('data-lng'));
        if (window.kakao && kakaoMap && !isNaN(lat) && !isNaN(lng)) {
            kakaoMap.panTo(new kakao.maps.LatLng(lat, lng));
        }
        // 클릭 시 해당 매장이 보이도록 리스트 자동 스크롤
        if (storeEl.scrollIntoView) {
            storeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    /* --- kakao map init --- */
    var kakaoMap = null;
    var markers  = [];
    function initKakaoMap() {
        if (!window.kakao || !kakao.maps) return;
        var firstStore = stores[0];
        var initLat = parseFloat(firstStore.getAttribute('data-lat')) || 36.3658;
        var initLng = parseFloat(firstStore.getAttribute('data-lng')) || 127.3381;
        kakaoMap = new kakao.maps.Map(mapEl, {
            center: new kakao.maps.LatLng(initLat, initLng),
            level: 9,
            draggable: true
        });

        stores.forEach(function (s) {
            var lat = parseFloat(s.getAttribute('data-lat'));
            var lng = parseFloat(s.getAttribute('data-lng'));
            if (isNaN(lat) || isNaN(lng)) return;
            var pos = new kakao.maps.LatLng(lat, lng);
            var content = '<div class="c18_marker"><img src="/images/con18_04.png" alt=""></div>';
            var overlay = new kakao.maps.CustomOverlay({
                position: pos,
                content: content,
                yAnchor: 1
            });
            overlay.setMap(kakaoMap);
            markers.push({ store: s, overlay: overlay });

            var dom = overlay.getContent ? overlay.getContent() : null;
            (function (storeEl) {
                setTimeout(function () {
                    var elNode = mapEl.querySelector('.c18_marker:not([data-bound])');
                    if (elNode) {
                        elNode.setAttribute('data-bound', '1');
                        elNode.style.cursor = 'pointer';
                        elNode.addEventListener('click', function () { openPopup(storeEl); });
                    }
                }, 0);
            })(s);
        });
    }

    function whenKakaoReady(cb) {
        if (window.kakao && kakao.maps) { kakao.maps.load(cb); return; }
        if (typeof window.loadKakaoMapsSdk === 'function') {
            window.loadKakaoMapsSdk(function () {
                if (window.kakao && kakao.maps) kakao.maps.load(cb);
            });
            return;
        }
        var tries = 0;
        var iv = setInterval(function () {
            tries++;
            if (window.kakao && kakao.maps) { clearInterval(iv); kakao.maps.load(cb); }
            else if (tries > 50) { clearInterval(iv); }
        }, 100);
    }
    whenKakaoReady(initKakaoMap);

    /* --- store click → set active + open popup --- */
    stores.forEach(function (s) {
        s.addEventListener('click', function () {
            setActive(s);
            openPopup(s);
        });
    });
    setActive(stores[0]);

    /* --- search (input 입력 또는 검색 버튼) --- */
    function applySearch() {
        var q = (inputEl && inputEl.value || '').trim().toLowerCase();
        var visibleCount = 0;
        var firstVisible = null;
        stores.forEach(function (s) {
            var name = (s.getAttribute('data-name') || '').toLowerCase();
            var hit  = !q || name.indexOf(q) !== -1;
            s.style.display = hit ? '' : 'none';
            var divider = s.nextElementSibling;
            if (divider && divider.classList.contains('c18_divider')) {
                divider.style.display = hit ? '' : 'none';
            }
            if (hit) {
                visibleCount++;
                if (!firstVisible) firstVisible = s;
            }
        });
        if (noShopEl) noShopEl.classList.toggle('hide', visibleCount > 0);
        if (firstVisible) setActive(firstVisible);
    }
    if (inputEl) {
        inputEl.addEventListener('input', applySearch);
        inputEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); applySearch(); }
        });
    }
    if (btnEl) btnEl.addEventListener('click', applySearch);

    /* --- popup --- */
    function openPopup(storeEl) {
        if (!popupEl || !storeEl) return;
        var img = storeEl.getAttribute('data-img') || '';
        if (popupPhoto) {
            if (img) { popupPhoto.src = img; popupPhoto.style.display = ''; }
            else     { popupPhoto.removeAttribute('src'); popupPhoto.style.display = 'none'; }
        }
        if (popupName)  popupName.textContent  = storeEl.getAttribute('data-name') || '';
        if (popupAddr)  popupAddr.textContent  = storeEl.getAttribute('data-addr') || '';
        if (popupTel)   popupTel.textContent   = storeEl.getAttribute('data-tel')  || '';
        if (popupNaver) {
            var naver = storeEl.getAttribute('data-naver') || '';
            if (naver) { popupNaver.href = naver; popupNaver.style.display = ''; }
            else       { popupNaver.removeAttribute('href'); popupNaver.style.display = 'none'; }
        }
        popupEl.classList.remove('hide');
    }
    function closePopup() { if (popupEl) popupEl.classList.add('hide'); }
    if (popupClose) popupClose.addEventListener('click', closePopup);
    if (popupEl) popupEl.addEventListener('click', function (e) {
        if (e.target === popupEl) closePopup();
    });

});

/* CON19: 창업 문의 폼 — 클라이언트 validate + 자동 하이픈 */
(function () {
    var REGEX_NAME  = /^[가-힣A-Za-z\s]{2,30}$/;
    var REGEX_PHONE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

    document.addEventListener('DOMContentLoaded', function () {
        var phone = document.querySelector('input[name="c19_phone"]');
        if (phone) {
            phone.addEventListener('input', function () {
                var v = this.value.replace(/[^0-9]/g, '');
                if (v.length < 4) this.value = v;
                else if (v.length < 8)  this.value = v.replace(/(\d{3})(\d+)/, '$1-$2');
                else if (v.length < 11) this.value = v.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
                else                    this.value = v.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3').slice(0, 13);
            });
        }
    });

    window.c19FormSubmit = function (form) {
        if (!form) return false;
        var name    = form.querySelector('input[name="c19_name"]');
        var phone   = form.querySelector('input[name="c19_phone"]');
        var store   = form.querySelector('input[name="c19_store"]:checked');
        var consent = form.querySelector('input[name="c19_consent"]');

        if (!name || !name.value.trim()) {
            alert('성함을 입력해주세요.'); name && name.focus(); return false;
        }
        if (!REGEX_NAME.test(name.value.trim())) {
            alert('성함은 한글/영문 2~30자만 가능합니다.'); name.focus(); return false;
        }
        if (!phone || !phone.value.trim()) {
            alert('연락처를 입력해주세요.'); phone && phone.focus(); return false;
        }
        if (!REGEX_PHONE.test(phone.value.trim())) {
            alert('연락처 형식이 올바르지 않습니다. 예: 010-1234-5678'); phone.focus(); return false;
        }
        if (!store) {
            alert('상가보유 여부를 선택해주세요.'); return false;
        }
        if (!consent || !consent.checked) {
            alert('개인정보 수집 및 이용에 동의해주세요.'); return false;
        }

        // sendBeacon — URLSearchParams (application/x-www-form-urlencoded → PHP $_POST 호환)
        var params = new URLSearchParams();
        var fd = new FormData(form);
        fd.forEach(function (v, k) { params.append(k, v); });
        var blob = new Blob([params.toString()], { type: 'application/x-www-form-urlencoded' });
        var ok = navigator.sendBeacon('/bbs/mail.php', blob);
        if (ok) {
            alert('문의가 정상 접수되었습니다. 빠른 시일 내 연락드리겠습니다.');
            form.reset();
        } else {
            alert('전송 실패. 잠시 후 다시 시도해주세요.');
        }
        return false;   // form 기본 submit 막음 (sendBeacon이 처리)
    };
})();
