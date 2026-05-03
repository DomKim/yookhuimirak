<?php
$sub_menu = "700100";
include_once('./_common.php');

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');


//////////////////////////////////////////////////////////////////
// RSS/사이트맵 설정 저장
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == '설정') {

  $rss_description = $_POST['rss_description'];
  $rss_count = $_POST['rss_count'];
  $rss_result = $_POST['rss_result'];
  $rss_result_count = $_POST['rss_result_count'];
  $sitemap_count = $_POST['sitemap_count'];
  $sitemap_result = $_POST['sitemap_result'];
  $sitemap_result_count = $_POST['sitemap_result_count'];

  for($i=0; $i<count($rss_result_count); $i++){
    $rss_result_sum .= $rss_result[$i].'|';
  }

  for($j=0; $j<count($sitemap_result_count); $j++){
    $sitemap_result_sum .= $sitemap_result[$j].'|';
  }

  $sql = " update g5_rss_sitemap set
              rss_descript = '".$rss_description."',
              rss_count = '".$rss_count."',
              rss_result = '".$rss_result_sum."',
              sitemap_count = '".$sitemap_count."',
              sitemap_result = '".$sitemap_result_sum."'
              where id = '1' ";

  sql_query($sql);

  alert('RSS/사이트맵정보가 수정되었습니다.');
}



// 업데이트 완료후 페이지 이동
goto_url('./rss_sitemap.php', false);
?>
