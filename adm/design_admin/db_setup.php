<?php
$sub_menu = "600050";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "DB 설치";
include_once(G5_ADMIN_PATH.'/admin.head.php');

$is_check = false;

$g5['content_block'] = G5_TABLE_PREFIX.'content_block'; // 컨텐츠블럭 테이블
$g5['content_block_set'] = G5_TABLE_PREFIX.'content_block_set'; // 컨텐츠블럭 테이블
$g5['layout_css_set'] = G5_TABLE_PREFIX.'layout_css_set'; // CSS스타일 테이블
$g5['block_setup'] = G5_TABLE_PREFIX.'block_setup'; // 메인 css, js 사용여부 테이블
$g5['block_setup_meta'] = G5_TABLE_PREFIX.'block_setup_meta'; // 메타태그 추가 테이블
$g5['form_setup'] = G5_TABLE_PREFIX.'form_setup'; // 접수폼 테이블
$g5['admin_menu'] = G5_TABLE_PREFIX.'admin_menu'; // 관리자페이지 메뉴
$g5['rss_sitemap'] = G5_TABLE_PREFIX.'rss_sitemap'; // rss_sitemap 셋팅

// 컨텐츠 블럭 DB생성
if( isset($g5['content_block']) && !sql_query(" DESC {$g5['content_block']} ", false)) {
    sql_query(" CREATE TABLE IF NOT EXISTS `{$g5['content_block']}` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `block_name` varchar(255) NOT NULL DEFAULT '',
                  UNIQUE KEY `id` (`id`)
                ) ", true);

    $is_check = true;
}


// 컨텐츠 블럭 셋팅 DB생성
if( isset($g5['content_block_set']) && !sql_query(" DESC {$g5['content_block_set']} ", false)) {
    sql_query(" CREATE TABLE IF NOT EXISTS `{$g5['content_block_set']}` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `name` varchar(255) NOT NULL DEFAULT '',
                  `pagename` varchar(255) NOT NULL DEFAULT '',
                  `empty_area` varchar(255) NOT NULL DEFAULT '',
                  `head_area` varchar(255) NOT NULL DEFAULT '',
                  `content_area` varchar(255) NOT NULL DEFAULT '',
                  `footer_area` varchar(255) NOT NULL DEFAULT '',
                  `left_sidebar_area` varchar(255) NOT NULL DEFAULT '',
                  `right_sidebar_area` varchar(255) NOT NULL DEFAULT '',
                  `b_left_sidebar_area` varchar(255) NOT NULL DEFAULT '',
                  `b_right_sidebar_area` varchar(255) NOT NULL DEFAULT '',
                  `sidebar_position` varchar(255) NOT NULL DEFAULT '',
                  UNIQUE KEY `id` (`id`)
                ) ", true);

    $sql = " insert into g5_content_block_set
                    set name = 'mainpage', pagename = '메인페이지', empty_area = '', head_area = '', content_area = '',
              			footer_area = '', left_sidebar_area = '', right_sidebar_area = '', b_left_sidebar_area = '', b_right_sidebar_area = '',
                    sidebar_position = '' ";

    sql_query($sql);

    $is_check = true;
}


// CSS스타일 DB생성
if( isset($g5['layout_css_set']) && !sql_query(" DESC {$g5['layout_css_set']} ", false)) {
    sql_query(" CREATE TABLE IF NOT EXISTS `{$g5['layout_css_set']}` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `name` varchar(255) NOT NULL DEFAULT '',
                  `css_1` varchar(255) NOT NULL DEFAULT '',
                  `css_2` varchar(255) NOT NULL DEFAULT '',
                  `css_3` varchar(255) NOT NULL DEFAULT '',
                  `css_4` varchar(255) NOT NULL DEFAULT '',
                  `css_5` varchar(255) NOT NULL DEFAULT '',
                  `css_6` varchar(255) NOT NULL DEFAULT '',
                  `css_7` varchar(255) NOT NULL DEFAULT '',
                  `css_8` varchar(255) NOT NULL DEFAULT '',
                  `css_9` varchar(255) NOT NULL DEFAULT '',
                  `css_10` varchar(255) NOT NULL DEFAULT '',
                  `css_11` varchar(255) NOT NULL DEFAULT '',
                  `css_12` varchar(255) NOT NULL DEFAULT '',
                  `css_13` varchar(255) NOT NULL DEFAULT '',
                  `css_14` varchar(255) NOT NULL DEFAULT '',
                  `css_15` varchar(255) NOT NULL DEFAULT '',
                  `css_16` varchar(255) NOT NULL DEFAULT '',
                  `css_17` varchar(255) NOT NULL DEFAULT '',
                  `css_18` varchar(255) NOT NULL DEFAULT '',
                  `css_19` varchar(255) NOT NULL DEFAULT '',
                  `css_20` varchar(255) NOT NULL DEFAULT '',
                  UNIQUE KEY `id` (`id`)
                ) ", true);

    $sql = " insert into g5_layout_css_set
                     set name = 'mainpage', css_1='1200px', css_2='', css_3='', css_4='', css_5='', css_6='100%', css_7='100%', css_8='979', css_9='767', css_10='',
                     css_11='', css_12='', css_13='', css_14='', css_15='', css_16='', css_17='', css_18='', css_19='', css_20='' ";

    sql_query($sql);

    $is_check = true;
}




