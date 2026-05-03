<?php
$sub_menu = "600200";
include_once('_common.php');

//추가 라이브러리 가져오기
include_once(G5_ADMIN_PATH.'/design_admin/lib/newlib.php');


auth_check($auth[$sub_menu], 'r');



// 접수폼 연동 관련된 DB 가져오기.
$form_data_file = G5_THEME_PATH."/template/".$_GET['name']."/form_data.php";
if (file_exists($form_data_file)){
  include_once($form_data_file);
}

$check = $form_filed['board'];
?>
  <link rel="stylesheet" href="<?php echo G5_ADMIN_URL ?>/css/admin.css">
  <link rel="stylesheet" href="<?php echo G5_ADMIN_URL ?>/css/c3.min.css?ver=171222">
  <link rel="stylesheet" href="<?php echo G5_ADMIN_URL ?>/css/uikit.min.css?ver=171222">
  <link rel="stylesheet" href="<?php echo G5_ADMIN_URL ?>/css/admin_extend_new.css?ver=171222">
  <style>
    body {
      background: #fff;
      font-size: 13px !important;
    }

    .uk-modal-body {
      background: #fff;
      font-size: 13px !important;
    }

    table td,
    table td:last-child {
      font-size: 12px;
    }
  </style>
  <script src="<?php echo G5_URL ?>/js/jquery-1.12.4.min.js"></script>
  <script src="<?php echo G5_ADMIN_URL ?>/js/uikit.min.js"></script>
  <script src="<?php echo G5_ADMIN_URL ?>/js/uikit-icons.min.js"></script>

  <div class="uk-modal-body">
    <form name="fconfigform" method="post" action="./form_setup_update.php" onsubmit="return fconfigform_submit(this);">
      <input type="hidden" name="name" value="<?=$_GET['name']?>">
      <?php
  if($check){
    $selectColor = '<font color="red">사용중</font>';
    $submitVal = '수정';
  }else{
    $selectColor = '<font>사용안함</font>';
    $submitVal = '설정';
  }
  ?>
        <h2 class="uk-modal-title">접수폼 연동 (<?=$selectColor?>) </h2>
        <?php if($check){?>
        <span style="float:right;"><a href="<?=G5_BBS_URL?>/board.php?bo_table=<?=$form_filed['board']?>" target="_blank">연동된 게시판으로 이동</a></span>
        <?php }?>
        <span class="frm_info">
    접수폼은 보안상 항상 kcaptcha 입력을 사용합니다.<br>
    kcaptcha 설정은 환경설정 > 기본환경설정 > 캡챠 선택 에서 설정가능합니다.<br>
    전송할 게시판의 스킨은 반드시 ' (테마)form_design '으로 설정 해야 합니다.
  </span>

        <div>
          <table>
            <colgroup>
              <col width="130px">
              <col>
            </colgroup>

            <tr>
              <td>전송할 게시판</td>
              <td>
                <?PHP
          // 게시판 이름과 값 가져오기.
          $board_query = 'select * from g5_board';
          $board_sql = sql_query($board_query);
          ?>
                  <select name="board" id="board" class="uk-select">
            <option>선택해주세요.</option>
            <?php
            for ($k=0; $board_row=sql_fetch_array($board_sql); $k++) {
            ?>
            <option value="<?=$board_row['bo_table']?>" <?php if($board_row['bo_table'] == $form_filed['board']){ echo 'selected';}?>><?=$board_row['bo_subject']?></option>
            <?php }?>
          </select>
              </td>
            </tr>

            <tr>
              <td>uikit 사용</td>
              <td style="text-align:left;">

                <input type="radio" name="form_uikit" class="uk-radio" value="n" <?php if($form_filed['form_uikit']=='n' ){ echo 'checked'; }?> > 사용안함
                <input type="radio" name="form_uikit" class="uk-radio" value="y" <?php if($form_filed['form_uikit']=='y' ){ echo 'checked'; }?> > 사용함
                <span class="frm_info margin-10">uikit 사용시 input 스타일을 변경합니다.</span>
              </td>
            </tr>

            <tr>
              <td>비밀글 사용</td>
              <td style="text-align:left;">

                <input type="radio" name="form_secret" class="uk-radio" value="n" <?php if($form_filed['form_secret']=='n' ){ echo 'checked'; }?> > 사용안함
                <input type="radio" name="form_secret" class="uk-radio" value="y" <?php if($form_filed['form_secret']=='y' ){ echo 'checked'; }?> > 사용함
                <span class="frm_info margin-10">비밀글 사용시 전송폼에 비밀번호 입력란이 생성 됩니다.</span>
              </td>
            </tr>

            <tr>
              <td>자동글방지 사용</td>
              <td style="text-align:left;">

                <input type="radio" name="form_chaptcha" class="uk-radio" value="n" <?php if($form_filed['form_chaptcha']=='n' ){ echo 'checked'; }?> > 사용안함
                <input type="radio" name="form_chaptcha" class="uk-radio" value="y" <?php if($form_filed['form_chaptcha']=='y' ){ echo 'checked'; }?> > 사용함
                <span class="frm_info margin-10">자동글방지를 사용권장 합니다. 사용하지 않을경우, 스팸글이 쌓일수 있습니다.</span>
              </td>
            </tr>

            <tr>
              <td>링크 사용</td>
              <td style="text-align:left;">

                <input type="radio" name="form_link" class="uk-radio" value="n" <?php if($form_filed['form_link']=='n' ){ echo 'checked'; }else {echo 'checked';}?> > 사용안함
                <input type="radio" name="form_link" class="uk-radio" value="y" <?php if($form_filed['form_link']=='y' ){ echo 'checked'; }?> > 사용함

                <div id="" class="margin-10">
                  링크 1
                  <input type="text" name="form_link_1_title" class="uk-input" placeholder="제목" value="<?=$form_filed['form_link_1_title']?>">
                  링크 2
                  <input type="text" name="form_link_2_title" class="uk-input" placeholder="제목" value="<?=$form_filed['form_link_2_title']?>">
                </div>
                <span class="frm_info margin-10">링크제목에 입력된 내용만 반영합니다.</span>
              </td>
            </tr>

            <tr>
              <td>파일첨부 사용</td>
              <td style="text-align:left;">
                <input type="radio" name="form_file" class="uk-radio" value="n" <?php if($form_filed['form_file']=='n' ){ echo 'checked'; }else {echo 'checked';}?> > 사용안함
                <input type="radio" name="form_file" class="uk-radio" value="y" <?php if($form_filed['form_file']=='y' ){ echo 'checked'; }?> > 사용함

                <div id="" class="margin-10">
                  파일1
                  <input type="text" name="form_filename" class="uk-input" placeholder="제목" value="<?=$form_filed['form_filename']?>">
                  파일2
                  <input type="text" name="form_filename2" class="uk-input" placeholder="제목" value="<?=$form_filed['form_filename2']?>">
                </div>
                <span class="frm_info margin-10">파일제목에 입력된 내용만 반영합니다.</span>
              </td>
            </tr>

            <tr>
              <td>작성완료시 문구</td>
              <td style="text-align:left;">


                <div id="" class="margin-10">
                  <input type="text" name="form_success_info" class="uk-input" placeholder="" value="<?php if($form_filed['form_success_info']){ echo $form_filed['form_success_info'];} else { echo '접수가 완료되었습니다.';}?>">
                </div>
                <span class="frm_info margin-10">접수폼 작성완료시 문구를 입력해주세요.</span>
              </td>
            </tr>


            <?php
      // 전송할 게시판의 여분필드갯수와 연동. 게시판이 연동 되어있지 않을경우, 기본10개 표시.
      if($form_filed['board']){
        include_once(G5_ADMIN_PATH.'/design_admin/board_wr_filedCount.php');
      }else{
        $filedCount = 10;
      }

      for($i = 1; $i <= $filedCount; $i++){
        $filed_arr_[$i] = explode('|',$form_filed['wr_'.$i]);
        $filed_name_[$i] = $filed_arr_[$i][0];
        $filed_type_[$i] = $filed_arr_[$i][1];
        $filed_pl_[$i] = $filed_arr_[$i][2];
        $filed_default_[$i] = $filed_arr_[$i][3];
        $filed_required_[$i] = $filed_arr_[$i][4];
        $filed_admin_[$i] = $filed_arr_[$i][5];
      ?>
              <tr style="border-top:1px solid #ddd;">
                <td>wr_
                  <?=$i?>
                </td>
                <td style="text-align:left;">
                  <input type="text" name="wr_<?=$i?>_name" class="uk-input" placeholder="필드명" value="<?=$filed_name_[$i]?>"> <br>
                  <select class="uk-select margin-10" name="wr_<?=$i?>_type" id="wr_<?=$i?>_type" onchange="changetype('<?=$i?>')">
            <option>선택해주세요.</option>
            <option value="text" <?php if($filed_type_[$i] == 'text'){echo 'selected';}?>>한줄텍스트 (text)</option>
            <option value="checkbox" <?php if($filed_type_[$i] == 'checkbox'){echo 'selected';}?>>체크박스 (checkbox)</option>
            <option value="selectbox" <?php if($filed_type_[$i] == 'selectbox'){echo 'selected';}?>>선택박스 (selectbox)</option>
            <option value="radio" <?php if($filed_type_[$i] == 'radio'){echo 'selected';}?>>라디오 (radio)</option>
            <option value="tel" <?php if($filed_type_[$i] == 'tel'){echo 'selected';}?>>전화번호 입력</option>
          </select>
                  <?php
          if($filed_type_[$i] == 'checkbox' || $filed_type_[$i] == 'selectbox' || $filed_type_[$i] == 'radio'){
            $display = 'style="display:block"';
          }else { $display = 'style="display:none"'; }
          ?>
                    <div id="wr_<?=$i?>_val" <?=$display?>>
                      <input type="text" name="wr_<?=$i?>_val" class="uk-input margin-10" placeholder=" | 로 구분하여 적어주세요" value="<?=$form_filed['wr_'.$i.'_val']?>">
                    </div>
                    <input type="text" name="wr_<?=$i?>_pl" class="uk-input margin-10" placeholder="자리표시자" value="<?=$filed_pl_[$i]?>">
                    <input type="text" name="wr_<?=$i?>_default" class="uk-input margin-10" placeholder="기본값" value="<?=$filed_default_[$i]?>">
                    <div class="margin-10">
                      필수입력
                      <input type="radio" name="wr_<?=$i?>_required" class="uk-radio" value="n" <?php if($filed_required_[$i]=='n' ){echo 'checked';}else{echo 'checked';}?> > 사용안함
                      <input type="radio" name="wr_<?=$i?>_required" class="uk-radio" value="y" <?php if($filed_required_[$i]=='y' ){echo 'checked';}?> > 사용함
                    </div>

                    <div class="margin-10">
                      관리자 입력
                      <input type="radio" name="wr_<?=$i?>_admin" class="uk-radio" value="n" <?php if($filed_admin_[$i]=='n' ){echo 'checked';}else{echo 'checked';}?> > 사용안함
                      <input type="radio" name="wr_<?=$i?>_admin" class="uk-radio" value="y" <?php if($filed_admin_[$i]=='y' ){echo 'checked';}?> > 사용함
                    </div>
                </td>
              </tr>
              <?php }?>

              <?php
      $subject_filed_arr = explode('|',$form_filed['wr_subject']);
      $wr_subject_name = $subject_filed_arr[0];
      $wr_subject_pl = $subject_filed_arr[1];
      $wr_subject_default = $subject_filed_arr[2];
      $wr_subject_hidden = $subject_filed_arr[3];
      ?>
                <tr style="border-top:1px solid #ddd;">
                  <td>wr_subject<br>제목</td>
                  <td style="text-align:left;">
                    <input type="text" name="wr_subject_name" class="uk-input" placeholder="필드명" value="<?=$wr_subject_name?>">
                    <!--<input type="text" name="wr_subject_pl" class="uk-input margin-10" placeholder="자리표시자" value="<?=$wr_subject_pl?>">-->
                    <input type="text" name="wr_subject_default" class="uk-input margin-10" placeholder="기본값" value="<?=$wr_subject_default?>">

                    <div class="margin-10">
                      입력란 숨기기
                      <input type="radio" name="wr_subject_hidden" class="uk-radio" value="n" <?php if($wr_subject_hidden=='n' ){echo 'checked';}else{echo 'checked';}?> > 사용안함
                      <input type="radio" name="wr_subject_hidden" class="uk-radio" value="y" <?php if($wr_subject_hidden=='y' ){echo 'checked';}?> > 사용함
                    </div>

                  </td>
                </tr>

                <?php
      $content_filed_arr = explode('|',$form_filed['wr_content']);
      $wr_content_name = $content_filed_arr[0];
      $wr_content_pl = $content_filed_arr[1];
      $wr_content_default = $content_filed_arr[2];
      $wr_content_hidden = $content_filed_arr[3];
      ?>
                  <tr style="border-top:1px solid #ddd;">
                    <td>wr_content<br>내용</td>
                    <td style="text-align:left;">
                      <input type="text" name="wr_content_name" class="uk-input" placeholder="필드명" value="<?=$wr_content_name?>">
                      <!--<input type="text" name="wr_content_pl" class="uk-input margin-10" placeholder="자리표시자" value="<?=$wr_content_pl?>">-->
                      <input type="text" name="wr_content_default" class="uk-input margin-10" placeholder="기본값" value="<?=$wr_content_default?>">

                      <div class="margin-10">
                        입력란 숨기기
                        <input type="radio" name="wr_content_hidden" class="uk-radio" value="n" <?php if($wr_content_hidden=='n' ){echo 'checked';}else{echo 'checked';}?> > 사용안함
                        <input type="radio" name="wr_content_hidden" class="uk-radio" value="y" <?php if($wr_content_hidden=='y' ){echo 'checked';}?> > 사용함
                      </div>

                    </td>
                  </tr>


                  <!-- SMS(아이코드) 연동추가 -->
                  <tr style="border-top:2px solid #ddd;">
                    <td>SMS(아이코드) 연동</td>
                    <td style="text-align:left;">

                      <span class="frm_info margin-10">
                        SMS(아이코드) 신청및 설정이 완료되었을때 동작합니다.<br>
                        <a href="<?=G5_ADMIN_URL?>/sms_admin/config.php" target="_parent">관리자>SMS 관리>SMS 기본설정</a>
                      </span>

                      <div class="margin-10">
                        사용여부
                        <input type="radio" name="wr_sms_check" class="uk-radio" value="n" <?php if($form_filed[wr_sms_check]=='n' ){echo 'checked';}else{echo 'checked';}?> > 사용안함
                        <input type="radio" name="wr_sms_check" class="uk-radio" value="y" <?php if($form_filed[wr_sms_check]=='y' ){echo 'checked';}?> > 사용함
                      </div>

                      <div class="margin-10">
                        링크주소 받기
                        <input type="radio" name="wr_sms_type" class="uk-radio" value="S" <?php if($form_filed[wr_sms_type]=='S' ){echo 'checked';}else{echo 'checked';}?> > 사용안함
                        <input type="radio" name="wr_sms_type" class="uk-radio" value="L" <?php if($form_filed[wr_sms_type]=='L' ){echo 'checked';}?> > 사용함
                      </div>

                      <span class="frm_info margin-10">
                        링크주소를 받을경우 LMS 으로 보내집니다.
                      </span>

                      <input type="text" name="wr_sms_send" class="uk-input margin-10" placeholder="보내는 전화번호" value="<?=$form_filed[wr_sms_send]?>">
                      <input type="text" name="wr_sms_recv" class="uk-input margin-10" placeholder="받는 전화번호" value="<?=$form_filed[wr_sms_recv]?>">


                    </td>
                  </tr>

          </table>

          <div style="text-align:center; padding:20px 0px;">
            <input type="submit" value="<?=$submitVal?>" name="act_button" id="setup" class="btn_submit btn" accesskey="s">
            <input type="submit" value="삭제" name="act_button" class="btn_submit btn" accesskey="s">
          </div>

        </div>
    </form>
  </div>

  <!-- 타입선택시 필드추가. -->
  <script>
    function changetype(id) {
      console.log($('#wr_' + id + '_type').val());
      if ($('#wr_' + id + '_type').val() == 'selectbox' || $('#wr_' + id + '_type').val() == 'checkbox' || $('#wr_' + id + '_type').val() == 'radio') {
        $('#wr_' + id + '_val').show();
      } else {
        $('#wr_' + id + '_val').hide();
      }
    }
  </script>
