<?php
if (!defined('_GNUBOARD_')) exit;

$begin_time = get_microtime();

// 1. 폰트 및 스타일 라이브러리
add_stylesheet('<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />', 0);
add_stylesheet('<link rel="stylesheet" href="'.G5_ADMIN_URL.'/css/c3.min.css">', 0);
add_stylesheet('<link rel="stylesheet" href="'.G5_ADMIN_URL.'/css/uikit.min.css">', 0);

// 추가 CSS 로드
$files = glob(G5_ADMIN_PATH.'/css/admin_extend_*');
if (is_array($files)) {
    foreach ((array) $files as $k=>$css_file) {
        $fileinfo = pathinfo($css_file);
        $ext = $fileinfo['extension'];
        if( $ext !== 'css' ) continue;
        $css_file = str_replace(G5_ADMIN_PATH, G5_ADMIN_URL, $css_file);
        add_stylesheet('<link rel="stylesheet" href="'.$css_file.'">', $k);
    }
}

add_stylesheet('<link rel="stylesheet" href="'.G5_ADMIN_URL.'/css/admin-modern.css">', 99);

include_once(G5_ADMIN_PATH.'/design_admin/lib/newlib.php');
include_once(G5_PATH.'/head.sub.php');

// --- [메뉴 로직] ---
function print_menu1($key, $no='') {
    global $menu, $is_admin, $member;
    if($member['mb_id'] == 'admin' && $is_admin == 'super') return print_menu2($key, $no);
    else return print_menu3($key, $no);
}

function print_menu2($key, $no='') {
    global $menu, $auth_menu, $is_admin, $auth, $g5, $sub_menu;
    $str = "<ul class='uk-nav-sub'>";
    for($i=1; $i<count($menu[$key]); $i++) {
        if ($is_admin != 'super' && (!array_key_exists($menu[$key][$i][0],$auth) || !strstr($auth[$menu[$key][$i][0]], 'r'))) continue;
        $active = ($menu[$key][$i][0] == $sub_menu) ? ' class="active"' : '';
        $str .= '<li'.$active.'><a href="'.$menu[$key][$i][2].'">'.$menu[$key][$i][1].'</a></li>';
        $auth_menu[$menu[$key][$i][0]] = $menu[$key][$i][1];
    }
    $str .= "</ul>";
    return $str;
}

function print_menu3($key, $no='') {
    global $menu, $auth_menu, $is_admin, $auth, $g5, $sub_menu;
    $str = "<ul class='uk-nav-sub'>";
    for($i=1; $i<count($menu[$key]); $i++) {
        if ($member['mb_id'] != 'admin' && (!array_key_exists($menu[$key][$i][0],$auth) || !strstr($auth[$menu[$key][$i][0]], 'r'))) continue;
        $active = ($menu[$key][$i][0] == $sub_menu) ? ' class="active"' : '';
        $str .= '<li'.$active.'><a href="'.$menu[$key][$i][2].'">'.$menu[$key][$i][1].'</a></li>';
        $auth_menu[$menu[$key][$i][0]] = $menu[$key][$i][1];
    }
    $str .= "</ul>";
    return $str;
}

echo '<meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no">'.PHP_EOL;
?>

