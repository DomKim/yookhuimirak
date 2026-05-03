<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

// 접수폼 관련정보
include('form.lib.php');
// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);
?>
<div class="margin-default">
<h3 class="board_title"><?php echo $board['bo_subject'] ?></h3>
<p><?=$config['cf_title']?>의 <?php echo $board['bo_subject'] ?>입니다.</p>

<section id="bo_w">
    <h2 class="sound_only"><?php echo $g5['title'] ?></h2>

    <!-- 게시물 작성/수정 시작 { -->
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
    <?php
    $option = '';
    $option_hidden = '';
    if ($is_notice || $is_html || $is_secret || $is_mail) {
        $option = '';
        if ($is_notice) {
            $option .= "\n".'<input type="checkbox" id="notice" name="notice" value="1" '.$notice_checked.'>'."\n".'<label for="notice">공지</label>';
        }

        if ($is_html) {
            if ($is_dhtml_editor) {
                $option_hidden .= '<input type="hidden" value="html1" name="html">';
            } else {
                $option .= "\n".'<input type="checkbox" id="html" name="html" onclick="html_auto_br(this);" value="'.$html_value.'" '.$html_checked.'>'."\n".'<label for="html">HTML</label>';
            }
        }

        if ($is_secret) {
            if ($is_admin || $is_secret==1) {
                $option .= "\n".'<input type="checkbox" id="secret" name="secret" value="secret" '.$secret_checked.'>'."\n".'<label for="secret">비밀글</label>';
            } else {
                $option_hidden .= '<input type="hidden" name="secret" value="secret">';
            }
        }

        if ($is_mail) {
            $option .= "\n".'<input type="checkbox" id="mail" name="mail" value="mail" '.$recv_email_checked.'>'."\n".'<label for="mail">답변메일받기</label>';
        }
    }

    echo $option_hidden;
    ?>

    <?php if ($is_category) { ?>
    <div class="bo_w_select write_div">
        <label for="ca_name"  class="sound_only">분류<strong>필수</strong></label>
        <select name="ca_name" id="ca_name" required>
            <option value="">분류를 선택하세요</option>
            <?php echo $category_option ?>
        </select>
    </div>
    <?php } ?>

    <div class="bo_w_info write_div">
    <?php if ($is_name) { ?>
        <input type="text" name="wr_name" value="<?php echo $name ?>" id="wr_name" required class="frm_input required" placeholder="이름" style="width:45%;">
    <?php } ?>

    <?php if ($is_password) { ?>
        <input type="password" name="wr_password" id="wr_password" <?php echo $password_required ?> class="frm_input <?php echo $password_required ?>" placeholder="비밀번호" style="width:45%;">
    <?php } ?>
    </div>



    <?php
    // 전송할 게시판의 여분필드갯수와 연동. 게시판이 연동 되어있지 않을경우, 기본10개 표시.

    for($i = 1; $i <= $filedCount; $i++){
      if($filed_name_[$i]){

        if($filed_type_[$i] == 'selectbox' || $filed_type_[$i] == 'checkbox' || $filed_type_[$i] == 'radio'){
          $type = 'select';
          $wr_val_arr = explode('|',$form_filed['wr_'.$i.'_val']);
          $wr_val_count = count($wr_val_arr);
        }else{
          $type = 'text';
        }

    if($filed_admin_[$i] == 'y'){
      if($is_admin){
    ?>
    <div class="write_div">
      <table style="width:100%;">
        <colgroup>
          <col width="150px">
          <col width="">
        </colgroup>
        <tr>
          <td><?=$filed_name_[$i]?></td>
          <td>
            <?php
            if($type == 'select'){
              if($filed_type_[$i] == 'selectbox'){
                if($filed_required_[$i]=='y'){ $required = 'required'; }
                echo '<select name="wr_'.$i.'" class="uk-select" '.$required.'>';
                echo '<option>선택하세요</option>';
              }
              for($j = 0; $j < $wr_val_count; $j++){
                $wr_val_name = $wr_val_arr[$j];
                // 체크박스 일때
                if($filed_type_[$i] == 'checkbox'){
                  $checkbox_val_arr = explode('|',$write['wr_'.$i]);
                ?>
                <input type="checkbox" name="wr<?=$i?>[]" value="<?=$wr_val_name?>" <?php if($checkbox_val_arr[$j] == $wr_val_name){echo 'checked';}?>> <?=$wr_val_name?>
                <input type="hidden" name="wr<?=$i?>_hidden[]" value="<?=$wr_val_name?>">
                <?php
              }else if($filed_type_[$i] == 'radio'){
                ?>
                <input type="radio" name="wr_<?=$i?>" value="<?=$wr_val_name?>" <?php if($wr_val_name == $write['wr_'.$i]){echo 'checked';}?> <?php if($filed_required_[$i]=='y'){?>required<?php }?>> <?=$wr_val_name?>
                <?php
              }else if($filed_type_[$i] == 'selectbox'){
                ?>
                <option value="<?=$wr_val_name?>" <?php if($wr_val_name == $write['wr_'.$i]){echo 'selected';}?>> <?=$wr_val_name?></option>
                <?php
              }
                //echo $wr_val_name;
              }
              if($filed_type_[$i] == 'selectbox'){
                echo '</select>';
              }
            }else{
            ?>
            <input type="<?=$filed_type_[$i]?>" name="wr_<?=$i?>" class="frm_input full_input <?php if($filed_required_[$i]=='y'){?>required<?php }?>" <?php if($filed_required_[$i]=='y'){?>required<?php }?> value="<?=$write['wr_'.$i]?>" placeholder="<?=$filed_pl_[$i]?>">
            <?php }?>
          </td>
        </tr>
      </table>
    </div>
    <?php } }else{ ?>
      <div class="write_div">
        <table style="width:100%;">
          <colgroup>
            <col width="150px">
            <col width="">
          </colgroup>
          <tr>
            <td><?=$filed_name_[$i]?></td>
            <td>
              <?php
              if($type == 'select'){
                if($filed_type_[$i] == 'selectbox'){
                  if($filed_required_[$i]=='y'){ $required = 'required'; }
                  echo '<select name="wr_'.$i.'" class="uk-select" '.$required.'>';
                  echo '<option>선택하세요</option>';
                }
                for($j = 0; $j < $wr_val_count; $j++){
                  $wr_val_name = $wr_val_arr[$j];
                  // 체크박스 일때
                  if($filed_type_[$i] == 'checkbox'){
                    $checkbox_val_arr = explode('|',$write['wr_'.$i]);
                  ?>
                  <input type="checkbox" name="wr<?=$i?>[]" value="<?=$wr_val_name?>" <?php if($checkbox_val_arr[$j] == $wr_val_name){echo 'checked';}?>> <?=$wr_val_name?>
                  <input type="hidden" name="wr<?=$i?>_hidden[]" value="<?=$wr_val_name?>">
                  <?php
                }else if($filed_type_[$i] == 'radio'){
                  ?>
                  <input type="radio" name="wr_<?=$i?>" value="<?=$wr_val_name?>" <?php if($wr_val_name == $write['wr_'.$i]){echo 'checked';}?> <?php if($filed_required_[$i]=='y'){?>required<?php }?>> <?=$wr_val_name?>
                  <?php
                }else if($filed_type_[$i] == 'selectbox'){
                  ?>
                  <option value="<?=$wr_val_name?>" <?php if($wr_val_name == $write['wr_'.$i]){echo 'selected';}?>> <?=$wr_val_name?></option>
                  <?php
                }
                  //echo $wr_val_name;
                }
                if($filed_type_[$i] == 'selectbox'){
                  echo '</select>';
                }
                
              }else{
              ?>
              <input type="<?=$filed_type_[$i]?>" name="wr_<?=$i?>" class="frm_input full_input <?php if($filed_required_[$i]=='y'){?>required<?php }?>" <?php if($filed_required_[$i]=='y'){?>required<?php }?> value="<?=$write['wr_'.$i]?>" placeholder="<?=$filed_pl_[$i]?>">
              <?php }?>
            </td>
          </tr>
        </table>
      </div>
    <?php
        }
      }
    }
    ?>


    <?php
    if($wr_subject_hidden == 'y'){
    ?>
    <input type="hidden" name="wr_subject" value="<?php echo $wr_subject_default ?>" id="wr_subject">
  <?php }else{?>
    <div class="bo_w_tit write_div">
        <label for="wr_subject" class="sound_only">제목<strong>필수</strong></label>

        <div id="autosave_wrapper write_div">
            <input type="text" name="wr_subject" value="<?php echo $subject ?>" id="wr_subject" required class="frm_input full_input required" size="50" maxlength="255" placeholder="<?php if($wr_subject_name){ echo $wr_subject_name;}else{echo '제목';}?>">
            <?php if ($is_member) { // 임시 저장된 글 기능 ?>
            <script src="<?php echo G5_JS_URL; ?>/autosave.js"></script>
            <?php if($editor_content_js) echo $editor_content_js; ?>
            <button type="button" id="btn_autosave" class="btn_frmline">임시 저장된 글 (<span id="autosave_count"><?php echo $autosave_count; ?></span>)</button>
            <div id="autosave_pop">
                <strong>임시 저장된 글 목록</strong>
                <ul></ul>
                <div><button type="button" class="autosave_close">닫기</button></div>
            </div>
            <?php } ?>
        </div>

    </div>
  <?php }?>


  <?php
  if($wr_content_hidden == 'y'){
  ?>
  <input type="hidden" name="wr_content" value="<?=$wr_content_default?>" >
<?php }else{?>
    <div class="write_div">
        <label for="wr_content" class="sound_only">내용<strong>필수</strong></label>
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
  <?php }?>


    <?php
    if($form_filed['form_link'] == 'y'){
      for ($i=1; $is_link && $i<=G5_LINK_COUNT; $i++) { ?>
      <div class="bo_w_link write_div">
          <label for="wr_link<?php echo $i ?>"><i class="fa fa-link" aria-hidden="true"></i><span class="sound_only"> 링크  #<?php echo $i ?></span></label>
          <input type="text" name="wr_link<?php echo $i ?>" value="<?php if($w=="u"){echo$write['wr_link'.$i];} ?>" id="wr_link<?php echo $i ?>" class="frm_input full_input" size="50">
      </div>
    <?php }} ?>

    <?php
    if($form_filed['form_file'] == 'y'){
      for ($i=0; $is_file && $i<$file_count; $i++) { ?>
      <div class="bo_w_flie write_div">
          <div class="file_wr write_div">
              <label for="bf_file_<?php echo $i+1 ?>" class="lb_icon"><i class="fa fa-download" aria-hidden="true"></i><span class="sound_only"> 파일 #<?php echo $i+1 ?></span></label>
              <input type="file" name="bf_file[]" id="bf_file_<?php echo $i+1 ?>" title="파일첨부 <?php echo $i+1 ?> : 용량 <?php echo $upload_max_filesize ?> 이하만 업로드 가능" class="frm_file ">
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
    <?php }} ?>


    <?php if ($is_use_captcha) { //자동등록방지  ?>
    <div class="write_div">
        <?php echo $captcha_html ?>
    </div>
    <?php } ?>


    <div class="btn_confirm write_div">
        <a href="./board.php?bo_table=<?php echo $bo_table ?>" class="btn_cancel btn">취소</a>
        <input type="submit" value="작성완료" id="btn_submit" accesskey="s" class="btn_submit btn">
    </div>
    </form>

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
</section>
<!-- } 게시물 작성/수정 끝 -->
</div>
