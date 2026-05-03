<?php
$sub_menu = '100000';
require_once './_common.php';

@require_once './safe_check.php';
if (function_exists('social_log_file_delete')) {
    social_log_file_delete(86400); 
}

$g5['title'] = '관리자메인';
require_once './admin.head.php';

// [폰트 로드]
echo '<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />';

// [1] DB 테이블 자동 생성
if (!sql_query(" DESCRIBE g5_email_data", false)) {
    sql_query("CREATE TABLE `g5_email_data` ( `id` int(11) NOT NULL AUTO_INCREMENT, `name` varchar(100) DEFAULT NULL, `phone` varchar(100) DEFAULT NULL, `location` varchar(100) DEFAULT NULL, `budget` varchar(100) DEFAULT NULL, `wr_2` varchar(100) DEFAULT NULL, `wr_3` varchar(100) DEFAULT NULL, `wr_4` varchar(100) DEFAULT NULL, `wr_5` varchar(100) DEFAULT NULL, `wr_6` varchar(100) DEFAULT NULL, `wr_7` varchar(100) DEFAULT NULL, `content` blob, `manager` varchar(100) DEFAULT NULL, `regDate` timestamp DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`) ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8", true);
}

// [2] 설정값 파라미터 (★ 데이터 노출을 위한 필수 변수 추가됨)
$stats_mode = isset($_GET['stats_mode']) ? $_GET['stats_mode'] : 'visitor'; 
$view_type  = isset($_GET['view_type']) ? $_GET['view_type'] : 'daily'; // 일/월/년 보기 모드
$cur_date   = isset($_GET['cur_date']) ? $_GET['cur_date'] : date('Y-m-d'); // 기준 날짜

// 테마 컬러
$mode_color = ($stats_mode == 'inquiry') ? "#ff4757" : "#3235cd"; 
$mode_title = ($stats_mode == 'inquiry') ? "문의 접수" : "방문자";

// ★ 날짜 및 데이터 계산 로직 (여기가 없어서 데이터가 안 나왔던 겁니다!)
$graph_data = array();
$cal_nav_title = "";
$prev_link = "";
$next_link = "";

// 달력 하단(일별 그리드)용 변수
$cur_ym = date('Y-m', strtotime($cur_date));
$cal_s_date = $cur_ym . '-01';
$cal_e_date = date('Y-m-t', strtotime($cal_s_date));

if ($view_type == 'daily') {
    // [일별 보기]
    $s_date = $cal_s_date;
    $e_date = $cal_e_date;
    $cal_nav_title = date('Y. m', strtotime($s_date));
    $prev_link = date('Y-m-d', strtotime("-1 month", strtotime($s_date)));
    $next_link = date('Y-m-d', strtotime("+1 month", strtotime($s_date)));

    $last_day = date('t', strtotime($s_date));
    for($d=1; $d<=$last_day; $d++) $graph_data[sprintf("%02d", $d)] = 0;

} elseif ($view_type == 'monthly') {
    // [월별 보기]
    $cur_year = date('Y', strtotime($cur_date));
    $s_date = $cur_year . '-01-01';
    $e_date = $cur_year . '-12-31';
    $cal_nav_title = $cur_year . "년";
    $prev_link = date('Y-m-d', strtotime("-1 year", strtotime($s_date)));
    $next_link = date('Y-m-d', strtotime("+1 year", strtotime($s_date)));

    for($m=1; $m<=12; $m++) $graph_data[$m . "월"] = 0;

} elseif ($view_type == 'yearly') {
    // [년별 보기]
    $cur_year = date('Y', strtotime($cur_date));
    $s_year = $cur_year - 4; // 최근 5년
    $e_year = $cur_year;
    $s_date = $s_year . '-01-01';
    $e_date = $e_year . '-12-31';
    $cal_nav_title = $s_year . " ~ " . $e_year;
    $prev_link = date('Y-m-d', strtotime("-5 year", strtotime($cur_date)));
    $next_link = date('Y-m-d', strtotime("+5 year", strtotime($cur_date)));

    for($y=$s_year; $y<=$e_year; $y++) $graph_data[$y] = 0;
}

