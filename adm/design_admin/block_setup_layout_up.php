<?php
if($_GET['name'] == 'mainpage'){
  $sub_menu = "600300";
}else{
  $sub_menu = "600400";
}

include_once('_common.php');

$mode = $_POST['mode'];
$name = $_POST['name'];

$empty = $_POST['empty'];
$head_area = $_POST['head'];
$content_area = $_POST['content'];
$footer_area = $_POST['footer'];
$left_sidebar_area = $_POST['left_sidebar'];
$right_sidebar_area = $_POST['right_sidebar'];
$b_left_sidebar_area = $_POST['b_left_sidebar'];
$b_right_sidebar_area = $_POST['b_right_sidebar'];
$sidebar_position = '|'.$_POST['side_position1'].'|'.$_POST['side_position2'].'|'.$_POST['side_position3'].'|'.$_POST['side_position4'];

// css setting val
$container = $_POST['container'];
$b_left = $_POST['b_left'];
$b_right = $_POST['b_right'];
$left = $_POST['left'];
$right = $_POST['right'];
$page_wrap = $_POST['page_wrap'];
$content_wrap = $_POST['content_wrap'];
$tb = $_POST['tb'];
$mo = $_POST['mo'];
$relative = $_POST['relative'];


// 배열 데이터 나누기
foreach($empty as $item) {
    $empty_val .= "|".$item;
}

foreach($head_area as $item) {
    $head_area_val .= "|".$item;
}

foreach($content_area as $item) {
    $content_area_val .= "|".$item;
}

foreach($footer_area as $item) {
    $footer_area_val .= "|".$item;
}

foreach($left_sidebar_area as $item) {
    $left_sidebar_area_val .= "|".$item;
}

foreach($right_sidebar_area as $item) {
    $right_sidebar_area_val .= "|".$item;
}

foreach($b_left_sidebar_area as $item) {
    $b_left_sidebar_area_val .= "|".$item;
}

foreach($b_right_sidebar_area as $item) {
    $b_right_sidebar_area_val .= "|".$item;
}


if ($_POST['act_button'] == "CSS 설정") {

  $sql = " update g5_layout_css_set set
								css_1 = '".$container."',
                css_2 = '".$b_left."',
                css_3 = '".$b_right."',
                css_4 = '".$left."',
                css_5 = '".$right."',
                css_6 = '".$page_wrap."',
                css_7 = '".$content_wrap."',
                css_8 = '".$tb."',
                css_9 = '".$mo."',
                css_10 = '".$relative."'
								where name = '".$name."'
								 ";

  sql_query($sql);

  goto_url('./block_setup_layout.php?name='.$name.'', false);
}


// 사이드바 설정 업데이트
if ($_POST['act_button'] == "사이드바 설정") {

  $position_val = $sidebar_position;
  $sql = " update g5_content_block_set set
								sidebar_position = '".$position_val."'
								where name = '".$name."'
								 ";

  sql_query($sql);

  goto_url('./block_setup_layout.php?name='.$name.'', false);
}


// 레이아웃 업데이트 설정
if($mode=="UPDATE") {

  if($name != 'mainpage'){
    $sqlA = " select * from g5_content_block_set where name = '".$name."' ";
    $result = sql_fetch($sqlA);

    if(!$result['name']){
      $insert_sql = " insert into g5_content_block_set
                      set name = '".$name."', pagename = '', empty_area = '', head_area = '', content_area = '',
                			footer_area = '', left_sidebar_area = '', right_sidebar_area = '', b_left_sidebar_area = '', b_right_sidebar_area = '',
                      sidebar_position = '' ";

      sql_query($insert_sql);
    }
  }

	$sql = " update g5_content_block_set set
								pagename = '".$pagename."',
								empty_area = '".$empty_val."',
								head_area = '".$head_area_val."',
								content_area = '".$content_area_val."',
								footer_area = '".$footer_area_val."',
								left_sidebar_area = '".$left_sidebar_area_val."',
                right_sidebar_area = '".$right_sidebar_area_val."',
                b_left_sidebar_area = '".$b_left_sidebar_area_val."',
                b_right_sidebar_area = '".$b_right_sidebar_area_val."'
								where name = '".$name."'
								 ";

  sql_query($sql);

	$arr = "OK";
	echo json_encode($arr);
}
?>
