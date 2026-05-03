<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);

/*디바이스 접속여부*/
if($deviceType == 'phone'){ $device_name = 'M'; } else if($deviceType == 'tablet'){ $device_name = 'M';} else if($deviceType == 'computer'){ $device_name = 'P'; }
?>


<?php if ($is_category && 0) { ?>
프로젝트 분류
<select name="ca_name" id="ca_name" required class="uk-select margin-b10">
  <option value="">분류를 선택하세요</option>
  <?php echo $category_option ?>
</select>
<?php } ?>

<section id="bo_w">

<form name="fwrite" id="fwrite" action="<?php echo $action_url ?>" onsubmit="return fwrite_submit(this);" method="post" enctype="multipart/form-data" autocomplete="off" style="width:<?php echo $width; ?>">
<input type="hidden" name="uid" value="<?php echo get_uniqid(); ?>">
<input type="hidden" name="w" value="<?php echo $w ?>">
<input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
<input type="hidden" name="wr_id" value="<?php echo $wr_id ?>">
<input type="hidden" name="sca" value="<?php echo $sca ?>">
<input type="hidden" name="sfl" value="<?php echo $sfl ?>">
<input type="hidden" name="stx" value="<?php echo $stx ?>">
<input type="hidden" name="spt" value="<?php echo $spt ?>">
<input type="hidden" name="sst" value="<?php echo $sst ?>">
<input type="hidden" name="sod" value="<?php echo $sod ?>">
<input type="hidden" name="page" value="<?php echo $page ?>">
<!-- 디바이스접속 -->
<input type="hidden" name="wr_8" value="<?php echo $device_name?>">

<div class="margin-50" style="margin-bottom:100px;">
  <div class="view_box">
    <div class="member_title">
      <?php echo $board['bo_subject'];?> 등록
    </div>
    <div class="text-center">
    </div>

    <fieldset class="uk-fieldset margin-50">


        <div class="row">
          <div class="col-md-2 padding-20">답변방법</div>
          <div class="col-md-10">
            <div class="uk-margin uk-grid-small uk-child-width-auto uk-grid">

            <label><input class="uk-radio" type="radio" name="wr_1" value="이메일" <?php if($write[wr_1] == '이메일') echo 'checked';?>> 이메일</label>
            <label><input class="uk-radio" type="radio" name="wr_1" value="전화" <?php if($write[wr_1] == '전화') echo 'checked';?>> 전화</label>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-12"><input type="text" name="wr_name" value="<?php echo $write[wr_name] ?>" id="wr_name" required class="uk-input margin-10 margin-b10" placeholder="이름"></div>
        </div>



        <div class="row">
          <div class="col-md-12"><input type="text" name="wr_3" value="<?php echo $write[wr_3] ?>" id="wr_3" required class="uk-input margin-10 margin-b10" placeholder="전화번호"></div>
        </div>

        <div class="row">
          <div class="col-md-12"><input type="text" name="wr_email" value="<?php echo $write[wr_email] ?>" id="wr_email" required class="uk-input margin-10 margin-b10" placeholder="이메일"></div>
        </div>

        <div class="uk-margin">
          상담제목
            <input type="text" name="wr_subject" value="<?php echo $subject ?>" id="wr_subject" required class="uk-input margin-10 margin-b10" placeholder="상담제목">
        </div>

    </fieldset>


    <fieldset class="uk-fieldset">

        <div class="uk-margin">
          상담내용
          <div class="uk-margin margin-10">
              <!--<textarea class="uk-textarea" rows="5" placeholder="내용을 입력해주세요"></textarea>-->

              <div class="wr_content <?php echo $is_dhtml_editor ? $config['cf_editor'] : ''; ?>">
                  <?php if($write_min || $write_max) { ?>
                  <!-- 최소/최대 글자 수 사용 시 -->
                  <p id="char_count_desc">이 게시판은 최소 <strong><?php echo $write_min; ?></strong>글자 이상, 최대 <strong><?php echo $write_max; ?></strong>글자 이하까지 글을 쓰실 수 있습니다.</p>
                  <?php } ?>
                  <?php echo $editor_html; // 에디터 사용시는 에디터로, 아니면 textarea 로 노출 ?>
                  <?php if($write_min || $write_max) { ?>
                  <!-- 최소/최대 글자 수 사용 시 -->
                  <div id="char_count_wrap"><span id="char_count"></span>글자</div>
                  <?php } ?>
              </div>

          </div>
        </div>




        <?php
        if(false){
         for ($i=0; $is_file && $i<$file_count; $i++) { ?>
        사진 업로드
        <div class="bo_w_flie write_div">

            <div class="js-upload" uk-form-custom>
                <input type="file" name="bf_file[]" id="bf_file_<?php echo $i+1 ?>" title="파일첨부 <?php echo $i+1 ?> : 용량 <?php echo $upload_max_filesize ?> 이하만 업로드 가능" multiple>
                <button class="uk-button uk-button-default" style="background:<?php if($theme_color) echo $theme_color_bar; else echo $theme_color_bar; ?>; color:#fff;" type="button" tabindex="-1">파일 업로드</button>
            </div>

            <?php if ($is_file_content) { ?>
            <input type="text" name="bf_content[]" value="<?php echo ($w == 'u') ? $file[$i]['bf_content'] : ''; ?>" title="파일 설명을 입력해주세요." class="full_input frm_input" size="50" placeholder="파일 설명을 입력해주세요.">
            <?php } ?>

            <?php if($w == 'u' && $file[$i]['file']) { ?>
            <span class="file_del">
                <input type="checkbox" id="bf_file_del<?php echo $i ?>" name="bf_file_del[<?php echo $i;  ?>]" value="1"> <label for="bf_file_del<?php echo $i ?>"><?php echo $file[$i]['source'].'('.$file[$i]['size'].')';  ?> 파일 삭제</label>
            </span>
            <?php } ?>

        </div>
        <?php }
        } ?>



    </fieldset>



    <div class="member_title margin-50">
      <?php echo $board['bo_subject'];?> 답변등록
    </div>


    <fieldset class="uk-fieldset margin-50">


        <div class="row">
          <div class="col-md-2 padding-20">답변여부</div>
          <div class="col-md-10">
            <div class="uk-margin uk-grid-small uk-child-width-auto uk-grid">
            <label><input class="uk-radio" type="radio" name="wr_4" value="답변중" <?php if($write[wr_4] == '답변중') echo 'checked';?>> 답변중</label>
            <label><input class="uk-radio" type="radio" name="wr_4" value="답변완료" <?php if($write[wr_4] == '답변완료') echo 'checked';?>> 답변완료</label>
            </div>
          </div>
        </div>

        <?php
        /* 직원 인트라넷 메뉴 */
        if($member['mb_level'] >= 10){?>

          <div class="uk-margin">
            답변자
              <div class="uk-margin margin-b10 margin-10">
                <select class="uk-select" name="wr_5">
                <?php
                $where = 'where mb_level = "10" ';

                $que = sql_query("SELECT * FROM {$g5['member_table']} ".$where);
                for ($j=1; $row = sql_fetch_array($que); $j++) { ?>
                  <option value="<?php echo $row['mb_name']?>" <?php if($row['mb_name'] == $member['mb_name']) echo "selected"; else echo "";?>><?php echo $row['mb_name']?></option>
                <?php
                }
                ?>
                <option value="송은경">송은경</option>
                </select>
              </div>
          </div>
        <?php } ?>

        <div class="uk-margin">
          답변제목
            <input type="text" name="wr_6" value="<?php echo $write[wr_6] ?>" id="wr_6" class="uk-input margin-10 margin-b10" placeholder="답변제목">
        </div>

        <div class="uk-margin">
          <div class="uk-margin">
              <textarea class="uk-textarea" name="wr_7" rows="5" placeholder="답변내용"><?=$write[wr_7]?></textarea>
          </div>
        </div>

    </fieldset>


      <button class="uk-button uk-width-1-1 uk-button-default margin-50" style="background:<?php if($theme_color) echo $theme_color_bar; else echo $theme_color_bar; ?>; color:#fff;">확인</button>
      <a class="uk-button uk-width-1-1 uk-button-default" style="background:#a9a9a9; color:#fff;" href="javascript:history.back();">취소</a>

  </div>
