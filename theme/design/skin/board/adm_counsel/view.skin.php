<?php
if (!defined("_GNUBOARD_")) exit; // 개별 페이지 접근 불가
include_once(G5_LIB_PATH.'/thumbnail.lib.php');

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);

switch ($view['wr_9']) {
  case '1': $part = '교정치과'; break;
  case '2': $part = '임플란트'; break;
  case '3': $part = '라미네이트'; break;
  case '4': $part = '치아미백'; break;
  case '0': $part = '기타'; break;
}
?>

<script src="<?php echo G5_JS_URL; ?>/viewimageresize.js"></script>

<!-- 게시물 읽기 시작 { -->

<div class="margin-responsive-30" style="background:#fff; padding:20px 0px 50px;">
  <div class="view_box">
    <div class="view_title" style="margin-bottom:20px; text-align:center;">
      <span id="title"><?php echo $view['subject'];?></span>
    </div>

    <div style="padding-bottom:20px; text-align:center;">
        <a href="<?php echo $update_href?>" style="color:<?php echo $theme_color?>"><i class="uk-icon-link" uk-icon="icon: pencil; ratio: 1" style="color:<?php echo $theme_color?>"></i> 수정</a>
        <a href="#" class="delete_send" style="margin-left:20px; color:<?php echo $theme_color?>"><i class="uk-icon-link" uk-icon="icon: trash; ratio: 1" style="color:<?php echo $theme_color?>"></i> 삭제</a>
    </div>


    <div class="uk-margin">
      <div class="back-white">
        <div class="clear"><dl class="left-space">답변방법</dl><dd><?php echo $view['wr_1']?></dd></div>
      </div>
      <div class="back-white">
        <div class="clear"><dl class="left-space">이름</dl><dd><?php echo $view['wr_name']?></dd></div>
      </div>
      <div class="back-white">
        <div class="clear"><dl class="left-space">생년</dl><dd><?php echo $view['wr_2']?>년</dd></div>
      </div>
      <div class="back-white">
        <div class="clear"><dl class="left-space">전화번호</dl><dd><?php echo $view['wr_3']?></dd></div>
      </div>
      <div class="back-white">
        <div class="clear"><dl class="left-space">이메일</dl><dd><?php echo $view['wr_email']?></dd></div>
      </div>
      <?php if($view['wr_9']){?>
      <div class="back-white">
        <div class="clear"><dl class="left-space">분야</dl><dd><?php echo $part?></dd></div>
      </div>
      <?php }?>
      <?php if($view['wr_10']){?>
      <div class="back-white">
        <div class="clear"><dl class="left-space">신청 URL</dl><dd><?php echo $view['wr_10']?></dd></div>
      </div>
      <?php }?>
    </div>



    <div class="view_title3">
      <span>상담내용</span>
    </div>
    <div class="uk-margin">
      <div class="back-white">
        <div class="clear">

          <?php
          // 파일 출력
          $v_img_count = count($view['file']);
          if($v_img_count) {
              echo "<div id=\"bo_v_img\" style=\"text-align:center;\" >\n";

              for ($i=0; $i<=count($view['file']); $i++) {
                  if ($view['file'][$i]['view']) {
                      //echo $view['file'][$i]['view'];
                      echo get_view_thumbnail($view['file'][$i]['view']);
                  }
              }

              echo "</div>\n";
          }
           ?>

          <?php echo nl2br($view[wr_content]); ?>
        </div>
      </div>
    </div>


    <div class="view_title" style="margin-bottom:20px; text-align:center;">
      <span id="title"><?php echo $view['wr_6'];?></span>
    </div>

    <div class="uk-margin">
      <div class="back-white">
        <div class="clear"><dl class="left-space">답변여부</dl><dd><?php if($view['wr_4'] == '답변완료') echo '<font color="red">'.$view['wr_4'].'</font>'; else echo $view['wr_4']?></dd></div>
        <div class="clear"><dl class="left-space">답변자</dl><dd><?php echo $view['wr_5']?></dd></div>
      </div>
    </div>

    <div class="view_title3">
      <span>답변내용</span>
    </div>
    <div class="uk-margin">
      <div class="back-white">
        <div class="clear">
          <?php echo nl2br($view[wr_7]); ?>
        </div>
      </div>
    </div>



    <?php
    // 코멘트 입출력
    //include_once(G5_BBS_PATH.'/view_comment.php');
     ?>


     <a class="uk-button uk-width-1-1 uk-button-default" style="background:#a9a9a9; color:#fff;" href="./board.php?bo_table=<?php echo $bo_table ?>">나가기</a>


  </div>
</div>



<script>
<?php if ($board['bo_download_point'] < 0) { ?>
$(function() {
    $("a.view_file_download").click(function() {
        if(!g5_is_member) {
            alert("다운로드 권한이 없습니다.\n회원이시라면 로그인 후 이용해 보십시오.");
            return false;
        }

        var msg = "파일을 다운로드 하시면 포인트가 차감(<?php echo number_format($board['bo_download_point']) ?>점)됩니다.\n\n포인트는 게시물당 한번만 차감되며 다음에 다시 다운로드 하셔도 중복하여 차감하지 않습니다.\n\n그래도 다운로드 하시겠습니까?";

        if(confirm(msg)) {
            var href = $(this).attr("href")+"&js=on";
            $(this).attr("href", href);

            return true;
        } else {
            return false;
        }
    });
});
<?php } ?>

function board_move(href)
{
    window.open(href, "boardmove", "left=50, top=50, width=500, height=550, scrollbars=1");
}
</script>

<script>
$(function() {
    $("a.view_image").click(function() {
        window.open(this.href, "large_image", "location=yes,links=no,toolbar=no,top=10,left=10,width=10,height=10,resizable=yes,scrollbars=no,status=no");
        return false;
    });

    // 추천, 비추천
    $("#good_button, #nogood_button").click(function() {
        var $tx;
        if(this.id == "good_button")
            $tx = $("#bo_v_act_good");
        else
            $tx = $("#bo_v_act_nogood");

        excute_good(this.href, $(this), $tx);
        return false;
    });

    // 이미지 리사이즈
    $("#bo_v_atc").viewimageresize();

    //sns공유
    $(".btn_share").click(function(){
        $("#bo_v_sns").fadeIn();

    });

    $(document).mouseup(function (e) {
        var container = $("#bo_v_sns");
        if (!container.is(e.target) && container.has(e.target).length === 0){
        container.css("display","none");
        }
    });
});

function excute_good(href, $el, $tx)
{
    $.post(
        href,
        { js: "on" },
        function(data) {
            if(data.error) {
                alert(data.error);
                return false;
            }

            if(data.count) {
                $el.find("strong").text(number_format(String(data.count)));
                if($tx.attr("id").search("nogood") > -1) {
                    $tx.text("이 글을 비추천하셨습니다.");
                    $tx.fadeIn(200).delay(2500).fadeOut(200);
                } else {
                    $tx.text("이 글을 추천하셨습니다.");
                    $tx.fadeIn(200).delay(2500).fadeOut(200);
                }
            }
        }, "json"
    );
}


var win = null;

function newWindow(url){
  win = window.open(url,"popup");
}


/* 삭제버튼 클릭시 */
$('.delete_send').on('click', function(){
  var del = confirm("정말 삭제 하시겠습니까?");
  if(del) {
    location.href="./delete.php?bo_table=<?php echo $bo_table?>&wr_id=<?php echo $wr_id?>&token=<?php echo $token?>&page=<?php echo $page?>";
  }
});


</script>
<!-- } 게시글 읽기 끝 -->
