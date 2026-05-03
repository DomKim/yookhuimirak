<?php
$sub_menu = "200800";
include_once('./_common.php');

auth_check_menu($auth, $sub_menu, 'r');

$fr_date = isset($_REQUEST['fr_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['fr_date']) : G5_TIME_YMD;
$to_date = isset($_REQUEST['to_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['to_date']) : G5_TIME_YMD;

$g5['title'] = '연도별 접속자집계';
include_once('./visit.sub.php');

// [데이터 가공 로직]
$max = 0;
$sum_count = 0;
$arr = array();

$sql = " select SUBSTRING(vs_date,1,4) as vs_year, SUM(vs_count) as cnt
            from {$g5['visit_sum_table']}
            where vs_date between '{$fr_date}' and '{$to_date}'
            group by vs_year
            order by vs_year desc ";
$result = sql_query($sql);
for ($i=0; $row=sql_fetch_array($result); $i++) {
    $arr[$row['vs_year']] = $row['cnt'];
    if ($row['cnt'] > $max) $max = $row['cnt'];
    $sum_count += $row['cnt'];
}
?>

<style>
    .col-year { width: 120px; font-weight: 700; color: #555; }
    .col-year a { text-decoration: none; color: #333; transition: 0.2s; }
    .col-year a:hover { color: #3235cd; text-decoration: underline; }
    .year-badge {
        display: inline-block;
        padding: 6px 14px;
        background: #f8f9fa;
        border-radius: 8px;
        color: #555;
        font-size: 14px;
        border: 1px solid #eee;
    }
    .vst-list-row:hover .year-badge {
        border-color: #3235cd;
        color: #3235cd;
        background: #fff;
    }
    @media (max-width: 768px) {
        .col-year { width: auto; flex: 1; }
    }
</style>

<div class="vst-layout-container">
    
    <div class="vst-chart-wrap">
        <?php
        // 차트는 과거 -> 미래(왼쪽 -> 오른쪽) 순서가 자연스러우므로 배열을 뒤집습니다.
        $chart_arr = array_reverse($arr, true); 
        
        foreach ($chart_arr as $year => $count) {
            // 높이 계산
            $height_rate = ($max > 0) ? round(($count / $max) * 100) : 0;
            if($count > 0 && $height_rate < 5) $height_rate = 5;
            
            $highlight = ($count > 0 && $count == $max) ? 'highlight' : '';
            
            // 링크 URL (해당 연도의 월별 통계로 이동)
            $link_url = "./visit_month.php?fr_date={$year}-01-01&to_date={$year}-12-31";
        ?>
        <div class="vst-chart-item" onclick="location.href='<?php echo $link_url ?>'">
            <div class="vst-bar-value" style="animation-delay: 0.1s">
                <?php echo ($count > 0) ? number_format($count) : ''; ?>
            </div>
            <div class="vst-bar-stick <?php echo $highlight ?>" style="height: <?php echo $height_rate ?>%;"></div>
            <div class="vst-bar-label"><?php echo $year ?>년</div>
        </div>
        <?php } ?>
    </div>

    <div class="vst-list-wrap">
        <div class="vst-list-header">
            <div class="col-year">연도</div>
            <div class="col-graph">비율 그래프</div>
            <div class="col-count">접속자 수</div>
            <div class="col-rate">비율(%)</div>
        </div>

        <?php
        $has_data = false;
        // $arr는 원래대로 최신순(DESC)
        foreach ($arr as $key => $value) {
            $has_data = true;
            $count = $value;
            $rate = ($sum_count > 0) ? ($count / $sum_count * 100) : 0;
            $s_rate = number_format($rate, 1);
            
            $link_url = "./visit_month.php?fr_date={$key}-01-01&to_date={$key}-12-31";
        ?>
        <div class="vst-list-row">
            <div class="col-year">
                <a href="<?php echo $link_url ?>">
                    <span class="year-badge"><?php echo $key ?>년</span>
                </a>
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
        <div style="text-align:center; padding:80px 0; color:#999;">
            <span style="display:block; font-size:40px; margin-bottom:10px;">📉</span>
            데이터가 없습니다.
        </div>
        <?php } ?>

        <div class="vst-list-footer">
            <div class="col-year">전체 합계</div>
            <div class="col-graph"></div>
            <div class="col-count"><?php echo number_format($sum_count) ?>명</div>
            <div class="col-rate">100%</div>
        </div>
    </div>

</div>

<?php
include_once('./admin.tail.php');
?>