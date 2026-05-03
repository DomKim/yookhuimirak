// ===== 카카오맵 + 매장 검색 (공통 템플릿) =====
// 사용법: header 템플릿에 카카오맵 SDK 로드 필요
// <script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY&libraries=services"></script>

// ================= 팝업 =================
if (typeof gsap !== 'undefined') {
  var tlclick = gsap.timeline();
  tlclick.from('.popup', { yPercent: 20, opacity: 0 });
}

$('.map_plus').on('click', function () {
  var $p = $(this).closest('.map_mid_map_search_item');
  $('.fixed_popup').removeClass('hide');
  if (typeof tlclick !== 'undefined') tlclick.restart();

  $('.popup_right_2nd').text($p.data('name'));
  $('.popup_right_3rd_right').text($p.data('address'));
  $('.popup_right_4th_right').text($p.data('tel'));
  $('.popup_right_4th_right_1').text($p.data('date') ? '평일 ' + $p.data('date') : '');
  $('.popup_right_4th_right_2').text($p.data('date2') ? '주말 ' + $p.data('date2') : '');
  $('.popup_right_6th_right').text($p.data('conv'));

  if ($p.data('naver')) {
    $('.popup_right_6th_left').attr('href', $p.data('naver')).css('pointer-events', 'auto');
  } else {
    $('.popup_right_6th_left').css('pointer-events', 'none');
  }
});

$('.popup_close, .fixed_popup_con').on('click', function () {
  $('.fixed_popup').addClass('hide');
});


// ================= 카카오맵 초기화 =================
if (typeof kakao !== 'undefined' && document.getElementById('map')) {
  var map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(36.5, 127.5),
    level: 12
  });

  var bounds = new kakao.maps.LatLngBounds();
  var positions2 = [];
  var activeOverlay = null;

  if (typeof array !== 'undefined' && Array.isArray(array)) {
    var markerImage = new kakao.maps.MarkerImage(
      '/images/map_marker.png', // 클라이언트별 마커 이미지로 교체
      new kakao.maps.Size(80, 76),
      { offset: new kakao.maps.Point(50, 76) }
    );

    array.forEach(function (item) {
      if (!item.wr_7 || !item.wr_8) return;

      var pos = new kakao.maps.LatLng(item.wr_7, item.wr_8);
      var marker = new kakao.maps.Marker({ map: map, position: pos, image: markerImage });

      var overlay = new kakao.maps.CustomOverlay({
        content: '<div class="my-place-label">' + item.wr_subject + '</div>',
        position: pos,
        yAnchor: 1,
        zIndex: 3
      });

      kakao.maps.event.addListener(marker, 'click', function () {
        if (activeOverlay) activeOverlay.setMap(null);
        overlay.setMap(map);
        activeOverlay = overlay;
      });

      positions2.push({
        title: item.wr_subject,
        address: item.wr_content,
        x: item.wr_8,
        y: item.wr_7,
        overlay: overlay
      });

      bounds.extend(pos);
    });

    map.setBounds(bounds);
  }
}


// ================= 공통 함수 =================
function markerMove(keyword) {
  if (!keyword || typeof positions2 === 'undefined') return;

  var target = positions2.find(function(v) {
    return v.title.includes(keyword) || v.address.includes(keyword);
  });

  if (!target) return;

  var moveLatLng = new kakao.maps.LatLng(target.y, target.x);
  map.panTo(moveLatLng);

  if (activeOverlay) activeOverlay.setMap(null);
  target.overlay.setMap(map);
  activeOverlay = target.overlay;
}

function filterStore(fn) {
  var found = false;
  $('.store').each(function () {
    var show = fn($(this));
    $(this).toggle(show);
    if (show) found = true;
  });
  $('.noshop').toggle(!found);
}


// ================= 검색 =================
$('#direct').on('input', function () {
  var keyword = $(this).val().toLowerCase();
  filterStore(function($el) {
    return ($el.data('name') || '').toLowerCase().includes(keyword);
  });
  markerMove(keyword);
});

$('#location').on('change', function () {
  var keyword = $(this).val();
  filterStore(function($el) {
    return ($el.data('address') || '').includes(keyword);
  });
  markerMove(keyword);
});

$('.map_mid_map_search_item').on('click', function () {
  markerMove($(this).data('name'));
});
