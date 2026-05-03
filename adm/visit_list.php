<?php
$sub_menu = "200800";
include_once('./_common.php');

auth_check_menu($auth, $sub_menu, 'r');

$fr_date = isset($_REQUEST['fr_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['fr_date']) : G5_TIME_YMD;
$to_date = isset($_REQUEST['to_date']) ? preg_replace('/[^0-9 :\-]/i', '', $_REQUEST['to_date']) : G5_TIME_YMD;

$g5['title'] = '접속자집계';
include_once('./visit.sub.php');

// [데이터 조회 로직]
$sql_common = " from {$g5['visit_table']} ";
$sql_search = " where vi_date between '{$fr_date}' and '{$to_date}' ";
if (isset($domain))
    $sql_search .= " and vi_referer like '%{$domain}%' ";

$sql = " select count(*) as cnt {$sql_common} {$sql_search} ";
$row = sql_fetch($sql);
$total_count = $row['cnt'];

$rows = $config['cf_page_rows'];
$total_page  = ceil($total_count / $rows);
if ($page < 1) $page = 1;
$from_record = ($page - 1) * $rows;

$sql = " select *
            {$sql_common}
            {$sql_search}
            order by vi_id desc
            limit {$from_record}, {$rows} ";
$result = sql_query($sql);
?>

<style>
    .col-ip { width: 140px; font-weight: 700; color: #3235cd; flex-shrink: 0; }

    .col-referer {
        flex: 1;
        padding: 0 20px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .col-referer a { text-decoration: none; color: #555; transition: 0.2s; }
    .col-referer a:hover { color: #3235cd; text-decoration: underline; }

    .col-env { width: 100px; text-align: center; color: #888; font-size: 13px; flex-shrink: 0; }
    .col-device { width: 80px; text-align: center; font-weight: 600; color: #444; flex-shrink: 0; }
    .col-date { width: 140px; text-align: right; color: #999; font-size: 13px; flex-shrink: 0; }

    /* 반응형 */
    @media (max-width: 900px) {
        .col-ip { width: 100%; font-size: 15px; display: flex; justify-content: space-between; align-items: center; }
        .col-ip::after { content: attr(data-date); font-size: 13px; color: #aaa; font-weight: 400; }
        .col-referer { width: 100%; padding: 0; white-space: normal; word-break: break-all; background: #f9f9f9; padding: 10px; border-radius: 8px; font-size: 13px; }
        .col-meta-group { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; }
        .col-env, .col-device, .col-date { width: auto; text-align: left; padding: 0; }
        .col-date { display: none; }
    }
</style>

<div class="vst-layout-container">
    <div class="vst-list-header">
        <div class="col-ip">IP</div>
        <div class="col-referer">접속 경로</div>
        <div class="col-env">브라우저</div>
        <div class="col-env">OS</div>
        <div class="col-device">기기</div>
        <div class="col-date">일시</div>
    </div>

    <?php
    $has_data = false;
    for ($i=0; $row=sql_fetch_array($result); $i++) {
        $has_data = true;

        // ★★★ 빈 값 처리 로직 추가 ★★★
        $brow = $row['vi_browser'];
        if(!$brow) $brow = get_brow($row['vi_agent']);
        if(!$brow || $brow == '') $brow = '-'; // 빈 값이면 하이픈

        $os = $row['vi_os'];
        if(!$os) $os = get_os($row['vi_agent']);
        if(!$os || $os == '') $os = '-';

        $device = $row['vi_device'];
        if(!$device || $device == '') $device = '-';

        $link_html = '';
        if ($row['vi_referer']) {
            $referer = get_text(cut_str($row['vi_referer'], 255, ''));
            $referer = urldecode($referer);
            if (!is_utf8($referer)) $referer = iconv_utf8($referer);
            $full_url = get_text($row['vi_referer']);
            $display_url = $referer;
            $link_html = '<a href="'.$full_url.'" target="_blank" title="'.$full_url.'">'.$display_url.'</a>';
        } else {
            $link_html = '<span style="color:#ccc;">직접 접속</span>';
        }

        if ($is_admin == 'super') $ip = $row['vi_ip'];
        else $ip = preg_replace("/([0-9]+).([0-9]+).([0-9]+).([0-9]+)/", G5_IP_DISPLAY, $row['vi_ip']);
    ?>
    <div class="vst-list-row">
        <div class="col-ip" data-date="<?php echo $row['vi_date'] ?> <?php echo $row['vi_time'] ?>">
            <?php echo $ip ?>
        </div>
        
        <div class="col-referer">
            <?php echo $link_html ?>
        </div>

        <div class="col-meta-group" style="display:contents;">
            <div class="col-env">
                <span class="vst-badge"><?php echo $brow ?></span>
            </div>
            <div class="col-env">
                <span class="vst-badge"><?php echo $os ?></span>
            </div>
            <div class="col-device">
                <span class="vst-badge" style="background:#e7f5ff; color:#1971c2;"><?php echo $device ?></span>
            </div>
        </div>

        <div class="col-date">
            <?php echo $row['vi_date'] ?><br>
            <span style="font-size:11px; color:#aaa;"><?php echo $row['vi_time'] ?></span>
        </div>
    </div>
    <?php } ?>

    <?php if(!$has_data) { ?>
    <div style="text-align:center; padding:80px 0; color:#999;">
        <span style="display:block; font-size:40px; margin-bottom:10px;">📂</span>
        자료가 없거나 관리자에 의해 삭제되었습니다.
    </div>
    <?php } ?>
</div>

<?php
$qstr = 'fr_date='.$fr_date.'&amp;to_date='.$to_date;
if (isset($domain)) $qstr .= "&amp;domain=$domain";
$qstr .= "&amp;page=";
$pagelist = get_paging($config['cf_write_pages'], $page, $total_page, "{$_SERVER['SCRIPT_NAME']}?$qstr");
?>
<div class="vst-paging-wrap">
    <?php echo $pagelist; ?>
</div>

<?php
include_once('./admin.tail.php');
?>