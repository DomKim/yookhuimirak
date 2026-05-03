<?php
$sub_menu = "200800";
include_once('./_common.php');

auth_check_menu($auth, $sub_menu, 'r');

$fr_date = isset($_REQUEST['fr_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['fr_date']) : G5_TIME_YMD;
$to_date = isset($_REQUEST['to_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['to_date']) : G5_TIME_YMD;

$g5['title'] = '시간별 접속자집계';
include_once('./visit.sub.php');

// [데이터 가공 로직]
$max = 0;
$sum_count = 0;
$arr = array();

$sql = " select SUBSTRING(vi_time,1,2) as vi_hour, count(vi_id) as cnt
            from {$g5['visit_table']}
            where vi_date between '{$fr_date}' and '{$to_date}'
            group by vi_hour
            order by vi_hour ";
$result = sql_query($sql);
for ($i=0; $row=sql_fetch_array($result); $i++) {
    $arr[$row['vi_hour']] = $row['cnt'];
    if ($row['cnt'] > $max) $max = $row['cnt'];
    $sum_count += $row['cnt'];
}
?>

<style>
    .col-time { width: 15%; min-width: 80px; font-weight: 700; color: #555; }
    .vst-time-badge {
        display: inline-block;
        padding: 4px 8px;
        background: #f1f3f5;
        border-radius: 6px;
        color: #555;
        font-size: 12px;
    }
    @media (max-width: 768px) {
        .col-time { width: auto; }
    }
</style>

<div class="vst-layout-container">
    
    <div class="vst-chart-wrap">
        <?php
        for ($i=0; $i<24; $i++) {
            $hour = sprintf("%02d", $i);
            $count = isset($arr[$hour]) ? (int) $arr[$hour] : 0;
            
            // 높이 계산
            $height_rate = ($max > 0) ? round(($count / $max) * 100) : 0;
            if($count > 0 && $height_rate < 5) $height_rate = 5;
            
            $highlight = ($count > 0 && $count == $max) ? 'highlight' : '';
        ?>
        <div class="vst-chart-item">
            <div class="vst-bar-value" style="animation-delay: <?php echo $i*0.05 ?>s">
                <?php echo ($count > 0) ? number_format($count) : ''; ?>
            </div>
            <div class="vst-bar-stick <?php echo $highlight ?>" style="height: <?php echo $height_rate ?>%;"></div>
            <div class="vst-bar-label"><?php echo $i ?>시</div>
        </div>
        <?php } ?>
    </div>

    <div class="vst-list-wrap">
        <div class="vst-list-header">
            <div class="col-time">시간</div>
            <div class="col-graph">접속 비율</div>
            <div class="col-count">접속자 수</div>
            <div class="col-rate">비율(%)</div>
        </div>

        <?php
        $has_data = false;
        for ($i=0; $i<24; $i++) {
            $hour = sprintf("%02d", $i);
            $count = isset($arr[$hour]) ? (int) $arr[$hour] : 0;
            
            $rate = ($sum_count > 0) ? ($count / $sum_count * 100) : 0;
            $s_rate = number_format($rate, 1);
            
            if($count > 0) $has_data = true;
            
            // 강조 시간대 (근무시간 등) 색상 다르게 줄 수도 있음 (현재는 통일)
        ?>
        <div class="vst-list-row">
            <div class="col-time">
                <span class="vst-time-badge"><?php echo $hour ?>시</span>
            </div>
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
            <div class="col-time">전체 합계</div>
            <div class="col-graph"></div>
            <div class="col-count"><?php echo number_format($sum_count) ?>명</div>
            <div class="col-rate">100%</div>
        </div>
    </div>
</div>

<?php
include_once('./admin.tail.php');
?>