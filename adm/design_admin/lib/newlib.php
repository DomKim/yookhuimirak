<?php

// 기간별 통계
function get_visit_info($fr_date, $to_date='') {
    global $g5;

    // 하루 일자 지정
    if (!$fr_date) $fr_date = date('Y-m-d');
    if (!$to_date) $to_date = $fr_date;

    $sql = " select *, SUBSTRING(vi_time,1,2) as hour from {$g5['visit_table']} where vi_date between '{$fr_date}' and '{$to_date}'order by vi_id desc ";
    $result = sql_query($sql);
    for ($i=0; $row=sql_fetch_array($result); $i++) {
        $brow = $row['vi_browser'];
        if(!$brow) $brow = eb_get_brow($row['vi_agent']);

        $os = $row['vi_os'];
        if(!$os) $os = eb_get_os($row['vi_agent']);

        $device = $row['vi_device'];
        $hour = $row['hour'] * 1;

        $vi_cnt[$hour][$i]  = $row;
        $vi_br[$brow] ++;
        $vi_os[$os] ++;
        $vi_dev[$device] ++;

        $str = $row['vi_referer'];
        preg_match("/^http[s]*:\/\/([\.\-\_0-9a-zA-Z]*)\//", $str, $match);
        $domain = $match[1];
        $domain = preg_replace("/^(www\.|search\.|dirsearch\.|dir\.search\.|dir\.|kr\.search\.|myhome\.)(.*)/", "\\2", $domain);
        $vi_domain[$domain] ++;
        unset($domain, $str, $match);
    }

    /**
     * 그래프에 뿌려줄 내용에 순위적용 - 노출 갯수 제한
     */
    @arsort($vi_br);
    @arsort($vi_os);
    @arsort($vi_dev);
    @array_splice($vi_br, 6);
    @array_splice($vi_os, 6);
    @array_splice($vi_dev, 6);

    $sql = " select mb_id, SUBSTRING(mb_datetime,12,2) as hour from {$g5['member_table']} where mb_datetime between '{$fr_date} 00:00:00' and '{$to_date} 23:59:59'order by mb_datetime desc ";
    $result = sql_query($sql);
    for ($i=0; $row=sql_fetch_array($result); $i++) {
        $hour = $row['hour'] * 1;
        $vi_regist[$hour][$row['mb_id']] = $row['mb_id'];
    }

    $output['vi_cnt']       = $vi_cnt;
    $output['vi_br']        = $vi_br;
    $output['vi_os']        = $vi_os;
    $output['vi_dev']       = $vi_dev;
    $output['vi_regist']    = $vi_regist;
    $output['vi_domain']    = $vi_domain;

    return $output;
}

// pg_anchor
function adm_pg_anchor($anc_id) {
    global $pg_anchor, $wmode;

    if (!$pg_anchor || !is_array($pg_anchor) || $wmode) return false;

    $li = '';
    $active = '';
    foreach ($pg_anchor as $id => $title) {
        if ($id == $anc_id) $active = "class=\"active\"";
        $li .= "<li ".$active."><a href=\"#".$id."\">".$title."</a></li>\n";
        unset($active);
    }
    return "
    <div class=\"pg-anchor-in tab-e2\">\n
        <ul class=\"nav nav-tabs\">\n
            ".$li."
        </ul>\n
        <div class=\"tab-bottom-line\"></div>\n
    </div>\n
    ";
}

function mb_photo_url($mb_id) {
    $photo_url = '';
    $dest_path = G5_DATA_PATH.'/member/profile/';
    $dest_url = G5_DATA_URL.'/member/profile/';
    $permit = array('jpg', 'jpeg', 'gif', 'png');

    foreach($permit as $val) {
        $photo_name = $mb_id.'.'.$val;
        $photo_file = $dest_path.$photo_name;

        // 사진이 있다면 변수 넘김
        if(file_exists($photo_file) && !is_dir($photo_file)) {
            $photo_url = $dest_url.$photo_name;
            break;
        }
    }

    if ($photo_url) {
        return $photo_url;
    } else return false;
}
