<?php
$sub_menu = "200800";
include_once('./_common.php');

auth_check_menu($auth, $sub_menu, 'r');

$fr_date = isset($_REQUEST['fr_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['fr_date']) : G5_TIME_YMD;
$to_date = isset($_REQUEST['to_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['to_date']) : G5_TIME_YMD;

$g5['title'] = '요일별 접속자집계';
include_once('./visit.sub.php');

// [데이터 가공 로직]
$weekday_str = array('월', '화', '수', '목', '금', '토', '일');
$sum_count = 0;
$max_count = 0;
$arr = array();

// 요일별 데이터 조회
$sql = " select WEEKDAY(vs_date) as weekday_date, SUM(vs_count) as cnt
            from {$g5['visit_sum_table']}
            where vs_date between '{$fr_date}' and '{$to_date}'
            group by weekday_date
            order by weekday_date ";
$result = sql_query($sql);

for ($i=0; $row=sql_fetch_array($result); $i++) {
    $arr[$row['weekday_date']] = $row['cnt'];
    $sum_count += $row['cnt'];
    if ($row['cnt'] > $max_count) $max_count = $row['cnt'];
}
?>

<style>
    /* 페이지 전용: 요일 컬럼 + 뱃지 */
    .col-day { width: 15%; min-width: 80px; }
    .vst-day-badge {
        display: inline-block; width: 32px; height: 32px; line-height: 32px;
        text-align: center; background: #f1f3f5; border-radius: 50%;
        color: #555; font-weight: 700; margin-right: 10px; font-size: 13px;
    }
    .vst-day-badge.sunday { color: #e03131; background: #fff5f5; }
    .vst-day-badge.saturday { color: #1971c2; background: #e7f5ff; }
    .vst-bar-stick.highlight { box-shadow: 0 4px 12px rgba(50, 53, 205, 0.3); }
    .vst-chart-item { cursor: pointer; }
    .vst-chart-item:hover .vst-bar-stick { opacity: 0.8; transform: scaleY(1.05); }
    .vst-chart-wrap { border-bottom: 2px solid #f1f3f5; margin-bottom: 40px; padding-bottom: 20px; }
    @media (max-width: 768px) {
        .col-day { width: auto; min-width: 60px; }
    }
</style>

<div class="vst-layout-container">
    
    <div class="vst-chart-wrap">
        <?php
        for ($i=0; $i<7; $i++) {
            $count = isset($arr[$i]) ? (int) $arr[$i] : 0;
            $height_rate = ($max_count > 0) ? round(($count / $max_count) * 100) : 0;
            if($count > 0 && $height_rate < 5) $height_rate = 5;
            $highlight = ($count > 0 && $count == $max_count) ? 'highlight' : '';
        ?>
        <div class="vst-chart-item">
            <div class="vst-bar-value" style="animation-delay: <?php echo $i*0.1 ?>s"><?php echo number_format($count) ?></div>
            <div class="vst-bar-stick <?php echo $highlight ?>" style="height: <?php echo $height_rate ?>%;"></div>
            <div class="vst-bar-label"><?php echo $weekday_str[$i] ?></div>
        </div>
        <?php } ?>
    </div>

    <div class="vst-list-wrap">
        <div class="vst-list-header">
            <div class="col-day">요일</div>
            <div class="col-graph">접속 비율</div>
            <div class="col-count">접속자 수</div>
            <div class="col-rate">비율(%)</div>
        </div>

        <?php
        $has_data = false;
        for ($i=0; $i<7; $i++) {
            $count = isset($arr[$i]) ? (int) $arr[$i] : 0;
            $rate = ($sum_count > 0) ? ($count / $sum_count * 100) : 0;
            $s_rate = number_format($rate, 1);
            if($count > 0) $has_data = true;

            $day_class = '';
            if($i == 5) $day_class = 'saturday'; 
            if($i == 6) $day_class = 'sunday';   
        ?>
        <div class="vst-list-row">
            <div class="col-day">
                <span class="vst-day-badge <?php echo $day_class ?>"><?php echo $weekday_str[$i] ?></span>
                <span style="font-weight:600; font-size:14px; color:#333; display:none;">요일</span> </div>
            <div class="col-graph">
                <div class="vst-progress-bg">
                    <div class="vst-progress-fill" style="width: <?php echo $s_rate ?>%;"></div>
                </div>
            </div>
            <div class="col-count">
                <?php echo number_format($count) ?>명
            </div>
            <div class="col-rate">
                <?php echo $s_rate ?>%
            </div>
        </div>
        <?php } ?>

        <?php if(!$has_data) { ?>
        <div style="text-align:center; padding:50px 0; color:#999;">데이터가 없습니다.</div>
        <?php } ?>

        <div class="vst-list-footer">
            <div class="col-day">전체 합계</div>
            <div class="col-graph"></div>
            <div class="col-count"><?php echo number_format($sum_count) ?>명</div>
            <div class="col-rate">100%</div>
        </div>
    </div>
</div>

<?php
include_once('./admin.tail.php');
?>