<?php
if ($member['mb_id'] == 'admin') {
    //if ($config['cf_theme'] == 'design') {
        $menu['menu700'] = array(
            array('700000', '기타설정', '' . G5_ADMIN_URL . '/design_admin/page_coding.php', 'config2'),
            array('700010', '관리자메뉴 설정', '' . G5_ADMIN_URL . '/design_admin/admin_menu_set.php', 'config2'),
            array('700050', 'ROBOTS 설정', '' . G5_ADMIN_URL . '/design_admin/robots_file.php', 'config2'),
            array('700100', 'RSS&사이트맵', '' . G5_ADMIN_URL . '/design_admin/rss_sitemap.php', 'config2'),
            array('700200', '게시판 여분필드추가', '' . G5_ADMIN_URL . '/design_admin/board_wr_add.php', 'config2'),
            array('700300', '워터마크 설정', '' . G5_ADMIN_URL . '/design_admin/watermark_set.php', 'config2'),
            array('700400', '실시간채팅(채널) 설정', '' . G5_ADMIN_URL . '/design_admin/chat_api.php', 'config2'),
            array('700900', '관리자 업데이트', '' . G5_ADMIN_URL . '/design_admin/update_result.php', 'config2'),
        );
   // }
}
?>
