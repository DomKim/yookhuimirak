<?php
$sub_menu = "200800";
include_once('./_common.php');

auth_check_menu($auth, $sub_menu, 'r');

$fr_date = isset($_REQUEST['fr_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['fr_date']) : G5_TIME_YMD;
$to_date = isset($_REQUEST['to_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['to_date']) : G5_TIME_YMD;

$g5['title'] = '기기별 접속자집계';
include_once('./visit.sub.php');

// [데이터 가공 로직]
$max = 0;
$sum_count = 0;
$arr = array();

$sql = " select * from {$g5['visit_table']}
         where vi_date between '$fr_date' and '$to_date' ";
$result = sql_query($sql);
while ($row=sql_fetch_array($result)) {
    $s = $row['vi_device'];
    if(!$s) $s = '기타';

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
    .col-device {
        flex: 1;
        padding-left: 10px;
        font-weight: 600;
        color: #333;
        display: flex; align-items: center;
    }
    .device-badge {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        background: #f8f9fa;
        color: #555;
        border: 1px solid #eee;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .device-pc { background: #e7f5ff; color: #1971c2; border-color: #d0ebff; }
    .device-mobile { background: #ebfbee; color: #2b8a3e; border-color: #d3f9d8; }
    .device-tablet { background: #fff9db; color: #e67700; border-color: #ffec99; }
</style>

<div class="vst-layout-container">
    
    <div class="vst-list-header">
        <div class="col-rank">순위</div>
        <div class="col-device">접속기기</div>
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

            // '기타' 처리
            if (!$key) $key = '기타';

            $rate = ($sum_count > 0) ? ($count / $sum_count * 100) : 0;
            $s_rate = number_format($rate, 1);
            
            // 1~3위 강조 클래스
            $rank_class = '';
            if($no == 1) $rank_class = 'rank-1';
            else if($no == 2) $rank_class = 'rank-2';
            else if($no == 3) $rank_class = 'rank-3';

            // 기기별 아이콘 및 스타일 클래스
            $device_class = '';
            $device_icon = '';
            
            $key_lower = strtolower($key);
            if($key_lower == 'pc') {
                $device_class = 'device-pc';
                $device_icon = '🖥️';
            } else if($key_lower == 'mobile' || strpos($key_lower, 'android') !== false || strpos($key_lower, 'iphone') !== false) {
                $device_class = 'device-mobile';
                $device_icon = '📱';
            } else if(strpos($key_lower, 'tablet') !== false || strpos($key_lower, 'ipad') !== false) {
                $device_class = 'device-tablet';
                $device_icon = '📟';
            } else {
                $device_icon = '🔌';
            }
    ?>
    <div class="vst-list-row">
        <div class="col-rank">
            <?php if($no) { ?>
                <span class="rank-badge <?php echo $rank_class ?>"><?php echo $no ?></span>
            <?php } ?>
        </div>
        
        <div class="col-device">
            <span class="device-badge <?php echo $device_class ?>">
                <?php echo $device_icon ?> <?php echo $key ?>
            </span>
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
        <span style="display:block; font-size:40px; margin-bottom:10px;">🔌</span>
        데이터가 없습니다.
    </div>
    <?php } ?>

    <div class="vst-list-footer">
        <div class="col-rank"></div>
        <div class="col-device">전체 합계</div>
        <div class="col-graph"></div>
        <div class="col-count"><?php echo number_format($sum_count) ?></div>
        <div class="col-rate">100%</div>
    </div>

</div>

<?php
include_once('./admin.tail.php');
?>