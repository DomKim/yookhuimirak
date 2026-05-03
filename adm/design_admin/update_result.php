<?php
$sub_menu = "700900";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "디자인관리 업데이트";
include_once(G5_ADMIN_PATH.'/admin.head.php');
?>

<form name="fconfigform" id="fconfigform" method="post" action="./update_result_up.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">

버전 : <strong>BETA 3.3 VERSION</strong>
<br><br>
디자인관리 최신버전 업데이트는 수동으로 업데이트 해야 합니다.<br>
깃허브에서 최신버전 다운로드후, zip파일을 업로드 하시면 됩니다.
<br>
<br>
<a href="https://github.com/waanee/gnuadmin/" target="_blank" class="btn btn_02"><strong>github에서 다운로드</strong></a>
<br><br>
<input type="file" name="file_upload" id="file_upload">
<input type="submit" value="업데이트 파일업로드" name="act_button" class="btn_submit btn" accesskey="s">


</form>
<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
