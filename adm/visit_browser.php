<?php
$sub_menu = "200800";
include_once('./_common.php');

auth_check_menu($auth, $sub_menu, 'r');

$fr_date = isset($_REQUEST['fr_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['fr_date']) : G5_TIME_YMD;
$to_date = isset($_REQUEST['to_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['to_date']) : G5_TIME_YMD;

$g5['title'] = '브라우저별 접속자집계';
include_once('./visit.sub.php');

// [데이터 가공 로직 - 기존 유지]
$max = 0;
$sum_count = 0;
$arr = array();

$sql = " select * from {$g5['visit_table']}
            where vi_date between '{$fr_date}' and '{$to_date}' ";
$result = sql_query($sql);
while ($row=sql_fetch_array($result)) {
    $s = $row['vi_browser'];
    if(!$s) $s = get_brow($row['vi_agent']);
    if(!$s) $s = '기타'; // 빈 값 처리

    if( isset($arr[$s]) ){
        $arr[$s]++;
    } else {
        $arr[$s] = 1;
    }

    if ($arr[$s] > $max) $max = $arr[$s];
    $sum_count++;
}
?>

<style>
    .col-browser {
        flex: 1;
        padding-left: 10px;
        font-weight: 600;
        color: #333;
        display: flex; align-items: center;
    }
    .browser-badge {
        padding: 4px 10px;
        border-radius: 6px;
        background: #f8f9fa;
        color: #555;
        font-size: 13px;
    }
    .browser-chrome { color: #d93025; background: #fce8e6; }
    .browser-safari { color: #1967d2; background: #e8f0fe; }
</style>

<div class="vst-layout-container">
    
    <div class="vst-list-header">
        <div class="col-rank">순위</div>
        <div class="col-browser">브라우저</div>
        <div class="col-graph">비율 그래프</div>
        <div class="col-count">접속자 수</div>
        <div class="col-rate">비율(%)</div>
    </div>

    <?php
    $i = 0;
    $k = 0;
    $save_count = -1;
    $tot_count = 0;
    $has_data = false;

    if (count($arr)) {
        arsort($arr);
        foreach ($arr as $key=>$value) {
            $has_data = true;
            $count = $arr[$key];
            
            // 순위 계산
            if ($save_count != $count) {
                $i++;
                $no = $i;
                $save_count = $count;
            } else {
                $no = '';
            }

            $rate = ($sum_count > 0) ? ($count / $sum_count * 100) : 0;
            $s_rate = number_format($rate, 1);
            
            // 순위별 클래스
            $rank_class = '';
            if($no == 1) $rank_class = 'rank-1';
            else if($no == 2) $rank_class = 'rank-2';
            else if($no == 3) $rank_class = 'rank-3';

            // 브라우저별 아이콘/색상 처리 (단순 텍스트 매칭)
            $browser_class = '';
            if(stripos($key, 'Chrome') !== false) $browser_class = 'browser-chrome';
            if(stripos($key, 'Safari') !== false) $browser_class = 'browser-safari';
    ?>
    <div class="vst-list-row">
        <div class="col-rank">
            <?php if($no) { ?>
                <span class="rank-badge <?php echo $rank_class ?>"><?php echo $no ?></span>
            <?php } ?>
        </div>
        
        <div class="col-browser">
            <span class="browser-badge <?php echo $browser_class ?>"><?php echo $key ?></span>
        </div>
        
        <div class="col-graph">
            <div class="vst-progress-bg">
                <div class="vst-progress-fill" style="width: <?php echo $s_rate ?>%;"></div>
            </div>
        </div>

        <div class="col-count">
            <?php echo number_format($count) ?>
        </div>
        
        <div class="col-rate">
            <?php echo $s_rate ?>%
        </div>
    </div>
    <?php 
        } // end foreach
    } // end if
    ?>

    <?php if(!$has_data) { ?>
    <div style="text-align:center; padding:80px 0; color:#999;">
        <span style="display:block; font-size:40px; margin-bottom:10px;">🌐</span>
        데이터가 없습니다.
    </div>
    <?php } ?>

    <div class="vst-list-footer">
        <div class="col-rank"></div>
        <div class="col-browser">전체 합계</div>
        <div class="col-graph"></div>
        <div class="col-count"><?php echo number_format($sum_count) ?></div>
        <div class="col-rate">100%</div>
    </div>

</div>

<?php
include_once('./admin.tail.php');
?>