// [3] DB 데이터 조회 (방문자/문의 통합)
$total_sum = 0;
$calendar_data = array(); 

// 3-1. 하단 달력용 데이터 (항상 일별 데이터가 필요함)
if ($stats_mode == 'visitor') {
    $sql_cal = " select vs_date, vs_count as cnt from {$g5['visit_sum_table']} where vs_date between '{$cal_s_date}' and '{$cal_e_date}' ";
} else {
    $sql_cal = " select DATE(regDate) as vs_date, count(*) as cnt from g5_email_data where DATE(regDate) between '{$cal_s_date}' and '{$cal_e_date}' group by vs_date ";
}
$res_cal = sql_query($sql_cal);
while($row = sql_fetch_array($res_cal)) {
    if(isset($row['vs_date'])) {
        $calendar_data[intval(date('d', strtotime($row['vs_date'])))] = $row['cnt'];
    }
}

// 3-2. 상단 그래프용 데이터 (일/월/년 뷰 타입에 따라 다름)
if ($stats_mode == 'visitor') {
    if ($view_type == 'daily') {
        $sql = " select right(vs_date, 2) as k, vs_count as cnt from {$g5['visit_sum_table']} where vs_date between '{$s_date}' and '{$e_date}' ";
    } elseif ($view_type == 'monthly') {
        $sql = " select substring(vs_date, 6, 2) as k, sum(vs_count) as cnt from {$g5['visit_sum_table']} where vs_date between '{$s_date}' and '{$e_date}' group by k ";
    } else { // yearly
        $sql = " select left(vs_date, 4) as k, sum(vs_count) as cnt from {$g5['visit_sum_table']} where vs_date between '{$s_date}' and '{$e_date}' group by k ";
    }
} else {
    if ($view_type == 'daily') {
        $sql = " select DATE_FORMAT(regDate, '%d') as k, count(*) as cnt from g5_email_data where DATE(regDate) between '{$s_date}' and '{$e_date}' group by k ";
    } elseif ($view_type == 'monthly') {
        $sql = " select DATE_FORMAT(regDate, '%m') as k, count(*) as cnt from g5_email_data where DATE(regDate) between '{$s_date}' and '{$e_date}' group by k ";
    } else { // yearly
        $sql = " select DATE_FORMAT(regDate, '%Y') as k, count(*) as cnt from g5_email_data where DATE(regDate) between '{$s_date}' and '{$e_date}' group by k ";
    }
}

$res = sql_query($sql);
while($row = sql_fetch_array($res)) {
    if($view_type == 'monthly') $key = intval($row['k']) . "월";
    else $key = $row['k'];

    // 데이터 매핑
    if(array_key_exists($key, $graph_data)) {
        $graph_data[$key] = $row['cnt'];
        $total_sum += $row['cnt'];
    }
}

$max_count = 0;
foreach($graph_data as $v) if($v > $max_count) $max_count = $v;
$data_count = count($graph_data);
$avg_val = ($data_count > 0) ? round($total_sum / $data_count, 1) : 0;
?>

