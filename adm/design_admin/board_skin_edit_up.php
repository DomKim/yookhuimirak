<?php
$sub_menu = "600260";
include_once('./_common.php');

check_demo();

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
auth_check($auth[$sub_menu], 'w');


$name = $_POST['name'];
$common_dir = G5_THEME_PATH."/skin/board/".$name."/";


// CSS 파일업데이트
$css_file_str = $_POST['file_css'];
$css_file = stripslashes($css_file_str);

$file_css = fopen($common_dir."style.css","w");
fwrite($file_css, $css_file);
fclose($file_css);


// 리스트파일 업데이트
$list_file_str = $_POST['list_content'];
$list_file_str_re = str_replace('</ textarea>','</textarea>',$list_file_str);
$list_file = stripslashes($list_file_str_re);

$file_list = fopen($common_dir."list.skin.php","w");
fwrite($file_list, $list_file);
fclose($file_list);


// 뷰페이지 파일 업데이트
$view_file_str = $_POST['view_content'];
$view_file_str_re = str_replace('</ textarea>','</textarea>',$view_file_str);
$view_file = stripslashes($view_file_str_re);

$file_view = fopen($common_dir."view.skin.php","w");
fwrite($file_view, $view_file);
fclose($file_view);


// 댓글 파일 업데이트
$view_comment_file_str = $_POST['view_comment_content'];
$view_comment_file_str_re = str_replace('</ textarea>','</textarea>',$view_comment_file_str);
$view_comment_file = stripslashes($view_comment_file_str_re);

$file_view_comment = fopen($common_dir."view_comment.skin.php","w");
fwrite($file_view_comment, $view_comment_file);
fclose($file_view_comment);


// 글쓰기 페이지 파일 업데이트
$write_file_str = $_POST['write_content'];
$write_file_str_re = str_replace('</ textarea>','</textarea>',$write_file_str);
$write_file = stripslashes($write_file_str_re);

$file_write = fopen($common_dir."write.skin.php","w");
fwrite($file_write, $write_file);
fclose($file_write);


// 글쓰기 업데이트 파일 업데이트
$write_update_file_str = $_POST['write_update_content'];
$write_update_file_str_re = str_replace('</ textarea>','</textarea>',$write_update_file_str);
$write_update_file = stripslashes($write_update_file_str_re);

$file_write_update = fopen($common_dir."write_update.skin.php","w");
fwrite($file_write_update, $write_update_file);
fclose($file_write_update);


// 댓글 업데이트 파일 업데이트
$write_comment_update_file_str = $_POST['write_comment_update_content'];
$write_comment_update_file_str_re = str_replace('</ textarea>','</textarea>',$write_comment_update_file_str);
$write_comment_update_file = stripslashes($write_comment_update_file_str_re);

$file_write_comment_update = fopen($common_dir."write_comment_update.skin.php","w");
fwrite($file_write_comment_update, $write_comment_update_file);
fclose($file_write_comment_update);



$common_dir = G5_THEME_PATH."/skin/board/".$name.'/img';
if(!is_dir($common_dir)){
  mkdir($common_dir);
}

// 이미지 삭제
for ($i=0; $i<count($_POST['img_del']); $i++) {
  @unlink(G5_THEME_PATH."/skin/board/".$name."/img/".$_POST['img_del'][$i]);
}

// 이미지 업로드
for ($k=0; $k<count($_FILES['img_up']['name']); $k++) {
  $dest_path = G5_THEME_PATH."/skin/board/".$name."/img/".$_FILES['img_up']['name'][$k];
  @move_uploaded_file($_FILES['img_up']['tmp_name'][$k], $dest_path);
}


// 업데이트 완료후 페이지 이동
goto_url('./board_skin_edit.php?name='.$name, false);
?>
