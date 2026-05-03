// ===== 공통: GSAP + ScrollTrigger 설정 =====
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" });

var vw = function(v) {
    return ($(window).width() * v) / 100;
};

// ===== 공통: Lazy Loading (iframe + video) =====
document.addEventListener("DOMContentLoaded", () => {
    // iframe lazy (YouTube 등)
    const containers = document.querySelectorAll('.lazy-youtube');
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const iframe = document.createElement('iframe');
                iframe.src = entry.target.dataset.src;
                iframe.frameBorder = 0;
                iframe.allow = "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                iframe.allowFullscreen = true;
                entry.target.appendChild(iframe);
                io.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: "0px 0px 100% 0px", threshold: 0 });
    containers.forEach(c => io.observe(c));

    // video lazy
    const lazyVideos = document.querySelectorAll('.lazy-video');
    const preloadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                if (!video.src) {
                    video.src = video.dataset.src;
                    video.load();
                }
                observer.unobserve(video);
            }
        });
    }, { root: null, rootMargin: "0px 0px 100% 0px", threshold: 0 });
    lazyVideos.forEach(v => preloadObserver.observe(v));
    const playObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(() => { });
            } else {
                video.pause();
            }
        });
    }, { root: null, threshold: 0.1 });
    lazyVideos.forEach(v => playObserver.observe(v));
});

// ===== 공통: 동적 클래스 스타일 주입 함수 =====
function injectClassRule(className, styles) {
    if (!className) return;

    let styleTag = document.getElementById('dynamic-sheet');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-sheet';
        styleTag.appendChild(document.createTextNode(""));

        if (document.body) {
            document.body.appendChild(styleTag);
        } else {
            document.head.appendChild(styleTag);
        }
    }

    const sheet = styleTag.sheet;
    if (!sheet) return;

    const primaryClass = className.trim().split(/\s+/)[0];
    if (!primaryClass) return;

    let styleStr = `.${primaryClass} { `;
    for (let prop in styles) {
        styleStr += `${prop}: ${styles[prop]}; `;
    }
    styleStr += ` }`;

    try {
        const rules = sheet.cssRules || sheet.rules;
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].selectorText === `.${primaryClass}`) {
                sheet.deleteRule(i);
                break;
            }
        }
        sheet.insertRule(styleStr, rules.length);
    } catch (e) {
        console.error("스타일 주입 중 에러 발생:", e);
    }
}

// ===== 공통: 이미지 자동 계산기 (calcSectionDiv) =====
var CANVAS_WIDTH = 1920; // 프로젝트별 캔버스 폭 (양평=1905, 코끼리=1920 등)

function throttle(fn, wait) {
    let last = 0, timer = null;
    return function(...args) {
        const now = Date.now();
        const remaining = wait - (now - last);
        if (remaining <= 0) {
            clearTimeout(timer); timer = null; last = now; fn.apply(this, args);
        } else if (!timer) {
            timer = setTimeout(() => { last = Date.now(); timer = null; fn.apply(this, args); }, remaining);
        }
    };
}

function debounce(fn, delay) {
    let t;
    return function(...args){ clearTimeout(t); t = setTimeout(() => fn.apply(this,args), delay); };
}

const refreshST = throttle(() => {
    // if (window.ScrollTrigger) ScrollTrigger.refresh();
}, 200);

function getHtmlWidth() {
    return document.documentElement.clientWidth || window.innerWidth;
}

function calcSectionDirectImg(imgEl) {
    const $img = $(imgEl);
    const $parent = $img.parent();
    const htmlW = getHtmlWidth();
    const naturalW = $img.prop('naturalWidth');
    if (!naturalW) return;

    const imageWidth = htmlW * naturalW / CANVAS_WIDTH;
    const parentsWidth = $parent.width();
    if (!parentsWidth) return;

    const percent = (imageWidth / parentsWidth) * 100 + 0.001;
    $img.css('width', percent + '%');
}

function isLayoutAffecting(el) {
    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (cs.position === 'absolute' || cs.position === 'fixed') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return true;
}

function calcSectionDiv(divEl) {
    const $div = $(divEl);
    const className = $div.attr('class') || '';
    const $childrenVisible = $div.children(':visible');

    let styleObj = {};
    const $flowKids = $($childrenVisible.toArray().filter(isLayoutAffecting));

    // 1. p 태그가 있을 경우
    if ($div.find('p').length > 0) {
        const currentTop = $div.css('margin-top');
        const currentLeft = $div.css('margin-left');

        if (currentTop === '0px' || currentTop === '0' || currentTop === '') {
            styleObj['margin-top'] = '0%';
        }
        if (currentLeft === '0px' || currentLeft === '0' || currentLeft === '') {
            styleObj['margin-left'] = '0%';
        }

        if (Object.keys(styleObj).length > 0) {
            injectClassRule(className, styleObj);
        }
        return;
    }

    if ($flowKids.length !== 1) {
        return;
    }

    const $only = $($flowKids[0]);

    // 2. 이미지만 있을 경우
    if ($only.is('img')) {
        const $img = $only;
        const naturalW = $img.prop('naturalWidth');
        if (!naturalW) return;

        const htmlW = getHtmlWidth();
        const imageWidth = htmlW * naturalW / CANVAS_WIDTH;
        const parentsWidth = $div.parent().width();
        if (!parentsWidth) return;

        let percent = (imageWidth / parentsWidth) * 100;

        if ($div.css('display') !== 'flex') {
            styleObj['width'] = percent + '%';
            styleObj['display'] = 'flex';
            styleObj['justify-content'] = 'center';
            styleObj['align-items'] = 'center';
            styleObj['margin-top'] = '0%';
            styleObj['margin-left'] = '0%';
            injectClassRule(className, styleObj);
        }
        return;
    }

    // 3. 그 외 div
    if ($div.css('margin-top') === '0px' || $div.css('margin-top') === '0%') {
        styleObj['margin-top'] = '0%';
    }
    if ($div.css('margin-left') === '0px' || $div.css('margin-left') === '0%') {
        styleObj['margin-left'] = '0%';
    }

    if (Object.keys(styleObj).length > 0) {
        injectClassRule(className, styleObj);
    }
}

function handleImage(imgEl) {
    if ($(imgEl).parent().is('section')) {
        calcSectionDirectImg(imgEl);
    }
    const $p = $(imgEl).parent();
    if ($p.length && $p.is('div') && $p.parent().is('section')) {
        calcSectionDiv($p[0]);
    }
    refreshST();
}

function wireImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.__wired) return;
        img.__wired = true;

        if (img.complete && img.naturalWidth > 0) {
            handleImage(img);
        } else {
            img.addEventListener('load', () => handleImage(img), { once: true });
            img.addEventListener('error', () => handleImage(img), { once: true });
            img.decoding = img.decoding || 'async';
            if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
        }
    });
}

const recalcAll = throttle(() => {
    $('section > img').each(function(){ if (this.complete && this.naturalWidth > 0) calcSectionDirectImg(this); });
    $('section div').each(function(){ calcSectionDiv(this); });
    refreshST();
}, 150);

// ===== 클라이언트별 GSAP 애니메이션은 여기에 추가 =====
