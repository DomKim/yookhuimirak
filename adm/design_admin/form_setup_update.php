<?php
$sub_menu = "600200";
include_once('./_common.php');

check_demo();

$name = $_POST['name'];

//////////////////////////////////////////////////////////////////
// 접수폼 설정및 수정
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "설정" || $_POST['act_button'] == "수정") {

  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'w');

  $name = $_POST['name'];
  $board = $_POST['board'];

  $form_uikit = $_POST['form_uikit'];
  $form_secret = $_POST['form_secret'];
  $form_chaptcha = $_POST['form_chaptcha'];

  $form_link = $_POST['form_link'];
  $form_link_1_title = $_POST['form_link_1_title'];
  $form_link_2_title = $_POST['form_link_2_title'];

  $form_file = $_POST['form_file'];
  $form_filename = $_POST['form_filename'];
  $form_filename2 = $_POST['form_filename2'];

  $form_success_info = $_POST['form_success_info'];

  $wr_sms_check = $_POST['wr_sms_check'];
  $wr_sms_send = $_POST['wr_sms_send'];
  $wr_sms_recv = $_POST['wr_sms_recv'];
  $wr_sms_type = $_POST['wr_sms_type'];

  $wr_subject = $_POST['wr_subject_name'].'|'.$_POST['wr_subject_pl'].'|'.$_POST['wr_subject_default'].'|'.$_POST['wr_subject_hidden'];
  $wr_content = $_POST['wr_content_name'].'|'.$_POST['wr_content_pl'].'|'.$_POST['wr_content_default'].'|'.$_POST['wr_content_hidden'];


  // 전송할 게시판의 여분필드갯수와 연동. 게시판이 연동 되어있지 않을경우, 기본10개 표시.
  if($_POST['board']){
    $extend_column = "SELECT count(*) cnt FROM INFORMATION_SCHEMA.COLUMNS
    WHERE COLUMN_NAME LIKE '%wr_%' AND TABLE_NAME = 'g5_write_".$_POST[board]."'
    AND COLUMN_NAME
    NOT IN ('wr_id','wr_num','wr_reply','wr_parent','wr_is_comment','wr_comment','wr_comment_reply','ca_name','wr_option','wr_subject','wr_content','wr_link1','wr_link2','wr_link1_hit','wr_link2_hit','wr_hit','wr_good','wr_nogood','mb_id','wr_password','wr_name','wr_email','wr_homepage','wr_datetime','wr_file','wr_last','wr_ip','wr_facebook_user','wr_twitter_user')";
    $cnt = sql_fetch($extend_column);
    $filedCount = $cnt['cnt'];
  }else{
    $filedCount = 10;
  }


  for($i = 1; $i <= $filedCount; $i++){
    $wr_name[$i] = $_POST['wr_'.$i.'_name'];
    $wr_type[$i] = $_POST['wr_'.$i.'_type'];
    $wr_pl[$i] = $_POST['wr_'.$i.'_pl'];
    $wr_default[$i] = $_POST['wr_'.$i.'_default'];
    $wr_required[$i] = $_POST['wr_'.$i.'_required'];
    $wr_admin[$i] = $_POST['wr_'.$i.'_admin'];

    $wr_[$i] = $wr_name[$i].'|'.$wr_type[$i].'|'.$wr_pl[$i].'|'.$wr_default[$i].'|'.$wr_required[$i].'|'.$wr_admin[$i];

    $wr_val_[$i] = $_POST['wr_'.$i.'_val'];

    $wr_add .= '
    $form_filed[wr_'.$i.'] = "'.$wr_[$i].'";
    $form_filed[wr_'.$i.'_val] = "'.$wr_val_[$i].'";
    ';
  }


  $common_dir = G5_THEME_PATH."/template/".$name."/";
  // 접수폼 데이터파일 생성
  $file = fopen($common_dir."form_data.php","w");
  fwrite($file, '<?php
// 접수폼 데이터
$form_filed[name] = "'.$name.'";
$form_filed[board] = "'.$board.'";
$form_filed[form_uikit] = "'.$form_uikit.'";
$form_filed[form_secret] = "'.$form_secret.'";
$form_filed[form_chaptcha] = "'.$form_chaptcha.'";
$form_filed[form_link] = "'.$form_link.'";
$form_filed[form_link_1_title] = "'.$form_link_1_title.'";
$form_filed[form_link_2_title] = "'.$form_link_2_title.'";
$form_filed[form_file] = "'.$form_file.'";
$form_filed[form_filename] = "'.$form_filename.'";
$form_filed[form_filename2] = "'.$form_filename2.'";
$form_filed[form_success_info] = "'.$form_success_info.'";
$form_filed[wr_subject] = "'.$wr_subject.'";
$form_filed[wr_content] = "'.$wr_content.'";
$form_filed[wr_sms_check] = "'.$wr_sms_check.'";
$form_filed[wr_sms_send] = "'.$wr_sms_send.'";
$form_filed[wr_sms_recv] = "'.$wr_sms_recv.'";
$form_filed[wr_sms_type] = "'.$wr_sms_type.'";
'.$wr_add.'
?>');
  fclose($file);

  $form_sql = "update g5_content_block set form_board = '".$board."' where block_name = '".$name."'";
  sql_query($form_sql);


  include_once('./form_setup_update_addhtml.php');
}




//////////////////////////////////////////////////////////////////
// 접수폼데이터 삭제
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "삭제") {

  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'w');

  // 데이터파일 삭제
  $del_dir = G5_THEME_PATH."/template/".$name; // 삭제 대상 폴더
  @unlink($del_dir.'/form_data.php');

  $form_sql = "update g5_content_block set form_board = NULL where block_name = '".$name."'";
  sql_query($form_sql);

}


// 업데이트 완료후 페이지 이동
goto_url('./form_setup.php?name='.$name, false);
?>
