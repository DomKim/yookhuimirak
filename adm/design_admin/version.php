<?php
$sub_menu = "600060";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "디자인관리 버전";
include_once(G5_ADMIN_PATH.'/admin.head.php');
?>
<br>
<!-- 최신패치파일이 있는지 확인하고 새로운 버전이 있으면, 확인시켜준다. -->
버전 : <strong>BETA VERSION</strong>
<br><br>
최신버전 디자인관리를 다운받으실 경우, 아래 링크에서 다운로드 후 사용 하시면 됩니다.
<br><br>
<a href="https://github.com/waanee/gnuadmin/" target="_blank" class="btn btn_02"><strong>github에서 다운로드</strong></a>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
