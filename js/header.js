$(function() {
    let header = document.querySelector("header");
    let headerHeight = header ? header.offsetHeight : 0;

    // --- 1. 헤더 호버 (PC 메뉴) ---
    $("header li").mouseover(function() {
        $(this).find('.drop-down').stop().slideDown(300);
        $(this).find(".accent").addClass("animate");
        $(this).find(".item").css("color", "#FFF");
    }).mouseleave(function() {
        $(this).find(".drop-down").stop().slideUp(300);
        $(this).find(".accent").removeClass("animate");
        $(this).find(".item").css("color", "#C11920");
    });

    // --- 2. 모바일 햄버거 메뉴 ---
    $('.hamburger-menu').click(function() {
        $('.line').toggleClass('line_change');
        if (!$('div.line').hasClass('init')) {
            $('div.line').addClass('init').removeClass("on");
            $('.menu').addClass('menu-hide').removeClass("menu-show");
            $('.header_menu').removeClass('header_menu_drop');
        } else {
            $('div.line').removeClass('init').addClass("on");
            $('.menu').addClass('menu-show').removeClass("menu-hide");
            $('.header_menu').addClass('header_menu_drop');
        }
    });

    // --- 3. 클라이언트별 GSAP 애니메이션은 script.js에 추가 ---

    // --- 4. 하단 스크롤 이동 버튼 ---
    $('.tothebottom').on('click', function(e) {
        e.preventDefault();
        window.scrollTo(0, document.body.scrollHeight);
    });

    // --- 5. 디바이스 감지 및 팝업/채팅창 로직 ---
    const userAgent = navigator.userAgent.toLowerCase();
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
    const isMobile = (function(a) {
        return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4));
    })(navigator.userAgent || navigator.vendor || window.opera);

    let chatHeight = '9vw'; // 기본 PC 채팅창 높이

    if (isMobile) {
        chatHeight = '36vw';
        $('#hd_pop > div').each(function(i) {
            let $el = $(this);
            $el.css({
                'z-index': 1111111111 + i,
                'transform': 'translateY(' + (i + 1) * 12 + '%)'
            });
            if ($el.find('iframe').length < 1) {
                let $p = $el.find('> div > p').eq(0);
                if ($p.length) $p.html($p.html().replace(/&nbsp/g, ''));
            } else {
                $el.css('z-index', 11111111111);
                $el.find('.hd_pops_con > iframe').css({ 'width': '100%', 'height': '50vw' });
            }
        });
    } else if (isTablet) {
        // 태블릿의 경우 모바일과 동일하게 36vw를 사용할 수 있습니다. (기존 로직 유지)
        $('#hd_pop > div').each(function(i) {
            let $el = $(this);
            $el.css({
                'z-index': 1111111111 + i,
                'transform': 'translateY(' + (i + 1) * 12 + '%)'
            });
            if ($el.find('iframe').length < 1) {
                let $p = $el.find('> div > p').eq(0);
                if ($p.length) $p.html($p.html().replace(/&nbsp/g, ''));
            } else {
                $el.css({ 'width': '71%', 'z-index': 1111111111 });
                $el.find('.hd_pops_con > iframe').css({ 'width': '100%', 'height': '37vw' });
            }
        });
        $('#hd_pop > div').css({ 'margin': '0 auto', 'top': '5%', 'border-radius': '22px', 'overflow': 'hidden' });
        $('#hd_pop').css({ 'width': '100%', 'height': '100vh', 'position': 'absolute', 'top': '3%' });
        $('.hd_pops_con').css({ 'width': '100%', 'height': 'auto' });
        $('.hd_pops_footer').css({ 'font-size': '2.6vw' });
    }

    // 채팅 버튼 열기/닫기 로직 통합
    $('.header_chat01').on('click', function() {
        $(this).removeClass('header_change');
        $('.header_chat_div').css('height', chatHeight); // 디바이스별 높이 자동 적용
        $('.header_chat02').addClass('header_change');
    });

    $('.header_chat02').on('click', function() {
        $(this).removeClass('header_change');
        $('.header_chat_div').css('height', '0vw');
        $('.header_chat01').addClass('header_change');
    });

    // --- 6. 스크롤 이벤트 (중복 제거 및 최적화 통합) ---
    let prevScrollTop = window.scrollY || document.documentElement.scrollTop;

    $(window).on('scroll', function() {
        let nowScrollTop = window.scrollY || document.documentElement.scrollTop;

        if (header) {
            // 헤더 고정 (공통)
            if (nowScrollTop >= headerHeight) {
                header.classList.add("drop");
            } else {
                header.classList.remove("drop");
            }

            // 스크롤 방향에 따른 헤더 숨김/노출 (PC 환경 - 창 너비 600px 이상)
            if (window.innerWidth >= 600) {
                if (nowScrollTop > prevScrollTop) {
                    // 아래로 스크롤 할 때
                    header.classList.remove("drop");
                    header.classList.add("insert");
                } else {
                    // 위로 스크롤 할 때
                    header.classList.add("drop");
                    header.classList.remove("insert");
                }
            }
        }
        prevScrollTop = nowScrollTop;
    });
});