<script src="<?php echo G5_JS_URL ?>/jquery-1.12.4.min.js"></script>
<script src="<?php echo G5_ADMIN_URL ?>/design_admin/js/jquery.cookie.js"></script>
<script src="<?php echo G5_ADMIN_URL ?>/js/c3.min.js"></script>
<script src="<?php echo G5_ADMIN_URL ?>/js/uikit.min.js"></script>
<script src="<?php echo G5_ADMIN_URL ?>/js/uikit-icons.min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js"></script>
<link rel="stylesheet" href="<?php echo G5_ADMIN_URL ?>/css/vst_admin.css?ver=<?php echo G5_TIME_YMDHIS; ?>">
<style>
    /* 기본 초기화 */
    html, body { font-family: "Pretendard Variable", sans-serif !important; background: #f5f7fa; color: #333; overflow-x: hidden; margin: 0; padding: 0; }
    a { text-decoration: none !important; }
    
    /* [사이드바 메뉴] - 직접 구현 (UIkit Offcanvas 제거) */
    #custom-sidebar {
        position: fixed; top: 0; left: 0; width: 280px; height: 100%;
        background: #fff; z-index: 2000; box-shadow: 4px 0 20px rgba(0,0,0,0.1);
        transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        overflow-y: auto;
    }
    #custom-sidebar.active { transform: translateX(0); }
    
    /* 배경 어둡게 (Backdrop) */
    #sidebar-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.4); z-index: 1999;
        display: none; opacity: 0; transition: opacity 0.3s ease;
    }
    #sidebar-overlay.active { display: block; opacity: 1; }

    /* 사이드바 내부 스타일 */
    .sidebar-header { padding: 40px 20px 30px; text-align: center; border-bottom: 1px solid #f0f0f0; }
    .sidebar-logo img { height: 32px; }
    .sidebar-title { font-size: 13px; font-weight: 600; color: #888; margin-top: 8px; letter-spacing: -0.5px; }
    
    .quick-menu { display: flex; justify-content: center; gap: 15px; margin: 20px 0; padding-bottom: 20px; border-bottom: 1px solid #f5f5f5; }
    .quick-btn { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: #f8f9fb; border-radius: 12px; color: #555; transition: 0.2s; border: 1px solid #eee; }
    .quick-btn:hover { background: #3235cd; color: #fff; border-color: #3235cd; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(50, 53, 205, 0.2); }

    .uk-nav-default { padding: 10px 15px; list-style: none; }
    .uk-nav-default > li { margin-bottom: 5px; }
    .uk-nav-default > li > a { 
        color: #444; font-weight: 600; font-size: 15px; padding: 12px 15px; border-radius: 10px; 
        transition: 0.2s; display: flex; align-items: center; background: transparent; 
    }
    .uk-nav-default > li > a:hover, .uk-nav-default > li.uk-open > a { background: #f0f2f5; color: #3235cd; }
    .menu-icon { margin-right: 12px; color: #bbb; transition: 0.2s; }
    .uk-nav-default > li:hover .menu-icon, .uk-nav-default > li.uk-open .menu-icon { color: #3235cd; }

    .uk-nav-sub { padding: 5px 0 10px 42px; display: none; list-style: none; }
    .uk-nav-default > li.uk-open .uk-nav-sub { display: block; }
    .uk-nav-sub li a { font-size: 14px; color: #777; padding: 7px 0; display: block; }
    .uk-nav-sub li a:hover, .uk-nav-sub li.active a { color: #3235cd; font-weight: 700; transform: translateX(3px); transition: 0.2s; }
    .uk-nav-sub li.active a::before { content:'•'; margin-right:6px; color:#3235cd; }

    /* [상단 헤더] */
    .header-bar { 
        background: #fff; height: 64px; 
        position: fixed; top: 0; z-index: 990;
        box-shadow: 0 1px 10px rgba(0,0,0,0.05);
        width: 100%; display: flex; align-items: center; padding: 0 20px; box-sizing: border-box; justify-content: space-between;
    }
    
    .menu-trigger { cursor: pointer; padding: 8px; border-radius: 8px; color: #333; transition: 0.2s; border: none; background: transparent; display: flex; align-items: center; }
    .menu-trigger:hover { background: #f5f5f5; }
    
    .header-logo { font-weight: 800; font-size: 18px; color: #3235cd; margin-left: 15px; display: flex; align-items: center; text-decoration: none; }
    .header-logo img { height: 24px; }
    
    .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #999; margin-left: 20px; }
    .breadcrumb span { color: #333; font-weight: 600; }
    
    /* 컨텐츠 영역 */
    .admin-container {
        padding: 64px 30px 30px; width: 100%; box-sizing: border-box; margin: 0 auto;
    }

.uk-nav-default>li:hover {
    background: unset;
    transition: 0.5s;
}
    
    /* 모바일 */
    @media (max-width: 640px) {
        .breadcrumb { display: none; }
        .admin-container { padding: 74px 15px 50px; }
        .header-bar { padding: 0 15px; }
    }
    
/* 사이드바(#custom-sidebar) 스크롤바 디자인 */
    #custom-sidebar::-webkit-scrollbar {
        width: 4px; /* 아주 얇게 설정 (아이폰 느낌) */
    }
    
    #custom-sidebar::-webkit-scrollbar-track {
        background: transparent; /* 트랙 배경 투명하게 */
    }
    
    #custom-sidebar::-webkit-scrollbar-thumb {
        background-color: #e0e0e0; /* 연한 회색 */
        border-radius: 4px;        /* 둥글게 처리 */
        transition: background-color 0.3s;
    }
    
    #custom-sidebar::-webkit-scrollbar-thumb:hover {
        background-color: #c0c0c0; /* 마우스 올리면 살짝 진하게 */
    }

    /* 파이어폭스 호환 */
    #custom-sidebar {
        scrollbar-width: thin;
        scrollbar-color: #e0e0e0 transparent;
    }
</style>

<div id="sidebar-overlay" onclick="toggleSidebar()"></div>
<div id="custom-sidebar">
    <div class="sidebar-header">
        <div class="sidebar-logo" onclick="location.href='<?=G5_ADMIN_URL?>'" style="cursor:pointer;">
            <?php
            $logo_img3 = G5_DATA_PATH."/common/logo_img3";
            if (file_exists($logo_img3)) echo '<img src="'.G5_DATA_URL.'/common/logo_img3">';
            else echo '<h2 style="font-weight:900; color:#3235cd; margin:0;">ADMIN</h2>';
            ?>
        </div>
        <div class="sidebar-title"><?=$config['cf_title']?></div>
    </div>

    <div class="quick-menu">
        <a href="<?php echo G5_URL ?>/" target="_blank" class="quick-btn" title="홈페이지">
            <span uk-icon="icon: home; ratio: 1.0"></span>
        </a>
        <a href="<?php echo G5_BBS_URL ?>/logout.php" class="quick-btn" title="로그아웃">
            <span uk-icon="icon: sign-out; ratio: 1.0"></span>
        </a>
    </div>

    <ul class="uk-nav-default">
        <?php
        foreach($amenu as $key=>$value) {
            if (!$menu['menu'.$key][0][2]) continue;
            
            // 현재 메뉴 활성화 체크
            $is_open = (isset($sub_menu) && (substr($sub_menu, 0, 3) == substr($menu['menu'.$key][0][0], 0, 3))) ? " uk-open" : "";
            
            $icon = 'folder';
            $cate = $menu['menu'.$key][0][3];
            if($cate == 'config') $icon = 'cog';
            elseif($cate == 'member') $icon = 'users';
            elseif($cate == 'board') $icon = 'list';
            elseif($cate == 'design') $icon = 'image';
            elseif($cate == 'sms5') $icon = 'commenting';
            elseif($cate == 'shop_stats') $icon = 'rss';
            elseif($cate == 'shop_config') $icon = 'cart';
        ?>
        <li class="<?php echo $is_open; ?>">
            <a href="javascript:void(0);" onclick="toggleSubMenu(this)">
                <span class="menu-icon" uk-icon="icon: <?=$icon?>; ratio: 0.9"></span>
                <?php echo $menu['menu'.$key][0][1]; ?>
                <span uk-icon="icon: chevron-down; ratio: 0.8" style="margin-left:auto; opacity:0.5;"></span>
            </a>
            <?php echo print_menu1('menu'.$key, 1); ?>
        </li>
        <?php } ?>
    </ul>
    <div style="height: 50px;"></div>
</div>

<div class="header-bar">
    <div style="display:flex; align-items:center;">
        <button class="menu-trigger" onclick="toggleSidebar()">
            <span uk-icon="icon: menu; ratio: 1.1"></span>
        </button>

        <a href="<?php echo G5_ADMIN_URL;?>" class="header-logo" style="text-decoration: none; display:flex; align-items:center;">
            <span style="color: #3235cd; font-weight: 800; font-size: 19px;">ADMIN</span>
            
            <span style="color: #e0e0e0; margin: 0 12px; font-weight: 300; font-size: 14px;">|</span>
            
            <span style="color: #888; font-weight: 700; font-size: 15px; letter-spacing: -0.3px;">
                <?php echo $config['cf_title']; ?>
            </span>
        </a>

        <div class="breadcrumb uk-visible@s" style="margin-left: 20px;">
            <span uk-icon="icon: chevron-right; ratio: 0.7"></span>
            <span style="font-size: 13px;"><?=$g5['title']?></span>
        </div>
    </div>

    <div>
        <a href="<?php echo G5_BBS_URL ?>/logout.php" class="menu-trigger" uk-icon="icon: sign-out; ratio: 0.9"></a>
    </div>
</div>
<div class="admin-container">
    <div id="wrapper">
        <div id="container">

<script>
    // 사이드바 토글 함수
    function toggleSidebar() {
        const sidebar = document.getElementById('custom-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            overlay.style.display = 'block';
            setTimeout(() => { overlay.style.opacity = '1'; }, 10); // 부드러운 페이드인
        } else {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 300); // 애니메이션 후 숨김
        }
    }

    // 서브메뉴 토글 함수 (아코디언)
    function toggleSubMenu(element) {
        const parentLi = element.parentElement;
        const subMenu = parentLi.querySelector('.uk-nav-sub');
        
        if (subMenu) {
            // 다른 열린 메뉴 닫기 (선택 사항)
            // document.querySelectorAll('.uk-nav-default > li.uk-open').forEach(li => {
            //     if (li !== parentLi) li.classList.remove('uk-open');
            // });

            parentLi.classList.toggle('uk-open');
        }
    }
</script>