<script>document.documentElement.style.setProperty('--adm-accent', '<?php echo $mode_color ?>');</script>
<style>
    /* 탭 스타일 */
    .tab-container { display: flex; gap: 20px; align-items: center; margin-bottom: 30px; flex-wrap: wrap; }
    .main-tabs { display: flex; gap: 5px; background: rgba(255,255,255,0.7); padding: 5px; border-radius: 12px; }
    .main-tab-btn {
        padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer;
        background: transparent; color: #888; border: none; text-decoration: none; display: flex; align-items: center; gap: 6px;
        transition: 0.2s;
    }
    .main-tab-btn:hover { background: #fff; color: #333; }
    .main-tab-btn.active { background: #fff; color: var(--adm-accent); box-shadow: 0 2px 10px rgba(0,0,0,0.05); }

    .sub-tabs { display: flex; gap: 0; background: #e9ecef; border-radius: 8px; overflow: hidden; }
    .sub-tab-btn { padding: 8px 16px; font-size: 13px; font-weight: 600; color: #666; text-decoration: none; transition: 0.2s; }
    .sub-tab-btn:hover { background: #dee2e6; }
    .sub-tab-btn.active { background: var(--adm-accent); color: #fff; }

    /* 카드 스타일 */
    .dashboard-card {
        background: #fff; border: none; border-radius: 20px;
        padding: 28px; margin-bottom: 24px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .card-title { font-size: 18px; font-weight: 800; color: #222; }
    .nav-ctrl { display: flex; align-items: center; gap: 15px; font-size: 18px; font-weight: 800; color: #333; }
    .nav-btn { color: #ccc; cursor: pointer; transition: 0.2s; }
    .nav-btn:hover { color: var(--adm-accent); }

    /* 그래프 */
    .chart-wrap { display: flex; justify-content: space-between; align-items: flex-end; height: 220px; padding: 0 10px 20px 10px; margin-bottom: 20px; overflow-x: auto; gap: 10px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 30px; position: relative; }
    .bar-val { font-size: 11px; font-weight: 700; color: var(--adm-accent); margin-bottom: 5px; opacity: 0.8; }
    .bar-stick { width: 100%; max-width: 40px; background: #f0f2f5; border-radius: 6px 6px 0 0; height: 0; min-height: 4px; transition: height 0.8s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .bar-stick.active { background: var(--adm-accent); opacity: 0.8; }
    .bar-stick:hover { opacity: 1; transform: scaleX(1.1); }
    .bar-lbl { margin-top: 10px; font-size: 12px; color: #777; text-align: center; font-weight: 600; white-space: nowrap; }

    /* 요약 그리드 */
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-top: 30px; border-top: 1px dashed #eee; padding-top: 30px; }
    .summary-item { background: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 12px; padding: 15px; text-align: center; display: flex; flex-direction: column; gap: 5px; transition: 0.2s; }
    .summary-item:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.03); border-color: color-mix(in srgb, var(--adm-accent) 20%, transparent); }
    .summary-label { font-size: 13px; color: #999; font-weight: 600; }
    .summary-val { font-size: 18px; font-weight: 800; color: #333; }
    .summary-val.highlight { color: var(--adm-accent); font-weight: 800; font-size: 16px; }

    /* 달력 & 뷰모드 탭 */
    .cal-mode-tabs { display: flex; gap: 5px; margin-left: auto; }
    .cal-mode-btn { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #999; background: #f5f5f5; text-decoration: none; transition: 0.2s; }
    .cal-mode-btn.active { background: var(--adm-accent); color: #fff; }

    .cal-nav { display: flex; justify-content: flex-start; align-items: center; gap: 20px; }
    .cal-nav a { text-decoration: none; color: #ccc; font-size: 20px; transition: 0.2s; padding: 5px 10px; }
    .cal-nav a:hover { color: var(--adm-accent); }

    .cal-nav-wrap { position: relative; display: inline-block; z-index: 50; }
    .cal-nav-btn { font-size: 20px; font-weight: 800; color: #333; cursor: pointer; padding: 5px 15px; border-radius: 8px; display: flex; align-items: center; gap: 6px; }
    .cal-nav-btn:hover { background: #f0f0f0; color: var(--adm-accent); }

    /* 드롭다운 */
    .cal-dropdown { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #eee; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border-radius: 12px; padding: 15px; width: 240px; margin-top: 10px; display: none; }
    .cal-dropdown.show { display: block; animation: fadeInDown 0.3s; }
    .year-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }
    .year-btn { background: none; border: none; font-size: 16px; font-weight: 700; cursor: pointer; color: #ccc; }
    .year-btn:hover { color: var(--adm-accent); }
    .ym-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .ym-btn { padding: 8px 0; text-align: center; border-radius: 6px; font-size: 13px; font-weight: 600; color: #555; cursor: pointer; transition: 0.2s; }
    .ym-btn:hover { background: #f9f9f9; color: var(--adm-accent); }
    .ym-btn.active { background: var(--adm-accent); color: #fff; }

    /* 달력 그리드 */
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
    .cal-grid.grid-4 { grid-template-columns: repeat(4, 1fr); }

    .cal-cell { border-radius: 12px; min-height: 80px; padding: 10px; position: relative; background: #fdfdfd; border: 1px solid #f0f0f0; transition: 0.2s; }
    .cal-head { text-align: center; padding: 8px 0; font-size: 12px; font-weight: 700; color: #aaa; }
    .cal-date { font-size: 13px; color: #888; font-weight: 600; }
    .cal-cnt { position: absolute; bottom: 8px; right: 10px; font-size: 16px; font-weight: 800; color: var(--adm-accent); }
    .cal-cell.today { background: #fff; border: 1px solid var(--adm-accent); box-shadow: 0 4px 12px color-mix(in srgb, var(--adm-accent) 8%, transparent); }

    .cal-cell.center-type { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; height: 100px; }
    .cal-cell.center-type .cal-date { font-size: 16px; font-weight: 800; color: #333; }
    .cal-cell.center-type .cal-cnt { position: static; font-size: 14px; }

    /* 관리자 메뉴 */
    .quick-menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .quick-menu-item { display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; border-radius: 16px; padding: 24px; text-decoration: none; color: #333; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: all 0.2s ease; border: 2px solid transparent; }
    .quick-menu-item:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.08); border-color: #3235cd; }
    .quick-icon-box { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #fff; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    .quick-text { font-size: 16px; font-weight: 700; }
    .quick-arrow { margin-top: 5px; font-size: 12px; color: #ccc; transition: 0.2s; }
    .quick-menu-item:hover .quick-arrow { color: #3235cd; transform: translateX(3px); }

    .accordion-list { display: flex; flex-direction: column; gap: 12px; }

    @keyframes fadeInDown { from { opacity: 0; transform: translate(0, -10px); } to { opacity: 1; transform: translate(0, 0); } }

    @media (max-width: 768px) {
        .card-head { flex-direction: column; }
        .admin-container { padding: 80px 10px 50px; }
        .dashboard-card { padding: 15px; border-radius: 12px; }
        .cal-grid { gap: 4px; }
        .cal-cell { min-height: 60px; padding: 6px; border-radius: 8px; }
        .cal-date { font-size: 11px; }
        .cal-cnt { font-size: 12px; bottom: 4px; right: 6px; }
        .cal-cell.center-type { height: 70px; }
        .cal-cell.center-type .cal-date { font-size: 13px; }
        .cal-cell.center-type .cal-cnt { font-size: 11px; }
        .chart-wrap { height: 150px; gap: 4px; }
        .bar-lbl { font-size: 10px; }
        .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .quick-menu-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .quick-menu-item { padding: 16px; }
        .quick-icon-box { width: 40px; height: 40px; font-size: 20px; border-radius: 10px; }
        .quick-text { font-size: 13px; }
        .tab-container { gap: 10px; }
        .main-tab-btn { padding: 8px 14px; font-size: 13px; }
        .cal-nav-btn { font-size: 16px; }
    }
</style>

<?php if ($is_admin == 'super' || $is_auth || defined('G5_IS_ADMIN') || $member['mb_id'] == 'admin02') { ?>
<div style="margin-bottom: 30px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #222; margin-bottom: 15px;">관리자 바로가기</h2>
    <div class="quick-menu-grid">
        <?php
        $sql_common = " from {$g5['board_table']} a ";
        $sql_search = " where (1) ";

        // ★ 수정된 부분: 최고관리자가 아니면서 'admin02'도 아닌 경우에만 권한을 체크합니다.
        // 즉, 'admin02'는 최고관리자처럼 모든 게시판을 다 가져옵니다.
        if ($is_admin != "super" && $member['mb_id'] != 'admin02') {
            $sql_common .= " , {$g5['group_table']} b ";
            $sql_search .= " and (a.gr_id = b.gr_id and b.gr_admin = '{$member['mb_id']}') ";
        }

        // 검색 순서에 따라 정렬하여 가져오기
        $sql_bo = " select a.bo_table, a.bo_subject {$sql_common} {$sql_search} order by a.gr_id, a.bo_table ";
        $res_bo = sql_query($sql_bo);
        $idx = 0;
        
        while ($row_bo = sql_fetch_array($res_bo)) {
            $idx++;
        ?>
        <a href="/bbs/board.php?bo_table=<?php echo $row_bo['bo_table']; ?>" class="quick-menu-item">
            <span class="quick-text"><?php echo $row_bo['bo_subject']; ?></span>
            <i class="fa fa-angle-right" style="font-size:12px; color:#ccc;"></i>
        </a>
        <?php }

        if($idx == 0) {
            echo '<div style="color:#999; padding:20px;">생성된 게시판이 없거나 권한이 없습니다.</div>';
        }
        ?>
        <a href="/chatbot/chatbot_admin.php" class="quick-menu-item" style="background:linear-gradient(135deg,#ffd1ec 0%,#d4c8ff 50%,#bfe3ff 100%);color:#fff;border:none;box-shadow:0 8px 28px rgba(190,160,240,0.28),inset 0 1px 0 rgba(255,255,255,0.5);">
            <span class="quick-text" style="color:#fff;text-shadow:0 1px 4px rgba(130,100,200,0.35);">AI 챗봇 관리</span>
            <i class="fa fa-angle-right" style="font-size:12px; color:#fff; text-shadow:0 1px 4px rgba(130,100,200,0.35);"></i>
        </a>
    </div>
</div>
<?php } ?>

<div class="tab-container">
    <div class="main-tabs">
        <a href="?stats_mode=visitor&view_type=<?php echo $view_type ?>" class="main-tab-btn <?php echo ($stats_mode == 'visitor') ? 'active' : ''; ?>">
            <i class="fa fa-users"></i> 방문자 현황
        </a>
        <a href="?stats_mode=inquiry&view_type=<?php echo $view_type ?>" class="main-tab-btn <?php echo ($stats_mode == 'inquiry') ? 'active' : ''; ?>">
            <i class="fa fa-envelope-o"></i> 문의 접수 현황
        </a>
    </div>
    <div class="sub-tabs">
        <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=daily" class="sub-tab-btn <?php echo ($view_type == 'daily') ? 'active' : ''; ?>">일별</a>
        <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=monthly" class="sub-tab-btn <?php echo ($view_type == 'monthly') ? 'active' : ''; ?>">월별</a>
        <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=yearly" class="sub-tab-btn <?php echo ($view_type == 'yearly') ? 'active' : ''; ?>">년별</a>
    </div>
</div>

<section class="dashboard-card">
    <div class="card-head">
        <div class="card-title">
            <?php 
                if($view_type == 'daily') echo '일별 추이';
                elseif($view_type == 'monthly') echo '월별 추이';
                else echo '연도별 추이';
            ?>
        </div>
        <div class="nav-ctrl">
            <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=<?php echo $view_type ?>&cur_date=<?php echo $prev_link ?>" class="nav-btn"><i class="fa fa-chevron-left"></i></a>
            <span><?php echo $cal_nav_title ?></span>
            <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=<?php echo $view_type ?>&cur_date=<?php echo $next_link ?>" class="nav-btn"><i class="fa fa-chevron-right"></i></a>
        </div>
    </div>
    
    <div class="chart-wrap">
        <?php foreach ($graph_data as $key => $cnt) { 
            $pct = ($max_count > 0) ? round(($cnt / $max_count) * 100) : 0;
            $h = ($cnt > 0 && $pct < 5) ? 5 : $pct;
        ?>
        <div class="bar-col">
            <span class="bar-val"><?php echo number_format($cnt) ?></span>
            <div class="bar-stick <?php echo ($cnt>0)?'active':''; ?>" style="height: <?php echo $h ?>%;"></div>
            <div class="bar-lbl"><?php echo $key ?></div>
        </div>
        <?php } ?>
    </div>

    <div class="summary-grid">
        <div class="summary-item">
            <span class="summary-label">구분</span>
            <span class="summary-val" style="color:#555;"><?php echo $mode_title; ?></span>
        </div>
        <div class="summary-item">
            <span class="summary-label">기간 합계</span>
            <span class="summary-val highlight"><?php echo number_format($total_sum); ?> 건</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">기간 평균</span>
            <span class="summary-val"><?php echo number_format($avg_val, 1); ?> 건</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">최대 값</span>
            <span class="summary-val"><?php echo number_format($max_count); ?> 건</span>
        </div>
    </div>
</section>

<section class="dashboard-card">
    <div class="card-head" style="margin-bottom:15px; border:none; padding:0; align-items:center;">
        <div class="cal-nav" style="margin:0; justify-content:flex-start;">
            <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=<?php echo $view_type ?>&cur_date=<?php echo $prev_link ?>"><i class="fa fa-chevron-left" style="font-size:16px;"></i></a>
            
            <div class="cal-nav-wrap" id="calNavWrap">
                <div class="cal-nav-btn" onclick="toggleCalDropdown()">
                    <span><?php echo $cal_nav_title ?></span>
                    <?php if($view_type == 'daily') { ?><i class="fa fa-chevron-down"></i><?php } ?>
                </div>
                <?php if($view_type == 'daily') { ?>
                <div class="cal-dropdown" id="calDropdown">
                    <div class="year-header">
                        <button class="year-btn" onclick="changeYear(-1)"><i class="fa fa-angle-left"></i></button>
                        <span class="current-year" id="displayYear"><?php echo date('Y', strtotime($cal_s_date)); ?></span>
                        <button class="year-btn" onclick="changeYear(1)"><i class="fa fa-angle-right"></i></button>
                    </div>
                    <div class="ym-grid" id="monthGrid"></div>
                </div>
                <?php } ?>
            </div>

            <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=<?php echo $view_type ?>&cur_date=<?php echo $next_link ?>"><i class="fa fa-chevron-right" style="font-size:16px;"></i></a>
        </div>

        <div class="cal-mode-tabs">
            <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=daily" class="cal-mode-btn <?php echo ($view_type == 'daily') ? 'active' : ''; ?>">일</a>
            <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=monthly" class="cal-mode-btn <?php echo ($view_type == 'monthly') ? 'active' : ''; ?>">월</a>
            <a href="?stats_mode=<?php echo $stats_mode ?>&view_type=yearly" class="cal-mode-btn <?php echo ($view_type == 'yearly') ? 'active' : ''; ?>">년</a>
        </div>
    </div>

    <?php if ($view_type == 'daily') { ?>
        <div class="cal-grid">
            <div class="cal-head" style="color:#ff4757">SUN</div>
            <div class="cal-head">MON</div>
            <div class="cal-head">TUE</div>
            <div class="cal-head">WED</div>
            <div class="cal-head">THU</div>
            <div class="cal-head">FRI</div>
            <div class="cal-head" style="color:#3235cd">SAT</div>
            <?php
            $s_ts = strtotime($cal_s_date);
            $start_day = date('w', $s_ts);
            $last_day = date('t', $s_ts);
            for($k=0; $k<$start_day; $k++) echo '<div class="cal-cell" style="background:transparent; border:none;"></div>';
            for($d=1; $d<=$last_day; $d++) {
                $cnt = isset($calendar_data[$d]) ? $calendar_data[$d] : 0;
                $is_today = (date('Y-m-d') == $cur_ym.'-'.sprintf("%02d",$d)) ? 'today' : '';
                $op = ($cnt == 0) ? '0.2' : '1';
                echo '<div class="cal-cell '.$is_today.'"><div class="cal-date">'.$d.'</div><div class="cal-cnt" style="opacity:'.$op.'">'.number_format($cnt).'</div></div>';
            }
            ?>
        </div>
    <?php } elseif ($view_type == 'monthly') { ?>
        <div class="cal-grid grid-4">
            <?php
            for($m=1; $m<=12; $m++) {
                $key = $m . "월"; 
                $cnt = isset($graph_data[$key]) ? $graph_data[$key] : 0;
                $is_curr = (date('Y-m') == date('Y', strtotime($cur_date)).'-'.sprintf("%02d",$m)) ? 'today' : '';
                $op = ($cnt == 0) ? '0.2' : '1';
                echo '<div class="cal-cell center-type '.$is_curr.'"><div class="cal-date">'.$m.'월</div><div class="cal-cnt" style="opacity:'.$op.'">'.number_format($cnt).'</div></div>';
            }
            ?>
        </div>
    <?php } elseif ($view_type == 'yearly') { ?>
        <div class="cal-grid grid-4">
            <?php
            for($y=$s_year; $y<=$e_year; $y++) {
                $cnt = isset($graph_data[$y]) ? $graph_data[$y] : 0;
                $is_curr = (date('Y') == $y) ? 'today' : '';
                $op = ($cnt == 0) ? '0.2' : '1';
                echo '<div class="cal-cell center-type '.$is_curr.'"><div class="cal-date">'.$y.'년</div><div class="cal-cnt" style="opacity:'.$op.'">'.number_format($cnt).'</div></div>';
            }
            ?>
        </div>
    <?php } ?>
</section>

<?php
// [5] 문의 내역 (기존 유지)
$sql = " select count(*) as cnt from g5_email_data ";
$row = sql_fetch($sql);
$total_inquiry_count = $row['cnt'];
$rows = $config['cf_page_rows'];
$total_page  = ceil($total_inquiry_count / $rows);
if ($page < 1) $page = 1;
$from_record = ($page - 1) * $rows;
$sql2 = " select * from g5_email_data order by regDate desc limit {$from_record}, {$rows}";
$result2= sql_query($sql2);
?>

<section style="margin-top: 40px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding: 0 5px;">
        <h2 style="font-size:20px; font-weight:800; margin:0; color:#222;">최근 문의 내역</h2>
        <a href='/adm/excel.php?bo_table=email_data' class="btn_admin btn2" target='_blank' style="background:#fff; border:1px solid #ddd; padding:8px 15px; border-radius:10px; color:#555; text-decoration:none; font-size:13px; font-weight:700; box-shadow:0 2px 5px rgba(0,0,0,0.03);">
            <i class="fa fa-download"></i> 엑셀 다운
        </a>
    </div>

    <div class="accordion-list">
        <?php while($row = sql_fetch_array($result2)) { ?>
            <div class="accordion-card">
                <div class="accordion-header">
                    <div style="font-weight:700; color:<?php echo $mode_color ?>; font-size:15px; display:flex; align-items:center; gap:8px;">
                        <span style="width:8px; height:8px; background:<?php echo $mode_color ?>; border-radius:50%; display:inline-block;"></span>
                        <?php echo $row['name']; ?>님
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:12px; color:#999; font-weight:500;"><?php echo substr($row['regDate'], 5, 5); ?></span>
                        <div class="toggle-icon"><i class="fa fa-chevron-down"></i></div>
                    </div>
                </div>
                <div class="accordion-body">
                    <form onsubmit="return updateInquiry(this);">
                        <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                        <div class="info-row" style="margin-bottom: 20px;">
                            <span class="label" style="color:<?php echo $mode_color ?>;">담당자</span>
                            <input type="text" name="wr_6" class="edit-input" value="<?php echo $row['wr_6']; ?>" placeholder="담당자 이름을 배정해주세요">
                        </div>
                        <div class="info-row"><span class="label">연락처</span><span class="value"><?php echo $row['phone']; ?></span></div>
                        <div class="info-row"><span class="label">상가보유</span><span class="value"><?php echo $row['wr_2'] ?: '-'; ?></span></div>
                        <div class="info-row"><span class="label">희망지역</span><span class="value"><?php echo $row['location'] ?: '-'; ?></span></div>
                        <div class="info-row"><span class="label">희망시기</span><span class="value"><?php echo $row['budget'] ?: '-'; ?></span></div>
                        <div class="info-row"><span class="label">문의내용</span><span class="value"><?php echo nl2br(htmlspecialchars($row['content'] ?: '-')); ?></span></div>
                        <div class="info-row"><span class="label">접수경로</span><span class="value"><?php echo $row['wr_5'] === 'footer_quick' ? '하단 고정 폼' : '메인 창업문의 폼'; ?></span></div>
                        <div class="info-row" style="margin-top:20px;">
                            <span class="label">메모</span>
                            <textarea name="wr_3" class="edit-textarea"><?php echo $row['wr_3']; ?></textarea>
                        </div>
                        <div class="btn-wrap">
                            <button type="button" class="btn-del" onclick="deleteInquiry(<?php echo $row['id']; ?>)">삭제</button>
                            <button type="submit" class="btn-save">수정 내용 저장</button>
                        </div>
                    </form>
                </div>
            </div>
        <?php } ?>
        <?php if($total_inquiry_count == 0) echo '<div style="text-align:center; padding:40px; color:#aaa; font-size:14px;">아직 접수된 문의가 없습니다.</div>'; ?>
    </div>

    <div class="pagination" style="margin-top:30px;">
        <?php echo get_paging($config['cf_write_pages'], $page, $total_page, $_SERVER['SCRIPT_NAME'].'?'.$qstr.'&amp;page='); ?>
    </div>
</section>

<script>
// [JS] 아코디언 및 업데이트 로직
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', function() {
        let body = this.nextElementSibling;
        let icon = this.querySelector('.toggle-icon');
        body.classList.toggle("open");
        icon.classList.toggle("open");
    });
});

function deleteInquiry(id) {
    if(confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) {
        $.post("/bbs/maildelete.php", { wr_id: id }, function() {
            alert("삭제되었습니다."); location.reload();
        });
    }
}

function updateInquiry(form) {
    if(!confirm("수정된 내용을 저장하시겠습니까?")) return false;
    $.ajax({
        url: "/bbs/mailupdate.php",
        type: "post",
        data: $(form).serialize(),
        success: function(data) {
            alert("저장되었습니다."); location.reload();
        },
        error: function() { alert("저장 실패. 관리자에게 문의하세요."); }
    });
    return false;
}

// [JS] 달력 드롭다운
let pYear = <?php echo date('Y', strtotime($cal_s_date)); ?>;
let pMonth = <?php echo date('n', strtotime($cal_s_date)); ?>;
const sMode = "<?php echo $stats_mode; ?>";

function toggleCalDropdown() {
    const dropdown = document.getElementById('calDropdown');
    const btn = document.querySelector('.cal-nav-btn');
    if(!dropdown) return; // 드롭다운 없으면 중단 (월/년 보기 등)
    dropdown.classList.toggle('show');
}

function changeYear(delta) {
    pYear += delta;
    document.getElementById('displayYear').innerText = pYear;
    renderPickerMonths();
}

function renderPickerMonths() {
    const grid = document.getElementById('monthGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    for(let m=1; m<=12; m++) {
        let btn = document.createElement('div');
        btn.className = 'ym-btn';
        btn.innerText = m + '월';
        
        // 현재 선택된 년월이면 active
        if(pYear == <?php echo date('Y', strtotime($cal_s_date)); ?> && m == pMonth) {
            btn.classList.add('active');
        }

        btn.onclick = function() {
            let mStr = m < 10 ? '0'+m : m;
            // view_type=daily로 강제 이동 (드롭다운은 일별 보기에서만 뜨므로)
            location.href = `?stats_mode=${sMode}&view_type=daily&cur_date=${pYear}-${mStr}-01`;
        };
        
        grid.appendChild(btn);
    }
}

// 초기 실행
renderPickerMonths();

// 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
    const wrap = document.getElementById('calNavWrap');
    if(wrap && !wrap.contains(e.target)) {
        const dd = document.getElementById('calDropdown');
        if(dd) dd.classList.remove('show');
    }
});
</script>

<?php require_once './admin.tail.php'; ?>