// 메인 css, js 사용여부 DB생성
if( isset($g5['block_setup']) && !sql_query(" DESC {$g5['block_setup']} ", false)) {
    sql_query(" CREATE TABLE IF NOT EXISTS `{$g5['block_setup']}` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `name` varchar(255) NOT NULL DEFAULT '',
                  `setup_1` text NOT NULL DEFAULT '',
                  `setup_2` text NOT NULL DEFAULT '',
                  `setup_3` text NOT NULL DEFAULT '',
                  `setup_4` text NOT NULL DEFAULT '',
                  `setup_5` text NOT NULL DEFAULT '',
                  `setup_6` text NOT NULL DEFAULT '',
                  `setup_7` text NOT NULL DEFAULT '',
                  `setup_8` text NOT NULL DEFAULT '',
                  `setup_9` text NOT NULL DEFAULT '',
                  `setup_10` text NOT NULL DEFAULT '',
                  UNIQUE KEY `id` (`id`)
                ) ", true);

    $sql = " insert into g5_block_setup (name, setup_1, setup_2)
                     values ('default_shop', 'y', 'css'), ('default', 'y', 'css'),  ('mobile_shop', 'y', 'css'), ('mobile', 'y', 'css'), ('uikit.min', 'n', 'css'), ('uikit.min', 'n', 'js'), ('uikit-icons.min', 'n', 'js')";

    sql_query($sql);

    $is_check = true;
}



// 메인 css, js 사용여부 DB생성
if( isset($g5['block_setup_meta']) && !sql_query(" DESC {$g5['block_setup_meta']} ", false)) {
    sql_query(" CREATE TABLE IF NOT EXISTS `{$g5['block_setup_meta']}` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `name` varchar(255) NOT NULL DEFAULT '',
                  `setup_1` text NOT NULL DEFAULT '',
                  `setup_2` text NOT NULL DEFAULT '',
                  `setup_3` text NOT NULL DEFAULT '',
                  `setup_4` text NOT NULL DEFAULT '',
                  `setup_5` text NOT NULL DEFAULT '',
                  `setup_6` text NOT NULL DEFAULT '',
                  `setup_7` text NOT NULL DEFAULT '',
                  `setup_8` text NOT NULL DEFAULT '',
                  `setup_9` text NOT NULL DEFAULT '',
                  `setup_10` text NOT NULL DEFAULT '',
                  UNIQUE KEY `id` (`id`)
                ) ", true);

    $sql = " insert into g5_block_setup_meta set name = 'mainpage' ";

    sql_query($sql);

    $is_check = true;
}





// 관리자페이지 메뉴생성
if( isset($g5['admin_menu']) && !sql_query(" DESC {$g5['admin_menu']} ", false)) {
    sql_query(" CREATE TABLE IF NOT EXISTS `{$g5['admin_menu']}` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `name` varchar(255) NOT NULL DEFAULT '',
                  `sub_id` varchar(255) NOT NULL DEFAULT '',
                  `board_id` varchar(255) NOT NULL DEFAULT '',
                  `board_skin` varchar(255) NOT NULL DEFAULT '',
                  UNIQUE KEY `id` (`id`)
                ) ", true);

    $is_check = true;
}





// RSS / 사이트맵 설정 DB
if( isset($g5['rss_sitemap']) && !sql_query(" DESC {$g5['rss_sitemap']} ", false)) {
    sql_query(" CREATE TABLE IF NOT EXISTS `{$g5['rss_sitemap']}` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `rss_descript` varchar(255) NOT NULL DEFAULT '',
                  `rss_count` int(11) NOT NULL,
                  `rss_result` varchar(255) NOT NULL DEFAULT '',
                  `sitemap_count` int(11) NOT NULL,
                  `sitemap_result` varchar(255) NOT NULL DEFAULT '',
                  UNIQUE KEY `id` (`id`)
                ) ", true);

    $sql = " insert into g5_rss_sitemap (rss_descript, rss_count, rss_result, sitemap_count, sitemap_result)
                   values ('', '', '', '', '')";

    sql_query($sql);

    $is_check = true;
}






// 해당 필드가 있는지 확인후 없으면, 필드추가.
$field = " SHOW COLUMNS FROM g5_content_block WHERE Field = 'bo_table' ";
$fieldFine = sql_fetch($field);
if(!$fieldFine['Field']){
  sql_query(" alter table g5_content_block add type varchar(255); ");
  sql_query(" alter table g5_content_block add bo_table varchar(255); ");
  sql_query(" alter table g5_content_block add skin_name varchar(255); ");
  sql_query(" alter table g5_content_block add list_count varchar(255); ");
  sql_query(" alter table g5_content_block add char_count varchar(255); ");
  $is_check = true;
}else{
  $is_check = false;
}

$from_field = " SHOW COLUMNS FROM g5_content_block WHERE Field = 'form_board' ";
$fieldFine2 = sql_fetch($from_field);
if(!$fieldFine2['Field']){
  sql_query(" alter table g5_content_block add form_board varchar(255); ");
  $is_check = true;
}else{
  $is_check = false;
}


$db_upgrade_msg = $is_check ? 'DB 설치가 완료되었습니다.' : '더 이상 업그레이드 할 내용이 없습니다.<br>현재 DB 설치가 완료된 상태입니다.';
?>

<div class="local_desc01 local_desc">
  <p>
      <?=$db_upgrade_msg?>
  </p>
</div>


<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
