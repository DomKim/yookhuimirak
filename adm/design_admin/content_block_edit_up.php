<?php
$sub_menu = "600200";
include_once('./_common.php');

check_demo();

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
auth_check($auth[$sub_menu], 'w');

// POST 데이터 안전하게 수신 (따옴표 추가 및 isset 체크)
$name = isset($_POST['name']) ? $_POST['name'] : '';
if(!$name) alert('잘못된 접근입니다.');

$css_file_str = isset($_POST['file_css']) ? $_POST['file_css'] : '';
$css_file = stripslashes($css_file_str);

$html_file_str = isset($_POST['file_html']) ? $_POST['file_html'] : '';
$html_file_str_re = str_replace('</ textarea>', '</textarea>', $html_file_str);
$html_file = stripslashes($html_file_str_re);

$js_file_str = isset($_POST['file_js']) ? $_POST['file_js'] : '';
$js_file_str_re = str_replace('</ textarea>', '</textarea>', $js_file_str);
$js_file = stripslashes($js_file_str_re);

$common_dir = G5_THEME_PATH."/template/".$name."/";

// 디렉토리가 없는 경우 생성 방어 코드
if(!is_dir($common_dir)){
    mkdir($common_dir, G5_DIR_PERMISSION, true);
}

// 내용 업데이트
$file_css = fopen($common_dir."style.css", "w");
if($file_css) {
    fwrite($file_css, $css_file);
    fclose($file_css);
}

$file_html = fopen($common_dir."index.html", "w");
if($file_html) {
    fwrite($file_html, $html_file);
    fclose($file_html);
}

$file_js = fopen($common_dir."script.js", "w");
if($file_js) {
    fwrite($file_js, $js_file);
    fclose($file_js);
}

$img_dir = G5_THEME_PATH."/template/".$name.'/images';
if(!is_dir($img_dir)){
    mkdir($img_dir, G5_DIR_PERMISSION, true);
}

// 이미지 삭제 (PHP 8 count 에러 방지)
if (isset($_POST['img_del']) && is_array($_POST['img_del'])) {
    for ($i=0; $i<count($_POST['img_del']); $i++) {
        $del_file = $_POST['img_del'][$i];
        if($del_file) {
            @unlink($img_dir."/".$del_file);
        }
    }
}

// 이미지 업로드 (PHP 8 count 에러 방지)
if (isset($_FILES['img_up']['name']) && is_array($_FILES['img_up']['name'])) {
    for ($k=0; $k<count($_FILES['img_up']['name']); $k++) {
        if(!$_FILES['file_upload']['name'][$k]) continue; // 파일명이 없으면 스킵
        
        $dest_path = $img_dir."/".$_FILES['img_up']['name'][$k];
        @move_uploaded_file($_FILES['img_up']['tmp_name'][$k], $dest_path);
    }
}

// 업데이트 완료후 페이지 이동
goto_url('./content_block_edit.php?name='.urlencode($name), false);
?>