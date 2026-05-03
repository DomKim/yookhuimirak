<?php
if (!defined('_GNUBOARD_')) exit;

$print_version = defined('G5_YOUNGCART_VER') ? 'YoungCart Version '.G5_YOUNGCART_VER : 'Version '.G5_GNUBOARD_VER;
?>
</div>
</div>

<!-- } 콘텐츠 끝 -->

<div id="ft" style="background:transparent; border-top:0px;">
  <div class="uk-container">
    <?php //echo popular('theme/basic'); // 인기검색어, 테마의 스킨을 사용하려면 스킨을 theme/basic 과 같이 지정  ?>
    <?php //echo visit('theme/basic'); // 접속자집계, 테마의 스킨을 사용하려면 스킨을 theme/basic 과 같이 지정 ?>
    <div id="ft_copy" style="background:transparent; border-top:0px;">
        <div style="text-align:center; color:#333; padding: 20px 0px;">
            Copyright &copy; <?php echo $config['cf_title'];?>. All rights reserved. <?php echo $print_version; ?><br>
        </div>
    </div>
  </div>
</div>


</div>
<!-- uk-container -->

<!-- 고정 확인버튼 -->
<div id="formSubmit" style="display:none; position:fixed; bottom:0px; width:100%; height:50px; background:#ff63f4; border-top:1px solid #d3d3d3; color:#fff; text-align:center; line-height:50px;"> 확인 </div>
<!-- 고정 확인버튼 -->


</div>

<!-- <p>실행시간 : <?php echo get_microtime() - $begin_time; ?> -->

<script src="<?php echo G5_ADMIN_URL ?>/admin.js?ver=<?php echo G5_JS_VER; ?>"></script>
<script src="<?php echo G5_JS_URL ?>/jquery.anchorScroll.js?ver=<?php echo G5_JS_VER; ?>"></script>
<script>
$(function(){

    var admin_head_height = $("#hd_top").height() + $("#container_title").height() + 5;

    $("a[href^='#']").anchorScroll({
        scrollSpeed: 0, // scroll speed
        offsetTop: admin_head_height, // offset for fixed top bars (defaults to 0)
        onScroll: function () {
          // callback on scroll start
        },
        scrollEnd: function () {
          // callback on scroll end
        }
    });

    var hide_menu = false;
    var mouse_event = false;
    var oldX = oldY = 0;

    $(document).mousemove(function(e) {
        if(oldX == 0) {
            oldX = e.pageX;
            oldY = e.pageY;
        }

        if(oldX != e.pageX || oldY != e.pageY) {
            mouse_event = true;
        }
    });

    // 주메뉴
    var $gnb = $(".gnb_1dli > a");
    $gnb.mouseover(function() {
        if(mouse_event) {
            $(".gnb_1dli").removeClass("gnb_1dli_over gnb_1dli_over2 gnb_1dli_on");
            $(this).parent().addClass("gnb_1dli_over gnb_1dli_on");
            menu_rearrange($(this).parent());
            hide_menu = false;
        }
    });

    $gnb.mouseout(function() {
        hide_menu = true;
    });

    $(".gnb_2dli").mouseover(function() {
        hide_menu = false;
    });

    $(".gnb_2dli").mouseout(function() {
        hide_menu = true;
    });

    $gnb.focusin(function() {
        $(".gnb_1dli").removeClass("gnb_1dli_over gnb_1dli_over2 gnb_1dli_on");
        $(this).parent().addClass("gnb_1dli_over gnb_1dli_on");
        menu_rearrange($(this).parent());
        hide_menu = false;
    });

    $gnb.focusout(function() {
        hide_menu = true;
    });

    $(".gnb_2da").focusin(function() {
        $(".gnb_1dli").removeClass("gnb_1dli_over gnb_1dli_over2 gnb_1dli_on");
        var $gnb_li = $(this).closest(".gnb_1dli").addClass("gnb_1dli_over gnb_1dli_on");
        menu_rearrange($(this).closest(".gnb_1dli"));
        hide_menu = false;
    });

    $(".gnb_2da").focusout(function() {
        hide_menu = true;
    });

    $('#gnb_1dul>li').bind('mouseleave',function(){
        submenu_hide();
    });

    $(document).bind('click focusin',function(){
        if(hide_menu) {
            submenu_hide();
        }
    });

    // 폰트 리사이즈 쿠키있으면 실행
    var font_resize_act = get_cookie("ck_font_resize_act");
    if(font_resize_act != "") {
        font_resize("container", font_resize_act);
    }
});

function submenu_hide() {
    $(".gnb_1dli").removeClass("gnb_1dli_over gnb_1dli_over2 gnb_1dli_on");
}

function menu_rearrange(el)
{
    var width = $("#gnb_1dul").width();
    var left = w1 = w2 = 0;
    var idx = $(".gnb_1dli").index(el);

    for(i=0; i<=idx; i++) {
        w1 = $(".gnb_1dli:eq("+i+")").outerWidth();
        w2 = $(".gnb_2dli > a:eq("+i+")").outerWidth(true);

        if((left + w2) > width) {
            el.removeClass("gnb_1dli_over").addClass("gnb_1dli_over2");
        }

        left += w1;
    }
}

</script>

<script>

var href = window.location.href;
var origin = window.location.origin;

var urlString = href.split("/");
var url = urlString[3];
var url1 = urlString[4];
var url2 = urlString[5];

