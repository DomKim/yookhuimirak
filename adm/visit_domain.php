<?php
$sub_menu = "200800";
include_once('./_common.php');

auth_check_menu($auth, $sub_menu, 'r');

$fr_date = isset($_REQUEST['fr_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['fr_date']) : G5_TIME_YMD;
$to_date = isset($_REQUEST['to_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['to_date']) : G5_TIME_YMD;

$g5['title'] = '도메인별 접속자집계';
include_once('./visit.sub.php');

// [데이터 가공 로직 - 기존 유지]
$max = 0;
$sum_count = 0;
$arr = array();

$sql = " select * from {$g5['visit_table']}
            where vi_date between '{$fr_date}' and '{$to_date}' ";
$result = sql_query($sql);
while ($row=sql_fetch_array($result)) {
    $str = $row['vi_referer'];
    preg_match("/^http[s]*:\/\/([\.\-\_0-9a-zA-Z]*)\//", $str, $match);
    $s = isset($match[1]) ? $match[1] : 0;
    $s = preg_replace("/^(www\.|search\.|dirsearch\.|dir\.search\.|dir\.|kr\.search\.|myhome\.)(.*)/", "\\2", $s);

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
    .col-domain {
        flex: 1;
        padding-left: 10px;
        font-weight: 600;
        color: #333;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .col-domain a { text-decoration: none; color: #333; transition: 0.2s; }
    .col-domain a:hover { color: #3235cd; text-decoration: underline; }
</style>

<div class="vst-layout-container">
    
    <div class="vst-list-header">
        <div class="col-rank">순위</div>
        <div class="col-domain">접속 도메인</div>
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

    // 링크용 날짜 쿼리 문자열 미리 생성
    $link_qstr = 'fr_date='.$fr_date.'&amp;to_date='.$to_date;

    if (count($arr)) {
        arsort($arr);
        foreach ($arr as $key=>$value) {
            $has_data = true;
            $count = $arr[$key];
            
            // 순위 계산 로직
            if ($save_count != $count) {
                $i++;
                $no = $i;
                $save_count = $count;
            } else {
                $no = '';
            }

            // 도메인 표시 및 링크 처리
            if (!$key) {
                $key_display = '<span style="color:#22b8cf; font-weight:700;">직접 접속 (주소창 입력 또는 즐겨찾기)</span>';
                $link_start = '';
                $link_end = '';
            } else {
                $key_display = $key;
                // visit_list.php로 이동하는 링크
                $link_start = '<a href="./visit_list.php?'.$link_qstr.'&amp;domain='.$key.'">';
                $link_end = '</a>';
            }

            $rate = ($sum_count > 0) ? ($count / $sum_count * 100) : 0;
            $s_rate = number_format($rate, 1);
            
            // 1~3위 클래스 처리
            $rank_class = '';
            if($no == 1) $rank_class = 'rank-1';
            else if($no == 2) $rank_class = 'rank-2';
            else if($no == 3) $rank_class = 'rank-3';
    ?>
    <div class="vst-list-row">
        <div class="col-rank">
            <?php if($no) { ?>
                <span class="rank-badge <?php echo $rank_class ?>"><?php echo $no ?></span>
            <?php } ?>
        </div>
        
        <div class="col-domain">
            <?php echo $link_start ?><?php echo $key_display ?><?php echo $link_end ?>
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
        <span style="display:block; font-size:40px; margin-bottom:10px;">📊</span>
        데이터가 없습니다.
    </div>
    <?php } ?>

    <div class="vst-list-footer">
        <div class="col-rank"></div>
        <div class="col-domain">전체 합계</div>
        <div class="col-graph"></div>
        <div class="col-count"><?php echo number_format($sum_count) ?></div>
        <div class="col-rate">100%</div>
    </div>

</div>

<?php
include_once('./admin.tail.php');
?>