</div>

</form>
</section>








  <script>
    <?php if($write_min || $write_max) { ?>
    // 글자수 제한
    var char_min = parseInt(<?php echo $write_min; ?>); // 최소
    var char_max = parseInt(<?php echo $write_max; ?>); // 최대
    check_byte("wr_content", "char_count");

    $(function() {
        $("#wr_content").on("keyup", function() {
            check_byte("wr_content", "char_count");
        });
    });

    <?php } ?>
    function html_auto_br(obj)
    {
        if (obj.checked) {
            result = confirm("자동 줄바꿈을 하시겠습니까?\n\n자동 줄바꿈은 게시물 내용중 줄바뀐 곳을<br>태그로 변환하는 기능입니다.");
            if (result)
                obj.value = "html2";
            else
                obj.value = "html1";
        }
        else
            obj.value = "";
    }

    function fwrite_submit(f)
    {
        <?php echo $editor_js; // 에디터 사용시 자바스크립트에서 내용을 폼필드로 넣어주며 내용이 입력되었는지 검사함   ?>

        var subject = "";
        var content = "";
        $.ajax({
            url: g5_bbs_url+"/ajax.filter.php",
            type: "POST",
            data: {
                "subject": f.wr_subject.value,
                "content": f.wr_content.value
            },
            dataType: "json",
            async: false,
            cache: false,
            success: function(data, textStatus) {
                subject = data.subject;
                content = data.content;
            }
        });

        if (subject) {
            alert("제목에 금지단어('"+subject+"')가 포함되어있습니다");
            f.wr_subject.focus();
            return false;
        }

        if (content) {
            alert("내용에 금지단어('"+content+"')가 포함되어있습니다");
            if (typeof(ed_wr_content) != "undefined")
                ed_wr_content.returnFalse();
            else
                f.wr_content.focus();
            return false;
        }

        if (document.getElementById("char_count")) {
            if (char_min > 0 || char_max > 0) {
                var cnt = parseInt(check_byte("wr_content", "char_count"));
                if (char_min > 0 && char_min > cnt) {
                    alert("내용은 "+char_min+"글자 이상 쓰셔야 합니다.");
                    return false;
                }
                else if (char_max > 0 && char_max < cnt) {
                    alert("내용은 "+char_max+"글자 이하로 쓰셔야 합니다.");
                    return false;
                }
            }
        }

        <?php echo $captcha_js; // 캡챠 사용시 자바스크립트에서 입력된 캡챠를 검사함  ?>

        document.getElementById("btn_submit").disabled = "disabled";

        return true;
    }




    </script>

<!-- } 게시물 작성/수정 끝 -->