$(function() {
    // 폰트 리사이즈 쿠키있으면 실행
    font_resize("container", get_cookie("ck_font_resize_rmv_class"), get_cookie("ck_font_resize_add_class"));
});

/* 스크롤 헤드 사이즈 변경 */
$(document).scroll(function(event){
    var headMenu = 100 - $(this).scrollTop();
		if(headMenu >= 20){
      if($(window).width() >= 767){
        //$('.uk-navbar-item, .uk-navbar-nav>li>a, .uk-navbar-toggle').css('height','80px');
        //$('.uk-sticky-placeholder').css('height','80px');
      }else{
        //$('.uk-navbar-item, .uk-navbar-nav>li>a, .uk-navbar-toggle').css('height','50px');
        //$('.uk-sticky-placeholder').css('height','50px');
      }

      $(window).resize(function() {
        if($(window).width() >= 767){
          //$('.uk-navbar-item, .uk-navbar-nav>li>a, .uk-navbar-toggle').css('height','80px');
          //$('.uk-sticky-placeholder').css('height','80px');
        }else{
          //$('.uk-navbar-item, .uk-navbar-nav>li>a, .uk-navbar-toggle').css('height','50px');
          //$('.uk-sticky-placeholder').css('height','50px');
        };
      });

      $('.uk-navbar-item, .uk-navbar-nav>li>a, .uk-navbar-toggle').css('transition','300ms');
    }else{
      //$('.uk-navbar-item, .uk-navbar-nav>li>a, .uk-navbar-toggle').css('height','50px');
      $('.uk-navbar-item, .uk-navbar-nav>li>a, .uk-navbar-toggle').css('transition','300ms');
    }

});

/* 브라우저 사이즈에 따른 레이아웃 설정 */
$(window).resize(function() {
  if($(window).width() >= 767){
    //$('.uk-offcanvas-content').attr('style','margin-left:260px; background:#f3f3f3;');
    $('#offcanvas-push').attr('class','uk-offcanvas uk-open');
    $('#offcanvas-push').attr('style','display: block');
    $('.uk-offcanvas-content').css('margin-left','259px');
    //$('.uk-sticky-placeholder').css('height','80px');
    $('#pageUp').hide();
  }else{
    //$('.uk-offcanvas-content').attr('style','background:#f3f3f3;');
    $('#offcanvas-push').attr('class','uk-offcanvas');
    $('#offcanvas-push').attr('style','');
    $('.uk-offcanvas-content').css('margin-left','0px');
    //$('.uk-sticky-placeholder').css('height','50px');
    $('#pageUp').show();
  };
});

if($(window).width() >= 767){
  $('#offcanvas-push').attr('class','uk-offcanvas uk-open');
  //$('.uk-sticky-placeholder').css('height','80px');
  $('#pageUp').hide();
}else{
  $('#offcanvas-push').attr('class','uk-offcanvas');
  //$('.uk-sticky-placeholder').css('height','60px');
  $('#pageUp').show();
};

/* 페이징 스타일 변경 */
$('.pg_start').html('<span uk-pagination-previous></span>');
$('.pg_end').html('<span uk-pagination-next></span>');



$('#attendance_check').on('click',function(){
  window.open('/bbs/write.php?bo_table=attendance','attendance_check','scrollbars=yes, toolbar=no, status=no, menubar=no, resizable=no, width=300, height=500');
});

$('#attendance_check2').on('click',function(){
  window.open('/bbs/write.php?bo_table=attendance','attendance_check','scrollbars=yes, toolbar=no, status=no, menubar=no, resizable=no, width=300, height=500');
});


/* 하단 확인버튼 */
/*
if($('.btn_fixed_top').length){
  $('.btn_fixed_top').hide();
  $('#formSubmit').show();
  var form_name = $('form').attr('name');
  $('#formSubmit').attr('onclick',"submit(form_name)");
}

function submit(name){
  $('#'+name).submit();
}
*/

$('#hide-menu').toggle(function(){
  $('.uk-offcanvas-bar').css('left','-259px');
  $('.uk-offcanvas-bar').css('transition','300ms');
  $('.uk-offcanvas-content').css('margin-left','0px');
  $('.uk-offcanvas-content').css('transition','300ms');
  $('.header').css('width','100%');
  $('.header').css('transition','300ms');

  $.removeCookie('hide-menu');
  $.cookie('hide-menu','true',{path: "/adm"});
}, function(){
  $('.uk-offcanvas-bar').css('left','0px');
  $('.uk-offcanvas-bar').css('transition','300ms');
  $('.uk-offcanvas-content').css('margin-left','259px');
  $('.uk-offcanvas-content').css('transition','300ms');
  $('.header').css('width','calc(100% - 259px)');
  $('.header').css('transition','300ms');

  $.removeCookie('hide-menu');
  $.cookie('hide-menu','false',{path: "/adm"});
});

/*
if($.cookie('hide-menu')=='true'){
  $('.uk-offcanvas-bar').css('left','-260px');
  $('.uk-offcanvas-bar').css('transition','300ms');
  $('.uk-offcanvas-content').css('margin-left','0px');
  $('.uk-offcanvas-content').css('transition','300ms');
  $('.header').css('width','100%');
  $('.header').css('transition','300ms');
}else if($.cookie('hide-menu')=='false'){
  $('.uk-offcanvas-bar').css('left','0px');
  $('.uk-offcanvas-content').css('margin-left','260px');
  $('.header').css('width','calc(100% - 260px)');
}
*/
</script>

<?php
include_once(G5_PATH.'/tail.sub.php');
?>
